const express = require('express');
const router = express.Router();
const signalController = require('../controllers/signalController');

// GET: 특정 장비의 INFO 가져오기
router.get('/equipment/:eqName', signalController.getEquipmentInfo);

// PUT: 특정 장비의 INFO 수정
router.put('/equipment/:eqName', signalController.updateEquipmentInfo);

module.exports = router;
