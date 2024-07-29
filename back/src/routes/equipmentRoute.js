const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

router.get('/equipment', equipmentController.getEquipment);

module.exports = router;
