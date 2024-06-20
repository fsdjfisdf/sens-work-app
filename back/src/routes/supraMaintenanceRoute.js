const supraMaintenanceController = require("../controllers/supraMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/supra-maintenance", jwtMiddleware, supraMaintenanceController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/supra-maintenance", jwtMiddleware, supraMaintenanceController.getChecklist);
};
