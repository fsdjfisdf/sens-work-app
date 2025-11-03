// back/src/controllers/aiRagController.js
const { openai, MODELS } = require('../../config/openai');
const dao = require('../dao/aiRagDao');
const svc = require('../services/aiRagIngestService');


function buildSystemPrompt() {
  return [
    {
      role: 'system',
      content:
        'You are a helpful assistant answering based on semiconductor field work logs. ' +
        'Cite concrete actions/causes/results. If unsure, say so. Answer in Korean.'
    }
  ];
}

function buildUserPrompt(q, evidenceBlocks) {
  return [
    {
      role: 'user',
      content:
        `질문:\n${q}\n\n` +
        `아래는 관련 로그 근거입니다. 근거만 사용해 요약/원인/조치/상태를 정리해 주세요.\n` +
        `\n${evidenceBlocks}\n\n` +
        `요구 포맷:\n- 요약\n- 원인 추정\n- 조치 내역\n- 현재 상태/추가 권고\n- 참고 근거(id 나열)`
    }
  ];
}

function parseKoreanYearMonth(text){
  // "2025년 7월", "2025-07", "2025/7" 등
  const m = String(text).match(/(20\d{2})\s*[년\-/\.]\s*(1[0-2]|0?[1-9])\s*[월]?/);
  if(!m) return null;
  const y = Number(m[1]);
  const mm = String(m[2]).padStart(2,'0');
  const from = `${y}-${mm}-01`;
  // 다음달 1일 계산
  const next = (mm==='12') ? `${y+1}-01-01` : `${y}-${String(Number(mm)+1).padStart(2,'0')}-01`;
  return { from, to: next };
}

function extractPerson(text){
  // 괄호/역할 표기는 제거
  const s = String(text).replace(/\((main|support)\)/gi,'').trim();
  // 아주 단순: 한글 2~4자 연속(중간 공백 허용X) 중 DB에 자주 등장하는 이름을 사용하고 싶다면,
  // 먼저 그대로 반환해서 DAO에서 LIKE 매칭하도록.
  const m = s.match(/[\uAC00-\uD7AF]{2,4}/g);
  if (!m) return null;
  // 가장 긴 토큰을 우선
  return m.sort((a,b)=>b.length-a.length)[0];
}

async function ask(req, res) {
  try{
    let { q, days = 365, filters = {}, prefilter = 300, topK = 20, answerTopK = 8 } = req.body || {};
    if(!q || !String(q).trim()){
      return res.status(400).json({ error: 'q(질문)을 입력해 주세요.' });
    }

    // ✅ 자연어에서 월/사람 자동 파싱 → 필터 주입(명시 필터 있으면 우선)
    if (!filters.date_from && !filters.date_to) {
      const ym = parseKoreanYearMonth(q);
      if (ym) {
        filters.date_from = ym.from;
        filters.date_to   = ym.to;   // 반열린구간
        days = undefined;            // days 비활성화
      }
    }
    if (!filters.person) {
      const p = extractPerson(q);
      if (p) filters.person = p;
    }

    // 1) 프리필터
    const candidateIds = await dao.prefilterCandidates({
      q, limit: prefilter, filters: { ...filters, days }
    });
    if(!candidateIds.length){
      return res.json({ answer: '근거가 없습니다.', evidences: [] });
    }

    // 2) 임베딩
    const [queryVec, embedRows] = await Promise.all([
      svc.embedQuery(q),
      dao.getEmbeddingsByIds(candidateIds),
    ]);
    if(!embedRows.length){
      return res.json({ answer: '근거 임베딩이 없어 검색되지 않습니다.', evidences: [] });
    }

    // 3) 랭킹
    const ranked = svc.rankByCosine(queryVec, embedRows);
    const topIds = ranked.slice(0, topK).map(r => r.id);

    // 4) 콘텐츠
    const contents = await dao.getContentsByIds(topIds);
    const { picked, blocks } = svc.packContext(contents, topIds, answerTopK);

    // 5) 모델 호출
    const messages = [
      ...buildSystemPrompt(),
      ...buildUserPrompt(q, blocks),
    ];
    const chat = await openai.chat.completions.create({
      model: MODELS.chat,
      messages,
      temperature: 0.2,
    });

    const answer = chat.choices?.[0]?.message?.content || '(no content)';
    const evidences = picked.map(p => ({
      id: p.id,
      date: p.task_date,
      group: p.group,
      site: p.site,
      equip: p.equipment_type_norm,
      work_type: p.work_type,
      work_type2: p.work_type2,
    }));

    return res.json({
      params: { q, days, filters, prefilter, topK, answerTopK },
      answer,
      evidences,
      topIds,
    });
  }catch(err){
    console.error('[RAG/ask] error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

module.exports = { ask };
