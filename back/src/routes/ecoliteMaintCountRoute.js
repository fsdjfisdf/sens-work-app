// ecoliteMaintCountRoute.js
const express = require('express');
const router = express.Router();
const ecoliteMaintCountController = require('../controllers/ecoliteMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/ecolite-task-count', ecoliteMaintCountController.getTaskCount);
router.post('/ecolite-maintenance/aggregated', ecoliteMaintCountController.saveAggregatedData);

module.exports = router;
