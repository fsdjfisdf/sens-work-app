const express = require('express');
const router = express.Router();
const integerMaintCountController = require('../controllers/integerMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/task-count', integerMaintCountController.getTaskCount);

module.exports = router;  // 수정: router를 내보냅니다.
