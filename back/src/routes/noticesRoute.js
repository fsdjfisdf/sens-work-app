const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/noticesController');

router.get('/notices', noticesController.getNotices);
router.post('/notices', noticesController.createNotice);
router.put('/notices/:id', noticesController.updateNotice);
router.delete('/notices/:id', noticesController.deleteNotice);

module.exports = router;
