const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../../config/jwtMiddleware"); // 경로는 프로젝트에 맞게 조정
const ctrl = require("../specialist/integer/specialistController");

// 관리자 확인 미들웨어 (jwtMiddleware가 req.user 주입한다고 가정)
function requireAdmin(req, res, next){
  try{
    const role = req.user?.role || req.user?.ROLE || req.user?.Role;
    if (role === 'admin') return next();
    return res.status(403).json({ message: "forbidden_admin_only" });
  }catch(e){
    return res.status(401).json({ message: "unauthorized" });
  }
}

// 전체 라우트에 인증
router.use(jwtMiddleware);

// 조회
router.get("/workers", requireAdmin, ctrl.getWorkers);
router.get("/edu",     requireAdmin, ctrl.getEducationByWorker); // ?worker=정현우

// 셀 수정 (Set/Inc/Dec)
router.patch("/cell",  requireAdmin, ctrl.patchCell);

// (선택) 신규 작업자 컬럼 생성만 따로
router.post("/column", requireAdmin, ctrl.ensureWorkerColumn);

// (선택) 신규 항목 행 생성만 따로
router.post("/item",   requireAdmin, ctrl.ensureItemRow);

module.exports = router;
