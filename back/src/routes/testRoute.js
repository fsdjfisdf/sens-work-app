const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const jwtMiddleware = require("../../jwtMiddleware"); // ✅ 이 줄이 반드시 있어야 함

module.exports = function (app) {
  app.use("/api/test", router);

  router.get("/questions", testController.getQuestions);
  router.post("/submit-test", jwtMiddleware, testController.submitTest);  // ✅ 인증 적용
  router.get("/test-results", jwtMiddleware, testController.getTestResults);
};
