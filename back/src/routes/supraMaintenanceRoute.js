const express = require('express');
const router = express.Router();
const supraMaintenanceController = require('../controllers/supraMaintenanceController');

router.get('/supra-maintenance', supraMaintenanceController.getChecklist);
router.post('/supra-maintenance', supraMaintenanceController.saveChecklist);

module.exports = router;
