// src/pci/hdw/pciController.js
const { BASELINE, normalizeItem, toSelfCol, workerAliases } = require("./pciConfig");
// 👇 이 부분이 '../precia/pciUtils' 같은 잘못된 경로가 아니어야 합니다.
const { parseTaskMen, round1, clamp } = require("./pciUtils");
const {
  fetchWorkLogsForHdw,
  fetchSelfCheckRow,
  fetchAdditionalCountsPivot,
  fetchSelfCheckAll,
  fetchSelfCheckNames,
} = require("./pciDao");

/** 1명 계산 */
exports.getWorkerPci = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name || req.query.worker;
    if (!rawName) return res.status(400).json({ message: "name(작업자) 파라미터 필요" });

    const worker = workerAliases(rawName);
    const { start_date: startDate, end_date: endDate } = req.query;

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchWorkLogsForHdw({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 로그 카운트 집계
    const counts = {}; // { item: { main, support } }
    for (const r of logs) {
      const item = normalizeItem(r.transfer_item);
      if (!BASELINE[item]) continue;

      for (const p of parseTaskMen(r.task_man)) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
        counts[item] = counts[item] || { main: 0, support: 0 };
        counts[item][role] += p.weight; // main=1.0, support=0.1
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

    // 항목별 PCI (0% 포함)
    const rows = [];
    let usedItems = 0, accWork = 0, accTotal = 0;

    for (const item of Object.keys(BASELINE)) {
      const base = BASELINE[item];
      const c = counts[item] || { main: 0, support: 0 };
      const add = addCounts[item] || 0;
      const totalCnt = c.main + c.support + add;

      const ratio = base > 0 ? clamp(totalCnt / base, 0, 1) : 0;
      const workPct = round1(ratio * 80);

      // 자가(20)
      let selfPct = 0;
      if (selfRow) {
        const col = toSelfCol(item);
        if (col && col in selfRow) {
          const val = Number(selfRow[col] ?? 0);
          if (Number.isFinite(val) && val > 0) selfPct = 20;
        }
      }

      const pciPct = clamp(workPct + selfPct, 0, 100);

      usedItems += 1;                  // ✅ 0% 항목도 평균에 포함
      accWork  += workPct;
      accTotal += pciPct;

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

    // 수행횟수 많은 순 → 항목명
    rows.sort((a,b)=> b.total_count - a.total_count || a.item.localeCompare(b.item, "ko"));

    const summary = {
      worker,
      period: { startDate: startDate || null, endDate: endDate || null },
      items_considered: usedItems,
      avg_work_pct: usedItems ? round1(accWork / usedItems) : 0,
      avg_pci_pct: usedItems ? round1(accTotal / usedItems) : 0,
    };

    return res.json({ summary, rows });
  } catch (err) {
    console.error("[PCI HDW] getWorkerPci error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** (옵션) 전체 작업자 요약 */
exports.getAllSummary = async (req, res) => {
  try {
    const { start_date: startDate, end_date: endDate, limit = 200 } = req.query;

    const [logs, addPivot] = await Promise.all([
      fetchWorkLogsForHdw({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
    ]);

    const set = new Set();
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const item of Object.keys(addPivot)) for (const col of Object.keys(addPivot[item])) set.add(workerAliases(col));

    const workers = [...set].slice(0, Number(limit));

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
    console.error("[PCI HDW] getAllSummary error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** 작업자 이름 리스트 */
exports.getWorkerNames = async (_req, res) => {
  try {
    const [logs, addPivot, selfNames] = await Promise.all([
      fetchWorkLogsForHdw({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckNames(),
    ]);

    const set = new Set(selfNames.map(workerAliases));
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const item of Object.keys(addPivot)) for (const col of Object.keys(addPivot[item])) set.add(workerAliases(col));

    const workers = [...set].sort((a, b) => a.localeCompare(b, "ko"));
    res.json({ workers });
  } catch (e) {
    console.error("[PCI HDW] getWorkerNames error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 매트릭스 (한 방에) */
exports.getMatrix = async (_req, res) => {
  try {
    const [logs, addPivot, selfRows] = await Promise.all([
      fetchWorkLogsForHdw({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckAll(),
    ]);

    // self 체크 맵: worker -> row
    const selfMap = {};
    for (const row of selfRows) selfMap[workerAliases(row.name)] = row;

    // 로그 카운트
    const counts = {}; // counts[worker][item] = { main, support }
    for (const r of logs) {
      const item = normalizeItem(r.transfer_item);
      if (!BASELINE[item]) continue;
      for (const p of parseTaskMen(r.task_man)) {
        const w = workerAliases(p.name);
        counts[w] = counts[w] || {};
        counts[w][item] = counts[w][item] || { main: 0, support: 0 };
        const role = p.weight >= 1 ? "main" : "support";
        counts[w][item][role] += p.weight;
      }
    }

    // 교육/가산
    const addCounts = {}; // addCounts[worker][item]
    for (const itemRaw of Object.keys(addPivot)) {
      const norm = normalizeItem(itemRaw);
      if (!BASELINE[norm]) continue;
      for (const col of Object.keys(addPivot[itemRaw])) {
        const w = workerAliases(col);
        addCounts[w] = addCounts[w] || {};
        addCounts[w][norm] = (addCounts[w][norm] || 0) + Number(addPivot[itemRaw][col] || 0);
      }
    }

    // 축
    const workerSet = new Set([...Object.keys(counts), ...Object.keys(addCounts), ...Object.keys(selfMap)]);
    const itemList = Object.keys(BASELINE).slice().sort((a, b) => a.localeCompare(b, "ko"));
    const workers = [...workerSet].sort((a, b) => a.localeCompare(b, "ko"));

    // 계산
    const data = {};
    const workerAvg = {}; // worker -> {s, n}

    for (const item of itemList) {
      data[item] = {};
      const base = BASELINE[item];

      for (const w of workers) {
        const c = (counts[w] && counts[w][item]) || { main: 0, support: 0 };
        const add = (addCounts[w] && addCounts[w][item]) || 0;
        const total = c.main + c.support + add;

        const workPct = base > 0 ? Math.round((Math.min(1, total / base) * 80) * 10) / 10 : 0;

        let selfPct = 0;
        const row = selfMap[w];
        if (row) {
          const col = toSelfCol(item);
          if (col && col in row) {
            const v = Number(row[col] ?? 0);
            if (Number.isFinite(v) && v > 0) selfPct = 20;
          }
        }

        const pci = Math.max(0, Math.min(100, workPct + selfPct));
        data[item][w] = {
          pci, work: workPct, self: selfPct,
          total_count: Math.round(total * 10) / 10,
          main_count: Math.round((c.main || 0) * 10) / 10,
          support_count: Math.round((c.support || 0) * 10) / 10,
          add_count: add,
          baseline: base,
        };

        const acc = workerAvg[w] || { s: 0, n: 0 };
        acc.s += pci; acc.n += 1; // ✅ 0% 포함
        workerAvg[w] = acc;
      }
    }

    const worker_avg_pci = {};
    for (const w of workers) {
      const acc = workerAvg[w];
      worker_avg_pci[w] = acc ? Math.round((acc.s / acc.n) * 10) / 10 : 0;
    }

    res.json({ workers, items: itemList, data, worker_avg_pci });
  } catch (e) {
    console.error("[PCI HDW] getMatrix error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 항목 단위 상세 */
exports.getWorkerItemBreakdown = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name;
    const rawItem = req.params.item || req.query.item;
    if (!rawName || !rawItem) return res.status(400).json({ message: "name, item 파라미터 필요" });

    const worker = workerAliases(rawName);
    const itemNorm = normalizeItem(rawItem);
    if (!itemNorm || !BASELINE[itemNorm]) {
      return res.status(404).json({ message: `기준에 없는 항목: ${rawItem}` });
    }
    const baseline = BASELINE[itemNorm];

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchWorkLogsForHdw({}), // 전체
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 1) 로그(역할/가중치 포함)
    const logRows = [];
    let mainSum = 0, supportSum = 0;
    for (const r of logs) {
      if (normalizeItem(r.transfer_item) !== itemNorm) continue;
      for (const p of parseTaskMen(r.task_man)) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
        if (role === "main") mainSum += 1.0; else supportSum += 0.1;
        logRows.push({
          id: r.id,
          task_date: r.task_date,
          equipment_type: r.equipment_type,
          equipment_name: r.equipment_name,
          task_name: r.task_name,
          task_man: r.task_man,
          task_man_raw: r.task_man,
          task_description: r.task_description,
          role, weight: p.weight,
        });
      }
    }
    mainSum = Math.round(mainSum * 10) / 10;
    supportSum = Math.round(supportSum * 10) / 10;

    // 2) 교육/가산
    let addCount = 0;
    for (const key of Object.keys(addPivot)) {
      const norm = normalizeItem(key);
      if (norm !== itemNorm) continue;
      for (const col of Object.keys(addPivot[key] || {})) {
        if (workerAliases(col) === worker) addCount += Number(addPivot[key][col] || 0);
      }
    }

    // 3) 자가(20)
    const selfCol = toSelfCol(itemNorm);
    const selfVal = (selfCol && selfRow) ? Number(selfRow[selfCol] || 0) : 0;
    const selfPct = selfVal > 0 ? 20 : 0;

    // 4) 퍼센트
    const totalCount = Math.round((mainSum + supportSum + addCount) * 10) / 10;
    const workPct = baseline > 0 ? Math.round((Math.min(1, totalCount / baseline) * 80) * 10) / 10 : 0;
    const pciPct = clamp(workPct + selfPct, 0, 100);

    return res.json({
      worker,
      item: itemNorm,
      baseline,
      totals: {
        main_count: mainSum,
        support_count: supportSum,
        add_count: addCount,
        total_count: totalCount,
      },
      percentages: {
        work_pct: workPct,
        self_pct: selfPct,
        pci_pct: pciPct,
        formula: `PCI = min(총횟수/기준,1)*80 + (자가>0?20:0) = ${workPct} + ${selfPct}`,
      },
      self_check: {
        column: selfCol,
        value: selfVal,
        granted20: selfPct === 20,
      },
      logs: logRows.sort((a,b)=> String(a.task_date || "").localeCompare(String(b.task_date || ""))),
    });
  } catch (err) {
    console.error("[PCI HDW] getWorkerItemBreakdown error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};
