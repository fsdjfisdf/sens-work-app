const genevamaintenanceController = require("../controllers/genevaMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 불러오기
  app.get("/geneva-maintenance", jwtMiddleware, genevamaintenanceController.getChecklist);

  // 체크리스트 저장
  app.post("/geneva-maintenance", jwtMiddleware, genevamaintenanceController.saveChecklist);

  // 모든 체크리스트 불러오기
  app.get("/geneva-maintenance/all", jwtMiddleware, genevamaintenanceController.getAllChecklists);
};
