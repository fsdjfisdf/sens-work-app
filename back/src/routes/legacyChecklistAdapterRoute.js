'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('../../config/jwtMiddleware');
const legacyConfig = require('../config/legacyChecklistAdapterConfig');
const ctrl = require('../controllers/legacyChecklistAdapterController');

for (const mapping of legacyConfig) {
  router.get(mapping.getPath, jwt, ctrl.createGetHandler(mapping));
  router.post(mapping.postPath, jwt, ctrl.createSaveHandler(mapping));
}

module.exports = router;
