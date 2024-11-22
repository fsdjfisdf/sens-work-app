const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
    res.send('WebSocket server is running');
});

module.exports = router;
