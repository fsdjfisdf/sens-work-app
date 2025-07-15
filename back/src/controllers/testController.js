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
  const user_id = req.verifiedToken.nickname;
  const { equipment_type, level, answers } = req.body;
  

  try {
    const result = await testDao.gradeAndSaveTest(user_id, equipment_type, level, answers);
    res.status(200).json({
    score: result.score,
    total_questions: result.total_questions,
    details: result.details
    });
  } catch (error) {
    console.error("🔥 시험 저장 중 오류:", error); // 에러 로그 추가
    res.status(500).json({ message: '시험 저장 중 오류 발생', error });
  }
};

exports.getTestResults = async (req, res) => {
  const user_id = req.verifiedToken.userIdx;
  try {
    const results = await testDao.getTestResults(user_id);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: '시험 결과 조회 중 오류 발생', error });
  }
};

exports.addQuestion = async (req, res) => {
  const {
    equipment_type,
    level,
    question_text,
    choice_1,
    choice_2,
    choice_3,
    choice_4,
    correct_answer,
    explanation
  } = req.body;

  try {
    await testDao.addQuestion({
      equipment_type,
      level,
      question_text,
      choice_1,
      choice_2,
      choice_3,
      choice_4,
      correct_answer,
      explanation
    });

    res.status(200).json({ message: '문제가 성공적으로 추가되었습니다.' });
  } catch (error) {
    console.error("🔥 문제 추가 중 오류:", error);
    res.status(500).json({ message: '문제 추가 중 오류 발생', error });
  }
};

exports.getTestResults = async (req, res) => {
  const user_id = req.verifiedToken.userIdx; // 또는 nickname 사용 시 조정
  try {
    const results = await testDao.getTestResults(user_id);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: '시험 결과 조회 중 오류 발생', error });
  }
};