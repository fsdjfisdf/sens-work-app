// src/routes/pciPreciaSetupRoute.js
const express = require("express");
const router = express.Router();
const ctrl = require("../pci/ecolite_setup/pciController");

// GET /api/pci/precia-setup/worker/정현우?start_date=2025-01-01&end_date=2025-08-31
router.get("/worker/:name", ctrl.getWorkerPci);
router.get("/worker", ctrl.getWorkerPci);

router.get("/summary", ctrl.getAllSummary);
router.get("/workers", ctrl.getWorkerNames);
router.get("/matrix", ctrl.getMatrix);

// 카테고리 단위 산출 근거
router.get("/worker/:name/item/:item", ctrl.getWorkerItemBreakdown);

module.exports = router;
