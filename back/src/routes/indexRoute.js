const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/workLogController'); // 올바른 컨트롤러 경로
const userController = require('../controllers/userController');

// 작업 이력 조회
router.get('/work-logs', workLogController.getWorkLogs);

// 작업 이력 추가
router.post('/work-logs', workLogController.addWorkLog);

// 사용자 회원가입
router.post('/register', userController.register);

// 사용자 로그인
router.post('/login', userController.login);

module.exports = router;
