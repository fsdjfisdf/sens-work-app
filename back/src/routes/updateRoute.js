const express = require("express");
const router = express.Router();
const updateController = require("../controllers/updateController");

// 업데이트 목록 가져오기
router.get("/", updateController.getUpdates);

// 새로운 업데이트 추가
router.post("/", updateController.addUpdate);

// 특정 업데이트 상세 가져오기
router.get("/:id", updateController.getUpdateById);

// 공지사항 수정
router.put("/:id", updateController.updateUpdate);

module.exports = router;
