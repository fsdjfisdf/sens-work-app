const { pool } = require('../../config/database');

exports.getQuestions = async (equipment_type, level) => {
  const [rows] = await pool.query(
    'SELECT id, question_text, choice_1, choice_2, choice_3, choice_4 FROM questions WHERE equipment_type = ? AND level = ?',
    [equipment_type, level]
  );
  return rows;
};

exports.gradeAndSaveTest = async (user_id, equipment_type, level, answers) => {
  try {
    const questionIds = answers.map(a => a.question_id);
    const [questions] = await pool.query(
      `SELECT id, correct_answer FROM questions WHERE id IN (?)`,
      [questionIds]
    );

    let score = 0;
    const details = answers.map(answer => {
      const correct = questions.find(q => q.id === answer.question_id)?.correct_answer === answer.user_answer;
      if (correct) score++;
      return {
        question_id: answer.question_id,
        user_answer: answer.user_answer,
        correct
      };
    });

    const result = {
      user_id,
      equipment_type,
      level,
      score,
      total_questions: answers.length,
      details: JSON.stringify(details)
    };

    console.log(">>> INSERT 데이터:", [user_id, equipment_type, level, score, answers.length, result.details]);

    await pool.query(
      `INSERT INTO test_results (user_id, equipment_type, level, score, total_questions, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, equipment_type, level, score, answers.length, result.details]
    );

    return { score, total_questions: answers.length };
  } catch (err) {
    console.error("🔥 INSERT 실패:", err);
    throw err; // 컨트롤러로 던지기
  }
};

exports.getTestResults = async (user_id) => {
  const [rows] = await pool.query(
    'SELECT id, equipment_type, level, score, total_questions, test_date FROM test_results WHERE user_id = ? ORDER BY test_date DESC',
    [user_id]
  );
  return rows;
};
