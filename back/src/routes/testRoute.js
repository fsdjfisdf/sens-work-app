const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  app.use("/api/test", router);

  router.get("/questions", testController.getQuestions);
  router.post("/submit-test", jwtMiddleware, testController.submitTest);  // ✅ 인증 적용
  router.get("/test-results", jwtMiddleware, testController.getTestResults);
  router.post('/add-question', jwtMiddleware, testController.addQuestion);
  router.get("/all-test-results", jwtMiddleware, testController.getAllTestResults);
};
