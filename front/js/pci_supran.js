/* ========================================================================
   S-WORKS — SUPRA N PCI (Front)
   - 자가체크 20% + 작업이력(현장+교육) 80%
   - API:
     GET /api/pci/supra-n/summary
     GET /api/pci/supra-n/worker/:name?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   ======================================================================== */

const API_BASE = ""; // 같은 오리진(3001)에서 서빙되므로 상대 경로 사용

// 상태
let currentRows = [];
let currentSummary = null;
let stackedChart = null;

// 엘리먼트
const el = {
  worker: document.getElementById("worker"),
  workerList: document.getElementById("worker-list"),
  dateFrom: document.getElementById("dateFrom"),
  dateTo: document.getElementById("dateTo"),
  btnRangeAll: document.getElementById("btnRangeAll"),
  btnRangeYTD: document.getElementById("btnRangeYTD"),
  btnRange90: document.getElementById("btnRange90"),
  btnFetch: document.getElementById("btnFetch"),
  btnCsv: document.getElementById("btnCsv"),
  avgWork: document.getElementById("avgWork"),
  avgPci: document.getElementById("avgPci"),
  itemsCnt: document.getElementById("itemsCnt"),
  periodText: document.getElementById("periodText"),
  stackedCanvas: document.getElementById("stackedChart"),
  tbody: document.getElementById("pciTbody"),
  searchItem: document.getElementById("searchItem"),
  sortBy: document.getElementById("sortBy"),
};

// ===== 공통 유틸 =====
function ymd(d) { return dayjs(d).format("YYYY-MM-DD"); }
function today() { return ymd(new Date()); }
function startOfYear() { return ymd(dayjs().startOf("year")); }
function daysAgo(n) { return ymd(dayjs().subtract(n, "day")); }

function round1(x) { return Math.round(x * 10) / 10; }
function pct(n) { return (Number.isFinite(n) ? n : 0).toFixed(1); }

function ensureLogin() {
  const token = localStorage.getItem('x-access-token');
  if (!token) {
    alert("로그인이 필요합니다.");
    window.location.replace("./signin.html");
    return false;
  }
  return true;
}

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", async () => {
  // (선택) 로그인 강제 시 사용
  // if (!ensureLogin()) return;

  // 기본 날짜: YTD
  el.dateFrom.value = startOfYear();
  el.dateTo.value = today();

  bindEvents();
  await loadWorkerList(); // datalist 채우기
});

/** 워커 후보 로드 (요약 API로부터 이름만 추출) */
async function loadWorkerList() {
  try {
    const url = `${API_BASE}/api/pci/supra-n/summary?limit=500`;
    const res = await axios.get(url);
    const arr = (res.data?.workers || []).map(w => w.worker).filter(Boolean);
    arr.sort((a,b) => a.localeCompare(b, 'ko'));
    el.workerList.innerHTML = arr.map(name => `<option value="${escapeHtml(name)}"></option>`).join("");
  } catch (err) {
    console.error("작업자 목록 로드 실패:", err);
  }
}

function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function bindEvents() {
  el.btnRangeAll.addEventListener("click", () => {
    el.dateFrom.value = ""; el.dateTo.value = "";
  });
  el.btnRangeYTD.addEventListener("click", () => {
    el.dateFrom.value = startOfYear(); el.dateTo.value = today();
  });
  el.btnRange90.addEventListener("click", () => {
    el.dateFrom.value = daysAgo(90); el.dateTo.value = today();
  });

  el.btnFetch.addEventListener("click", onFetch);
  el.btnCsv.addEventListener("click", onCsv);

  el.searchItem.addEventListener("input", renderTable);
  el.sortBy.addEventListener("change", () => { sortRows(); renderTable(); });
}

async function onFetch() {
  const name = el.worker.value.trim();
  if (!name) return alert("작업자를 입력해주세요.");

  const qs = new URLSearchParams();
  if (el.dateFrom.value) qs.set("start_date", el.dateFrom.value);
  if (el.dateTo.value) qs.set("end_date", el.dateTo.value);

  const url = `${API_BASE}/api/pci/supra-n/worker/${encodeURIComponent(name)}?${qs.toString()}`;
  try {
    const res = await axios.get(url);
    currentSummary = res.data?.summary || null;
    currentRows = res.data?.rows || [];

    updateCards();
    sortRows();
    renderChart();
    renderTable();
  } catch (err) {
    console.error("조회 실패:", err);
    alert("조회 중 오류가 발생했습니다.");
  }
}

function updateCards() {
  const s = currentSummary;
  if (!s) {
    el.avgWork.textContent = "-";
    el.avgPci.textContent = "-";
    el.itemsCnt.textContent = "-";
    el.periodText.textContent = "기간: -";
    return;
  }
  el.avgWork.textContent = pct(s.avg_work_pct);
  el.avgPci.textContent = pct(s.avg_pci_pct);
  el.itemsCnt.textContent = s.items_considered ?? 0;

  const { startDate, endDate } = s.period || {};
  const period = (startDate || endDate) ? `${startDate || '시작일 없음'} ~ ${endDate || '종료일 없음'}` : "전체";
  el.periodText.textContent = `기간: ${period}`;
}

// ===== 차트 =====
function renderChart() {
  const rows = (currentRows || []).slice().filter(r => r.pci_pct > 0 || r.self_pct > 0 || r.work_pct > 0);

  // 상위 15개만 (PCI 높은 순)
  rows.sort((a,b) => b.pci_pct - a.pci_pct);
  const top = rows.slice(0, 15);

  const labels = top.map(r => r.item);
  const work = top.map(r => r.work_pct);
  const self = top.map(r => r.self_pct);

  if (stackedChart) {
    stackedChart.destroy();
  }

  stackedChart = new Chart(el.stackedCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "작업이력(최대 80)", data: work, stack: "pci" },
        { label: "자가체크(최대 20)", data: self, stack: "pci" },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: { enabled: true },
        datalabels: {
          anchor: "end",
          align: "end",
          formatter: (v) => `${pct(v)}%`,
          color: "#333",
          clamp: true,
        }
      },
      scales: {
        x: { stacked: true, ticks: { maxRotation: 45, minRotation: 0 } },
        y: {
          stacked: true,
          min: 0, max: 100,
          ticks: {
            callback: (v) => v + '%'
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ===== 테이블 =====
function sortRows() {
  const mode = el.sortBy.value;
  const rows = currentRows || [];
  if (mode === "pci_desc") rows.sort((a,b) => b.pci_pct - a.pci_pct || b.total_count - a.total_count);
  else if (mode === "work_desc") rows.sort((a,b) => b.work_pct - a.work_pct || b.total_count - a.total_count);
  else if (mode === "count_desc") rows.sort((a,b) => b.total_count - a.total_count || b.pci_pct - a.pci_pct);
  else if (mode === "item_asc") rows.sort((a,b) => a.item.localeCompare(b.item, 'ko'));
}

function renderTable() {
  const q = el.searchItem.value.trim().toLowerCase();
  const rows = (currentRows || []).filter(r => !q || r.item.toLowerCase().includes(q));

  // 카테고리 추정(단어군 기반 간단 맵핑)
  const toCategory = (item) => {
    if (/ESCORT/i.test(item)) return "ESCORT";
    if (/EFEM|SR82/i.test(item)) return "EFEM ROBOT";
    if (/TM|PASSIVE/i.test(item)) return "TM ROBOT";
    if (/MICRO|APPLICATOR|GENERATOR/i.test(item)) return "MICROWAVE";
    if (/CHUCK/i.test(item)) return "CHUCK";
    if (/PROCESS/i.test(item)) return "PROCESS KIT";
    if (/HELIUM|LEAK/i.test(item)) return "LEAK";
    if (/PIN|BELLOWS|LM GUIDE/i.test(item)) return "PIN";
    if (/EPD/i.test(item)) return "EPD";
    if (/BOARD|POWER|SENSOR|MODULE|IO BOX|D-NET/i.test(item)) return "BOARD";
    if (/MFC|IGS|VALVE/i.test(item)) return "IGS/VALVE";
    if (/SLIT DOOR|APC|SHUTOFF|FAST VAC|SLOW VAC|SOLENOID/i.test(item)) return "VALVE";
    if (/CTR|CTC|PMC|EDA|CONTROLLER/i.test(item)) return "CTR";
    if (/S\/W|PATCH/i.test(item)) return "S/W";
    if (/FFU|FAN|MOTOR/i.test(item)) return "FFU";
    if (/BM|DRT|IB FLOW|PUSHER|CYLINDER/i.test(item)) return "BM MODULE";
    if (/MONITOR|KEYBOARD|MOUSE|CERAMIC|MANOMETER|FLOW SWITCH|VIEW PORT|BARATRON|PIRANI|WATER LEAK|HEATING JACKET/i.test(item)) return "ETC";
    return "-";
  };

  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const tr = document.createElement("tr");

    const cat = toCategory(r.item);
    const badgeClass = r.pci_pct >= 80 ? "ok" : (r.pci_pct >= 50 ? "mid" : "bad");

    tr.innerHTML = `
      <td><span class="badge">${cat}</span></td>
      <td>${escapeHtml(r.item)}</td>
      <td>${r.baseline}</td>
      <td>${r.main_count}</td>
      <td>${r.support_count}</td>
      <td>${r.add_count}</td>
      <td>${r.total_count}</td>
      <td>${pct(r.work_pct)}%</td>
      <td>${pct(r.self_pct)}%</td>
      <td><span class="badge ${badgeClass}">${pct(r.pci_pct)}%</span></td>
    `;
    frag.appendChild(tr);
  }
  el.tbody.innerHTML = "";
  el.tbody.appendChild(frag);
}

// ===== CSV =====
function onCsv() {
  if (!currentRows?.length) return alert("내보낼 데이터가 없습니다. 먼저 조회해주세요.");

  const header = [
    "항목","카테고리","기준","main","support","가산","총횟수","작업이력(80)","자가(20)","PCI(%)"
  ];
  const toCategory = (item) => {
    // 테이블과 동일한 간단 매핑
    if (/ESCORT/i.test(item)) return "ESCORT";
    if (/EFEM|SR82/i.test(item)) return "EFEM ROBOT";
    if (/TM|PASSIVE/i.test(item)) return "TM ROBOT";
    if (/MICRO|APPLICATOR|GENERATOR/i.test(item)) return "MICROWAVE";
    if (/CHUCK/i.test(item)) return "CHUCK";
    if (/PROCESS/i.test(item)) return "PROCESS KIT";
    if (/HELIUM|LEAK/i.test(item)) return "LEAK";
    if (/PIN|BELLOWS|LM GUIDE/i.test(item)) return "PIN";
    if (/EPD/i.test(item)) return "EPD";
    if (/BOARD|POWER|SENSOR|MODULE|IO BOX|D-NET/i.test(item)) return "BOARD";
    if (/MFC|IGS|VALVE/i.test(item)) return "IGS/VALVE";
    if (/SLIT DOOR|APC|SHUTOFF|FAST VAC|SLOW VAC|SOLENOID/i.test(item)) return "VALVE";
    if (/CTR|CTC|PMC|EDA|CONTROLLER/i.test(item)) return "CTR";
    if (/S\/W|PATCH/i.test(item)) return "S/W";
    if (/FFU|FAN|MOTOR/i.test(item)) return "FFU";
    if (/BM|DRT|IB FLOW|PUSHER|CYLINDER/i.test(item)) return "BM MODULE";
    if (/MONITOR|KEYBOARD|MOUSE|CERAMIC|MANOMETER|FLOW SWITCH|VIEW PORT|BARATRON|PIRANI|WATER LEAK|HEATING JACKET/i.test(item)) return "ETC";
    return "-";
  };

  const lines = [];
  lines.push(header.join(","));
  for (const r of currentRows) {
    const row = [
      r.item,
      toCategory(r.item),
      r.baseline,
      r.main_count,
      r.support_count,
      r.add_count,
      r.total_count,
      pct(r.work_pct),
      pct(r.self_pct),
      pct(r.pci_pct),
    ].map(v => `"${String(v).replace(/"/g,'""')}"`);
    lines.push(row.join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const name = (currentSummary?.worker || "worker") + "_SUPRAN_PCI.csv";
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
