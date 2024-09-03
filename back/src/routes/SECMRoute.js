const express = require('express');
const router = express.Router();
const SECMController = require('../controllers/SECMController');

router.get('/secm', SECMController.getData);
router.get('/export-to-excel', SECMController.exportToExcel);  // 엑셀 파일 다운로드 엔드포인트 추가

module.exports = (app) => {
  app.use('/api', router);
};
