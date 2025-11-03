// back/routes/aiRagRoute.js
const express = require('express');
const router = express.Router();
const ctrl = require('../src/controllers/aiRagController'); // 경로 주의

router.post('/ask', ctrl.ask);

module.exports = router;
