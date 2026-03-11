/**
 * analyticsRoute.js
 * express.js: const analyticsRoute = require('./src/routes/analyticsRoute'); app.use('/analytics', analyticsRoute);
 */
'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analyticsController');
const jwt     = require('../../config/jwtMiddleware');

function pickRole(req) {
  const t = req.verifiedToken || req.decodedToken || req.decoded || req.user || req.auth || {};
  return (t.role || t.ROLE || t.user_role || '').toString().toLowerCase();
}
function isAdmin(req) {
  const t = req.verifiedToken || req.decodedToken || req.decoded || req.user || req.auth || {};
  const role = pickRole(req);
  return role === 'admin' || role === 'administrator' || role === 'super' ||
         t.is_admin === 1 || t.isAdmin === true || t.admin === true;
}
function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
}

// All analytics endpoints: JWT + admin
router.use(jwt, requireAdmin);

router.get('/filters',            ctrl.getFilters);
router.get('/headcount',          ctrl.getHeadCount);
router.get('/hr-distribution',    ctrl.getHRDistribution);
router.get('/level-distribution', ctrl.getLevelDistribution);
router.get('/level-achievement',  ctrl.getLevelAchievement);
router.get('/level-trend',        ctrl.getLevelTrend);
router.get('/capability',         ctrl.getCapability);
router.get('/eq-capability',      ctrl.getEqCapability);
router.get('/worklog-stats',      ctrl.getWorklogStats);
router.get('/engineer-info',      ctrl.getEngineerInfo);
router.get('/export/excel',       ctrl.getExportData);

router.post('/engineer',          ctrl.addEngineer);
router.put('/engineer/:id',       ctrl.updateEngineer);
router.post('/engineer/resign',   ctrl.resignEngineer);
router.post('/engineer/reinstate',ctrl.reinstateEngineer);

module.exports = router;
