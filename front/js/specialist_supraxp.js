/* Specialist — 사람 선택 → 모든 항목 값을 한 화면에서 직접 수정/저장 (반응형 UI) */
const $ = (id)=>document.getElementById(id);
const el = {
  selWorker: $("selWorker"),
  workerList: $("worker-list"),
  filter: $("filter"),
  btnLoad: $("btnLoad"),
  btnReload: $("btnReload"),
  tbody: $("tbody"),
  cards: $("cards"),
  resultLine: $("resultLine"),
  toast: $("toast"),
};

const token = localStorage.getItem('x-access-token');
if (token) {
  axios.defaults.headers.common['x-access-token'] = token;
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 카테고리 그룹 (PCI SUPRA XP 프론트와 동일)
const CATS = [
  { category: "Escort", items: ["LP ESCORT", "ROBOT ESCORT"] },

  { category: "EFEM Robot", items: [
    "SR8241 TEACHING",
    "ROBOT REP",
    "ROBOT CONTROLLER REP",
    "END EFFECTOR REP"
  ]},

  { category: "TM Robot", items: [
    "PERSIMMON TEACHING",
    "END EFFECTOR PAD REP"
  ]},

  { category: "L/L", items: [
    "L L PIN",
    "L L SENSOR",
    "L L DSA",
    "GAS LINE",
    "L L ISOLATION VV"
  ]},

  { category: "EFEM FFU", items: [
    "FFU CONTROLLER",
    "FAN",
    "MOTOR DRIVER"
  ]},

  { category: "SOURCE", items: [
    "MATCHER",
    "3000QC",
    "3100QC"
  ]},

  { category: "Chuck", items: ["CHUCK"] },

  { category: "Preventive Maintenance", items: [
    "PROCESS KIT",
    "SLOT VALVE BLADE",
    "TEFLON ALIGN PIN",
    "O RING"
  ]},

  { category: "Leak", items: ["HELIUM DETECTOR"] },

  { category: "Pin", items: [
    "HOOK LIFT PIN",
    "BELLOWS",
    "PIN BOARD",
    "LM GUIDE",
    "PIN MOTOR CONTROLLER",
    "LASER PIN SENSOR"
  ]},

  { category: "EPD", items: ["DUAL"] },

  { category: "Board", items: [
    "DC POWER SUPPLY",
    "PIO SENSOR",
    "D NET",
    "SIM BOARD"
  ]},

  { category: "IGS Block", items: ["MFC", "VALVE"] },

  { category: "Valve", items: [
    "SOLENOID",
    "PENDULUM VALVE",
    "SLOT VALVE DOOR VALVE",
    "SHUTOFF VALVE"
  ]},

  { category: "Rack", items: ["RF GENERATOR"] },

  { category: "ETC", items: [
    "BARATRON ASSY",
    "PIRANI ASSY",
    "VIEW PORT QUARTZ",
    "FLOW SWITCH",
    "CERAMIC PLATE",
    "MONITOR",
    "KEYBOARD",
    "SIDE STORAGE",
    "MULTI PORT 32",
    "MINI8",
    "TM EPC MFC"
  ]},

  { category: "CTR", items: ["CTC", "EFEM CONTROLLER"] },

  { category: "S/W", items: ["SW PATCH"] }
];


const ITEM2CAT = (()=>{ const m={}; for(const g of CATS) for(const it of g.items) m[it]=g.category; return m; })();

function esc(s){ s = (s==null?"":String(s)); return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]); }
const debounce = (fn, ms=200)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

function showToast(text, type="ok"){
  const box = el.toast;
  if (!box) return;
  box.textContent = text;
  box.className = `toast ${type} show`;
  setTimeout(()=> box.classList.remove("show"), 1800);
}

async function loadWorkers(){
  const { data } = await axios.get("/api/specialist/supraxp/workers");
  const list = data?.workers || [];
  el.workerList.innerHTML = list.map(n=>`<option value="${esc(n)}"></option>`).join("");
}

async function fetchAll(worker){
  const { data } = await axios.get("/api/specialist/supraxp/edu?worker="+encodeURIComponent(worker));
  return data?.rows || []; // [{item, add_count}]
}

// ===== 렌더: 데스크톱 테이블 =====
function renderTable(rows){
  const q = (el.filter.value||"").trim().toLowerCase();
  const map = new Map(rows.map(r=>[r.item, Number(r.add_count||0)]));
  const frag = document.createDocumentFragment();

  for (const g of CATS){
    const visible = g.items.filter(it=> !q || it.toLowerCase().includes(q));
    if (!visible.length) continue;

    // 그룹 헤더
    const trh = document.createElement("tr");
    trh.className = "cat-row";
    const td = document.createElement("td");
    td.colSpan = 6;
    td.innerHTML = `<span class="caret">▶</span>${esc(g.category)}`;
    trh.appendChild(td);
    trh.addEventListener("click", ()=>{
      trh.classList.toggle("collapsed");
      // 다음 행들 중 같은 카테고리 모두 토글
      let n = trh.nextElementSibling;
      while(n && !n.classList.contains("cat-row")){
        n.classList.toggle("hidden-row");
        n = n.nextElementSibling;
      }
    });
    frag.appendChild(trh);

    for (const it of visible){
      const v = map.get(it) ?? 0;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="badge">${esc(ITEM2CAT[it]||g.category)}</span></td>
        <td>${esc(it)}</td>
        <td class="mono"><strong data-cur="${esc(it)}">${v}</strong></td>
        <td>
          <div class="editbox">
            <button class="btn step" data-step="-1" aria-label="감소">−</button>
            <input type="number" class="input input-sm" data-edit="${esc(it)}" value="${v}" step="1" inputmode="numeric" pattern="[0-9]*" />
            <button class="btn step" data-step="+1" aria-label="증가">＋</button>
          </div>
        </td>
        <td>
          <button class="btn sm savebtn" data-save="${esc(it)}">저장</button>
        </td>
        <td class="result" data-msg="${esc(it)}"></td>
      `;
      frag.appendChild(tr);
    }
  }
  el.tbody.innerHTML = "";
  el.tbody.appendChild(frag);
}

// ===== 렌더: 모바일 카드 =====
function renderCards(rows){
  const q = (el.filter.value||"").trim().toLowerCase();
  const map = new Map(rows.map(r=>[r.item, Number(r.add_count||0)]));
  const frag = document.createDocumentFragment();

  for (const g of CATS){
    const visible = g.items.filter(it=> !q || it.toLowerCase().includes(q));
    if (!visible.length) continue;

    // 섹션 헤더
    const sec = document.createElement("div");
    sec.className = "cards-section";
    sec.innerHTML = `
      <div class="cards-section-head">
        <button class="section-toggle" aria-label="${esc(g.category)} 접기/펼치기"><span>▶</span>${esc(g.category)}</button>
      </div>
      <div class="cards-section-body"></div>
    `;
    frag.appendChild(sec);

    const body = sec.querySelector(".cards-section-body");
    for (const it of visible){
      const v = map.get(it) ?? 0;
      const card = document.createElement("div");
      card.className = "card-row";
      card.innerHTML = `
        <div class="row-top">
          <span class="badge">${esc(ITEM2CAT[it]||g.category)}</span>
          <b class="item-name">${esc(it)}</b>
        </div>
        <div class="row-mid">
          <div class="kv">
            <div class="k">현재</div><div class="v mono"><strong data-cur="${esc(it)}">${v}</strong></div>
          </div>
          <div class="editbox">
            <button class="btn step" data-step="-1" aria-label="감소">−</button>
            <input type="number" class="input input-sm" data-edit="${esc(it)}" value="${v}" step="1" inputmode="numeric" pattern="[0-9]*" />
            <button class="btn step" data-step="+1" aria-label="증가">＋</button>
          </div>
        </div>
        <div class="row-btm">
          <button class="btn sm savebtn wfull" data-save="${esc(it)}">저장</button>
          <div class="result" data-msg="${esc(it)}"></div>
        </div>
      `;
      body.appendChild(card);
    }

    // 섹션 토글
    const toggle = sec.querySelector(".section-toggle");
    toggle.addEventListener("click", ()=>{
      sec.classList.toggle("collapsed");
    });
  }

  el.cards.innerHTML = "";
  el.cards.appendChild(frag);
}

function isMobile(){
  return window.matchMedia("(max-width: 960px)").matches;
}

function render(rows){
  if (isMobile()){
    el.cards.classList.remove("hidden");
    document.querySelector(".desktop-only")?.classList.add("hidden");
    renderCards(rows);
  }else{
    el.cards.classList.add("hidden");
    document.querySelector(".desktop-only")?.classList.remove("hidden");
    renderTable(rows);
  }
}

async function load(){
  const worker = el.selWorker.value.trim();
  if (!worker) return alert("작업자를 선택하세요.");
  try{
    startLine();
    const rows = await fetchAll(worker);
    render(rows);
  }catch(e){
    console.error(e);
    alert("데이터 로드 실패: "+(e.response?.data?.message || e.message));
  }finally{
    stopLine();
  }
}

function startLine(){
  document.querySelector(".table-scroll .loading-line")?.classList.add("is-loading");
}
function stopLine(){
  document.querySelector(".table-scroll .loading-line")?.classList.remove("is-loading");
}

async function saveOne(item){
  const worker = el.selWorker.value.trim();
  if (!worker) return alert("작업자를 먼저 선택하세요.");
  const selector = `input[data-edit="${CSS.escape(item)}"]`;
  const input = (isMobile() ? el.cards : el.tbody).querySelector(selector);
  if (!input) return;

  // 유효성
  let value = Number(input.value||0);
  if (!Number.isFinite(value) || value < 0) value = Math.max(0, Math.floor(Number(input.value)||0));
  input.value = String(value);

  const btn = (isMobile() ? el.cards : el.tbody).querySelector(`button[data-save="${CSS.escape(item)}"]`);
  const msg = (isMobile() ? el.cards : el.tbody).querySelector(`[data-msg="${CSS.escape(item)}"]`);
  const cur = (isMobile() ? el.cards : el.tbody).querySelector(`strong[data-cur="${CSS.escape(item)}"]`);

  btn?.setAttribute("disabled","true");
  msg && (msg.textContent = "저장 중…");
  try{
    // 낙관적 업데이트 느낌으로 먼저 표시
    const prevShown = cur ? Number(cur.textContent||0) : 0;

    const { data } = await axios.patch("/api/specialist/supraxp/cell", {
      worker, item, mode: "set", value, reason: "specialist 편집"
    });

    // 실제 결과 반영
    if (cur) cur.textContent = String(data.next);
    input.value = String(data.next);
    msg && (msg.textContent = `${dayjs(data.at).format("MM-DD HH:mm")} 저장됨`);
    el.resultLine.textContent = `${dayjs(data.at).format("YYYY-MM-DD HH:mm")} — [${data.worker}] ${data.item} : ${data.prev} → ${data.next} (set)`;

    // 하이라이트
    input.closest("tr, .card-row")?.classList.add("row-saved");
    setTimeout(()=> input.closest("tr, .card-row")?.classList.remove("row-saved"), 900);

    showToast(`저장 완료: ${item} ${prevShown}→${data.next}`, "ok");
  }catch(e){
    console.error(e);
    msg && (msg.textContent = "실패");
    showToast(`저장 실패: ${e.response?.data?.message || e.message}`, "bad");
  }finally{
    btn?.removeAttribute("disabled");
  }
}

function onStepClick(target){
  const step = Number(target.dataset.step || 0);
  const wrap = target.closest(".editbox");
  const inp = wrap?.querySelector("input[data-edit]");
  if (!inp) return;
  let v = Number(inp.value||0);
  if (!Number.isFinite(v)) v = 0;
  v = Math.max(0, v + step);
  inp.value = String(v);
}

document.addEventListener("DOMContentLoaded", async ()=>{
  try{ await loadWorkers(); }catch(e){ console.error(e); }

  // 반응형 렌더 전환
  window.addEventListener("resize", debounce(()=>{
    // 현재 DOM 값을 기반으로 재렌더
    const inputs = [...document.querySelectorAll('input[data-edit]')];
    if (inputs.length){
      const data = inputs.map(inp=>({ item: inp.dataset.edit, add_count: Number(inp.value||0) }));
      render(data);
    }
  }, 150));

  // 검색 필터
  el.filter.addEventListener("input", debounce(()=>{
    const inputs = [...document.querySelectorAll('input[data-edit]')];
    if (!inputs.length) return;
    const rows = inputs.map(inp=>({ item: inp.dataset.edit, add_count: Number(inp.value||0) }));
    render(rows);
  }, 120));

  el.btnLoad.addEventListener("click", load);
  el.btnReload.addEventListener("click", load);

  // 테이블/카드 공통 이벤트 위임
  const root = document.body;
  root.addEventListener("click", (e)=>{
    // stepper
    const stepBtn = e.target.closest(".btn.step");
    if (stepBtn) { onStepClick(stepBtn); return; }
    // 저장
    const saveBtn = e.target.closest("button[data-save]");
    if (saveBtn) { saveOne(saveBtn.dataset.save); return; }
  });
  root.addEventListener("keydown", (e)=>{
    if (e.key !== "Enter") return;
    const input = e.target.closest('input[data-edit]');
    if (!input) return;
    e.preventDefault();
    saveOne(input.dataset.edit);
  });
});
