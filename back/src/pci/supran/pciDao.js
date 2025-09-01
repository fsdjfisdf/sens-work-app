// src/pci/supran/pciDao.js
const { pool } = require("../../../config/database");
const { ALLOWED_EQUIP_TYPES, normalizeItem } = require("./pciConfig");

/** 기간 필터 포함 SUPRA N 관련 로그 */
exports.fetchWorkLogsForSupraN = async ({ startDate, endDate } = {}) => {
  const eq = ALLOWED_EQUIP_TYPES;
  const placeholders = eq.map(() => "?").join(",");
  const params = [...eq];

  let where = `transfer_item IS NOT NULL AND equipment_type IN (${placeholders})`;
  if (startDate) { where += ` AND task_date >= ?`; params.push(startDate); }
  if (endDate)   { where += ` AND task_date <= ?`; params.push(endDate);   }
  const sql = `
    SELECT
      id,
      task_date,
      task_man,
      equipment_type,
      equipment_name,     -- 추가
      task_name,          -- 추가
      task_description,   -- 추가 (HTML <br> 포함)
      transfer_item
    FROM work_log
    WHERE ${where}
  `;
  const [rows] = await pool.query(sql, params);

  // 항목명 정규화
  for (const r of rows) r.transfer_item = normalizeItem(r.transfer_item);
  return rows;
};

/** 자가체크 1행 */
exports.fetchSelfCheckRow = async (workerName) => {
  const [rows] = await pool.query(
    `SELECT * FROM SUPRA_N_MAINT_SELF WHERE name = ? LIMIT 1`,
    [workerName]
  );
  return rows[0] || null;
};

/** 교육/가산 카운트 피벗: { "LP ESCORT": { "정현우": 1, ... } } */
exports.fetchAdditionalCountsPivot = async () => {
  const [rows] = await pool.query(`SELECT * FROM task_count_myservice`);
  if (!rows.length) return {};
  const pivot = {};
  for (const row of rows) {
    const item = row["작업_항목"];
    if (!item) continue;
    pivot[item] = {};
    for (const key of Object.keys(row)) {
      if (key === "작업_항목") continue;
      const v = Number(row[key] ?? 0);
      if (Number.isFinite(v) && v > 0) pivot[item][key.trim()] = v;
    }
  }
  return pivot;
};

// 추가: 모든 Self 체크 행 로드(이름 포함)
exports.fetchSelfCheckAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM SUPRA_N_MAINT_SELF`);
  return rows;
};

// 추가: Self 테이블의 이름만 빠르게 로드
exports.fetchSelfCheckNames = async () => {
  const [rows] = await pool.query(`SELECT name FROM SUPRA_N_MAINT_SELF WHERE name IS NOT NULL AND name <> ''`);
  return rows.map(r => r.name);
};
