// src/pci/hdw/pciDao.js
const { pool } = require("../../../config/database");
const { ALLOWED_EQUIP_TYPES, normalizeItem } = require("./pciConfig");

/** SELF 테이블 행의 모든 키를 대문자 복제해서 반환 (name은 원본 유지)
 *  - 자가체크 컬럼이 'Relay_REP', 'Fan_REP'처럼 혼용 케이스를 쓰므로
 *    컨트롤러의 toSelfCol(대문자)와 안전하게 매칭되도록 함.
 */
function upperizeSelfRow(row) {
  if (!row) return null;
  const out = { ...row }; // name 포함 원본 유지
  for (const k of Object.keys(row)) {
    if (k === "name") continue;
    out[k.toUpperCase()] = row[k];
  }
  return out;
}

/** 기간 필터 포함 — HDW 관련 작업 로그 */
exports.fetchWorkLogsForHdw = async ({ startDate, endDate } = {}) => {
  const eq = ALLOWED_EQUIP_TYPES; // 예: ["hdw","HDW"]
  const placeholders = eq.map(() => "?").join(",");
  const params = [...eq];

  let where = `transfer_item IS NOT NULL AND equipment_type IN (${placeholders})`;
  if (startDate) { where += ` AND task_date >= ?`; params.push(startDate); }
  if (endDate)   { where += ` AND task_date <= ?`; params.push(endDate); }

  const sql = `
    SELECT
      id, task_date, task_man,
      equipment_type, equipment_name, task_name, task_description,
      transfer_item
    FROM work_log
    WHERE ${where}
  `;
  const [rows] = await pool.query(sql, params);

  // 항목명 정규화(컨트롤러 기준과 동일 규칙)
  for (const r of rows) r.transfer_item = normalizeItem(r.transfer_item);
  return rows;
};

/** 자가체크: 특정 작업자 1행 */
exports.fetchSelfCheckRow = async (workerName) => {
  const [rows] = await pool.query(
    `SELECT * FROM HDW_MAINT_SELF WHERE name = ? LIMIT 1`,
    [workerName]
  );
  return upperizeSelfRow(rows[0] || null);
};

/** 교육/가산 카운트 피벗: { "ITEM": { "홍길동": 1, ... } } */
exports.fetchAdditionalCountsPivot = async () => {
  const [rows] = await pool.query(`SELECT * FROM HDW_MAINT_COUNT`);
  if (!rows.length) return {};
  const pivot = {};
  for (const row of rows) {
    const item = row["작업_항목"];
    if (!item) continue;
    const box = {};
    for (const key of Object.keys(row)) {
      if (key === "작업_항목") continue;
      const v = Number(row[key] ?? 0);
      if (Number.isFinite(v) && v > 0) box[key.trim()] = v;
    }
    pivot[item] = box;
  }
  return pivot;
};

/** 자가체크 전체 */
exports.fetchSelfCheckAll = async () => {
  const [rows] = await pool.query(`SELECT * FROM HDW_MAINT_SELF`);
  return rows.map(upperizeSelfRow);
};

/** SELF 테이블의 이름만 빠르게 로드 */
exports.fetchSelfCheckNames = async () => {
  const [rows] = await pool.query(
    `SELECT name FROM HDW_MAINT_SELF WHERE name IS NOT NULL AND name <> ''`
  );
  return rows.map(r => r.name);
};
