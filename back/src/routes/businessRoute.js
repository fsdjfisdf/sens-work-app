const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');

// API 엔드포인트 설정
router.get('/', businessController.getBusinessData); // 출장 데이터 조회
router.post('/', businessController.addBusinessData); // 출장 데이터 추가
router.put('/:id', businessController.updateBusinessData); // 출장 데이터 수정
router.delete('/:id', businessController.deleteBusinessData); // 출장 데이터 삭제

module.exports = router;
