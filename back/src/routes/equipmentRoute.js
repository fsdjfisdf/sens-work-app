// back/src/routes/equipmentRoute.js
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// 장비 목록 조회 (검색 포함)
router.get('/equipment', equipmentController.getEquipments);

// 장비 추가
router.post('/equipment', equipmentController.addEquipment);

// 장비 전체 정보 수정 (edit용)
router.put('/equipment/:eqname', equipmentController.updateEquipment);

// INFO(특이사항)만 따로 수정하고 싶을 때
router.post('/equipment/update-info', equipmentController.updateEquipmentInfo);

// 라우터 등록은 딱 한 번만
module.exports = (app) => {
  app.use('/api', router);
};
