const { pool } = require('../../config/database');

/* -------------------------------
 * 조회
 * ------------------------------- */
exports.getWorkLogs = async (equipment_name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    let query = 'SELECT * FROM work_log';
    const values = [];
    if (equipment_name) {
      query += ' WHERE equipment_name = ?';
      values.push(equipment_name);
    }
    query += ' ORDER BY task_date DESC, id DESC';
    const [rows] = await connection.query(query, values);
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving work logs: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 직접 저장: task_duration 포함 INSERT
 *  - work_log 테이블 스키마에 맞춰 컬럼 명시
 *  - task_duration은 JS에서 계산하지 않고 SQL 함수로 계산 가능
 * ------------------------------- */
exports.addWorkLog = async (
  task_name, task_result, task_cause, task_man, task_description,
  task_date, start_time, end_time, none_time, move_time,
  group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name,
  work_type, work_type2, setup_item, maint_item, transfer_item, task_maint, status
) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO work_log (
        task_name, task_date, task_man, \`group\`, site, \`line\`,
        equipment_type, warranty, equipment_name, status,
        task_description, task_cause, task_result, SOP, tsguide,
        work_type, work_type2, setup_item, maint_item, transfer_item,
        task_duration, start_time, end_time, none_time, move_time, task_maint
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        SEC_TO_TIME(GREATEST(0, TIME_TO_SEC(TIMEDIFF(?, ?)) - ((? + ?) * 60))),
        ?, ?, ?, ?, ?
      )
    `;

    const values = [
      task_name, task_date, task_man, group, site, line,
      equipment_type, warranty, equipment_name, (status || 'active'),
      task_description, task_cause, task_result, SOP, tsguide,
      work_type, work_type2, setup_item, maint_item, transfer_item,
      // duration 계산용
      start_time || '00:00:00', end_time || '00:00:00',
      Number(none_time) || 0, Number(move_time) || 0,
      // 실제 컬럼
      start_time || '00:00:00', end_time || '00:00:00',
      Number(none_time) || 0, Number(move_time) || 0, task_maint || 'SELECT'
    ];

    await connection.query(query, values);
  } catch (err) {
    console.error('Error executing addWorkLog:', err.message);
    throw new Error(`Error adding work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 삭제
 * ------------------------------- */
exports.deleteWorkLog = async (id) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    await connection.query('DELETE FROM work_log WHERE id = ?', [id]);
  } catch (err) {
    throw new Error(`Error deleting work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 단건 조회
 * ------------------------------- */
exports.getWorkLogById = async (id) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await connection.query('SELECT * FROM work_log WHERE id = ?', [id]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 수정
 * ------------------------------- */
exports.updateWorkLog = async (
  id, task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time,
  group, site, line, warranty, equipment_type, equipment_name, status
) => {
  const fields = [];
  const values = [];

  if (task_name !== undefined) { fields.push("task_name = ?"); values.push(task_name); }
  if (task_result !== undefined) { fields.push("task_result = ?"); values.push(task_result); }
  if (task_cause !== undefined) { fields.push("task_cause = ?"); values.push(task_cause); }
  if (task_man !== undefined) { fields.push("task_man = ?"); values.push(task_man); }
  if (task_description !== undefined) { fields.push("task_description = ?"); values.push(task_description); }
  if (task_date !== undefined) { fields.push("task_date = ?"); values.push(task_date); }
  if (start_time !== undefined) { fields.push("start_time = ?"); values.push(start_time); }
  if (end_time !== undefined) { fields.push("end_time = ?"); values.push(end_time); }
  if (group !== undefined) { fields.push("`group` = ?"); values.push(group); }
  if (site !== undefined) { fields.push("site = ?"); values.push(site); }
  if (line !== undefined) { fields.push("`line` = ?"); values.push(line); }
  if (warranty !== undefined) { fields.push("warranty = ?"); values.push(warranty); }
  if (equipment_type !== undefined) { fields.push("equipment_type = ?"); values.push(equipment_type); }
  if (equipment_name !== undefined) { fields.push("equipment_name = ?"); values.push(equipment_name); }
  if (status !== undefined) { fields.push("status = ?"); values.push(status); }

  values.push(id);

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  const query = `
    UPDATE work_log SET ${fields.join(', ')}
    WHERE id = ?
  `;

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error('Error updating work log:', err.message);
    throw err;
  }
};

/* -------------------------------
 * 작업 카운트 증가
 * ------------------------------- */
exports.incrementTaskCount = async (engineer_name, transfer_item) => {
  const validColumns = [
    'LP ESCORT', 'EFEM ROBOT TEACHING', 'EFEM ROBOT REP', 'EFEM ROBOT CONTROLLER', 'TM ROBOT TEACHING',
    'TM ROBOT REP', 'TM ROBOT CONTROLLER', 'PASSIVE PAD REP', 'PIN CYLINDER', 'PUSHER CYLINDER',
    'IB FLOW', 'DRT', 'FFU CONTROLLER', 'FAN', 'MOTOR DRIVER', 'R1', 'R3', 'R5', 'R3 TO R5',
    'MICROWAVE', 'APPLICATOR', 'GENERATOR', 'CHUCK', 'PROCESS KIT', 'HELIUM DETECTOR', 'HOOK LIFT PIN',
    'BELLOWS', 'PIN SENSOR', 'LM GUIDE', 'PIN MOTOR CONTROLLER', 'SINGLE EPD', 'DUAL EPD', 'GAS BOX BOARD',
    'TEMP CONTROLLER BOARD', 'POWER DISTRIBUTION BOARD', 'DC POWER SUPPLY', 'BM SENSOR', 'PIO SENSOR',
    'SAFETY MODULE', 'D-NET', 'MFC', 'VALVE', 'SOLENOID', 'FAST VAC VALVE', 'SLOW VAC VALVE',
    'SLIT DOOR', 'APC VALVE', 'SHUTOFF VALVE', 'BARATRON ASS\'Y', 'PIRANI ASS\'Y', 'VIEW PORT QUARTZ',
    'FLOW SWITCH', 'CERAMIC PLATE', 'MONITOR', 'KEYBOARD', 'MOUSE', 'CTC', 'PMC', 'EDA',
    'EFEM CONTROLLER', 'S/W PATCH'
  ];

  if (!validColumns.includes(transfer_item)) {
    console.error(`Invalid task name: ${transfer_item}`);
    throw new Error(`Invalid task name: ${transfer_item}`);
  }

  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO task_count (engineer_name, \`${transfer_item}\`)
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE \`${transfer_item}\` = \`${transfer_item}\` + 1
    `;
    await connection.query(query, [engineer_name]);
  } catch (err) {
    console.error('Error updating task count:', err);
    throw new Error(`Error updating task count: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 장비타입 필터
 * ------------------------------- */
exports.getSupraXPWorkLogs = async (equipment_type) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    let query = 'SELECT * FROM work_log WHERE equipment_type = ? ORDER BY task_date DESC, id DESC';
    const [rows] = await connection.query(query, [equipment_type]);
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving work logs: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 결재: 제출 (대기 저장) — 자리표시자 26개 정확히!
 * ------------------------------- */
exports.submitPendingWorkLog = async (payload) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO work_log_pending (
        task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
        \`group\`, site, SOP, tsguide, \`line\`, warranty, equipment_type, equipment_name, work_type, work_type2,
        setup_item, maint_item, transfer_item, task_maint, status,
        submitted_by
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const values = [
      payload.task_name, payload.task_result, payload.task_cause, payload.task_man, payload.task_description,
      payload.task_date, payload.start_time, payload.end_time, Number(payload.none_time) || 0, Number(payload.move_time) || 0,
      payload.group, payload.site, payload.SOP, payload.tsguide, payload.line, payload.warranty,
      payload.equipment_type, payload.equipment_name, payload.workType, payload.workType2,
      payload.setupItem, payload.maintItem, payload.transferItem, payload.task_maint, payload.status,
      payload.submitted_by
    ];
    // 안전 체크(디버깅용)
    if (values.length !== 26) {
      throw new Error(`submitPendingWorkLog placeholder mismatch: got ${values.length}, expected 26`);
    }
    const [result] = await connection.query(query, values);
    return result.insertId;
  } catch (e) {
    console.error('submitPendingWorkLog error:', e);
    throw e;
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 결재: 대기 목록
 * ------------------------------- */
exports.listPendingWorkLogs = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await connection.query(
      `SELECT * FROM work_log_pending WHERE approval_status='pending' ORDER BY submitted_at DESC`
    );
    return rows;
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 결재: 단건 조회
 * ------------------------------- */
exports.getPendingById = async (id) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await connection.query(`SELECT * FROM work_log_pending WHERE id=?`, [id]);
    return rows[0];
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 결재: 승인 (본 테이블로 이관 + task_duration 계산)
 * ------------------------------- */
exports.approvePendingWorkLog = async (id, approver, note) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    await connection.beginTransaction();

    // work_log 스키마에 맞춰 컬럼 순서 명시 + task_duration 계산
    const insertQuery = `
      INSERT INTO work_log (
        task_name, task_date, task_man, \`group\`, site, \`line\`,
        equipment_type, warranty, equipment_name, status,
        task_description, task_cause, task_result, SOP, tsguide,
        work_type, work_type2, setup_item, maint_item, transfer_item,
        task_duration, start_time, end_time, none_time, move_time, task_maint
      )
      SELECT
        p.task_name, p.task_date, p.task_man, p.\`group\`, p.site, p.\`line\`,
        p.equipment_type, p.warranty, p.equipment_name, p.status,
        p.task_description, p.task_cause, p.task_result, p.SOP, p.tsguide,
        p.work_type, p.work_type2, p.setup_item, p.maint_item, p.transfer_item,
        SEC_TO_TIME(GREATEST(0,
          TIME_TO_SEC(TIMEDIFF(p.end_time, p.start_time)) - ((IFNULL(p.none_time,0) + IFNULL(p.move_time,0)) * 60)
        )),
        p.start_time, p.end_time, p.none_time, p.move_time, p.task_maint
      FROM work_log_pending p
      WHERE p.id = ?
    `;
    await connection.query(insertQuery, [id]);

    const updQuery = `
      UPDATE work_log_pending
      SET approval_status='approved', approver=?, approval_note=?, approved_at=NOW()
      WHERE id=?
    `;
    await connection.query(updQuery, [approver || '', note || '', id]);

    // (선택) 삭제를 원하면 여기에 DELETE 추가
    // await connection.query('DELETE FROM work_log_pending WHERE id=?', [id]);

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

/* -------------------------------
 * 결재: 반려
 * ------------------------------- */
exports.rejectPendingWorkLog = async (id, approver, note) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE work_log_pending
      SET approval_status='rejected', approver=?, approval_note=?, approved_at=NOW()
      WHERE id=?
    `;
    await connection.query(query, [approver || '', note || '', id]);
  } finally {
    connection.release();
  }
};
