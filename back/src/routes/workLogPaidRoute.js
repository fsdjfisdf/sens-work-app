const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workLogPaidController');

// 유상 상세(결재대기용) 저장
router.post('/pending/:pendingId', ctrl.savePaidRowsForPending);

module.exports = router;
