const dao = require("./specialistGenevaDao"); // ← 파일명/경로 맞춤
const { normalizeItem } = require("../../pci/geneva/pciConfig");

/** 작업자 목록 (열 이름들) */
exports.getWorkers = async (_req, res) => {
  try {
    const workers = await dao.listWorkersFromCountTable();
    res.json({ workers });
  } catch (e) {
    console.error("[Specialist] getWorkers error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 특정 작업자 전체 항목 값 조회 */
exports.getEducationByWorker = async (req, res) => {
  try {
    const worker = String(req.query.worker || "").trim();
    if (!worker) return res.status(400).json({ message: "worker_required" });

    // 열/행 보장
    await dao.ensureWorkerColumn(worker);
    const rows = await dao.getAllItemsWithCountsForWorker(worker);
    res.json({ rows });
  } catch (e) {
    console.error("[Specialist] getEducationByWorker error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/**
 * 단일 셀 수정
 * body: { worker, item, mode: 'set'|'inc'|'dec', value:number, reason?:string }
 */
exports.patchCell = async (req, res) => {
  try {
    const actor =
      req.user?.nickname || req.user?.name || req.user?.userID || "unknown";

    let { worker, item, mode, value, reason } = req.body || {};
    worker = String(worker || "").trim();
    item = normalizeItem(String(item || "").trim());
    mode = String(mode || "set").toLowerCase();
    value = Number(value || 0);
    reason = String(reason || "").trim();

    if (!worker || !item)
      return res.status(400).json({ message: "worker_item_required" });
    if (!["set", "inc", "dec"].includes(mode))
      return res.status(400).json({ message: "invalid_mode" });

    await dao.ensureItemRow(item);
    await dao.ensureWorkerColumn(worker);

    const prev = await dao.getCell({ item, worker });

    let next;
    if (mode === "set") next = Math.max(0, Math.floor(value));
    else if (mode === "inc") next = Math.max(0, (prev || 0) + Math.floor(value || 0));
    else next = Math.max(0, (prev || 0) - Math.floor(value || 0));

    await dao.setCell({ item, worker, value: next });
    await dao.insertAudit({
      actor,
      worker,
      item,
      prev: prev || 0,
      next,
      mode,
      reason,
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
    });

    res.json({
      ok: true,
      item,
      worker,
      prev: prev || 0,
      next,
      mode,
      at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[Specialist] patchCell error:", e);
    res.status(500).json({ message: "internal_error", detail: String(e?.message || e) });
  }
};

/** (선택) 열 보장 API */
exports.ensureWorkerColumn = async (req, res) => {
  try {
    const worker = String(req.body?.worker || "").trim();
    if (!worker) return res.status(400).json({ message: "worker_required" });
    await dao.ensureWorkerColumn(worker);
    res.json({ ok: true });
  } catch (e) {
    console.error("[Specialist] ensureWorkerColumn error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** (선택) 행 보장 API */
exports.ensureItemRow = async (req, res) => {
  try {
    const item = normalizeItem(String(req.body?.item || "").trim());
    if (!item) return res.status(400).json({ message: "item_required" });
    await dao.ensureItemRow(item);
    res.json({ ok: true });
  } catch (e) {
    console.error("[Specialist] ensureItemRow error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};
