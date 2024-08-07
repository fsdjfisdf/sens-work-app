const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// 장비 목록 조회
router.get('/equipment', equipmentController.getEquipments);

module.exports = (app) => {
  app.use('/api', router);
};
