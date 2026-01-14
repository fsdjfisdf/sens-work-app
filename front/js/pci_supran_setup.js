/* ==========================================================================
   PRECIA SETUP PCI — 전체 보기(매트릭스) + 개인 보기
   - 80% 작업이력 + 20% 자가체크(다중 항목 합산) 동일 로직
   - 서버 엔드포인트(가정): /api/pci/precia-setup/*
   - 매트릭스/개인 보기 모두 "0% 항목 포함" 평균
   ========================================================================== */

const API_BASE = "/api/pci/supran-setup";

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

// ==== 상수/맵 ====
const DISPLAY_BASELINE = {
  "INSTALLATION PREPARATION": 5,
  "FAB IN": 5,
  "DOCKING": 10,
  "CABLE HOOK UP": 10,
  "POWER TURN ON": 10,
  "UTILITY TURN ON": 2.5,
  "GAS TURN ON": 2.5,
  "TEACHING": 30,
  "PART INSTALLATION": 2.5,
  "LEAK CHECK": 2.5,
  "TTTM": 10,
  "CUSTOMER CERTIFICATION": 5,
  "PROCESS CONFIRM": 5

};

// 오타/언더바 → 표시명 정규화
const ALIASES = {
  "INSTALLATION_PREPERATION": "INSTALLATION PREPARATION", // DB 컬럼 오타 보정
  "INSTALLATION_PREPARATION": "INSTALLATION PREPARATION",
  "FAB_IN": "FAB IN",
  "CABLE_HOOK_UP": "CABLE HOOK UP",
  "POWER_TURN_ON": "POWER TURN ON",
  "UTILITY_TURN_ON": "UTILITY TURN ON",
  "GAS_TURN_ON": "GAS TURN ON",
  "PART_INSTALLATION": "PART INSTALLATION",
  "LEAK_CHECK": "LEAK CHECK",
  "CUSTOMER_CERTIFICATION": "CUSTOMER CERTIFICATION",
  "PROCESS_CONFIRM": "PROCESS CONFIRM",
  "TTTM": "TTTM",
  "TEACHING": "TEACHING",
  "DOCKING": "DOCKING"
};

function normItem(s) {
  if (!s) return "";
  const u = String(s).trim().toUpperCase().replace(/_/g, " ");
  return ALIASES[s] || ALIASES[u] || u;
}

function getBaseline(itemDisplayName) {
  return DISPLAY_BASELINE[itemDisplayName] ?? "";
}

// 보기 그룹(좌측 중분류)
const GROUPS = [
  { category: "PREP & FAB IN", items: ["INSTALLATION PREPARATION", "FAB IN"] },
  { category: "DOCK & CABLE", items: ["DOCKING", "CABLE HOOK UP"] },
  { category: "TURN ON", items: ["POWER TURN ON", "UTILITY TURN ON", "GAS TURN ON"] },
  { category: "TEACHING", items: ["TEACHING"] },
  { category: "PARTS & LEAK", items: ["PART INSTALLATION", "LEAK CHECK"] },
  { category: "TTTM", items: ["TTTM"] },
  { category: "CERT & PROCESS", items: ["CUSTOMER CERTIFICATION", "PROCESS CONFIRM"] }
];

// === DOM 참조 ===
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

// === 상태 ===
let workerNames = [];
let matrixItems = [];
let matrixWorkers = [];
let matrixData = {};   // data[item][worker] = {pci, work, self, total_count, main_count, support_count, add_count, baseline}
let workerAvgMap = {}; // worker -> 평균 PCI
let stackedChart = null;
let collapsedCats = new Set();

const filterState = {
  company: "",
  group: "",
  site: "",
  activeOnly: true,
};

function currentFilterQuery(){
  const activeNum = filterState.activeOnly ? 1 : 0;

  const q = new URLSearchParams({
    company: filterState.company || "",
    group:   filterState.group   || "",
    site:    filterState.site    || "",
    activeOnly: String(activeNum),

    // 호환 키
    company_name: filterState.company || "",
    group_name:   filterState.group   || "",
    site_name:    filterState.site    || "",
    active_only:  String(activeNum),

    active: String(activeNum),
    active_bool: filterState.activeOnly ? "true" : "false",
    active_yesno: filterState.activeOnly ? "yes" : "no",
  });

  return q.toString();
}
window.currentFilterQuery = currentFilterQuery;


// === 유틸 ===
const ESC_RE  = /[&<>"']/g;
const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
const esc = (s) => String(s ?? "").replace(ESC_RE, ch => ESC_MAP[ch] || ch);
const debounce = (fn, ms=200)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
const pct = (n)=> (Number.isFinite(n)?n:0).toFixed(1);
const heatClass = (p)=> `h${Math.max(0, Math.min(10, Math.round((p||0)/10)))}`;

function startLine(box){ box?.classList.add("is-loading"); }
function stopLine(box){ box?.classList.remove("is-loading"); }
function fadeInBox(box){ box?.classList.remove("fade-in"); void box?.offsetWidth; box?.classList.add("fade-in"); }

// === 초기화 ===
document.addEventListener("DOMContentLoaded", async () => {
  // ▼ NEW: 바로가기 컨트롤 바인딩
initGotoControls();

  bindTabs();
  bindMatrixEvents();
  bindPersonEvents();

  // 모달 close
  el.modalClose.addEventListener("click", hideModal);
  el.overlay.addEventListener("click", hideModal);
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape") hideModal(); });

  await loadWorkerList();
  await buildMatrix();

  // matrix 셀 클릭 → 상세
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
});

/* ======================= NEW: Goto Controls =============================== */
function initGotoControls(){
  // 장비 select 채우기 (초기: 그룹 전체)
  fillEquipmentOptions(el.selGroup?.value || "");
  

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

// === 탭 ===
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

// === 매트릭스 ===
function bindMatrixEvents(){
  el.btnReloadMatrix.addEventListener("click", ()=>buildMatrix());
  el.btnMatrixCsv.addEventListener("click", exportMatrixXlsx);
  el.filterItem.addEventListener("input", debounce(()=> renderMatrix(), 120));
  el.filterWorker.addEventListener("input", debounce(()=> renderMatrix(), 120));
  el.sortWorkers.addEventListener("change", ()=>{ sortMatrixWorkers(); renderMatrix(); });
  el.density.addEventListener("change", toggleDensity);
  el.colWidth.addEventListener("input", applyColumnWidth);
}

async function loadWorkerList(){
  try{
    const res = await axios.get(`${API_BASE}/workers`);
    workerNames = (res.data?.workers || [])
      .map(x => String(x).trim())
      .filter(Boolean);

    if (window.filterActiveWorkers) {
      workerNames = window.filterActiveWorkers(workerNames);
    }

    workerNames.sort((a,b)=>a.localeCompare(b,'ko'));
    el.workerList.innerHTML = workerNames.map(n=>`<option value="${esc(n)}"></option>`).join("");
  }catch(err){
    console.error("[SETUP PCI] 작업자 목록 로드 실패:", err);
    workerNames = [];
  }
}



function renderMatrixSkeleton(rowCount=10, workerCount=12){
  const tr = document.createElement("tr");
  tr.className = "header-row";
  tr.innerHTML = `
    <th class="item-col">그룹</th>
    <th class="item-col">카테고리</th>
    ${Array.from({length: workerCount}).map((_,i)=>`<th class="worker-col" data-col="${2+i}"><div class="sk sk-line"></div></th>`).join("")}
  `;
  el.matrixThead.innerHTML = ""; el.matrixThead.appendChild(tr);

  const frag = document.createDocumentFragment();
  for (let r=0;r<rowCount;r++){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="item-col"><div class="sk sk-tag"></div></td>
      <td class="item-col"><div class="sk sk-text"></div><div class="sk sk-tiny"></div></td>
      ${Array.from({length: workerCount}).map((_,i)=>`<td class="worker-col" data-col="${2+i}"><div class="sk sk-cell"></div></td>`).join("")}
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
    const res = await axios.get(`${API_BASE}/matrix`);
    const { workers, items, data, worker_avg_pci } = res.data || {};
    matrixWorkers = (workers || []).slice();

if (window.filterActiveWorkers) {
  matrixWorkers = window.filterActiveWorkers(matrixWorkers);
}
    matrixItems = (items || []).map(normItem);
    matrixData = data || {};
    workerAvgMap = worker_avg_pci || {};
    sortMatrixWorkers();
    renderMatrix(true);
    toggleDensity();
    applyColumnWidth();
    fadeInBox(el.matrixWrap);
  }catch(e){
    console.error("[SETUP PCI] 매트릭스 로드 실패:", e);
    alert("매트릭스 로드 중 오류가 발생했습니다.");
  }finally{
    el.matrixLoading.classList.add("hidden");
    setTimeout(()=>stopLine(el.matrixWrap), 280);
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

function renderMatrix(first=false){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const shownWorkers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const shownItems = [];
  for (const grp of GROUPS){
    for (const it of grp.items){
      if (!matrixItems.includes(it)) continue;
      if (qItem && !it.toLowerCase().includes(qItem)) continue;
      shownItems.push(it);
    }
  }

  const { perWorker, overall } = computeVisibleAverages(shownItems, shownWorkers);

  // thead (헤더 + 요약행)
  const headRow = document.createElement("tr");
  headRow.className = "header-row";
  headRow.innerHTML = `
    <th class="item-col" data-col="0">그룹</th>
    <th class="item-col" data-col="1">카테고리</th>
    ${shownWorkers.map((w,i)=>`
      <th class="worker-col ${i>0 && i%5===0 ? "block-start" : ""}" data-col="${2+i}">
        <div class="wname" title="${esc(Number.isFinite(perWorker[w])?`현재 보기 평균 ${pct(perWorker[w])}%`:`데이터 없음`)}">${esc(w)}</div>
      </th>
    `).join("")}
  `;

  const sumRow = document.createElement("tr");
  sumRow.className = "summary-row";
  sumRow.innerHTML = `
    <th class="item-col sum-col" data-col="0"></th>
    <th class="item-col sum-col" data-col="1">
      ${Number.isFinite(overall) ? `<span class="badge b-total">전체 평균 ${pct(overall)}%</span>` : `<span class="badge">데이터 없음</span>`}
    </th>
    ${shownWorkers.map((w,i)=>{
      const v = perWorker[w];
      const cls = Number.isFinite(v) ? (v>=80?"ok":(v>=50?"mid":"bad")) : "";
      return `
        <th class="worker-col sum-col ${i>0 && i%5===0 ? "block-start" : ""}" data-col="${2+i}">
          ${Number.isFinite(v) ? `<span class="badge ${cls}">${pct(v)}%</span>` : `<span class="badge">-</span>`}
        </th>`;
    }).join("")}
  `;

  el.matrixThead.innerHTML = "";
  el.matrixThead.appendChild(headRow);
  el.matrixThead.appendChild(sumRow);

  // tbody
  const frag = document.createDocumentFragment();
  for (const grp of GROUPS){
    const its = grp.items
      .filter(it => matrixItems.includes(it))
      .filter(it => !qItem || it.toLowerCase().includes(qItem));
    if (!its.length) continue;

    const catTr = document.createElement("tr");
    catTr.className = "cat-row";
    const td = document.createElement("td");
    td.colSpan = 2 + shownWorkers.length;
    td.innerHTML = `<strong>${esc(grp.category)}</strong>`;
    catTr.appendChild(td);
    frag.appendChild(catTr);

    for (const item of its){
      const tr = document.createElement("tr");
      const tdGroup = document.createElement("td");
      tdGroup.className = "item-col"; tdGroup.dataset.col = 0;
      tdGroup.innerHTML = `<span class="badge">${esc(grp.category)}</span>`;

      const tdItem = document.createElement("td");
      tdItem.className = "item-col"; tdItem.dataset.col = 1;
      const base = getBaseline(item);
      tdItem.innerHTML = `<div class="item-cell"><strong>${esc(item)}</strong>${base!==""?`<div class="meta">기준 ${esc(base)}</div>`:""}</div>`;

      tr.appendChild(tdGroup); tr.appendChild(tdItem);

      shownWorkers.forEach((w,i)=>{
        const d = (matrixData[item]||{})[w] || null;
        const val = d?.pci ?? 0;
        const td = document.createElement("td");
        td.className = "worker-col";
        td.dataset.col = 2+i;
        if (i>0 && i%5===0) td.classList.add("block-start");
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

  if (first) requestAnimationFrame(syncStickyOffsets);
  toggleDensity();
  applyColumnWidth();
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

// === 개인 보기 ===
function bindPersonEvents(){
  el.btnFetch.addEventListener("click", onFetchPerson);
  el.btnCsv.addEventListener("click", exportPersonXlsx);
  el.searchItem.addEventListener("input", debounce(()=> renderPersonTable(), 120));
  el.sortBy.addEventListener("change", ()=>{ sortPersonRows(); renderPersonTable(); });

  // 행 클릭 → 상세
  el.tbody.addEventListener("click", (e)=>{
    const tr = e.target.closest("tr[data-item]");
    const item = tr?.getAttribute("data-item");
    const w = currentSummary?.worker;
    if (tr && w && item) openBreakdown(w, item);
  });
}

let currentRows = [];
let currentSummary = null;

async function onFetchPerson(){
  const name = el.worker.value.trim();
  if (!name) return alert("작업자를 입력하세요.");
  startLine(el.personTableScroll);
  try{
    const res = await axios.get(`${API_BASE}/worker/${encodeURIComponent(name)}`);
    currentSummary = res.data?.summary || null;
    currentRows = (res.data?.rows || []).map(r=>{
      // 항목명 표준화
      const item = normItem(r.item || r.category || r.name);
      return { ...r, item };
    });
    updateCards();
    sortPersonRows();
    renderPersonChart();
    renderPersonTable();
    fadeInBox(el.personTableScroll);
  }catch(err){
    console.error("[SETUP PCI] 개인 조회 실패:", err);
    alert("조회 중 오류가 발생했습니다.");
  }finally{
    setTimeout(()=>stopLine(el.personTableScroll), 280);
  }
}

function updateCards(){
  const rows = currentRows || [];
  if (!rows.length){
    el.avgWork.textContent="-"; el.avgPci.textContent="-"; el.itemsCnt.textContent="-";
    return;
  }
  const n = rows.length; // 0% 포함
  const sumWork = rows.reduce((s,r)=> s + (Number(r.work_pct)||0), 0);
  const sumPci  = rows.reduce((s,r)=> s + (Number(r.pci_pct)||0),  0);

  el.avgWork.textContent = pct(sumWork / n);
  el.avgPci.textContent  = pct(sumPci  / n);
  el.itemsCnt.textContent = n;
}

function renderPersonChart(){
  const rows = (currentRows || []).slice();
  rows.sort((a,b)=> b.pci_pct - a.pci_pct || b.total_count - a.total_count);

  const labels = rows.map(r => normItem(r.item));
  const work   = rows.map(r => Number(r.work_pct) || 0);
  const self   = rows.map(r => Number(r.self_pct) || 0);

  // 가로 폭
  const PX_PER_BAR = 56;
  const minWidth = el.chartScroll.clientWidth;
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
        { label: "자가체크(최대 20)", data: self,  stack: "pci" }
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
  else if (mode === "item_asc") rows.sort((a,b)=>normItem(a.item).localeCompare(normItem(b.item),'ko'));
}

function renderPersonTable(){
  const q = el.searchItem.value.trim().toLowerCase();
  const rows = (currentRows||[]).filter(r=> !q || normItem(r.item).toLowerCase().includes(q));

  // 그룹핑
  const groups = new Map();
  for (const r of rows){
    const cat = findGroup(normItem(r.item));
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
      const item = normItem(r.item);
      const tr = document.createElement("tr");
      tr.className = "row-click";
      tr.setAttribute("data-item", item);
      tr.innerHTML = `
        <td><span class="badge">${esc(cat)}</span></td>
        <td>${esc(item)}</td>
        <td>${getBaseline(item)}</td>
        <td>${Number(r.main_count ?? 0).toFixed(1)}</td>
        <td>${Number(r.support_count ?? 0).toFixed(1)}</td>
        <td>${Number(r.add_count ?? 0)}</td>
        <td>${Number(r.total_count ?? 0).toFixed(1)}</td>
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
  const aoa = [["그룹","카테고리","기준","main","support","교육","총횟수","작업이력(80%)","자가(20%)","PCI(%)"]];
  for (const r of currentRows){
    const item = normItem(r.item);
    aoa.push([
      findGroup(item), item, getBaseline(item),
      Number(r.main_count ?? 0), Number(r.support_count ?? 0),
      Number(r.add_count ?? 0), Number(r.total_count ?? 0),
      Number(pct(r.work_pct)), Number(pct(r.self_pct)), Number(pct(r.pci_pct))
    ]);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const sheetName = (currentSummary?.worker || "PERSON").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const name = (currentSummary?.worker || "worker") + "_SUPRA_N_SETUP_PCI.xlsx";
  XLSX.writeFile(wb, name);
}

function exportMatrixXlsx(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const workers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const items = [];
  for (const grp of GROUPS){
    for (const it of grp.items){
      if (!matrixItems.includes(it)) continue;
      if (qItem && !it.toLowerCase().includes(qItem)) continue;
      items.push({cat: grp.category, item: it});
    }
  }

  const header = ["그룹","카테고리","기준", ...workers];
  const aoa = [header];

  // 전체 평균(엑셀 첫줄)
  const { perWorker, overall } = computeVisibleAverages(items.map(r=>r.item), workers);
  aoa.push(["-","-","-", ...workers.map(w => Number.isFinite(perWorker[w]) ? Number(pct(perWorker[w])) : "")]);

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
  XLSX.utils.book_append_sheet(wb, ws, "SUPRA N SETUP PCI");
  XLSX.writeFile(wb, "SUPRA_N_SETUP_PCI_MATRIX.xlsx");
}

function findGroup(item){
  for (const g of GROUPS) if (g.items.includes(item)) return g.category;
  return "-";
}

// === 상세 모달 ===
async function openBreakdown(worker, item){
  try{
    const url = `${API_BASE}/worker/${encodeURIComponent(worker)}/item/${encodeURIComponent(item)}`;
    const { data } = await axios.get(url);

    // 서버가 self 세부항목/체크리스트 합산 내역을 내려준다고 가정
    // data.logs: 작업이력 상세, data.self_detail: { total_checked, total_items, checklist: [{key, title, value}] }
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
                const desc    = (l.task_description ?? "").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
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
                        <div class="desc-body">${desc || "-"}</div>
                      </details>
                    </td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`
      : `<div class="hint">참여한 작업 로그가 없습니다.</div>`;

    const checklistHtml = (data.self_detail?.checklist?.length)
      ? `
        <div class="table-scroll">
          <table class="table" style="min-width: 680px">
            <thead>
              <tr><th>키</th><th>설명</th><th>값</th></tr>
            </thead>
            <tbody>
              ${data.self_detail.checklist.map(c => `
                <tr>
                  <td class="mono">${esc(c.key)}</td>
                  <td>${esc(c.title || "")}</td>
                  <td>${Number(c.value ?? 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      : `<div class="hint">해당 카테고리의 자가 체크 항목 합산 내역이 없습니다.</div>`;

    const box = `
      <div class="modal-body">
        <div class="modal-sec">
          <h4>요약</h4>
          <div class="kv">
            <div class="k">작업자</div><div class="v"><strong>${esc(worker)}</strong></div>
            <div class="k">카테고리</div><div class="v"><strong>${esc(item)}</strong> <span class="badge">${esc(findGroup(item))}</span></div>
            <div class="k">기준 작업 수</div><div class="v">${getBaseline(item)}</div>
            <div class="k">카운트</div>
            <div class="v">main ${Number(data.totals?.main_count ?? 0).toFixed(1)}, support ${Number(data.totals?.support_count ?? 0).toFixed(1)}, 교육 ${Number(data.totals?.add_count ?? 0)} → <strong>총 ${Number(data.totals?.total_count ?? 0).toFixed(1)}</strong></div>
            <div class="k">자가체크</div>
            <div class="v">체크 ${Number(data.self_detail?.total_checked ?? 0)} / 항목수 ${Number(data.self_detail?.total_items ?? 0)} → ${Number(data.percentages?.self_pct ?? 0).toFixed(1)}%</div>
            <div class="k">결과</div>
            <div class="v">작업이력 <strong>${pct(data.percentages?.work_pct)}</strong>% + 자가 <strong>${pct(data.percentages?.self_pct)}</strong>% = <strong>${pct(data.percentages?.pci_pct)}</strong>%</div>
          </div>
        </div>
        <div class="modal-sec">
          <h4>자가 체크 합산 내역</h4>
          ${checklistHtml}
        </div>
        <div class="modal-sec span-2">
          <h4>참여 작업 로그</h4>
          ${logsHtml}
        </div>
      </div>
    `;
    showModal(`산출 근거 — ${esc(worker)} / ${esc(item)}`, box);

  }catch(e){
    console.error("[SETUP PCI] 상세 조회 실패:", e);
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

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r=document)=> r.querySelector(s);

  const el = {
    pickWorkerSearch: $("#pickWorkerSearch"),
    workerPicker: $("#workerPicker"),
    compareChips: $("#compareChips"),
    btnRunCompare: $("#btnRunCompare"),
    btnClearCompare: $("#btnClearCompare"),
    btnCompareXlsx: $("#btnCompareXlsx"),

    compareWrap: $("#compareWrap"),
    compareThead: $("#compareThead"),
    compareTbody: $("#compareTbody"),
    compareEmpty: $("#compareEmpty"),

    compareItemSearch: $("#compareItemSearch"),
    compareSort: $("#compareSort"),

    // ✅ 요약(선택 인원 평균 PCI만)
    cmpAvgPci: $("#cmpAvgPci"),

    workerList: $("#worker-list"),
  };

  if (!el.workerPicker || !el.compareThead) return;

  const startLine = (wrap)=> wrap?.classList.add("is-loading");
  const stopLine  = (wrap)=> wrap?.classList.remove("is-loading");

  function readWorkerNamesFromDatalist(){
    const opts = Array.from(el.workerList?.querySelectorAll("option") || []);
    return opts.map(o => (o.value || "").trim()).filter(Boolean);
  }

  let compareData = null; // {names, by_worker, workerAvgPci, selectedAvgPci}
  let allItems = [];

  function pct1(n){
    const v = Number(n);
    return Number.isFinite(v) ? v.toFixed(1) : "0.0";
  }

  function heatClass(p){
    const n = Math.max(0, Math.min(100, Number(p)||0));
    return "h" + Math.round(n/10);
  }

  // ✅ rows로 개인 평균PCI 계산(혹시 bundle이 안 내려줄 때 fallback)
  function calcAvgPciFromRows(rows){
    const arr = Array.isArray(rows) ? rows : [];
    if (!arr.length) return 0;
    const sum = arr.reduce((s,r)=> s + (Number(r.pci_pct)||0), 0);
    return sum / arr.length;
  }

  function getWorkerAvgPci(name){
    // 1) bundle에서 내려온 맵 우선
    if (compareData?.workerAvgPci && compareData.workerAvgPci[name] != null){
      return Number(compareData.workerAvgPci[name]) || 0;
    }

    // 2) summary.avgPci 우선
    const w = (compareData?.by_worker || []).find(x => x.name === name);
    const s = w?.data?.summary;
    if (s && s.avgPci != null) return Number(s.avgPci) || 0;

    // 3) rows 평균 fallback
    return calcAvgPciFromRows(w?.data?.rows);
  }

  function getSelectedAvgPci(){
    // 1) bundle에서 내려온 값 우선
    if (compareData?.selectedAvgPci != null) return Number(compareData.selectedAvgPci) || 0;

    // 2) 이름별 평균의 평균
    const names = compareData?.names || [];
    if (!names.length) return 0;
    const sum = names.reduce((s,n)=> s + getWorkerAvgPci(n), 0);
    return sum / names.length;
  }

  // ✅ 요약 렌더(선택 인원 평균 PCI 1개만)
  function renderCompareSummary(){
    if (!compareData) return;
    const v = getSelectedAvgPci();
    if (el.cmpAvgPci) el.cmpAvgPci.textContent = pct1(v);
  }

  // ===== bundle 생성 =====
  const bundle = new PciGroupBundle({
    storageKey: "PCI_SUPRAN_COMPARE",
    maxNames: 30,
    normalizeName: (n)=> (n||"").trim(),
    host: {
      fetchWorker: async (name) => {
        const res = await axios.get(`${API_BASE}/worker/${encodeURIComponent(name)}`);
        return {
          summary: res.data?.summary || { worker: name },
          rows: res.data?.rows || []
        };
      },
      renderCompare: (result) => {
        // ✅ 1) 안전 가드: result가 null/undefined면 기본값으로
        const safe = result && typeof result === "object" ? result : { names: [], by_worker: [] };

        // ✅ 2) 구조 강제(혹시 undefined 방지)
        safe.names = Array.isArray(safe.names) ? safe.names : [];
        safe.by_worker = Array.isArray(safe.by_worker) ? safe.by_worker : [];

        // ✅ 3) 이제부터 compareData는 절대 null이 아님
        compareData = safe;

        // ✅ 4) 퇴사자 제외 (names / by_worker 둘 다)
        if (window.filterActiveWorkers) {
          compareData.names = window.filterActiveWorkers(compareData.names);
        }
        if (window.isRetiredWorker) {
          compareData.by_worker = compareData.by_worker.filter(w => !window.isRetiredWorker(w?.name));
        }

        // rows에 category 없으면 채움(기존 유지)
        for (const w of compareData.by_worker){
          for (const r of (w.data?.rows||[])){
            const item = normItem(r.item);
            r.item = item; // 표준화된 item로 고정해두는 게 안전
            if (r.category == null) r.category = findGroup(item); // ✅ SET UP 그룹으로 분류
          }
        }

        buildUnionItems();
        renderCompareSummary();
        renderCompareMatrix();

        if (el.compareEmpty) el.compareEmpty.style.display = "none";
        if (el.btnCompareXlsx) el.btnCompareXlsx.disabled = false;
      },
      renderError: (msg) => alert(msg),
      renderLoading: (on) => {
        if (on) startLine(el.compareWrap);
        else setTimeout(()=>stopLine(el.compareWrap), 200);
      }
    }
  });

  bundle.mountUI({
    pickerSearch: el.pickWorkerSearch,
    pickerWrap: el.workerPicker,
    chipsWrap: el.compareChips,
    runBtn: el.btnRunCompare,
    clearBtn: el.btnClearCompare,
    exportBtn: el.btnCompareXlsx,
  });

  setTimeout(()=>{
let names = readWorkerNamesFromDatalist();
if (window.filterActiveWorkers) names = window.filterActiveWorkers(names);
bundle.setAvailableNames(names);
  }, 300);

  function buildUnionItems(){
    const bw = Array.isArray(compareData?.by_worker) ? compareData.by_worker : [];
    const set = new Map();

    for (const w of bw){
      for (const r of (w.data?.rows||[])){
        const raw = String(r.item||"").trim();
        if (!raw) continue;

        const item = normItem(raw);
        const category = r.category ?? findGroup(item);
        const baseline = r.baseline ?? getBaseline(item);

        if (!set.has(item)){
          set.set(item, { item, category, baseline });
        }
      }
    }
    allItems = Array.from(set.values());
  }

  function renderCompareMatrix(){
    if (!compareData) return;

    const q = (el.compareItemSearch?.value || "").trim().toLowerCase();
    const sort = el.compareSort?.value || "cat_then_item";

    let items = allItems.slice();
    if (q) items = items.filter(x =>
      x.item.toLowerCase().includes(q) || String(x.category||"").toLowerCase().includes(q)
    );

    if (sort === "item_asc"){
      items.sort((a,b)=> a.item.localeCompare(b.item, "ko"));
    } else {
      items.sort((a,b)=> String(a.category||"").localeCompare(String(b.category||""),"ko") || a.item.localeCompare(b.item,"ko"));
    }

    // worker->item->row
    const map = new Map();
    for (const w of compareData.by_worker){
      const m = new Map();
      for (const r of (w.data?.rows||[])){
        m.set(String(r.item||"").trim(), r);
      }
      map.set(w.name, m);
    }

    const names = compareData.names || [];

    // ✅ THEAD 2단: (1) 이름행 (2) 인원별 평균 PCI 요약행
    const head1 = `
      <tr class="header-row">
        <th class="item-col">중분류</th>
        <th class="item-col">항목</th>
        <th>기준</th>
        ${names.map(n=> `<th class="worker-col"><span class="wname" title="${n}">${n}</span></th>`).join("")}
      </tr>
    `;

    const overall = getSelectedAvgPci();
    const head2 = `
      <tr class="summary-row">
        <th class="item-col sum-col"></th>
        <th class="item-col sum-col">
          <span class="badge b-total">선택 평균 ${pct1(overall)}%</span>
        </th>
        <th class="sum-col"></th>
        ${names.map(n=>{
          const v = getWorkerAvgPci(n);
          const cls = v >= 80 ? "ok" : (v >= 50 ? "mid" : "bad");
          return `<th class="worker-col sum-col"><span class="badge ${cls}">${pct1(v)}%</span></th>`;
        }).join("")}
      </tr>
    `;

    el.compareThead.innerHTML = head1 + head2;

    let curCat = null;
    const rowsHtml = [];
    for (const it of items){
      if (it.category !== curCat){
        curCat = it.category;
        rowsHtml.push(`<tr class="cat-row"><td colspan="${3 + names.length}"><strong>${curCat}</strong></td></tr>`);
      }

      const cells = names.map(name=>{
        const r = map.get(name)?.get(it.item);
        const p = r ? (Number(r.pci_pct)||0) : 0;
        const cls = heatClass(p);
        const badge = p >= 80 ? "ok" : (p >= 50 ? "mid" : "bad");
        const txt = r ? `${pct1(p)}%` : "-";

        return `
          <td class="worker-col">
            <div class="cell ${cls} cmp-cell"
                 role="button" tabindex="0"
                 data-worker="${name}"
                 data-item="${it.item}"
                 title="${name} · ${it.item}">
              <span class="badge ${badge}">${txt}</span>
            </div>
          </td>
        `;
      }).join("");

      rowsHtml.push(`
        <tr>
          <td class="item-col">${it.category}</td>
          <td class="item-col">${it.item}</td>
          <td>${it.baseline || ""}</td>
          ${cells}
        </tr>
      `);
    }

    el.compareTbody.innerHTML = rowsHtml.join("");
  }

  // 검색/정렬
  el.compareItemSearch?.addEventListener("input", ()=> renderCompareMatrix());
  el.compareSort?.addEventListener("change", ()=> renderCompareMatrix());

  // ✅ 모달: 비교 셀 클릭 → 기존 openBreakdown(worker,item) 그대로 사용(동일 모달)
  el.compareTbody?.addEventListener("click", (e)=>{
    const cell = e.target.closest(".cmp-cell");
    if (!cell) return;

    const worker = cell.getAttribute("data-worker");
    const item = cell.getAttribute("data-item");
    if (!worker || !item) return;

    if (typeof window.openBreakdown === "function"){
      window.openBreakdown(worker, item);
    } else if (typeof openBreakdown === "function"){
      openBreakdown(worker, item);
    } else {
      alert("모달 함수(openBreakdown)를 찾을 수 없습니다.");
    }
  });

  // 키보드 접근성(Enter/Space)
  el.compareTbody?.addEventListener("keydown", (e)=>{
    if (e.key !== "Enter" && e.key !== " ") return;
    const cell = e.target.closest(".cmp-cell");
    if (!cell) return;
    e.preventDefault();

    const worker = cell.getAttribute("data-worker");
    const item = cell.getAttribute("data-item");
    if (!worker || !item) return;

    if (typeof window.openBreakdown === "function"){
      window.openBreakdown(worker, item);
    } else if (typeof openBreakdown === "function"){
      openBreakdown(worker, item);
    }
  });
});