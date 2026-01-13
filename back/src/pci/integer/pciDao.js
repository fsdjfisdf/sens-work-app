// src/pci/integer/pciDao.js
const { pool } = require("../../../config/database");
const { ALLOWED_EQUIP_TYPES } = require("./pciConfig");

/** 기간 필터 포함 INTEGER 관련 로그 */
exports.fetchWorkLogsForInteger = async ({ startDate, endDate } = {}) => {
  const eq = ALLOWED_EQUIP_TYPES;
  const placeholders = eq.map(() => "?").join(",");
  const params = [...eq];

  let where = `transfer_item IS NOT NULL AND equipment_type IN (${placeholders})`;
  if (startDate) { where += ` AND task_date >= ?`; params.push(startDate); }
  if (endDate)   { where += ` AND task_date <= ?`; params.push(endDate); }

  const sql = `
    SELECT
      id,
      task_date,
      task_man,
      equipment_type,
      equipment_name,
      task_name,
      task_description,
      transfer_item
    FROM work_log
    WHERE ${where}
  `;
  const [rows] = await pool.query(sql, params);

  // 항목명 정규화
  return rows;
};

/** 자가체크 1행 */
exports.fetchSelfCheckRow = async (workerName) => {
  const [rows] = await pool.query(
    `SELECT * FROM INTEGER_MAINT_SELF WHERE name = ? LIMIT 1`,
    [workerName]
  );
  return rows[0] || null;
};

/** 교육/가산 카운트 피벗: { "SWAP KIT": { "정현우": 1, ... } } */
exports.fetchAdditionalCountsPivot = async () => {
  const [rows] = await pool.query(`SELECT * FROM INTEGER_MAINT_COUNT`);
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

// Self 전체 / 이름 목록
exports.fetchSelfCheckAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM INTEGER_MAINT_SELF`);
  return rows;
};

exports.fetchSelfCheckNames = async () => {
  const [rows] = await pool.query(`SELECT name FROM INTEGER_MAINT_SELF WHERE name IS NOT NULL AND name <> ''`);
  return rows.map(r => r.name);
};
