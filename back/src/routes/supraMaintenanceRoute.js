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

  app.get("/supra-maintenance/approvals/:id", jwtMiddleware, supraMaintenanceController.getApprovalDetails);


  app.get('/user-info', jwtMiddleware, async (req, res) => {
    try {
      const user = await userDao.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ nickname: user.nickname, role: user.role });
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ message: 'Error fetching user info' });
    }
  });

};