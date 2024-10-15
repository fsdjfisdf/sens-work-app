const { pool } = require('../../config/database');

// 작업 카운트 데이터를 가져오는 함수
exports.getTaskCount = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM INTEGER_MAINT_COUNT');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error retrieving task count data:', err);
    res.status(500).json({ error: 'Error retrieving task count data' });
  }
};
