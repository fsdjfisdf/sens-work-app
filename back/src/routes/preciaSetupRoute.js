const preciaSetupController = require("../controllers/preciaSetupController");

const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/precia-setup", jwtMiddleware, preciaSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/precia-setup", jwtMiddleware, preciaSetupController.getChecklist);

  app.get("/precia-setup/all", jwtMiddleware, preciaSetupController.getAllChecklists);

  app.get("/precia-setup/data", jwtMiddleware, preciaSetupController.getPreciaSetupData);
};
