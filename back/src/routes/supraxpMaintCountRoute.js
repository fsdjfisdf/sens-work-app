const express = require('express');
const router = express.Router();
const supraxpMaintCountController = require('../controllers/supraxpMaintCountController');

// 작업 카운트 데이터 가져오는 API
router.get('/supraxp-task-count', supraxpMaintCountController.getTaskCount);
router.post('/supraxp-maintenance/aggregated', supraxpMaintCountController.saveAggregatedData);


module.exports = (app) => {
  app.use('/api', router);
};
