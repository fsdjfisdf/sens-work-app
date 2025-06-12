const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const jwtMiddleware = require("../../jwtMiddleware"); // ✅ JWT 인증

module.exports = function (app) {
  app.use("/api/test", router);

  router.get("/questions", testController.getQuestions);
  router.post("/submit-test", jwtMiddleware, testController.submitTest);  // ✅ 여기에 JWT 미들웨어 추가
  router.get("/test-results", jwtMiddleware, testController.getTestResults);
};
