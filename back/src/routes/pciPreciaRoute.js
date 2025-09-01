// src/routes/pciSupraXPRoute.js
const express = require("express");
const router = express.Router();
const ctrl = require("../pci/precia/pciController");

// 개별 작업자
// GET /api/pci/supra-xp/worker/정현우?start_date=2025-01-01&end_date=2025-08-31
router.get("/worker/:name", ctrl.getWorkerPci);

// 쿼리 파라미터 사용도 허용: /api/pci/supra-xp/worker?name=정현우
router.get("/worker", ctrl.getWorkerPci);

// 전체 요약 (옵션)
// GET /api/pci/supra-xp/summary?start_date=...&end_date=...&limit=100
router.get("/summary", ctrl.getAllSummary);

// 기존 라우트에 아래 두 줄 추가
router.get("/workers", ctrl.getWorkerNames);   // 작업자 이름만
router.get("/matrix", ctrl.getMatrix);         // 한 방에 매트릭스
// 항목 단위 상세(산출 근거)
router.get("/worker/:name/item/:item", ctrl.getWorkerItemBreakdown);



module.exports = router;
