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

exports.updateEquipmentInfo = async (req, res) => {
  const { eqname, info } = req.body;

  if (!eqname || info === undefined) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.', missingFields: { eqname, info } });
  }

  try {
      const query = `UPDATE Equipment SET INFO = ? WHERE EQNAME = ?`;
      const [result] = await pool.query(query, [info, eqname]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: '해당 설비를 찾을 수 없습니다.', eqname });
      }

      res.status(200).json({ message: '특이사항이 성공적으로 업데이트되었습니다.' });
  } catch (err) {
      console.error('Error updating INFO:', err);
      res.status(500).json({ error: '특이사항 업데이트 중 오류가 발생했습니다.' });
  }
};
