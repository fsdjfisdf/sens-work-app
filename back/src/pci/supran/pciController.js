// src/pci/supran/pciController.js
const { BASELINE, normalizeItem, toSelfCol, workerAliases } = require("./pciConfig");
const { parseTaskMen, round1, clamp } = require("./pciUtils");
const { fetchWorkLogsForSupraN, fetchSelfCheckRow, fetchAdditionalCountsPivot } = require("./pciDao");
const { fetchSelfCheckAll, fetchSelfCheckNames } = require("./pciDao");

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

// (A) 초경량: 작업자 이름 리스트만 반환
exports.getWorkerNames = async (req, res) => {
  try {
    const [logs, addPivot, selfNames] = await Promise.all([
      fetchWorkLogsForSupraN({}),              // 전체 기간
      fetchAdditionalCountsPivot(),
      fetchSelfCheckNames(),
    ]);

    const set = new Set(selfNames.map(workerAliases));

    // work_log에서 추출
    for (const r of logs) {
      for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    }
    // 교육/가산 테이블에서 추출
    for (const item of Object.keys(addPivot)) {
      for (const col of Object.keys(addPivot[item])) set.add(workerAliases(col));
    }

    const workers = [...set].sort((a,b)=>a.localeCompare(b,'ko'));
    res.json({ workers });
  } catch (e) {
    console.error("[PCI SUPRA N] getWorkerNames error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

// (B) 한 방에 매트릭스 계산
exports.getMatrix = async (req, res) => {
  try {
    const [logs, addPivot, selfRows] = await Promise.all([
      fetchWorkLogsForSupraN({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckAll(),
    ]);

    // self 체크 맵: worker -> {COL: number}
    const selfMap = {};
    for (const row of selfRows) {
      const w = workerAliases(row.name);
      selfMap[w] = row;
    }

    // 로그 카운트: counts[worker][item] = {main, support}
    const counts = {};
    for (const r of logs) {
      const item = normalizeItem(r.transfer_item);
      if (!BASELINE[item]) continue;
      const people = parseTaskMen(r.task_man);
      for (const p of people) {
        const w = workerAliases(p.name);
        counts[w] = counts[w] || {};
        counts[w][item] = counts[w][item] || { main: 0, support: 0 };
        const role = p.weight >= 1 ? "main" : "support";
        counts[w][item][role] += p.weight; // main=1.0 / support=0.2
      }
    }

    // 교육/가산 합산: addCounts[worker][item] = number
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

    // 모든 작업자 / 항목 축
    const workerSet = new Set([
      ...Object.keys(counts),
      ...Object.keys(addCounts),
      ...Object.keys(selfMap),
    ]);
    const itemList = Object.keys(BASELINE).slice().sort((a,b)=>a.localeCompare(b,'ko'));
    const workers = [...workerSet].sort((a,b)=>a.localeCompare(b,'ko'));

    // 계산
    const data = {};                 // data[item][worker] = {pci, work, self, total_count, main_count, support_count, add_count, baseline}
    const workerAvg = {};            // worker -> avg pci (참여 항목만)

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
          const col = toSelfCol(item); // 예: LP_ESCORT
          const val = Number(row[col] ?? 0);
          if (Number.isFinite(val) && val > 0) selfPct = 20;
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

        if (pci > 0) {
          const acc = workerAvg[w] || { s:0, n:0 };
          acc.s += pci; acc.n += 1; workerAvg[w] = acc;
        }
      }
    }

    const worker_avg_pci = {};
    for (const w of workers) {
      const acc = workerAvg[w];
      worker_avg_pci[w] = acc ? Math.round((acc.s/acc.n)*10)/10 : 0;
    }

    res.json({ workers, items: itemList, data, worker_avg_pci });
  } catch (e) {
    console.error("[PCI SUPRA N] getMatrix error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

// ====== 항목 단위 상세: 한 사람 + 한 항목의 산출 근거 ======
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
      fetchWorkLogsForSupraN({}),         // 전체기간
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 1) 이 항목 관련 로그 중, 해당 작업자가 참여한 건만 추출(역할/가중치 포함)
    const logRows = [];
    let mainSum = 0, supportSum = 0;
    for (const r of logs) {
      if (normalizeItem(r.transfer_item) !== itemNorm) continue;
      const people = parseTaskMen(r.task_man);
      for (const p of people) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
        if (role === "main") mainSum += 1.0; else supportSum += 0.2;
        logRows.push({
          id: r.id,
          task_date: r.task_date,
          equipment_type: r.equipment_type,
          equipment_name: r.equipment_name,   // 추가
          task_name: r.task_name,             // 추가
          task_man_raw: r.task_man,
          role,
          weight: p.weight,
        });
      }
    }
    mainSum = Math.round(mainSum * 10) / 10;
    supportSum = Math.round(supportSum * 10) / 10;

    // 2) 가산(교육)
    let addCount = 0;
    for (const key of Object.keys(addPivot)) {
      const norm = normalizeItem(key);
      if (norm !== itemNorm) continue;
      addCount += Number(addPivot[key]?.[worker] || 0);
    }

    // 3) 자가(20%)
    const selfCol = toSelfCol(itemNorm);     // 예: "LP_ESCORT"
    const selfVal = Number(selfRow?.[selfCol] || 0);
    const selfPct = selfVal > 0 ? 20 : 0;

    // 4) 퍼센트 산출
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
    console.error("[PCI SUPRA N] getWorkerItemBreakdown error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};
