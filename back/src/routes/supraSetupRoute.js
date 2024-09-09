const supraSetupController = require("../controllers/supraSetupController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/supra-setup", jwtMiddleware, supraSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/supra-setup", jwtMiddleware, supraSetupController.getChecklist);

  app.get("/supra-setup/all", jwtMiddleware, supraSetupController.getAllChecklists);
};
