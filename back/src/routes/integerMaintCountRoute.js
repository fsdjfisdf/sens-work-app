const express = require('express');
const router = express.Router();
const integerMaintCountController = require('../controllers/integerMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/integer-task-count', integerMaintCountController.getTaskCount);
router.post('/integer-maintenance/aggregated', integerMaintCountController.saveAggregatedData);

// 올바르게 라우터 객체를 반환
module.exports = router;
