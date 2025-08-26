const express = require('express');
const router = express.Router();

const workLogController = require('../controllers/workLogController');
const jwtMiddleware = require('../../config/jwtMiddleware'); // JWT 미들웨어 (경로는 프로젝트 구조에 맞추세요)

/* ────────────────────────────────────────────────
 * 기존 CRUD 라우트 (그대로 유지)
 * ──────────────────────────────────────────────── */
router.get('/work-logs', workLogController.getWorkLogs);
router.post('/work-logs', workLogController.addWorkLog);
router.delete('/work-logs/:id', workLogController.deleteWorkLog);
router.put('/work-logs/:id', workLogController.updateWorkLog);

// 작업 카운트 증가
router.post('/api/update-task-count', workLogController.updateTaskCount);

// SUPRA XP 작업 이력 조회
router.get('/logs/supra-xp', workLogController.getSupraXPWorkLogs);

/* ────────────────────────────────────────────────
 * 결재 플로우 라우트
 *  - 이 라우트 파일을 사용해 mount 하는 경우에만 활성
 *  - express.js에서 동일 경로를 app.* 로 이미 바인딩했다면 중복되지 않게 주의
 *  - 권한은 컨트롤러 내부에서 닉네임 매핑/role 로 검증
 * ──────────────────────────────────────────────── */
router.get('/approval/approvers', jwtMiddleware, workLogController.getApproversForGroupSite);
router.post('/approval/work-log/submit', jwtMiddleware, workLogController.submitWorkLogPending);
router.get('/approval/work-log/pending', jwtMiddleware, workLogController.listPendingWorkLogs);
router.get('/approval/work-log/pending/:id', jwtMiddleware, workLogController.getPendingWorkLogOne);

// 결재자 또는 제출자 편집(상태별 제한)
router.patch('/approval/work-log/:id', jwtMiddleware, workLogController.updatePendingWorkLog);

// 제출자: 내 반려 목록/재제출
router.get('/approval/work-log/rejected/mine', jwtMiddleware, workLogController.listMyRejected);
router.post('/approval/work-log/:id/resubmit', jwtMiddleware, workLogController.resubmitPendingWorkLog);

// 결재자: 승인/반려 (결재자가 patch로 즉시 보정 가능)
router.post('/approval/work-log/:id/approve', jwtMiddleware, workLogController.approvePendingWorkLog);
router.post('/approval/work-log/:id/reject', jwtMiddleware, workLogController.rejectPendingWorkLog);

module.exports = router;
