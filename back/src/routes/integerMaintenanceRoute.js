const integerMaintenanceController = require("../controllers/integerMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 불러오기
  app.get("/integer-maintenance", jwtMiddleware, integerMaintenanceController.getChecklist);

  // 체크리스트 저장
  app.post("/integer-maintenance", jwtMiddleware, integerMaintenanceController.saveChecklist);

  // 모든 체크리스트 불러오기
  app.get("/integer-maintenance/all", jwtMiddleware, integerMaintenanceController.getAllChecklists);
};
