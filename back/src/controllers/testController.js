const testDao = require('../dao/testDao');

exports.getQuestions = async (req, res) => {
  const { equipment, level } = req.query;
  try {
    const questions = await testDao.getQuestionsByTypeAndLevel(equipment, level);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitAnswers = async (req, res) => {
  const { userId, equipment, level, answers } = req.body; // answers: [{ questionId, selectedOption }]
  try {
    for (const ans of answers) {
      const correctOption = await testDao.getCorrectOption(ans.questionId);
      const isCorrect = (ans.selectedOption === correctOption);
      await testDao.saveResult(userId, equipment, level, ans.questionId, ans.selectedOption, isCorrect);
    }
    res.json({ message: '시험 결과 저장 완료' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addQuestion = async (req, res) => {
  const questionData = req.body;
  try {
    await testDao.insertQuestion(questionData);
    res.json({ message: '문제 추가 완료' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};