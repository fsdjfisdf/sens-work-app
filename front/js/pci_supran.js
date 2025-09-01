/* ==========================================================================
   SUPRA N PCI (전체 데이터, 중분류 그룹/기준 출력, 와이드 매트릭스)
   서버 API:
     GET /api/pci/supra-n/workers              -> { workers: [name...] }
     GET /api/pci/supra-n/matrix               -> { workers, items, data, worker_avg_pci }
     GET /api/pci/supra-n/worker/:name         -> { summary, rows }
     GET /api/pci/supra-n/worker/:name/item/:item -> 산출근거 상세
   ========================================================================== */

const API_BASE = "";

// ===== 전역 상태 =====
let workerNames = [];
let stackedChart = null;

// 매트릭스 상태
let matrixItems = [];         // 모든 항목
let matrixWorkers = [];       // 모든 작업자
let matrixData = {};          // data[item][worker] = {pci, work, self, baseline, ...}
let workerAvgMap = {};        // worker -> avg pci

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
  matrixInfo: $("matrixInfo"),
  matrixThead: $("matrixThead"),
  matrixTbody: $("matrixTbody"),
  matrixLoading: $("matrixLoading"),
  catChips: $("catChips"),
  matrixTable: $("matrixTable"),

  // person
  worker: $("worker"),
  workerList: $("worker-list"),
  btnFetch: $("btnFetch"),
  btnCsv: $("btnCsv"),
  avgWork: $("avgWork"),
  avgPci: $("avgPci"),
  itemsCnt: $("itemsCnt"),
  stackedCanvas: $("stackedChart"),
  searchItem: $("searchItem"),
  sortBy: $("sortBy"),
  tbody: $("pciTbody"),
};

// ===== 중분류 정의 =====
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

// item -> 카테고리 맵
const ITEM_TO_CAT = (() => {
  const m = {};
  for (const grp of CATEGORIES) for (const it of grp.items) m[it] = grp.category;
  return m;
})();

function getCategory(item){ return ITEM_TO_CAT[item] || "-"; }
function esc(s=""){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function pct(n){ return (Number.isFinite(n)?n:0).toFixed(1); }
function heatClass(p){ const b = Math.max(0, Math.min(10, Math.round((p||0)/10))); return `h${b}`; }

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", async () => {
  bindTabs();
  bindMatrixEvents();
  bindPersonEvents();
  renderCategoryChips();

  await loadWorkerList();
  await buildMatrix();

  // 매트릭스 셀 상세(이벤트 위임)
  el.matrixTbody.addEventListener("click", (e)=>{
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const w = cell.getAttribute("data-w");
    const it = cell.getAttribute("data-item");
    if (w && it) openBreakdown(w, it);
  });
});

// ===== 탭 =====
function bindTabs(){
  el.tabs.forEach(btn=>{
    btn.addEventListener("click",()=>{
      el.tabs.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      el.panes.forEach(p=>p.classList.remove("active"));
      document.getElementById(target).classList.add("active");
    });
  });
}

// ===== 매트릭스 =====
function bindMatrixEvents(){
  el.btnReloadMatrix.addEventListener("click", buildMatrix);
  el.btnMatrixCsv.addEventListener("click", exportMatrixXlsx); // Excel
  el.filterItem.addEventListener("input", renderMatrix);
  el.filterWorker.addEventListener("input", renderMatrix);
  el.sortWorkers.addEventListener("change", ()=>{ sortMatrixWorkers(); renderMatrix(); });
  el.density.addEventListener("change", ()=> toggleDensity());
  el.colWidth.addEventListener("input", ()=> applyColumnWidth());
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
  el.matrixInfo.textContent = "";
  try{
    const res = await axios.get(`/api/pci/supra-n/matrix`);
    const { workers, items, data, worker_avg_pci } = res.data || {};
    matrixWorkers = workers || [];
    matrixItems = items || [];
    matrixData = data || {};
    workerAvgMap = worker_avg_pci || {};
    sortMatrixWorkers();
    renderMatrix();
    el.matrixInfo.textContent = `총 항목 ${matrixItems.length}개 × 작업자 ${matrixWorkers.length}명 = ${matrixItems.length * matrixWorkers.length} 셀`;
    toggleDensity(); // 초기 밀도/열너비 반영
    applyColumnWidth();
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

function visibleCategories(){
  // chips에서 active만
  const act = Array.from(el.catChips.querySelectorAll(".chip.active")).map(c=>c.dataset.cat);
  return new Set(act.length ? act : CATEGORIES.map(c=>c.category));
}

function renderCategoryChips(){
  el.catChips.innerHTML = CATEGORIES.map(c=>`<button class="chip active" data-cat="${esc(c.category)}">${esc(c.category)}</button>`).join("");
  el.catChips.addEventListener("click",(e)=>{
    if(!e.target.classList.contains("chip")) return;
    e.target.classList.toggle("active");
    renderMatrix();
  });
}

function getBaseline(item){
  if (!matrixWorkers.length) return "";
  const w0 = matrixWorkers[0];
  const d = (matrixData[item]||{})[w0] || null;
  return d?.baseline ?? "";
}

function renderMatrix(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();
  const cats = visibleCategories();

  // ===== 헤더 =====
  const theadTr = document.createElement("tr");
  const thCat = document.createElement("th"); thCat.textContent = "중분류"; thCat.className="item-col";
  const thItem = document.createElement("th"); thItem.textContent = "작업 항목"; thItem.className="item-col";
  const thBase = document.createElement("th"); thBase.textContent = "기준"; thBase.className="base-col";
  theadTr.appendChild(thCat); theadTr.appendChild(thItem); theadTr.appendChild(thBase);

  const shownWorkers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  for (const w of shownWorkers){
    const th = document.createElement("th");
    th.className = "worker-col";
    th.innerHTML = `<div class="wname" title="avg ${pct(workerAvgMap[w]||0)}%">${esc(w)}</div>`;
    theadTr.appendChild(th);
  }
  el.matrixThead.innerHTML = ""; el.matrixThead.appendChild(theadTr);

  // ===== 바디 =====
  const frag = document.createDocumentFragment();

  // 카테고리 순서대로 섹션 렌더
  for (const grp of CATEGORIES){
    if (!cats.has(grp.category)) continue;

    // 해당 카테고리 항목 중 필터와 매칭되는 것만
    const its = grp.items.filter(it => matrixItems.includes(it))
                         .filter(it => !qItem || it.toLowerCase().includes(qItem));
    if (!its.length) continue;

    // 카테고리 헤더 행
    const catTr = document.createElement("tr");
    catTr.className = "cat-row";
    const catTd = document.createElement("td");
    catTd.colSpan = 3 + shownWorkers.length;
    catTd.innerHTML = `<span>${esc(grp.category)}</span>`;
    catTr.appendChild(catTd);
    frag.appendChild(catTr);

    // 항목 행들
    for (const item of its){
      const tr = document.createElement("tr");

      const tdCat = document.createElement("td");
      tdCat.className = "item-col";
      tdCat.innerHTML = `<span class="badge">${esc(grp.category)}</span>`;
      const tdItem = document.createElement("td");
      tdItem.className = "item-col";
      tdItem.innerHTML = `<strong>${esc(item)}</strong>`;
      const tdBase = document.createElement("td");
      tdBase.className = "base-col";
      tdBase.textContent = getBaseline(item);

      tr.appendChild(tdCat); tr.appendChild(tdItem); tr.appendChild(tdBase);

      for (const w of shownWorkers){
        const d = (matrixData[item]||{})[w] || null;
        const val = d?.pci ?? 0;
        const cls = `cell ${heatClass(val)}`;
        const title = d ? `작업자: ${w}\n항목: ${item}\nPCI: ${pct(d.pci)}%\n작업이력(80): ${pct(d.work)}%\n자가(20): ${pct(d.self)}%\n기준: ${d.baseline}\n총횟수: ${d.total_count} (main ${d.main_count}, support ${d.support_count}, 가산 ${d.add_count})` : "";
        const td = document.createElement("td");
        td.className = "worker-col";
        // 클릭 가능한 셀(산출 근거)
        td.innerHTML = `
          <div class="${cls}" role="button" tabindex="0"
               data-w="${esc(w)}" data-item="${esc(item)}"
               title="${esc(title)}">
            <span class="pct">${pct(val)}%</span>
          </div>`;
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }
  }
  el.matrixTbody.innerHTML = "";
  el.matrixTbody.appendChild(frag);
}

function toggleDensity(){
  const dense = el.density.value === "compact";
  el.matrixTable.classList.toggle("dense", dense);
}

function applyColumnWidth(){
  const px = Math.max(40, Math.min(140, Number(el.colWidth.value || 64)));
  Array.from(document.querySelectorAll(".worker-col")).forEach(th => th.style.minWidth = px + "px");
}

// ===== Excel (중분류/기준 포함) =====
function exportMatrixXlsx(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();
  const cats = visibleCategories();

  const workers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));
  const header = ["중분류","작업 항목","기준", ...workers];

  const aoa = [header];
  for (const grp of CATEGORIES){
    if (!cats.has(grp.category)) continue;
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
  el.btnCsv.addEventListener("click", exportPersonXlsx); // Excel
  el.searchItem.addEventListener("input", renderPersonTable);
  el.sortBy.addEventListener("change", ()=>{ sortPersonRows(); renderPersonTable(); });
}

async function onFetchPerson(){
  const name = el.worker.value.trim();
  if (!name) return alert("작업자를 입력하세요.");
  try{
    const res = await axios.get(`/api/pci/supra-n/worker/${encodeURIComponent(name)}`);
    currentSummary = res.data?.summary || null;
    currentRows = res.data?.rows || [];
    updateCards();
    sortPersonRows();
    renderPersonChart();
    renderPersonTable();
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
    data:{ labels, datasets:[ {label:"작업이력(최대 80)", data:work, stack:"pci"}, {label:"자가체크(최대 20)", data:self, stack:"pci"} ] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:"top"}, tooltip:{enabled:true}, datalabels:{ anchor:"end", align:"end", formatter:v=>`${pct(v)}%`, color:"#333", clamp:true } },
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
  const groups = new Map(); // cat -> rows[]
  for (const r of rows){
    const cat = getCategory(r.item);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(r);
  }

  const frag = document.createDocumentFragment();
  for (const [cat, list] of groups){
    // 섹션 헤더 행
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

// 개인 보기 행 클릭 → 산출 근거
el.tbody.addEventListener("click", (e)=>{
  const tr = e.target.closest("tr");
  if (!tr) return;
  const it = tr.getAttribute("data-item");
  const w = currentSummary?.worker;
  if (w && it) openBreakdown(w, it);
});

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

// ===== 산출 근거 모달 =====
async function openBreakdown(worker, item){
  try{
    const url = `/api/pci/supra-n/worker/${encodeURIComponent(worker)}/item/${encodeURIComponent(item)}`;
    const { data } = await axios.get(url);

    const logsHtml = (data.logs && data.logs.length)
      ? `<div class="table-scroll">
           <table class="table" style="min-width:820px">
             <thead>
               <tr><th>일자</th><th>ID</th><th>장비타입</th><th>역할</th><th>가중치</th><th>원본 작업자기재</th></tr>
             </thead>
             <tbody>
               ${data.logs.map(l=>`
                 <tr>
                   <td>${esc(l.task_date||"-")}</td>
                   <td>${l.id}</td>
                   <td>${esc(l.equipment_type||"-")}</td>
                   <td>${esc(l.role)}</td>
                   <td>${l.weight}</td>
                   <td class="wrap-text">${esc(l.task_man_raw||"")}</td>
                 </tr>`).join("")}
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
            <div class="k">항목</div><div class="v"><strong>${esc(data.item)}</strong> <span class="pill">${esc(getCategory(data.item))}</span></div>
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
  }catch(e){
    console.error("상세 조회 실패:", e);
    alert("상세를 불러오지 못했습니다.");
  }
}

// 가벼운 모달(approval.css 톤과 어울림)
function showModal(title, bodyHtml){
  let overlay = document.querySelector(".overlay");
  let modal = document.querySelector(".modal");
  if (!overlay){
    overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);
  }
  if (!modal){
    modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <div class="md-title"></div>
          <button class="btn" id="md-close">닫기</button>
        </div>
        <div class="modal-box"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#md-close").addEventListener("click", hideModal);
    overlay.addEventListener("click", hideModal);
  }
  modal.querySelector(".md-title").textContent = title;
  modal.querySelector(".modal-box").innerHTML = bodyHtml;
  document.body.classList.add("modal-open");
  overlay.classList.add("show");
  modal.classList.add("show");
}
function hideModal(){
  document.body.classList.remove("modal-open");
  document.querySelector(".overlay")?.classList.remove("show");
  document.querySelector(".modal")?.classList.remove("show");
}
