const preicamaintenanceController = require("../controllers/preciaMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 불러오기
  app.get("/preica-maintenance", jwtMiddleware, preciamaintenanceController.getChecklist);

  // 체크리스트 저장
  app.post("/precia-maintenance", jwtMiddleware, preciamaintenanceController.saveChecklist);

  // 모든 체크리스트 불러오기
  app.get("/precia-maintenance/all", jwtMiddleware, preciamaintenanceController.getAllChecklists);
};
