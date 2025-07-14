const { pool } = require('../../config/database');

// 작업 카운트 데이터를 가져오는 함수
exports.getTaskCount = async (req, res) => {
  console.log('Request received for /geneva-task-count');
  try {
      const [rows] = await pool.query('SELECT * FROM GENEVA_MAINT_COUNT');
      res.status(200).json(rows);
  } catch (err) {
      console.error('Error retrieving task count data:', err);
      res.status(500).json({ error: 'Error retrieving task count data' });
  }
};

exports.saveAggregatedData = async (req, res) => {
    try {
      const data = req.body;
      // Logic to save aggregated data goes here.
      res.status(201).json({ message: 'Aggregated data saved successfully' });
    } catch (err) {
      console.error('Error saving aggregated data:', err);
      res.status(500).json({ error: 'Error saving aggregated data' });
    }
  };
  