const express = require('express');
const router = express.Router();

const analysisController = require('../controllers/analysisController');
const jwtMiddleware = require('../../config/jwtMiddleware');

// 과거 시계열 (집계 단위: day|week|month, 기본 day→주/월로 리샘플)
router.get('/series', jwtMiddleware, analysisController.getSeries);

// 예측 (프런트의 horizon=일 수 기준, day:1, week:7, month:30으로 환산)
router.get('/forecast', jwtMiddleware, analysisController.getForecast);

// 현재 인원 (userDB)
router.get('/headcount', jwtMiddleware, analysisController.getHeadcount);

module.exports = router;
