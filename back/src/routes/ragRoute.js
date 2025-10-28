// back/src/routes/ragRoute.js
const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../../config/jwtMiddleware');
const ragController = require('../controllers/ragController');

// 인증을 붙이고 싶으면 jwtMiddleware 주석 해제
router.post('/ask', /* jwtMiddleware, */ ragController.ask);

module.exports = router;
