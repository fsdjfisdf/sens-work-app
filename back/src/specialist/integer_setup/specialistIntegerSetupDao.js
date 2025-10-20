// INTEGER SETUP 교육(가산) 횟수 편집 DAO
const { pool } = require("../../../config/database");

const TBL = "INTEGER_PLUS_SETUP";

// 안전 식별자
const qi = s => "`" + String(s).replace(/`/g,"``") + "`";

// 1) 작업자 목록 (name 컬럼)
exports.listWorkers = async ()=>{
  const [rows] = await pool.query(`SELECT ${qi("name")} FROM ${qi(TBL)} ORDER BY ${qi("name")} ASC`);
  return rows.map(r => r.name).filter(Boolean);
};

// 2) 행 보장
exports.ensureWorkerRow = async (name)=>{
  await pool.query(
    `INSERT IGNORE INTO ${qi(TBL)} (${qi("name")}) VALUES (?)`,
    [name]
  );
};

// 3) 특정 작업자 전체 열 값 (한 행)
exports.getRow = async (name)=>{
  const [rows] = await pool.query(`SELECT * FROM ${qi(TBL)} WHERE ${qi("name")}=? LIMIT 1`, [name]);
  // 없으면 기본 0들 채운 객체 반환 (프론트에서 보기 위해)
  if (!rows.length) return { name };
  return rows[0];
};

// 4) 단일 셀 조회
exports.getCell = async (name, col)=>{
  const [rows] = await pool.query(
    `SELECT COALESCE(${qi(col)},0) AS cur FROM ${qi(TBL)} WHERE ${qi("name")}= ? LIMIT 1`, [name]
  );
  return rows[0]?.cur ?? 0;
};

// 5) 단일 셀 저장
exports.setCell = async (name, col, value)=>{
  const sql = `
    INSERT INTO ${qi(TBL)} (${qi("name")}, ${qi(col)})
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE ${qi(col)} = VALUES(${qi(col)}), ${qi("updated_at")} = CURRENT_TIMESTAMP
  `;
  const [r] = await pool.query(sql, [name, value]);
  return r.affectedRows;
};

// 6) 감사 로그 (없으면 무시)
exports.insertAudit = async ({ actor, worker, item, col, prev, next, mode, reason, ip })=>{
  // 권장 스키마:
  // CREATE TABLE INTEGER_SETUP_EDU_AUDIT(
  //   id BIGINT PRIMARY KEY AUTO_INCREMENT,
  //   at DATETIME NOT NULL,
  //   actor VARCHAR(100),
  //   worker VARCHAR(100),
  //   item_display VARCHAR(200),
  //   item_col VARCHAR(200),
  //   prev_val INT,
  //   next_val INT,
  //   mode VARCHAR(10),
  //   reason VARCHAR(255),
  //   ip VARCHAR(64)
  // ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  const sql = `
    INSERT INTO INTEGER_SETUP_EDU_AUDIT
      (at, actor, worker, item_display, item_col, prev_val, next_val, mode, reason, ip)
    VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try{
    await pool.query(sql, [actor, worker, item, col, prev, next, mode, reason||null, ip||null]);
  }catch(_e){ /* 없으면 조용히 무시 */ }
};
