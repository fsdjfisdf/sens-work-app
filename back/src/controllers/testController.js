const testDao = require('../dao/testDao');

exports.getQuestions = async (req, res) => {
  const { equipment_type, level } = req.query;
  try {
    const questions = await testDao.getQuestions(equipment_type, level);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: '문제 로드 중 오류 발생', error });
  }
};

exports.submitTest = async (req, res) => {
  const user_id = req.user.id; // JWT 미들웨어에서 user.id 제공
  const { equipment_type, level, answers } = req.body;

  try {
    const result = await testDao.gradeAndSaveTest(user_id, equipment_type, level, answers);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: '시험 저장 중 오류 발생', error });
  }
};

exports.getTestResults = async (req, res) => {
  const user_id = req.user.id;
  try {
    const results = await testDao.getTestResults(user_id);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: '시험 결과 조회 중 오류 발생', error });
  }
};