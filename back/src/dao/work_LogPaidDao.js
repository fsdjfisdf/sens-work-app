// dao/work_LogPaidDao.js
// 유상(EMS) 상세 DAO
const { pool } = require('../../config/database');

// 내부: 시간 정규화
function norm(v) {
  if (v == null || v === '') return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
  if (/^\d{2}:\d{2}$/.test(v)) return v + ':00';
  return v; // 형식이 다르면 그대로 (DB 제약으로 에러 나도록)
}

// 기존: 대기 테이블에 ‘추가’
// (지속 사용 가능하지만, 보통은 replacePendingPaidRows를 권장)
exports.insertPaidRowsPending = async (pendingId, rows, snap) => {
  const conn = await pool.getConnection(async (c) => c);
  try {
    const sql = `
      INSERT INTO work_log_paid_pending
        (pending_id, paid_worker, line_start_time, line_end_time, inform_start_time, inform_end_time,
         task_name, task_date, \`group\`, site, \`line\`, warranty, equipment_type, equipment_name, ems)
      VALUES ?
    `;
    const values = rows.map((r) => [
      pendingId,
      r.paid_worker,
      norm(r.line_start_time),
      norm(r.line_end_time),
      norm(r.inform_start_time),
      norm(r.inform_end_time),
      snap.task_name,
      snap.task_date,
      snap.group,
      snap.site,
      snap.line,
      snap.warranty,
      snap.equipment_type,
      snap.equipment_name,
      (snap.ems === 0 || snap.ems === 1) ? snap.ems : null,
    ]);

    const [ret] = await conn.query(sql, [values]);
    return Number(ret?.affectedRows || 0);
  } finally {
    conn.release();
  }
};

// 신규: 같은 pending_id의 기존 행 삭제 후 ‘대체’ 저장 (중복 방지용)
exports.replacePendingPaidRows = async (pendingId, rows, snap) => {
  const conn = await pool.getConnection(async (c) => c);
  try {
    await conn.beginTransaction();

    await conn.query(
      'DELETE FROM work_log_paid_pending WHERE pending_id = ?',
      [pendingId]
    );

    const sql = `
      INSERT INTO work_log_paid_pending
        (pending_id, paid_worker, line_start_time, line_end_time, inform_start_time, inform_end_time,
         task_name, task_date, \`group\`, site, \`line\`, warranty, equipment_type, equipment_name, ems)
      VALUES ?
    `;
    const values = rows.map((r) => [
      pendingId,
      r.paid_worker,
      norm(r.line_start_time),
      norm(r.line_end_time),
      norm(r.inform_start_time),
      norm(r.inform_end_time),
      snap.task_name,
      snap.task_date,
      snap.group,
      snap.site,
      snap.line,
      snap.warranty,
      snap.equipment_type,
      snap.equipment_name,
      (snap.ems === 0 || snap.ems === 1) ? snap.ems : null,
    ]);

    const [ret] = await conn.query(sql, [values]);

    await conn.commit();
    return Number(ret?.affectedRows || 0);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// 승인 시 대기 → 본테이블 이관
exports.movePaidFromPending = async (conn, pendingId, workLogId) => {
  // 0) pending 에 몇 행 있는지 확인 (디버깅)
  const [cntRows] = await conn.query(
    'SELECT COUNT(*) AS cnt FROM work_log_paid_pending WHERE pending_id = ?',
    [pendingId]
  );
  const pendingCnt = Number(cntRows?.[0]?.cnt || 0);

  // 1) 동일 work_log_id 기존 행 제거 (재승인 대비)
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
  const [ins] = await conn.query(sql, [workLogId, pendingId]);

  // 3) 디버깅용 로깅
  const inserted = Number(ins?.affectedRows || 0);
  if (!pendingCnt) {
    console.warn('[paid-move] NO_PENDING_ROWS', { pendingId, workLogId });
  } else if (!inserted) {
    console.warn('[paid-move] INSERTED_ZERO_ROWS', { pendingId, workLogId, pendingCnt });
  }
  return inserted;
};

// (검증/조회) 대기 테이블 유상 상세
exports.getPendingPaidRows = async (pendingId) => {
  const [rows] = await pool.query(
    `SELECT id, pending_id, paid_worker,
            TIME_FORMAT(line_start_time, '%H:%i:%s') AS line_start_time,
            TIME_FORMAT(line_end_time,   '%H:%i:%s') AS line_end_time,
            TIME_FORMAT(inform_start_time, '%H:%i:%s') AS inform_start_time,
            TIME_FORMAT(inform_end_time,   '%H:%i:%s') AS inform_end_time,
            task_name, task_date, \`group\`, site, \`line\`, warranty, equipment_type, equipment_name, ems
     FROM work_log_paid_pending
     WHERE pending_id = ?
     ORDER BY id ASC`,
    [pendingId]
  );
  return rows;
};

// (검증/조회) 본 테이블 유상 상세
exports.getLivePaidRows = async (workLogId) => {
  const [rows] = await pool.query(
    `SELECT id, work_log_id, paid_worker,
            TIME_FORMAT(line_start_time, '%H:%i:%s') AS line_start_time,
            TIME_FORMAT(line_end_time,   '%H:%i:%s') AS line_end_time,
            TIME_FORMAT(inform_start_time, '%H:%i:%s') AS inform_start_time,
            TIME_FORMAT(inform_end_time,   '%H:%i:%s') AS inform_end_time,
            task_name, task_date, \`group\`, site, \`line\`, warranty, equipment_type, equipment_name, ems
     FROM work_log_paid
     WHERE work_log_id = ?
     ORDER BY id ASC`,
    [workLogId]
  );
  return rows;
};
