// src/routes/pciSupraNRoute.js
const express = require("express");
const router = express.Router();
const ctrl = require("../pci/supran/pciController");

router.get("/worker/:name", ctrl.getWorkerPci);
router.get("/worker", ctrl.getWorkerPci);
router.get("/summary", ctrl.getAllSummary);

router.get("/filters", ctrl.getUserFilterOptions);

router.get("/workers", ctrl.getWorkerNames);
router.get("/matrix", ctrl.getMatrix);
router.get("/worker/:name/item/:item", ctrl.getWorkerItemBreakdown);

module.exports = router;
