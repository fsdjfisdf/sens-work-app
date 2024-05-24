const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/workLogController');
const jwtMiddleware = require('../../config/jwtMiddleware');

// 작업 이력 조회
router.get('/work-logs', workLogController.getWorkLogs);

// 작업 이력 추가
router.post('/work-logs', workLogController.addWorkLog);

// 사용자 작업 내역 조회
router.get('/user-work-logs', jwtMiddleware, workLogController.getUserWorkLogs);

module.exports = router;
