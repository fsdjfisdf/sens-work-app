const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/workLogController');
const indexController = require('../controllers/indexController');

// 작업 이력 조회
router.get('/work-logs', workLogController.getWorkLogs);

// 작업 이력 추가
router.post('/work-logs', workLogController.addWorkLog);

router.post('/sign-in', indexController.createJwt);

module.exports = router;