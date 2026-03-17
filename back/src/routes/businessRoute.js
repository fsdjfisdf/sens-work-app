const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');

router.get('/', businessController.getBusinessData);
router.post('/', businessController.addBusinessData);
router.put('/:id', businessController.updateBusinessData);
router.delete('/:id', businessController.deleteBusinessData);

module.exports = router;
