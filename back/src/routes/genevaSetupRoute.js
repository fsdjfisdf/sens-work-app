const ecoliteSetupController = require("../controllers/genevaSetupController");

const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/geneva-setup", jwtMiddleware, genevaSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/geneva-setup", jwtMiddleware, genevaSetupController.getChecklist);

  app.get("/geneva-setup/all", jwtMiddleware, genevaSetupController.getAllChecklists);

  app.get("/geneva-setup/data", jwtMiddleware, genevaSetupController.getGenevaSetupData);
};
