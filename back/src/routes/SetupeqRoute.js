const express = require("express");
const router = express.Router();
const setupeqController = require("../controllers/SetupeqController");

// 설비 목록 가져오기
router.get("/", setupeqController.getEquipmentList);

// 특정 설비의 SET UP 진행 상태 가져오기
router.get("/:id", setupeqController.getEquipmentStatus);

// 특정 설비 작업 상태 업데이트
router.patch("/:id", setupeqController.updateEquipment);


module.exports = router;
