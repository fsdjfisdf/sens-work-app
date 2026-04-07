'use strict';

const express = require('express');
const router = express.Router();
const pciController = require('../controllers/pciController');

function resolveAuthMiddleware() {
  const candidates = [
    '../../config/jwtMiddleware',
    '../middlewares/auth',
    '../middleware/auth',
    '../../middlewares/auth',
  ];

  for (const path of candidates) {
    try {
      const mod = require(path);
      if (typeof mod === 'function') return mod;
      if (typeof mod?.jwtMiddleware === 'function') return mod.jwtMiddleware;
      if (typeof mod?.verifyToken === 'function') return mod.verifyToken;
      if (typeof mod?.auth === 'function') return mod.auth;
    } catch (_) {}
  }
  return (req, res, next) => next();
}

const auth = resolveAuthMiddleware();

router.get('/filters', auth, pciController.getFilterOptions);
router.get('/matrix', auth, pciController.getMatrix);
router.get('/export', auth, pciController.exportMatrix);
router.get('/cell-detail', auth, pciController.getCellDetail);
router.get('/engineer/:engineerId', auth, pciController.getEngineerDetail);
router.get('/admin/items', auth, pciController.getAdminItems);
router.put('/admin/items/:pciItemId', auth, pciController.updatePciItem);
router.post('/admin/rebuild', auth, pciController.rebuildRange);
router.get('/admin/manual-credits', auth, pciController.getManualCredits);
router.post('/admin/manual-credits', auth, pciController.createManualCredit);
router.put('/admin/manual-credits/:id', auth, pciController.updateManualCredit);
router.delete('/admin/manual-credits/:id', auth, pciController.deleteManualCredit);
router.post('/admin/capability-score/sync', auth, pciController.syncCapabilityScore);
router.post('/admin/monthly-capability/sync', auth, pciController.syncMonthlyCapability);

module.exports = router;
