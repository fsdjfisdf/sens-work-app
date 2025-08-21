const { pool } = require('../../config/database');

/**
 * freq: 'day' | 'week' | 'month'
 * group, site: optional (null/빈문자면 무시)
 * 반환: [{ bucket: 'YYYY-MM[-DD|Www]', total_hours: Number }]
 */
exports.getAggregatedSeries = async ({ freq = 'month', group = null, site = null }) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    // 공통 합산식: 총 작업시간(h) = task_duration(time) + move_time(min) + none_time(min)
    // TIME_TO_SEC(task_duration)/3600 + move_time/60 + none_time/60
    let sql = '';
    if (freq === 'day') {
      sql = `
        SELECT DATE(task_date) AS bucket,
               SUM(TIME_TO_SEC(task_duration)/3600 + (COALESCE(move_time,0)/60.0) + (COALESCE(none_time,0)/60.0)) AS total_hours
        FROM work_log
        WHERE 1=1
          ${group ? 'AND TRIM(\`group\`) = ?' : ''}
          ${site  ? 'AND TRIM(site) = ?' : ''}
        GROUP BY DATE(task_date)
        ORDER BY DATE(task_date)
      `;
    } else if (freq === 'week') {
      // ISO 주차 라벨 간단 포맷: YYYY-Www (월요일 시작 기준)
      sql = `
        SELECT DATE_FORMAT(task_date - INTERVAL (WEEKDAY(task_date)) DAY, '%Y-W%u') AS bucket,
               SUM(TIME_TO_SEC(task_duration)/3600 + (COALESCE(move_time,0)/60.0) + (COALESCE(none_time,0)/60.0)) AS total_hours
        FROM work_log
        WHERE 1=1
          ${group ? 'AND TRIM(\`group\`) = ?' : ''}
          ${site  ? 'AND TRIM(site) = ?' : ''}
        GROUP BY bucket
        ORDER BY bucket
      `;
    } else {
      // month
      sql = `
        SELECT DATE_FORMAT(task_date, '%Y-%m') AS bucket,
               SUM(TIME_TO_SEC(task_duration)/3600 + (COALESCE(move_time,0)/60.0) + (COALESCE(none_time,0)/60.0)) AS total_hours
        FROM work_log
        WHERE 1=1
          ${group ? 'AND TRIM(\`group\`) = ?' : ''}
          ${site  ? 'AND TRIM(site) = ?' : ''}
        GROUP BY DATE_FORMAT(task_date, '%Y-%m')
        ORDER BY DATE_FORMAT(task_date, '%Y-%m')
      `;
    }

    const params = [];
    if (group) params.push(group);
    if (site)  params.push(site);

    const [rows] = await connection.query(sql, params);
    connection.release();

    return rows.map(r => ({
      bucket: String(r.bucket),
      total_hours: Number(r.total_hours) || 0
    }));
  } catch (err) {
    connection.release();
    throw new Error(`getAggregatedSeries failed: ${err.message}`);
  }
};
