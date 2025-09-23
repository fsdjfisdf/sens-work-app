const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workLogPaidController');

// 유상 상세(결재대기용) 저장
router.post('/pending/:pendingId', ctrl.savePaidRowsForPending);
router.get('/api/work-log-paid/search', ctrl.searchPaidRows); // 인증 없이 열려면 jwt 제거

module.exports = router;
