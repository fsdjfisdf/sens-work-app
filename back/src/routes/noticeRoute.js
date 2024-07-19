const express = require("express");
const noticeController = require("../controller/noticeController");
const jwtMiddleware = require("../config/jwtMiddleware");

const router = express.Router();

router.get("/notices", jwtMiddleware, noticeController.getAllNotices);
router.get("/notices/:id", jwtMiddleware, noticeController.getNoticeById);
router.post("/notices", jwtMiddleware, noticeController.createNotice);
router.put("/notices/:id", jwtMiddleware, noticeController.updateNotice);
router.delete("/notices/:id", jwtMiddleware, noticeController.deleteNotice);

module.exports = router;
