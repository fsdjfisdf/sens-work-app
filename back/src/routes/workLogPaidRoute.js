const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workLogPaidController');

// 유상 상세(결재대기용) 저장
router.post('/pending/:pendingId', ctrl.savePaidRowsForPending);
router.post('/pending/:pendingId', ctrl.savePaidRowsForPending);
router.post('/approval/work-log-paid/pending/:pendingId', ctrl.savePaidRowsForPending);

// 유상 상세 검색 → GET /api/work-log-paid/search
router.get('/search', ctrl.searchPaidRows);

module.exports = router;
