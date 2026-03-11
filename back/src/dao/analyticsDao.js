/**
 * analyticsDao.js — Analytics Dashboard DAO (engineer schema)
 */
'use strict';
const { pool } = require('../../config/database');

const LEVEL_ORDER = ['0', '1-1', '1-2', '1-3', '2', '2-2', '2-3', '2-4'];
const LEVEL_SCORE = { '0': 0, '1-1': 0.5, '1-2': 1, '1-3': 1.5, '2': 2, '2-2': 3, '2-3': 4, '2-4': 5 };
const DEFAULT_EQ_ORDER = ['SUPRA N', 'SUPRA XP', 'INTEGER', 'PRECIA', 'ECOLITE', 'GENEVA', 'HDW'];

let _tableCache = null;
let _eqCache = null;
const _colCache = new Map();

function nullIfEmpty(v) {
  return v === '' || v === undefined ? null : v;
}

function buildWhere(filters, prefix = 'e') {
  const cond = ['1=1'];
  const vals = [];
  if (filters.company) { cond.push(`${prefix}.company = ?`); vals.push(filters.company); }
  if (filters.group)   { cond.push(`${prefix}.\`group\` = ?`); vals.push(filters.group); }
  if (filters.site)    { cond.push(`${prefix}.site = ?`); vals.push(filters.site); }
  if (filters.name)    { cond.push(`${prefix}.name LIKE ?`); vals.push(`%${filters.name}%`); }
  return { where: `WHERE ${cond.join(' AND ')}`, vals };
}

function daysBetween(start, end) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const diff = Math.round((e - s) / 86400000);
  return diff >= 0 ? diff : null;
}

function levelFieldExpr(expr) {
  return `FIELD(${expr}, ${LEVEL_ORDER.map(v => `'${v}'`).join(', ')})`;
}

function normalizeLevelCode(code) {
  if (code == null) return null;
  let s = String(code).trim().toUpperCase();
  if (!s) return null;
  s = s.replace(/^LV\.?\s*/, '');
  s = s.replace(/\s+/g, '');

  const map = {
    '0': '0',
    '1-1': '1-1',
    '1-2': '1-2',
    '1-3': '1-3',
    '2': '2',
    '2-2': '2-2',
    '2-3': '2-3',
    '2-4': '2-4',
    '2-2(B)': '2-2',
    '2-2(A)': '2-3',
    '2-3(B)': '2-4',
  };
  return map[s] || null;
}

async function getTables() {
  if (_tableCache) return _tableCache;
  const [rows] = await pool.query(
    `SELECT TABLE_NAME AS t
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()`
  );
  _tableCache = new Set(rows.map(r => r.t));
  return _tableCache;
}

async function hasTable(name) {
  const tables = await getTables();
  return tables.has(name);
}

async function getTableColumns(name) {
  if (_colCache.has(name)) return _colCache.get(name);
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name]
  );
  const cols = new Set(rows.map(r => r.c));
  _colCache.set(name, cols);
  return cols;
}

async function hasColumn(tableName, columnName) {
  const cols = await getTableColumns(tableName);
  return cols.has(columnName);
}

async function getEqRows() {
  if (_eqCache) return _eqCache;
  const [rows] = await pool.query(
    `SELECT id, eq_code, eq_name, display_order, is_active
     FROM eq_master
     ORDER BY COALESCE(display_order, 9999), id`
  );
  _eqCache = rows;
  return rows;
}

async function getActiveEqRows() {
  const rows = await getEqRows();
  const active = rows.filter(r => Number(r.is_active) === 1);
  if (active.length) return active;
  return rows;
}

async function resolveEqId(value) {
  if (!value) return null;
  const rows = await getEqRows();
  const found = rows.find(r => r.eq_name === value || r.eq_code === value);
  return found ? found.id : null;
}

async function upsertAnnualGoal(engineerId, year, patch) {
  const keys = Object.keys(patch || {}).filter(k => patch[k] !== undefined);
  if (!keys.length) return;

  const [existing] = await pool.query(
    `SELECT id FROM annual_goal WHERE engineer_id = ? AND goal_year = ? LIMIT 1`,
    [engineerId, year]
  );

  if (existing.length) {
    const set = [];
    const vals = [];
    keys.forEach(k => {
      set.push(`${k} = ?`);
      vals.push(patch[k]);
    });
    vals.push(existing[0].id);
    await pool.query(`UPDATE annual_goal SET ${set.join(', ')} WHERE id = ?`, vals);
    return;
  }

  const cols = ['engineer_id', 'goal_year', ...keys];
  const vals = [engineerId, year, ...keys.map(k => patch[k])];
  await pool.query(
    `INSERT INTO annual_goal (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    vals
  );
}

async function getFilteredEngineers(filters, extraSelect = '') {
  const { where, vals } = buildWhere(filters, 'e');
  const [rows] = await pool.query(
    `SELECT e.id, e.name, e.company, e.employee_id, e.\`group\`, e.site, e.hire_date,
            e.role, e.main_eq_id, e.multi_eq_id,
            e.level_internal, e.level_psk, e.level_report, e.multi_level, e.multi_level_psk
            ${extraSelect ? `, ${extraSelect}` : ''}
     FROM engineer e ${where}
     ORDER BY e.name`,
    vals
  );
  return rows;
}

async function getLevelHistoryMap(engineerIds) {
  const map = new Map();
  if (!engineerIds.length) return map;

  const [rows] = await pool.query(
    `SELECT engineer_id, level_code, MIN(achieved_date) AS achieved_date
     FROM level_history
     WHERE engineer_id IN (?) AND achieved_date IS NOT NULL
     GROUP BY engineer_id, level_code`,
    [engineerIds]
  );

  for (const r of rows) {
    const norm = normalizeLevelCode(r.level_code);
    if (!norm) continue;
    if (!map.has(r.engineer_id)) map.set(r.engineer_id, {});
    const obj = map.get(r.engineer_id);
    const prev = obj[norm];
    if (!prev || new Date(r.achieved_date) < new Date(prev)) {
      obj[norm] = r.achieved_date;
    }
  }
  return map;
}

async function getGoalMaps(engineerIds) {
  const capaMap = new Map();
  const levelMap = new Map();
  if (!engineerIds.length) return { capaMap, levelMap };

  const [rows] = await pool.query(
    `SELECT engineer_id, goal_year, capa_goal, level_goal, multi_level_goal
     FROM annual_goal
     WHERE engineer_id IN (?)`,
    [engineerIds]
  );

  for (const r of rows) {
    if (!capaMap.has(r.engineer_id)) capaMap.set(r.engineer_id, {});
    if (!levelMap.has(r.engineer_id)) levelMap.set(r.engineer_id, {});
    capaMap.get(r.engineer_id)[r.goal_year] = r.capa_goal;
    levelMap.get(r.engineer_id)[r.goal_year] = {
      level_goal: r.level_goal,
      multi_level_goal: r.multi_level_goal
    };
  }
  return { capaMap, levelMap };
}

async function getCapabilitySummaryMap(engineerIds) {
  const map = new Map();
  if (!engineerIds.length) return map;

  const [rows] = await pool.query(
    `SELECT engineer_id,
            AVG(CASE WHEN setup_score > 0 THEN setup_score END) AS setup_capa,
            AVG(CASE WHEN maint_score > 0 THEN maint_score END) AS maint_capa,
            AVG(
              CASE
                WHEN setup_score IS NULL AND maint_score IS NULL THEN NULL
                WHEN setup_score IS NOT NULL AND maint_score IS NOT NULL THEN (setup_score + maint_score) / 2
                ELSE COALESCE(setup_score, maint_score)
              END
            ) AS capa
     FROM capability_score
     WHERE engineer_id IN (?)
     GROUP BY engineer_id`,
    [engineerIds]
  );

  rows.forEach(r => map.set(r.engineer_id, r));
  return map;
}

async function getCapabilityPivot(engineerIds) {
  const pivot = new Map();
  if (!engineerIds.length) return pivot;

  const [rows] = await pool.query(
    `SELECT cs.engineer_id, em.eq_name, cs.setup_score, cs.maint_score
     FROM capability_score cs
     JOIN eq_master em ON em.id = cs.eq_id
     WHERE cs.engineer_id IN (?)`,
    [engineerIds]
  );

  for (const r of rows) {
    if (!pivot.has(r.engineer_id)) pivot.set(r.engineer_id, {});
    const obj = pivot.get(r.engineer_id);
    obj[`${r.eq_name} SET UP`] = r.setup_score;
    obj[`${r.eq_name} MAINT`] = r.maint_score;
  }
  return pivot;
}

async function getMonthlyCapabilityPivot(engineerIds) {
  const pivot = new Map();
  const keys = [];
  if (!engineerIds.length) return { pivot, keys };

  const [rows] = await pool.query(
    `SELECT engineer_id, ym, total_score, setup_score, maint_score
     FROM monthly_capability
     WHERE engineer_id IN (?)
     ORDER BY ym`,
    [engineerIds]
  );

  const keySet = new Set();
  for (const r of rows) {
    if (!pivot.has(r.engineer_id)) pivot.set(r.engineer_id, {});
    const obj = pivot.get(r.engineer_id);
    const base = r.ym;
    obj[`${base} TOTAL`] = r.total_score;
    obj[`${base} SETUP`] = r.setup_score;
    obj[`${base} MAINT`] = r.maint_score;
    keySet.add(`${base} TOTAL`);
    keySet.add(`${base} SETUP`);
    keySet.add(`${base} MAINT`);
  }

  keySet.forEach(k => keys.push(k));
  keys.sort((a, b) => a.localeCompare(b));
  return { pivot, keys };
}

exports.getFilterOptions = async () => {
  const [companies] = await pool.query(`SELECT DISTINCT company AS v FROM engineer WHERE company IS NOT NULL AND company <> '' ORDER BY company`);
  const [groups] = await pool.query(`SELECT DISTINCT \`group\` AS v FROM engineer WHERE \`group\` IS NOT NULL AND \`group\` <> '' ORDER BY \`group\``);
  const [sites] = await pool.query(`SELECT DISTINCT site AS v FROM engineer WHERE site IS NOT NULL AND site <> '' ORDER BY site`);
  const [names] = await pool.query(`SELECT id AS ID, name AS NAME, \`group\` AS grp, site AS SITE FROM engineer ORDER BY name`);
  const eqRows = await getActiveEqRows();

  return {
    companies: companies.map(r => r.v),
    groups: groups.map(r => r.v),
    sites: sites.map(r => r.v),
    engineers: names,
    equipments: eqRows.map(r => ({ id: r.id, code: r.eq_code, name: r.eq_name }))
  };
};

exports.getHeadCount = async (filters) => {
  const { where, vals } = buildWhere(filters, 'e');
  const [hires] = await pool.query(
    `SELECT DATE_FORMAT(e.hire_date, '%Y-%m') AS ym,
            COUNT(*) AS cnt,
            GROUP_CONCAT(e.name ORDER BY e.name SEPARATOR ', ') AS names
     FROM engineer e ${where} AND e.hire_date IS NOT NULL
     GROUP BY ym
     ORDER BY ym`,
    vals
  );

  let resigns = [];
  if (await hasTable('resigned_employee')) {
    const cond = ['1=1'];
    const rVals = [];
    if (filters.company) { cond.push('company = ?'); rVals.push(filters.company); }
    if (filters.group) { cond.push('`group` = ?'); rVals.push(filters.group); }
    if (filters.site) { cond.push('site = ?'); rVals.push(filters.site); }
    if (filters.name) { cond.push('name LIKE ?'); rVals.push(`%${filters.name}%`); }

    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(resign_date, '%Y-%m') AS ym,
              COUNT(*) AS cnt,
              GROUP_CONCAT(name ORDER BY name SEPARATOR ', ') AS names
       FROM resigned_employee
       WHERE ${cond.join(' AND ')} AND resign_date IS NOT NULL
       GROUP BY ym
       ORDER BY ym`,
      rVals
    );
    resigns = rows;
  }

  const [total] = await pool.query(`SELECT COUNT(*) AS cnt FROM engineer e ${where}`, vals);
  return { hires, resigns, currentTotal: total[0]?.cnt || 0 };
};

exports.getHRDistribution = async (filters) => {
  const { where, vals } = buildWhere(filters, 'e');

  const [byCompany] = await pool.query(
    `SELECT e.company AS label, COUNT(*) AS cnt
     FROM engineer e ${where}
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
     FROM engineer e ${where} AND e.hire_date IS NOT NULL
     GROUP BY label
     ORDER BY FIELD(label, '1년차 미만', '1년차', '2년차', '3년차', '4년차', '5년차', '6년차 이상')`,
    vals
  );

  const [byGroupSite] = await pool.query(
    `SELECT CONCAT(e.\`group\`, ' / ', e.site) AS label, COUNT(*) AS cnt
     FROM engineer e ${where}
     GROUP BY e.\`group\`, e.site
     ORDER BY e.\`group\`, e.site`,
    vals
  );

  return { byCompany, byExp, byGroupSite };
};

exports.getLevelDistribution = async (filters) => {
  const { where, vals } = buildWhere(filters, 'e');
  const [rows] = await pool.query(
    `SELECT COALESCE(NULLIF(e.level_report, ''), '0') AS label, COUNT(*) AS cnt
     FROM engineer e ${where}
     GROUP BY label
     ORDER BY ${levelFieldExpr('label')}`,
    vals
  );
  return rows;
};

exports.getLevelAchievement = async (filters) => {
  const engineers = await getFilteredEngineers(filters);
  const engineerIds = engineers.map(e => e.id);
  const historyMap = await getLevelHistoryMap(engineerIds);

  const transitions = [
    { level_code: '1-1', prev: null },
    { level_code: '1-2', prev: '1-1' },
    { level_code: '1-3', prev: '1-2' },
    { level_code: '2', prev: '1-3' },
    { level_code: '2-2', prev: '2' },
    { level_code: '2-3', prev: '2-2' },
    { level_code: '2-4', prev: '2-3' },
  ];

  const bucket = Object.fromEntries(transitions.map(t => [t.level_code, []]));

  engineers.forEach(eng => {
    const history = historyMap.get(eng.id) || {};
    transitions.forEach(t => {
      const end = history[t.level_code];
      const start = t.prev ? history[t.prev] : eng.hire_date;
      const diff = daysBetween(start, end);
      if (diff != null) bucket[t.level_code].push(diff);
    });
  });

  return transitions.map(t => {
    const arr = bucket[t.level_code];
    return {
      level_code: t.level_code,
      avg_days: arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null,
      cnt: arr.length
    };
  });
};

exports.getLevelTrend = async (filters) => {
  const engineers = await getFilteredEngineers(filters);
  const historyMap = await getLevelHistoryMap(engineers.map(e => e.id));

  return engineers.map(eng => {
    const h = historyMap.get(eng.id) || {};
    return {
      ID: eng.id,
      NAME: eng.name,
      HIRE: eng.hire_date,
      l1: h['1-1'] || null,
      l2: h['1-2'] || null,
      l3: h['1-3'] || null,
      l4: h['2'] || null,
      l22: h['2-2'] || null,
      l23: h['2-3'] || null,
      l24: h['2-4'] || null,
    };
  });
};

exports.getCapability = async (filters) => {
  const { where, vals } = buildWhere(filters, 'e');
  const [monthly] = await pool.query(
    `SELECT mc.ym,
            AVG(mc.total_score) AS avg_total,
            AVG(mc.setup_score) AS avg_setup,
            AVG(mc.maint_score) AS avg_maint
     FROM monthly_capability mc
     JOIN engineer e ON e.id = mc.engineer_id
     ${where}
     GROUP BY mc.ym
     ORDER BY mc.ym`,
    vals
  );

  const [goalRows] = await pool.query(
    `SELECT ag.goal_year, AVG(ag.capa_goal) AS avg_goal
     FROM annual_goal ag
     JOIN engineer e ON e.id = ag.engineer_id
     ${where}
     GROUP BY ag.goal_year`,
    vals
  );

  const goalsByYear = {};
  goalRows.forEach(r => { goalsByYear[String(r.goal_year)] = r.avg_goal; });

  return {
    monthly: monthly.map(r => ({ ...r, avg_multi: null })),
    goals: {
      g25: goalsByYear['2025'] ?? null,
      g26: goalsByYear['2026'] ?? null,
    },
    goalsByYear,
  };
};

exports.getEqCapability = async (filters) => {
  const { where, vals } = buildWhere(filters, 'e');
  const [rows] = await pool.query(
    `SELECT em.eq_name,
            AVG(CASE WHEN cs.setup_score > 0 THEN cs.setup_score END) AS avg_setup,
            AVG(CASE WHEN cs.maint_score > 0 THEN cs.maint_score END) AS avg_maint,
            AVG(
              CASE
                WHEN cs.setup_score IS NULL AND cs.maint_score IS NULL THEN NULL
                WHEN cs.setup_score IS NOT NULL AND cs.maint_score IS NOT NULL THEN (cs.setup_score + cs.maint_score) / 2
                ELSE COALESCE(cs.setup_score, cs.maint_score)
              END
            ) AS avg_total,
            COUNT(DISTINCT cs.engineer_id) AS eng_count
     FROM capability_score cs
     JOIN engineer e ON e.id = cs.engineer_id
     JOIN eq_master em ON em.id = cs.eq_id
     ${where}
     GROUP BY em.id, em.eq_name, em.display_order
     ORDER BY COALESCE(em.display_order, 9999), em.id`,
    vals
  );

  return rows;
};

exports.getWorklogStats = async (filters) => {
  const joins = ['JOIN wl_worker w ON w.event_id = e.id'];
  const wCond = [`e.approval_status = 'APPROVED'`];
  const wVals = [];

  if (filters.company) {
    joins.push('LEFT JOIN engineer en ON en.name = w.engineer_name');
    wCond.push('en.company = ?');
    wVals.push(filters.company);
  }
  if (filters.group) {
    wCond.push('e.`group` = ?');
    wVals.push(filters.group);
  }
  if (filters.site) {
    wCond.push('e.site = ?');
    wVals.push(filters.site);
  }
  if (filters.name) {
    wCond.push('w.engineer_name LIKE ?');
    wVals.push(`%${filters.name}%`);
  }

  const joinSql = joins.join(' ');
  const wWhere = `WHERE ${wCond.join(' AND ')}`;

  const [monthlyHours] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym,
            SUM(w.task_duration) AS total_minutes,
            COUNT(DISTINCT e.id) AS event_count
     FROM wl_event e ${joinSql}
     ${wWhere}
     GROUP BY ym
     ORDER BY ym`,
    wVals
  );

  const [byWorkType] = await pool.query(
    `SELECT e.work_type AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e ${joinSql}
     ${wWhere}
     GROUP BY e.work_type`,
    wVals
  );

  const [byWorkType2] = await pool.query(
    `SELECT IFNULL(e.work_type2,'N/A') AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e ${joinSql}
     ${wWhere} AND e.work_type='MAINT'
     GROUP BY label`,
    wVals
  );

  const [byShift] = await pool.query(
    `SELECT CASE WHEN TIME(w.start_time)<'12:00:00' THEN '오전 근무' ELSE '오후 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e ${joinSql}
     ${wWhere} AND w.start_time IS NOT NULL
     GROUP BY label`,
    wVals
  );

  const [byOvertime] = await pool.query(
    `SELECT CASE WHEN TIME(w.end_time)<='18:00:00' THEN '일반 근무' ELSE '초과 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e ${joinSql}
     ${wWhere} AND w.end_time IS NOT NULL
     GROUP BY label`,
    wVals
  );

  const [shiftByGroupSite] = await pool.query(
    `SELECT CONCAT(e.\`group\`, '-', e.site) AS label,
            SUM(CASE WHEN TIME(w.start_time)>='12:00:00' THEN 1 ELSE 0 END) AS afternoon_cnt,
            COUNT(*) AS total_cnt
     FROM wl_event e ${joinSql}
     ${wWhere} AND w.start_time IS NOT NULL
     GROUP BY e.\`group\`, e.site
     ORDER BY e.\`group\`, e.site`,
    wVals
  );

  const [overtimeByGroupSite] = await pool.query(
    `SELECT CONCAT(e.\`group\`, '-', e.site) AS label,
            SUM(CASE WHEN TIME(w.end_time)>'18:00:00' THEN 1 ELSE 0 END) AS overtime_cnt,
            COUNT(*) AS total_cnt
     FROM wl_event e ${joinSql}
     ${wWhere} AND w.end_time IS NOT NULL
     GROUP BY e.\`group\`, e.site
     ORDER BY e.\`group\`, e.site`,
    wVals
  );

  const [reworkRatio] = await pool.query(
    `SELECT CASE WHEN e.is_rework=1 THEN 'Rework' ELSE '일반' END AS label,
            COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e ${joinSql}
     ${wWhere}
     GROUP BY label`,
    wVals
  );

  const [reworkReason] = await pool.query(
    `SELECT IFNULL(e.rework_reason, '미입력') AS label,
            COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e ${joinSql}
     ${wWhere} AND e.is_rework=1
     GROUP BY label`,
    wVals
  );

  return { monthlyHours, byWorkType, byWorkType2, byShift, byOvertime, shiftByGroupSite, overtimeByGroupSite, reworkRatio, reworkReason };
};

exports.getEngineerInfo = async (name) => {
  const [rows] = await pool.query(
    `SELECT e.id AS ID,
            e.name AS NAME,
            e.company AS COMPANY,
            e.employee_id AS EMPLOYEE_ID,
            e.\`group\` AS \`GROUP\`,
            e.site AS SITE,
            e.hire_date AS HIRE,
            e.role AS role,
            e.level_report AS \`LEVEL(report)\`,
            e.level_internal AS \`LEVEL\`,
            e.level_psk AS \`LEVEL(PSK)\`,
            e.multi_level AS \`MULTI LEVEL\`,
            e.multi_level_psk AS \`MULTI LEVEL(PSK)\`,
            meq.eq_name AS \`MAIN EQ\`,
            mueq.eq_name AS \`MULTI EQ\`
     FROM engineer e
     LEFT JOIN eq_master meq ON meq.id = e.main_eq_id
     LEFT JOIN eq_master mueq ON mueq.id = e.multi_eq_id
     WHERE e.name = ?
     LIMIT 1`,
    [name]
  );

  const row = rows[0] || null;
  if (!row) return null;

  const [capaRows] = await pool.query(
    `SELECT AVG(CASE WHEN setup_score > 0 THEN setup_score END) AS setup_capa,
            AVG(CASE WHEN maint_score > 0 THEN maint_score END) AS maint_capa,
            AVG(
              CASE
                WHEN setup_score IS NULL AND maint_score IS NULL THEN NULL
                WHEN setup_score IS NOT NULL AND maint_score IS NOT NULL THEN (setup_score + maint_score) / 2
                ELSE COALESCE(setup_score, maint_score)
              END
            ) AS capa
     FROM capability_score
     WHERE engineer_id = ?`,
    [row.ID]
  );
  const capa = capaRows[0] || {};
  row['SET UP CAPA'] = capa.setup_capa ?? null;
  row['MAINT CAPA'] = capa.maint_capa ?? null;
  row.CAPA = capa.capa ?? null;

  const [goalRows] = await pool.query(
    `SELECT goal_year, capa_goal, level_goal, multi_level_goal
     FROM annual_goal
     WHERE engineer_id = ?`,
    [row.ID]
  );
  goalRows.forEach(g => {
    if (Number(g.goal_year) === 2025) {
      row.g25 = g.capa_goal;
      row.lv_goal_25 = g.level_goal;
      row.multi_goal_25 = g.multi_level_goal;
    }
    if (Number(g.goal_year) === 2026) {
      row.g26 = g.capa_goal;
      row.lv_goal_26 = g.level_goal;
      row.multi_goal_26 = g.multi_level_goal;
    }
  });

  const [historyRows] = await pool.query(
    `SELECT level_code, MIN(achieved_date) AS achieved_date
     FROM level_history
     WHERE engineer_id = ? AND achieved_date IS NOT NULL
     GROUP BY level_code`,
    [row.ID]
  );
  const oldKeyMap = {
    '1-1': 'Level1 Achieve',
    '1-2': 'Level2 Achieve',
    '1-3': 'Level3 Achieve',
    '2': 'Level4 Achieve',
    '2-2': 'Level2-2(B) Achieve',
    '2-3': 'Level2-2(A) Achieve',
    '2-4': 'Level2-3(B) Achieve',
  };
  historyRows.forEach(h => {
    const norm = normalizeLevelCode(h.level_code);
    if (norm && oldKeyMap[norm]) row[oldKeyMap[norm]] = h.achieved_date;
  });

  return row;
};

exports.addEngineer = async (data) => {
  const mainEqId = await resolveEqId(data.main_eq);
  const multiEqId = await resolveEqId(data.multi_eq);

  const [r] = await pool.query(
    `INSERT INTO engineer (
      legacy_id, name, company, employee_id, \`group\`, site, hire_date, role,
      main_eq_id, multi_eq_id,
      level_internal, level_psk, level_report,
      multi_level, multi_level_psk
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      null,
      data.name,
      data.company,
      nullIfEmpty(data.employee_id),
      data.group,
      data.site,
      nullIfEmpty(data.hire_date),
      data.role || 'worker',
      mainEqId,
      multiEqId,
      0,
      0,
      '0',
      0,
      0,
    ]
  );

  const engineerId = r.insertId;
  await upsertAnnualGoal(engineerId, 2025, {
    capa_goal: data.g25,
    level_goal: data.lv_goal_25,
    multi_level_goal: data.multi_goal_25,
  });
  await upsertAnnualGoal(engineerId, 2026, {
    capa_goal: data.g26,
    level_goal: data.lv_goal_26,
    multi_level_goal: data.multi_goal_26,
  });

  return engineerId;
};

exports.updateEngineer = async (id, data) => {
  const set = [];
  const vals = [];

  const eqMap = {};
  if (data.main_eq !== undefined) eqMap.main_eq_id = await resolveEqId(data.main_eq);
  if (data.multi_eq !== undefined) eqMap.multi_eq_id = await resolveEqId(data.multi_eq);

  const map = {
    name: data.name,
    company: data.company,
    employee_id: data.employee_id === undefined ? undefined : nullIfEmpty(data.employee_id),
    '\`group\`': data.group,
    site: data.site,
    hire_date: data.hire_date === undefined ? undefined : nullIfEmpty(data.hire_date),
    role: data.role,
    ...eqMap,
  };

  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) {
      set.push(`${k} = ?`);
      vals.push(v);
    }
  }

  if (set.length) {
    vals.push(id);
    await pool.query(`UPDATE engineer SET ${set.join(', ')} WHERE id = ?`, vals);
  }

  await upsertAnnualGoal(id, 2025, {
    capa_goal: data.g25,
    level_goal: data.lv_goal_25,
    multi_level_goal: data.multi_goal_25,
  });
  await upsertAnnualGoal(id, 2026, {
    capa_goal: data.g26,
    level_goal: data.lv_goal_26,
    multi_level_goal: data.multi_goal_26,
  });
};

exports.resignEngineer = async () => {
  throw new Error('현재 engineer 스키마에는 재직상태/퇴사일 컬럼이 없어 퇴사 처리를 자동화할 수 없습니다. 별도 상태 테이블 또는 컬럼이 필요합니다.');
};

exports.reinstateEngineer = async () => {
  throw new Error('현재 스키마에서는 복직 처리를 지원하지 않습니다.');
};

exports.getMPICoverage = async (filters) => {
  const { where, vals } = buildWhere(filters, 'e');
  const [rows] = await pool.query(
    `SELECT em.eq_name AS eq,
            COUNT(DISTINCT e.id) AS cnt,
            GROUP_CONCAT(DISTINCT e.name ORDER BY e.name SEPARATOR ', ') AS names
     FROM engineer e
     JOIN capability_score cs ON cs.engineer_id = e.id
     JOIN eq_master em ON em.id = cs.eq_id
     ${where}
       AND COALESCE(e.multi_level, 0) >= 2
       AND (COALESCE(cs.setup_score, 0) > 0 OR COALESCE(cs.maint_score, 0) > 0)
     GROUP BY em.id, em.eq_name, em.display_order
     ORDER BY COALESCE(em.display_order, 9999), em.id`,
    vals
  );

  const [totalRows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM engineer e ${where} AND COALESCE(e.multi_level, 0) >= 2`,
    vals
  );

  return { total_mpi2: totalRows[0]?.cnt || 0, byEquipment: rows };
};

exports.getExportData = async (filters) => {
  const engineers = await getFilteredEngineers(filters);
  const engineerIds = engineers.map(e => e.id);
  const eqRows = await getActiveEqRows();
  const eqMap = new Map((await getEqRows()).map(r => [r.id, r.eq_name]));
  const historyMap = await getLevelHistoryMap(engineerIds);
  const { capaMap, levelMap } = await getGoalMaps(engineerIds);
  const capabilityMap = await getCapabilitySummaryMap(engineerIds);
  const capabilityPivot = await getCapabilityPivot(engineerIds);
  const { pivot: monthlyPivot, keys: monthlyKeys } = await getMonthlyCapabilityPivot(engineerIds);

  const oldKeyMap = {
    '1-1': 'Level1 Achieve',
    '1-2': 'Level2 Achieve',
    '1-3': 'Level3 Achieve',
    '2': 'Level4 Achieve',
    '2-2': 'Level2-2(B) Achieve',
    '2-3': 'Level2-2(A) Achieve',
    '2-4': 'Level2-3(B) Achieve',
  };

  const rows = engineers.map(e => {
    const history = historyMap.get(e.id) || {};
    const goals = capaMap.get(e.id) || {};
    const levelGoals = levelMap.get(e.id) || {};
    const capa = capabilityMap.get(e.id) || {};
    const eqPivot = capabilityPivot.get(e.id) || {};
    const monthPivot = monthlyPivot.get(e.id) || {};

    const row = {
      NAME: e.name,
      COMPANY: e.company,
      EMPLOYEE_ID: e.employee_id,
      GROUP: e.group,
      SITE: e.site,
      HIRE: e.hire_date,
      role: e.role,
      level_report: e.level_report,
      level_internal: e.level_internal,
      level_psk: e.level_psk,
      multi_level: e.multi_level,
      multi_level_psk: e.multi_level_psk,
      'MAIN EQ': eqMap.get(e.main_eq_id) || '',
      'MULTI EQ': eqMap.get(e.multi_eq_id) || '',
      'SET UP CAPA': capa.setup_capa ?? null,
      'MAINT CAPA': capa.maint_capa ?? null,
      CAPA: capa.capa ?? null,
      '25Y CAPA GOAL': goals['2025'] ?? null,
      '26Y CAPA GOAL': goals['2026'] ?? null,
      '25Y LEVEL GOAL': levelGoals['2025']?.level_goal ?? null,
      '26Y LEVEL GOAL': levelGoals['2026']?.level_goal ?? null,
    };

    Object.entries(oldKeyMap).forEach(([level, key]) => {
      row[key] = history[level] || null;
    });

    eqRows.forEach(eq => {
      row[`${eq.eq_name} SET UP`] = eqPivot[`${eq.eq_name} SET UP`] ?? null;
      row[`${eq.eq_name} MAINT`] = eqPivot[`${eq.eq_name} MAINT`] ?? null;
    });

    monthlyKeys.forEach(k => {
      row[k] = monthPivot[k] ?? null;
    });

    return row;
  });

  return { rows, monthlyKeys };
};

function normKey(s) {
  return (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function normalizeMonthlyRows(rows) {
  return (rows || [])
    .map(r => ({
      ym: r.ym,
      setup: r.setup == null ? null : Number(r.setup),
      maint: r.maint == null ? null : Number(r.maint),
      total: r.total == null ? null : Number(r.total),
    }))
    .filter(r => r.setup != null || r.maint != null || r.total != null);
}

async function getMonthlyEqSeries({ engineerId, eqId, eqName, engineerName }) {
  if (!eqName) return { rows: [], unit: 'capa', source: 'none' };

  const eqTables = [
    { table: 'monthly_eq_capability', eqCols: ['eq_id', 'equipment_id'] },
    { table: 'monthly_capability', eqCols: ['eq_id', 'equipment_id'] },
  ];

  for (const cfg of eqTables) {
    if (!(await hasTable(cfg.table))) continue;
    const cols = await getTableColumns(cfg.table);
    if (!cols.has('engineer_id') || !cols.has('ym') || !cols.has('setup_score') || !cols.has('maint_score')) continue;
    const eqCol = cfg.eqCols.find(c => cols.has(c));
    if (!eqCol) continue;

    const totalExpr = cols.has('total_score')
      ? 'total_score AS total'
      : `(CASE
            WHEN setup_score IS NULL AND maint_score IS NULL THEN NULL
            WHEN setup_score IS NOT NULL AND maint_score IS NOT NULL THEN (setup_score + maint_score) / 2
            ELSE COALESCE(setup_score, maint_score)
          END) AS total`;

    const [rows] = await pool.query(
      `SELECT ym, setup_score AS setup, maint_score AS maint, ${totalExpr}
       FROM ${cfg.table}
       WHERE engineer_id = ? AND ${eqCol} = ?
       ORDER BY ym`,
      [engineerId, eqId]
    );

    if (rows.length) return { rows: normalizeMonthlyRows(rows), unit: 'capa', source: cfg.table };
  }

  if (!engineerName || !eqName || !(await hasTable('wl_event')) || !(await hasTable('wl_worker'))) {
    return { rows: [], unit: 'capa', source: 'none' };
  }

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date, '%Y-%m') AS ym,
            SUM(CASE WHEN REPLACE(UPPER(TRIM(COALESCE(e.work_type, ''))), ' ', '') = 'SETUP' THEN COALESCE(w.task_duration, 0) ELSE 0 END) AS setup,
            SUM(CASE WHEN REPLACE(UPPER(TRIM(COALESCE(e.work_type, ''))), ' ', '') = 'MAINT' THEN COALESCE(w.task_duration, 0) ELSE 0 END) AS maint,
            SUM(COALESCE(w.task_duration, 0)) AS total
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status = 'APPROVED'
       AND w.engineer_name = ?
       AND e.equipment_type = ?
     GROUP BY ym
     ORDER BY ym`,
    [engineerName, eqName]
  );

  return { rows: normalizeMonthlyRows(rows).filter(r => Number(r.total || 0) > 0), unit: 'minutes', source: 'worklog' };
}

exports.getMyDashboard = async (me) => {
  const where = [];
  const vals = [];
  if (me.employee_id) { where.push('e.employee_id = ?'); vals.push(me.employee_id); }
  if (!where.length && me.name) { where.push('e.name = ?'); vals.push(me.name); }
  if (!where.length) return { profile: null };

  const [rows] = await pool.query(
    `SELECT e.id, e.name, e.company, e.employee_id, e.\`group\`, e.site, e.hire_date, e.role,
            e.main_eq_id, e.multi_eq_id,
            e.level_report, e.level_internal, e.level_psk, e.multi_level, e.multi_level_psk,
            meq.eq_name AS main_eq, mueq.eq_name AS multi_eq
     FROM engineer e
     LEFT JOIN eq_master meq ON meq.id = e.main_eq_id
     LEFT JOIN eq_master mueq ON mueq.id = e.multi_eq_id
     WHERE ${where.join(' OR ')}
     LIMIT 1`,
    vals
  );
  const u = rows[0] || null;
  if (!u) return { profile: null };

  const engineerId = u.id;
  const capabilitySummary = await getCapabilitySummaryMap([engineerId]);
  const [goalRows] = await pool.query(
    `SELECT goal_year, capa_goal, level_goal, multi_level_goal
     FROM annual_goal
     WHERE engineer_id = ?`,
    [engineerId]
  );
  const [historyRows] = await pool.query(
    `SELECT level_code, MIN(achieved_date) AS achieved_date
     FROM level_history
     WHERE engineer_id = ? AND achieved_date IS NOT NULL
     GROUP BY level_code`,
    [engineerId]
  );
  const [eqRows] = await pool.query(
    `SELECT em.id AS eq_id, em.eq_name AS eq, cs.setup_score AS setup, cs.maint_score AS maint
     FROM capability_score cs
     JOIN eq_master em ON em.id = cs.eq_id
     WHERE cs.engineer_id = ?
     ORDER BY COALESCE(em.display_order, 9999), em.id`,
    [engineerId]
  );
  const [overallMonthlyRows] = await pool.query(
    `SELECT ym, setup_score AS setup, maint_score AS maint, total_score AS total
     FROM monthly_capability
     WHERE engineer_id = ?
     ORDER BY ym`,
    [engineerId]
  );
  const overallMonthly = normalizeMonthlyRows(overallMonthlyRows);

  const [monthlyHours] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym,
            SUM(w.task_duration) AS total_minutes,
            COUNT(DISTINCT e.id) AS event_count
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ?
     GROUP BY ym
     ORDER BY ym`,
    [u.name]
  );
  const [byWorkType] = await pool.query(
    `SELECT e.work_type AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ?
     GROUP BY e.work_type`,
    [u.name]
  );
  const [byWorkSort] = await pool.query(
    `SELECT IFNULL(e.work_type2,'N/A') AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND e.work_type='MAINT'
     GROUP BY label`,
    [u.name]
  );
  const [byGroup] = await pool.query(
    `SELECT e.\`group\` AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND e.\`group\` IS NOT NULL AND e.\`group\` <> 'SELECT'
     GROUP BY e.\`group\`
     ORDER BY cnt DESC`,
    [u.name]
  );
  const [bySite] = await pool.query(
    `SELECT e.site AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND e.site IS NOT NULL AND e.site <> 'SELECT'
     GROUP BY e.site
     ORDER BY cnt DESC`,
    [u.name]
  );
  const [byLine] = await pool.query(
    `SELECT e.line AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND e.line IS NOT NULL AND e.line <> 'SELECT'
     GROUP BY e.line
     ORDER BY cnt DESC`,
    [u.name]
  );
  const [byShift] = await pool.query(
    `SELECT CASE WHEN TIME(w.start_time)<'12:00:00' THEN '오전 근무' ELSE '오후 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND w.start_time IS NOT NULL
     GROUP BY label`,
    [u.name]
  );
  const [byOvertime] = await pool.query(
    `SELECT CASE WHEN TIME(w.end_time)<='18:00:00' THEN '일반 근무' ELSE '초과 근무' END AS label,
            COUNT(*) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND w.end_time IS NOT NULL
     GROUP BY label`,
    [u.name]
  );
  const [byEqType] = await pool.query(
    `SELECT e.equipment_type AS label, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND e.equipment_type IS NOT NULL AND e.equipment_type <> 'SELECT'
     GROUP BY e.equipment_type
     ORDER BY cnt DESC`,
    [u.name]
  );
  const [reworkMonthly] = await pool.query(
    `SELECT DATE_FORMAT(e.task_date,'%Y-%m') AS ym, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED' AND w.engineer_name = ? AND e.is_rework=1
     GROUP BY ym
     ORDER BY ym`,
    [u.name]
  );
  const [timeRank] = await pool.query(
    `SELECT w.engineer_name AS name, SUM(w.task_duration) AS total_minutes
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED'
       AND e.task_date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
     GROUP BY w.engineer_name
     ORDER BY total_minutes DESC`,
    []
  );
  const [taskRank] = await pool.query(
    `SELECT w.engineer_name AS name, COUNT(DISTINCT e.id) AS cnt
     FROM wl_event e
     JOIN wl_worker w ON w.event_id = e.id
     WHERE e.approval_status='APPROVED'
       AND e.task_date >= DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE())-1 DAY)
     GROUP BY w.engineer_name
     ORDER BY cnt DESC`,
    []
  );

  const cap = capabilitySummary.get(engineerId) || {};
  const achieved = {};
  historyRows.forEach(r => {
    const norm = normalizeLevelCode(r.level_code);
    if (norm) achieved[norm] = r.achieved_date;
  });
  const goalMap = {};
  goalRows.forEach(r => { goalMap[r.goal_year] = r; });

  const eqCapability = eqRows.map(r => {
    const total = r.setup != null && r.maint != null ? (Number(r.setup) + Number(r.maint)) / 2 : (r.setup ?? r.maint ?? null);
    return { eq_id: r.eq_id, eq: r.eq, setup: r.setup, maint: r.maint, total };
  });

  function pickEqCap(eq) {
    const row = eqCapability.find(r => r.eq === eq);
    return row || { eq, setup: null, maint: null, total: null };
  }

  const mainCap = pickEqCap(u.main_eq);
  const multiCap = pickEqCap(u.multi_eq);
  const mainMonthlySeries = await getMonthlyEqSeries({ engineerId, eqId: u.main_eq_id, eqName: u.main_eq, engineerName: u.name });
  const multiMonthlySeries = await getMonthlyEqSeries({ engineerId, eqId: u.multi_eq_id, eqName: u.multi_eq, engineerName: u.name });

  const monthlyAvg = overallMonthly.map(r => ({
    ym: r.ym,
    total: r.total,
    goal: goalMap[Number(String(r.ym).slice(0, 4))]?.capa_goal ?? null,
  }));

  return {
    profile: {
      id: u.id,
      name: u.name,
      company: u.company,
      employee_id: u.employee_id,
      group: u.group,
      site: u.site,
      hire_date: u.hire_date,
      role: u.role,
      main_eq: u.main_eq,
      multi_eq: u.multi_eq,
      level_report: u.level_report,
      level_internal: u.level_internal,
      level_psk: u.level_psk,
      multi_level: u.multi_level,
      multi_level_psk: u.multi_level_psk,
      setup_capa: cap.setup_capa ?? null,
      maint_capa: cap.maint_capa ?? null,
      multi_capa: multiCap.total ?? null,
      capa: cap.capa ?? null,
      goal25: goalMap[2025]?.capa_goal ?? null,
      goal26: goalMap[2026]?.capa_goal ?? null,
      achieved,
    },
    capability: {
      eqCapability,
      main: mainCap,
      multi: multiCap,
      monthlyMain: mainMonthlySeries.rows,
      monthlyMainUnit: mainMonthlySeries.unit,
      monthlyMainSource: mainMonthlySeries.source,
      monthlyMulti: multiMonthlySeries.rows,
      monthlyMultiUnit: multiMonthlySeries.unit,
      monthlyMultiSource: multiMonthlySeries.source,
      monthlyAvg,
    },
    work: {
      monthlyHours,
      byWorkType,
      byWorkSort,
      byGroup,
      bySite,
      byLine,
      byShift,
      byOvertime,
      byEqType,
      reworkMonthly,
    },
    rank: { timeRank, taskRank, myName: u.name },
  };
};
