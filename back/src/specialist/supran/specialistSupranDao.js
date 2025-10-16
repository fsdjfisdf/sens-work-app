// SUPRA N 교육(가산) 횟수 편집 DAO
const { pool } = require("../../../config/database");

/** 안전한 컬럼 식별자 (백틱 이스케이프) */
function qi(identifier){
  // MySQL 식별자에서 백틱은 ``로 이스케이프
  const safe = String(identifier).replace(/`/g, "``");
  return "`" + safe + "`";
}

/** 테이블 명 상수 */
const TBL_COUNT = "SUPRAN_MAINT_COUNT";

/** 1) 편집 가능한 작업자(=열) 목록 */
exports.fetchWorkerColumns = async () => {
  // SHOW COLUMNS FROM SUPRAN_MAINT_COUNT
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${qi(TBL_COUNT)}`);
  const cols = rows
    .map(r => r.Field)
    .filter(f => f !== "작업_항목"); // 첫 열: 항목명
  return cols;
};

/** 2) 특정 작업자의 전 항목 값 조회 */
exports.getAllItemsWithCountsForWorker = async (worker) => {
  // SELECT `작업_항목` AS item, COALESCE(`{worker}`,0) AS add_count FROM SUPRAN_MAINT_COUNT
  const sql = `
    SELECT ${qi("작업_항목")} AS item,
           COALESCE(${qi(worker)}, 0) AS add_count
    FROM ${qi(TBL_COUNT)}
    ORDER BY ${qi("작업_항목")} ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
};

/** 3) 행이 없으면 INSERT (작업_항목만) */
async function ensureRow(item){
  await pool.query(
    `INSERT IGNORE INTO ${qi(TBL_COUNT)} (${qi("작업_항목")}) VALUES (?)`,
    [item]
  );
}

/** 4) 단일 셀 set/update */
exports.setCellValue = async ({ worker, item, value }) => {
  await ensureRow(item);
  const sql = `
    UPDATE ${qi(TBL_COUNT)}
    SET ${qi(worker)} = ?
    WHERE ${qi("작업_항목")} = ?
  `;
  const [r] = await pool.query(sql, [value, item]);
  return r.affectedRows;
};

/** 5) 현재 값 조회 */
exports.getCurrentValue = async ({ worker, item }) => {
  const sql = `
    SELECT COALESCE(${qi(worker)},0) AS cur
    FROM ${qi(TBL_COUNT)}
    WHERE ${qi("작업_항목")} = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [item]);
  return rows[0]?.cur ?? 0;
};

/** 6) 감사 로그 (선택) — 테이블 없으면 주석 처리해서 사용 */
exports.writeAudit = async ({ worker, item, prev, next, reason, editor }) => {
  // 필요 시 아래 테이블을 생성해 사용하세요.
  // CREATE TABLE SUPRAN_EDU_AUDIT(id BIGINT PK AUTO_INCREMENT, at DATETIME, worker VARCHAR(100), item VARCHAR(200), prev DECIMAL(10,2), next DECIMAL(10,2), reason VARCHAR(255), editor VARCHAR(100));
  const sql = `
    INSERT INTO SUPRAN_EDU_AUDIT (at, worker, item, prev, next, reason, editor)
    VALUES (NOW(), ?, ?, ?, ?, ?, ?)
  `;
  try{
    await pool.query(sql, [worker, item, prev, next, reason || null, editor || null]);
  }catch(_e){
    // 감사 테이블이 없다면 조용히 무시
  }
};
