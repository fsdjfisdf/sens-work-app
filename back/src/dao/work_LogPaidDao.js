const { pool } = require('../../config/database');

// 결재대기 유상 상세 저장
exports.insertPaidRowsPending = async (pendingId, rows, snap) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const sql = `
      INSERT INTO work_log_paid_pending
        (pending_id, paid_worker, line_start_time, line_end_time, inform_start_time, inform_end_time,
         task_name, task_date, \`group\`, site, \`line\`, warranty, equipment_type, equipment_name, ems)
      VALUES ?
    `;
  const norm = (v) => {
    if (!v) return null;
    if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
    if (/^\d{2}:\d{2}$/.test(v)) return v + ':00';
    return v; // (형식이 다르면 그대로 두고 DB가 에러 주도록)
  };
  const values = rows.map(r => [
      pendingId,
      r.paid_worker,
      r.line_start_time + ':00',
      r.line_end_time   + ':00',
      r.inform_start_time + ':00',
      r.inform_end_time   + ':00',
      snap.task_name, snap.task_date, snap.group, snap.site, snap.line, snap.warranty,
      snap.equipment_type, snap.equipment_name, (snap.ems===0||snap.ems===1) ? snap.ems : null
    ]);
    await conn.query(sql, [values]);
  } finally {
    conn.release();
  }
};

// 승인 시 대기 → 본테이블 이관
exports.movePaidFromPending = async (conn, pendingId, workLogId) => {
  // 1) 동일 work_log_id 기존 행 제거 (재승인/재실행 대비)
  await conn.query('DELETE FROM work_log_paid WHERE work_log_id = ?', [workLogId]);

  // 2) pending → live 복사
  const sql = `
    INSERT INTO work_log_paid
      (work_log_id, paid_worker, line_start_time, line_end_time, inform_start_time, inform_end_time,
       task_name, task_date, \`group\`, site, \`line\`, warranty, equipment_type, equipment_name, ems)
    SELECT
      ?, pp.paid_worker, pp.line_start_time, pp.line_end_time, pp.inform_start_time, pp.inform_end_time,
      pp.task_name, pp.task_date, pp.\`group\`, pp.site, pp.\`line\`, pp.warranty, pp.equipment_type, pp.equipment_name, pp.ems
    FROM work_log_paid_pending pp
    WHERE pp.pending_id = ?
  `;
  await conn.query(sql, [workLogId, pendingId]);
};

exports.searchPaidRows = async (f) => {
  const where = [];
  const args = [];

  if (f.date_from){ where.push('w.task_date >= ?'); args.push(f.date_from); }
  if (f.date_to){   where.push('w.task_date <= ?'); args.push(f.date_to); }

  if (f.group){ where.push('w.`group` = ?'); args.push(f.group); }
  if (f.site){  where.push('w.`site` = ?'); args.push(f.site); }

  if (f.worker){ where.push('w.paid_worker LIKE ?'); args.push(`%${f.worker}%`); }
  if (f.line){   where.push('w.`line` LIKE ?'); args.push(`%${f.line}%`); }

  if (f.equipment_type){ where.push('w.equipment_type LIKE ?'); args.push(`%${f.equipment_type}%`); }
  if (f.equipment_name){ where.push('w.equipment_name LIKE ?'); args.push(`%${f.equipment_name}%`); }

  if (f.ems===0 || f.ems===1){ where.push('w.ems = ?'); args.push(f.ems); }

  const sql = `
    SELECT
      w.id, w.work_log_id, w.paid_worker,
      TIME_FORMAT(w.line_start_time,   '%H:%i:%s') AS line_start_time,
      TIME_FORMAT(w.line_end_time,     '%H:%i:%s') AS line_end_time,
      TIME_FORMAT(w.inform_start_time, '%H:%i:%s') AS inform_start_time,
      TIME_FORMAT(w.inform_end_time,   '%H:%i:%s') AS inform_end_time,
      w.task_name, w.task_date, w.\`group\`, w.site, w.\`line\`, w.warranty,
      w.equipment_type, w.equipment_name, w.ems
    FROM work_log_paid w
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY w.task_date DESC, w.id DESC
    LIMIT ${Number(f.limit||5000)}
  `;
  const [rows] = await pool.query(sql, args);
  return rows;
};