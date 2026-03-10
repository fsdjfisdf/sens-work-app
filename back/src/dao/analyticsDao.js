/**
 * analyticsDao.js — Analytics Dashboard DAO (v2)
 */
'use strict';
const pool = require('./db');

function buildWhere(filters, prefix = 'u') {
  const cond = ['1=1'], vals = [];
  if (filters.company) { cond.push(`${prefix}.COMPANY = ?`); vals.push(filters.company); }
  if (filters.group)   { cond.push(`${prefix}.\`GROUP\` = ?`); vals.push(filters.group); }
  if (filters.site)    { cond.push(`${prefix}.SITE = ?`); vals.push(filters.site); }
  if (filters.name)    { cond.push(`${prefix}.NAME LIKE ?`); vals.push(`%${filters.name}%`); }
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
  const { where, vals } = buildWhere(filters);
  const [hires] = await pool.query(
    `SELECT DATE_FORMAT(HIRE, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(NAME SEPARATOR ', ') AS names
     FROM userDB u ${where} AND HIRE IS NOT NULL GROUP BY ym ORDER BY ym`, vals);
  const rCond = ['1=1'], rVals = [];
  if (filters.company) { rCond.push(`company = ?`); rVals.push(filters.company); }
  if (filters.group)   { rCond.push(`\`group\` = ?`); rVals.push(filters.group); }
  if (filters.site)    { rCond.push(`site = ?`); rVals.push(filters.site); }
  const [resigns] = await pool.query(
    `SELECT DATE_FORMAT(resign_date, '%Y-%m') AS ym, COUNT(*) AS cnt, GROUP_CONCAT(name SEPARATOR ', ') AS names
     FROM resigned_employee WHERE ${rCond.join(' AND ')} GROUP BY ym ORDER BY ym`, rVals);
  const [total] = await pool.query(`SELECT COUNT(*) AS cnt FROM userDB u ${where}`, vals);
  return { hires, resigns, currentTotal: total[0]?.cnt || 0 };
};

exports.getHRDistribution = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [byCompany] = await pool.query(`SELECT COMPANY AS label, COUNT(*) AS cnt FROM userDB u ${where} GROUP BY COMPANY`, vals);
  const [byExp] = await pool.query(
    `SELECT CASE
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<1 THEN '1년차 미만'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<2 THEN '1년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<3 THEN '2년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<4 THEN '3년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<5 THEN '4년차'
       WHEN TIMESTAMPDIFF(YEAR,HIRE,CURDATE())<6 THEN '5년차'
       ELSE '6년차 이상' END AS label, COUNT(*) AS cnt
     FROM userDB u ${where} AND HIRE IS NOT NULL GROUP BY label
     ORDER BY FIELD(label,'1년차 미만','1년차','2년차','3년차','4년차','5년차','6년차 이상')`, vals);
  const [byGroupSite] = await pool.query(
    `SELECT CONCAT(\`GROUP\`,' / ',SITE) AS label, COUNT(*) AS cnt FROM userDB u ${where} GROUP BY \`GROUP\`,SITE ORDER BY \`GROUP\`,SITE`, vals);
  return { byCompany, byExp, byGroupSite };
};

exports.getLevelDistribution = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [rows] = await pool.query(
    `SELECT \`LEVEL(report)\` AS label, COUNT(*) AS cnt FROM userDB u ${where}
     GROUP BY \`LEVEL(report)\` ORDER BY FIELD(\`LEVEL(report)\`,'0','1','2','2-2','2-3','2-4')`, vals);
  return rows;
};

exports.getLevelAchievement = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const v6 = vals.concat(vals,vals,vals,vals,vals);
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
     FROM userDB u ${where} AND \`Level2-2(A) Achieve\` IS NOT NULL AND \`Level2-2(B) Achieve\` IS NOT NULL`, v6);
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
     FROM userDB u ${where}`, vals);
  return engineers;
};

exports.getCapability = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const months = [];
  for (const m of ['SEP','OCT','NOV','DEC']) months.push({ col:`24Y${m}`, setup:`24Y${m}_SETUP`, maint:`24Y${m}_MAINT`, ym:`2024-${String(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(m)+1).padStart(2,'0')}` });
  for (const m of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']) months.push({ col:`25Y${m}`, setup:`25Y${m}_SETUP`, maint:`25Y${m}_MAINT`, ym:`2025-${String(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(m)+1).padStart(2,'0')}` });
  for (const m of ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP']) {
    const sc = m==='AUG'?'26AUG_SETUP':`26Y${m}_SETUP`;
    months.push({ col:`26Y${m}`, setup:sc, maint:`26Y${m}_MAINT`, ym:`2026-${String(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP'].indexOf(m)+1).padStart(2,'0')}` });
  }
  // MULTI CAPA도 포함
  const selects = months.map(m =>
    `SELECT '${m.ym}' AS ym, AVG(u.\`${m.col}\`) AS avg_total, AVG(u.\`${m.setup}\`) AS avg_setup, AVG(u.\`${m.maint}\`) AS avg_maint,
     AVG(u.\`MULTI CAPA\`) AS avg_multi
     FROM userDB u ${where} AND u.\`${m.col}\` IS NOT NULL AND u.\`${m.col}\` > 0`
  ).join('\nUNION ALL\n');
  const [rows] = await pool.query(selects, Array(months.length).fill(vals).flat());
  const [goals] = await pool.query(`SELECT AVG(\`24Y CAPA GOAL\`) AS g24, AVG(\`25Y CAPA GOAL\`) AS g25, AVG(\`26Y CAPA GOAL\`) AS g26 FROM userDB u ${where}`, vals);
  return { monthly: rows.filter(r=>r.avg_total), goals: goals[0]||{} };
};

exports.getEqCapability = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const eqs = ['SUPRA N','SUPRA XP','INTEGER','PRECIA','ECOLITE','GENEVA','HDW'];
  // 해당 설비를 다루는(>0) 엔지니어만 평균 계산
  const selects = eqs.map(eq =>
    `SELECT '${eq}' AS eq_name,
       AVG(CASE WHEN u.\`${eq} SET UP\`>0 THEN u.\`${eq} SET UP\` END) AS avg_setup,
       AVG(CASE WHEN u.\`${eq} MAINT\`>0 THEN u.\`${eq} MAINT\` END) AS avg_maint,
       AVG(CASE WHEN u.\`${eq} SET UP\`>0 OR u.\`${eq} MAINT\`>0 THEN (IFNULL(u.\`${eq} SET UP\`,0)+IFNULL(u.\`${eq} MAINT\`,0))/2 END) AS avg_total,
       COUNT(CASE WHEN u.\`${eq} SET UP\`>0 OR u.\`${eq} MAINT\`>0 THEN 1 END) AS eng_count
     FROM userDB u ${where}`
  ).join('\nUNION ALL\n');
  const [rows] = await pool.query(selects, Array(eqs.length).fill(vals).flat());
  return rows;
};

exports.getMPI = async (filters) => {
  const { where, vals } = buildWhere(filters);
  const [engineers] = await pool.query(
    `SELECT u.NAME, u.\`GROUP\`, u.SITE, u.\`MAIN EQ\`,
       u.\`SUPRA N MPI\` AS supra_n, u.\`SUPRA XP MPI\` AS supra_xp,
       u.\`INTEGER MPI\` AS int_mpi, u.\`PRECIA MPI\` AS precia,
       u.\`ECOLITE MPI\` AS ecolite, u.\`GENEVA MPI\` AS geneva,
       u.\`HDW MPI\` AS hdw, u.MPI AS total
     FROM userDB u ${where} ORDER BY u.MPI DESC, u.NAME`, vals);
  const [dist] = await pool.query(`SELECT MPI AS label, COUNT(*) AS cnt FROM userDB u ${where} GROUP BY MPI ORDER BY MPI`, vals);
  // 설비별 MPI 달성 인원
  const [byEq] = await pool.query(
    `SELECT 'SUPRA N' AS eq, SUM(\`SUPRA N MPI\`) AS cnt FROM userDB u ${where}
     UNION ALL SELECT 'SUPRA XP', SUM(\`SUPRA XP MPI\`) FROM userDB u ${where}
     UNION ALL SELECT 'INTEGER', SUM(\`INTEGER MPI\`) FROM userDB u ${where}
     UNION ALL SELECT 'PRECIA', SUM(\`PRECIA MPI\`) FROM userDB u ${where}
     UNION ALL SELECT 'ECOLITE', SUM(\`ECOLITE MPI\`) FROM userDB u ${where}
     UNION ALL SELECT 'GENEVA', SUM(\`GENEVA MPI\`) FROM userDB u ${where}
     UNION ALL SELECT 'HDW', SUM(\`HDW MPI\`) FROM userDB u ${where}`,
    Array(7).fill(vals).flat());
  // 그룹별 평균 MPI
  const [byGroup] = await pool.query(
    `SELECT \`GROUP\` AS label, ROUND(AVG(MPI),2) AS avg_mpi, SUM(MPI) AS total_mpi, COUNT(*) AS cnt
     FROM userDB u ${where} GROUP BY \`GROUP\``, vals);
  return { engineers, distribution: dist, byEquipment: byEq, byGroup };
};

exports.getWorklogStats = async (filters) => {
  const wCond = [`e.approval_status='APPROVED'`], wVals = [];
  if (filters.group) { wCond.push(`e.\`group\`=?`); wVals.push(filters.group); }
  if (filters.site)  { wCond.push(`e.site=?`); wVals.push(filters.site); }
  if (filters.name)  { wCond.push(`w.engineer_name LIKE ?`); wVals.push(`%${filters.name}%`); }
  const wWhere = `WHERE ${wCond.join(' AND ')}`;
  const [monthlyHours] = await pool.query(`SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym, SUM(w.task_duration) AS total_minutes, COUNT(DISTINCT e.id) AS event_count FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} GROUP BY ym ORDER BY ym`, wVals);
  const [byWorkType] = await pool.query(`SELECT e.work_type AS label, COUNT(DISTINCT e.id) AS cnt FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} GROUP BY e.work_type`, wVals);
  const [byWorkType2] = await pool.query(`SELECT IFNULL(e.work_type2,'N/A') AS label, COUNT(DISTINCT e.id) AS cnt FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} AND e.work_type='MAINT' GROUP BY label`, wVals);
  const [byShift] = await pool.query(`SELECT CASE WHEN TIME(w.start_time)<'12:00:00' THEN '오전 근무' ELSE '오후 근무' END AS label, COUNT(*) AS cnt FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} AND w.start_time IS NOT NULL GROUP BY label`, wVals);
  const [byOvertime] = await pool.query(`SELECT CASE WHEN TIME(w.end_time)<='18:00:00' THEN '일반 근무' ELSE '초과 근무' END AS label, COUNT(*) AS cnt FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} AND w.end_time IS NOT NULL GROUP BY label`, wVals);
  const [reworkRatio] = await pool.query(`SELECT CASE WHEN e.is_rework=1 THEN 'Rework' ELSE '일반' END AS label, COUNT(DISTINCT e.id) AS cnt FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} GROUP BY label`, wVals);
  const [reworkReason] = await pool.query(`SELECT IFNULL(e.rework_reason,'미입력') AS label, COUNT(DISTINCT e.id) AS cnt FROM wl_event e JOIN wl_worker w ON w.event_id=e.id ${wWhere} AND e.is_rework=1 GROUP BY label`, wVals);
  return { monthlyHours, byWorkType, byWorkType2, byShift, byOvertime, reworkRatio, reworkReason };
};

exports.getEngineerInfo = async (name) => {
  const [rows] = await pool.query(
    `SELECT ID, NAME, COMPANY, EMPLOYEE_ID, \`GROUP\`, SITE, HIRE, role,
       \`LEVEL(report)\`, \`LEVEL\`, \`LEVEL(PSK)\`, \`MULTI LEVEL\`, \`MULTI LEVEL(PSK)\`,
       \`MAIN EQ\`, \`MULTI EQ\`, \`SET UP CAPA\`, \`MAINT CAPA\`, \`MULTI CAPA\`, CAPA, MPI
     FROM userDB WHERE NAME=? LIMIT 1`, [name]);
  return rows[0]||null;
};

// 엔지니어 추가
exports.addEngineer = async (data) => {
  const [r] = await pool.query(
    `INSERT INTO userDB (NAME, COMPANY, EMPLOYEE_ID, \`GROUP\`, SITE, HIRE, role, \`MAIN EQ\`, \`MULTI EQ\`, \`LEVEL\`, \`LEVEL(PSK)\`, \`LEVEL(report)\`, \`MULTI LEVEL\`, \`MULTI LEVEL(PSK)\`)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [data.name, data.company, data.employee_id||null, data.group, data.site, data.hire_date||null, data.role||'worker', data.main_eq||null, data.multi_eq||null, 0, 0, '0', 0, 0]);
  return r.insertId;
};

exports.getExportData = async (filters) => {
  const { where, vals } = buildWhere(filters);
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
     FROM userDB u ${where} ORDER BY u.\`GROUP\`, u.SITE, u.NAME`, vals);
  return rows;
};
