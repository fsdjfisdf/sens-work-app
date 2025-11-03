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

async function ask(req, res) {
  try{
    const { q, days = 365, filters = {}, prefilter = 300, topK = 20, answerTopK = 8 } = req.body || {};
    if(!q || !String(q).trim()){
      return res.status(400).json({ error: 'q(질문)을 입력해 주세요.' });
    }

    // 1) 프리필터 후보
    const candidateIds = await dao.prefilterCandidates({
      q, limit: prefilter, filters: { ...filters, days }
    });
    if(!candidateIds.length){
      return res.json({ answer: '근거가 없습니다.', evidences: [] });
    }

    // 2) 쿼리 임베딩 + 후보 임베딩 로드
    const [queryVec, embedRows] = await Promise.all([
      svc.embedQuery(q),
      dao.getEmbeddingsByIds(candidateIds),
    ]);
    if(!embedRows.length){
      return res.json({ answer: '근거 임베딩이 없어 검색되지 않습니다.', evidences: [] });
    }

    // 3) 코사인 유사도 → 상위 topK 선별
    const ranked = svc.rankByCosine(queryVec, embedRows);
    const topIds = ranked.slice(0, topK).map(r => r.id);

    // 4) 콘텐츠 로드 + 컨텍스트 패킹
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
