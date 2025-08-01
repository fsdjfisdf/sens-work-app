// hdwMaintCountRoute.js
const express = require('express');
const router = express.Router();
const hdwMaintCountController = require('../controllers/hdwMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/hdw-task-count', hdwMaintCountController.getTaskCount);
router.post('/hdw-maintenance/aggregated', hdwMaintCountController.saveAggregatedData);

module.exports = router;
