const express = require('express');
const router = express.Router();
const supraMaintenanceController = require('../controllers/supraMaintenanceController');

// SUPRA Maintenance Checklist 저장
router.post('/supra-maintenance', supraMaintenanceController.saveChecklist);

module.exports = router;
