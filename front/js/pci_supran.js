/* ==========================================================================
   SUPRA N PCI — 매트릭스/개인 보기 + 상단 "바로가기" 컨트롤
   ========================================================================== */

const API_BASE = "";

/* -------------------- ▼ 추가: 그룹별 설비 옵션 + URL 매핑 ------------------- */
// 그룹 선택에 따른 설비 필드 업데이트 옵션
const equipmentOptions = {
  "": ["SUPRA N", "SUPRA XP", "INTEGER", "PRECIA", "ECOLITE", "GENEVA", "HDW"],
  "PEE1": ["SUPRA N", "SUPRA XP"],
  "PEE2": ["INTEGER", "PRECIA"],
  "PSKH": ["ECOLITE", "GENEVA", "HDW"]
};

// 설비와 작업 종류에 따른 URL 매핑
const urlMapping = {
  "SUPRA N":   { "SET UP": "pci_supran_setup.html",   "MAINTENANCE": "pci_supran.html" },
  "SUPRA XP":  { "SET UP": "pci_supraxp_setup.html",  "MAINTENANCE": "pci_supraxp.html" },
  "INTEGER":   { "SET UP": "pci_integer_setup.html",  "MAINTENANCE": "pci_integer.html" },
  "PRECIA":    { "SET UP": "pci_precia_setup.html",   "MAINTENANCE": "pci_precia.html" },
  "ECOLITE":   { "SET UP": "pci_ecolite_setup.html",  "MAINTENANCE": "pci_ecolite.html" },
  "GENEVA":    { "SET UP": "pci_geneva_setup.html",   "MAINTENANCE": "pci_geneva.html" },
  "HDW":       { "SET UP": "pci_hdw_setup.html",      "MAINTENANCE": "pci_hdw.html" }
};
/* -------------------- ▲ 추가 끝 ------------------------------------------- */

// ===== 전역 상태 =====
let workerNames = [];
let stackedChart = null;

/* ▼ 추가: 직원/현장 필터 상태 */
const filterState = {
  company: "",
  group: "",
  site: "",
  activeOnly: true, // 재직자만 기본 on
};
/* ▲ 추가 끝 */

// 매트릭스 상태
let matrixItems = [];
let matrixWorkers = [];
let matrixData = {};
let workerAvgMap = {};
let collapsedCats = new Set();

// 개인 보기 상태
let currentRows = [];
let currentSummary = null;

/* ▼ 추가: 쿼리스트링 생성기 */
function toQuery(params){
  const q = new URLSearchParams(params);
  return q.toString();
}
function currentFilterQuery(){
  return toQuery({
    company: filterState.company || "",
    group: filterState.group || "",
    site: filterState.site || "",
    activeOnly: filterState.activeOnly ? 1 : 0,
  });
}
/* ▲ 추가 끝 */

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

  // goto controls (NEW)
  selGroup: $("selGroup"),
  selEquipment: $("selEquipment"),
  selWorkType: $("selWorkType"),
  btnGoto: $("btnGoto"),
  gotoPreview: $("gotoPreview"),
};

// ===== 카테고리 정의 =====
const CATEGORIES = [
  { category: "ESCORT",             items: ["LP ESCORT","ROBOT ESCORT"] },
  { category: "EFEM ROBOT",         items: ["SR8241 TEACHING","SR8240 TEACHING","M124 TEACHING","EFEM FIXTURE","EFEM ROBOT REP","EFEM ROBOT CONTROLLER REP"] },
  { category: "TM ROBOT",           items: ["SR8250 TEACHING","SR8232 TEACHING","TM FIXTURE", "TM ROBOT REP","TM ROBOT CONTROLLER REP","PASSIVE PAD REP"] },
  { category: "BM MODULE",          items: ["PIN CYLINDER","PUSHER CYLINDER","IB FLOW","DRT"] },
  { category: "FFU (EFEM, TM)",     items: ["FFU CONTROLLER","FAN","MOTOR DRIVER"] },
  { category: "FCIP",               items: ["R1","R3","R5","R3 TO R5","PRISM"] },
  { category: "MICROWAVE",          items: ["MICROWAVE","APPLICATOR","GENERATOR"] },
  { category: "CHUCK",              items: ["CHUCK"] },
  { category: "PROCESS KIT",        items: ["PROCESS KIT"] },
  { category: "LEAK",               items: ["HELIUM DETECTOR"] },
  { category: "PIN",                items: ["HOOK LIFT PIN","BELLOWS","PIN SENSOR","LM GUIDE","PIN MOTOR CONTROLLER"] },
  { category: "EPD",                items: ["SINGLE EPD","DUAL EPD"] },
  { category: "BOARD",              items: ["GAS BOX BOARD","TEMP CONTROLLER BOARD","POWER DISTRIBUTION BOARD","DC POWER SUPPLY","BM SENSOR","PIO SENSOR","SAFETY MODULE","IO BOX","FPS BOARD","D-NET"] },
  { category: "IGS BLOCK",          items: ["MFC","VALVE"] },
  { category: "VALVE",              items: ["SOLENOID","FAST VAC VALVE","SLOW VAC VALVE","SLIT DOOR","APC VALVE","SHUTOFF VALVE"] },
  { category: "ETC",                items: ["BARATRON ASS'Y","PIRANI ASS'Y","VIEW PORT QUARTZ","FLOW SWITCH","CERAMIC PLATE","MONITOR","KEYBOARD","MOUSE","HEATING JACKET","WATER LEAK DETECTOR","MANOMETER"] },
  { category: "CTR",                items: ["CTC","PMC","EDA","EFEM CONTROLLER","TEMP LIMIT CONTROLLER","TEMP CONTROLLER"] },
  { category: "S/W",                items: ["S/W PATCH"] },
];
const ITEM_TO_CAT = (()=>{ const m={}; for(const g of CATEGORIES) for(const it of g.items) m[it]=g.category; return m; })();
const getCategory = (item)=> ITEM_TO_CAT[item] || "-";

// ===== Utils =====
const ESC_RE  = /[&<>"']/g;
const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
function esc(s){ s = (s==null)?'':String(s); return s.replace(ESC_RE, ch=>ESC_MAP[ch]||ch); }
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
function fadeInBox(box){ box?.classList.remove("fade-in"); void box?.offsetWidth; box?.classList.add("fade-in"); }

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
  // ▼ NEW: 바로가기 컨트롤 바인딩
  initGotoControls();
  await initEmployeeFilters();

  bindTabs();
  bindMatrixEvents();
  bindPersonEvents();

  // 모달 close
  el.modalClose.addEventListener("click", hideModal);
  el.overlay.addEventListener("click", hideModal);
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape") hideModal(); });

  await loadWorkerList();
  await buildMatrix();

  // 매트릭스 셀 상세
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

/* ======================= NEW: Goto Controls =============================== */
function initGotoControls(){
  // 장비 select 채우기 (초기: 그룹 전체)
  fillEquipmentOptions(el.selGroup.value || "");

  // 이벤트 바인딩
  el.selGroup?.addEventListener("change", ()=>{
    fillEquipmentOptions(el.selGroup.value || "");
    updateGotoPreview();
  });
  el.selEquipment?.addEventListener("change", updateGotoPreview);
  el.selWorkType?.addEventListener("change", updateGotoPreview);

  // 버튼 클릭/Enter 처리
  el.btnGoto?.addEventListener("click", navigateBySelection);
  [el.selGroup, el.selEquipment, el.selWorkType].forEach(s => {
    s?.addEventListener("keydown", (e)=>{
      if (e.key === "Enter" && !el.btnGoto.disabled) navigateBySelection();
    });
  });

  // 초기 미리보기
  updateGotoPreview();
}

function fillEquipmentOptions(group){
  const list = equipmentOptions[group] || [];
  const equip = el.selEquipment;
  if (!equip) return;

  equip.innerHTML = list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");

  // 이전 선택 유지가 불가능하면 첫 값으로
  if (!list.includes(equip.value)) equip.value = list[0] || "";
}

function computeTargetHref(){
  const equipment = el.selEquipment?.value || "";
  const workType  = el.selWorkType?.value || "";
  const map = urlMapping[equipment] || null;
  return map ? map[workType] || "" : "";
}

function updateGotoPreview(){
  const href = computeTargetHref();
  const preview = el.gotoPreview;
  const btn = el.btnGoto;

  if (!href){
    btn.disabled = true;
    preview.textContent = "매핑된 페이지가 없습니다.";
    preview.removeAttribute("href");
  } else {
    btn.disabled = false;
    preview.textContent = `이동 대상: ${href}`;
    preview.setAttribute("href", href);
  }
}

function navigateBySelection(){
  const href = computeTargetHref();
  if (!href){
    alert("해당 조합에 매핑된 페이지가 없습니다.");
    return;
  }
  // 동일 탭 이동 (요청사항: '바로 이 링크로 옮겨갈 수 있는 버튼')
  window.location.href = href;
}
/* ======================= Goto Controls 끝 ================================ */

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
    const res = await axios.get(`/api/pci/supra-n/workers?${currentFilterQuery()}`);
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
    const res = await axios.get(`/api/pci/supra-n/matrix?${currentFilterQuery()}`);
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
    matrixWorkers.sort((a,b)=>(workerAvgMap[b]??0)-(workerAvgMap[a]??0) || a.localeCompare(b,'ko'));
  }
}

function computeVisibleAverages(shownItems, shownWorkers){
  const perWorker = {};
  const totalItems = shownItems.length;
  let sumAll = 0;

  for (const w of shownWorkers){
    let s = 0;
    for (const it of shownItems){
      const v = Number(matrixData[it]?.[w]?.pci);
      s += Number.isFinite(v) ? v : 0;
    }
    perWorker[w] = totalItems > 0 ? (s / totalItems) : null;
    sumAll += s;
  }
  const denom = totalItems * shownWorkers.length;
  const overall = denom > 0 ? (sumAll / denom) : null;
  return { perWorker, overall };
}

function syncStickyOffsets(){
  const headRow = el.matrixThead.querySelector("tr.header-row");
  if (headRow) {
    const h = Math.ceil(headRow.getBoundingClientRect().height);
    el.matrixTable.style.setProperty("--thead-h", h + "px");
  }
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

  const { perWorker, overall } = computeVisibleAverages(shownItems, shownWorkers);

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

  const frag = document.createDocumentFragment();
  for (const grp of CATEGORIES){
    const its = grp.items
      .filter(it => matrixItems.includes(it))
      .filter(it => !qItem || it.toLowerCase().includes(qItem));
    if (!its.length) continue;

    const catTr = document.createElement("tr");
    catTr.className = "cat-row" + (collapsedCats.has(grp.category) ? " collapsed" : "");
    catTr.setAttribute("data-cat", grp.category);
    const catTd = document.createElement("td");
    catTd.colSpan = 2 + shownWorkers.length;
    catTd.innerHTML = `<span class="caret">▶</span>${esc(grp.category)}`;
    catTr.appendChild(catTd);
    frag.appendChild(catTr);

    if (collapsedCats.has(grp.category)) continue;

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

  const { perWorker } = computeVisibleAverages(items.map(r=>r.item), workers);

  const header = ["중분류","작업 항목","기준", ...workers];
  const aoa = [header];

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
  XLSX.utils.book_append_sheet(wb, ws, "SUPRA N PCI");
  XLSX.writeFile(wb, "SUPRAN_PCI_MATRIX.xlsx");
}

// ===== 개인 보기 =====
function bindPersonEvents(){
  el.btnFetch.addEventListener("click", onFetchPerson);
  el.btnCsv.addEventListener("click", exportPersonXlsx);
  el.searchItem.addEventListener("input", debounce(()=> showBusy(el.personTableScroll, renderPersonTable), 120));
  el.sortBy.addEventListener("change", ()=>{ sortPersonRows(); showBusy(el.personTableScroll, renderPersonTable); });

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
    const res = await axios.get(`/api/pci/supra-n/worker/${encodeURIComponent(name)}?${currentFilterQuery()}`);
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
  const n = rows.length;
  const sumWork = rows.reduce((s,r)=> s + (Number(r.work_pct)||0), 0);
  const sumPci  = rows.reduce((s,r)=> s + (Number(r.pci_pct)||0),  0);

  el.avgWork.textContent = pct(sumWork / n);
  el.avgPci.textContent  = pct(sumPci  / n);
  el.itemsCnt.textContent = n;

  const cntSub = document.querySelector('.cards .card.stat:nth-child(3) .sub');
  if (cntSub) cntSub.textContent = '모든 항목 포함(0% 포함)';
}

function renderPersonChart(){
  const rows = (currentRows || []).slice();
  rows.sort((a,b)=> b.pci_pct - a.pci_pct || b.total_count - a.total_count);

  const labels = rows.map(r => r.item);
  const work   = rows.map(r => Number(r.work_pct) || 0);
  const self   = rows.map(r => Number(r.self_pct) || 0);

  const PX_PER_BAR = 56;
  const minWidth   = el.chartScroll.clientWidth;
  const targetWidth = Math.max(minWidth, Math.ceil(labels.length * PX_PER_BAR));

  el.chartInner.style.width = targetWidth + "px";

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
  const name = (currentSummary?.worker || "worker") + "_SUPRAN_PCI.xlsx";
  XLSX.writeFile(wb, name);
}

// ===== 산출 근거 모달 =====
async function openBreakdown(worker, item){
  try{
    const url = `/api/pci/supra-n/worker/${encodeURIComponent(worker)}/item/${encodeURIComponent(item)}`;
    const { data } = await axios.get(url);

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


/* ▼ 추가: 상단 COMPANY/GROUP/SITE/재직 체크 UI 초기화 */
async function initEmployeeFilters(){
  const $box = document.querySelector(".filters");
  if(!$box){ console.warn("[filters] .filters 컨테이너가 없습니다."); return; }

  // 서버에서 옵션 받아오기
  // (백엔드: GET /api/userdb/filters → {companies, groups, sites})
  let companies = [], groups = [], sites = [];
  try{
    const { data } = await axios.get(`/api/userdb/filters`);
    companies = data?.companies || [];
    groups    = data?.groups    || [];
    sites     = data?.sites     || [];
  }catch(e){
    console.warn("필터 옵션 로드 실패:", e);
  }

  // UI 렌더
  $box.innerHTML = `
    <div class="filter-row">
      <label>COMPANY
        <select id="fltCompany">
          <option value="">전체</option>
          ${companies.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}
        </select>
      </label>
      <label>GROUP
        <select id="fltGroup">
          <option value="">전체</option>
          ${groups.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}
        </select>
      </label>
      <label>SITE
        <select id="fltSite">
          <option value="">전체</option>
          ${sites.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}
        </select>
      </label>
      <label class="chk">
        <input type="checkbox" id="chkActive" checked />
        재직자만
      </label>
      <button id="btnApplyFilters" class="btn primary" type="button">적용</button>
      <button id="btnResetFilters" class="btn" type="button">초기화</button>
    </div>
  `;

  // 초기값 주입 (localStorage 복원 가능)
  const ls = JSON.parse(localStorage.getItem("supraN_pci_filters")||"{}");
  Object.assign(filterState, {
    company: ls.company ?? filterState.company,
    group:   ls.group   ?? filterState.group,
    site:    ls.site    ?? filterState.site,
    activeOnly: (typeof ls.activeOnly==="boolean") ? ls.activeOnly : filterState.activeOnly,
  });

  const $c = document.getElementById("fltCompany");
  const $g = document.getElementById("fltGroup");
  const $s = document.getElementById("fltSite");
  const $a = document.getElementById("chkActive");

  if($c) $c.value = filterState.company || "";
  if($g) $g.value = filterState.group   || "";
  if($s) $s.value = filterState.site    || "";
  if($a) $a.checked = !!filterState.activeOnly;

  // 변경 → 상태 반영만 (즉시 호출은 '적용' 버튼에서)
  const onChange = ()=>{
    filterState.company   = $c?.value || "";
    filterState.group     = $g?.value || "";
    filterState.site      = $s?.value || "";
    filterState.activeOnly= !!$a?.checked;
  };
  [$c,$g,$s,$a].forEach(elm=>elm?.addEventListener("change", onChange));

  // 적용 버튼: 워커 목록/매트릭스 재조회
  document.getElementById("btnApplyFilters")?.addEventListener("click", async ()=>{
    onChange();
    localStorage.setItem("supraN_pci_filters", JSON.stringify(filterState));
    await loadWorkerList();   // 자동완성도 필터 반영
    await buildMatrix();      // 매트릭스 갱신
  });

  // 초기화 버튼
  document.getElementById("btnResetFilters")?.addEventListener("click", async ()=>{
    filterState.company = ""; filterState.group = ""; filterState.site = ""; filterState.activeOnly = true;
    $c.value=""; $g.value=""; $s.value=""; $a.checked=true;
    localStorage.removeItem("supraN_pci_filters");
    await loadWorkerList();
    await buildMatrix();
  });
}
/* ▲ 추가 끝 */
