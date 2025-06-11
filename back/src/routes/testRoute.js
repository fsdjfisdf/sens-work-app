const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/questions', testController.getQuestions);
router.post('/submit', testController.submitAnswers);
router.post('/questions', testController.addQuestion);

module.exports = router;