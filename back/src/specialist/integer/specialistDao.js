const { pool } = require("../../../config/database");
const { BASELINE } = require("../../pci/integer/pciConfig");

// 고유 식별자(컬럼/테이블/필드)용 간단 필터: 백틱 안전 래핑
// - 영문/숫자/한글/공백/특수 일부만 허용 → 나머지는 제거
// - 최종적으로 백틱으로 감싸 사용
 function safeIdent(id){
   const cleaned = String(id||"")
     .replace(/[`]/g, "")                                       // 내부 백틱 제거
     .replace(/[^\w\u3131-\u318E\uAC00-\uD7A3 .()_-]/g, "")     // 허용 문자만
     .trim();
   if (!cleaned) throw new Error("invalid_identifier");
   return `\`${cleaned}\``;                                     // 백틱 1쌍으로만 감싸기
 }
const TBL = "`INTEGER_MAINT_COUNT`";
const COL_ITEM = "```작업_항목```".replace(/```/g,"`");

// === 컬럼/행 존재 보장 ===
exports.listWorkersFromCountTable = async () => {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'INTEGER_MAINT_COUNT' ORDER BY ORDINAL_POSITION`
  );
  return cols
    .map(c=>c.COLUMN_NAME)
    .filter(n => n !== "작업_항목"); // 나머지 전부 작업자 컬럼으로 간주
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
  await pool.query(`UPDATE ${TBL} SET ${col} = ? WHERE ${COL_ITEM} = ?`, [Math.max(0, Math.floor(value||0)), item]);
};

// === 조회 ===
exports.getAllItemsWithCountsForWorker = async (worker) => {
  await exports.ensureWorkerColumn(worker);
  const col = safeIdent(worker);
  const [rows] = await pool.query(`SELECT ${COL_ITEM} AS item, ${col} AS add_count FROM ${TBL}`);
  // 기준 목록에 있는 항목만 반환(없으면 0)
  const map = new Map(rows.map(r=>[String(r.item), Number(r.add_count||0)]));
  const out = [];
  for (const item of Object.keys(BASELINE)){
    out.push({ item, add_count: map.get(item) ?? 0 });
  }
  // 알파벳/한글 정렬
  out.sort((a,b)=> a.item.localeCompare(b.item,'ko'));
  return out;
};

// === 감사 로그 ===
exports.insertAudit = async ({ actor, worker, item, prev, next, mode, reason, ip }) => {
  const sql = `
    INSERT INTO INTEGER_MAINT_COUNT_AUDIT
    (acted_at, actor, worker, item, prev_value, next_value, mode, reason, ip)
    VALUES (NOW(), ?,?,?,?,?,?,?,?)
  `;
  await pool.query(sql, [actor, worker, item, prev, next, mode, reason, ip]);
};

// 필요 시 (main)/(support) 제거, 공백 트림 등
function normalizeWorkerName(name = "") {
  return String(name)
    .replace(/\(main\)|\(support\)/gi, "")
    .replace(/\s+/g, "")
    .trim();
}

// INTEGER_MAINT_COUNT 테이블에 실제 존재하는 컬럼만 나열(화이트리스트)
const ALLOWED_COLS = [
  "이지웅","김동현","송왕근","권정혁","김대훈","손상일","장진호","안재영",
  "김건희","심재민","이승우","장찬우","강승현","배승혁","정옥석","정서후",
  "민동찬","김지훈","정현우","김시우","최민수"
];

// ✅ 교육 건수(추가 카운트) 조회
exports.getAllItemsWithCountsForWorker = async (rawWorker) => {
  const worker = normalizeWorkerName(rawWorker);

  if (!ALLOWED_COLS.includes(worker)) {
    const err = new Error(`Unknown worker column: ${worker}`);
    err.code = "INVALID_WORKER_COLUMN";
    throw err;
  }

  // 템플릿 문자열 안의 백틱은 \` 로 이스케이프해야 합니다!!
  const sql = `
    SELECT \`작업_항목\` AS item, COALESCE(\`${worker}\`, 0) AS add_count
    FROM \`INTEGER_MAINT_COUNT\`
    ORDER BY \`작업_항목\`
  `;

  // 디버그 로그 (선택)
  // console.log("[SQL]", sql);

  const [rows] = await pool.query(sql);
  return rows;
};