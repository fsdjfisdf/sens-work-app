/* ==========================================================================
   INTEGER PCI — 전체 보기 요약행(평균) + 개인 보기 테이블 룩&필 적용
   - Thead 2단: ① 헤더 ② 요약(평균) 행
   - 요약(평균) 행은 현재 필터에 노출된 항목/작업자 기준으로 즉시 재계산
   - 전체 평균(가시 항목 기준) 배지 제공
   - 차트 축소 문제 해결(캔버스 크기 고정 + destroy/recreate)
   - 0% 항목도 모두 포함 (매트릭스/개인 보기 공통)
   ========================================================================== */

const API_BASE = "";

// ===== 전역 상태 =====
let workerNames = [];
let stackedChart = null;

// 매트릭스 상태
let matrixItems = [];
let matrixWorkers = [];
let matrixData = {};   // data[item][worker] = {pci, work, self, baseline, ...}
let workerAvgMap = {}; // worker -> avg pci(서버 제공; 정렬 기본값에 사용)
let collapsedCats = new Set(); // 카테고리 접힘 상태

// 개인 보기 상태
let currentRows = [];
let currentSummary = null;

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const el = {
  tabs: document.querySelectorAll(".tab"),
  panes: document.querySelectorAll(".tab-pane"),

  // matrix
  filterItem: $("filterItem"),
  filterWorker: $("filterWorker"),
  sortWorkers: $("sortWorkers"),
  density: $("density"),
  colWidth: $("colWidth"),
  btnReloadMatrix: $("btnReloadMatrix"),
  btnMatrixCsv: $("btnMatrixCsv"),
  matrixThead: $("matrixThead"),
  matrixTbody: $("matrixTbody"),
  matrixLoading: $("matrixLoading"),
  matrixTable: $("matrixTable"),
  matrixWrap: $("matrixWrap"),

  // person
  worker: $("worker"),
  workerList: $("worker-list"),
  btnFetch: $("btnFetch"),
  btnCsv: $("btnCsv"),
  avgWork: $("avgWork"),
  avgPci: $("avgPci"),
  itemsCnt: $("itemsCnt"),
  stackedCanvas: $("stackedChart"),
  chartScroll: $("chartScroll"),
  chartInner: $("chartInner"),
  searchItem: $("searchItem"),
  sortBy: $("sortBy"),
  tbody: $("pciTbody"),
  personTableScroll: $("personTableScroll"),

  // modal
  overlay: $("overlay"),
  modal: $("modal"),
  modalTitle: $("modalTitle"),
  modalBody: $("modalBody"),
  modalClose: $("modalClose"),
};

const CATEGORIES = [
  { category: "Escort", items: [
    "LP ESCORT","ROBOT ESCORT"
  ]},
  { category: "EFEM Robot", items: [
    "SR8240 TEACHING","GENMARK ROBOT TEACHING",
    "SR8240 ROBOT REP","GENMARK ROBOT REP","ROBOT CONTROLLER REP"
  ]},
  { category: "FFU", items: [
    "FFU CONTROLLER","FAN","MOTOR DRIVER"
  ]},
  { category: "Heater", items: [
    "ELBOW HEATER","INSULATION HEATER","CHUCK HEATER"
  ]},
  { category: "Disc", items: [
    "HARMONIC DRIVER","AMPLIFIER","DISC BEARING"
  ]},
  { category: "PM 후", items: [
    "CHUCK LEVELING","WAFER SUPPORT PIN ALIGNMENT",
    "TEMP PROFILE","O2 LEAK TEST","CHUCK UP & DOWN STATUS"
  ]},
  { category: "Sealing", items: [
    "RING SEAL","DOOR SEAL"
  ]},
  { category: "LL O-RING", items: [
    "RING SEAL ORING","DOOR SEAL ORING"
  ]},
  { category: "Board", items: [
    "GAS BOX BOARD","TEMP CONTROLLER BOARD","POWER DISTRIBUTION BOARD",
    "DC POWER SUPPLY","FACILITY BOARD","STATION BOARD","BUBBLER BOARD","D-NET"
  ]},
  { category: "Gas box", items: [
    "MFC","VALVE"
  ]},
  { category: "O2 analyzer", items: [
    "O2 ANALYZER","O2 CONTROLLER","O2 PUMP","O2 CELL"
  ]},
  { category: "Valve", items: [
    "O2 SAMPLE VALVE","FEED & DELIVERY VALVE","FILL & VENT VALVE",
    "DRAIN VALVE","APC VALVE","BYPASS VALVE","SHUTOFF VALVE",
    "VAC SOL VALVE","VAC CDA VALVE"
  ]},
  { category: "Bubbler", items: [
    "BUBBLER LEVEL SENSOR","BUBBLER FLEXIBLE HOSE"
  ]},
  { category: "ETC", items: [
    "BARATRON ASS'Y","VIEW PORT","FLOW SWITCH",
    "LL DOOR CYLINDER","CHUCK CYLINDER",
    "MONITOR","KEYBOARD","MOUSE",
    "WATER LEAK DETECTOR","FORMIC DETECTOR","EXHAUST GAUGE"
  ]},
  { category: "CTR", items: [
    "CTC","EDA","TEMP LIMIT CONTROLLER","TEMP CONTROLLER"
  ]},
  { category: "S/W", items: [
    "S/W PATCH"
  ]},
];


const ITEM_TO_CAT = (()=>{ const m={}; for(const g of CATEGORIES) for(const it of g.items) m[it]=g.category; return m; })();
const getCategory = (item)=> ITEM_TO_CAT[item] || "-";

// ===== Utils =====
const ESC_RE  = /[&<>"']/g;
const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
function esc(s) { s = (s == null) ? '' : String(s); return s.replace(ESC_RE, ch => ESC_MAP[ch] || ch); }
function pct(n){ return (Number.isFinite(n)?n:0).toFixed(1); }
function heatClass(p){ const b = Math.max(0, Math.min(10, Math.round((p||0)/10))); return `h${b}`; }
const debounce = (fn, ms=200)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

// Busy indicator helpers
function startLine(container){ container?.classList.add("is-loading"); }
function stopLine(container){ container?.classList.remove("is-loading"); }
function showBusy(container, work){
  startLine(container);
  requestAnimationFrame(()=>{ try{ work(); } finally{ setTimeout(()=>stopLine(container), 280); } });
}

// Fade-in helper
function fadeInBox(box){
  box?.classList.remove("fade-in");
  void box?.offsetWidth;
  box?.classList.add("fade-in");
}

// Column highlight
let currentColIndex = null;
function clearColHighlight(){
  if (currentColIndex == null) return;
  el.matrixTable.querySelectorAll(`[data-col="${currentColIndex}"]`).forEach(n=>n.classList.remove("col-hl"));
  currentColIndex = null;
}
function highlightColumn(colIdx){
  clearColHighlight();
  currentColIndex = colIdx;
  el.matrixTable.querySelectorAll(`[data-col="${colIdx}"]`).forEach(n=>n.classList.add("col-hl"));
}

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", async () => {
  bindTabs();
  bindMatrixEvents();
  bindPersonEvents();

  // 모달 close
  el.modalClose.addEventListener("click", hideModal);
  el.overlay.addEventListener("click", hideModal);
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape") hideModal(); });

  await loadWorkerList();
  await buildMatrix();

  // 매트릭스 셀 상세(이벤트 위임)
  el.matrixTbody.addEventListener("click", (e)=>{
    const c = e.target.closest(".cell");
    if (!c) return;
    const w = c.getAttribute("data-w");
    const it = c.getAttribute("data-item");
    if (w && it) openBreakdown(w, it);
  });
  el.matrixTbody.addEventListener("keydown", (e)=>{
    if (e.key !== "Enter" && e.key !== " ") return;
    const c = e.target.closest(".cell");
    if (!c) return;
    e.preventDefault();
    const w = c.getAttribute("data-w");
    const it = c.getAttribute("data-item");
    if (w && it) openBreakdown(w, it);
  });

  // 카테고리 접기/펼치기
  el.matrixTbody.addEventListener("click", (e)=>{
    const row = e.target.closest("tr.cat-row");
    if (!row) return;
    const cat = row.getAttribute("data-cat");
    if (!cat) return;
    if (collapsedCats.has(cat)) collapsedCats.delete(cat); else collapsedCats.add(cat);
    showBusy(el.matrixWrap, ()=>renderMatrix());
  });

  // 열 하이라이트
  el.matrixTable.addEventListener("mouseover",(e)=>{
    const td = e.target.closest("td.worker-col, th.worker-col");
    if (!td) return;
    highlightColumn(td.dataset.col);
  });
  el.matrixTable.addEventListener("mouseleave", clearColHighlight);
});

// ===== 탭 =====
function bindTabs(){
  el.tabs.forEach(btn=>{
    btn.addEventListener("click",()=>{
      el.tabs.forEach(b=>{ b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
      btn.classList.add("active"); btn.setAttribute("aria-selected","true");
      const target = btn.dataset.tab;
      el.panes.forEach(p=>p.classList.remove("active"));
      document.getElementById(target).classList.add("active");
      fadeInBox(target === "tab-matrix" ? el.matrixWrap : el.personTableScroll);
    });
  });
}

// ===== 매트릭스 =====
function bindMatrixEvents(){
  el.btnReloadMatrix.addEventListener("click", ()=>buildMatrix());
  el.btnMatrixCsv.addEventListener("click", exportMatrixXlsx);
  el.filterItem.addEventListener("input", debounce(()=> showBusy(el.matrixWrap, renderMatrix), 120));
  el.filterWorker.addEventListener("input", debounce(()=> showBusy(el.matrixWrap, renderMatrix), 120));
  el.sortWorkers.addEventListener("change", ()=>{ sortMatrixWorkers(); showBusy(el.matrixWrap, renderMatrix); });
  el.density.addEventListener("change", ()=> toggleDensity());
  el.colWidth.addEventListener("input", ()=> applyColumnWidth());
}

async function loadWorkerList(){
  try{
    const res = await axios.get(`/api/pci/hdw/workers`);
    workerNames = (res.data?.workers || []).slice().sort((a,b)=>a.localeCompare(b,'ko'));
    el.workerList.innerHTML = workerNames.map(n=>`<option value="${esc(n)}"></option>`).join("");
  }catch(err){
    console.error("작업자 목록 로드 실패:", err);
    workerNames = [];
  }
}

function renderMatrixSkeleton(rowCount=10, workerCount=12){
  const tr = document.createElement("tr");
  tr.className = "header-row";
  tr.innerHTML = `
    <th class="item-col">중분류</th>
    <th class="item-col">작업 항목</th>
    ${Array.from({length: workerCount}).map((_,i)=>`<th class="worker-col" data-col="${2+i}" data-wi="${i+1}"><div class="sk sk-line"></div></th>`).join("")}
  `;
  el.matrixThead.innerHTML = ""; el.matrixThead.appendChild(tr);

  const frag = document.createDocumentFragment();
  for (let r=0;r<rowCount;r++){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="item-col"><div class="sk sk-tag"></div></td>
      <td class="item-col"><div class="sk sk-text"></div><div class="sk sk-tiny"></div></td>
      ${Array.from({length: workerCount}).map((_,i)=>`<td class="worker-col" data-col="${2+i}" data-wi="${i+1}"><div class="sk sk-cell"></div></td>`).join("")}
    `;
    frag.appendChild(tr);
  }
  el.matrixTbody.innerHTML = ""; el.matrixTbody.appendChild(frag);
}

async function buildMatrix(){
  el.matrixLoading.classList.remove("hidden");
  startLine(el.matrixWrap);
  renderMatrixSkeleton(12, 15);
  try{
    const res = await axios.get(`/api/pci/hdw/matrix`);
    const { workers, items, data, worker_avg_pci } = res.data || {};
    matrixWorkers = workers || [];
    matrixItems = items || [];
    matrixData = data || {};
    workerAvgMap = worker_avg_pci || {};
    sortMatrixWorkers();
    renderMatrix();
    toggleDensity();
    applyColumnWidth();
    fadeInBox(el.matrixWrap);
  }catch(e){
    console.error("매트릭스 로드 실패:", e);
    alert("매트릭스 로드 중 오류가 발생했습니다.");
  }finally{
    el.matrixLoading.classList.add("hidden");
    setTimeout(()=>stopLine(el.matrixWrap), 300);
  }
}

function sortMatrixWorkers(){
  const mode = el.sortWorkers.value;
  if (mode === "name_asc"){
    matrixWorkers.sort((a,b)=>a.localeCompare(b,'ko'));
  } else {
    // 서버 제공 평균 PCI 기준(전역) → 동률은 이름순
    matrixWorkers.sort((a,b)=>(workerAvgMap[b]??0)-(workerAvgMap[a]??0) || a.localeCompare(b,'ko'));
  }
}

// 요약(평균) 계산: 현재 표시되는 항목/작업자에 한정
function computeVisibleAverages(shownItems, shownWorkers){
  const perWorker = {};
  const totalItems = shownItems.length;

  let sumAll = 0;

  for (const w of shownWorkers){
    let s = 0;
    for (const it of shownItems){
      const v = Number(matrixData[it]?.[w]?.pci);
      s += Number.isFinite(v) ? v : 0; // 값이 없으면 0으로 취급
    }
    perWorker[w] = totalItems > 0 ? (s / totalItems) : null;
    sumAll += s;
  }

  const denom = totalItems * shownWorkers.length;
  const overall = denom > 0 ? (sumAll / denom) : null;
  return { perWorker, overall };
}

// 헤더 높이/고정열 폭을 실제 치수로 CSS 변수 동기화
function syncStickyOffsets(){
  // 1) 헤더 1행 실제 높이 → --thead-h
  const headRow = el.matrixThead.querySelector("tr.header-row");
  if (headRow) {
    const h = Math.ceil(headRow.getBoundingClientRect().height);
    el.matrixTable.style.setProperty("--thead-h", h + "px");
  }

  // 2) 좌측 고정열 실제 폭 → --w-cat / --w-item
  const th1 = el.matrixThead.querySelector("tr.header-row th.item-col:nth-child(1)");
  const th2 = el.matrixThead.querySelector("tr.header-row th.item-col:nth-child(2)");
  if (th1 && th2) {
    const w1 = Math.ceil(th1.getBoundingClientRect().width);
    const w2 = Math.ceil(th2.getBoundingClientRect().width);
    el.matrixTable.style.setProperty("--w-cat",  w1 + "px");
    el.matrixTable.style.setProperty("--w-item", w2 + "px");
  }
}

function renderMatrix(){
  clearColHighlight();

  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const shownWorkers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const shownItems = [];
  for (const grp of CATEGORIES){
    for (const it of grp.items){
      if (!matrixItems.includes(it)) continue;
      if (qItem && !it.toLowerCase().includes(qItem)) continue;
      shownItems.push(it);
    }
  }

  // 평균 계산(가시 항목 기준)
  const { perWorker, overall } = computeVisibleAverages(shownItems, shownWorkers);

  // ===== thead (헤더 + 요약행) =====
  const headRow = document.createElement("tr");
  headRow.className = "header-row";
  const thCat = document.createElement("th"); thCat.textContent = "중분류"; thCat.className="item-col"; thCat.dataset.col = 0;
  const thItem = document.createElement("th"); thItem.textContent = "작업 항목"; thItem.className="item-col"; thItem.dataset.col = 1;
  headRow.appendChild(thCat); headRow.appendChild(thItem);
  shownWorkers.forEach((w,i)=>{
    const th = document.createElement("th");
    th.className = "worker-col";
    th.dataset.col = 2+i;
    th.dataset.wi = 1+i;
    if (i>0 && ((i % 5)===0)) th.classList.add("block-start");
    const tip = Number.isFinite(perWorker[w]) ? `현재 보기 평균 ${pct(perWorker[w])}%` : `데이터 없음`;
    th.innerHTML = `<div class="wname" title="${esc(tip)}">${esc(w)}</div>`;
    headRow.appendChild(th);
  });

  // 요약(평균) 행
  const sumRow = document.createElement("tr");
  sumRow.className = "summary-row";
  const sumThCat = document.createElement("th");
  sumThCat.className = "item-col sum-col"; sumThCat.dataset.col = 0; sumThCat.textContent = "";
  const sumThItem = document.createElement("th");
  sumThItem.className = "item-col sum-col"; sumThItem.dataset.col = 1;
  sumThItem.innerHTML = `${Number.isFinite(overall) ? `<span class="badge b-total">전체 평균 ${pct(overall)}%</span>` : `<span class="badge">데이터 없음</span>`}`;
  sumRow.appendChild(sumThCat); sumRow.appendChild(sumThItem);

  shownWorkers.forEach((w,i)=>{
    const v = perWorker[w];
    const cls = Number.isFinite(v) ? (v>=80?"ok":(v>=50?"mid":"bad")) : "";
    const th = document.createElement("th");
    th.className = "worker-col sum-col";
    th.dataset.col = 2+i;
    th.dataset.wi = 1+i;
    if (i>0 && ((i % 5)===0)) th.classList.add("block-start");
    th.innerHTML = Number.isFinite(v)
      ? `<span class="badge ${cls}">${pct(v)}%</span>`
      : `<span class="badge">-</span>`;
    sumRow.appendChild(th);
  });

  el.matrixThead.innerHTML = "";
  el.matrixThead.appendChild(headRow);
  el.matrixThead.appendChild(sumRow);

  // ===== tbody =====
  const frag = document.createDocumentFragment();

  for (const grp of CATEGORIES){
    const its = grp.items
      .filter(it => matrixItems.includes(it))
      .filter(it => !qItem || it.toLowerCase().includes(qItem));
    if (!its.length) continue;

    // 그룹 헤더
    const catTr = document.createElement("tr");
    catTr.className = "cat-row" + (collapsedCats.has(grp.category) ? " collapsed" : "");
    catTr.setAttribute("data-cat", grp.category);
    const catTd = document.createElement("td");
    catTd.colSpan = 2 + shownWorkers.length;
    catTd.innerHTML = `<span class="caret">▶</span>${esc(grp.category)}`;
    catTr.appendChild(catTd);
    frag.appendChild(catTr);

    if (collapsedCats.has(grp.category)) continue;

    // 항목 행
    for (const item of its){
      const tr = document.createElement("tr");

      const tdCat = document.createElement("td");
      tdCat.className = "item-col";
      tdCat.dataset.col = 0;
      tdCat.innerHTML = `<span class="badge">${esc(grp.category)}</span>`;

      const base = getBaseline(item);
      const tdItem = document.createElement("td");
      tdItem.className = "item-col";
      tdItem.dataset.col = 1;
      tdItem.innerHTML = `<div class="item-cell"><strong>${esc(item)}</strong>${base!==""?`<div class="meta">기준 ${esc(base)}</div>`:""}</div>`;

      tr.appendChild(tdCat); tr.appendChild(tdItem);

      shownWorkers.forEach((w,i)=>{
        const d = (matrixData[item]||{})[w] || null;
        const val = d?.pci ?? 0;
        const td = document.createElement("td");
        td.className = "worker-col";
        td.dataset.col = 2+i;
        td.dataset.wi = 1+i;
        if (i>0 && ((i % 5)===0)) td.classList.add("block-start");
        td.innerHTML = `
          <div class="cell ${heatClass(val)}" role="button" tabindex="0"
               data-w="${esc(w)}" data-item="${esc(item)}" title="클릭하여 상세 보기">
            <span class="pct">${pct(val)}%</span>
          </div>`;
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    }
  }

  el.matrixTbody.innerHTML = "";
  el.matrixTbody.appendChild(frag);

  // 렌더 후 스타일 반영
  toggleDensity();
  applyColumnWidth();
  toggleDensity();
}

function toggleDensity(){
  const dense = el.density.value === "compact";
  el.matrixTable.classList.toggle("dense", dense);
  syncStickyOffsets();
}

function applyColumnWidth(){
  const px = Math.max(40, Math.min(140, Number(el.colWidth.value || 68)));
  Array.from(document.querySelectorAll(".worker-col")).forEach(c => { c.style.minWidth = px + "px"; });
  syncStickyOffsets();
}
window.addEventListener("resize", debounce(syncStickyOffsets, 120));

// ===== Excel (중분류/기준 + 요약행 포함) =====
function exportMatrixXlsx(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const workers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const items = [];
  for (const grp of CATEGORIES){
    for (const it of grp.items){
      if (!matrixItems.includes(it)) continue;
      if (qItem && !it.toLowerCase().includes(qItem)) continue;
      items.push({cat: grp.category, item: it});
    }
  }

  const { perWorker, overall } = computeVisibleAverages(items.map(r=>r.item), workers);

  const header = ["중분류","작업 항목","기준", ...workers];
  const aoa = [header];

  // 요약행(엑셀 첫줄)
  const sumRow = ["-","","-",
    ...workers.map(w => Number.isFinite(perWorker[w]) ? Number(pct(perWorker[w])) : "")
  ];
  aoa.push(sumRow);

  for (const {cat, item} of items){
    const base = getBaseline(item);
    const row = [cat, item, base];
    for (const w of workers){
      const d = (matrixData[item]||{})[w] || null;
      row.push(Number.isFinite(d?.pci) ? Number(pct(d.pci)) : "");
    }
    aoa.push(row);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, "HDW PCI");
  XLSX.writeFile(wb, "HDW_PCI_MATRIX.xlsx");
}

// ===== 개인 보기 =====
function bindPersonEvents(){
  el.btnFetch.addEventListener("click", onFetchPerson);
  el.btnCsv.addEventListener("click", exportPersonXlsx);
  el.searchItem.addEventListener("input", debounce(()=> showBusy(el.personTableScroll, renderPersonTable), 120));
  el.sortBy.addEventListener("change", ()=>{ sortPersonRows(); showBusy(el.personTableScroll, renderPersonTable); });

  // 행 클릭 → 상세
  el.tbody.addEventListener("click", (e)=>{
    const tr = e.target.closest("tr[data-item]");
    const item = tr?.getAttribute("data-item");
    const worker = currentSummary?.worker;
    if (tr && worker && item) openBreakdown(worker, item);
  });
}

async function onFetchPerson(){
  const name = el.worker.value.trim();
  if (!name) return alert("작업자를 입력하세요.");
  startLine(el.personTableScroll);
  try{
    const res = await axios.get(`/api/pci/hdw/worker/${encodeURIComponent(name)}`);
    currentSummary = res.data?.summary || null;
    currentRows = res.data?.rows || [];
    updateCards();
    sortPersonRows();
    renderPersonChart();
    renderPersonTable();
    fadeInBox(el.personTableScroll);
  }catch(err){
    console.error("개인 조회 실패:", err);
    alert("조회 중 오류가 발생했습니다.");
  }finally{
    setTimeout(()=>stopLine(el.personTableScroll), 300);
  }
}

function updateCards(){
  const rows = currentRows || [];
  if (!rows.length){
    el.avgWork.textContent="-"; el.avgPci.textContent="-"; el.itemsCnt.textContent="-";
    return;
  }
  // ✅ 0% 포함: 전체 행으로 평균
  const n = rows.length;
  const sumWork = rows.reduce((s,r)=> s + (Number(r.work_pct)||0), 0);
  const sumPci  = rows.reduce((s,r)=> s + (Number(r.pci_pct)||0),  0);

  el.avgWork.textContent = pct(sumWork / n);
  el.avgPci.textContent  = pct(sumPci  / n);
  el.itemsCnt.textContent = n;

  // 카드 보조 문구 보정
  const cntSub = document.querySelector('.cards .card.stat:nth-child(3) .sub');
  if (cntSub) cntSub.textContent = '모든 항목 포함(0% 포함)';
}

function renderPersonChart(){
  // ✅ 0%도 포함
  const rows = (currentRows || []).slice();

  // 보기 좋게: PCI 내림차순 → 같은 값이면 수행횟수 많은 순
  rows.sort((a,b)=> b.pci_pct - a.pci_pct || b.total_count - a.total_count);

  const labels = rows.map(r => r.item);
  const work   = rows.map(r => Number(r.work_pct) || 0);
  const self   = rows.map(r => Number(r.self_pct) || 0);

  // 가로 폭 계산 (막대당 px)
  const PX_PER_BAR = 56;
  const minWidth   = el.chartScroll.clientWidth;
  const targetWidth = Math.max(minWidth, Math.ceil(labels.length * PX_PER_BAR));

  // 스크롤 래퍼 폭 확장
  el.chartInner.style.width = targetWidth + "px";

  // 캔버스 CSS/픽셀 크기 동기화(차트 축소 이슈 해결)
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssH = 260;
  el.stackedCanvas.style.width  = targetWidth + "px";
  el.stackedCanvas.style.height = cssH + "px";
  el.stackedCanvas.width  = Math.floor(targetWidth * dpr);
  el.stackedCanvas.height = Math.floor(cssH * dpr);

  if (stackedChart) { stackedChart.destroy(); stackedChart = null; }

  stackedChart = new Chart(el.stackedCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "작업이력(최대 80)", data: work, stack: "pci" },
        { label: "자가체크(최대 20)", data: self, stack: "pci" }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: { enabled: true },
        datalabels: {
          display: labels.length <= 30,
          anchor: "end",
          align: "end",
          formatter: v => `${(Number.isFinite(v) ? v : 0).toFixed(1)}%`,
          color: "#333",
          clamp: true
        }
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          min: 0, max: 100,
          ticks: { callback: v => v + "%" }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function sortPersonRows(){
  const mode = el.sortBy.value;
  const rows = currentRows || [];
  if (mode === "pci_desc") rows.sort((a,b)=>b.pci_pct - a.pci_pct || b.total_count - a.total_count);
  else if (mode === "work_desc") rows.sort((a,b)=>b.work_pct - a.work_pct || b.total_count - a.total_count);
  else if (mode === "count_desc") rows.sort((a,b)=>b.total_count - a.total_count || b.pci_pct - a.pci_pct);
  else if (mode === "item_asc") rows.sort((a,b)=>a.item.localeCompare(b.item,'ko'));
}

function renderPersonTable(){
  const q = el.searchItem.value.trim().toLowerCase();
  const rows = (currentRows||[]).filter(r=>!q || r.item.toLowerCase().includes(q));

  const groups = new Map();
  for (const r of rows){
    const cat = getCategory(r.item);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(r);
  }

  const frag = document.createDocumentFragment();
  for (const [cat, list] of groups){
    const hr = document.createElement("tr");
    hr.className = "cat-row";
    const td = document.createElement("td");
    td.colSpan = 10;
    td.innerHTML = `<strong>${esc(cat)}</strong>`;
    hr.appendChild(td);
    frag.appendChild(hr);

    for (const r of list){
      const badgeClass = r.pci_pct >= 80 ? "ok" : (r.pci_pct >= 50 ? "mid" : "bad");
      const tr = document.createElement("tr");
      tr.className = "row-click";
      tr.setAttribute("data-item", r.item);
      tr.innerHTML = `
        <td><span class="badge">${esc(cat)}</span></td>
        <td>${esc(r.item)}</td>
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
  }
  el.tbody.innerHTML = ""; el.tbody.appendChild(frag);
}

function exportPersonXlsx(){
  if (!currentRows?.length) return alert("내보낼 데이터가 없습니다.");

  const aoa = [["중분류","항목","기준","main","support","교육","총횟수","작업이력(80%)","자가(20%)","PCI(%)"]];
  for (const r of currentRows){
    aoa.push([
      getCategory(r.item), r.item, r.baseline,
      r.main_count, r.support_count, r.add_count, r.total_count,
      Number(pct(r.work_pct)), Number(pct(r.self_pct)), Number(pct(r.pci_pct))
    ]);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, currentSummary?.worker || "PERSON");
  const name = (currentSummary?.worker || "worker") + "_HDW_PCI.xlsx";
  XLSX.writeFile(wb, name);
}

// ===== 산출 근거 모달 (아코디언) =====
async function openBreakdown(worker, item){
  try{
    const url = `/api/pci/hdw/worker/${encodeURIComponent(worker)}/item/${encodeURIComponent(item)}`;
    const { data } = await axios.get(url);

    // <br>만 통과시키고 나머지는 escape
    function escapeAllowBr(html){
      const s = String(html ?? "");
      const token = "__BR__TOKEN__";
      return s
        .replace(/<br\s*\/?>/gi, token)
        .replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
        .replaceAll(token, "<br>");
    }

    const logsHtml = (data.logs && data.logs.length)
      ? `
         <div class="table-scroll">
           <table class="table" style="min-width: 980px">
             <thead>
               <tr>
                 <th>작업한 날짜</th>
                 <th>설비 이름</th>
                 <th>설비 종류</th>
                 <th>작업명</th>
                 <th>작업자</th>
                 <th style="width:240px">작업 내용</th>
               </tr>
             </thead>
             <tbody>
               ${data.logs.map(l=>{
                 const dateStr = l.task_date ? dayjs(l.task_date).format("YYYY-MM-DD") : "-";
                 const eqName  = l.equipment_name ? String(l.equipment_name).trim() : "-";
                 const eqType  = l.equipment_type ? String(l.equipment_type).trim() : "-";
                 const tName   = l.task_name ? String(l.task_name).trim() : "-";
                 const tMen    = l.task_man ?? l.task_man_raw ?? "";
                 const descHtml= escapeAllowBr(l.task_description ?? "");
                 return `
                   <tr>
                     <td>${dateStr}</td>
                     <td>${esc(eqName)}</td>
                     <td>${esc(eqType)}</td>
                     <td>${esc(tName)}</td>
                     <td>${esc(tMen)}</td>
                     <td>
                       <details class="desc">
                         <summary>펼쳐보기</summary>
                         <div class="desc-body">${descHtml || "-"}</div>
                       </details>
                     </td>
                   </tr>`;
               }).join("")}
             </tbody>
           </table>
         </div>`
      : `<div class="hint">참여한 작업 로그가 없습니다.</div>`;

    const box = `
      <div class="modal-body">
        <div class="modal-sec">
          <h4>요약</h4>
          <div class="kv">
            <div class="k">작업자</div><div class="v"><strong>${esc(worker)}</strong></div>
            <div class="k">항목</div><div class="v"><strong>${esc(data.item)}</strong> <span class="badge">${esc(getCategory(data.item))}</span></div>
            <div class="k">기준 작업 수</div><div class="v">${data.baseline}</div>
            <div class="k">카운트</div>
            <div class="v">main ${data.totals.main_count}, support ${data.totals.support_count}, 교육 ${data.totals.add_count} → <strong>총 ${data.totals.total_count}</strong></div>
            <div class="k">자가체크</div>
            <div class="v">컬럼 <code class="mono">${esc(data.self_check.column)}</code> 값 <strong>${data.self_check.value}</strong> → ${data.self_check.granted20? "20% 부여":"0%"}</div>
            <div class="k">계산식</div>
            <div class="v mono">${esc(data.percentages.formula)}</div>
            <div class="k">결과</div>
            <div class="v">작업이력 <strong>${pct(data.percentages.work_pct)}%</strong> + 자가 <strong>${pct(data.percentages.self_pct)}%</strong> = <strong>${pct(data.percentages.pci_pct)}%</strong></div>
          </div>
        </div>
        <div class="modal-sec span-2">
          <h4>참여 작업 로그</h4>
          ${logsHtml}
        </div>
      </div>
    `;
    showModal(`산출 근거 — ${esc(worker)} / ${esc(item)}`, box);

  }catch(e){
    console.error("상세 조회 실패:", e);
    alert("상세를 불러오지 못했습니다.");
  }
}

function showModal(title, bodyHtml){
  el.modalTitle.textContent = title;
  el.modalBody.innerHTML = bodyHtml;
  document.body.classList.add("modal-open");
  el.overlay.classList.add("show");
  el.modal.classList.add("show");
}
function hideModal(){
  document.body.classList.remove("modal-open");
  el.overlay.classList.remove("show");
  el.modal.classList.remove("show");
}

// baseline 추출(데이터에서 첫 개체 사용)
function getBaseline(item){
  const d = matrixData[item] || {};
  const first = Object.values(d)[0];
  return first?.baseline ?? "";
}
