// back/src/routes/ragRoute.js
const express = require('express');
const router = express.Router();
// const jwtMiddleware = require('../../config/jwtMiddleware'); // 필요 시
const rag = require('../controllers/ragController');

// 인증 붙이고 싶으면 jwtMiddleware 추가
router.post('/ask', /* jwtMiddleware, */ rag.ask);
router.post('/embed-all', /* jwtMiddleware, */ rag.embedAll);
router.post('/query', /* jwtMiddleware, */ rag.query);

module.exports = router;
