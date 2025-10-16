// SUPRA N Specialist Controller
const dao = require("./specialistSupranDao");

/** 공통: 관리자 검증은 라우터 미들웨어에서 처리 */
function round2(x){ return Math.round(Number(x||0) * 100) / 100; }

exports.getWorkers = async (_req, res) => {
  try{
    const cols = await dao.fetchWorkerColumns();
    res.json({ workers: cols });
  }catch(e){
    console.error("[Specialist SUPRAN] getWorkers error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

exports.getEducationByWorker = async (req, res) => {
  try{
    const worker = String(req.query.worker || "").trim();
    if (!worker) return res.status(400).json({ message: "worker 파라미터 필요" });

    const rows = await dao.getAllItemsWithCountsForWorker(worker);
    res.json({ rows });
  }catch(e){
    console.error("[Specialist SUPRAN] getEducationByWorker error:", e);
    // 동적 컬럼 오류(Unknown column) 등
    res.status(500).json({ message: "internal_error", detail: String(e?.sqlMessage || e?.message || e) });
  }
};

exports.setCell = async (req, res) => {
  try{
    const { worker, item, mode = "set", value, reason } = req.body || {};
    if (!worker || !item) return res.status(400).json({ message: "worker, item 필수" });

    // 현재 값
    const prev = round2(await dao.getCurrentValue({ worker, item }));

    let next;
    if (mode === "inc") next = Math.max(0, prev + Number(value || 1));
    else if (mode === "dec") next = Math.max(0, prev - Number(value || 1));
    else next = Math.max(0, Number(value || 0));

    next = round2(next);

    await dao.setCellValue({ worker, item, value: next });
    await dao.writeAudit({
      worker, item, prev, next, reason: reason || "specialist_supran", editor: req.user?.nickname || null
    });

    res.json({ ok: true, worker, item, prev, next, at: new Date().toISOString() });
  }catch(e){
    console.error("[Specialist SUPRAN] setCell error:", e);
    res.status(500).json({ message: "internal_error", detail: String(e?.sqlMessage || e?.message || e) });
  }
};
