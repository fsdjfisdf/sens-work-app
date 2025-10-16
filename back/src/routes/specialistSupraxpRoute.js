const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../../config/jwtMiddleware");
const ctrl = require("../specialist/supraxp/specialistSupraxpController");

// Admin gate
function requireAdmin(req, res, next){
  const role = req.user?.role || req.user?.ROLE || req.user?.Role;
  if (role === "admin") return next();
  return res.status(403).json({ message: "forbidden_admin_only" });
}

router.use(jwtMiddleware);

router.get("/workers", requireAdmin, ctrl.getWorkers);
router.get("/edu",     requireAdmin, ctrl.getEducationByWorker);
router.patch("/cell",  requireAdmin, ctrl.patchCell);
router.post("/column", requireAdmin, ctrl.ensureWorkerColumn);
router.post("/item",   requireAdmin, ctrl.ensureItemRow);

module.exports = router;   // ← 이 줄 꼭 있어야 함
