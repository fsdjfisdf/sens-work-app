/**
 * wlRoute.js
 * 새 스키마용 라우트
 * express.js 에서:  const wlRoute = require('./src/routes/wlRoute');  app.use('/wl', wlRoute);
 */
'use strict';

const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/wlController');
const jwt        = require('../../config/jwtMiddleware');

// 마스터 데이터 (equipment_type별 작업항목/파트 목록)
router.get('/master/work-items', jwt, ctrl.getWorkItemMaster);
router.get('/master/parts',      jwt, ctrl.getPartMaster);

// 결재자 목록
router.get('/approvers', jwt, ctrl.getApprovers);

// 제출
router.post('/submit', jwt, ctrl.submit);

// 대기 목록 / 반려 목록
router.get('/pending',        jwt, ctrl.listPending);
router.get('/rejected/mine',  jwt, ctrl.listMyRejected);

// 단건 상세 / PATCH
router.get('/event/:id',   jwt, ctrl.getOne);
router.patch('/event/:id', jwt, ctrl.patchOne);

// 재제출 / 승인 / 반려
router.post('/event/:id/resubmit', jwt, ctrl.resubmit);
router.post('/event/:id/approve',  jwt, ctrl.approve);
router.post('/event/:id/reject',   jwt, ctrl.reject);

module.exports = router;
