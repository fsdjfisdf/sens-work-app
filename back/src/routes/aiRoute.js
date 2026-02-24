/**
 * back/src/routes/aiRoute.js
 *
 * AI 질의응답 라우트
 * express.js에서: const aiRoute = require('../src/routes/aiRoute');
 *                 app.use('/api/ai', aiRoute);
 *
 * 기존 worklogRoute.js 패턴 동일 적용
 */

'use strict';

const express       = require('express');
const router        = express.Router();
const aiController  = require('../controllers/aiController');
// JWT: 필요 시 주석 해제
// const jwtMiddleware = require('../../config/jwtMiddleware');

// ── 드롭다운 초기 옵션 조회 ──────────────────────────────────
// GET /api/ai/filter-options
router.get('/filter-options', aiController.getFilterOptions);

// ── 작업이력 AI 질의응답 (SQL + GPT) ─────────────────────────
// POST /api/ai/worklog/query
router.post('/worklog/query', aiController.worklogQuery);

// ── RAG 질의응답 (벡터 검색 + GPT, Phase 2) ──────────────────
// POST /api/ai/worklog/rag-query
// TODO: work_log_rag_chunks 임베딩 저장 완료 후 활성화
router.post('/worklog/rag-query', aiController.ragQuery);

module.exports = router;
