// src/pci/integer/pciController.js
const { BASELINE, normalizeItem, expandItems, toSelfCol, workerAliases } = require("./pciConfig");
const { parseTaskMen, round1, clamp } = require("./pciUtils");
const {
  fetchWorkLogsForInteger,
  fetchSelfCheckRow,
  fetchAdditionalCountsPivot,
  fetchSelfCheckAll,
  fetchSelfCheckNames
} = require("./pciDao");

/** 1명 계산 */
exports.getWorkerPci = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name || req.query.worker;
    if (!rawName) return res.status(400).json({ message: "name(작업자) 파라미터 필요" });

    const worker = workerAliases(rawName);
    const { start_date: startDate, end_date: endDate } = req.query;

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchWorkLogsForInteger({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 로그 카운트 집계
    const counts = {}; // { item: { main: number, support: number } }
    for (const r of logs) {
      const items = expandItems(r.transfer_item);
      if (!items.length) continue;

      for (const p of parseTaskMen(r.task_man)) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
          for (const item of items) {
              if (!BASELINE[item]) continue;
              counts[item] = counts[item] || { main: 0, support: 0 };
              counts[item][role] += p.weight;
            }
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

    // 항목별 PCI 계산 (✅ 0% 항목도 모두 포함)
    const rows = [];
    let usedItems = 0, accWork = 0, accTotal = 0;

    for (const item of Object.keys(BASELINE)) {
      const base = BASELINE[item];
      const c = counts[item] || { main: 0, support: 0 };
      const add = addCounts[item] || 0;
      const totalCnt = (c.main + c.support) + add; // support 가중치 적용됨

      const ratio = base > 0 ? clamp(totalCnt / base, 0, 1) : 0;
      const workPct = round1(ratio * 80);

      // 자가체크 20%
      let selfPct = 0;
      if (selfRow) {
        const col = toSelfCol(item);
        if (col && col in selfRow) {
          const val = Number(selfRow[col] ?? 0);
          if (Number.isFinite(val) && val > 0) selfPct = 20;
        }
      }

      const pciPct = clamp(workPct + selfPct, 0, 100);

      usedItems += 1;          // ✅ 항상 카운트 (0% 포함)
      accWork  += workPct;     // ✅ 전부 누적
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

    // 보기좋게: 총횟수 ↓, 동률이면 항목명 A→Z
    rows.sort((a, b) => (b.total_count - a.total_count) || a.item.localeCompare(b.item, 'ko'));

    const summary = {
      worker,
      period: { startDate: startDate || null, endDate: endDate || null },
      items_considered: usedItems,
      avg_work_pct: usedItems ? round1(accWork / usedItems) : 0,
      avg_pci_pct: usedItems ? round1(accTotal / usedItems) : 0,
    };

    return res.json({ summary, rows });
  } catch (err) {
    console.error("[PCI INTEGER] getWorkerPci error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** 전체 작업자 요약(옵션) */
exports.getAllSummary = async (req, res) => {
  try {
    const { start_date: startDate, end_date: endDate, limit = 200 } = req.query;

    const [logs, addPivot] = await Promise.all([
      fetchWorkLogsForInteger({ startDate, endDate }),
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
    console.error("[PCI INTEGER] getAllSummary error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

// 작업자 이름 리스트
exports.getWorkerNames = async (_req, res) => {
  try {
    const [logs, addPivot, selfNames] = await Promise.all([
      fetchWorkLogsForInteger({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckNames(),
    ]);

    const set = new Set(selfNames.map(workerAliases));
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const item of Object.keys(addPivot)) for (const col of Object.keys(addPivot[item])) set.add(workerAliases(col));

    const workers = [...set].sort((a,b)=>a.localeCompare(b,'ko'));
    res.json({ workers });
  } catch (e) {
    console.error("[PCI INTEGER] getWorkerNames error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

// 매트릭스
exports.getMatrix = async (_req, res) => {
  try {
    const [logs, addPivot, selfRows] = await Promise.all([
      fetchWorkLogsForInteger({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckAll(),
    ]);

    // self 체크 맵
    const selfMap = {};
    for (const row of selfRows) {
      const w = workerAliases(row.name);
      selfMap[w] = row;
    }

    // 로그 카운트
    const counts = {};
    for (const r of logs) {
      const items = expandItems(r.transfer_item);
if (!items.length) continue;

for (const p of parseTaskMen(r.task_man)) {
  const w = workerAliases(p.name);
  counts[w] = counts[w] || {};
  const role = p.weight >= 1 ? "main" : "support";

  for (const item of items) {
    if (!BASELINE[item]) continue;
    counts[w][item] = counts[w][item] || { main: 0, support: 0 };
    counts[w][item][role] += p.weight;
  }

      }
    }

    // 교육/가산
    const addCounts = {};
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
    const workerSet = new Set([
      ...Object.keys(counts),
      ...Object.keys(addCounts),
      ...Object.keys(selfMap),
    ]);
    const itemList = Object.keys(BASELINE).slice().sort((a,b)=>a.localeCompare(b,'ko'));
    const workers = [...workerSet].sort((a,b)=>a.localeCompare(b,'ko'));

    // 계산
    const data = {};
    const workerAvg = {};

    for (const item of itemList) {
      data[item] = {};
      for (const w of workers) {
        const c = (counts[w] && counts[w][item]) || { main:0, support:0 };
        const add = (addCounts[w] && addCounts[w][item]) || 0;
        const total = c.main + c.support + add;

        const base = BASELINE[item];
        const workPct = base > 0 ? Math.round((Math.min(1, total / base) * 80) * 10) / 10 : 0;

        // self 20%
        let selfPct = 0;
        const row = selfMap[w];
        if (row) {
          const col = toSelfCol(item);
          if (col && col in row) {
            const val = Number(row[col] ?? 0);
            if (Number.isFinite(val) && val > 0) selfPct = 20;
          }
        }

        const pci = Math.max(0, Math.min(100, workPct + selfPct));
        data[item][w] = {
          pci, work: workPct, self: selfPct,
          total_count: Math.round(total * 10) / 10,
          main_count: Math.round((c.main||0) * 10)/10,
          support_count: Math.round((c.support||0) * 10)/10,
          add_count: add,
          baseline: base,
        };

        const acc = workerAvg[w] || { s:0, n:0 };
        acc.s += pci;     // ✅ 0%도 합산
        acc.n += 1;       // ✅ 0%도 분모 포함
        workerAvg[w] = acc;
      }
    }

    const worker_avg_pci = {};
    for (const w of workers) {
      const acc = workerAvg[w];
      worker_avg_pci[w] = acc ? Math.round((acc.s/acc.n)*10)/10 : 0;
    }

    res.json({ workers, items: itemList, data, worker_avg_pci });
  } catch (e) {
    console.error("[PCI INTEGER] getMatrix error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

// 한 사람 + 한 항목 상세 산출 근거
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
      fetchWorkLogsForInteger({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 참여 로그
    const logRows = [];
    let mainSum = 0, supportSum = 0;
    for (const r of logs) {
      const items = expandItems(r.transfer_item);
if (!items.includes(itemNorm)) continue;
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
          role,
          weight: p.weight,
        });
      }
    }
    mainSum = Math.round(mainSum * 10) / 10;
    supportSum = Math.round(supportSum * 10) / 10;

    // 교육/가산
    let addCount = 0;
    for (const key of Object.keys(addPivot)) {
      const norm = normalizeItem(key);
      if (norm !== itemNorm) continue;
      for (const col of Object.keys(addPivot[key] || {})) {
        if (workerAliases(col) === worker) {
          addCount += Number(addPivot[key][col] || 0);
        }
      }
    }

    // 자가(20)
    const selfCol = toSelfCol(itemNorm);
    const selfVal = selfCol ? Number(selfRow?.[selfCol] || 0) : 0;
    const selfPct = selfVal > 0 ? 20 : 0;

    // 퍼센트 산출
    const totalCount = Math.round((mainSum + supportSum + addCount) * 10) / 10;
    const workPct = baseline > 0 ? Math.round((Math.min(1, totalCount / baseline) * 80) * 10) / 10 : 0;
    const pciPct  = clamp(workPct + selfPct, 0, 100);

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
      logs: logRows.sort((a,b)=> String(a.task_date||"").localeCompare(String(b.task_date||"")) ),
    });
  } catch (err) {
    console.error("[PCI INTEGER] getWorkerItemBreakdown error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};
