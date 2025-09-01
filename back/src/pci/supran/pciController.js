// src/pci/supran/pciController.js
const { BASELINE, normalizeItem, toSelfCol, workerAliases } = require("./pciConfig");
const { parseTaskMen, round1, clamp } = require("./pciUtils");
const { fetchWorkLogsForSupraN, fetchSelfCheckRow, fetchAdditionalCountsPivot } = require("./pciDao");

/** 1명 계산 */
exports.getWorkerPci = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name || req.query.worker;
    if (!rawName) return res.status(400).json({ message: "name(작업자) 파라미터 필요" });

    const worker = workerAliases(rawName);
    const { start_date: startDate, end_date: endDate } = req.query;

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchWorkLogsForSupraN({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 로그 카운트 집계
    const counts = {}; // { item: { main: number, support: number } }
    for (const r of logs) {
      const item = normalizeItem(r.transfer_item);
      if (!BASELINE[item]) continue;

      for (const p of parseTaskMen(r.task_man)) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
        counts[item] = counts[item] || { main: 0, support: 0 };
        counts[item][role] += p.weight; // main=1.0, support=0.2
      }
    }

    // 교육/가산 합산
    const addCounts = {}; // { item: number }
    for (const itemRaw of Object.keys(addPivot)) {
      const norm = normalizeItem(itemRaw);
      if (!BASELINE[norm]) continue;
      const dic = addPivot[itemRaw];
      let sum = 0;
      for (const col of Object.keys(dic)) {
        if (workerAliases(col) === worker) sum += Number(dic[col] || 0);
      }
      if (sum > 0) addCounts[norm] = (addCounts[norm] || 0) + sum;
    }

    // 항목별 PCI 계산
    const rows = [];
    let usedItems = 0, accWork = 0, accTotal = 0;

    for (const item of Object.keys(BASELINE)) {
      const base = BASELINE[item];
      const c = counts[item] || { main: 0, support: 0 };
      const add = addCounts[item] || 0;
      const totalCnt = (c.main + c.support) + add; // support 가중치 적용됨

      const ratio = base > 0 ? clamp(totalCnt / base, 0, 1) : 0;
      const workPct = round1(ratio * 80);

      // 자가체크 20%: 해당 컬럼이 1 이상이면 20, 아니면 0
      let selfPct = 0;
      if (selfRow) {
        const col = toSelfCol(item); // 예: "LP_ESCORT"
        const val = Number(selfRow[col] ?? 0);
        if (Number.isFinite(val) && val > 0) selfPct = 20;
      }

      const pciPct = clamp(workPct + selfPct, 0, 100);

      const participated = (totalCnt > 0) || (selfPct > 0);
      if (participated) {
        usedItems += 1;
        accWork += workPct;
        accTotal += pciPct;
      }

      rows.push({
        item,
        baseline: base,
        main_count: round1(c.main),
        support_count: round1(c.support),
        add_count: add,
        total_count: round1(totalCnt),
        work_pct: workPct,
        self_pct: selfPct,
        pci_pct: pciPct,
      });
    }

    rows.sort((a, b) => (b.total_count - a.total_count) || a.item.localeCompare(b.item));

    const summary = {
      worker,
      period: { startDate: startDate || null, endDate: endDate || null },
      items_considered: usedItems,
      avg_work_pct: usedItems ? round1(accWork / usedItems) : 0,
      avg_pci_pct: usedItems ? round1(accTotal / usedItems) : 0,
    };

    return res.json({ summary, rows });
  } catch (err) {
    console.error("[PCI SUPRA N] getWorkerPci error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** (옵션) 전체 작업자 요약 */
exports.getAllSummary = async (req, res) => {
  try {
    const { start_date: startDate, end_date: endDate, limit = 200 } = req.query;

    // 후보군 추출을 위해 로그/가산만 스캔
    const [logs, addPivot] = await Promise.all([
      fetchWorkLogsForSupraN({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
    ]);

    const set = new Set();
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const item of Object.keys(addPivot)) for (const col of Object.keys(addPivot[item])) set.add(workerAliases(col));

    const workers = [...set].slice(0, Number(limit));

    // 각자 상세 API를 내부 재사용
    const list = [];
    for (const w of workers) {
      const fakeReq = { query: { start_date: startDate, end_date: endDate }, params: { name: w } };
      const result = await new Promise((resolve) => {
        exports.getWorkerPci(fakeReq, { json: resolve });
      });
      list.push(result.summary);
    }

    return res.json({ count: list.length, workers: list });
  } catch (err) {
    console.error("[PCI SUPRA N] getAllSummary error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};
