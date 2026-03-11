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

exports.getFilterOptions = async () => {
  const [companies] = await pool.query(`SELECT DISTINCT COMPANY AS v FROM userDB WHERE COMPANY IS NOT NULL ORDER BY COMPANY`);
  const [groups]    = await pool.query(`SELECT DISTINCT \`GROUP\` AS v FROM userDB WHERE \`GROUP\` IS NOT NULL ORDER BY \`GROUP\``);
  const [sites]     = await pool.query(`SELECT DISTINCT SITE AS v FROM userDB WHERE SITE IS NOT NULL ORDER BY SITE`);
  const [names]     = await pool.query(`SELECT ID, NAME, \`GROUP\` AS grp, SITE FROM userDB ORDER BY NAME`);
  return { companies: companies.map(r=>r.v), groups: groups.map(r=>r.v), sites: sites.map(r=>r.v), engineers: names };
};

exports.getHeadCount = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [hires] = await pool.query(
    `SELECT DATE_FORMAT(HIRE, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(NAME SEPARATOR ', ') AS names
     FROM userDB u ${where} AND HIRE IS NOT NULL
     GROUP BY ym ORDER BY ym`,
    vals
  );

  const rCond = ['1=1'];
  const rVals = [];
  if (filters.company) { rCond.push(`company = ?`); rVals.push(filters.company); }
  if (filters.group)   { rCond.push(`\`group\` = ?`); rVals.push(filters.group); }
  if (filters.site)    { rCond.push(`site = ?`); rVals.push(filters.site); }

  const [resigns] = await pool.query(
    `SELECT DATE_FORMAT(resign_date, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(name SEPARATOR ', ') AS names
     FROM resigned_employee
     WHERE ${rCond.join(' AND ')}
     GROUP BY ym ORDER BY ym`,
    rVals
  );

  const [total] = await pool.query(`SELECT COUNT(*) AS cnt FROM userDB u ${where}`, vals);
  return { hires, resigns, currentTotal: total[0]?.cnt || 0 };
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
  if (hasCol(cols, '26Y CAPA GOAL')) extra.push('u.\`26Y CAPA GOAL\` AS g26');
  if (hasCol(cols, '26Y LEVEL GOAL')) extra.push('u.\`26Y LEVEL GOAL\` AS lv_goal_26');

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

  if (!set.length) return;
  vals.push(id);
  await pool.query(`UPDATE userDB SET ${set.join(', ')} WHERE ID=?`, vals);
};

exports.resignEngineer = async ({ id, name, resign_date }) => {
  let row = null;
  if (id) {
    const [r] = await pool.query(`SELECT ID, NAME, COMPANY, \`GROUP\` AS grp, SITE FROM userDB WHERE ID=? LIMIT 1`, [id]);
    row = r[0] || null;
  } else if (name) {
    const [r] = await pool.query(`SELECT ID, NAME, COMPANY, \`GROUP\` AS grp, SITE FROM userDB WHERE NAME=? LIMIT 1`, [name]);
    row = r[0] || null;
    id = row?.ID;
  }
  if (!row) throw new Error('대상 엔지니어를 찾을 수 없습니다.');

  await pool.query(
    `INSERT INTO resigned_employee (name, company, \`group\`, site, resign_date)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE company=VALUES(company), \`group\`=VALUES(\`group\`), site=VALUES(site), resign_date=VALUES(resign_date)`,
    [row.NAME, row.COMPANY, row.grp, row.SITE, resign_date]
  );

  if (id) await pool.query(`DELETE FROM userDB WHERE ID=?`, [id]);
};

exports.reinstateEngineer = async (name) => {
  await pool.query(`DELETE FROM resigned_employee WHERE name=?`, [name]);
};

exports.getMPICoverage = async (filters) => {
  const cols = await getUserDBCols();
  const { where, vals } = buildWhere(filters);

  const eqsAll = [
    { eq: 'SUPRA N', col: 'SUPRA N MPI' },
    { eq: 'SUPRA XP', col: 'SUPRA XP MPI' },
    { eq: 'INTEGER', col: 'INTEGER MPI' },
    { eq: 'PRECIA', col: 'PRECIA MPI' },
    { eq: 'ECOLITE', col: 'ECOLITE MPI' },
    { eq: 'GENEVA', col: 'GENEVA MPI' },
    { eq: 'HDW', col: 'HDW MPI' },
  ];

  const eqs = eqsAll.filter(e => hasCol(cols, e.col));
  if (!eqs.length) {
    const [totalRows] = await pool.query(`SELECT COUNT(*) AS cnt FROM userDB u ${where} AND u.MPI>=2`, vals);
    return { total_mpi2: totalRows[0]?.cnt || 0, byEquipment: [] };
  }

  const selects = eqs.map(e =>
    `SELECT '${e.eq}' AS eq,
            SUM(CASE WHEN u.MPI>=2 AND IFNULL(u.\`${e.col}\`,0)>=1 THEN 1 ELSE 0 END) AS cnt,
            GROUP_CONCAT(CASE WHEN u.MPI>=2 AND IFNULL(u.\`${e.col}\`,0)>=1 THEN u.NAME END ORDER BY u.NAME SEPARATOR ', ') AS names
     FROM userDB u ${where}`
  ).join('\nUNION ALL\n');

  const [rows] = await pool.query(selects, Array(eqs.length).fill(vals).flat());
  const [totalRows] = await pool.query(`SELECT COUNT(*) AS cnt FROM userDB u ${where} AND u.MPI>=2`, vals);
  return { total_mpi2: totalRows[0]?.cnt || 0, byEquipment: rows };
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

// =====================================================================================
// Myself dashboard (auth-only): returns only the logged-in user's data
// =====================================================================================
function normKey(s){ return (s||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }

exports.getMyDashboard = async (me) => {
  const cols = await getUserDBCols();

  // 1) Resolve user record (prefer EMPLOYEE_ID, fallback to NAME)
  const where = [];
  const vals = [];
  if (me.employee_id) { where.push('u.EMPLOYEE_ID=?'); vals.push(me.employee_id); }
  if (!where.length && me.name) { where.push('u.NAME=?'); vals.push(me.name); }
  if (!where.length) return { profile: null };

  const eqs = ['SUPRA N','SUPRA XP','INTEGER','PRECIA','ECOLITE','GENEVA','HDW'];

  const baseSelect = [
    'u.ID AS id',
    'u.NAME AS name',
    'u.COMPANY AS company',
    'u.EMPLOYEE_ID AS employee_id',
    'u.`GROUP` AS grp',
    'u.SITE AS site',
    'u.HIRE AS hire_date',
    'u.role AS role',
    'u.`MAIN EQ` AS main_eq',
    'u.`MULTI EQ` AS multi_eq',
    'u.`LEVEL(report)` AS level_report',
    'u.`LEVEL` AS level_internal',
    'u.`LEVEL(PSK)` AS level_psk',
    'u.`MULTI LEVEL` AS multi_level',
    'u.`MULTI LEVEL(PSK)` AS multi_level_psk',
    'u.`SET UP CAPA` AS setup_capa',
    'u.`MAINT CAPA` AS maint_capa',
    'u.`MULTI CAPA` AS multi_capa',
    'u.CAPA AS capa',
    'u.MPI AS mpi'
  ];

  // goals (optional)
  if (hasCol(cols,'25Y CAPA GOAL')) baseSelect.push('u.`25Y CAPA GOAL` AS goal25');
  if (hasCol(cols,'26Y CAPA GOAL')) baseSelect.push('u.`26Y CAPA GOAL` AS goal26');

  // level achieved dates (optional)
  const achCols = [
    ['Level1 Achieve','ach_11'],
    ['Level2 Achieve','ach_12'],
    ['Level3 Achieve','ach_13'],
    ['Level4 Achieve','ach_2'],
    ['Level2-2(B) Achieve','ach_22b'],
    ['Level2-2(A) Achieve','ach_23']
  ];
  for (const [c, a] of achCols) if (hasCol(cols,c)) baseSelect.push(`u.\`${c}\` AS ${a}`);

  // equipment capability columns (optional)
  for (const eq of eqs) {
    const c1 = `${eq} SET UP`;
    const c2 = `${eq} MAINT`;
    if (hasCol(cols,c1)) baseSelect.push(`u.\`${c1}\` AS ${normKey(eq)}_setup`);
    if (hasCol(cols,c2)) baseSelect.push(`u.\`${c2}\` AS ${normKey(eq)}_maint`);
  }

  // monthly columns (v3 logic)
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

  for (const m of months) {
    if (hasCol(cols, m.col))   baseSelect.push(`u.\`${m.col}\` AS m_${m.ym.replace('-','_')}_total`);
    if (hasCol(cols, m.setup)) baseSelect.push(`u.\`${m.setup}\` AS m_${m.ym.replace('-','_')}_setup`);
    if (hasCol(cols, m.maint)) baseSelect.push(`u.\`${m.maint}\` AS m_${m.ym.replace('-','_')}_maint`);
  }

  const [uRows] = await pool.query(
    `SELECT ${baseSelect.join(',\n')}
     FROM userDB u
     WHERE ${where.join(' AND ')}
     LIMIT 1`,
    vals
  );
  const u = uRows[0] || null;
  if (!u) return { profile: null };

  // 2) Profile block
  const profile = {
    id: u.id, name: u.name, company: u.company, employee_id: u.employee_id,
    group: u.grp, site: u.site, hire_date: u.hire_date, role: u.role,
    main_eq: u.main_eq, multi_eq: u.multi_eq,
    level_report: u.level_report, level_internal: u.level_internal, level_psk: u.level_psk,
    multi_level: u.multi_level, multi_level_psk: u.multi_level_psk,
    setup_capa: u.setup_capa, maint_capa: u.maint_capa, multi_capa: u.multi_capa, capa: u.capa,
    goal25: u.goal25 ?? null, goal26: u.goal26 ?? null,
    achieved: {
      '1-1': u.ach_11 ?? null,
      '1-2': u.ach_12 ?? null,
      '1-3': u.ach_13 ?? null,
      '2':   u.ach_2  ?? null,
      '2-2': u.ach_22b ?? null,
      '2-3': u.ach_23 ?? null
    }
  };

  // 3) Equipment capability (for bars)
  const eqCapability = eqs.map(eq => {
    const k = normKey(eq);
    const setup = u[`${k}_setup`] ?? null;
    const maint = u[`${k}_maint`] ?? null;
    const total = (setup!=null || maint!=null) ? ((Number(setup||0)+Number(maint||0))/2) : null;
    return { eq, setup, maint, total };
  });

  // 4) Main/Multi equipment capability
  function pickEqCap(eq){
    if(!eq) return { eq:null, setup:null, maint:null, total:null };
    const k = normKey(eq);
    const setup = u[`${k}_setup`] ?? null;
    const maint = u[`${k}_maint`] ?? null;
    const total = (setup!=null || maint!=null) ? ((Number(setup||0)+Number(maint||0))/2) : null;
    return { eq, setup, maint, total };
  }
  const mainCap = pickEqCap(profile.main_eq);
  const multiCap = pickEqCap(profile.multi_eq);

  // 5) Monthly CAPA (main: uses monthly *_SETUP/*_MAINT columns)
  const monthlyMain = [];
  const monthlyAvg = [];
  for (const m of months) {
    const keyBase = `m_${m.ym.replace('-','_')}`;
    const total = u[`${keyBase}_total`];
    const setup = u[`${keyBase}_setup`];
    const maint = u[`${keyBase}_maint`];
    // Keep only meaningful months (any non-null and >0)
    if ((total!=null && Number(total)>0) || (setup!=null && Number(setup)>0) || (maint!=null && Number(maint)>0)) {
      monthlyMain.push({ ym: m.ym, setup: setup!=null?Number(setup):null, maint: maint!=null?Number(maint):null, total: total!=null?Number(total):null });
      const goal = (m.ym.startsWith('2026-') ? profile.goal26 : profile.goal25);
      monthlyAvg.push({ ym: m.ym, total: total!=null?Number(total):null, goal: goal!=null?Number(goal):null });
    }
  }

  // 6) Monthly MULTI CAPA: try to use multi monthly columns if present, else fallback to worklog on multi_eq
  const multiCandidates = (y, mon) => ([
    `${y}${mon}_MULTI_SETUP`, `${y}${mon}_M_SETUP`, `${y}${mon}_MSETUP`, `${y}${mon}_MULTISETUP`,
  ]);
  const multiCandidatesM = (y, mon) => ([
    `${y}${mon}_MULTI_MAINT`, `${y}${mon}_M_MAINT`, `${y}${mon}_MMAINT`, `${y}${mon}_MULTIMAINT`,
    `${y}${mon}_MULTI_MAINT`, `${y}${mon}_MULTI_MAINT`,
  ]);
  function findFirst(list){
    for(const c of list) if(hasCol(cols,c)) return c;
    return null;
  }
  const monthlyMulti = [];
  let multiUnit = 'capa';
  // detect any multi columns
  let hasAnyMultiCols = false;
  for (const m of months) {
    const y = m.ym.startsWith('2025-') ? '25Y' : '26Y';
    const mon = m.ym.split('-')[1]; // '01'
    // map to JAN..DEC
    const idx = Number(mon)-1;
    const monName = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][idx];
    const cS = findFirst(multiCandidates(y, monName));
    const cM = findFirst(multiCandidatesM(y, monName));
    if (cS || cM) { hasAnyMultiCols = true; break; }
  }

  if (hasAnyMultiCols) {
    for (const m of months) {
      const y = m.ym.startsWith('2025-') ? '25Y' : '26Y';
      const idx = Number(m.ym.split('-')[1])-1;
      const monName = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][idx];
      const cS = findFirst(multiCandidates(y, monName));
      const cM = findFirst(multiCandidatesM(y, monName));
      const setup = cS ? u[cS] : null;
      const maint = cM ? u[cM] : null;
      if ((setup!=null && Number(setup)>0) || (maint!=null && Number(maint)>0)) {
        monthlyMulti.push({ ym: m.ym, setup: setup!=null?Number(setup):null, maint: maint!=null?Number(maint):null });
      }
    }
  } else {
    // fallback: derive from worklog minutes on user's multi_eq
    multiUnit = 'minutes';
    if (profile.multi_eq) {
      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym,
                SUM(CASE WHEN e.work_type='SET UP' THEN w.task_duration ELSE 0 END) AS setup_minutes,
                SUM(CASE WHEN e.work_type='MAINT' THEN w.task_duration ELSE 0 END) AS maint_minutes
         FROM wl_event e
         JOIN wl_worker w ON w.event_id=e.id
         WHERE e.approval_status='APPROVED'
           AND w.engineer_name=?
           AND e.equipment_type=?
         GROUP BY ym
         ORDER BY ym`,
        [profile.name, profile.multi_eq]
      );
      for (const r of rows) {
        if ((r.setup_minutes && Number(r.setup_minutes)>0) || (r.maint_minutes && Number(r.maint_minutes)>0)) {
          monthlyMulti.push({ ym: r.ym, setup: Number(r.setup_minutes||0), maint: Number(r.maint_minutes||0) });
        }
      }
    }
  }

  // 7) Worklog stats (myself)
  const meName = profile.name;
  const [monthlyHours] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym,
            SUM(w.task_duration) AS total_minutes,
            COUNT(DISTINCT e.id) AS event_count
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=?
     GROUP BY ym
     ORDER BY ym`,
    [meName]
  );

  const [byWorkType] = await pool.query(
    `SELECT e.work_type AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=?
     GROUP BY e.work_type`,
    [meName]
  );
  const [byWorkSort] = await pool.query(
    `SELECT IFNULL(e.work_type2,'N/A') AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND e.work_type='MAINT'
     GROUP BY label`,
    [meName]
  );

  const [byGroup] = await pool.query(
    `SELECT e.\`group\` AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND e.\`group\` IS NOT NULL AND e.\`group\`<>'SELECT'
     GROUP BY e.\`group\` ORDER BY cnt DESC`,
    [meName]
  );
  const [bySite] = await pool.query(
    `SELECT e.site AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND e.site IS NOT NULL AND e.site<>'SELECT'
     GROUP BY e.site ORDER BY cnt DESC`,
    [meName]
  );
  const [byLine] = await pool.query(
    `SELECT e.line AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND e.line IS NOT NULL AND e.line<>'SELECT'
     GROUP BY e.line ORDER BY cnt DESC`,
    [meName]
  );

  const [byShift] = await pool.query(
    `SELECT CASE WHEN TIME(w.start_time)<'12:00:00' THEN '오전 근무' ELSE '오후 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND w.start_time IS NOT NULL
     GROUP BY label`,
    [meName]
  );
  const [byOvertime] = await pool.query(
    `SELECT CASE WHEN TIME(w.end_time)<='18:00:00' THEN '일반 근무' ELSE '초과 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND w.end_time IS NOT NULL
     GROUP BY label`,
    [meName]
  );

  const [byEqType] = await pool.query(
    `SELECT e.equipment_type AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND e.equipment_type IS NOT NULL AND e.equipment_type<>'SELECT'
     GROUP BY e.equipment_type
     ORDER BY cnt DESC`,
    [meName]
  );

  const [reworkMonthly] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name=? AND e.is_rework=1
     GROUP BY ym ORDER BY ym`,
    [meName]
  );

  // 8) Ranks (this month)
  const [timeRank] = await pool.query(
    `SELECT w.engineer_name AS name, SUM(w.task_duration) AS total_minutes
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED'
       AND e.task_date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
     GROUP BY w.engineer_name
     ORDER BY total_minutes DESC`,
    []
  );
  const [taskRank] = await pool.query(
    `SELECT w.engineer_name AS name, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e JOIN wl_worker w ON w.event_id=e.id
     WHERE e.approval_status='APPROVED'
       AND e.task_date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
     GROUP BY w.engineer_name
     ORDER BY cnt DESC`,
    []
  );

  return {
    profile,
    capability: {
      eqCapability,
      main: mainCap,
      multi: multiCap,
      monthlyMain,
      monthlyMulti,
      monthlyMultiUnit: multiUnit,
      monthlyAvg
    },
    work: {
      monthlyHours, byWorkType, byWorkSort,
      byGroup, bySite, byLine,
      byShift, byOvertime,
      byEqType, reworkMonthly
    },
    rank: { timeRank, taskRank, myName: meName }
  };
};
