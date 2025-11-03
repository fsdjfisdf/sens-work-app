// back/src/controllers/aiRagController.js
const { openai, MODELS } = require('../../config/openai');
const dao = require('../dao/aiRagDao');
const svc = require('../services/aiRagIngestService');

/** "2025년 7월", "2025-07", "2025/7" → [from, to) */
function parseYearMonth(text) {
  const m = String(text || '').match(/(20\d{2})\s*[년\-/\.]\s*(1[0-2]|0?[1-9])\s*[월]?/);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = String(m[2]).padStart(2, '0');
  const from = `${y}-${mm}-01`;
  const to = (mm === '12') ? `${y + 1}-01-01` : `${y}-${String(Number(mm) + 1).padStart(2, '0')}-01`;
  return { from, to };
}

/** 한글 이름 간단 추출(괄호 표기 제거, 가장 긴 토큰 선택) */
function extractPerson(text) {
  const s = String(text || '').replace(/\((main|support)\)/gi, '');
  const m = s.match(/[\uAC00-\uD7AF]{2,4}/g);
  if (!m) return null;
  return m.sort((a, b) => b.length - a.length)[0];
}

async function ask(req, res) {
  try {
    let {
      q,
      days = 365,
      filters = {},
      prefilter = 300,
      topK = 20,
      answerTopK = 8
    } = req.body || {};

    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: 'q(질문)을 입력해 주세요.' });
    }

    // 1) 자연어에서 연·월/사람 추출 → 필터 주입(명시값 없을 때만)
    if (!filters.date_from && !filters.date_to) {
      const ym = parseYearMonth(q);
      if (ym) {
        filters.date_from = ym.from;
        filters.date_to = ym.to; // 반열린 구간
        days = undefined;       // 절대기간이 있으면 days 무시
      }
    }
    if (!filters.person) {
      const person = extractPerson(q);
      if (person) filters.person = person;
    }

    // 2) 프리필터(청크ID) — 메타/기간만 사용
    const candidateIds = await dao.prefilterCandidates({
      q,
      limit: prefilter,
      filters: { ...filters, days },
    });
    if (!candidateIds.length) {
      const when = (filters.date_from || filters.date_to)
        ? `${filters.date_from || '…'} ~ ${filters.date_to || '…'}`
        : `최근 ${days}일`;
      return res.json({ answer: `해당 기간(${when})에 해당하는 근거가 없습니다.`, evidences: [] });
    }

    // 3) 쿼리 임베딩 + 후보 임베딩 로드
    const [queryVec, embedRows] = await Promise.all([
      svc.embedQuery(q),
      dao.getEmbeddingsByIds(candidateIds),
    ]);
    if (!embedRows.length) {
      return res.json({ answer: '근거 임베딩이 없어 검색되지 않습니다.', evidences: [] });
    }

    // 4) 랭킹 → 상위 topK
    const ranked = svc.rankByCosine(queryVec, embedRows);
    const topIds = ranked.slice(0, topK).map(r => r.id);
    if (!topIds.length) {
      return res.json({ answer: '유사도 상위 결과가 없습니다.', evidences: [] });
    }

    // 5) 컨텐츠 로드
    let contents = await dao.getContentsByIds(topIds);

    // 6) 절대기간 세이프가드(있으면 강제 적용)
    if (filters.date_from || filters.date_to) {
      const from = filters.date_from ? new Date(filters.date_from) : null;
      const to = filters.date_to ? new Date(filters.date_to) : null;
      contents = contents.filter(c => {
        const d = new Date(c.task_date);
        return (!from || d >= from) && (!to || d < to);
      });
      if (!contents.length) {
        const when = `${filters.date_from || '…'} ~ ${filters.date_to || '…'}`;
        return res.json({ answer: `해당 기간(${when}) 근거가 없습니다.`, evidences: [] });
      }
    }

    // 7) 컨텍스트 패킹
    const { picked, blocks } = svc.packContext(contents, topIds, answerTopK);

    // 8) 모델 호출 — 형식 강요 없이 자연스럽게
    const messages = [
      { role: 'system', content: '한국어로 답하세요. 제공된 근거(evidence)를 우선으로 하되, 형식을 강요하지 않습니다.' },
      { role: 'user', content: `질문:\n${q}\n\n아래는 관련 근거입니다:\n\n${blocks}` }
    ];
    const chat = await openai.chat.completions.create({
      model: MODELS.chat,
      messages,
      temperature: 0.2
    });
    const answer = chat.choices?.[0]?.message?.content || '';

    const evidences = picked.map(p => ({
      id: p.id,
      date: p.task_date,
      group: p.group,
      site: p.site,
      equip: p.equipment_type_norm,
      work_type: p.work_type,
      work_type2: p.work_type2
    }));

    return res.json({
      params: { q, days, filters, prefilter, topK, answerTopK },
      answer,
      evidences,
      topIds: picked.map(p => p.id)
    });
  } catch (err) {
    console.error('[RAG/ask] error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

module.exports = { ask };
