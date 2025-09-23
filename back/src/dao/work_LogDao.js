const { pool } = require('../../config/database');
const paidDao = require('./work_LogPaidDao');

/* ────────────────────────────────────────────────
 * 기존 work_log CRUD 유지
 * ──────────────────────────────────────────────── */
exports.getWorkLogs = async (equipment_name) => {
  const connection = await pool.getConnection(async (conn) => conn);
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

/* addWorkLog: task_duration은 컬럼 정의(생성/일반)에 맞게 DB가 처리하도록
   → 여기선 기존 로직 유지(요청 주신 기존 코드 보존). */
exports.addWorkLog = async (
  task_name,
  task_result,
  task_cause,
  task_man,
  task_description,
  task_date,
  start_time,
  end_time,
  none_time,
  move_time,
  group,
  site,
  SOP,
  tsguide,
  line,
  warranty,
  equipment_type,
  equipment_name,
  work_type,
  work_type2,
  setup_item,
  maint_item,
  transfer_item,
  task_maint,
  status,
  ems
) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      INSERT INTO work_log (
        task_name, task_date, task_man, \`group\`, site, \`line\`,
        equipment_type, warranty, equipment_name, status,
        task_description, task_cause, task_result, SOP, tsguide,
        work_type, work_type2, setup_item, maint_item, transfer_item,
        task_duration, start_time, end_time, none_time, move_time, task_maint, ems
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        SEC_TO_TIME(GREATEST(0, TIME_TO_SEC(TIMEDIFF(?, ?)) - ((? + ?) * 60))),
        ?, ?, ?, ?, ?, ?
      )
    `;
    const values = [
      task_name,
      task_date,
      task_man,
      group,
      site,
      line,
      equipment_type,
      warranty,
      equipment_name,
      status || 'active',
      task_description,
      task_cause,
      task_result,
      SOP,
      tsguide,
      work_type,
      work_type2,
      setup_item,
      maint_item,
      transfer_item,
      start_time || '00:00:00',
      end_time || '00:00:00',
      Number(none_time) || 0,
      Number(move_time) || 0,
      start_time || '00:00:00',
      end_time || '00:00:00',
      Number(none_time) || 0,
      Number(move_time) || 0,
      task_maint || 'SELECT',
      (ems === 0 || ems === 1) ? ems : null
    ];
    await connection.query(query, values);
  } catch (err) {
    console.error('Error executing addWorkLog:', err.message);
    throw new Error(`Error adding work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.deleteWorkLog = async (id) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    await connection.query('DELETE FROM work_log WHERE id = ?', [id]);
  } catch (err) {
    throw new Error(`Error deleting work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.getWorkLogById = async (id) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const [rows] = await connection.query('SELECT * FROM work_log WHERE id = ?', [id]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.updateWorkLog = async (
  id,
  task_name,
  task_result,
  task_cause,
  task_man,
  task_description,
  task_date,
  start_time,
  end_time,
  group,
  site,
  line,
  warranty,
  equipment_type,
  equipment_name,
  status,
  ems
) => {
  const fields = [];
  const values = [];

  if (task_name !== undefined) {
    fields.push('task_name = ?');
    values.push(task_name);
  }
  if (task_result !== undefined) {
    fields.push('task_result = ?');
    values.push(task_result);
  }
  if (task_cause !== undefined) {
    fields.push('task_cause = ?');
    values.push(task_cause);
  }
  if (task_man !== undefined) {
    fields.push('task_man = ?');
    values.push(task_man);
  }
  if (task_description !== undefined) {
    fields.push('task_description = ?');
    values.push(task_description);
  }
  if (task_date !== undefined) {
    fields.push('task_date = ?');
    values.push(task_date);
  }
  if (start_time !== undefined) {
    fields.push('start_time = ?');
    values.push(start_time);
  }
  if (end_time !== undefined) {
    fields.push('end_time = ?');
    values.push(end_time);
  }
  if (group !== undefined) {
    fields.push('`group` = ?');
    values.push(group);
  }
  if (site !== undefined) {
    fields.push('site = ?');
    values.push(site);
  }
  if (line !== undefined) {
    fields.push('`line` = ?');
    values.push(line);
  }
  if (warranty !== undefined) {
    fields.push('warranty = ?');
    values.push(warranty);
  }
  if (equipment_type !== undefined) {
    fields.push('equipment_type = ?');
    values.push(equipment_type);
  }
  if (equipment_name !== undefined) {
    fields.push('equipment_name = ?');
    values.push(equipment_name);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }
  if (ems !== undefined)    {
    fields.push('ems = ?');    
    values.push((ems===0||ems===1)?ems:null); 
  }

  values.push(id);
  if (fields.length === 0) throw new Error('No fields to update');

  const query = `UPDATE work_log SET ${fields.join(', ')} WHERE id = ?`;

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error('Error updating work log:', err.message);
    throw err;
  }
};

/* ────────────────────────────────────────────────
 * 작업 카운트
 * ──────────────────────────────────────────────── */
exports.incrementTaskCount = async (engineer_name, transfer_item) => {
  const validColumns = [
    'LP ESCORT',
    'EFEM ROBOT TEACHING',
    'EFEM ROBOT REP',
    'EFEM ROBOT CONTROLLER',
    'TM ROBOT TEACHING',
    'TM ROBOT REP',
    'TM ROBOT CONTROLLER',
    'PASSIVE PAD REP',
    'PIN CYLINDER',
    'PUSHER CYLINDER',
    'IB FLOW',
    'DRT',
    'FFU CONTROLLER',
    'FAN',
    'MOTOR DRIVER',
    'R1',
    'R3',
    'R5',
    'R3 TO R5',
    'MICROWAVE',
    'APPLICATOR',
    'GENERATOR',
    'CHUCK',
    'PROCESS KIT',
    'HELIUM DETECTOR',
    'HOOK LIFT PIN',
    'BELLOWS',
    'PIN SENSOR',
    'LM GUIDE',
    'PIN MOTOR CONTROLLER',
    'SINGLE EPD',
    'DUAL EPD',
    'GAS BOX BOARD',
    'TEMP CONTROLLER BOARD',
    'POWER DISTRIBUTION BOARD',
    'DC POWER SUPPLY',
    'BM SENSOR',
    'PIO SENSOR',
    'SAFETY MODULE',
    'D-NET',
    'MFC',
    'VALVE',
    'SOLENOID',
    'FAST VAC VALVE',
    'SLOW VAC VALVE',
    'SLIT DOOR',
    'APC VALVE',
    'SHUTOFF VALVE',
    "BARATRON ASS'Y",
    "PIRANI ASS'Y",
    'VIEW PORT QUARTZ',
    'FLOW SWITCH',
    'CERAMIC PLATE',
    'MONITOR',
    'KEYBOARD',
    'MOUSE',
    'CTC',
    'PMC',
    'EDA',
    'EFEM CONTROLLER',
    'S/W PATCH',
  ];
  if (!validColumns.includes(transfer_item)) {
    throw new Error(`Invalid task name: ${transfer_item}`);
  }

  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      INSERT INTO task_count (engineer_name, \`${transfer_item}\`)
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE \`${transfer_item}\` = \`${transfer_item}\` + 1
    `;
    await connection.query(query, [engineer_name]);
  } catch (err) {
    throw new Error(`Error updating task count: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* 타입 필터 */
exports.getSupraXPWorkLogs = async (equipment_type) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const [rows] = await connection.query(
      'SELECT * FROM work_log WHERE equipment_type = ? ORDER BY task_date DESC, id DESC',
      [equipment_type]
    );
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving work logs: ${err.message}`);
  } finally {
    connection.release();
  }
};

/* ────────────────────────────────────────────────
 * Users
 * ──────────────────────────────────────────────── */
exports.getUsersByNicknames = async (nicknames) => {
  if (!Array.isArray(nicknames) || !nicknames.length) return [];
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const [rows] = await connection.query(
      `SELECT userIdx, nickname, userID, role, \`group\`, site
       FROM users
       WHERE nickname IN (?) AND status='A'`,
      [nicknames]
    );
    return rows;
  } finally {
    connection.release();
  }
};

/* ────────────────────────────────────────────────
 * 승인 대기 제출
 * ──────────────────────────────────────────────── */
exports.submitPendingWorkLog = async (payload) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      INSERT INTO work_log_pending (
        task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
        \`group\`, site, SOP, tsguide, \`line\`, warranty, equipment_type, equipment_name, work_type, work_type2,
        setup_item, maint_item, transfer_item, task_maint, status,
        submitted_by, approval_status, ems
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending', ?)
    `;
    const values = [
      payload.task_name,
      payload.task_result,
      payload.task_cause,
      payload.task_man,
      payload.task_description,
      payload.task_date,
      payload.start_time,
      payload.end_time,
      Number(payload.none_time) || 0,
      Number(payload.move_time) || 0,
      payload.group,
      payload.site,
      payload.SOP,
      payload.tsguide,
      payload.line,
      payload.warranty,
      payload.equipment_type,
      payload.equipment_name,
      payload.workType,
      payload.workType2,
      payload.setupItem,
      payload.maintItem,
      payload.transferItem,
      payload.task_maint,
      payload.status,
      payload.submitted_by,
      (payload.ems === 0 || payload.ems === 1) ? payload.ems : null
    ];
    if (values.length !== 27) throw new Error(`submitPendingWorkLog placeholder mismatch: ${values.length}`);
    const [result] = await connection.query(query, values);
    return result.insertId;
  } finally {
    connection.release();
  }
};

/* 대기 목록 (필터 지원) — 한글/컬레이션 안전 처리 포함 */
exports.listPendingWorkLogs = async (group, site, mineNickname) => {
  const connection = await pool.getConnection(async (conn) => conn);
  let sql;
  let vals;
  try {
    const cond = ["LOWER(COALESCE(approval_status,'')) IN ('pending','')"];
    vals = [];
    if (group) {
      cond.push('`group` = ?');
      vals.push(group);
    }
    // PSKH는 site 무시
    if (site && group !== 'PSKH') {
      cond.push('site = ?');
      vals.push(site);
    }
    // mine: 제출자 본인 또는 task_man에 본인 포함
    if (mineNickname) {
      const me = mineNickname.trim();
      const meFlat = me.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '');
      cond.push(`(
        TRIM(submitted_by) = ?
        OR REPLACE(REPLACE(REPLACE(COALESCE(task_man,''),' ',''),'(',''),')','')
             COLLATE utf8mb4_general_ci LIKE ?
        OR COALESCE(task_man,'') COLLATE utf8mb4_general_ci LIKE ?
      )`);
      vals.push(me, `%${meFlat}%`, `%${me}%`);
    }

    sql = `SELECT * FROM work_log_pending WHERE ${cond.join(' AND ')} ORDER BY submitted_at DESC`;
    const [rows] = await connection.query(sql, vals);
    return rows;
  } catch (err) {
    console.error('listPendingWorkLogs SQL error:', err?.sqlMessage || err?.message, { sql, vals });
    throw err;
  } finally {
    connection.release();
  }
};

/* 단건 조회 */
exports.getPendingById = async (id) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const [rows] = await connection.query(`SELECT * FROM work_log_pending WHERE id=?`, [id]);
    return rows[0];
  } finally {
    connection.release();
  }
};

/* 대기/반려건 동적 수정 */
exports.updatePendingWorkLogFields = async (id, patch) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const allowed = [
      'task_name',
      'task_result',
      'task_cause',
      'task_man',
      'task_description',
      'task_date',
      'start_time',
      'end_time',
      'none_time',
      'move_time',
      'group',
      'site',
      'SOP',
      'tsguide',
      'line',
      'warranty',
      'equipment_type',
      'equipment_name',
      'work_type',
      'work_type2',
      'setup_item',
      'maint_item',
      'transfer_item',
      'task_maint',
      'status',
      'ems'
    ];

    const sets = [];
    const vals = [];
    for (const k of Object.keys(patch || {})) {
      if (!allowed.includes(k)) continue;
      sets.push(`\`${k}\` = ?`);
      vals.push(patch[k]);
    }
    if (!sets.length) return; // 변경 없음

    const sql = `UPDATE work_log_pending SET ${sets.join(', ')} WHERE id = ?`;
    vals.push(id);
    await connection.query(sql, vals);
  } finally {
    connection.release();
  }
};

/* 반려 목록(제출자 기준) */
exports.listRejectedByUser = async (nickname) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const sql = `
      SELECT *
      FROM work_log_pending
      WHERE approval_status='rejected'
        AND submitted_by = ?
      ORDER BY approved_at DESC, submitted_at DESC
    `;
    const [rows] = await connection.query(sql, [nickname]);
    return rows;
  } finally {
    connection.release();
  }
};

/* 반려건 재제출 -> 상태를 'pending'으로 돌리고 submitted_at 갱신 */
exports.resubmitPendingWorkLog = async (id, submitted_by) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const sql = `
      UPDATE work_log_pending
      SET approval_status='pending',
          approver = NULL,
          approval_note = NULL,
          approved_at = NULL,
          submitted_by = ?,
          submitted_at = NOW()
      WHERE id = ?
    `;
    await connection.query(sql, [submitted_by, id]);
  } finally {
    connection.release();
  }
};

/* 승인 (본 테이블로 이관) — task_duration 은 삽입하지 않음(생성칼럼/트리거 호환) */
// work_LogDao.approvePendingWorkLog
exports.approvePendingWorkLog = async (id, approver, note) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    await connection.beginTransaction();

    // 1) pending → work_log
    const insertQuery = `
      INSERT INTO work_log (
        task_name, task_date, task_man, \`group\`, site, \`line\`,
        equipment_type, warranty, equipment_name, status,
        task_description, task_cause, task_result, SOP, tsguide,
        work_type, work_type2, setup_item, maint_item, transfer_item,
        start_time, end_time, none_time, move_time, task_maint, ems
      )
      SELECT
        pw.task_name, pw.task_date, pw.task_man, pw.\`group\`, pw.site, pw.\`line\`,
        pw.equipment_type, pw.warranty, pw.equipment_name, pw.status,
        pw.task_description, pw.task_cause, pw.task_result, pw.SOP, pw.tsguide,
        pw.work_type, pw.work_type2, pw.setup_item, pw.maint_item, pw.transfer_item,
        pw.start_time, pw.end_time, pw.none_time, pw.move_time, pw.task_maint, pw.ems
      FROM work_log_pending pw
      WHERE pw.id = ?
    `;
    const [ins] = await connection.query(insertQuery, [id]);
    const newWorkLogId = ins.insertId;

    // 2) 유상 상세 이관 (있을 경우)
    await paidDao.movePaidFromPending(connection, newWorkLogId, id);

    // 3) pending 상태 수정
    const updQuery = `
      UPDATE work_log_pending
      SET approval_status='approved', approver=?, approval_note=?, approved_at=NOW()
      WHERE id=?
    `;
    await connection.query(updQuery, [approver || '', note || '', id]);

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};


/* 반려 */
exports.rejectPendingWorkLog = async (id, approver, note) => {
  const connection = await pool.getConnection(async (conn) => conn);
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
