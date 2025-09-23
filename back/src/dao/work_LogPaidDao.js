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
