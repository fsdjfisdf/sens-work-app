/* ==========================================================================
   SUPRA N PCI (정돈된 매트릭스 / 기준-서브텍스트 / 가로 스크롤 차트 / 버튼 스타일)
   + 헤더 겹침(z-index) 수정 + 모달 아코디언 로그
   ========================================================================== */

const API_BASE = "";

// ===== 전역 상태 =====
let workerNames = [];
let stackedChart = null;

// 매트릭스 상태
let matrixItems = [];
let matrixWorkers = [];
let matrixData = {};   // data[item][worker] = {pci, work, self, baseline, ...}
let workerAvgMap = {}; // worker -> avg pci
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

// ===== 카테고리 정의 =====
const CATEGORIES = [
  { category: "ESCORT",             items: ["LP ESCORT","ROBOT ESCORT"] },
  { category: "EFEM ROBOT",         items: ["SR8241 TEACHING","SR8240 TEACHING","M124 TEACHING","EFEM FIXTURE","EFEM ROBOT REP","EFEM ROBOT CONTROLLER REP"] },
  { category: "TM ROBOT",           items: ["SR8250 TEACHING","SR8232 TEACHING","TM ROBOT REP","TM ROBOT CONTROLLER REP","PASSIVE PAD REP"] },
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
var ESC_RE  = /[&<>"']/g;
var ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
function esc(s) { s = (s == null) ? '' : String(s); return s.replace(ESC_RE, ch => ESC_MAP[ch] || ch); }
function pct(n){ return (Number.isFinite(n)?n:0).toFixed(1); }
function heatClass(p){ const b = Math.max(0, Math.min(10, Math.round((p||0)/10))); return `h${b}`; }
const debounce = (fn, ms=200)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

// Busy indicator helpers
function startLine(container){ container?.classList.add("is-loading"); }
function stopLine(container){ container?.classList.remove("is-loading"); }
function showBusy(container, work){
  startLine(container);
  requestAnimationFrame(()=>{
    try{ work(); } finally{ setTimeout(()=>stopLine(container), 280); }
  });
}

// Fade-in helper
function fadeInBox(box){
  box?.classList.remove("fade-in");
  void box?.offsetWidth; // reflow
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
  await buildMatrix(true);

  // 매트릭스 셀 상세(이벤트 위임; 셀 어디든 클릭 + 키보드)
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

  // 카테고리 접기/펼치기 (행 클릭)
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
  el.btnReloadMatrix.addEventListener("click", ()=>buildMatrix(false));
  el.btnMatrixCsv.addEventListener("click", exportMatrixXlsx);
  el.filterItem.addEventListener("input", debounce(()=> showBusy(el.matrixWrap, renderMatrix), 120));
  el.filterWorker.addEventListener("input", debounce(()=> showBusy(el.matrixWrap, renderMatrix), 120));
  el.sortWorkers.addEventListener("change", ()=>{ sortMatrixWorkers(); showBusy(el.matrixWrap, renderMatrix); });
  el.density.addEventListener("change", ()=> toggleDensity());
  el.colWidth.addEventListener("input", ()=> applyColumnWidth());
}

async function loadWorkerList(){
  try{
    const res = await axios.get(`/api/pci/supra-n/workers`);
    workerNames = (res.data?.workers || []).slice().sort((a,b)=>a.localeCompare(b,'ko'));
    // 개인 보기 자동완성
    el.workerList.innerHTML = workerNames.map(n=>`<option value="${esc(n)}"></option>`).join("");
  }catch(err){
    console.error("작업자 목록 로드 실패:", err);
    workerNames = [];
  }
}

// baseline 추출(어떤 작업자든 동일하다고 가정; 데이터에서 첫 개체 사용)
function getBaseline(item){
  const d = matrixData[item] || {};
  const first = Object.values(d)[0];
  return first?.baseline ?? "";
}

function renderMatrixSkeleton(rowCount=10, workerCount=12){
  // 헤더 (중분류 / 항목 + 기준 서브)
  const tr = document.createElement("tr");
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
    const res = await axios.get(`/api/pci/supra-n/matrix`);
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

function renderMatrix(){
  clearColHighlight();

  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  // 헤더
  const theadTr = document.createElement("tr");
  const thCat = document.createElement("th"); thCat.textContent = "중분류"; thCat.className="item-col"; thCat.dataset.col = 0;
  const thItem = document.createElement("th"); thItem.textContent = "작업 항목"; thItem.className="item-col"; thItem.dataset.col = 1;
  theadTr.appendChild(thCat); theadTr.appendChild(thItem);

  const shownWorkers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  shownWorkers.forEach((w,i)=>{
    const th = document.createElement("th");
    th.className = "worker-col";
    th.dataset.col = 2+i;
    th.dataset.wi = 1+i;
    if (i>0 && ((i % 5)===0)) th.classList.add("block-start");
    th.innerHTML = `<div class="wname" title="avg ${pct(workerAvgMap[w]||0)}%">${esc(w)}</div>`;
    theadTr.appendChild(th);
  });
  el.matrixThead.innerHTML = ""; el.matrixThead.appendChild(theadTr);

  // 바디
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
               data-w="${esc(w)}" data-item="${esc(item)}"
               title="클릭하여 상세 보기">
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
}

function toggleDensity(){
  const dense = el.density.value === "compact";
  el.matrixTable.classList.toggle("dense", dense);
}

function applyColumnWidth(){
  const px = Math.max(40, Math.min(140, Number(el.colWidth.value || 68)));
  Array.from(document.querySelectorAll(".worker-col")).forEach(c => { c.style.minWidth = px + "px"; });
}

// ===== Excel (중분류/기준 포함) =====
function exportMatrixXlsx(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const workers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const header = ["중분류","작업 항목","기준", ...workers];

  const aoa = [header];
  for (const grp of CATEGORIES){
    const its = grp.items.filter(it => matrixItems.includes(it))
                         .filter(it => !qItem || it.toLowerCase().includes(qItem));
    for (const item of its){
      const base = getBaseline(item);
      const row = [grp.category, item, base];
      for (const w of workers){
        const d = (matrixData[item]||{})[w] || null;
        row.push(Number.isFinite(d?.pci) ? Number(pct(d.pci)) : "");
      }
      aoa.push(row);
    }
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
    const res = await axios.get(`/api/pci/supra-n/worker/${encodeURIComponent(name)}`);
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
  const s = currentSummary;
  if (!s){ el.avgWork.textContent="-"; el.avgPci.textContent="-"; el.itemsCnt.textContent="-"; return; }
  el.avgWork.textContent = pct(s.avg_work_pct);
  el.avgPci.textContent = pct(s.avg_pci_pct);
  el.itemsCnt.textContent = s.items_considered ?? 0;
}

function renderPersonChart(){
  const rows = (currentRows||[]).slice().filter(r => (r.pci_pct>0)||(r.self_pct>0)||(r.work_pct>0));
  rows.sort((a,b)=> b.pci_pct - a.pci_pct || b.total_count - a.total_count);

  // 너무 많을 경우 적당히 제한 (가로 스크롤로 충분히 보되 성능 보호)
  const MAX_BARS = 80;
  const list = rows.slice(0, MAX_BARS);
  const labels = list.map(r=>r.item);
  const work = list.map(r=>r.work_pct);
  const self = list.map(r=>r.self_pct);

  // 가로 스크롤: 바 1개당 폭
  const PX_PER_BAR = 56;
  const targetWidth = Math.max(el.chartScroll.clientWidth, Math.ceil(labels.length * PX_PER_BAR));
  el.chartInner.style.width = targetWidth + "px";

  if (stackedChart) stackedChart.destroy();
  stackedChart = new Chart(el.stackedCanvas.getContext("2d"), {
    type:"bar",
    data:{ labels, datasets:[
      {label:"작업이력(최대 80)", data:work, stack:"pci"},
      {label:"자가체크(최대 20)", data:self, stack:"pci"}
    ] },
    options:{
      responsive:false, // 캔버스 폭은 부모에서 제어
      maintainAspectRatio:false,
      plugins:{
        legend:{position:"top"},
        tooltip:{enabled:true},
        datalabels:{
          display: labels.length <= 30, // 많으면 자동 숨김
          anchor:"end", align:"end",
          formatter:v=>`${pct(v)}%`, color:"#333", clamp:true
        }
      },
      scales:{ x:{stacked:true}, y:{stacked:true, min:0, max:100, ticks:{callback:v=>v+"%"} } }
    },
    plugins:[ChartDataLabels]
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

  // 중분류별 그룹핑
  const groups = new Map();
  for (const r of rows){
    const cat = getCategory(r.item);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(r);
  }

  const frag = document.createDocumentFragment();
  for (const [cat, list] of groups){
    // 섹션 헤더
    const hr = document.createElement("tr");
    hr.className = "cat-row";
    const td = document.createElement("td");
    td.colSpan = 10;
    td.innerHTML = `<strong>${esc(cat)}</strong>`;
    hr.appendChild(td);
    frag.appendChild(hr);

    // 항목 행
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

// Excel(개인)
function exportPersonXlsx(){
  if (!currentRows?.length) return alert("내보낼 데이터가 없습니다.");

  const aoa = [["중분류","항목","기준","main","support","가산","총횟수","작업이력(80)","자가(20)","PCI(%)"]];
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

// ===== 산출 근거 모달 (아코디언) =====
async function openBreakdown(worker, item){
  try{
    const url = `/api/pci/supra-n/worker/${encodeURIComponent(worker)}/item/${encodeURIComponent(item)}`;
    const { data } = await axios.get(url);

    const logsHtml = (data.logs && data.logs.length)
      ? `
         <div class="log-tools">
           <button class="btn ghost sm" id="btnExpandAll">모두 펼치기</button>
           <button class="btn ghost sm" id="btnCollapseAll">모두 접기</button>
         </div>
         <div class="log-accordion">
           ${data.logs.map(l=>`
             <details class="acc">
               <summary>
                 <span class="chev" aria-hidden="true"></span>
                 <span class="sum-date">${esc(l.task_date||"-")}</span>
                 <span class="sum-id">#${l.id}</span>
                 <span class="sum-eq">${esc(l.equipment_type||"-")}</span>
                 <span class="sum-role">${esc(l.role)}</span>
                 <span class="sum-weight">w:${l.weight}</span>
               </summary>
               <div class="acc-body">
                 <div class="kv6">
                   <div class="k">일자</div><div class="v">${esc(l.task_date||"-")}</div>
                   <div class="k">ID</div><div class="v">${l.id}</div>
                   <div class="k">장비타입</div><div class="v">${esc(l.equipment_type||"-")}</div>
                   <div class="k">역할</div><div class="v">${esc(l.role)}</div>
                   <div class="k">가중치</div><div class="v">${l.weight}</div>
                   <div class="k">원본 작업자기재</div><div class="v">${esc(l.task_man_raw||"")}</div>
                 </div>
                 <pre class="prejson">${esc(JSON.stringify(l,null,2))}</pre>
               </div>
             </details>
           `).join("")}
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
            <div class="v">main ${data.totals.main_count}, support ${data.totals.support_count}, 가산 ${data.totals.add_count} → <strong>총 ${data.totals.total_count}</strong></div>
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

    // 아코디언 컨트롤 바인딩
    const btnExpand = document.getElementById("btnExpandAll");
    const btnCollapse = document.getElementById("btnCollapseAll");
    if (btnExpand && btnCollapse){
      btnExpand.addEventListener("click", ()=>{
        el.modalBody.querySelectorAll("details.acc").forEach(d=>d.setAttribute("open",""));
      });
      btnCollapse.addEventListener("click", ()=>{
        el.modalBody.querySelectorAll("details.acc").forEach(d=>d.removeAttribute("open"));
      });
    }
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
