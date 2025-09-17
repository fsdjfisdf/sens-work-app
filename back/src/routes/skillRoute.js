// back/src/routes/skillRoute.js (발췌)
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/skillController');
const jwtMiddleware = require('../../config/jwtMiddleware');

// 목록/상세
router.get('/skill/levels', jwtMiddleware, ctrl.getAllCapabilities);
router.get('/skill/levels/:id', jwtMiddleware, ctrl.getCapabilityByIdentity);

// ✅ 엑셀 내보내기
router.get('/skill/levels/export', jwtMiddleware, ctrl.exportExcel);

module.exports = (app) => {
  app.use('/api', router);
};
