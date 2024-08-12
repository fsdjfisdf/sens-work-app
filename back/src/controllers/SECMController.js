const { pool } = require('../../config/database');

exports.getData = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM userDB');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error retrieving data:', err);
    res.status(500).json({ error: 'Error retrieving data' });
  }
};
