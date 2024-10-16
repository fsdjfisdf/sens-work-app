const ecoliteSetupController = require("../controllers/ecoliteSetupController");

const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/ecolite-setup", jwtMiddleware, ecoliteSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/ecolite-setup", jwtMiddleware, ecoliteSetupController.getChecklist);

  app.get("/ecolite-setup/all", jwtMiddleware, ecoliteSetupController.getAllChecklists);

  app.get("/ecolite-setup/data", jwtMiddleware, ecoliteSetupController.getEcoliteSetupData);
};
