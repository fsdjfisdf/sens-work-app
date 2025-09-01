/* ==========================================================================
   S-WORKS — SUPRA N PCI (Front, no date filters)
   - 기본 탭: 전체 인원 매트릭스(세로: 작업 항목, 가로: 작업자)
   - 개인 보기: 1명 선택 시 차트/상세 표
   - API:
     GET /api/pci/supra-n/summary                -> worker 목록(요약)
     GET /api/pci/supra-n/worker/:name           -> 한 명의 rows (전체 기간)
   ========================================================================== */

const API_BASE = "http://3.37.73.151:3001"; // 같은 오리진(3001)에서 제공 → 상대경로

// ===== 전역 상태 =====
let workerNames = [];                  // 작업자 이름 배열
let currentRows = [];                  // 개인 rows
let currentSummary = null;             // 개인 summary
let stackedChart = null;               // 개인 차트

// 매트릭스 상태
let matrixItems = [];                  // 모든 항목(행 라벨)
let matrixWorkers = [];                // 모든 작업자(열 라벨)
let matrixData = {};                   // matrixData[item][worker] = { pci, work, self }
let workerAvgMap = {};                 // worker → 평균 PCI

// ===== 엘리먼트 =====
const $ = (id) => document.getElementById(id);

const el = {
  // 탭
  tabs: document.querySelectorAll(".tab"),
  panes: document.querySelectorAll(".tab-pane"),

  // 매트릭스
  filterItem: $("filterItem"),
  filterWorker: $("filterWorker"),
  sortWorkers: $("sortWorkers"),
  btnReloadMatrix: $("btnReloadMatrix"),
  btnMatrixCsv: $("btnMatrixCsv"),
  matrixInfo: $("matrixInfo"),
  matrixThead: $("matrixThead"),
  matrixTbody: $("matrixTbody"),
  matrixLoading: $("matrixLoading"),

  // 개인
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

// ===== 유틸 =====
function pct(n) { return (Number.isFinite(n) ? n : 0).toFixed(1); }
function round1(x) { return Math.round(x * 10) / 10; }
function esc(s=""){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// 카테고리(보조 라벨): 단순 규칙
function guessCategory(item){
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
}

function heatClass(p){ // 0~100 → h0~h10
  if (!Number.isFinite(p)) return "h0";
  const b = Math.max(0, Math.min(10, Math.round(p/10)));
  return `h${b}`;
}

// 간단 동시성 제한
async function mapLimit(arr, limit, iter){
  let i=0;
  const out = new Array(arr.length);
  const workers = Array.from({length: Math.max(1, limit)}, () => (async function run(){
    while(i < arr.length){
      const idx = i++;
      try { out[idx] = await iter(arr[idx], idx); }
      catch(e){ out[idx] = null; console.error("mapLimit err:", e); }
    }
  })());
  await Promise.all(workers);
  return out;
}

// ===== 초기화 =====
document.addEventListener("DOMContentLoaded", async () => {
  bindTabs();
  bindMatrixEvents();
  bindPersonEvents();

  await loadWorkerList();       // datalist + workerNames 세팅
  await buildMatrix();          // 기본 뷰: 전체 매트릭스 로드
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
  el.btnMatrixCsv.addEventListener("click", downloadMatrixCsv);
  el.filterItem.addEventListener("input", renderMatrix);
  el.filterWorker.addEventListener("input", renderMatrix);
  el.sortWorkers.addEventListener("change", ()=>{ sortMatrixWorkers(); renderMatrix(); });
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
  }else{ // avg_desc
    matrixWorkers.sort((a,b)=>(workerAvgMap[b]??0)-(workerAvgMap[a]??0) || a.localeCompare(b,'ko'));
  }
}

function renderMatrix(){
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();

  // 헤더
  const theadTr = document.createElement("tr");
  const th0 = document.createElement("th");
  th0.className = "item-col";
  th0.textContent = "작업 항목";
  theadTr.appendChild(th0);

  for (const w of matrixWorkers){
    if (qWorker && !w.toLowerCase().includes(qWorker)) continue;
    const th = document.createElement("th");
    th.className = "worker-col";
    th.innerHTML = `<div>${esc(w)}</div><div style="font-size:11px;color:#756d69">avg ${pct(workerAvgMap[w]||0)}%</div>`;
    theadTr.appendChild(th);
  }
  el.matrixThead.innerHTML = "";
  el.matrixThead.appendChild(theadTr);

  // 바디
  const frag = document.createDocumentFragment();
  for (const item of matrixItems){
    if (qItem && !item.toLowerCase().includes(qItem)) continue;

    const tr = document.createElement("tr");
    const tdItem = document.createElement("td");
    tdItem.className="item-col";
    tdItem.innerHTML = `<div><strong>${esc(item)}</strong> <span class="badge" style="margin-left:6px">${esc(guessCategory(item))}</span></div>`;
    tr.appendChild(tdItem);

    for (const w of matrixWorkers){
      if (qWorker && !w.toLowerCase().includes(qWorker)) continue;
      const d = (matrixData[item] || {})[w] || null;
      const val = d?.pci ?? 0;
      const cls = `cell ${heatClass(val)}`;
      const td = document.createElement("td");
      td.className = "worker-col";
      td.innerHTML = `<div class="${cls}"><span class="pct">${pct(val)}%</span><span class="hint">${d?`${pct(d.work)}/${pct(d.self)}`:"-"}</span></div>`;
      tr.appendChild(td);
    }

    frag.appendChild(tr);
  }
  el.matrixTbody.innerHTML = "";
  el.matrixTbody.appendChild(frag);
}

function downloadMatrixCsv(){
  if (!matrixItems.length || !matrixWorkers.length){
    alert("내보낼 데이터가 없습니다.");
    return;
  }
  const qItem = el.filterItem.value.trim().toLowerCase();
  const qWorker = el.filterWorker.value.trim().toLowerCase();
  const workers = matrixWorkers.filter(w => !qWorker || w.toLowerCase().includes(qWorker));

  const header = ["작업 항목", ...workers];
  const lines = [header.map(s=>`"${s.replace(/"/g,'""')}"`).join(",")];

  for (const item of matrixItems){
    if (qItem && !item.toLowerCase().includes(qItem)) continue;
    const row = [item];
    for (const w of workers){
      const d = (matrixData[item]||{})[w] || null;
      row.push(Number.isFinite(d?.pci) ? pct(d.pci) : "");
    }
    lines.push(row.map(s=>`"${String(s).replace(/"/g,'""')}"`).join(","));
  }

  const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "SUPRAN_PCI_MATRIX.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ===== 개인 보기 =====
function bindPersonEvents(){
  $("btnFetch").addEventListener("click", onFetchPerson);
  $("btnCsv").addEventListener("click", onCsvPerson);
  $("searchItem").addEventListener("input", renderPersonTable);
  $("sortBy").addEventListener("change", ()=>{ sortPersonRows(); renderPersonTable(); });
}

async function onFetchPerson(){
  const name = el.worker.value.trim();
  if (!name) return alert("작업자를 입력하세요.");

  const url = `${API_BASE}/api/pci/supra-n/worker/${encodeURIComponent(name)}`;
  try{
    const res = await axios.get(url);
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
  if (!s){
    el.avgWork.textContent = "-";
    el.avgPci.textContent = "-";
    el.itemsCnt.textContent = "-";
    return;
  }
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

  if (stackedChart){ stackedChart.destroy(); }
  stackedChart = new Chart(el.stackedCanvas.getContext("2d"), {
    type:"bar",
    data:{ labels, datasets:[ {label:"작업이력(최대 80)", data:work, stack:"pci"}, {label:"자가체크(최대 20)", data:self, stack:"pci"} ] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{position:"top"}, tooltip:{enabled:true}, datalabels:{ anchor:"end", align:"end", formatter:(v)=>`${pct(v)}%`, color:"#333", clamp:true } },
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
  for (const r of rows){
    const cat = guessCategory(r.item);
    const badgeClass = r.pci_pct >= 80 ? "ok" : (r.pci_pct >= 50 ? "mid" : "bad");
    const tr = document.createElement("tr");
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
  el.tbody.innerHTML = "";
  el.tbody.appendChild(frag);
}

function onCsvPerson(){
  if (!currentRows?.length) return alert("내보낼 데이터가 없습니다. 먼저 조회하세요.");
  const header = ["항목","카테고리","기준","main","support","가산","총횟수","작업이력(80)","자가(20)","PCI(%)"];
  const lines = [header.join(",")];
  for (const r of currentRows){
    const row = [
      r.item, guessCategory(r.item), r.baseline, r.main_count, r.support_count, r.add_count, r.total_count,
      pct(r.work_pct), pct(r.self_pct), pct(r.pci_pct)
    ].map(v=>`"${String(v).replace(/"/g,'""')}"`);
    lines.push(row.join(","));
  }
  const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  const name = (currentSummary?.worker || "worker") + "_SUPRAN_PCI.csv";
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
