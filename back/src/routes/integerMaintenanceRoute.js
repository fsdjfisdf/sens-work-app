const integermaintenanceController = require("../controllers/integerMaintController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 불러오기
  app.get("/integer-maintenance", jwtMiddleware, integermaintenanceController.getChecklist);

  // 체크리스트 저장
  app.post("/integer-maintenance", jwtMiddleware, integermaintenanceController.saveChecklist);

  // 모든 체크리스트 불러오기
  app.get("/integer-maintenance/all", jwtMiddleware, integermaintenanceController.getAllChecklists);
};
