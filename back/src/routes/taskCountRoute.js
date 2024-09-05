const express = require('express');
const router = express.Router();
const taskCountController = require('../controllers/taskCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/task-count', taskCountController.getTaskCount);

module.exports = (app) => {
  app.use('/api', router);
};
