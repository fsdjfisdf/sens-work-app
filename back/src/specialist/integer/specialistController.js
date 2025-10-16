const dao = require("./specialistDao");
const { normalizeItem } = require("../../pci/integer/pciConfig");

exports.getWorkers = async (_req, res) => {
  try{
    const workers = await dao.listWorkersFromCountTable();
    res.json({ workers });
  }catch(e){
    console.error("[Specialist] getWorkers error:", e);
    res.status(500).json({ message:"internal_error" });
  }
};

exports.getEducationByWorker = async (req, res) => {
  try{
    const worker = String(req.query.worker||"").trim();
    if (!worker) return res.status(400).json({ message:"worker_required" });

    // 존재하지 않는 경우에도 0으로 구성된 full 리스트 반환
    const rows = await dao.getAllItemsWithCountsForWorker(worker);
    res.json({ rows });
  }catch(e){
    console.error("[Specialist] getEducationByWorker error:", e);
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
    item   = normalizeItem(String(item||"").trim());
    mode   = String(mode||"set").toLowerCase();
    value  = Number(value||0);
    reason = String(reason||"").trim();

    if (!worker || !item) return res.status(400).json({ message:"worker_item_required" });
    if (!["set","inc","dec"].includes(mode)) return res.status(400).json({ message:"invalid_mode" });

    // 테이블/컬럼/행 보장
    await dao.ensureItemRow(item);
    await dao.ensureWorkerColumn(worker);

    // 현재값
    const prev = await dao.getCell(item, worker);

    // 계산
    let next;
    if (mode==="set") next = Math.max(0, Math.floor(value));
    else if (mode==="inc") next = Math.max(0, (prev||0) + Math.floor(value||0));
    else                   next = Math.max(0, (prev||0) - Math.floor(value||0));

    // 저장 + 감사로그
    await dao.setCell(item, worker, next);
    await dao.insertAudit({
      actor, worker, item, prev: prev||0, next, mode,
      reason, ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ""
    });

    res.json({ item, worker, prev: prev||0, next, mode, at: new Date().toISOString() });
  }catch(e){
    console.error("[Specialist] patchCell error:", e);
    res.status(500).json({ message:"internal_error", detail:String(e?.message||e) });
  }
};

// (선택) 수동 보장 API
exports.ensureWorkerColumn = async (req, res)=>{
  try{
    const worker = String(req.body?.worker||"").trim();
    if (!worker) return res.status(400).json({ message:"worker_required" });
    await dao.ensureWorkerColumn(worker);
    res.json({ ok:true });
  }catch(e){
    console.error("[Specialist] ensureWorkerColumn error:", e);
    res.status(500).json({ message:"internal_error" });
  }
};
exports.ensureItemRow = async (req, res)=>{
  try{
    const item = normalizeItem(String(req.body?.item||"").trim());
    if (!item) return res.status(400).json({ message:"item_required" });
    await dao.ensureItemRow(item);
    res.json({ ok:true });
  }catch(e){
    console.error("[Specialist] ensureItemRow error:", e);
    res.status(500).json({ message:"internal_error" });
  }
};
