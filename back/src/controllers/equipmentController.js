const { pool } = require('../../config/database');

exports.getEquipments = async (req, res) => {
  const { warranty_status } = req.query;
  try {
    let query = 'SELECT * FROM Equipment WHERE EQNAME = ?';
    let params = [warranty_status];

    const [rows] = await pool.query(query, params);
    console.log('Database query result:', rows); // 데이터베이스 쿼리 결과를 출력
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error retrieving equipment data:', err);
    res.status(500).json({ error: 'Error retrieving equipment data' });
  }
};
