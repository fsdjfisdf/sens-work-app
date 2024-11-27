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

  // 필수 필드 검증
  if (!eqname || !group || !site || !type || !start_date || !end_date || !warranty_status) {
      const missingFields = [];
      if (!eqname) missingFields.push('eqname');
      if (!group) missingFields.push('group');
      if (!site) missingFields.push('site');
      if (!type) missingFields.push('type');
      if (!start_date) missingFields.push('start_date');
      if (!end_date) missingFields.push('end_date');
      if (!warranty_status) missingFields.push('warranty_status');
      return res.status(400).json({ error: 'Required fields are missing.', missingFields });
  }

  try {
      const query = `
          INSERT INTO Equipment (\`EQNAME\`, \`GROUP\`, \`SITE\`, \`TYPE\`, \`LINE\`, \`FLOOR\`, \`BAY\`, \`START_DATE\`, \`END_DATE\`, \`WARRANTY_STATUS\`, \`INFO\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [eqname, group, site, type, line, floor, bay, start_date, end_date, warranty_status, info];

      const [result] = await pool.query(query, params);

      console.log('Query Executed:', query, params);
      console.log('Inserted Equipment:', result);

      res.status(201).json({ message: 'Equipment added successfully!' });
  } catch (err) {
      console.error('Database Error:', err.message);
      res.status(500).json({ error: 'Error adding equipment.', details: err.message });
  }
};
