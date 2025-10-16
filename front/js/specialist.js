/* Specialist — 교육 건수 편집기 (INTEGER) */
const token = localStorage.getItem('x-access-token');
if (token) {
  axios.defaults.headers.common['x-access-token'] = token;     // 서버가 주로 읽는 헤더
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // 혹시 모를 Bearer 대응
}
const $ = (id)=>document.getElementById(id);
const el = {
  selWorker: $("selWorker"),
  workerList: $("worker-list"),
  q: $("q"),
  mode: $("mode"),
  val: $("val"),
  reason: $("reason"),
  btnLoad: $("btnLoad"),
  btnApplySelected: $("btnApplySelected"),
  chkAll: $("chkAll"),
  tbody: $("tbody")
};

const CATS = [ // UI 분류용(PCI INTEGER와 동일 분류)
  { cat:"Swap Kit", items:["SWAP KIT","GAS LINE & GAS FILTER","TOP FEED THROUGH","GAS FEED THROUGH","CERAMIC PARTS","MATCHER","PM BAFFLE","AM BAFFLE","FLANGE ADAPTOR"] },
  { cat:"Slot Valve", items:["SLOT VALVE ASSY(HOUSING)","SLOT VALVE","DOOR VALVE"] },
  { cat:"Pendulum Valve", items:["PENDULUM VALVE"] },
  { cat:"Pin Motor & CTR", items:["PIN ASSY MODIFY","MOTOR & CONTROLLER","PIN 구동부 ASSY","PIN BELLOWS","SENSOR"] },
  { cat:"Step Motor & CTR", items:["STEP MOTOR & CONTROLLER","CASSETTE & HOLDER PAD","BALL SCREW ASSY","BUSH","MAIN SHAFT","BELLOWS"] },
  { cat:"Robot", items:["EFEM ROBOT REP","TM ROBOT REP","EFEM ROBOT TEACHING","TM ROBOT TEACHING","TM ROBOT SERVO PACK"] },
  { cat:"Vac. Line", items:["UNDER COVER","VAC. LINE","BARATRON GAUGE","PIRANI GAUGE","CONVACTRON GAUGE","MANUAL VALVE","PNEUMATIC VALVE","ISOLATION VALVE","VACUUM BLOCK","CHECK VALVE","EPC","PURGE LINE REGULATOR"] },
  { cat:"Chuck", items:["COOLING CHUCK","HEATER CHUCK"] },
  { cat:"Rack", items:["GENERATOR"] },
  { cat:"Board", items:["D-NET BOARD","SOURCE BOX BOARD","INTERFACE BOARD","SENSOR BOARD","PIO SENSOR BOARD","AIO CALIBRATION[PSK BOARD]","AIO CALIBRATION[TOS BOARD]"] },
  { cat:"Sensor", items:["CODED SENSOR","GAS BOX DOOR SENSOR","LASER SENSOR AMP"] },
  { cat:"ETC", items:["HE LEAK CHECK","DIFFUSER","LOT 조사","GAS SPRING","LP ESCORT"] }
];

const ITEM2CAT = (()=>{ const m={}; for(const g of CATS) for(const it of g.items) m[it]=g.cat; return m; })();

function esc(s){ s = (s==null?"":String(s)); return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

async function loadWorkers(){
  const { data } = await axios.get("/api/specialist/integer/workers");
  const list = data?.workers || [];
  el.workerList.innerHTML = list.map(n=>`<option value="${esc(n)}"></option>`).join("");
}

async function fetchCounts(worker){
  const { data } = await axios.get("/api/specialist/integer/edu?worker="+encodeURIComponent(worker));
  return data?.rows || []; // [{item, add_count}]
}

function renderTable(rows){
  const q = (el.q.value||"").trim().toLowerCase();
  const filtered = rows.filter(r=> !q || r.item.toLowerCase().includes(q));
  const frag = document.createDocumentFragment();

  // 카테고리 헤더 + 행
  let lastCat = null;
  for (const r of filtered){
    const cat = ITEM2CAT[r.item] || "-";
    if (cat !== lastCat){
      const trCat = document.createElement("tr");
      trCat.className = "cat-row";
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = cat;
      trCat.appendChild(td);
      frag.appendChild(trCat);
      lastCat = cat;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="rowchk" data-item="${esc(r.item)}"/></td>
      <td><span class="badge">${esc(cat)}</span></td>
      <td>${esc(r.item)}</td>
      <td class="mono" data-item="${esc(r.item)}"><strong>${Number(r.add_count||0)}</strong></td>
      <td>
        <div class="quick">
          <button class="btn sm" data-act="dec" data-item="${esc(r.item)}">-1</button>
          <button class="btn sm" data-act="inc" data-item="${esc(r.item)}">+1</button>
          <button class="btn sm ghost" data-act="zero" data-item="${esc(r.item)}">0으로</button>
        </div>
      </td>
      <td class="result" data-item="${esc(r.item)}"></td>
    `;
    frag.appendChild(tr);
  }
  el.tbody.innerHTML = "";
  el.tbody.appendChild(frag);
}

async function load(){
  const worker = el.selWorker.value.trim();
  if (!worker) return alert("작업자를 선택하세요.");
  const rows = await fetchCounts(worker);
  // 기준에 있는 모든 항목을 보이게(없으면 0으로)
  const map = new Map(rows.map(r=>[r.item, r.add_count]));
  const full = [];
  for (const g of CATS){
    for (const it of g.items){
      full.push({ item: it, add_count: map.has(it)? map.get(it): 0 });
    }
  }
  renderTable(full);
}

async function applyOne(item, mode, value, reason){
  const worker = el.selWorker.value.trim();
  const body = { worker, item, mode, value: Number(value||0), reason: reason||"" };
  const { data } = await axios.patch("/api/specialist/integer/cell", body);
  return data; // {item, worker, prev, next}
}

document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    await loadWorkers();
  }catch(e){
    console.error(e);
    alert("작업자 목록 로드 실패");
  }

  el.btnLoad.addEventListener("click", load);
  el.q.addEventListener("input", ()=>{ // 단순 필터
    const tds = [...el.tbody.querySelectorAll("td[data-item]")];
    if (!tds.length) return;
    const rows = [];
    const seen = new Set();
    // 현재 DOM에서 재구성
    for (const td of tds){
      const item = td.dataset.item;
      if (seen.has(item)) continue;
      seen.add(item);
      const val = Number(td.textContent || 0);
      rows.push({ item, add_count: val });
    }
    renderTable(rows);
  });

  // 전체 선택
  el.chkAll.addEventListener("change", ()=>{
    document.querySelectorAll(".rowchk").forEach(chk=> chk.checked = el.chkAll.checked);
  });

  // 빠른 수정(한 행 단위)
  el.tbody.addEventListener("click", async (e)=>{
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const item = btn.dataset.item;
    const reason = el.reason.value.trim();

    let mode, value;
    if (act === "inc"){ mode="inc"; value=1; }
    else if (act === "dec"){ mode="dec"; value=1; }
    else if (act === "zero"){ mode="set"; value=0; }
    else return;

    btn.disabled = true;
    try{
      const res = await applyOne(item, mode, value, reason);
      const cell = el.tbody.querySelector(`td.mono[data-item="${CSS.escape(item)}"]`);
      const msg = el.tbody.querySelector(`td.result[data-item="${CSS.escape(item)}"]`);
      if (cell) cell.innerHTML = `<strong>${res.next}</strong>`;
      if (msg) msg.textContent = `${dayjs(res.at).format("MM/DD HH:mm")} 저장`;
    }catch(err){
      console.error(err);
      alert("저장 실패: " + (err.response?.data?.message || err.message));
    }finally{
      btn.disabled = false;
    }
  });

  // 선택 항목 일괄 적용
  el.btnApplySelected.addEventListener("click", async ()=>{
    const worker = el.selWorker.value.trim();
    if (!worker) return alert("작업자를 선택하세요.");
    const checks = [...document.querySelectorAll(".rowchk:checked")];
    if (!checks.length) return alert("선택된 항목이 없습니다.");

    const mode = el.mode.value;
    let value = Number(el.val.value||0);
    const reason = el.reason.value.trim();
    if (!Number.isFinite(value)) value = 0;

    el.btnApplySelected.disabled = true;
    try{
      for (const chk of checks){
        const item = chk.dataset.item;
        const res = await applyOne(item, mode, value, reason);
        const cell = el.tbody.querySelector(`td.mono[data-item="${CSS.escape(item)}"]`);
        const msg  = el.tbody.querySelector(`td.result[data-item="${CSS.escape(item)}"]`);
        if (cell) cell.innerHTML = `<strong>${res.next}</strong>`;
        if (msg)  msg.textContent = `${dayjs(res.at).format("MM/DD HH:mm")} 저장`;
      }
      alert("저장했습니다.");
    }catch(err){
      console.error(err);
      alert("일괄 저장 중 오류: " + (err.response?.data?.message || err.message));
    }finally{
      el.btnApplySelected.disabled = false;
    }
  });
});
