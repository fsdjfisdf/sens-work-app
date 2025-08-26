// src/routes/reportsRoute.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// 예: GET /api/reports/weekly?group=PEE1&site=PT&week=2025-08-18&force=1
router.get('/weekly', reportsController.getWeeklySummary);

module.exports = router;
