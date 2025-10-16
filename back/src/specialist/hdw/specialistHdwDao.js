// HDW 교육(가산) 횟수 편집 DAO
const { pool } = require("../../../config/database");

/** 안전한 컬럼 식별자 (백틱 이스케이프) */
function qi(identifier) {
  const safe = String(identifier).replace(/`/g, "``");
  return "`" + safe + "`";
}

/** 테이블/컬럼 상수 */
const TBL_COUNT = "HDW_MAINT_COUNT";  // ← 사용자 요청 반영
const COL_ITEM  = "작업_항목";

/** 열(작업자) 존재 유무 */
async function hasColumn(worker) {
  const [rows] = await pool.query(
    `SHOW COLUMNS FROM ${qi(TBL_COUNT)} LIKE ?`,
    [worker]
  );
  return rows.length > 0;
}

/** 0) 편집 가능한 작업자(=열) 목록 */
exports.listWorkersFromCountTable = async () => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${qi(TBL_COUNT)}`);
  return rows
    .map(r => r.Field)
    .filter(f => f !== COL_ITEM);
};

/** 1) 특정 작업자의 전 항목 값 조회 */
exports.getAllItemsWithCountsForWorker = async (worker) => {
  const sql = `
    SELECT ${qi(COL_ITEM)} AS item,
           COALESCE(${qi(worker)}, 0) AS add_count
    FROM ${qi(TBL_COUNT)}
    ORDER BY ${qi(COL_ITEM)} ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
};

/** 2) 행 보장 (항목) */
exports.ensureItemRow = async (item) => {
  await pool.query(
    `INSERT IGNORE INTO ${qi(TBL_COUNT)} (${qi(COL_ITEM)}) VALUES (?)`,
    [item]
  );
};

/** 3) 열 보장 (작업자) — 없으면 ADD COLUMN */
exports.ensureWorkerColumn = async (worker) => {
  if (await hasColumn(worker)) return;

  // 기본값 0, NULL 허용 (필요시 NOT NULL DEFAULT 0 로 바꿔도 됨)
  const sql = `
    ALTER TABLE ${qi(TBL_COUNT)}
    ADD COLUMN ${qi(worker)} DECIMAL(10,2) NULL DEFAULT 0
  `;
  await pool.query(sql);
};

/** 4) 현재 셀 값 조회 */
exports.getCell = async ({ item, worker }) => {
  const sql = `
    SELECT COALESCE(${qi(worker)}, 0) AS cur
    FROM ${qi(TBL_COUNT)}
    WHERE ${qi(COL_ITEM)} = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [item]);
  return rows[0]?.cur ?? 0;
};

/** 5) 셀 값 저장 (set) */
exports.setCell = async ({ item, worker, value }) => {
  await exports.ensureItemRow(item);
  const sql = `
    UPDATE ${qi(TBL_COUNT)}
    SET ${qi(worker)} = ?
    WHERE ${qi(COL_ITEM)} = ?
  `;
  const [r] = await pool.query(sql, [value, item]);
  return r.affectedRows;
};

/** 6) 감사 로그 (없으면 무시) */
exports.insertAudit = async ({ actor, worker, item, prev, next, mode, reason, ip }) => {
  // 필요 시 먼저 아래 테이블을 생성하세요 (권장):
  // CREATE TABLE HDW_EDU_AUDIT(
  //   id BIGINT PRIMARY KEY AUTO_INCREMENT,
  //   at DATETIME NOT NULL,
  //   actor VARCHAR(100),
  //   worker VARCHAR(100),
  //   item VARCHAR(200),
  //   prev DECIMAL(10,2),
  //   next DECIMAL(10,2),
  //   mode VARCHAR(10),
  //   reason VARCHAR(255),
  //   ip VARCHAR(64)
  // ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  const sql = `
    INSERT INTO HDW_EDU_AUDIT
      (at, actor, worker, item, prev, next, mode, reason, ip)
    VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    await pool.query(sql, [actor, worker, item, prev, next, mode, reason || null, ip || null]);
  } catch (_e) {
    // 감사 테이블이 없다면 조용히 무시 (요구 시 에러로 바꿔도 됨)
  }
};
