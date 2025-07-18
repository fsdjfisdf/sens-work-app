const { pool } = require('../../config/database');

exports.getQuestions = async (equipment_type, level) => {
  const [rows] = await pool.query(
    `SELECT id, question_text, choice_1, choice_2, choice_3, choice_4 
     FROM questions 
     WHERE equipment_type = ? AND level = ?
     ORDER BY RAND()
     LIMIT 50`,
    [equipment_type, level]
  );
  return rows;
};

exports.gradeAndSaveTest = async (user_id, equipment_type, level, answers) => {
  const questionIds = answers.map(a => a.question_id);
const [questions] = await pool.query(
  `SELECT id, question_text, choice_1, choice_2, choice_3, choice_4, correct_answer, explanation 
   FROM questions WHERE id IN (?)`,
  [questionIds]
);

let score = 0;
const details = answers.map(answer => {
  const question = questions.find(q => q.id === answer.question_id);  // 올바르게 정의
  const correct = Number(question?.correct_answer) === Number(answer.user_answer);
  if (correct) score++;
  return {
    question_id: answer.question_id,
    user_answer: answer.user_answer,
    correct_answer: question?.correct_answer,
    correct,
    question_text: question?.question_text,
    explanation: question?.explanation,
    choices: {
      1: question?.choice_1,
      2: question?.choice_2,
      3: question?.choice_3,
      4: question?.choice_4
    }
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

  await pool.query(
    `INSERT INTO test_results (user_id, equipment_type, level, score, total_questions, details) VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, equipment_type, level, score, answers.length, result.details]
  );

  return {
  score,
  total_questions: answers.length,
  details // 이건 객체 상태임 (JSON.parse 불필요)
  };
};

exports.getTestResults = async (user_id) => {
  const [rows] = await pool.query(
    'SELECT id, equipment_type, level, score, total_questions, test_date FROM test_results WHERE user_id = ? ORDER BY test_date DESC',
    [user_id]
  );
  return rows;
};

exports.addQuestion = async ({
  equipment_type,
  level,
  question_text,
  choice_1,
  choice_2,
  choice_3,
  choice_4,
  correct_answer,
  explanation
}) => {
  await pool.query(
    `INSERT INTO questions (
      equipment_type,
      level,
      question_text,
      choice_1,
      choice_2,
      choice_3,
      choice_4,
      correct_answer,
      explanation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      equipment_type,
      level,
      question_text,
      choice_1,
      choice_2,
      choice_3,
      choice_4,
      correct_answer,
      explanation
    ]
  );
};

exports.getAllTestResults = async () => {
  const [rows] = await pool.query(
    `SELECT 
       user_id, 
       equipment_type, 
       level, 
       score, 
       total_questions, 
       test_date 
     FROM test_results 
     ORDER BY test_date DESC`
  );
  return rows;
};