const supraxpSetupController = require("../controllers/supraxpSetupController");

const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/supraxp-setup", jwtMiddleware, supraxpSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/supraxp-setup", jwtMiddleware, supraxpSetupController.getChecklist);

  app.get("/supraxp-setup/all", jwtMiddleware, supraxpSetupController.getAllChecklists);

  app.get("/supraxp-setup/data", jwtMiddleware, supraxpSetupController.getSupraxpSetupData);
};
