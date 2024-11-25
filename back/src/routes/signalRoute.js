const express = require('express');
const router = express.Router();
const signalController = require('../controllers/signalController');

// API 엔드포인트 연결
router.get('/', signalController.getSignalData);
router.put('/:eqName', signalController.updateSignalData);


module.exports = router;
