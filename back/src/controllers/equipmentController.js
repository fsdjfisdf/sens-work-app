exports.getEquipments = async (req, res) => {
    try {
      console.log('Fetching equipment data...');
      const [rows] = await pool.query('SELECT * FROM Equipment');
      console.log('Fetched equipment data:', rows);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error retrieving equipment data:', err);
      res.status(500).json({ error: 'Error retrieving equipment data' });
    }
  };
  