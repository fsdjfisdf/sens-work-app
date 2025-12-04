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



async function askTsRag(req, res) {
  try {
    const {
      question,
      equipment_type,
      alarm_key,
      // 🔹 mode 제거

      // WORK_LOG 필터
      task_date,
      date_from,
      date_to,
      equipment_name,
      workers_clean,  // 프론트 이름
      group_name,
      group_site,     // 프론트에서 이렇게 보낸다고 했으니
      work_type,
      setup_item,
      transfer_item,
      topK,
    } = req.body || {};

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

      // WORK_LOG 필터 매핑
      task_date,
      date_from,
      date_to,
      equipment_name,
      worker_name: workers_clean,
      group_name,
      site: group_site,
      work_type,
      setup_item,
      transfer_item,
      topK,
      // 🔹 mode 안 넘김. 항상 BOTH 로 동작하도록 service 쪽에서 처리
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
      message: 'RAG 질의 처리 중 오류가 발생했습니다.',
      error: err.message,
    });
  }
}

module.exports = {
  buildEmbeddings,
  askTsRag,
};