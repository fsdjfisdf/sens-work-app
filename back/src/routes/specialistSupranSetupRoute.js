const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../../config/jwtMiddleware");
const ctrl = require("../specialist/supran_setup/specialistSupranSetupController");

// 인증 + 관리자
function requireAdmin(req, res, next){
  try{
    const role = req.user?.role || req.user?.ROLE || req.user?.Role;
    if (role === 'admin') return next();
    return res.status(403).json({ message: "forbidden_admin_only" });
  }catch(e){
    return res.status(401).json({ message: "unauthorized" });
  }
}

router.use(jwtMiddleware);

// 조회
router.get("/workers", requireAdmin, ctrl.getWorkers);
router.get("/edu",     requireAdmin, ctrl.getEducationByWorker); // ?worker=정현우

// 수정
router.patch("/cell",  requireAdmin, ctrl.patchCell);

// (선택) 신규 작업자 행 보장
router.post("/row",    requireAdmin, ctrl.ensureWorkerRow);

module.exports = router;
