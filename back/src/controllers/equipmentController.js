// back/src/controllers/equipmentController.js
const { pool } = require('../../config/database');

exports.getEquipments = async (req, res) => {
  // 프론트에서 보내는 모든 쿼리 파라미터 받기
  const { eqname, group, site, line, type, warranty_status } = req.query;

  try {
    let query = 'SELECT * FROM Equipment';
    const conditions = [];
    const params = [];

    // EQNAME 부분 검색 (대소문자 무시)
    if (eqname) {
      conditions.push('LOWER(EQNAME) LIKE LOWER(?)');
      params.push(`%${eqname.trim()}%`);
    }

    if (group) {
      conditions.push('`GROUP` = ?'); // GROUP은 예약어라 백틱 필수
      params.push(group);
    }

    if (site) {
      conditions.push('SITE = ?');
      params.push(site);
    }

    if (line) {
      conditions.push('LINE = ?');
      params.push(line);
    }

    if (type) {
      conditions.push('TYPE = ?');
      params.push(type);
    }

    if (warranty_status) {
      conditions.push('WARRANTY_STATUS = ?');
      params.push(warranty_status);
    }

    // 조건이 하나라도 있으면 WHERE 붙이기
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 보기 좋게 정렬
    query += ' ORDER BY SITE, LINE, EQNAME';

    const [rows] = await pool.query(query, params);

    console.log('Executed Query:', query);
    console.log('Params:', params);
    console.log('Result count:', rows.length);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error in getEquipments:', err);
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
      INSERT INTO Equipment (
        \`EQNAME\`, \`GROUP\`, \`SITE\`, \`TYPE\`,
        \`LINE\`, \`FLOOR\`, \`BAY\`,
        \`START_DATE\`, \`END_DATE\`, \`WARRANTY_STATUS\`, \`INFO\`
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
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
    ];

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
    return res.status(400).json({
      error: '필수 필드가 누락되었습니다.',
      missingFields: { eqname, info },
    });
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

/**
 * (선택) 설비 전체 정보 수정용 updateEquipment
 * equipment_add2.js 에서 PUT /api/equipment/:eqname 호출할 때 필요
 */
exports.updateEquipment = async (req, res) => {
  const { eqname } = req.params;
  const {
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

  try {
    const fields = [];
    const params = [];

    if (group !== undefined) {
      fields.push('`GROUP` = ?');
      params.push(group);
    }
    if (site !== undefined) {
      fields.push('SITE = ?');
      params.push(site);
    }
    if (type !== undefined) {
      fields.push('TYPE = ?');
      params.push(type);
    }
    if (line !== undefined) {
      fields.push('LINE = ?');
      params.push(line);
    }
    if (floor !== undefined) {
      fields.push('FLOOR = ?');
      params.push(floor);
    }
    if (bay !== undefined) {
      fields.push('BAY = ?');
      params.push(bay);
    }
    if (start_date !== undefined) {
      fields.push('START_DATE = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      fields.push('END_DATE = ?');
      params.push(end_date);
    }
    if (warranty_status !== undefined) {
      fields.push('WARRANTY_STATUS = ?');
      params.push(warranty_status);
    }
    if (info !== undefined) {
      fields.push('INFO = ?');
      params.push(info);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: '수정할 필드가 없습니다.' });
    }

    const query = `
      UPDATE Equipment
      SET ${fields.join(', ')}
      WHERE EQNAME = ?
    `;
    params.push(eqname);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 설비를 찾을 수 없습니다.', eqname });
    }

    res.status(200).json({ message: 'Equipment updated successfully.' });
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).json({ error: 'Error updating equipment.', details: err.message });
  }
};
