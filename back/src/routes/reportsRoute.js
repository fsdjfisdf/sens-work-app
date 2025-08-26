const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// 프론트가 호출하는 경로와 정확히 매칭
// GET /reports/weekly-summary?group=PEE1&site=PT&week=2025-08-25
router.get('/weekly-summary', reportsController.getWeeklySummary);

module.exports = router;
