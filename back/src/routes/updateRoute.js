const express = require("express");
const updateController = require("../controllers/updateController");

module.exports = function (app) {
    const router = express.Router();

    router.get("/", updateController.getUpdates); // 업데이트 리스트 가져오기
    router.post("/", updateController.addUpdate); // 새로운 업데이트 추가

    app.use("/api/updates", router); // 라우트를 /api/updates 경로에 연결
};
