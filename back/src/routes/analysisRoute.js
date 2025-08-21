const express = require('express');
const router = express.Router();
const analysisController = require('./analysisController');

// 과거 시계열(집계) 조회
router.get('/series', analysisController.getSeries);

// 장기 예측 (1~2년)
router.get('/forecast', analysisController.getForecast);

module.exports = router;
