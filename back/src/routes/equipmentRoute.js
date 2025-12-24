// back/src/routes/equipmentRoute.js
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// 장비 목록 조회 (검색)
router.get('/equipment', equipmentController.getEquipments);

// 장비 추가
router.post('/equipment', equipmentController.addEquipment);

// 설비 전체 정보 수정 (EDIT)
router.put('/equipment/:eqname', equipmentController.updateEquipment);

// INFO만 수정
router.post('/equipment/update-info', equipmentController.updateEquipmentInfo);

// 🔥 설비별 작업 이력 조회 (추가)
router.get('/equipment/:eqname/logs', equipmentController.getEquipmentHistory);

// 라우터 등록
module.exports = (app) => {
  app.use('/api', router);
};
