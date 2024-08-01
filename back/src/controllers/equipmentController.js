const { pool } = require('../../config/database');

exports.getEquipments = async (req, res) => {
  const { eqname } = req.query; // URL 쿼리에서 eqname 파라미터를 가져옵니다.
  try {
    let query = 'SELECT * FROM Equipment';
    let params = [];

    if (eqname) {
      query += ' WHERE EQNAME = ?';
      params.push(eqname);
    }

    const [rows] = await pool.query(query, params);
    console.log('Database query result:', rows); // 데이터베이스 쿼리 결과를 출력
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error retrieving equipment data:', err);
    res.status(500).json({ error: 'Error retrieving equipment data' });
  }
};
