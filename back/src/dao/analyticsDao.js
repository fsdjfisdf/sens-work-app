/**
 * analyticsDao.js — Analytics Dashboard DAO (v3)
 */
'use strict';
const { pool } = require('../../config/database');

function buildWhere(filters, prefix = 'u') {
  const cond = ['1=1'];
  const vals = [];
  if (filters.company) { cond.push(`${prefix}.COMPANY = ?`); vals.push(filters.company); }
  if (filters.group)   { cond.push(`${prefix}.\`GROUP\` = ?`); vals.push(filters.group); }
  if (filters.site)    { cond.push(`${prefix}.SITE = ?`); vals.push(filters.site); }
  if (filters.name)    { cond.push(`${prefix}.NAME LIKE ?`); vals.push(`%${filters.name}%`); }
  return { where: `WHERE ${cond.join(' AND ')}`, vals };
}

let _userCols = null;
async function getUserDBCols() {
  if (_userCols) return _userCols;
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='userDB'`
  );
  _userCols = new Set(rows.map(r => r.c));
  return _userCols;
}
function hasCol(cols, name) { return cols.has(name); }

let _resignedCols = null;
async function getResignedCols() {
  if (_resignedCols) return _resignedCols;
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='resigned_employee'`
  );
  _resignedCols = new Set(rows.map(r => r.c));
  return _resignedCols;
}

function buildWhereResigned(filters, prefix = '') {
  const p = prefix ? `${prefix}.` : '';
  const cond = ['1=1'];
  const vals = [];
  if (filters.company) { cond.push(`${p}company = ?`); vals.push(filters.company); }
  if (filters.group)   { cond.push(`${p}\`group\` = ?`); vals.push(filters.group); }
  if (filters.site)    { cond.push(`${p}site = ?`); vals.push(filters.site); }
  if (filters.name)    { cond.push(`${p}name LIKE ?`); vals.push(`%${filters.name}%`); }
  return { where: `WHERE ${cond.join(' AND ')}`, vals };
}

exports.getFilterOptions = async () => {
  const [companies] = await pool.query(`SELECT DISTINCT COMPANY AS v FROM userDB WHERE COMPANY IS NOT NULL ORDER BY COMPANY`);
  const [groups]    = await pool.query(`SELECT DISTINCT \`GROUP\` AS v FROM userDB WHERE \`GROUP\` IS NOT NULL ORDER BY \`GROUP\``);
  const [sites]     = await pool.query(`SELECT DISTINCT SITE AS v FROM userDB WHERE SITE IS NOT NULL ORDER BY SITE`);
  const [names]     = await pool.query(`SELECT ID, NAME, \`GROUP\` AS grp, SITE FROM userDB ORDER BY NAME`);
  return { companies: companies.map(r=>r.v), groups: groups.map(r=>r.v), sites: sites.map(r=>r.v), engineers: names };
};

exports.getHeadCount = async (filters) => {
  const START_YM = '2023-01';
  const BASE_END = '2022-12-31';

  const colsR = await getResignedCols();
  const { where, vals } = buildWhere(filters);
  const { where: rWhere, vals: rVals } = buildWhereResigned(filters, 'r');

  // hires: active(userDB) + resigned(resigned_employee)
  const [hiresUser] = await pool.query(
    `SELECT DATE_FORMAT(u.HIRE, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(u.NAME SEPARATOR ', ') AS names
     FROM userDB u ${where} AND u.HIRE IS NOT NULL
     GROUP BY ym ORDER BY ym`,
    vals
  );

  let hiresResigned = [];
  if (hasCol(colsR, 'hire_date')) {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(r.hire_date, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(r.name SEPARATOR ', ') AS names
       FROM resigned_employee r ${rWhere} AND r.hire_date IS NOT NULL
       GROUP BY ym ORDER BY ym`,
      rVals
    );
    hiresResigned = rows;
  }

  const mergeByYm = (a, b) => {
    const m = new Map();
    const push = (r) => {
      if (!r?.ym) return;
      const cur = m.get(r.ym) || { ym: r.ym, cnt: 0, names: '' };
      cur.cnt += Number(r.cnt || 0);
      if (r.names) cur.names = cur.names ? `${cur.names}, ${r.names}` : r.names;
      m.set(r.ym, cur);
    };
    a.forEach(push);
    b.forEach(push);
    return Array.from(m.values()).sort((x, y) => String(x.ym).localeCompare(String(y.ym)));
  };
  const hires = mergeByYm(hiresUser, hiresResigned);

  const [resigns] = await pool.query(
    `SELECT DATE_FORMAT(r.resign_date, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(r.name SEPARATOR ', ') AS names
     FROM resigned_employee r ${rWhere} AND r.resign_date IS NOT NULL
     GROUP BY ym ORDER BY ym`,
    rVals
  );

  // baseline: 재직자(START_YM 이전) 포함
  let baseline = 0;
  if (hasCol(colsR, 'hire_date')) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM (
         SELECT u.HIRE AS hire_date, NULL AS resign_date
         FROM userDB u ${where}
         UNION ALL
         SELECT r.hire_date, r.resign_date
         FROM resigned_employee r ${rWhere} AND r.hire_date IS NOT NULL
       ) x
       WHERE x.hire_date IS NOT NULL
         AND x.hire_date <= ?
         AND (x.resign_date IS NULL OR x.resign_date > ?)`,
      [...vals, ...rVals, BASE_END, BASE_END]
    );
    baseline = rows[0]?.cnt || 0;
  } else {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM userDB u ${where} AND u.HIRE IS NOT NULL AND u.HIRE <= ?`,
      [...vals, BASE_END]
    );
    baseline = rows[0]?.cnt || 0;
  }

  const [total] = await pool.query(`SELECT COUNT(*) AS cnt FROM userDB u ${where}`, vals);
  return { startYm: START_YM, baseline, hires, resigns, currentTotal: total[0]?.cnt || 0 };
};

exports.getHRDistribution = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [byCompany] = await pool.query(
    `SELECT COMPANY AS label, COUNT(*) AS cnt
     FROM userDB u ${where}
     GROUP BY COMPANY`,
    vals
  );

  const [byExp] = await pool.query(
    `SELECT CASE
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<1 THEN '1년차 미만'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<2 THEN '1년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<3 THEN '2년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<4 THEN '3년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<5 THEN '4년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<6 THEN '5년차'
       ELSE '6년차 이상' END AS label,
       COUNT(*) AS cnt
     FROM userDB u ${where} AND HIRE IS NOT NULL
     GROUP BY label
     ORDER BY FIELD(label,'1년차 미만','1년차','2년차','3년차','4년차','5년차','6년차 이상')`,
    vals
  );

  const [byGroupSite] = await pool.query(
    `SELECT CONCAT(\`GROUP\`,' / ',SITE) AS label, COUNT(*) AS cnt
     FROM userDB u ${where}
     GROUP BY \`GROUP\`,SITE
     ORDER BY \`GROUP\`,SITE`,
    vals
  );

  return { byCompany, byExp, byGroupSite };
};

exports.getLevelDistribution = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [rows] = await pool.query(
    `SELECT \`LEVEL(report)\` AS label, COUNT(*) AS cnt
     FROM userDB u ${where}
     GROUP BY \`LEVEL(report)\`
     ORDER BY FIELD(\`LEVEL(report)\`,'0','1','2','2-2','2-3','2-4')`,
    vals
  );
  return rows;
};

exports.getLevelAchievement = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const v6 = vals.concat(vals, vals, vals, vals, vals);
  const [rows] = await pool.query(
    `SELECT '1-1' AS level_code, ROUND(AVG(DATEDIFF(\`Level1 Achieve\`,HIRE)),0) AS avg_days, COUNT(\`Level1 Achieve\`) AS cnt
     FROM userDB u ${where} AND \`Level1 Achieve\` IS NOT NULL AND HIRE IS NOT NULL
     UNION ALL SELECT '1-2', ROUND(AVG(DATEDIFF(\`Level2 Achieve\`,\`Level1 Achieve\`)),0), COUNT(*)
     FROM userDB u ${where} AND \`Level2 Achieve\` IS NOT NULL AND \`Level1 Achieve\` IS NOT NULL
     UNION ALL SELECT '1-3', ROUND(AVG(DATEDIFF(\`Level3 Achieve\`,\`Level2 Achieve\`)),0), COUNT(*)
     FROM userDB u ${where} AND \`Level3 Achieve\` IS NOT NULL AND \`Level2 Achieve\` IS NOT NULL
     UNION ALL SELECT '2', ROUND(AVG(DATEDIFF(\`Level4 Achieve\`,\`Level3 Achieve\`)),0), COUNT(*)
     FROM userDB u ${where} AND \`Level4 Achieve\` IS NOT NULL AND \`Level3 Achieve\` IS NOT NULL
     UNION ALL SELECT '2-2', ROUND(AVG(DATEDIFF(\`Level2-2(B) Achieve\`,\`Level4 Achieve\`)),0), COUNT(*)
     FROM userDB u ${where} AND \`Level2-2(B) Achieve\` IS NOT NULL AND \`Level4 Achieve\` IS NOT NULL
     UNION ALL SELECT '2-3', ROUND(AVG(DATEDIFF(\`Level2-2(A) Achieve\`,\`Level2-2(B) Achieve\`)),0), COUNT(*)
     FROM userDB u ${where} AND \`Level2-2(A) Achieve\` IS NOT NULL AND \`Level2-2(B) Achieve\` IS NOT NULL`,
    v6
  );
  return rows;
};

exports.getLevelTrend = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [engineers] = await pool.query(
    `SELECT u.ID, u.NAME, u.HIRE,
       u.\`Level1 Achieve\` AS l1, u.\`Level2 Achieve\` AS l2,
       u.\`Level3 Achieve\` AS l3, u.\`Level4 Achieve\` AS l4,
       u.\`Level2-2(B) Achieve\` AS l22, u.\`Level2-2(A) Achieve\` AS l23,
       u.\`Level2-3(B) Achieve\` AS l24
     FROM userDB u ${where}`,
    vals
  );
  return engineers;
};

exports.getCapability = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const months = [];
  for (const m of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']) {
    months.push({
      col: `25Y${m}`,
      setup: `25Y${m}_SETUP`,
      maint: `25Y${m}_MAINT`,
      ym: `2025-${String(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(m)+1).padStart(2,'0')}`
    });
  }
  for (const m of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP']) {
    const sc = m === 'AUG' ? '26AUG_SETUP' : `26Y${m}_SETUP`;
    months.push({
      col: `26Y${m}`,
      setup: sc,
      maint: `26Y${m}_MAINT`,
      ym: `2026-${String(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP'].indexOf(m)+1).padStart(2,'0')}`
    });
  }

  const selects = months.map(m =>
    `SELECT '${m.ym}' AS ym,
            AVG(u.\`${m.col}\`) AS avg_total,
            AVG(u.\`${m.setup}\`) AS avg_setup,
            AVG(u.\`${m.maint}\`) AS avg_maint,
            AVG(u.\`MULTI CAPA\`) AS avg_multi
     FROM userDB u ${where} AND u.\`${m.col}\` IS NOT NULL AND u.\`${m.col}\` > 0`
  ).join('\nUNION ALL\n');

  const [rows] = await pool.query(selects, Array(months.length).fill(vals).flat());
  const [goals] = await pool.query(
    `SELECT AVG(\`25Y CAPA GOAL\`) AS g25, AVG(\`26Y CAPA GOAL\`) AS g26 FROM userDB u ${where}`,
    vals
  );
  return { monthly: rows.filter(r => r.avg_total), goals: goals[0] || {} };
};

exports.getEqCapability = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const eqs = ['SUPRA N','SUPRA XP','INTEGER','PRECIA','ECOLITE','GENEVA','HDW'];
  const selects = eqs.map(eq =>
    `SELECT '${eq}' AS eq_name,
            AVG(CASE WHEN u.\`${eq} SET UP\`>0 THEN u.\`${eq} SET UP\` END) AS avg_setup,
            AVG(CASE WHEN u.\`${eq} MAINT\`>0 THEN u.\`${eq} MAINT\` END) AS avg_maint,
            AVG(CASE WHEN u.\`${eq} SET UP\`>0 OR u.\`${eq} MAINT\`>0
                     THEN (IFNULL(u.\`${eq} SET UP\`,0)+IFNULL(u.\`${eq} MAINT\`,0))/2 END) AS avg_total,
            COUNT(CASE WHEN u.\`${eq} SET UP\`>0 OR u.\`${eq} MAINT\`>0 THEN 1 END) AS eng_count
     FROM userDB u ${where}`
  ).join('\nUNION ALL\n');

  const [rows] = await pool.query(selects, Array(eqs.length).fill(vals).flat());
  return rows;
};

exports.getWorklogStats = async (filters) => {
  const wCond = [`e.approval_status='APPROVED'`];
  const wVals = [];
  if (filters.group) { wCond.push(`e.\`group\`=?`); wVals.push(filters.group); }
  if (filters.site)  { wCond.push(`e.site=?`); wVals.push(filters.site); }
  if (filters.name)  { wCond.push(`w.engineer_name LIKE ?`); wVals.push(`%${filters.name}%`); }
  const wWhere = `WHERE ${wCond.join(' AND ')}`;

  const [monthlyHours] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym,
            SUM(w.task_duration) AS total_minutes,
            COUNT(DISTINCT e.id) AS event_count
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere}
     GROUP BY ym
     ORDER BY ym`,
    wVals
  );

  const [byWorkType] = await pool.query(
    `SELECT e.work_type AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere}
     GROUP BY e.work_type`,
    wVals
  );

  const [byWorkType2] = await pool.query(
    `SELECT IFNULL(e.work_type2,'N/A') AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere} AND e.work_type='MAINT'
     GROUP BY label`,
    wVals
  );

  const [byShift] = await pool.query(
    `SELECT CASE WHEN TIME(w.start_time)<'12:00:00' THEN '오전 근무' ELSE '오후 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere} AND w.start_time IS NOT NULL
     GROUP BY label`,
    wVals
  );

  const [byOvertime] = await pool.query(
    `SELECT CASE WHEN TIME(w.end_time)<='18:00:00' THEN '일반 근무' ELSE '초과 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere} AND w.end_time IS NOT NULL
     GROUP BY label`,
    wVals
  );

  const [shiftByGroupSite] = await pool.query(
    `SELECT CONCAT(e.\`group\`,'-',e.site) AS label,
            SUM(CASE WHEN TIME(w.start_time)>='12:00:00' THEN 1 ELSE 0 END) AS afternoon_cnt,
            COUNT(*) AS total_cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere} AND w.start_time IS NOT NULL
     GROUP BY e.\`group\`, e.site
     ORDER BY e.\`group\`, e.site`,
    wVals
  );

  const [overtimeByGroupSite] = await pool.query(
    `SELECT CONCAT(e.\`group\`,'-',e.site) AS label,
            SUM(CASE WHEN TIME(w.end_time)>'18:00:00' THEN 1 ELSE 0 END) AS overtime_cnt,
            COUNT(*) AS total_cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere} AND w.end_time IS NOT NULL
     GROUP BY e.\`group\`, e.site
     ORDER BY e.\`group\`, e.site`,
    wVals
  );

  const [reworkRatio] = await pool.query(
    `SELECT CASE WHEN e.is_rework=1 THEN 'Rework' ELSE '일반' END AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere}
     GROUP BY label`,
    wVals
  );

  const [reworkReason] = await pool.query(
    `SELECT IFNULL(e.rework_reason,'미입력') AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     ${wWhere} AND e.is_rework=1
     GROUP BY label`,
    wVals
  );

  return { monthlyHours, byWorkType, byWorkType2, byShift, byOvertime, shiftByGroupSite, overtimeByGroupSite, reworkRatio, reworkReason };
};

exports.getEngineerInfo = async (name) => {
  const cols = await getUserDBCols();
  const extra = [];
  if (hasCol(cols, '25Y CAPA GOAL')) extra.push('u.\`25Y CAPA GOAL\` AS g25');
  if (hasCol(cols, '26Y CAPA GOAL')) extra.push('u.\`26Y CAPA GOAL\` AS g26');
  if (hasCol(cols, '25Y LEVEL GOAL')) extra.push('u.\`25Y LEVEL GOAL\` AS lv_goal_25');
  if (hasCol(cols, '26Y LEVEL GOAL')) extra.push('u.\`26Y LEVEL GOAL\` AS lv_goal_26');

  // level achieved dates (optional)
  if (hasCol(cols, 'Level1 Achieve')) extra.push('u.\`Level1 Achieve\` AS lv11');
  if (hasCol(cols, 'Level2 Achieve')) extra.push('u.\`Level2 Achieve\` AS lv12');
  if (hasCol(cols, 'Level3 Achieve')) extra.push('u.\`Level3 Achieve\` AS lv13');
  if (hasCol(cols, 'Level4 Achieve')) extra.push('u.\`Level4 Achieve\` AS lv2');
  if (hasCol(cols, 'Level2-2(B) Achieve')) extra.push('u.\`Level2-2(B) Achieve\` AS lv22');
  if (hasCol(cols, 'Level2-2(A) Achieve')) extra.push('u.\`Level2-2(A) Achieve\` AS lv23');
  if (hasCol(cols, 'Level2-3(B) Achieve')) extra.push('u.\`Level2-3(B) Achieve\` AS lv24');

  const [rows] = await pool.query(
    `SELECT u.ID, u.NAME, u.COMPANY, u.EMPLOYEE_ID, u.\`GROUP\`, u.SITE, u.HIRE, u.role,
            u.\`LEVEL(report)\`, u.\`LEVEL\`, u.\`LEVEL(PSK)\`, u.\`MULTI LEVEL\`, u.\`MULTI LEVEL(PSK)\`,
            u.\`MAIN EQ\`, u.\`MULTI EQ\`, u.\`SET UP CAPA\`, u.\`MAINT CAPA\`, u.\`MULTI CAPA\`, u.CAPA, u.MPI
            ${extra.length ? ',' + extra.join(',') : ''}
     FROM userDB u
     WHERE u.NAME=?
     LIMIT 1`,
    [name]
  );
  return rows[0] || null;
};

exports.addEngineer = async (data) => {
  const cols = await getUserDBCols();
  const fields = [
    'NAME','COMPANY','EMPLOYEE_ID','`GROUP`','SITE','HIRE','role','`MAIN EQ`','`MULTI EQ`',
    '`LEVEL`','`LEVEL(PSK)`','`LEVEL(report)`','`MULTI LEVEL`','`MULTI LEVEL(PSK)`'
  ];
  const values = [
    data.name,
    data.company,
    data.employee_id || null,
    data.group,
    data.site,
    data.hire_date || null,
    data.role || 'worker',
    data.main_eq || null,
    data.multi_eq || null,
    0, 0, '0', 0, 0
  ];

  if (hasCol(cols, '26Y CAPA GOAL')) { fields.push('`26Y CAPA GOAL`'); values.push(data.g26 ?? null); }
  if (hasCol(cols, '26Y LEVEL GOAL')) { fields.push('`26Y LEVEL GOAL`'); values.push(data.lv_goal_26 ?? null); }

  const placeholders = fields.map(() => '?').join(',');
  const sql = `INSERT INTO userDB (${fields.join(',')}) VALUES (${placeholders})`;
  const [r] = await pool.query(sql, values);
  return r.insertId;
};

exports.updateEngineer = async (id, data) => {
  const cols = await getUserDBCols();
  const set = [];
  const vals = [];

  const map = {
    'NAME': data.name,
    'COMPANY': data.company,
    'EMPLOYEE_ID': data.employee_id,
    '`GROUP`': data.group,
    'SITE': data.site,
    'HIRE': data.hire_date,
    'role': data.role,
    '`MAIN EQ`': data.main_eq,
    '`MULTI EQ`': data.multi_eq,
  };

  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      set.push(`${k}=?`);
      vals.push(v === '' ? null : v);
    }
  }

  if (hasCol(cols, '25Y CAPA GOAL') && data.g25 !== undefined) {
    set.push('`25Y CAPA GOAL`=?');
    vals.push(data.g25 === '' ? null : data.g25);
  }
  if (hasCol(cols, '26Y CAPA GOAL') && data.g26 !== undefined) {
    set.push('`26Y CAPA GOAL`=?');
    vals.push(data.g26 === '' ? null : data.g26);
  }
  if (hasCol(cols, '25Y LEVEL GOAL') && data.lv_goal_25 !== undefined) {
    set.push('`25Y LEVEL GOAL`=?');
    vals.push(data.lv_goal_25 === '' ? null : data.lv_goal_25);
  }
  if (hasCol(cols, '26Y LEVEL GOAL') && data.lv_goal_26 !== undefined) {
    set.push('`26Y LEVEL GOAL`=?');
    vals.push(data.lv_goal_26 === '' ? null : data.lv_goal_26);
  }

  // level achieved dates
  const lvMap = [
    { col: 'Level1 Achieve', key: 'lv11' },
    { col: 'Level2 Achieve', key: 'lv12' },
    { col: 'Level3 Achieve', key: 'lv13' },
    { col: 'Level4 Achieve', key: 'lv2' },
    { col: 'Level2-2(B) Achieve', key: 'lv22' },
    { col: 'Level2-2(A) Achieve', key: 'lv23' },
    { col: 'Level2-3(B) Achieve', key: 'lv24' },
  ];
  for (const { col, key } of lvMap) {
    if (!hasCol(cols, col)) continue;
    if (data[key] !== undefined) {
      set.push(`\`${col}\`=?`);
      vals.push(data[key] === '' ? null : data[key]);
    }
  }

  if (!set.length) return;
  vals.push(id);
  await pool.query(`UPDATE userDB SET ${set.join(', ')} WHERE ID=?`, vals);
};

exports.resignEngineer = async ({ id, name, resign_date }) => {
  let row = null;
  if (id) {
    const [r] = await pool.query(`SELECT ID, NAME, COMPANY, EMPLOYEE_ID, HIRE, \`GROUP\` AS grp, SITE FROM userDB WHERE ID=? LIMIT 1`, [id]);
    row = r[0] || null;
  } else if (name) {
    const [r] = await pool.query(`SELECT ID, NAME, COMPANY, EMPLOYEE_ID, HIRE, \`GROUP\` AS grp, SITE FROM userDB WHERE NAME=? LIMIT 1`, [name]);
    row = r[0] || null;
    id = row?.ID;
  }
  if (!row) throw new Error('대상 엔지니어를 찾을 수 없습니다.');

  const colsR = await getResignedCols();
  const fields = [];
  const values = [];

  const add = (col, v) => {
    if (!hasCol(colsR, col)) return;
    fields.push(col === 'group' ? '`group`' : col);
    values.push(v);
  };

  add('userdb_id', row.ID);
  add('name', row.NAME);
  add('company', row.COMPANY);
  add('employee_id', row.EMPLOYEE_ID || null);
  add('group', row.grp);
  add('site', row.SITE);
  add('hire_date', row.HIRE || null);
  add('resign_date', resign_date);
  add('reason', null);

  if (!fields.length) throw new Error('resigned_employee 테이블 컬럼을 확인해주세요.');

  const placeholders = fields.map(() => '?').join(',');
  const updates = fields
    .filter(f => f !== 'userdb_id')
    .map(f => `${f} = VALUES(${f})`)
    .join(', ');

  const sql = updates
    ? `INSERT INTO resigned_employee (${fields.join(',')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`
    : `INSERT INTO resigned_employee (${fields.join(',')}) VALUES (${placeholders})`;

  await pool.query(sql, values);

  if (id) await pool.query(`DELETE FROM userDB WHERE ID=?`, [id]);
};

exports.reinstateEngineer = async (name) => {
  await pool.query(`DELETE FROM resigned_employee WHERE name=?`, [name]);
};

exports.getExportData = async (filters) => {
  const cols = await getUserDBCols();
  const { where, vals } = buildWhere(filters);

  const monthCols = [];
  const pushMonth = (col) => { if (hasCol(cols, col)) monthCols.push(`u.\`${col}\``); };

  // 2025
  for (const m of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']) {
    pushMonth(`25Y${m}`);
    pushMonth(`25Y${m}_SETUP`);
    pushMonth(`25Y${m}_MAINT`);
  }
  // 2026
  for (const m of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP']) {
    pushMonth(`26Y${m}`);
    const sc = m === 'AUG' ? '26AUG_SETUP' : `26Y${m}_SETUP`;
    pushMonth(sc);
    pushMonth(`26Y${m}_MAINT`);
  }

  const extra = [];
  if (hasCol(cols, '26Y CAPA GOAL')) extra.push('u.\`26Y CAPA GOAL\`');
  if (hasCol(cols, '26Y LEVEL GOAL')) extra.push('u.\`26Y LEVEL GOAL\`');

  const selectMonthly = monthCols.length ? `, ${monthCols.join(', ')}` : '';
  const selectExtra = extra.length ? `, ${extra.join(', ')}` : '';

  const [rows] = await pool.query(
    `SELECT u.NAME, u.COMPANY, u.EMPLOYEE_ID, u.\`GROUP\`, u.SITE, u.HIRE,
            u.\`LEVEL(report)\` AS level_report, u.\`LEVEL\` AS level_internal, u.\`LEVEL(PSK)\` AS level_psk,
            u.\`MULTI LEVEL\` AS multi_level, u.\`MULTI LEVEL(PSK)\` AS multi_level_psk,
            u.\`MAIN EQ\`, u.\`MULTI EQ\`,
            u.\`SUPRA N SET UP\`, u.\`SUPRA N MAINT\`, u.\`SUPRA XP SET UP\`, u.\`SUPRA XP MAINT\`,
            u.\`INTEGER SET UP\`, u.\`INTEGER MAINT\`, u.\`PRECIA SET UP\`, u.\`PRECIA MAINT\`,
            u.\`ECOLITE SET UP\`, u.\`ECOLITE MAINT\`, u.\`GENEVA SET UP\`, u.\`GENEVA MAINT\`,
            u.\`HDW SET UP\`, u.\`HDW MAINT\`,
            u.\`SET UP CAPA\`, u.\`MAINT CAPA\`, u.\`MULTI CAPA\`, u.CAPA, u.MPI,
            u.\`SUPRA N MPI\`, u.\`SUPRA XP MPI\`, u.\`INTEGER MPI\`, u.\`PRECIA MPI\`,
            u.\`ECOLITE MPI\`, u.\`GENEVA MPI\`, u.\`HDW MPI\`,
            u.role,
            u.\`Level1 Achieve\`, u.\`Level2 Achieve\`, u.\`Level3 Achieve\`, u.\`Level4 Achieve\`,
            u.\`Level2-2(B) Achieve\`, u.\`Level2-2(A) Achieve\`
            ${selectExtra}
            ${selectMonthly}
     FROM userDB u ${where}
     ORDER BY u.\`GROUP\`, u.SITE, u.NAME`,
    vals
  );

  return rows;
};
