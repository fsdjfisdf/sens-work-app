// back/src/controllers/ragController.js
const { openai, MODELS } = require('../../config/openai');
const {
  ensureTables,
  fetchAllEmbeddings,
  cosineSimilarity,
} = require('../dao/ragDao');

/** SITE 자동 추론 (PT/HS/IC/CJ/PSKH) */
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

/** 질문에서 한글 이름 간단 추출 (2~4글자 토큰 1개) */
function extractKoreanName(q = '') {
  const s = String(q).replace(/\(.*?\)/g, '');
  const m = s.match(/[\uAC00-\uD7A3]{2,4}/g);
  if (!m) return null;
  return m.sort((a, b) => b.length - a.length)[0];
}

/** 질문에서 장비타입 추출 */
function extractEquipmentType(q='') {
  const U = String(q).toUpperCase();
  const KEYS = ['SUPRA N','SUPRA XP','INTEGER','PRECIA','ECOLITE','GENEVA','HDW'];
  for (const k of KEYS) {
    if (U.includes(k)) return k; // 그대로 equipment_type 값으로 사용
  }
  return null;
}

/** LLM 컨텍스트 프롬프트 생성 — 자연스러운 대답 지향 */
function buildPrompt(question, contexts) {
  const ctx = (contexts || [])
    .map((text, i) => `【근거 ${i + 1}】\n${text}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        '너는 현장 작업 로그를 바탕으로 사실만으로 답하는 분석 조수야.',
        '근거 텍스트를 꼼꼼히 읽고, 사용자 질문에 자연스럽게 한국어로 답해.',
        '추측이나 창작 금지. 날짜/수치/장비/작업자 등은 근거에서 확인된 것만 사용.',
        '불확실하면 모른다고 말하고, 추가로 확인할 만한 구체적 제안을 해.',
        '문단과 불릿을 적절히 섞되, 딱딱한 템플릿 헤더는 쓰지 마.',
      ].join(' ')
    },
    {
      role: 'user',
      content: [
        `질문:\n${question}`,
        '------',
        '근거 텍스트:',
        ctx || '(없음)',
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
    const topK = Math.max(5, Math.min(50, Number(_topK) || 20));
    const days = Math.max(1, Math.min(3650, Number(_days) || 365)); // 최대 10년

    await ensureTables();

    // 자동 필터 보정
    const inferredSite = (!filters.site) ? inferSiteFromQuestion(question) : null;
    const nameFromQ = extractKoreanName(question);
    const equipFromQ = (!filters.equipment_type) ? extractEquipmentType(question) : null;

    const effectiveFilters = {
      ...filters,
      ...(inferredSite ? { site: inferredSite } : {}),
      ...(nameFromQ ? { task_man: nameFromQ } : {}),
      ...(equipFromQ ? { equipment_type: equipFromQ } : {}),
      days,
    };

    // 이름/장비 질의면 프리필터 넓게
    const widen = Boolean(nameFromQ) || Boolean(equipFromQ);
    const firstLimit = widen
      ? Math.max(Number(_prefilter) || 300, 5000)
      : Math.max(30, Math.min(5000, Number(_prefilter) || 300));

    // 1) 1차 조회
    let candidates = await fetchAllEmbeddings({
      filters: effectiveFilters,
      limit: firstLimit,
    });

    // 2) 0건이면 날짜 필터 제거 + limit 확대
    if (!candidates.length) {
      const { days: _ignored, ...noDays } = effectiveFilters;
      candidates = await fetchAllEmbeddings({
        filters: noDays,
        limit: Math.max(firstLimit, 7000),
      });
    }

    // 3) 그래도 0건이면 완전 완화(필터 전부 제거)
    if (!candidates.length) {
      candidates = await fetchAllEmbeddings({
        filters: {},
        limit: Math.max(firstLimit, 8000),
      });

      if (!candidates.length) {
        console.warn('[RAG] no candidates after fetchAllEmbeddings. filters=%j, prefilter=%d', effectiveFilters, firstLimit);
        return res.json({
          ok: true,
          used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
          answer: '관련 로그를 찾지 못했습니다. (근거 0건)\n- 이름/장비/기간 필터를 완화하거나, 철자를 다시 확인해 보세요.',
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

    // 5) 유사도 + 보너스
    const nameToken = (nameFromQ && nameFromQ.length >= 2) ? nameFromQ : null;
    const equipToken = equipFromQ ? String(equipFromQ).toUpperCase() : null;

    const ranked = candidates
      .map(c => {
        let s = cosineSimilarity(qVec, c.embedding);
        if (nameToken && c.content && String(c.content).includes(nameToken)) s += 0.08;
        if (equipToken && c.equipment_type && String(c.equipment_type).toUpperCase() === equipToken) s += 0.04;
        return { ...c, score: s };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const rankedNonEmpty = ranked.filter(r => (r.content && String(r.content).trim().length > 0));

    // 모델 컨텍스트 최대 8개
    const contextsForLLM = rankedNonEmpty.slice(0, 8).map(r => normalizeContent(r.content));
    const ctxUsedCount = contextsForLLM.length;

    // 프리뷰 (근거 표)
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
        answer: '관련 텍스트가 없어 답변을 구성할 수 없습니다. (근거 0건)\n- 기간/필터를 완화하거나 키워드를 바꿔 시도해 보세요.',
        evidence_preview,
      });
    }

    // 6) 모델 호출 — 자연스러운 자유 서술
    const messages = buildPrompt(question, contextsForLLM);
    const chatRes = await openai.chat.completions.create({
      model: MODELS.chat,
      messages,
      temperature: 0.3,
    });

    const rawAnswer = chatRes.choices?.[0]?.message?.content?.trim();
    const answer = rawAnswer || '응답을 생성하지 못했습니다.';

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
