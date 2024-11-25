// integerMaintCountRoute.js
const express = require('express');
const router = express.Router();
const integerMaintCountController = require('../controllers/integerMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/integer-task-count', integerMaintCountController.getTaskCount);
router.post('/integer-maintenance/aggregated', integerMaintCountController.saveAggregatedData);

module.exports = router;
