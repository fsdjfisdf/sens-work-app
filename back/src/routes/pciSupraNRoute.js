// src/routes/pciSupraNRoute.js
const express = require("express");
const router = express.Router();
const ctrl = require("../pci/supran/pciController");

// 개별 작업자
// GET /api/pci/supra-n/worker/정현우?start_date=2025-01-01&end_date=2025-08-31
router.get("/worker/:name", ctrl.getWorkerPci);

// 쿼리 파라미터 사용도 허용: /api/pci/supra-n/worker?name=정현우
router.get("/worker", ctrl.getWorkerPci);

// 전체 요약 (옵션)
// GET /api/pci/supra-n/summary?start_date=...&end_date=...&limit=100
router.get("/summary", ctrl.getAllSummary);

module.exports = router;
