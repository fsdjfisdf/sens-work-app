const supraMaintenanceController = require("../controllers/supraMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/supraxp-maintenance", jwtMiddleware, supraxpMaintenanceController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/supraxp-maintenance", jwtMiddleware, supraxpMaintenanceController.getChecklist);

    // 모든 사용자 체크리스트 불러오기 (새로 추가된 엔드포인트)
    app.get("/supraxp-maintenance/all", jwtMiddleware, supraxpMaintenanceController.getAllChecklists);

};