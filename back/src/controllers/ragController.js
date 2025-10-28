// back/src/controllers/ragController.js
const { openai, MODELS } = require('../../config/openai');
const {
  ensureTables,
  fetchAllEmbeddings,
  cosineSimilarity,
} = require('../dao/ragDao');

/** 질문에서 SITE 키워드 자동 추론 (PT/HS/IC/CJ/PSKH) */
function inferSiteFromQuestion(q = '') {
  const U = String(q).toUpperCase();
  const tests = [
    { key: 'PT',   pats: [/\bPT\b/, ' PT ', 'PT ', ' PT', 'PT사이트'] },
    { key: 'HS',   pats: [/\bHS\b/, ' HS ', 'HS ', ' HS', 'HS사이트'] },
    { key: 'IC',   pats: [/\bIC\b/, ' IC ', 'IC ', ' IC', 'IC사이트'] },
    { key: 'CJ',   pats: [/\bCJ\b/, ' CJ ', 'CJ ', ' CJ', 'CJ사이트'] },
    { key: 'PSKH', pats: [/\bPSKH\b/, ' PSKH ', 'PSKH ', ' PSKH', 'PSKH사이트'] },
  ];
  for (const t of tests) {
    for (const p of t.pats) {
      if (p instanceof RegExp ? p.test(U) : U.includes(p)) return t.key;
    }
  }
  return null;
}

/** 컨텍스트 묶어서 메시지 프롬프트 생성 */
// 교체: buildPrompt(question, contexts)
function buildPrompt(question, contexts) {
  const ctx = (contexts || [])
    .map((text, i) => `【근거 ${i + 1}】\n${text}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        '너는 현장 작업 로그 요약/검색 보조자야.',
        '반드시 주어진 근거 안에서만 답하고, 모르면 모른다고 말해.',
        '한국어로 간결하게, 불릿과 짧은 문장으로 정리해.',
        '출력 형식을 엄격히 지켜.'
      ].join(' ')
    },
    {
      role: 'user',
      content: [
        `질문:\n${question}`,
        '------',
        '근거 모음:',
        ctx || '(근거 없음)',
        '------',
        '출력 형식(그대로 따르기):',
        '### 핵심 요약',
        '- (3~5줄 내) 이번 질문에 대한 한눈 요약',
        '',
        '### 주요 원인/증상',
        '- (근거에서 확인된 사실만, 추측 금지)',
        '',
        '### 조치/권고',
        '- (근거에서 실제로 수행/권장된 액션만)',
        '',
        '제약:',
        '- 근거에 없는 내용은 쓰지 말 것',
        '- 수치/날짜/코드는 근거에서 확인된 것만',
        '- "**※ 근거: n건**" 문구는 **너가 쓰지 않는다** (서버에서 자동 추가)',
      ].join('\n'),
    },
  ];
}


/** 텍스트 정리 */
function normalizeContent(s = '') {
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function ask(req, res) {
  try {
    const {
      question,
      topK: _topK = 20,
      prefilterLimit: _prefilter = 300,
      days: _days = 365,
      filters = {},
    } = req.body || {};

    if (!question || !String(question).trim()) {
      return res.status(400).json({ ok: false, error: 'question is required' });
    }

    // 숫자 파라미터 정규화
    const topK = Math.max(1, Math.min(50, Number(_topK) || 20));
    const prefilterLimit = Math.max(10, Math.min(5000, Number(_prefilter) || 300));
    const days = Math.max(1, Math.min(3650, Number(_days) || 365)); // 최대 10년

    await ensureTables();

    // SITE 자동 추론 (프론트가 filters.site 안 보낼 때 보정)
    const inferredSite = (!filters.site) ? inferSiteFromQuestion(question) : null;
    const effectiveFilters = {
      ...filters,
      ...(inferredSite ? { site: inferredSite } : {}),
      days,
    };

    // 1) 1차 조회
    let candidates = await fetchAllEmbeddings({
      filters: effectiveFilters,
      limit: prefilterLimit,
    });

    // 2) 0건이면 날짜 필터 제거 재시도
    if (!candidates.length) {
      const { days: _ignored, ...noDays } = effectiveFilters;
      candidates = await fetchAllEmbeddings({
        filters: noDays,
        limit: Math.max(prefilterLimit, 1000),
      });
    }

    // 3) 그래도 0건이면 완전 완화(필터 전부 제거) 재시도
    if (!candidates.length) {
      candidates = await fetchAllEmbeddings({
        filters: {},
        limit: Math.max(prefilterLimit, 2000),
      });

      if (!candidates.length) {
        console.warn('[RAG] no candidates after fetchAllEmbeddings. filters=%j, prefilter=%d', effectiveFilters, prefilterLimit);
        return res.json({
          ok: true,
          used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
          answer: '근거가 없습니다.',
          evidence_preview: [],
        });
      }
    }

    // 4) 쿼리 임베딩
    const emb = await openai.embeddings.create({
      model: MODELS.embedding,
      input: [String(question)],
    });
    const qVec = emb.data?.[0]?.embedding || [];

    // 5) 유사도 계산 및 정렬
    const ranked = candidates
      .map(c => ({ ...c, score: cosineSimilarity(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const rankedNonEmpty = ranked.filter(r => (r.content && String(r.content).trim().length > 0));

    // 모델 컨텍스트 최대 8개
    const contextsForLLM = rankedNonEmpty.slice(0, 8).map(r => normalizeContent(r.content));
    const ctxUsedCount = contextsForLLM.length;

    // 프리뷰
    const evidence_preview = ranked.map(r => ({
      id: r.chunk_id,
      date: r.task_date ? String(r.task_date).slice(0, 10) : '',
      site: r.site || '',
      line: r.line || '',
      eq: [r.equipment_type, r.equipment_name].filter(Boolean).join(' / '),
      sim: r.score || 0,
      name: r.work_type ? `${r.work_type}${r.work_type2 ? ' / ' + r.work_type2 : ''}` : '',
      desc: normalizeContent(r.content || '').slice(0, 180),
    }));

    if (ctxUsedCount === 0) {
      return res.json({
        ok: true,
        used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
        answer: '죄송하지만, 제공된 근거 텍스트가 없어 요약을 생성할 수 없습니다.\n\n※ 근거: 0건',
        evidence_preview,
      });
    }

    // 7) 모델 호출
    const messages = buildPrompt(question, contextsForLLM);
    const chatRes = await openai.chat.completions.create({
      model: MODELS.chat,
      messages,
      temperature: 0.2,
    });

    const rawAnswer = chatRes.choices?.[0]?.message?.content?.trim();
    const answer = rawAnswer
      ? `${rawAnswer}\n\n※ 근거: ${ctxUsedCount}건`
      : `응답을 생성하지 못했습니다.\n\n※ 근거: ${ctxUsedCount}건`;

    return res.json({
      ok: true,
      used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
      answer,
      evidence_preview,
    });

  } catch (err) {
    console.error('[RAG] ask error:', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

module.exports = { ask };
