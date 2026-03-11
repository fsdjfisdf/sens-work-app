/**
 * analyticsDao.js — normalized schema only
 * Uses: engineer, eq_master, annual_goal, capability_score, level_history,
 * monthly_capability, resigned_employee
 */
'use strict';
const { pool } = require('../../config/database');

const ACTIVE_COND = `UPPER(COALESCE(e.role, 'WORKER')) <> 'RESIGNED'`;

function buildEngineerWhere(filters = {}, alias = 'e', opts = {}) {
  const cond = ['1=1'];
  const vals = [];
  if (!opts.includeResigned) cond.push(`UPPER(COALESCE(${alias}.role, 'WORKER')) <> 'RESIGNED'`);
  if (filters.company) { cond.push(`${alias}.company = ?`); vals.push(filters.company); }
  if (filters.group) { cond.push(`${alias}.\`group\` = ?`); vals.push(filters.group); }
  if (filters.site) { cond.push(`${alias}.site = ?`); vals.push(filters.site); }
  if (filters.name) { cond.push(`${alias}.name LIKE ?`); vals.push(`%${filters.name}%`); }
  return { where: `WHERE ${cond.join(' AND ')}`, vals };
}

async function resolveEqId(eqValue) {
  if (eqValue == null || eqValue === '') return null;
  if (/^\d+$/.test(String(eqValue))) return Number(eqValue);
  const [rows] = await pool.query(
    `SELECT id FROM eq_master WHERE is_active = 1 AND (eq_name = ? OR eq_code = ?) LIMIT 1`,
    [eqValue, eqValue]
  );
  return rows[0]?.id ?? null;
}

async function getEqMap() {
  const [rows] = await pool.query(
    `SELECT id, eq_code, eq_name, display_order
     FROM eq_master
     WHERE is_active = 1
     ORDER BY display_order, id`
  );
  return rows;
}

function goalPivotJoin() {
  return `
    LEFT JOIN (
      SELECT engineer_id,
             MAX(CASE WHEN goal_year = 2025 THEN capa_goal END) AS g25,
             MAX(CASE WHEN goal_year = 2026 THEN capa_goal END) AS g26,
             MAX(CASE WHEN goal_year = 2025 THEN level_goal END) AS lv_goal_25,
             MAX(CASE WHEN goal_year = 2026 THEN level_goal END) AS lv_goal_26,
             MAX(CASE WHEN goal_year = 2025 THEN multi_level_goal END) AS multi_lv_goal_25,
             MAX(CASE WHEN goal_year = 2026 THEN multi_level_goal END) AS multi_lv_goal_26
      FROM annual_goal
      GROUP BY engineer_id
    ) ag ON ag.engineer_id = e.id
  `;
}

function levelHistoryPivotJoin(alias = 'e') {
  return `
    LEFT JOIN (
      SELECT engineer_id,
             MIN(CASE WHEN level_code = '1-1' THEN achieved_date END) AS l11,
             MIN(CASE WHEN level_code = '1-2' THEN achieved_date END) AS l12,
             MIN(CASE WHEN level_code = '1-3' THEN achieved_date END) AS l13,
             MIN(CASE WHEN level_code = '2' THEN achieved_date END) AS l2,
             MIN(CASE WHEN level_code = '2-2' THEN achieved_date END) AS l22,
             MIN(CASE WHEN level_code = '2-3' THEN achieved_date END) AS l23,
             MIN(CASE WHEN level_code = '2-4' THEN achieved_date END) AS l24
      FROM level_history
      GROUP BY engineer_id
    ) lh ON lh.engineer_id = ${alias}.id
  `;
}

function emptyWorkStats() {
  return {
    monthlyHours: [],
    byWorkType: [],
    byWorkType2: [],
    byShift: [],
    byOvertime: [],
    shiftByGroupSite: [],
    overtimeByGroupSite: [],
    reworkRatio: [],
    reworkReason: []
  };
}

exports.getFilterOptions = async () => {
  const [companies] = await pool.query(
    `SELECT DISTINCT company AS v FROM engineer e WHERE ${ACTIVE_COND} AND company IS NOT NULL AND company <> '' ORDER BY company`
  );
  const [groups] = await pool.query(
    `SELECT DISTINCT \`group\` AS v FROM engineer e WHERE ${ACTIVE_COND} AND \`group\` IS NOT NULL AND \`group\` <> '' ORDER BY \`group\``
  );
  const [sites] = await pool.query(
    `SELECT DISTINCT site AS v FROM engineer e WHERE ${ACTIVE_COND} AND site IS NOT NULL AND site <> '' ORDER BY site`
  );
  const [names] = await pool.query(
    `SELECT id AS ID, name AS NAME, \`group\` AS grp, site AS SITE, employee_id AS EMPLOYEE_ID
     FROM engineer e
     WHERE ${ACTIVE_COND}
     ORDER BY name`
  );
  const eqs = await getEqMap();
  return {
    companies: companies.map(r => r.v),
    groups: groups.map(r => r.v),
    sites: sites.map(r => r.v),
    engineers: names,
    eqOptions: eqs.map(r => ({ id: r.id, code: r.eq_code, name: r.eq_name }))
  };
};

exports.getHeadCount = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [hires] = await pool.query(
    `SELECT DATE_FORMAT(e.hire_date, '%Y-%m') AS ym,
            COUNT(*) AS cnt,
            GROUP_CONCAT(e.name ORDER BY e.name SEPARATOR ', ') AS names
     FROM engineer e
     ${where} AND e.hire_date IS NOT NULL
     GROUP BY ym
     ORDER BY ym`,
    vals
  );

  const rCond = ['1=1'];
  const rVals = [];
  if (filters.company) { rCond.push(`company = ?`); rVals.push(filters.company); }
  if (filters.group) { rCond.push(`\`group\` = ?`); rVals.push(filters.group); }
  if (filters.site) { rCond.push(`site = ?`); rVals.push(filters.site); }
  if (filters.name) { rCond.push(`name LIKE ?`); rVals.push(`%${filters.name}%`); }

  const [resigns] = await pool.query(
    `SELECT DATE_FORMAT(resign_date, '%Y-%m') AS ym,
            COUNT(*) AS cnt,
            GROUP_CONCAT(name ORDER BY name SEPARATOR ', ') AS names
     FROM resigned_employee
     WHERE ${rCond.join(' AND ')} AND resign_date IS NOT NULL
     GROUP BY ym
     ORDER BY ym`,
    rVals
  );

  const [total] = await pool.query(`SELECT COUNT(*) AS cnt FROM engineer e ${where}`, vals);
  return { hires, resigns, currentTotal: total[0]?.cnt || 0 };
};

exports.getHRDistribution = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [byCompany] = await pool.query(
    `SELECT e.company AS label, COUNT(*) AS cnt
     FROM engineer e
     ${where}
     GROUP BY e.company
     ORDER BY e.company`,
    vals
  );

  const [byExp] = await pool.query(
    `SELECT CASE
       WHEN TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) < 1 THEN '1년차 미만'
       WHEN TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) < 2 THEN '1년차'
       WHEN TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) < 3 THEN '2년차'
       WHEN TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) < 4 THEN '3년차'
       WHEN TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) < 5 THEN '4년차'
       WHEN TIMESTAMPDIFF(YEAR, e.hire_date, CURDATE()) < 6 THEN '5년차'
       ELSE '6년차 이상'
     END AS label,
     COUNT(*) AS cnt
     FROM engineer e
     ${where} AND e.hire_date IS NOT NULL
     GROUP BY label
     ORDER BY FIELD(label,'1년차 미만','1년차','2년차','3년차','4년차','5년차','6년차 이상')`,
    vals
  );

  const [byGroupSite] = await pool.query(
    `SELECT CONCAT(e.\`group\`, ' / ', e.site) AS label, COUNT(*) AS cnt
     FROM engineer e
     ${where}
     GROUP BY e.\`group\`, e.site
     ORDER BY e.\`group\`, e.site`,
    vals
  );

  return { byCompany, byExp, byGroupSite };
};

exports.getLevelDistribution = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [rows] = await pool.query(
    `SELECT COALESCE(NULLIF(e.level_report, ''), '0') AS label, COUNT(*) AS cnt
     FROM engineer e
     ${where}
     GROUP BY COALESCE(NULLIF(e.level_report, ''), '0')
     ORDER BY FIELD(COALESCE(NULLIF(e.level_report, ''), '0'),'0','1','1-1','1-2','1-3','2','2-2','2-3','2-4')`,
    vals
  );
  return rows;
};

exports.getLevelAchievement = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const levelJoin = levelHistoryPivotJoin('e');
  const base = `
    FROM engineer e
    ${levelJoin}
    ${where}
  `;
  const sql = `
    SELECT '1-1' AS level_code, ROUND(AVG(DATEDIFF(lh.l11, e.hire_date)), 0) AS avg_days, COUNT(lh.l11) AS cnt
    ${base} AND e.hire_date IS NOT NULL AND lh.l11 IS NOT NULL
    UNION ALL
    SELECT '1-2', ROUND(AVG(DATEDIFF(lh.l12, lh.l11)), 0), COUNT(lh.l12)
    ${base} AND lh.l11 IS NOT NULL AND lh.l12 IS NOT NULL
    UNION ALL
    SELECT '1-3', ROUND(AVG(DATEDIFF(lh.l13, lh.l12)), 0), COUNT(lh.l13)
    ${base} AND lh.l12 IS NOT NULL AND lh.l13 IS NOT NULL
    UNION ALL
    SELECT '2', ROUND(AVG(DATEDIFF(lh.l2, lh.l13)), 0), COUNT(lh.l2)
    ${base} AND lh.l13 IS NOT NULL AND lh.l2 IS NOT NULL
    UNION ALL
    SELECT '2-2', ROUND(AVG(DATEDIFF(lh.l22, lh.l2)), 0), COUNT(lh.l22)
    ${base} AND lh.l2 IS NOT NULL AND lh.l22 IS NOT NULL
    UNION ALL
    SELECT '2-3', ROUND(AVG(DATEDIFF(lh.l23, lh.l22)), 0), COUNT(lh.l23)
    ${base} AND lh.l22 IS NOT NULL AND lh.l23 IS NOT NULL
    UNION ALL
    SELECT '2-4', ROUND(AVG(DATEDIFF(lh.l24, lh.l23)), 0), COUNT(lh.l24)
    ${base} AND lh.l23 IS NOT NULL AND lh.l24 IS NOT NULL
  `;
  const [rows] = await pool.query(sql, [...vals, ...vals, ...vals, ...vals, ...vals, ...vals, ...vals]);
  return rows;
};

exports.getLevelTrend = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(lh.achieved_date, '%Y-Q') AS quarter_key,
            CONCAT(YEAR(lh.achieved_date), '-Q', QUARTER(lh.achieved_date)) AS quarter,
            lh.level_code,
            COUNT(*) AS cnt
     FROM level_history lh
     JOIN engineer e ON e.id = lh.engineer_id
     ${where}
     GROUP BY YEAR(lh.achieved_date), QUARTER(lh.achieved_date), lh.level_code
     ORDER BY YEAR(lh.achieved_date), QUARTER(lh.achieved_date),
              FIELD(lh.level_code,'1-1','1-2','1-3','2','2-2','2-3','2-4')`,
    vals
  );
  return rows;
};

exports.getCapability = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(mc.ym, '%Y-%m') AS ym,
            ROUND(AVG(mc.total_score), 2) AS avg_total,
            ROUND(AVG(mc.setup_score), 2) AS avg_setup,
            ROUND(AVG(mc.maint_score), 2) AS avg_maint
     FROM monthly_capability mc
     JOIN engineer e ON e.id = mc.engineer_id
     ${where}
     GROUP BY DATE_FORMAT(mc.ym, '%Y-%m')
     ORDER BY ym`,
    vals
  );
  return rows;
};

exports.getEqCapability = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [rows] = await pool.query(
    `SELECT em.eq_name AS label,
            ROUND(AVG(cs.setup_score), 2) AS setup_score,
            ROUND(AVG(cs.maint_score), 2) AS maint_score
     FROM capability_score cs
     JOIN engineer e ON e.id = cs.engineer_id
     JOIN eq_master em ON em.id = cs.eq_id
     ${where}
     GROUP BY em.id, em.eq_name, em.display_order
     ORDER BY em.display_order, em.eq_name`,
    vals
  );
  return rows;
};

exports.getWorklogStats = async () => emptyWorkStats();

exports.getEngineerInfo = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters, 'e', { includeResigned: true });
  const goalJoin = goalPivotJoin();
  const levelJoin = levelHistoryPivotJoin('e');
  const [rows] = await pool.query(
    `SELECT e.id,
            e.legacy_id,
            e.name,
            e.company,
            e.employee_id,
            e.\`group\`,
            e.site,
            e.hire_date,
            e.role,
            e.main_eq_id,
            meq.eq_name AS main_eq_name,
            e.multi_eq_id,
            muq.eq_name AS multi_eq_name,
            e.level_internal,
            e.level_psk,
            e.level_report,
            e.multi_level,
            e.multi_level_psk,
            ag.g25, ag.g26,
            ag.lv_goal_25, ag.lv_goal_26,
            ag.multi_lv_goal_25, ag.multi_lv_goal_26,
            lh.l11, lh.l12, lh.l13, lh.l2, lh.l22, lh.l23, lh.l24,
            re.resign_date, re.reason AS resign_reason
     FROM engineer e
     LEFT JOIN eq_master meq ON meq.id = e.main_eq_id
     LEFT JOIN eq_master muq ON muq.id = e.multi_eq_id
     ${goalJoin}
     ${levelJoin}
     LEFT JOIN resigned_employee re ON re.employee_id = e.employee_id
     ${where}
     ORDER BY e.name`,
    vals
  );
  return rows;
};

exports.getMPICoverage = async (filters) => {
  const { where, vals } = buildEngineerWhere(filters);
  const [rows] = await pool.query(
    `SELECT em.eq_name AS eqName,
            COUNT(DISTINCT CASE WHEN e.main_eq_id = em.id THEN e.id END) AS mainCount,
            COUNT(DISTINCT CASE WHEN e.multi_eq_id = em.id THEN e.id END) AS multiCount,
            COUNT(DISTINCT cs.engineer_id) AS capaCount
     FROM eq_master em
     LEFT JOIN capability_score cs ON cs.eq_id = em.id
     LEFT JOIN engineer e ON e.id = cs.engineer_id
     WHERE em.is_active = 1
     GROUP BY em.id, em.eq_name, em.display_order
     ORDER BY em.display_order, em.eq_name`,
    vals
  );
  return rows;
};

exports.getExportData = async (filters) => {
  const engineers = await exports.getEngineerInfo(filters);
  const capability = await exports.getEqCapability(filters);
  const monthly = await exports.getCapability(filters);
  return { engineers, capability, monthly };
};

exports.getMyDashboard = async (identity) => {
  const engineerId = Number(identity.engineer_id || identity.id || 0);
  const employeeId = Number(identity.employee_id || 0);
  const userName = identity.name || identity.NAME || identity.userName || '';

  let where = 'WHERE 1=1';
  const vals = [];
  if (engineerId) { where += ' AND e.id = ?'; vals.push(engineerId); }
  else if (employeeId) { where += ' AND e.employee_id = ?'; vals.push(employeeId); }
  else if (userName) { where += ' AND e.name = ?'; vals.push(userName); }
  else { throw new Error('로그인 사용자의 engineer 식별 정보가 없습니다.'); }

  const [engRows] = await pool.query(
    `SELECT e.id, e.name, e.company, e.employee_id, e.\`group\`, e.site, e.hire_date, e.role,
            e.main_eq_id, meq.eq_name AS main_eq_name,
            e.multi_eq_id, muq.eq_name AS multi_eq_name,
            e.level_internal, e.level_psk, e.level_report,
            e.multi_level, e.multi_level_psk,
            ag.g25, ag.g26, ag.lv_goal_25, ag.lv_goal_26, ag.multi_lv_goal_25, ag.multi_lv_goal_26
     FROM engineer e
     LEFT JOIN eq_master meq ON meq.id = e.main_eq_id
     LEFT JOIN eq_master muq ON muq.id = e.multi_eq_id
     ${goalPivotJoin()}
     ${where}
     LIMIT 1`,
    vals
  );
  const engineer = engRows[0];
  if (!engineer) throw new Error('engineer 정보를 찾을 수 없습니다.');

  const [levelRows] = await pool.query(
    `SELECT level_code, achieved_date, note
     FROM level_history
     WHERE engineer_id = ?
     ORDER BY achieved_date, id`,
    [engineer.id]
  );

  const [eqCapRows] = await pool.query(
    `SELECT em.id AS eq_id, em.eq_name, em.eq_code,
            ROUND(cs.setup_score, 2) AS setup_score,
            ROUND(cs.maint_score, 2) AS maint_score
     FROM capability_score cs
     JOIN eq_master em ON em.id = cs.eq_id
     WHERE cs.engineer_id = ?
     ORDER BY em.display_order, em.eq_name`,
    [engineer.id]
  );

  const [monthlyRows] = await pool.query(
    `SELECT ym,
            ROUND(total_score, 2) AS total_score,
            ROUND(setup_score, 2) AS setup_score,
            ROUND(maint_score, 2) AS maint_score
     FROM monthly_capability
     WHERE engineer_id = ?
     ORDER BY ym`,
    [engineer.id]
  );

  const mainEqId = engineer.main_eq_id || null;
  const multiEqId = engineer.multi_eq_id || null;
  const mainCap = eqCapRows.find(r => Number(r.eq_id) === Number(mainEqId)) || null;
  const multiCap = eqCapRows.find(r => Number(r.eq_id) === Number(multiEqId)) || null;

  const monthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = monthlyRows.find(r => r.ym === monthKey) || null;

  return {
    identity: engineer,
    profile: {
      name: engineer.name,
      company: engineer.company,
      employeeId: engineer.employee_id,
      group: engineer.group,
      site: engineer.site,
      hireDate: engineer.hire_date,
      role: engineer.role,
      levelReport: engineer.level_report,
      levelInternal: engineer.level_internal,
      levelPsk: engineer.level_psk,
      multiLevel: engineer.multi_level,
      multiLevelPsk: engineer.multi_level_psk,
      mainEqId: engineer.main_eq_id,
      mainEqName: engineer.main_eq_name,
      multiEqId: engineer.multi_eq_id,
      multiEqName: engineer.multi_eq_name,
      goal2025: engineer.g25,
      goal2026: engineer.g26,
      levelGoal2025: engineer.lv_goal_25,
      levelGoal2026: engineer.lv_goal_26,
      multiLevelGoal2025: engineer.multi_lv_goal_25,
      multiLevelGoal2026: engineer.multi_lv_goal_26
    },
    kpis: {
      monthHours: null,
      monthEvents: null,
      timeRank: null,
      taskRank: null,
      thisMonthTotalCapa: thisMonth?.total_score ?? null,
      thisMonthSetupCapa: thisMonth?.setup_score ?? null,
      thisMonthMaintCapa: thisMonth?.maint_score ?? null
    },
    eqCapability: eqCapRows,
    mainMultiCapability: {
      main: mainCap ? {
        eqId: mainCap.eq_id,
        eqName: mainCap.eq_name,
        setup: mainCap.setup_score,
        maint: mainCap.maint_score
      } : null,
      multi: multiCap ? {
        eqId: multiCap.eq_id,
        eqName: multiCap.eq_name,
        setup: multiCap.setup_score,
        maint: multiCap.maint_score
      } : null
    },
    monthlyCapability: monthlyRows,
    monthlyMainCapability: monthlyRows.map(r => ({ ym: r.ym, setup_score: r.setup_score, maint_score: r.maint_score })),
    monthlyMultiCapability: [],
    workStats: {
      monthlyHours: [],
      workType: [],
      workSort: [],
      group: [],
      site: [],
      line: [],
      eqType: [],
      shift: [],
      overtime: [],
      rework: []
    },
    ranking: {
      timeRank: [],
      taskRank: [],
      myTimeRank: null,
      myTaskRank: null,
      totalWorkers: null
    },
    levelHistory: levelRows
  };
};

exports.addEngineer = async (payload) => {
  const sql = `
    INSERT INTO engineer
    (legacy_id, name, company, employee_id, \`group\`, site, hire_date, role,
     main_eq_id, multi_eq_id, level_internal, level_psk, level_report,
     multi_level, multi_level_psk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const vals = [
    payload.legacy_id || null,
    payload.name,
    payload.company || null,
    payload.employee_id || null,
    payload.group || null,
    payload.site || null,
    payload.hire_date || null,
    payload.role || 'WORKER',
    payload.main_eq_id || null,
    payload.multi_eq_id || null,
    payload.level_internal || 0,
    payload.level_psk || 0,
    payload.level_report || null,
    payload.multi_level || 0,
    payload.multi_level_psk || 0
  ];
  const [ret] = await pool.query(sql, vals);
  return { id: ret.insertId };
};

exports.updateEngineer = async (id, payload) => {
  const sql = `
    UPDATE engineer
    SET name = ?, company = ?, employee_id = ?, \`group\` = ?, site = ?,
        hire_date = ?, role = ?, main_eq_id = ?, multi_eq_id = ?,
        level_internal = ?, level_psk = ?, level_report = ?,
        multi_level = ?, multi_level_psk = ?, updated_at = NOW()
    WHERE id = ?
  `;
  const vals = [
    payload.name,
    payload.company || null,
    payload.employee_id || null,
    payload.group || null,
    payload.site || null,
    payload.hire_date || null,
    payload.role || 'WORKER',
    payload.main_eq_id || null,
    payload.multi_eq_id || null,
    payload.level_internal || 0,
    payload.level_psk || 0,
    payload.level_report || null,
    payload.multi_level || 0,
    payload.multi_level_psk || 0,
    id
  ];
  await pool.query(sql, vals);
  return { ok: true };
};

exports.resignEngineer = async ({ engineer_id, resign_date, reason }) => {
  const [rows] = await pool.query(`SELECT * FROM engineer WHERE id = ? LIMIT 1`, [engineer_id]);
  const e = rows[0];
  if (!e) throw new Error('대상 engineer가 없습니다.');

  await pool.query(
    `INSERT INTO resigned_employee
      (userdb_id, name, company, employee_id, \`group\`, site, hire_date, resign_date, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [e.legacy_id || null, e.name, e.company, e.employee_id, e.group, e.site, e.hire_date, resign_date, reason || null]
  );

  await pool.query(
    `UPDATE engineer SET role = 'RESIGNED', updated_at = NOW() WHERE id = ?`,
    [engineer_id]
  );
  return { ok: true };
};

exports.reinstateEngineer = async ({ engineer_id }) => {
  await pool.query(`UPDATE engineer SET role = 'WORKER', updated_at = NOW() WHERE id = ?`, [engineer_id]);
  return { ok: true };
};