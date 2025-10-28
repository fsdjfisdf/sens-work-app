// back/src/controllers/ragController.js
const { openai, MODELS } = require('../../config/openai');
const {
  ensureTables,
  fetchAllEmbeddings,
  cosineSimilarity,
} = require('../dao/ragDao');

// 프롬프트 헬퍼
function buildPrompt(question, contexts) {
  const ctx = contexts.map((c, i) => `【근거 ${i + 1}】\n${c.content}`).join('\n\n');
  return [
    {
      role: 'system',
      content:
        '너는 현장 작업 로그 요약/검색 보조자야. 주어진 근거 안에서만 답하고, 모르면 모른다고 말해. 한국어로 간결하게.',
    },
    {
      role: 'user',
      content: `질문:\n${question}\n\n------\n근거 모음:\n${ctx}\n\n지침:\n- 근거에 없는 내용은 추측하지 말 것\n- 계량 값/조건은 근거에서 확인된 것만 언급\n- 마지막 줄에 "※ 근거: n건" 표기`,
    },
  ];
}

// POST /api/rag/ask
// body: { question, topK=20, prefilterLimit=300, filters? }
async function ask(req, res, next) {
  try {
    const { question, topK = 20, prefilterLimit = 300, filters = {} } = req.body || {};
    if (!question || !String(question).trim()) {
      return res.status(400).json({ ok: false, error: 'question is required' });
    }

    await ensureTables();

    // 후보 로딩 (프리필터)
    const candidates = await fetchAllEmbeddings({
      filters,                     // {equipment_type, site, line} 지원
      limit: Number(prefilterLimit) || 300,
    });

    if (!candidates.length) {
      return res.json({
        ok: true,
        used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
        answer: '근거가 없습니다.',
        evidence_preview: [],
      });
    }

    // 쿼리 임베딩
    const emb = await openai.embeddings.create({
      model: MODELS.embedding,
      input: [question],
    });
    const qVec = emb.data[0].embedding;

    // 유사도 정렬 → 상위 topK
    const ranked = candidates
      .map((c) => ({ ...c, score: cosineSimilarity(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(topK) || 20);

    // LLM 컨텍스트로는 과도하지 않게 상위 6~8개만 사용
    const contextForLLM = ranked.slice(0, 8);

    // 답변 생성
    const messages = buildPrompt(question, contextForLLM);
    const chatRes = await openai.chat.completions.create({
      model: MODELS.chat,
      messages,
      temperature: 0.2,
    });

    const answer = chatRes.choices?.[0]?.message?.content?.trim() || '응답을 생성하지 못했습니다.';

    // 프론트 표시용 프리뷰
    const evidence_preview = ranked.map((r) => ({
      id: r.chunk_id,                              // rag_chunks.id
      sim: r.score,
      site: r.site,
      line: r.line,
      eq: [r.equipment_type, r.equipment_name].filter(Boolean).join(' / '),
      name: r.work_type ? `${r.work_type}${r.work_type2 ? ' / ' + r.work_type2 : ''}` : '',
      desc: r.content?.slice(0, 180) || '',
    }));

    res.json({
      ok: true,
      used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
      answer: `${answer}\n\n※ 근거: ${contextForLLM.length}건`,
      evidence_preview,
    });
  } catch (err) {
    console.error('[RAG] ask error:', err);
    // 전역 에러 핸들러로 위임 (항상 JSON 보장)
    next(err);
  }
}

module.exports = { ask };
