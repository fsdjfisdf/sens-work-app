'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/checklistController');
const jwt = require('../../config/jwtMiddleware');

function requireRole(roles = ['admin', 'editor']) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: '인증 필요' });
    if (!roles.includes(role)) return res.status(403).json({ error: '권한 없음' });
    return next();
  };
}

router.get('/me', jwt, ctrl.getMe);
router.get('/available', jwt, ctrl.getAvailable);
router.get('/template', jwt, ctrl.getTemplate);
router.get('/my', jwt, ctrl.getMyChecklist);
router.put('/my', jwt, ctrl.saveMyChecklist);

router.post('/admin/sync-catalog', jwt, requireRole(), ctrl.syncCatalog);
router.get('/admin/access', jwt, requireRole(), ctrl.getEngineerAccess);
router.put('/admin/access', jwt, requireRole(), ctrl.upsertEngineerAccess);
router.delete('/admin/access/:engineerId/:equipmentGroup', jwt, requireRole(), ctrl.deleteEngineerAccess);

router.get('/admin/requests', jwt, requireRole(['admin']), ctrl.getApprovalQueue);
router.get('/admin/requests/:responseId', jwt, requireRole(['admin']), ctrl.getApprovalRequestDetail);
router.post('/admin/requests/:responseId/decision', jwt, requireRole(['admin']), ctrl.decideApprovalRequest);

module.exports = router;
