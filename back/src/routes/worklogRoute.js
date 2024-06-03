const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/workLogController');

// 작업 이력 조회
router.get('/work-logs', workLogController.getWorkLogs);

// 작업 이력 추가
router.post('/work-logs', workLogController.addWorkLog);

// 작업 이력 삭제
router.delete('/work-logs/:id', workLogController.deleteWorkLog);

router.get('/worker-summary/:workerName', workLogController.getWorkerSummary);

module.exports = router;
