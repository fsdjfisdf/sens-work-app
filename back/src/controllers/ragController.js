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

/** 질문에서 장비타입 추출 */
function extractEquipmentType(q='') {
  const U = String(q).toUpperCase();
  const KEYS = ['SUPRA N','SUPRA XP','INTEGER','PRECIA','ECOLITE','GENEVA','HDW'];
  for (const k of KEYS) {
    if (U.includes(k)) return k;
  }
  return null;
}

/** 질문에서 한글 이름(2~4글자 + 선택적 대문자 1)들 추출 → 배열 */
function extractKoreanNames(q='') {
  const s = String(q).replace(/\(.*?\)/g, '');
  // 예: 김민제A 지원 → 'A' 접미 허용
  const m = s.match(/[\uAC00-\uD7A3]{2,4}[A-Z]?/g);
  if (!m) return [];
  // 중복 제거 & 길이/한글 비율로 간단 정렬
  const uniq = Array.from(new Set(m));
  return uniq.sort((a,b)=>b.length - a.length);
}

/** LLM 프롬프트 — 자연스러운 답변 */
function buildPrompt(question, contexts) {
  const ctx = (contexts || [])
    .map((text, i) => `【근거 ${i + 1}】\n${text}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        '너는 현장 작업 로그를 바탕으로 사실만으로 답하는 분석 조수야.',
        '근거 텍스트를 꼼꼼히 읽고, 사용자 질문에 자연스럽고 간결한 한국어로 답해.',
        '추측이나 창작 금지. 날짜/수치/장비/작업자 등은 근거에서 확인된 것만 사용.',
        '불확실하면 모른다고 말하고, 추가로 확인할 만한 구체적 제안을 해.',
        '딱딱한 섹션 헤더는 쓰지 말고, 필요한 곳에만 불릿을 사용해.',
        '사람 이름이 나오면 task_man에서 결과를 찾아'
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

    const topK = Math.max(5, Math.min(50, Number(_topK) || 20));
    const days = Math.max(1, Math.min(3650, Number(_days) || 365));

    await ensureTables();

    // 자동 필터
    const inferredSite = (!filters.site) ? inferSiteFromQuestion(question) : null;
    const namesFromQ = extractKoreanNames(question); // 여러 이름 가능
    const equipFromQ = (!filters.equipment_type) ? extractEquipmentType(question) : null;

    const effectiveFilters = {
      ...filters,
      ...(inferredSite ? { site: inferredSite } : {}),
      ...(equipFromQ ? { equipment_type: equipFromQ } : {}),
      ...(namesFromQ.length ? { task_man_names: namesFromQ } : {}),
      days,
    };

    const widen = Boolean(namesFromQ.length) || Boolean(equipFromQ);
    const firstLimit = widen
      ? Math.max(Number(_prefilter) || 300, 5000)
      : Math.max(30, Math.min(5000, Number(_prefilter) || 300));

    // 1) 후보 조회
    let candidates = await fetchAllEmbeddings({
      filters: effectiveFilters,
      limit: firstLimit,
    });

    // 2) 0건 → 날짜 해제
    if (!candidates.length) {
      const { days: _ignored, ...noDays } = effectiveFilters;
      candidates = await fetchAllEmbeddings({
        filters: noDays,
        limit: Math.max(firstLimit, 7000),
      });
    }

    // 3) 그래도 0건 → 필터 해제
    if (!candidates.length) {
      candidates = await fetchAllEmbeddings({
        filters: {},
        limit: Math.max(firstLimit, 8000),
      });

      if (!candidates.length) {
        return res.json({
          ok: true,
          used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
          answer: '관련 로그를 찾지 못했습니다. 이름/설비/기간 필터를 완화해 다시 시도해 보세요.',
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

    // 5) 유사도 + 보너스(정확한 역할 표기 가중치 포함)
    const eqToken = effectiveFilters.equipment_type
      ? String(effectiveFilters.equipment_type).toUpperCase()
      : null;

    const nameTokens = Array.isArray(effectiveFilters.task_man_names)
      ? effectiveFilters.task_man_names
      : [];

    const ranked = candidates
      .map(c => {
        let s = cosineSimilarity(qVec, c.embedding);

        // 장비타입 완전 일치 보너스
        if (eqToken && c.equipment_type && String(c.equipment_type).toUpperCase() === eqToken) {
          s += 0.05;
        }

        // 이름 보너스: (main) 명시시 더 큰 가중
        if (nameTokens.length) {
          const text = (c.content || '') + ' ' + (c.meta_task_man || '');
          for (const nm of nameTokens) {
            const hasMain = new RegExp(`${nm}\\s*\\(\\s*main\\s*\\)`).test(text);
            const hasSupp = new RegExp(`${nm}\\s*\\(\\s*support\\s*\\)`).test(text);
            const hasLoose = text.includes(nm);
            if (hasMain)      s += 0.10;
            else if (hasSupp) s += 0.06;
            else if (hasLoose) s += 0.04;
          }
        }

        return { ...c, score: s };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const rankedNonEmpty = ranked.filter(r => (r.content && String(r.content).trim().length > 0));

    // 모델 컨텍스트
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
        answer: '관련 텍스트가 없어 답변을 구성할 수 없습니다. (근거 0건)',
        evidence_preview,
      });
    }

    // 6) LLM 호출
    const messages = buildPrompt(question, contextsForLLM);
    const chatRes = await openai.chat.completions.create({
      model: MODELS.chat,
      messages,
      temperature: 0.35,
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
