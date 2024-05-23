const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 사용자 회원가입
router.post('/register', userController.register);

// 사용자 로그인
router.post('/login', userController.login);

const workLogController = require('../controllers/workLogController'); // 경로 및 파일 이름 확인
router.get('/work-logs', workLogController.getWorkLogs);
router.post('/work-logs', workLogController.addWorkLog);

module.exports = router;
