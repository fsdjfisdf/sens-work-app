const supraSetupController = require("../controllers/supraSetupController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/supra-setup", jwtMiddleware, supraSetupController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/supra-setup", jwtMiddleware, supraSetupController.getChecklist);

  app.get("/supra-setup/all", jwtMiddleware, supraSetupController.getAllChecklists);

  app.get("/supra-setup/data", jwtMiddleware, supraSetupController.getSupraSetupData);

  app.post('/supra-setup/approve/:name', jwtMiddleware, supraSetupController.approveChecklist);

  app.post("/supra-setup", jwtMiddleware, supraSetupController.saveChecklist);

  // 결재 대기 항목 조회
  app.get('/supra-setup/approvals/pending', jwtMiddleware, supraSetupController.getPendingApprovals);
  console.log('Controller Functions:', supraSetupController);
  console.log('getPendingApprovals:', supraSetupController.getPendingApprovals);

};
