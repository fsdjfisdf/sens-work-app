const supraMaintenanceController = require("../controllers/supraMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/save-checklist", jwtMiddleware, supraMaintenanceController.saveChecklist);
};
