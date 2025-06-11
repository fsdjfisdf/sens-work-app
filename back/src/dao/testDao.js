const { pool } = require('../../config/database');

exports.getQuestionsByTypeAndLevel = async (equipment, level) => {
  const conn = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await conn.query(
      `SELECT * FROM test_questions WHERE equipment_type = ? AND level = ?`,
      [equipment, level]
    );
    return rows;
  } finally {
    conn.release();
  }
};

exports.getCorrectOption = async (questionId) => {
  const conn = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await conn.query(
      `SELECT correct_option FROM test_questions WHERE id = ?`,
      [questionId]
    );
    return rows[0].correct_option;
  } finally {
    conn.release();
  }
};

exports.saveResult = async (userId, equipment, level, questionId, selectedOption, isCorrect) => {
  const conn = await pool.getConnection(async conn => conn);
  try {
    await conn.query(
      `INSERT INTO test_results (user_id, equipment_type, level, question_id, selected_option, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, equipment, level, questionId, selectedOption, isCorrect]
    );
  } finally {
    conn.release();
  }
};

exports.insertQuestion = async (questionData) => {
  const conn = await pool.getConnection(async conn => conn);
  try {
    await conn.query(
      `INSERT INTO test_questions (equipment_type, level, question, option1, option2, option3, option4, correct_option)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionData.equipment_type,
        questionData.level,
        questionData.question,
        questionData.option1,
        questionData.option2,
        questionData.option3,
        questionData.option4,
        questionData.correct_option
      ]
    );
  } finally {
    conn.release();
  }
};