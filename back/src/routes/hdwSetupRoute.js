const hdwSetupController = require("../controllers/hdwSetupController");

const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/hdw-setup", jwtMiddleware, hdwSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/hdw-setup", jwtMiddleware, hdwSetupController.getChecklist);

  app.get("/hdw-setup/all", jwtMiddleware, hdwSetupController.getAllChecklists);

  app.get("/hdw-setup/data", jwtMiddleware, hdwSetupController.getHdwSetupData);
};
