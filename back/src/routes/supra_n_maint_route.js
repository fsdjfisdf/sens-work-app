const express = require("express");
const router = express.Router();
const supraNMaintController = require("../controllers/supra_n_maint_controller");

router.post("/maint-self", supraNMaintController.createMaintSelf);
router.get("/maint-self/:nickname", supraNMaintController.getMaintSelfByNickname);

module.exports = router;
