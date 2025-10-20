const dao = require("./specialistPreciaSetupDao");

// 표시명 ↔ DB컬럼
const DISPLAY2DB = {
  "INSTALLATION PREPARATION": "INSTALLATION_PREPERATION",
  "FAB IN": "FAB_IN",
  "DOCKING": "DOCKING",
  "CABLE HOOK UP": "CABLE_HOOK_UP",
  "POWER TURN ON": "POWER_TURN_ON",
  "UTILITY TURN ON": "UTILITY_TURN_ON",
  "GAS TURN ON": "GAS_TURN_ON",
  "TEACHING": "TEACHING",
  "PART INSTALLATION": "PART_INSTALLATION",
  "LEAK CHECK": "LEAK_CHECK",
  "TTTM": "TTTM",
  "CUSTOMER CERTIFICATION": "CUSTOMER_CERTIFICATION",
  "PROCESS CONFIRM": "PROCESS_CONFIRM"
};
const DB2DISPLAY = Object.fromEntries(Object.entries(DISPLAY2DB).map(([k,v])=>[v,k]));

function normalizeItem(displayOrDb){
  if (!displayOrDb) return "";
  const s = String(displayOrDb).trim().toUpperCase().replace(/_/g," ");
  if (DISPLAY2DB[s]) return s;                    // 이미 표시명
  if (DB2DISPLAY[s]) return DB2DISPLAY[s];        // DB 컬럼이름 입력되면 표시명으로
  // 유사 매칭
  const found = Object.keys(DISPLAY2DB).find(k => k === s);
  return found || s;
}

// 작업자 목록
exports.getWorkers = async (_req, res) => {
  try{
    const workers = await dao.listWorkers();
    res.json({ workers });
  }catch(e){
    console.error("[PreciaSetup] getWorkers error:", e);
    res.status(500).json({ message:"internal_error" });
  }
};

// 특정 작업자 전체 항목
exports.getEducationByWorker = async (req, res) => {
  try{
    const worker = String(req.query.worker||"").trim();
    if (!worker) return res.status(400).json({ message:"worker_required" });
    await dao.ensureWorkerRow(worker);
    const row = await dao.getRow(worker);
    // { col: value } → [{ item, add_count }]
    const rows = Object.entries(row)
      .filter(([col]) => col !== "name" && col !== "updated_at")
      .map(([col, val]) => ({ item: DB2DISPLAY[col] || col, add_count: Number(val||0) }));
    // 표시 순서 고정
    const ORDER = Object.keys(DISPLAY2DB);
    rows.sort((a,b)=> ORDER.indexOf(a.item) - ORDER.indexOf(b.item));
    res.json({ rows });
  }catch(e){
    console.error("[PreciaSetup] getEducationByWorker error:", e);
    res.status(500).json({ message:"internal_error" });
  }
};

// 단일 셀 수정
// body: { worker, item, mode: 'set'|'inc'|'dec', value:number, reason?:string }
exports.patchCell = async (req, res) => {
  try{
    const actor = req.user?.nickname || req.user?.name || req.user?.userID || "unknown";
    let { worker, item, mode, value, reason } = req.body||{};
    worker = String(worker||"").trim();
    item   = normalizeItem(String(item||"").trim());     // 표시명
    mode   = String(mode||"set").toLowerCase();
    value  = Number(value||0);
    reason = String(reason||"").trim();

    if (!worker || !item) return res.status(400).json({ message:"worker_item_required" });
    if (!["set","inc","dec"].includes(mode)) return res.status(400).json({ message:"invalid_mode" });

    const col = DISPLAY2DB[item];
    if (!col) return res.status(400).json({ message:"invalid_item" });

    await dao.ensureWorkerRow(worker);
    const prev = await dao.getCell(worker, col);

    let next;
    if (mode==="set") next = Math.max(0, Math.floor(value));
    else if (mode==="inc") next = Math.max(0, (prev||0) + Math.floor(value||0));
    else                   next = Math.max(0, (prev||0) - Math.floor(value||0));

    await dao.setCell(worker, col, next);
    await dao.insertAudit({
      actor, worker, item, col, prev: prev||0, next, mode, reason,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ""
    });

    res.json({ item, worker, prev: prev||0, next, mode, at: new Date().toISOString() });
  }catch(e){
    console.error("[PreciaSetup] patchCell error:", e);
    res.status(500).json({ message:"internal_error", detail:String(e?.message||e) });
  }
};

// (선택) 행 보장
exports.ensureWorkerRow = async (req, res)=>{
  try{
    const worker = String(req.body?.worker||"").trim();
    if (!worker) return res.status(400).json({ message:"worker_required" });
    await dao.ensureWorkerRow(worker);
    res.json({ ok:true });
  }catch(e){
    console.error("[PreciaSetup] ensureWorkerRow error:", e);
    res.status(500).json({ message:"internal_error" });
  }
};
