const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const workLogController = require('../controllers/workLogController'); // 경로 수정

// 사용자 회원가입
router.post('/register', userController.register);

// 사용자 로그인
router.post('/login', userController.login);

// 작업 이력 조회 및 추가
router.get('/work-logs', workLogController.getWorkLogs);
router.post('/work-logs', workLogController.addWorkLog);

module.exports = router;
