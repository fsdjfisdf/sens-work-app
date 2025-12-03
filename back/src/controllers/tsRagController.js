// back/src/controllers/tsRagController.js
const svc = require('../services/tsRagEmbeddingService');

// 🔹 아직 없는 임베딩 생성 트리거
//    POST /api/ts-rag/build-embeddings
async function buildEmbeddings(req, res) {
  try {
    const { batchSize } = req.body || {};
    const result = await svc.buildMissingEmbeddings({ batchSize });
    res.json({ ok: true, result });
  } catch (err) {
    console.error('[tsRagController.buildEmbeddings] error:', err);
    res.status(500).json({
      ok: false,
      message: '임베딩 생성 중 오류가 발생했습니다.',
      error: err.message,
    });
  }
}

// 🔹 알람 RAG 질문
//    POST /api/ts-rag/ask
//    body: { question, equipment_type?, alarm_key?, topK? }
async function askTsRag(req, res) {
  try {
    const { question, equipment_type, alarm_key, topK } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'question(질문)을 입력해 주세요.',
      });
    }

    const result = await svc.answerQuestion({
      question: question.trim(),
      equipment_type,
      alarm_key,
      topK,
    });

    res.json({
      ok: true,
      answer: result.answer,
      hits: result.hits,
    });
  } catch (err) {
    console.error('[tsRagController.askTsRag] error:', err);
    res.status(500).json({
      ok: false,
      message: '알람 RAG 질의 처리 중 오류가 발생했습니다.',
      error: err.message,
    });
  }
}

module.exports = {
  buildEmbeddings,
  askTsRag,
};
