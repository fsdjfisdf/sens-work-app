// src/routes/reportsRoute.js
const express = require('express');
const reportsController = require('../controllers/reportsController');

module.exports = (app) => {
  const router = express.Router();

  // 연결 확인용
  router.get('/ping', (_req, res) => res.send('ok'));

  // 프론트가 호출하는 엔드포인트
  // GET /reports/weekly-summary?group=PEE1&site=PT&week=YYYY-MM-DD[&force=1]
  router.get('/weekly-summary', reportsController.getWeeklySummary);

  app.use('/reports', router);
};
