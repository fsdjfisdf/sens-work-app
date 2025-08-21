const express = require('express');
const router = express.Router();

const analysisController = require('../controllers/analysisController');
const jwtMiddleware = require('../../config/jwtMiddleware');

// 🔎 진단 로그: 어떤 헤더가 왔는지 확인
router.use((req, res, next) => {
  console.log('[analysis]', req.method, req.originalUrl, {
    auth: req.headers.authorization ? 'Authorization' : null,
    x: req.headers['x-access-token'] ? 'x-access-token' : null
  });
  next();
});

// ✅ ping (무인증) - 라우트 마운트 확인용
router.get('/ping', (req, res) => res.json({ ok: true }));

// 토큰 헤더 정규화: x-access-token → Authorization: Bearer
function normalizeTokenHeader(req, res, next) {
  const x = req.headers['x-access-token'];
  const auth = req.headers.authorization;
  if (!auth && x) req.headers.authorization = `Bearer ${x}`;
  // (반대 케이스도 허용하려면 아래 주석 해제)
  // if (!req.headers['x-access-token'] && auth?.startsWith('Bearer ')) {
  //   req.headers['x-access-token'] = auth.split(' ')[1];
  // }
  next();
}

// 보호 라우트
router.get('/series',   normalizeTokenHeader, jwtMiddleware, analysisController.getSeries);
router.get('/forecast', normalizeTokenHeader, jwtMiddleware, analysisController.getForecast);
router.get('/headcount',normalizeTokenHeader, jwtMiddleware, analysisController.getHeadcount);

module.exports = router;
