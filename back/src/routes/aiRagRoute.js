// back/src/routes/aiRagRoute.js
const express = require('express');
const router = express.Router();

 // 컨트롤러 경로: back/src/controllers/aiRagController.js
 const { ask } = require('../controllers/aiRagController');

// POST /api/rag/ask
router.post('/ask', ask);

module.exports = router;
