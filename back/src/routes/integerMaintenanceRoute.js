const integerMaintenanceController = require("../controllers/integerMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/integer-maintenance", jwtMiddleware, integerMaintenanceController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/integer-maintenance", jwtMiddleware, integerMaintenanceController.getChecklist);

  // 모든 사용자 체크리스트 불러오기
  app.get("/integer-maintenance/all", jwtMiddleware, integerMaintenanceController.getAllChecklists);
};
