// back/src/routes/tsRagRoute.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tsRagController');

// 임베딩 생성 (수동 트리거)
// 예: POST /api/ts-rag/build-embeddings  { "batchSize": 50 }
router.post('/build-embeddings', ctrl.buildEmbeddings);

// 알람 RAG 질문
// 예: POST /api/ts-rag/ask
// body: { "question": "...", "equipment_type": "SUPRA N", "alarm_key": "SUPRA N - Pin Move Timeout", "topK": 5 }
router.post('/ask', ctrl.askTsRag);

module.exports = router;
