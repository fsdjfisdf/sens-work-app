const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../../config/jwtMiddleware');
const ragController = require('../controllers/ragController');

// 인증 붙이고 싶으면 jwtMiddleware 추가
router.post('/ask', /* jwtMiddleware, */ ragController.ask);

module.exports = router;
