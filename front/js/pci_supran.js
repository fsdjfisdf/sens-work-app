/* ==========================================================================
   SUPRA N PCI — 깔끔한 매트릭스/개인보기 + 모달 + 엑셀 내보내기
   서버 API:
     GET /api/pci/supra-n/workers         -> { workers: [name...] }
     GET /api/pci/supra-n/matrix          -> { workers, items, data, worker_avg_pci }
     GET /api/pci/supra-n/worker/:name    -> { summary, rows }
   ========================================================================== */

const API_BASE = "";

/* ========== 전역상태 ========== */
let workerNames = [];
let stackedChart = null;

// 매트릭스
let matrixItems = [];         // 모든 항목
let matrixWorkers = [];       // 모든 작업자
let matrixData = {};          // data[item][worker] = {pci, work, self, baseline, total_count, main_count, support_count, add_count}
let workerAvgMap = {};        // worker -> avg pci

// 개인 보기
let currentRows = [];
let currentSummary = null;

/* ========== DOM ========== */
var ESC_RE  = /[&<>"']/g;
var ESC_MAP = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' };
function esc(s){ s = (s==null)?'':String(s); return s.replace(ESC_RE, function(ch){ return ESC_MAP[ch] || ch; }); }

const $ = (id) => document.getElementById(id);
const el = {
  // tabs
  tabs: document.querySelectorAll(".tab"),
  panes: document.querySelectorAll(".tab-pane"),

  // matrix
  filterItem: $("filterItem"),
  filterWorker: $("filterWorker"),
  sortWorkers: $("sortWorkers"),
  btnReloadMatrix: $("btnReloadMatrix"),
  btnMatrixXlsx: $("btnMatrixXlsx"),
  matrixThead: $("matrixThead"),
  matrixTbody: $("matrixTbody"),
  matrixLoading: $("matrixLoading"),
  matrixTable: $("matrixTable"),

  // person
  worker: $("worker"),
  workerList: $("worker-list"),
  btnFetch: $("btnFetch"),
  btnXlsx: $("btnXlsx"),
  avgWork: $("avgWork"),
  avgPci: $("avgPci"),
  itemsCnt: $("itemsCnt"),
  stackedCanvas: $("stackedChart"),
  searchItem: $("searchItem"),
  sortBy: $("sortBy"),
  tbody: $("pciTbody"),

  // modal
  modal: $("detailModal"),
  modalTitle: $("modalTitle"),
  modalBody: $("modalBody"),
  modalClose: $("modalClose"),
  modalOk: $("modalOk"),
  modalGotoPerson: $("modalGotoPerson"),
};

/* ========== 카테고리(중분류) 맵 ========== */
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
const ITEM_TO_CAT = (()=>{ const m={}; CATEGORIES.forEach(g=>g.items.forEach(it=>m[it]=g.category)); return m;})();
function getCategory(item){ return ITEM_TO_CAT[item] || "-"; }
function pct(n){ return (Number.isFinite(n)?n:0).toFixed(1); }
function pillClass(p){ const b = Math.max(0, Math.min(10, Math.round((p||0)/10))); return `p-h${b}`; }

/* ========== 초기화 ========== */
document.addEventListener("DOMContentLoaded", async () => {
  bindTabs();
  bindMatrixEvents();
  bindPersonEvents();
  bindModal();

  await loadWorkerList();
  await buildMatrix();

  // 해시로 탭 이동 지원 (#person / #matrix)
  if (location.hash === "#person") activateTab("tab-person");
  else activateTab("tab-matrix");
});

/* ========== 탭 ========== */
function activateTab(id){
  el.panes.forEach(p => p.classList.toggle("active", p.id === id));
  el.tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
}
function bindTabs(){
  el.tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      activateTab(btn.dataset.tab);
      history.replaceState(null, "", btn.dataset.tab === "tab-person" ? "#person" : "#matrix");
    });
  });
}

/* ========== 매트릭스 ========== */
function bindMatrixEvents(){
  el.btnReloadMatrix.addEventListener("click", buildMatrix);
  el.btnMatrixXlsx.addEventListener("click", downloadMatrixExcel);
  el.filterItem.addEventListener("input", renderMatrix);
  el.filterWorker.addEventListener("input", renderMatrix);
  el.sortWorkers.addEventListener("change", ()=>{ sortMatrixWorkers(); renderMatrix(); });

  // 델리게이션: 셀 클릭 → 모달
  el.matrixTbody.addEventListener("click", (e)=>{
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const worker = cell.dataset.worker;
    const item = cell.dataset.item;
    const d = (matrixData[item]||{})[worker] || null;
    if (!d) return;
    openDetailModal({ context:"matrix", worker, item, d });
  });
}

async function loadWorkerList(){
  try{
    const res = await axios.get(`/api/pci/supra-n/workers`);
    workerNames = (res.data?.workers || []).slice().sort((a,b)=>a.localeCompare(b,'ko'));
    el.workerList.innerHTML = workerNames.map(n=>`<option value="${esc(n)}"></option>`).join("");
  }catch(err){
    console.error("작업자 목록 로드 실패:", err);
    workerNames = [];
  }
}

async function buildMatrix(){
  el.matrixLoading.classList.remove("hidden");
  try{
    const res = await axios.get(`/api/pci/supra-n/matrix`);
    const { workers, items, data, worker_avg_pci } = res.data || {};
    matrixWorkers = workers || [];
    matrixItems = items || [];
    matrixData = data || {};
    workerAvgMap = worker_avg_pci || {};
    sortMatrixWorkers();
    renderMatrix();
  }catch(e){
    console.error("매트릭스 로드 실패:", e);
    alert("매트릭스 로드 중 오류가 발생했습니다.");
  }finally{
    el.matrixLoading.classList.add("hidden");
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

function getBaseline(item){
  const w0 = matrixWorkers[0];
  const d = (matrixData[item]||{})[w0] || null;
  return d?.baseline ?? "";
}

function renderMatrix(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const shownWorkers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const items = matrixItems.filter(it => !qItem || it.toLowerCase().includes(qItem));

  // THEAD
  const theadTr = document.createElement("tr");
  theadTr.innerHTML =
    `<th class="sticky-l1 col-cat">중분류</th>
     <th class="sticky-l2 col-item">작업 항목</th>
     <th class="sticky-l3 col-base">기준</th>`;
  for (const w of shownWorkers){
    const th = document.createElement("th");
    th.className = "whead";
    th.title = `${w} — 평균 ${pct(workerAvgMap[w]||0)}%`;
    th.textContent = w;
    theadTr.appendChild(th);
  }
  el.matrixThead.innerHTML = "";
  el.matrixThead.appendChild(theadTr);

  // TBODY
  const frag = document.createDocumentFragment();
  for (const item of items){
    const tr = document.createElement("tr");

    const tdCat = document.createElement("td");
    tdCat.className = "sticky-l1";
    tdCat.innerHTML = `<span class="badge">${esc(getCategory(item))}</span>`;

    const tdItem = document.createElement("td");
    tdItem.className = "sticky-l2";
    tdItem.innerHTML = `<strong>${esc(item)}</strong>`;

    const tdBase = document.createElement("td");
    tdBase.className = "sticky-l3 col-base";
    tdBase.style.textAlign = "right";
    tdBase.textContent = getBaseline(item);

    tr.appendChild(tdCat); tr.appendChild(tdItem); tr.appendChild(tdBase);

    for (const w of shownWorkers){
      const d = (matrixData[item]||{})[w] || null;
      const v = d?.pci ?? 0;
      const td = document.createElement("td");
      td.innerHTML = `<div class="cell" data-worker="${esc(w)}" data-item="${esc(item)}">
                        <div class="pill ${pillClass(v)}" title="${esc(`${w} · ${item} · ${pct(v)}%`)}">${pct(v)}%</div>
                      </div>`;
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  el.matrixTbody.innerHTML = "";
  el.matrixTbody.appendChild(frag);
}

/* ========== 개인 보기 ========== */
function bindPersonEvents(){
  el.btnFetch.addEventListener("click", onFetchPerson);
  el.btnXlsx.addEventListener("click", onExcelPerson);
  el.searchItem.addEventListener("input", renderPersonTable);
  el.sortBy.addEventListener("change", ()=>{ sortPersonRows(); renderPersonTable(); });

  // 상세 테이블 클릭 → 모달
  el.tbody.addEventListener("click", (e)=>{
    const tr = e.target.closest("tr");
    if (!tr) return;
    const idx = Number(tr.dataset.idx);
    if (!Number.isFinite(idx)) return;
    const r = currentRows[idx];
    if (!r) return;

    const d = {
      pci: r.pci_pct, work: r.work_pct, self: r.self_pct,
      total_count: r.total_count, main_count: r.main_count, support_count: r.support_count,
      add_count: r.add_count, baseline: r.baseline
    };
    openDetailModal({ context:"person", worker: (currentSummary?.worker||""), item: r.item, d });
  });
}

async function onFetchPerson(){
  const name = el.worker.value.trim();
  if (!name) { alert("작업자를 입력하세요."); el.worker.focus(); return; }
  try{
    const res = await axios.get(`/api/pci/supra-n/worker/${encodeURIComponent(name)}`);
    currentSummary = res.data?.summary || null;
    currentRows = res.data?.rows || [];
    updateCards();
    sortPersonRows();
    renderPersonChart();
    renderPersonTable();
    activateTab("tab-person");
    history.replaceState(null,"","#person");
  }catch(err){
    console.error("개인 조회 실패:", err);
    alert("조회 중 오류가 발생했습니다.");
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
  rows.sort((a,b)=>b.pci_pct - a.pci_pct);
  const top = rows.slice(0,15);
  const labels = top.map(r=>r.item);
  const work = top.map(r=>r.work_pct);
  const self = top.map(r=>r.self_pct);

  if (stackedChart) stackedChart.destroy();
  stackedChart = new Chart(el.stackedCanvas.getContext("2d"), {
    type:"bar",
    data:{ labels, datasets:[
      {label:"작업이력(최대 80)", data:work, stack:"pci"},
      {label:"자가체크(최대 20)", data:self, stack:"pci"}
    ] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:"top"}, tooltip:{enabled:true},
        datalabels:{ anchor:"end", align:"end", formatter:v=>`${pct(v)}%`, color:"#cfd8ff", clamp:true } },
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
  const frag = document.createDocumentFragment();
  rows.forEach((r, i)=>{
    const cat = getCategory(r.item);
    const badgeClass = r.pci_pct >= 80 ? "ok" : (r.pci_pct >= 50 ? "mid" : "bad");
    const tr = document.createElement("tr");
    tr.dataset.idx = String(i);
    tr.innerHTML = `
      <td class="sticky-l1"><span class="badge">${esc(cat)}</span></td>
      <td class="sticky-l2"><strong>${esc(r.item)}</strong></td>
      <td class="sticky-l3 num">${r.baseline}</td>
      <td class="num">${r.main_count}</td>
      <td class="num">${r.support_count}</td>
      <td class="num">${r.add_count}</td>
      <td class="num">${r.total_count}</td>
      <td class="num">${pct(r.work_pct)}%</td>
      <td class="num">${pct(r.self_pct)}%</td>
      <td class="num"><span class="badge ${badgeClass}">${pct(r.pci_pct)}%</span></td>
    `;
    frag.appendChild(tr);
  });
  el.tbody.innerHTML = "";
  el.tbody.appendChild(frag);
}

/* ========== 모달 ========== */
function bindModal(){
  el.modalClose.addEventListener("click", closeDetailModal);
  el.modalOk.addEventListener("click", closeDetailModal);
  el.modal.addEventListener("click", (e)=>{ if (e.target.classList.contains("modal-backdrop")) closeDetailModal(); });
  el.modalGotoPerson.addEventListener("click", ()=>{
    const worker = el.modalGotoPerson.dataset.worker || "";
    if (worker){
      el.worker.value = worker;
      onFetchPerson();
    } else {
      activateTab("tab-person");
      history.replaceState(null,"","#person");
    }
    closeDetailModal();
  });
}

function openDetailModal({ context, worker, item, d }){
  // 계산 근거 텍스트 생성
  const base = Number(d.baseline || 0);
  const main = Number(d.main_count || 0);
  const support = Number(d.support_count || 0);
  const add = Number(d.add_count || 0);
  const total = Number(d.total_count || (main+support+add));
  const workPct = Number(d.work || Math.min(1, base>0 ? total/base : 0) * 80);
  const selfPct = Number(d.self || 0);
  const pciPct = Number(d.pci || Math.max(0, Math.min(100, workPct + selfPct)));

  el.modalTitle.textContent = `${worker} · ${item}`;
  el.modalBody.innerHTML = `
    <div class="calcs">
      <table class="table detail">
        <thead><tr><th>항목</th><th class="num">값</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td>기준 작업 수</td><td class="num">${base}</td><td>BASELINE</td></tr>
          <tr><td>main</td><td class="num">${main}</td><td>주 수행(가중치 1.0)</td></tr>
          <tr><td>support</td><td class="num">${support}</td><td>보조 수행(가중치 0.2 합산됨)</td></tr>
          <tr><td>가산</td><td class="num">${add}</td><td>교육/추가 인정 횟수</td></tr>
          <tr><td>총합</td><td class="num">${(total).toFixed(1)}</td><td>main + support + 가산</td></tr>
          <tr><td>작업이력 점수</td><td class="num">${pct(workPct)}%</td><td><code>min(1, 총합/기준) × 80</code></td></tr>
          <tr><td>자가체크</td><td class="num">${pct(selfPct)}%</td><td>자가체크 완료 시 20%</td></tr>
          <tr><td><strong>최종 PCI</strong></td><td class="num"><strong>${pct(pciPct)}%</strong></td><td><code>작업이력 + 자가체크</code></td></tr>
        </tbody>
      </table>
    </div>
  `;

  // 개인 보기 이동 정보
  el.modalGotoPerson.dataset.worker = worker || "";
  el.modal.classList.remove("hidden");
}

function closeDetailModal(){
  el.modal.classList.add("hidden");
}

/* ========== 엑셀 내보내기 ========== */
function downloadMatrixExcel(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  const workers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const items = matrixItems.filter(it => !qItem || it.toLowerCase().includes(qItem));

  const header = ["중분류","작업 항목","기준", ...workers];
  const aoa = [header];

  for (const item of items){
    const base = getBaseline(item);
    const row = [ getCategory(item), item, base ];
    for (const w of workers){
      const d = (matrixData[item]||{})[w] || null;
      row.push(Number.isFinite(d?.pci) ? Number(pct(d.pci)) : null);
    }
    aoa.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{wch:12},{wch:18},{wch:6}].concat(workers.map(()=>({wch:8})));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SUPRA N PCI");
  XLSX.writeFile(wb, "SUPRAN_PCI_MATRIX.xlsx");
}

function onExcelPerson(){
  if (!currentRows?.length){ alert("내보낼 데이터가 없습니다."); return; }
  const header = ["중분류","항목","기준","main","support","가산","총횟수","작업이력(80)","자가(20)","PCI(%)"];
  const aoa = [header];
  for (const r of currentRows){
    aoa.push([
      getCategory(r.item), r.item, r.baseline,
      r.main_count, r.support_count, r.add_count, r.total_count,
      Number(pct(r.work_pct)), Number(pct(r.self_pct)), Number(pct(r.pci_pct))
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{wch:12},{wch:18},{wch:6},{wch:6},{wch:8},{wch:6},{wch:6},{wch:10},{wch:8},{wch:8}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (currentSummary?.worker || "PERSON") + "_PCI");
  const name = (currentSummary?.worker || "worker") + "_SUPRAN_PCI.xlsx";
  XLSX.writeFile(wb, name);
}
