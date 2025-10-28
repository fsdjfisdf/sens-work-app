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

/** 컨텍스트 묶어서 메시지 프롬프트 생성 (contexts는 string[] 가정) */
function buildPrompt(question, contexts) {
  const ctx = (contexts || [])
    .map((text, i) => `【근거 ${i + 1}】\n${text}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content:
        '너는 현장 작업 로그 요약/검색 보조자야. 주어진 근거 안에서만 답하고, 모르면 모른다고 말해. 한국어로 간결하게. 항목은 불릿으로 정리해.',
    },
    {
      role: 'user',
      content: [
        `질문:\n${question}`,
        '------',
        '근거 모음:',
        ctx || '(근거 없음)',
        '------',
        '지침:',
        '- 근거에 없는 내용은 추측하지 말 것',
        '- 수치/조건은 근거에서 확인된 것만 언급',
        '- 마지막 줄에 "※ 근거: n건" 표기',
      ].join('\n'),
    },
  ];
}

/** 텍스트 정리 (너무 긴 공백/HTML br 정리) */
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

    // 🔎 질문에서 SITE 자동 추론 (프론트가 filters.site 안 보낼 때 보정)
    const inferredSite = (!filters.site) ? inferSiteFromQuestion(question) : null;
    const effectiveFilters = {
      ...filters,
      ...(inferredSite ? { site: inferredSite } : {}),
      days, // 날짜 필터 전달 (DAO에서 NULL 허용 처리함)
    };

    // 1) 후보 로딩
    let candidates = await fetchAllEmbeddings({
      filters: effectiveFilters,
      limit: prefilterLimit,
    });

    // ⚖️ 후보 0이면 날짜 필터 제거해 재시도 (초기 NULL task_date 데이터 구제)
    if (!candidates.length) {
      const { days: _ignored, ...noDaysFilters } = effectiveFilters;
      candidates = await fetchAllEmbeddings({
        filters: noDaysFilters,
        limit: Math.max(prefilterLimit, 1000), // 한번 더 넉넉히
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

    // 2) 쿼리 임베딩
    const emb = await openai.embeddings.create({
      model: MODELS.embedding,
      input: [String(question)],
    });
    const qVec = emb.data?.[0]?.embedding || [];

    // 3) 유사도 계산 및 정렬
    const ranked = candidates
      .map(c => ({
        ...c,
        score: cosineSimilarity(qVec, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // 4) 빈 컨텐츠 제외(LLM 컨텍스트/요약 모두)
    const rankedNonEmpty = ranked.filter(r => (r.content && String(r.content).trim().length > 0));

    // 모델에 들어갈 컨텍스트는 최대 8개 (토큰 안전장치)
    const contextsForLLM = rankedNonEmpty.slice(0, 8).map(r => normalizeContent(r.content));
    const ctxUsedCount = contextsForLLM.length;

    // 5) 프리뷰(프론트 테이블용) 구성
    const evidence_preview = ranked.map(r => ({
      id: r.chunk_id,
      date: r.task_date ? String(r.task_date).slice(0, 10) : '',
      site: r.site || '',
      line: r.line || '',
      eq: [r.equipment_type, r.equipment_name].filter(Boolean).join(' / '),
      sim: r.score || 0,
      name: r.work_type
        ? `${r.work_type}${r.work_type2 ? ' / ' + r.work_type2 : ''}`
        : '',
      desc: normalizeContent(r.content || '').slice(0, 180),
    }));

    // 6) 컨텍스트가 하나도 없으면 모델 호출하지 않고 안내
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

    // 8) 응답
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
