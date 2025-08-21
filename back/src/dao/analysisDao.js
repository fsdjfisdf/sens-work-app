const mysql = require('mysql2/promise');
const pool  = require('../db'); // 기존 프로젝트의 풀을 사용하세요. 없으면 여기서 생성하도록 수정.

exports.getAggregatedSeries = async ({ freq='month', group=null, site=null }) => {
  const conn = await pool.getConnection();
  try {
    // 공통: 총 작업시간(h) = task_duration + move_time + none_time
    // task_duration(time) → TIME_TO_SEC/3600
    // freq별 버킷 라벨 생성
    let sql = '';
    if (freq === 'day') {
      sql = `
        SELECT DATE(task_date) AS bucket,
               SUM(TIME_TO_SEC(task_duration)/3600 + (move_time/60.0) + (none_time/60.0)) AS total_hours
        FROM work_log
        WHERE 1=1
          ${group ? 'AND TRIM(\`group\`) = ?' : ''}
          ${site  ? 'AND TRIM(site) = ?' : ''}
        GROUP BY DATE(task_date)
        ORDER BY DATE(task_date)
      `;
    } else if (freq === 'week') {
      // ISO 주간 라벨: YEARWEEK + 포맷. (간단히 "YYYY-Www")
      sql = `
        SELECT DATE_FORMAT(task_date - INTERVAL (WEEKDAY(task_date)) DAY, '%Y-W%u') AS bucket,
               SUM(TIME_TO_SEC(task_duration)/3600 + (move_time/60.0) + (none_time/60.0)) AS total_hours
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
               SUM(TIME_TO_SEC(task_duration)/3600 + (move_time/60.0) + (none_time/60.0)) AS total_hours
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

    const [rows] = await conn.query(sql, params);
    return rows.map(r => ({
      bucket: String(r.bucket),
      total_hours: Number(r.total_hours) || 0
    }));
  } finally {
    conn.release();
  }
};
