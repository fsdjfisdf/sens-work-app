// src/pci/precia_setup/pciDao.js
const { pool } = require("../../../config/database");
const {
  ALLOWED_EQUIP_TYPES,
  itemToCategory,
  normalizeCategory,
  toSelfCol,
} = require("./pciConfig");

/** 기간 필터 포함 — PRECIA Setup 로그 */
exports.fetchWorkLogsForPreciaSetup = async ({ startDate, endDate } = {}) => {
  const eq = ALLOWED_EQUIP_TYPES;
  const placeholders = eq.map(() => "?").join(",");
  const params = [...eq];

  let where = `setup_item IS NOT NULL AND equipment_type IN (${placeholders})`;
  if (startDate) {
    where += ` AND task_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    where += ` AND task_date <= ?`;
    params.push(endDate);
  }
  const sql = `
    SELECT
      id, task_date, task_man,
      equipment_type, equipment_name,
      task_name, task_description, setup_item
    FROM work_log
    WHERE ${where}
  `;
  const [rows] = await pool.query(sql, params);

  // 카테고리 매핑(세부 → 카테고리)
  for (const r of rows) {
    const cat = itemToCategory(r.setup_item);
    r.setup_category = cat; // 없으면 normalizeCategory가 원문을 카테고리처럼 돌려줌
  }
  return rows;
};

/** 자가체크 1행 (PRECIA_SETUP) */
exports.fetchSelfCheckRow = async (workerName) => {
  const [rows] = await pool.query(`SELECT * FROM PRECIA_SETUP WHERE name = ? LIMIT 1`, [workerName]);
  return rows[0] || null;
};

/** 자가체크 전체 */
exports.fetchSelfCheckAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM PRECIA_SETUP`);
  return rows;
};

/** Self 테이블의 이름만 빠르게 로드 */
exports.fetchSelfCheckNames = async () => {
  const [rows] = await pool.query(`SELECT name FROM PRECIA_SETUP WHERE name IS NOT NULL AND name <> ''`);
  return rows.map((r) => r.name);
};

/** 교육/가산 카운트 피벗 (PRECIA_SETUP_COUNT)
 *  → { "INSTALLATION_PREPARATION": { "홍길동": 2, ... }, ... }
 *  - INSTALLATION_PREPERATION (오탈자) → INSTALLATION_PREPARATION 로 보정
 */
exports.fetchAdditionalCountsPivot = async () => {
  const [rows] = await pool.query(`SELECT * FROM PRECIA_SETUP_COUNT`);
  if (!rows.length) return {};
  const pivot = {};
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key === "name" || key === "updated_at") continue;
      const fixedKey = (key === "INSTALLATION_PREPERATION") ? "INSTALLATION_PREPARATION" : key;
      const cat = normalizeCategory(fixedKey);
      pivot[cat] = pivot[cat] || {};
      const v = Number(row[key] ?? 0);
      if (Number.isFinite(v) && v > 0) {
        const who = String(row.name || "").trim();
        if (who) pivot[cat][who] = (pivot[cat][who] || 0) + v;
      }
    }
  }
  return pivot;
};
