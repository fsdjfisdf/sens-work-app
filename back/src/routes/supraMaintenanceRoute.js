const supraMaintenanceController = require("../controllers/supraMaintenanceController");
const jwtMiddleware = require("../../config/jwtMiddleware");

module.exports = function (app) {
  // 체크리스트 저장
  app.post("/supra-maintenance", jwtMiddleware, supraMaintenanceController.saveChecklist);

  // 체크리스트 불러오기
  app.get("/supra-maintenance", jwtMiddleware, supraMaintenanceController.getChecklist);

    // 모든 사용자 체크리스트 불러오기 (새로 추가된 엔드포인트)
    app.get("/supra-maintenance/all", jwtMiddleware, supraMaintenanceController.getAllChecklists);

      // 결재 요청 추가
  app.post("/supra-maintenance/request-approval", jwtMiddleware, supraMaintenanceController.requestApproval);

  // 결재 승인 또는 반려 처리
  app.post("/supra-maintenance/approve", jwtMiddleware, supraMaintenanceController.approveChecklist);

  app.get("/supra-maintenance/approvals", jwtMiddleware, supraMaintenanceController.getApprovalRequests);

};