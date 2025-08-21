// src/routes/analysisRoute.js
const express = require('express');
const router = express.Router();

const analysisController = require('../controllers/analysisController');
const jwtMiddleware = require('../../config/jwtMiddleware');

// 진단 로그
router.use((req, res, next) => {
  console.log('[analysis]', req.method, req.originalUrl, {
    auth: req.headers.authorization ? 'Authorization' : null,
    x: req.headers['x-access-token'] ? 'x-access-token' : null
  });
  next();
});

router.get('/ping', (req, res) => res.json({ ok: true }));

function normalizeTokenHeader(req, res, next) {
  const x = req.headers['x-access-token'];
  const auth = req.headers.authorization;
  if (!auth && x) req.headers.authorization = `Bearer ${x}`;
  next();
}

router.get('/series',    normalizeTokenHeader, jwtMiddleware, analysisController.getSeries);
router.get('/forecast',  normalizeTokenHeader, jwtMiddleware, analysisController.getForecast);
router.get('/headcount', normalizeTokenHeader, jwtMiddleware, analysisController.getHeadcount);

module.exports = router;
