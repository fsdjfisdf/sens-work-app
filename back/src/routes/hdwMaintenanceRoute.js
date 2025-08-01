const hdwmaintenanceController = require("../controllers/hdwMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 불러오기
  app.get("/hdw-maintenance", jwtMiddleware, hdwmaintenanceController.getChecklist);

  // 체크리스트 저장
  app.post("/hdw-maintenance", jwtMiddleware, hdwmaintenanceController.saveChecklist);

  // 모든 체크리스트 불러오기
  app.get("/hdw-maintenance/all", jwtMiddleware, hdwmaintenanceController.getAllChecklists);
};

