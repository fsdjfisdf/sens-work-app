
const express = require("express");
const router = express.Router();
const ctrl = require("../pci/integer_setup/pciController");

router.get("/worker/:name", ctrl.getWorkerPci);
router.get("/worker", ctrl.getWorkerPci);

router.get("/summary", ctrl.getAllSummary);
router.get("/workers", ctrl.getWorkerNames);
router.get("/matrix", ctrl.getMatrix);

// 카테고리 단위 산출 근거
router.get("/worker/:name/item/:item", ctrl.getWorkerItemBreakdown);

module.exports = router;
