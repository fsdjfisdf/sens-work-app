// back/src/routes/setupBoardRoute.js
const express = require('express');
const router = express.Router();

const jwtMiddleware = require('../../config/jwtMiddleware'); // ✅
const controller = require('../controllers/setupBoardController');

// 헬스체크
router.get('/ping', (_req, res) => res.send('ok'));

/**
 * Board
 * GET  /api/setup-board?customer=&site=&line=&status=&q=&sort=&limit=&offset=
 */
router.get('/setup-board', jwtMiddleware, controller.listBoard);

/**
 * Project
 * POST /api/setup-projects
 */
router.post('/setup-projects', jwtMiddleware, controller.createProject);

/**
 * GET /api/setup-projects/:id
 * 상세(프로젝트 + steps + issues)
 */
router.get('/setup-projects/:id', jwtMiddleware, controller.getProjectDetail);

/**
 * PATCH /api/setup-projects/:id
 * 프로젝트 정보 수정(고객사/사이트/라인/위치/담당/목표일 등)
 */
router.patch('/setup-projects/:id', jwtMiddleware, controller.updateProject);

/**
 * PATCH /api/setup-projects/:id/steps/:stepNo
 * step 업데이트(상태/예정/실제/작업자/메모)
 */
router.patch('/setup-projects/:id/steps/:stepNo', jwtMiddleware, controller.updateStep);

/**
 * Issues
 * POST /api/setup-projects/:id/issues
 */
router.post('/setup-projects/:id/issues', jwtMiddleware, controller.createIssue);

/**
 * PATCH /api/setup-issues/:issueId
 */
router.patch('/setup-issues/:issueId', jwtMiddleware, controller.updateIssue);

/**
 * Audit
 * GET /api/setup-audit?entity_type=PROJECT|STEP|ISSUE&entity_id=
 * 또는 GET /api/setup-projects/:id/audit (프로젝트 기준 전체)
 */
router.get('/setup-audit', jwtMiddleware, controller.listAudit);
router.get('/setup-projects/:id/audit', jwtMiddleware, controller.listProjectAudit);

module.exports = router;
