// src/pci/supran_setup/pciDao.js
const { pool } = require("../../../config/database");
const { ALLOWED_EQUIP_TYPES, toDisplayCategory, normalizeKey, CATEGORY_ITEMS } = require("./pciConfig");

/** 기간 필터 포함: SUPRA-N SETUP 관련 로그 (setup_item 기준) */
exports.fetchSetupLogsForSupraN = async ({ startDate, endDate } = {}) => {
  const placeholders = ALLOWED_EQUIP_TYPES.map(() => "?").join(",");
  const params = [...ALLOWED_EQUIP_TYPES];

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
  for (const r of rows) r.setup_item = toDisplayCategory(r.setup_item);
  return rows;
};

/** 자가체크 1행: SUPRA_SETUP (소항목 컬럼들) */
exports.fetchSelfRow = async (workerName) => {
  const [rows] = await pool.query(`SELECT * FROM SUPRA_SETUP WHERE name = ? LIMIT 1`, [workerName]);
  return rows[0] || null;
};

/** 자가체크 전체: 매트릭스용 */
exports.fetchSelfAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM SUPRA_SETUP`);
  return rows;
};

/** 교육/가산 카운트 피벗: SUPRA_N_SETUP (카테고리 컬럼) → { "INSTALLATION PREPARATION": { "홍길동": n, ... } } */
exports.fetchAdditionalCountsPivot = async () => {
  const [rows] = await pool.query(`SELECT * FROM SUPRA_N_SETUP`);
  if (!rows.length) return {};
  const pivot = {};
  for (const row of rows) {
    const worker = String(row.name || "").trim();
    if (!worker) continue;
    for (const col of Object.keys(row)) {
      if (col === "name" || col === "updated_at") continue;
      const disp = toDisplayCategory(col);
      const v = Number(row[col] ?? 0);
      if (!Number.isFinite(v) || v <= 0) continue;
      pivot[disp] = pivot[disp] || {};
      pivot[disp][worker] = v;
    }
  }
  return pivot;
};

/** 카테고리 자가체크 합산(소항목 비율 → 20% 환산) */
exports.computeSelfForCategory = (selfRow, catDisplay) => {
  // CATEGORY_ITEMS 키는 언더바 표기 / catDisplay는 공백 표기
  const catKey = Object.keys(CATEGORY_ITEMS).find(
    (k) => normalizeKey(k).replace(/_/g, " ") === normalizeKey(catDisplay).replace(/_/g, " ")
  );
  const keys = catKey ? CATEGORY_ITEMS[catKey] : [];

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
    const col = normalizeKey(k); // 안전하게
    const v = Number(selfRow[col] ?? 0);
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
