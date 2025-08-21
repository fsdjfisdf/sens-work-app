// src/dao/analysisDao.js
const { pool } = require('../../config/database');

/**
 * 일 단위 총 작업시간 집계
 * 합계 = TIME_TO_SEC(task_duration)/3600 + none_time/60 + (includeMove ? move_time/60 : 0)
 *
 * ONLY_FULL_GROUP_BY 호환:
 *  - 내부 서브쿼리에서 DATE(task_date) AS d, hours 계산
 *  - 외부 쿼리에서 d 로 GROUP BY/ORDER BY
 */
exports.fetchDailyHours = async ({ group, site, startDate, endDate, includeMove = true }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const where = [];
    const params = [];

    if (startDate) { where.push('DATE(task_date) >= ?'); params.push(startDate); }
    if (endDate)   { where.push('DATE(task_date) <= ?'); params.push(endDate); }

    if (group) { where.push('TRIM(`group`) = ?'); params.push(group.trim()); }
    if (site)  { where.push('TRIM(site) = ?');   params.push(site.trim()); }

    const moveExpr = includeMove ? `COALESCE(move_time, 0) / 60.0` : `0.0`;

    const sql = `
      SELECT
        DATE_FORMAT(d, '%Y-%m-%d') AS d,
        SUM(hours) AS hours
      FROM (
        SELECT
          DATE(task_date) AS d,
          (
            COALESCE(TIME_TO_SEC(COALESCE(task_duration,'00:00:00')) / 3600.0, 0) +
            COALESCE(none_time, 0) / 60.0 +
            ${moveExpr}
          ) AS hours
        FROM work_log
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ) t
      GROUP BY d
      ORDER BY d ASC
    `;
    const [rows] = await conn.query(sql, params);
    return rows.map(r => ({ date: String(r.d), hours: Number(r.hours) || 0 }));
  } finally {
    conn.release();
  }
};

/**
 * userDB 현재 인원 집계 (필터: GROUP, SITE)
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
