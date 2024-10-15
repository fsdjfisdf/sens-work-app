const express = require('express');
const router = express.Router();
const integerMaintCountController = require('../controllers/integerMaintCountController');

// POST 요청으로 데이터를 받는 엔드포인트 추가
router.post('/integer-maintenance/aggregated', (req, res) => {
    try {
        const aggregatedData = req.body; // 클라이언트에서 보낸 데이터를 가져옴
        console.log('Received aggregated data:', aggregatedData);
        // 데이터를 처리하는 로직을 추가합니다 (DB 저장 등)

        res.status(200).send('Aggregated data saved successfully');
    } catch (err) {
        console.error('Error processing aggregated data:', err);
        res.status(500).send('Error processing aggregated data');
    }
});

module.exports = router;
