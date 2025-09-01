// src/pci/integer_setup/pciDao.js
const { pool } = require("../../../config/database");
const { ALLOWED_EQUIP_TYPES, toDisplayCategory, getChecklistKeysForCategory } = require("./pciConfig");

/** 기간 필터 포함: SETUP 관련 로그 (setup_item 기준) */
exports.fetchSetupLogsForInteger = async ({ startDate, endDate } = {}) => {
  const eq = ALLOWED_EQUIP_TYPES;
  const placeholders = eq.map(() => "?").join(",");
  const params = [...eq];

  let where = `setup_item IS NOT NULL AND equipment_type IN (${placeholders})`;
  if (startDate) { where += ` AND task_date >= ?`; params.push(startDate); }
  if (endDate)   { where += ` AND task_date <= ?`; params.push(endDate); }

  const sql = `
    SELECT
      id, task_date, task_man,
      equipment_type, equipment_name,
      task_name, task_description, setup_item
    FROM work_log
    WHERE ${where}
  `;
  const [rows] = await pool.query(sql, params);

  // 카테고리 정규화
  for (const r of rows) r.setup_item = toDisplayCategory(r.setup_item);
  return rows;
};

/** 자가체크 1행 (INTEGER_SETUP) */
exports.fetchSelfRow = async (workerName) => {
  const [rows] = await pool.query(`SELECT * FROM INTEGER_SETUP WHERE name = ? LIMIT 1`, [workerName]);
  return rows[0] || null;
};

/** 자가체크 전체 (매트릭스용) */
exports.fetchSelfAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM INTEGER_SETUP`);
  return rows;
};

/** 교육/가산 카운트 피벗 (INTEGER_SETUP_COUNT) → { "INSTALLATION PREPARATION": { "홍길동": n, ... } } */
exports.fetchAdditionalCountsPivot = async () => {
  const [rows] = await pool.query(`SELECT * FROM INTEGER_PLUS_SETUP`);
  if (!rows.length) return {};

  // 컬럼명을 표시명으로 보정(오탈자 포함)
  const pivot = {};
  for (const row of rows) {
    for (const col of Object.keys(row)) {
      if (col === "name" || col === "updated_at") continue;
      const cat = toDisplayCategory(col); // INSTALLATION_PREPERATION 등 보정
      pivot[cat] = pivot[cat] || {};
      const v = Number(row[col] ?? 0);
      if (Number.isFinite(v) && v > 0) {
        const worker = String(row.name || "").trim();
        if (worker) pivot[cat][worker] = v;
      }
    }
  }
  return pivot;
};

/** 카테고리 하나에 대한 자가체크 합산 계산 */
exports.computeSelfForCategory = (selfRow, catDisplay) => {
  const keys = getChecklistKeysForCategory(catDisplay);
  if (!selfRow || !keys.length) {
    return {
      total_items: keys.length,
      total_checked: 0,
      ratio: 0,
      self_pct: 0,
      checklist: keys.map(k => ({ key: k, value: Number(selfRow?.[k] ?? 0) }))
    };
  }
  let checked = 0;
  const detail = [];
  for (const k of keys) {
    const v = Number(selfRow[k] ?? 0);
    if (Number.isFinite(v) && v > 0) checked += 1;
    detail.push({ key: k, value: v });
  }
  const ratio = keys.length > 0 ? Math.min(1, checked / keys.length) : 0;
  const self_pct = Math.round(ratio * 20 * 10) / 10; // 최대 20%
  return {
    total_items: keys.length,
    total_checked: checked,
    ratio,
    self_pct,
    checklist: detail
  };
};
