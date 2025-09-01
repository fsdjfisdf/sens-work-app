// src/pci/precia_setup/pciController.js
const {
  CATEGORY_BASELINE,
  CATEGORY_ITEMS,
  CATEGORY_WEIGHTS,
  normalizeCategory,
  toSelfCol,
  workerAliases,
  prettyCat,
} = require("./pciConfig");
const { parseTaskMen, round1, clamp } = require("./pciUtils");
const {
  fetchWorkLogsForPreciaSetup,
  fetchSelfCheckRow,
  fetchSelfCheckAll,
  fetchSelfCheckNames,
  fetchAdditionalCountsPivot,
} = require("./pciDao");

/** ====== 공통: 카테고리 리스트 ====== */
const CAT_LIST = Object.keys(CATEGORY_BASELINE);

/** ====== 개인 PCI (카테고리별) ====== */
exports.getWorkerPci = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name || req.query.worker;
    if (!rawName) return res.status(400).json({ message: "name(작업자) 파라미터 필요" });
    const worker = workerAliases(rawName);
    const { start_date: startDate, end_date: endDate } = req.query;

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchWorkLogsForPreciaSetup({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 1) 작업 이력 카운트 (카테고리: main/support)
    const counts = {}; // { CAT: { main: num, support: num } }
    for (const r of logs) {
      const cat = normalizeCategory(r.setup_category);
      if (!CATEGORY_BASELINE[cat]) continue;
      for (const p of parseTaskMen(r.task_man)) {
        if (workerAliases(p.name) !== worker) continue;
        const role = p.weight >= 1 ? "main" : "support";
        counts[cat] = counts[cat] || { main: 0, support: 0 };
        counts[cat][role] += p.weight; // 1.0 / 0.1
      }
    }

    // 2) 교육/가산 카운트 합산
    const addCounts = {}; // { CAT: number }
    for (const cat of Object.keys(addPivot)) {
      if (!CATEGORY_BASELINE[cat]) continue;
      let sum = 0;
      for (const col of Object.keys(addPivot[cat])) {
        if (workerAliases(col) === worker) sum += Number(addPivot[cat][col] || 0);
      }
      if (sum > 0) addCounts[cat] = (addCounts[cat] || 0) + sum;
    }

    // 3) 자가(20%) — 카테고리 가중치 × (세부항목 완료율)
    //    각 카테고리 self_pct는 "가중치에 따른 부분점수" (최대 20 * weight%)
    function calcSelfPct(cat) {
      const items = CATEGORY_ITEMS[cat] || [];
      if (!items.length || !selfRow) return 0;
      let checked = 0;
      for (const it of items) {
        const col = toSelfCol(it);
        const v = Number(selfRow[col] ?? 0);
        if (Number.isFinite(v) && v > 0) checked += 1;
      }
      const ratio = checked / items.length; // 0..1
      const w = Number(CATEGORY_WEIGHTS[prettyCat(cat)] || 0) / 100; // 0..1
      const self = 20 * w * ratio; // 가중 부분점수
      return round1(self);
    }

    // 4) 카테고리별 행 구성
    const rows = [];
    let sumWork = 0;
    let sumSelfWeighted = 0;

    for (const cat of CAT_LIST) {
      const base = CATEGORY_BASELINE[cat] || 0;
      const c = counts[cat] || { main: 0, support: 0 };
      const add = addCounts[cat] || 0;
      const totalCnt = c.main + c.support + add;

      const workPct = base > 0 ? round1(Math.min(1, totalCnt / base) * 80) : 0;
      const selfPct = calcSelfPct(cat);
      const pciPct = clamp(workPct + selfPct, 0, 100);

      sumWork += workPct;
      sumSelfWeighted += selfPct;

      rows.push({
        category: cat,               // 내부 키
        category_label: prettyCat(cat), // 표시용
        baseline: base,
        main_count: round1(c.main),
        support_count: round1(c.support),
        add_count: add,
        total_count: round1(totalCnt),
        work_pct: workPct,           // 0..80
        self_pct: selfPct,           // 0..(20*가중치)
        pci_pct: pciPct,             // work + self(가중)
        self_detail: {
          items_total: (CATEGORY_ITEMS[cat] || []).length,
          // selfRow가 없으면 0
          checked: (() => {
            if (!selfRow) return 0;
            let n = 0;
            for (const it of (CATEGORY_ITEMS[cat] || [])) {
              const val = Number(selfRow[toSelfCol(it)] ?? 0);
              if (Number.isFinite(val) && val > 0) n++;
            }
            return n;
          })(),
          weight_percent: Number(CATEGORY_WEIGHTS[prettyCat(cat)] || 0), // 가중치(%)
        },
      });
    }

    // 5) 요약 — 평균 작업(0..80) + 자가 총합(0..20) → 총합 0..100
    const n = CAT_LIST.length || 1;
    const avgWork = round1(sumWork / n);
    const selfTotal = clamp(round1(sumSelfWeighted), 0, 20);
    const avgPciTotal = clamp(round1(avgWork + selfTotal), 0, 100);

    // 보기 좋게: 수행횟수 ↘ / 카테고리명
    rows.sort((a, b) => b.total_count - a.total_count || a.category.localeCompare(b.category, "ko"));

    const summary = {
      worker,
      period: { startDate: startDate || null, endDate: endDate || null },
      items_considered: n,
      avg_work_pct: avgWork,          // 0..80
      self_total_pct: selfTotal,      // 0..20 (가중치 합계)
      avg_pci_pct: avgPciTotal,       // 0..100 (= avg_work_pct + self_total_pct)
    };

    return res.json({ summary, rows });
  } catch (err) {
    console.error("[PCI PRECIA-SETUP] getWorkerPci error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** 전체 요약(옵션) */
exports.getAllSummary = async (req, res) => {
  try {
    const { start_date: startDate, end_date: endDate, limit = 200 } = req.query;

    const [logs, addPivot] = await Promise.all([
      fetchWorkLogsForPreciaSetup({ startDate, endDate }),
      fetchAdditionalCountsPivot(),
    ]);

    const set = new Set();
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const cat of Object.keys(addPivot)) for (const col of Object.keys(addPivot[cat])) set.add(workerAliases(col));

    const workers = [...set].slice(0, Number(limit));

    const list = [];
    for (const w of workers) {
      const fakeReq = { query: { start_date: startDate, end_date: endDate }, params: { name: w } };
      const result = await new Promise((resolve) => { exports.getWorkerPci(fakeReq, { json: resolve }); });
      list.push(result.summary);
    }

    return res.json({ count: list.length, workers: list });
  } catch (err) {
    console.error("[PCI PRECIA-SETUP] getAllSummary error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};

/** 작업자 이름 리스트 */
exports.getWorkerNames = async (_req, res) => {
  try {
    const [logs, addPivot, selfNames] = await Promise.all([
      fetchWorkLogsForPreciaSetup({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckNames(),
    ]);
    const set = new Set(selfNames.map(workerAliases));
    for (const r of logs) for (const p of parseTaskMen(r.task_man)) set.add(workerAliases(p.name));
    for (const cat of Object.keys(addPivot)) for (const col of Object.keys(addPivot[cat])) set.add(workerAliases(col));
    const workers = [...set].sort((a, b) => a.localeCompare(b, "ko"));
    res.json({ workers });
  } catch (e) {
    console.error("[PCI PRECIA-SETUP] getWorkerNames error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 매트릭스 (카테고리 × 작업자) */
exports.getMatrix = async (_req, res) => {
  try {
    const [logs, addPivot, selfRows] = await Promise.all([
      fetchWorkLogsForPreciaSetup({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckAll(),
    ]);

    // self 맵
    const selfMap = {};
    for (const row of selfRows) selfMap[workerAliases(row.name)] = row;

    // 로그 카운트
    const counts = {}; // counts[w][cat] = {main, support}
    for (const r of logs) {
      const cat = normalizeCategory(r.setup_category);
      if (!CATEGORY_BASELINE[cat]) continue;
      for (const p of parseTaskMen(r.task_man)) {
        const w = workerAliases(p.name);
        counts[w] = counts[w] || {};
        counts[w][cat] = counts[w][cat] || { main: 0, support: 0 };
        const role = p.weight >= 1 ? "main" : "support";
        counts[w][cat][role] += p.weight;
      }
    }

    // 교육/가산
    const addCounts = {}; // addCounts[w][cat] = num
    for (const cat of Object.keys(addPivot)) {
      if (!CATEGORY_BASELINE[cat]) continue;
      for (const col of Object.keys(addPivot[cat])) {
        const w = workerAliases(col);
        addCounts[w] = addCounts[w] || {};
        addCounts[w][cat] = (addCounts[w][cat] || 0) + Number(addPivot[cat][col] || 0);
      }
    }

    // 축
    const workerSet = new Set([...Object.keys(counts), ...Object.keys(addCounts), ...Object.keys(selfMap)]);
    const items = CAT_LIST.slice().sort((a, b) => a.localeCompare(b, "ko"));
    const workers = [...workerSet].sort((a, b) => a.localeCompare(b, "ko"));

    // 카테고리 self 계산 헬퍼
    const catSelf = (w, cat) => {
      const row = selfMap[w];
      const itemsArr = CATEGORY_ITEMS[cat] || [];
      if (!row || !itemsArr.length) return 0;
      let checked = 0;
      for (const it of itemsArr) {
        const val = Number(row[toSelfCol(it)] ?? 0);
        if (Number.isFinite(val) && val > 0) checked++;
      }
      const ratio = checked / itemsArr.length;
      const wgt = (Number(CATEGORY_WEIGHTS[prettyCat(cat)] || 0) / 100);
      return Math.round((20 * wgt * ratio) * 10) / 10;
    };

    // 계산
    const data = {};       // data[cat][w] = { pci, work, self, ... }
    const workerAvg = {};  // w -> {workSum, selfSum}

    for (const cat of items) {
      data[cat] = {};
      for (const w of workers) {
        const c = (counts[w] && counts[w][cat]) || { main: 0, support: 0 };
        const add = (addCounts[w] && addCounts[w][cat]) || 0;
        const tot = c.main + c.support + add;

        const base = CATEGORY_BASELINE[cat];
        const workPct = base > 0 ? Math.round(Math.min(1, tot / base) * 80 * 10) / 10 : 0;
        const selfPct = catSelf(w, cat);
        const pci = Math.max(0, Math.min(100, workPct + selfPct));

        data[cat][w] = {
          pci, work: workPct, self: selfPct,
          total_count: Math.round(tot * 10) / 10,
          main_count: Math.round((c.main || 0) * 10) / 10,
          support_count: Math.round((c.support || 0) * 10) / 10,
          add_count: add,
          baseline: base,
        };

        const acc = workerAvg[w] || { workSum: 0, selfSum: 0 };
        acc.workSum += workPct;
        acc.selfSum += selfPct; // self는 카테고리 가중 분
        workerAvg[w] = acc;
      }
    }

    const worker_avg_pci = {};
    const n = items.length || 1;
    for (const w of workers) {
      const acc = workerAvg[w] || { workSum: 0, selfSum: 0 };
      const avgWork = acc.workSum / n;
      // self는 카테고리별 가중분을 더한 총합(최대 20) — 행 평균과 달리 총합을 사용
      const selfTotal = Math.max(0, Math.min(20, acc.selfSum));
      worker_avg_pci[w] = Math.round((avgWork + selfTotal) * 10) / 10;
    }

    res.json({ workers, items, data, worker_avg_pci });
  } catch (e) {
    console.error("[PCI PRECIA-SETUP] getMatrix error:", e);
    res.status(500).json({ message: "internal_error" });
  }
};

/** 산출 근거 (한 사람 + 한 카테고리) */
exports.getWorkerItemBreakdown = async (req, res) => {
  try {
    const rawName = req.params.name || req.query.name;
    const rawCat = req.params.item || req.query.item;
    if (!rawName || !rawCat) return res.status(400).json({ message: "name, item 파라미터 필요" });

    const worker = workerAliases(rawName);
    const cat = normalizeCategory(rawCat);
    if (!CATEGORY_BASELINE[cat]) return res.status(404).json({ message: `기준에 없는 카테고리: ${rawCat}` });

    const baseline = CATEGORY_BASELINE[cat];

    const [logs, addPivot, selfRow] = await Promise.all([
      fetchWorkLogsForPreciaSetup({}),
      fetchAdditionalCountsPivot(),
      fetchSelfCheckRow(worker),
    ]);

    // 로그(역할/가중치)
    const logRows = [];
    let mainSum = 0, supportSum = 0;
    for (const r of logs) {
      const c = normalizeCategory(r.setup_category);
      if (c !== cat) continue;
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
          task_description: r.task_description,
          role,
          weight: p.weight,
        });
      }
    }
    mainSum = round1(mainSum);
    supportSum = round1(supportSum);

    // 교육/가산
    let addCount = 0;
    for (const key of Object.keys(addPivot)) {
      if (key !== cat) continue;
      for (const col of Object.keys(addPivot[key] || {})) {
        if (workerAliases(col) === worker) addCount += Number(addPivot[key][col] || 0);
      }
    }

    // 자가 (가중)
    const items = CATEGORY_ITEMS[cat] || [];
    let checked = 0;
    for (const it of items) {
      const v = Number(selfRow?.[toSelfCol(it)] || 0);
      if (Number.isFinite(v) && v > 0) checked++;
    }
    const ratio = items.length ? checked / items.length : 0;
    const w = (Number(CATEGORY_WEIGHTS[prettyCat(cat)] || 0) / 100);
    const selfPct = round1(20 * w * ratio);

    // 퍼센트 산출
    const totalCount = round1(mainSum + supportSum + addCount);
    const workPct = baseline > 0 ? round1(Math.min(1, totalCount / baseline) * 80) : 0;
    const pciPct = clamp(workPct + selfPct, 0, 100);

    return res.json({
      worker,
      item: cat,
      baseline,
      totals: { main_count: mainSum, support_count: supportSum, add_count: addCount, total_count: totalCount },
      percentages: {
        work_pct: workPct,
        self_pct: selfPct,
        pci_pct: pciPct,
        formula: `PCI = min(총횟수/기준,1)*80 + (20 × 가중 ${w*100}% × 완료율 ${Math.round(ratio*100)}%) = ${workPct} + ${selfPct}`,
      },
      self_check: {
        weight_percent: w * 100,
        items_total: items.length,
        checked,
        items,
      },
      logs: logRows.sort((a, b) => String(a.task_date || "").localeCompare(String(b.task_date || ""))),
    });
  } catch (err) {
    console.error("[PCI PRECIA-SETUP] getWorkerItemBreakdown error:", err);
    return res.status(500).json({ message: "internal_error", detail: String(err?.message || err) });
  }
};
