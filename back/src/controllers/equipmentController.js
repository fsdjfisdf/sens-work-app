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

exports.addEquipment = async (req, res) => {
  const {
      eqname,
      group,
      site,
      type,
      line,
      floor,
      bay,
      start_date,
      end_date,
      warranty_status,
      info,
  } = req.body;

  if (!eqname || !group || !site || !type) {
      return res.status(400).json({ error: 'Required fields are missing.' });
  }

  try {
      const query = `
          INSERT INTO Equipment (\`EQNAME\`, \`GROUP\`, \`SITE\`, \`TYPE\`, \`LINE\`, \`FLOOR\`, \`BAY\`, \`START_DATE\`, \`END_DATE\`, \`WARRANTY_STATUS\`, \`INFO\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [eqname, group, site, type, line, floor, bay, start_date, end_date, warranty_status, info];

      const [result] = await pool.query(query, params);

      console.log('Inserted Equipment:', result);

      res.status(201).json({ message: 'Equipment added successfully!' });
  } catch (err) {
      console.error('Error adding equipment:', err.message);
      res.status(500).json({ error: 'Error adding equipment.' });
  }
};
