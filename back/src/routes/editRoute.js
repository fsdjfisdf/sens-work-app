const express = require("express");
const router = express.Router();
const editController = require("../controllers/editController"); //

// 특정 작업 이력 조회 API
router.get("/logs/:id", editController.getWorkLogById);

// 작업 이력 수정 API
router.put("/logs/:id", editController.updateWorkLog);

module.exports = router;
