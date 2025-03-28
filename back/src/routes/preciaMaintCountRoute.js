// preciaMaintCountRoute.js
const express = require('express');
const router = express.Router();
const preciaMaintCountController = require('../controllers/preciaMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/precia-task-count', preciaMaintCountController.getTaskCount);
router.post('/precia-maintenance/aggregated', preciaMaintCountController.saveAggregatedData);

module.exports = router;
