const express = require('express');
const router = express.Router();
const SECMController = require('../controllers/SECMController');

router.get('/secm', SECMController.getData);

module.exports = (app) => {
  app.use('/api', router);
};
