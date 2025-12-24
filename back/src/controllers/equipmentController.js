// back/src/controllers/equipmentController.js
const { pool } = require('../../config/database');

// 장비 목록 조회 (검색)
exports.getEquipments = async (req, res) => {
  // 실제로 어떤 쿼리 파라미터가 들어오는지 로그로 확인
  console.log('==== [getEquipments] req.query ====');
  console.log(req.query); // { eqname: 'EPAP301', site: 'PT', ... } 이런 식으로 나와야 함

  const { eqname, group, site, line, type, warranty_status } = req.query;

  try {
    let query = 'SELECT * FROM Equipment';
    const conditions = [];
    const params = [];

    // 1) EQNAME 부분 검색 (대소문자 무시)
    if (eqname && eqname.trim() !== '') {
      conditions.push('LOWER(EQNAME) LIKE LOWER(?)');
      params.push(`%${eqname.trim()}%`);
    }

    // 2) GROUP 필터
    if (group && group.trim() !== '') {
      conditions.push('`GROUP` = ?'); // GROUP은 예약어라 백틱 필요
      params.push(group.trim());
    }

    // 3) SITE 필터
    if (site && site.trim() !== '') {
      conditions.push('SITE = ?');
      params.push(site.trim());
    }

    // 4) LINE 필터
    if (line && line.trim() !== '') {
      conditions.push('LINE = ?');
      params.push(line.trim());
    }

    // 5) TYPE 필터
    if (type && type.trim() !== '') {
      conditions.push('TYPE = ?');
      params.push(type.trim());
    }

    // 6) WARRANTY_STATUS 필터
    if (warranty_status && warranty_status.trim() !== '') {
      conditions.push('WARRANTY_STATUS = ?');
      params.push(warranty_status.trim());
    }

    // 조건이 하나라도 있으면 WHERE 절 추가
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 보기 좋게 정렬
    query += ' ORDER BY SITE, LINE, EQNAME';

    console.log('==== [getEquipments] Executed Query ====');
    console.log(query);
    console.log('Params:', params);

    const [rows] = await pool.query(query, params);

    console.log('Result count:', rows.length);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error in getEquipments:', err);
    res.status(500).json({ error: 'Error retrieving equipment data' });
  }
};


// 장비 추가
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    console.log('==== [addEquipment] INSERT Executed ====');
    console.log(query);
    console.log('Params:', params);
    console.log('Inserted Equipment ID:', result.insertId);

    res.status(201).json({ message: 'Equipment added successfully!' });
  } catch (err) {
    console.error('Database Error in addEquipment:', err.message);
    res.status(500).json({ error: 'Error adding equipment.', details: err.message });
  }
};


// INFO만 수정 (equipment_signal2 상세 INFO SAVE 버튼에서 사용)
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


// 설비 전체 정보 수정 (equipment_add2.js의 EDIT 모달에서 사용)
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

    console.log('==== [updateEquipment] Executed Query ====');
    console.log(query);
    console.log('Params:', params);

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

// 설비별 작업 이력 조회
exports.getEquipmentHistory = async (req, res) => {
  const { eqname } = req.params;

  if (!eqname) {
    return res.status(400).json({ error: 'eqname 이 필요합니다.' });
  }

  try {
    const query = `
      SELECT
        task_date,
        work_type,
        task_name,
        task_man,
        equipment_type,
        start_time,
        end_time,
        task_duration,
        task_description
      FROM work_log
      WHERE equipment_name = ?
      ORDER BY task_date DESC, start_time DESC
      LIMIT 200
    `;
    const [rows] = await pool.query(query, [eqname]);

    console.log('==== [getEquipmentHistory] eqname ====', eqname);
    console.log('Result count:', rows.length);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error in getEquipmentHistory:', err);
    res.status(500).json({ error: 'Error retrieving equipment history' });
  }
};

exports.deleteEquipment = async (req, res) => {
  const { eqname } = req.params;

  if (!eqname) {
    return res.status(400).json({ error: 'eqname 파라미터가 필요합니다.' });
  }

  try {
    const query = `DELETE FROM Equipment WHERE EQNAME = ?`;
    const [result] = await pool.query(query, [eqname]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 설비를 찾을 수 없습니다.', eqname });
    }

    res.status(200).json({ message: '설비가 삭제되었습니다.' });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: '설비 삭제 중 오류가 발생했습니다.' });
  }
};