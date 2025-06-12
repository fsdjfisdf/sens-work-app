// src/routes/testRoute.js
const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");

module.exports = function (app) {
  app.use("/api/test", router); // ✅ 여기서만 router 사용

  router.get("/questions", testController.getQuestions);
  router.post("/submit-test", testController.submitTest);
  router.get("/test-results", testController.getTestResults);
};
