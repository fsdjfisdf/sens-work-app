const { pool } = require("../../../config/database");
const { BASELINE } = require("../../pci/integer/pciConfig");

// ─────────────────────────────────────────────────────────────
// 식별자(테이블/컬럼)용: 백틱 안전 래핑 (정상적으로 `한쌍`만 사용)
// ─────────────────────────────────────────────────────────────
function safeIdent(id) {
  const cleaned = String(id || "")
    .replace(/[`]/g, "") // 백틱 제거
    // 한글/영문/숫자/밑줄/공백/괄호/점/하이픈만 허용
    .replace(/[^\w\u3131-\u318E\uAC00-\uD7A3 .()_-]/g, "")
    .trim();
  if (!cleaned) throw new Error("invalid_identifier");
  return `\`${cleaned}\``; // ← 백틱 한 쌍
}

const TBL = "`INTEGER_MAINT_COUNT`";
const COL_ITEM = "`작업_항목`";

// ─────────────────────────────────────────────────────────────
// 컬럼/행 존재 보장 & 조회 유틸
// ─────────────────────────────────────────────────────────────
exports.listWorkersFromCountTable = async () => {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'INTEGER_MAINT_COUNT'
     ORDER BY ORDINAL_POSITION`
  );
  return cols.map((c) => c.COLUMN_NAME).filter((n) => n !== "작업_항목");
};

exports.ensureWorkerColumn = async (workerName) => {
  const workerCols = await exports.listWorkersFromCountTable();
  if (workerCols.includes(workerName)) return;
  const col = safeIdent(workerName);
  const sql = `ALTER TABLE ${TBL} ADD COLUMN ${col} INT DEFAULT 0`;
  await pool.query(sql);
};

exports.ensureItemRow = async (item) => {
  const [rows] = await pool.query(`SELECT 1 FROM ${TBL} WHERE ${COL_ITEM} = ? LIMIT 1`, [item]);
  if (rows.length) return;
  await pool.query(`INSERT INTO ${TBL} (${COL_ITEM}) VALUES (?)`, [item]);
};

exports.getCell = async (item, worker) => {
  const col = safeIdent(worker);
  const [rows] = await pool.query(`SELECT ${col} AS v FROM ${TBL} WHERE ${COL_ITEM} = ? LIMIT 1`, [item]);
  if (!rows.length) return 0;
  const v = Number(rows[0].v ?? 0);
  return Number.isFinite(v) ? v : 0;
};

exports.setCell = async (item, worker, value) => {
  const col = safeIdent(worker);
  await pool.query(`UPDATE ${TBL} SET ${col} = ? WHERE ${COL_ITEM} = ?`, [Math.max(0, Math.floor(value || 0)), item]);
};

// ─────────────────────────────────────────────────────────────
// 조회: BASELINE 기준 "풀 리스트" 반환 (없으면 0)
// ─────────────────────────────────────────────────────────────
exports.getAllItemsWithCountsForWorker = async (rawWorker) => {
  const col = safeIdent(String(rawWorker || "").trim());

  // 현재 테이블에 있는 모든 (item, add_count) 읽기
  const [rows] = await pool.query(
    `SELECT ${COL_ITEM} AS item, COALESCE(${col}, 0) AS add_count FROM ${TBL}`
  );

  // 맵으로 보관
  const map = new Map(rows.map((r) => [String(r.item), Number(r.add_count || 0)]));

  // BASELINE 키(정규화된 항목명) 기준으로 항상 전 항목 반환
  const out = [];
  for (const item of Object.keys(BASELINE)) {
    out.push({ item, add_count: map.get(item) ?? 0 });
  }

  // 보기 좋은 정렬 (국문/영문 혼재)
  out.sort((a, b) => a.item.localeCompare(b.item, "ko"));
  return out;
};

// ─────────────────────────────────────────────────────────────
// 감사 로그
// ─────────────────────────────────────────────────────────────
exports.insertAudit = async ({ actor, worker, item, prev, next, mode, reason, ip }) => {
  const sql = `
    INSERT INTO INTEGER_MAINT_COUNT_AUDIT
      (acted_at, actor, worker, item, prev_value, next_value, mode, reason, ip)
    VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await pool.query(sql, [actor, worker, item, prev, next, mode, reason, ip]);
};
