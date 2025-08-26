// src/routes/reportsRoute.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// 헬스체크
router.get('/ping', (_req, res) => res.send('ok'));

// GET /reports/weekly-summary?group=PEE1&site=PT&week=YYYY-MM-DD[&force=1]
router.get('/weekly-summary', reportsController.getWeeklySummary);

module.exports = router;
