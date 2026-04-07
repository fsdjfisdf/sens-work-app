'use strict';

const express = require('express');
const router = express.Router();
const pciController = require('../controllers/pciController');
const auth = require('../middlewares/auth');

router.get('/filters', auth, pciController.getFilterOptions);
router.get('/matrix', auth, pciController.getMatrix);
router.get('/cell-detail', auth, pciController.getCellDetail);
router.get('/engineer/:engineerId', auth, pciController.getEngineerDetail);

router.get('/admin/items', auth, pciController.getAdminItems);
router.put('/admin/items/:pciItemId', auth, pciController.updatePciItem);
router.post('/admin/rebuild', auth, pciController.rebuildRange);

module.exports = router;
