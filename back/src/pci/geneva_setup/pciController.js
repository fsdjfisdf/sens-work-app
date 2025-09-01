// src/pci/geneva_setup/pciController.js
const cfg = require("./pciConfig");
const { BASELINE, toDisplayCategory, workerAliases, CHECK_TITLES } = cfg;
// normalizeItem이 없으면 toDisplayCategory로 대체
const normalizeItem = (s) =>
  (typeof cfg.normalizeItem === "function" ? cfg.normalizeItem(s) : toDisplayCategory(s));
// 같은 폴더 utils 사용 (폴더 혼동 방지)
const { parseTaskMen, round1, clamp } = require("./pciUtils");
const {
  fetchSetupLogsForGeneva,
  fetchSelfRow,
  fetchSelfAll,
  fetchAdditionalCountsPivot,
  computeSelfForCategory,
} = require("./pciDao");

/** 1명 계산 */
exports.getWorkerPci = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name || req.query.worker;
    if (!rawName) return res.status(400).json({ message: "name(작업자) 파라미터 필요" });

    const worker = workerAliases(rawName);
    const { start_date: startDate, end_date: endDate } = req.query;

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchSetupLogsForGeneva({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
      fetchSelfRow(worker),
    ]);

    // 로그 카운트 집계 (카테고리)
    const counts = {}; // { item: { main, support } }
    for (const r of logs) {
      const item = normalizeItem(r.setup_item);
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
    for (const cat of Object.keys(addPivot)) {
      const dic = addPivot[cat];
      let sum = 0;
      for (const col of Object.keys(dic)) {
        if (workerAliases(col) === worker) sum += Number(dic[col] || 0);
      }
      if (sum > 0) addCounts[cat] = (addCounts[cat] || 0) + sum;
    }

    // 항목별 PCI 계산
    const rows = [];
    let usedItems = 0, accWork = 0, accTotal = 0;

    for (const item of Object.keys(BASELINE)) {
      const base = BASELINE[item];
      const c = counts[item] || { main: 0, support: 0 };
      const add = addCounts[item] || 0;
      const totalCnt = c.main + c.support + add;

      const workRatio = base > 0 ? Math.min(1, totalCnt / base) : 0;
      const workPct = round1(workRatio * 80);

      // 자가체크 20% = 소항목 비율 * 20
      const selfAgg = computeSelfForCategory(selfRow, item);
      const selfPct = round1(selfAgg.self_pct);

      const pciPct = clamp(workPct + selfPct, 0, 100);

      usedItems += 1; // 0% 포함
      accWork += workPct;
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
    rows.sort((a, b) => b.total_count - a.total_count || a.item.localeCompare(b.item, "ko"));

    const summary = {
      worker,
      period: { startDate: startDate || null, endDate: endDate || null },
      items_considered: usedItems,
      avg_work_pct: usedItems ? round1(accWork / usedItems) : 0,
      avg_pci_pct: usedItems ? round1(accTotal / usedItems) : 0,
    };

    return res.json({ summary, rows });
  } catch (err) {
    console.error("[PCI GENEVA SETUP] getWorkerPci error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** 전체 요약(옵션) */
exports.getAllSummary = async (req, res) => {
  try {
    const { start_date: startDate, end_date: endDate, limit = 200 } = req.query;

    const [logs, addPivot] = await Promise.all([
      fetchSetupLogsForGeneva({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
    ]);

    const set = new Set();
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const cat of Object.keys(addPivot)) for (const col of Object.keys(addPivot[cat])) set.add(workerAliases(col));

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
    console.error("[PCI GENEVA SETUP] getAllSummary error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** 작업자 이름 리스트 */
exports.getWorkerNames = async (_req, res) => {
  try {
    const [logs, addPivot, selfRows] = await Promise.all([
      fetchSetupLogsForGeneva({}),
      fetchAdditionalCountsPivot(),
      fetchSelfAll(),
    ]);

    const set = new Set();
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const cat of Object.keys(addPivot)) for (const col of Object.keys(addPivot[cat])) set.add(workerAliases(col));
    for (const row of selfRows) if (row?.name) set.add(workerAliases(row.name));

    const workers = [...set].sort((a, b) => a.localeCompare(b, "ko"));
    res.json({ workers });
  } catch (e) {
    console.error("[PCI GENEVA SETUP] getWorkerNames error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 매트릭스 (한 방에) */
exports.getMatrix = async (_req, res) => {
  try {
    const [logs, addPivot, selfRows] = await Promise.all([
      fetchSetupLogsForGeneva({}),
      fetchAdditionalCountsPivot(),
      fetchSelfAll(),
    ]);

    const selfMap = {};
    for (const row of selfRows) selfMap[workerAliases(row.name)] = row;

    // 로그 카운트: counts[worker][item] = {main, support}
    const counts = {};
    for (const r of logs) {
      const item = normalizeItem(r.setup_item);
      if (!BASELINE[item]) continue;
      const people = parseTaskMen(r.task_man);
      for (const p of people) {
        const w = workerAliases(p.name);
        counts[w] = counts[w] || {};
        counts[w][item] = counts[w][item] || { main: 0, support: 0 };
        const role = p.weight >= 1 ? "main" : "support";
        counts[w][item][role] += p.weight;
      }
    }

    // 교육/가산: addCounts[worker][item] = number
    const addCounts = {};
    for (const cat of Object.keys(addPivot)) {
      for (const col of Object.keys(addPivot[cat])) {
        const w = workerAliases(col);
        addCounts[w] = addCounts[w] || {};
        addCounts[w][cat] = (addCounts[w][cat] || 0) + Number(addPivot[cat][col] || 0);
      }
    }

    const itemList = Object.keys(BASELINE).slice().sort((a, b) => a.localeCompare(b, "ko"));

    const workerSet = new Set([...Object.keys(counts), ...Object.keys(addCounts), ...Object.keys(selfMap)]);
    const workers = [...workerSet].sort((a, b) => a.localeCompare(b, "ko"));

    const data = {};      // data[item][worker] = { pci, work, self, ... , baseline }
    const workerAvg = {}; // worker -> 합계/개수

    for (const item of itemList) {
      data[item] = {};
      for (const w of workers) {
        const c = (counts[w] && counts[w][item]) || { main: 0, support: 0 };
        const add = (addCounts[w] && addCounts[w][item]) || 0;
        const total = c.main + c.support + add;

        const base = BASELINE[item];
        const workPct = base > 0 ? Math.round(Math.min(1, total / base) * 80 * 10) / 10 : 0;

        // self 20%: 소항목 비율 환산
        const selfAgg = computeSelfForCategory(selfMap[w], item);
        const selfPct = Math.round((selfAgg.self_pct || 0) * 10) / 10;

        const pci = Math.max(0, Math.min(100, workPct + selfPct));
        data[item][w] = {
          pci,
          work: workPct,
          self: selfPct,
          total_count: Math.round(total * 10) / 10,
          main_count: Math.round((c.main || 0) * 10) / 10,
          support_count: Math.round((c.support || 0) * 10) / 10,
          add_count: add,
          baseline: base,
        };

        const acc = workerAvg[w] || { s: 0, n: 0 };
        acc.s += pci; acc.n += 1;
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
    console.error("[PCI GENEVA SETUP] getMatrix error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 항목(카테고리) 단위 상세 */
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
      fetchSetupLogsForGeneva({}),
      fetchAdditionalCountsPivot(),
      fetchSelfRow(worker),
    ]);

    // 1) 로그
    const logRows = [];
    let mainSum = 0, supportSum = 0;
    for (const r of logs) {
      if (normalizeItem(r.setup_item) !== itemNorm) continue;
      const people = parseTaskMen(r.task_man);
      for (const p of people) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
        if (role === "main") mainSum += 1.0;
        else supportSum += 0.1;
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

    // 2) 교육/가산
    let addCount = 0;
    const addDic = addPivot[itemNorm] || {};
    for (const col of Object.keys(addDic)) {
      if (workerAliases(col) === worker) addCount += Number(addDic[col] || 0);
    }

    // 3) 자가체크 합산
    const selfAgg = computeSelfForCategory(selfRow, itemNorm);
    // 체크리스트 상세(제목 붙이기)
    const checklist = (selfAgg.checklist || []).map(c => ({
      key: c.key,
      title: CHECK_TITLES[c.key] || "",
      value: Number(c.value || 0),
    }));

    // 4) 퍼센트
    const totalCount = Math.round((mainSum + supportSum + addCount) * 10) / 10;
    const workPct = baseline > 0 ? Math.round(Math.min(1, totalCount / baseline) * 80 * 10) / 10 : 0;
    const selfPct = Math.round((selfAgg.self_pct || 0) * 10) / 10;
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
        formula: `PCI = min(총횟수/기준,1)*80 + (체크비율*20) = ${workPct} + ${selfPct}`,
      },
      self_detail: {
        total_items: selfAgg.total_items,
        total_checked: selfAgg.total_checked,
        ratio: Math.round((selfAgg.ratio || 0) * 1000) / 1000,
        checklist,
      },
      logs: logRows.sort((a, b) => String(a.task_date || "").localeCompare(String(b.task_date || ""))),
    });
  } catch (err) {
    console.error("[PCI GENEVA SETUP] getWorkerItemBreakdown error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};
