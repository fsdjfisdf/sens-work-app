/**
 * analyticsRoute.js
 * express.js: const analyticsRoute = require('./src/routes/analyticsRoute'); app.use('/analytics', analyticsRoute);
 */
'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analyticsController');
const jwt     = require('../../config/jwtMiddleware');

router.get('/filters',            jwt, ctrl.getFilters);
router.get('/headcount',          jwt, ctrl.getHeadCount);
router.get('/hr-distribution',    jwt, ctrl.getHRDistribution);
router.get('/level-distribution', jwt, ctrl.getLevelDistribution);
router.get('/level-achievement',  jwt, ctrl.getLevelAchievement);
router.get('/level-trend',        jwt, ctrl.getLevelTrend);
router.get('/capability',         jwt, ctrl.getCapability);
router.get('/eq-capability',      jwt, ctrl.getEqCapability);
router.get('/mpi',                jwt, ctrl.getMPI);
router.get('/worklog-stats',      jwt, ctrl.getWorklogStats);
router.get('/engineer-info',      jwt, ctrl.getEngineerInfo);
router.get('/export/excel',       jwt, ctrl.getExportData);
router.post('/engineer',          jwt, ctrl.addEngineer);

module.exports = router;
