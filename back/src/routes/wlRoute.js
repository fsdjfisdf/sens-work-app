/**
 * wlRoute.js
 * 새 스키마용 라우트
 * [추가] /events (조회), PUT /event/:id (수정), /export/excel (엑셀)
 */
'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/wlController');
const jwt     = require('../../config/jwtMiddleware');

// 마스터 데이터
router.get('/master/work-items', jwt, ctrl.getWorkItemMaster);
router.get('/master/parts',      jwt, ctrl.getPartMaster);

// 결재자 목록
router.get('/approvers', jwt, ctrl.getApprovers);

// 제출
router.post('/submit', jwt, ctrl.submit);

// 대기 목록 / 반려 목록
router.get('/pending',        jwt, ctrl.listPending);
router.get('/rejected/mine',  jwt, ctrl.listMyRejected);

// [추가] 전체 이벤트 조회 (wl_read 페이지용)
router.get('/events', jwt, ctrl.listEvents);

// [추가] 엑셀 데이터 조회
router.get('/export/excel', jwt, ctrl.exportExcel);

// 단건 상세 / PATCH / PUT
router.get('/event/:id',   jwt, ctrl.getOne);
router.patch('/event/:id', jwt, ctrl.patchOne);
router.put('/event/:id',   jwt, ctrl.updateEvent);  // [추가] 승인 후 수정
router.delete('/event/:id', jwt, ctrl.deleteEvent); // [추가] 삭제

// 재제출 / 승인 / 반려
router.post('/event/:id/resubmit', jwt, ctrl.resubmit);
router.post('/event/:id/approve',  jwt, ctrl.approve);
router.post('/event/:id/reject',   jwt, ctrl.reject);

module.exports = router;
