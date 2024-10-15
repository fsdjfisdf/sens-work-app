const integerSetupController = require("../controllers/integerSetupController");

const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/integer-setup", jwtMiddleware, integerSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/integer-setup", jwtMiddleware, integerSetupController.getChecklist);

  app.get("/integer-setup/all", jwtMiddleware, integerSetupController.getAllChecklists);

  app.get("/integer-setup/data", jwtMiddleware, integerSetupController.getIntegerSetupData);
};
