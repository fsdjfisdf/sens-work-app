const express = require('express');
const router = express.Router();

router.use(require('./noticesRoute')); // 추가된 라우트

module.exports = router;
