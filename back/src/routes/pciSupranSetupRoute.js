// src/routes/pciSupraNSetupRoute.js
const express = require("express");
const router = express.Router();
const ctrl = require("../pci/supran_setup/pciController");

// GET /api/pci/supran-setup/worker/홍길동?start_date=2025-01-01&end_date=2025-08-31
router.get("/worker/:name", ctrl.getWorkerPci);
router.get("/worker", ctrl.getWorkerPci);

// 요약/목록/매트릭스
router.get("/summary", ctrl.getAllSummary);
router.get("/workers", ctrl.getWorkerNames);
router.get("/matrix", ctrl.getMatrix);

// 상세(한 사람 + 한 카테고리)
router.get("/worker/:name/item/:item", ctrl.getWorkerItemBreakdown);

module.exports = router;
