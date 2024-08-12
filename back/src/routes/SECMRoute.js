const express = require('express');
const router = express.Router();
const SECMController = require('../controllers/SECMController');

router.get('/secm', SECMController.getData);
router.get('/user-info', SECMController.getUserInfo); // 새로운 엔드포인트 추가

module.exports = (app) => {
  app.use('/api', router);
};
