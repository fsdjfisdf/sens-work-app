const { pool } = require('../../config/database');

/**
 * 일 단위로 총 작업시간을 집계해서 돌려준다.
 * (나중에 컨트롤러에서 주/월로 리샘플)
 */
exports.fetchDailyHours = async ({ group, site, startDate, endDate }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const where = [];
    const params = [];

    // 날짜 조건 (선택)
    if (startDate) { where.push('DATE(task_date) >= ?'); params.push(startDate); }
    if (endDate)   { where.push('DATE(task_date) <= ?'); params.push(endDate); }

    // 그룹/사이트 필터 (선택)
    if (group) { where.push('TRIM(`group`) = ?'); params.push(group.trim()); }
    if (site)  { where.push('TRIM(site) = ?');   params.push(site.trim()); }

    const sql = `
      SELECT
        DATE(task_date) AS d,
        COALESCE( SUM(TIME_TO_SEC(COALESCE(task_duration,'00:00:00'))) / 3600.0 , 0 ) +
        COALESCE( SUM(COALESCE(none_time,0)) / 60.0 , 0 ) +
        COALESCE( SUM(COALESCE(move_time,0)) / 60.0 , 0 )      AS hours
      FROM work_log
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY DATE(task_date)
      ORDER BY d ASC
    `;
    const [rows] = await conn.query(sql, params);
    return rows.map(r => ({ date: r.d, hours: Number(r.hours) || 0 }));
  } finally {
    conn.release();
  }
};

/**
 * userDB에서 인원 수를 집계한다.
 */
exports.countHeadcount = async ({ group, site }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const where = [];
    const params = [];

    if (group) { where.push('TRIM(`GROUP`) = ?'); params.push(group.trim()); }
    if (site)  { where.push('TRIM(SITE) = ?');   params.push(site.trim()); }

    const sql = `
      SELECT COUNT(*) AS count
      FROM userDB
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    `;
    const [rows] = await conn.query(sql, params);
    return Number(rows?.[0]?.count || 0);
  } finally {
    conn.release();
  }
};
