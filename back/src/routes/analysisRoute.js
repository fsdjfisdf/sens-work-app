const express = require('express');
const router = express.Router();

const analysisController = require('../controllers/analysisController');
const jwtMiddleware = require('../../config/jwtMiddleware');

// 🔎 진단 로그
router.use((req, res, next) => {
  console.log('[analysis]', req.method, req.originalUrl, {
    auth: req.headers.authorization ? 'Authorization' : null,
    x: req.headers['x-access-token'] ? 'x-access-token' : null
  });
  next();
});

// ✅ 서버 살아있고 경로가 맞는지 핑 확인(무인증)
router.get('/ping', (req, res) => res.json({ ok: true }));

// (아래 인증/엔드포인트는 2번에서 수정)
module.exports = router;
