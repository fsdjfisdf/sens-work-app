// back/src/routes/skillRoute.js
const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

/**
 * 목록(요약)
 * GET /api/skill/levels
 */
router.get('/skill/levels', skillController.getAllCapabilities);

/**
 * 상세
 * - GET /api/skill/levels/:id          -> ID로 단건
 * - GET /api/skill/levels?name=정현우   -> 이름으로 조회(부분 일치)
 */
router.get('/skill/levels/:id', skillController.getCapabilityByIdentity);
router.get('/skill/levels',       skillController.getCapabilityByIdentity);

module.exports = (app) => {
  app.use('/api', router);
};
