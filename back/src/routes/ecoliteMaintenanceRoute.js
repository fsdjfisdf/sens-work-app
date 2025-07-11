const ecolitemaintenanceController = require("../controllers/ecoliteMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 불러오기
  app.get("/ecolite-maintenance", jwtMiddleware, ecolitemaintenanceController.getChecklist);

  // 체크리스트 저장
  app.post("/ecolite-maintenance", jwtMiddleware, ecolitemaintenanceController.saveChecklist);

  // 모든 체크리스트 불러오기
  app.get("/ecolite-maintenance/all", jwtMiddleware, ecolitemaintenanceController.getAllChecklists);
};
