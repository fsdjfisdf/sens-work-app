// genevaMaintCountRoute.js
const express = require('express');
const router = express.Router();
const genevaMaintCountController = require('../controllers/genevaMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/geneva-task-count', genevaMaintCountController.getTaskCount);
router.post('/geneva-maintenance/aggregated', genevaMaintCountController.saveAggregatedData);

module.exports = router;
