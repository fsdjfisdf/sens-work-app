const express = require('express');
const AIController = require('../controllers/AIController');

const router = express.Router();

// OpenAI Query 처리 라우트
router.post('/query', AIController.processQuery);

module.exports = router;
