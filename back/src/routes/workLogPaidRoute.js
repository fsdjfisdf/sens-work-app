// src/routes/workLogPaidRoute.js
const express = require('express');
const router = express.Router();

const jwtMiddleware           = require('../../config/jwtMiddleware');
const workLogPaidController   = require('../controllers/workLogPaidController');

/** Pending 단계(결재 전) - 저장/조회/삭제 */
router.post('/approval/work-log/:pendingId/paid', jwtMiddleware, workLogPaidController.savePendingPaid);
router.get ('/approval/work-log/:pendingId/paid', jwtMiddleware, workLogPaidController.getPendingPaid);
router.delete('/approval/work-log/:pendingId/paid', jwtMiddleware, workLogPaidController.clearPendingPaid);

/** Final 단계(승인 후) - 바로 추가(옵션) */
router.post('/work-logs/:workLogId/paid', jwtMiddleware, workLogPaidController.addFinalPaid);

module.exports = router;
