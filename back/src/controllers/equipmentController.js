const { pool } = require('../../config/database');

exports.getEquipments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Equipment');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error retrieving equipment data:', err);
    res.status(500).json({ error: 'Error retrieving equipment data' });
  }
};
