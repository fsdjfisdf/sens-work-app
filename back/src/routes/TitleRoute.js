// src/routes/TitleRoute.js

const express = require('express');
const titleController = require('../controllers/TitleController');

const router = express.Router();

// 제목과 이유, 이름을 저장하는 API 경로
router.post('/save-title', titleController.saveTitle); // titleController.saveTitle가 undefined이면 이 오류가 발생합니다.

module.exports = (app) => {
    app.use('/api', router);
};
