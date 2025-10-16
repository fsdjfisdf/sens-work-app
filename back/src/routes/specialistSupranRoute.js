const express = require("express");
const router = express.Router();
const ctrl = require("../specialist/supran/specialistSupranController");
const jwtMiddleware = require("../../config/jwtMiddleware");

// 관리자만
function requireAdmin(req, res, next){
  // jwtMiddleware가 req.verifiedToken 또는 req.user 로 역할을 심어주는 구조라면 아래 중 하나에 맞춰 쓰세요.
  const role = req.user?.role || req.verifiedToken?.role || req.headers["user-role"];
  if (role === "admin") return next();
  return res.status(403).json({ message: "forbidden" });
}

// 작업자(열) 목록
router.get("/workers", jwtMiddleware, requireAdmin, ctrl.getWorkers);

// 특정 작업자 전 항목
router.get("/edu", jwtMiddleware, requireAdmin, ctrl.getEducationByWorker);

// 셀 수정
router.patch("/cell", jwtMiddleware, requireAdmin, ctrl.setCell);

module.exports = router;
