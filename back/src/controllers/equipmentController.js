const { pool } = require('../../config/database');

exports.getEquipments = async (req, res) => {
  const { eqname } = req.query; // URL 쿼리에서 eqname 가져오기
  try {
    let query = 'SELECT * FROM Equipment';
    let params = [];

    if (eqname) {
      query += ' WHERE EQNAME = ?'; // 정확히 매칭
      params.push(eqname);
    }

    const [rows] = await pool.query(query, params);

    console.log('Executed Query:', query, 'Params:', params);
    console.log('Query Result:', rows);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error retrieving equipment data' });
  }
};
