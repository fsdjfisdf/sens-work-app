/* Specialist — INTEGER SETUP 교육(가산) 횟수 편집 */

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

const API_BASE = "/api/specialist/integer-setup";

/** 표시명 ←→ DB 컬럼 매핑 */
const DISPLAY_ITEMS = [
  "INSTALLATION PREPARATION","FAB IN","DOCKING","CABLE HOOK UP","POWER TURN ON",
  "UTILITY TURN ON","GAS TURN ON","TEACHING","PART INSTALLATION","LEAK CHECK",
  "TTTM","CUSTOMER CERTIFICATION","PROCESS CONFIRM"
];

const DISPLAY2DB = {
  "INSTALLATION PREPARATION": "INSTALLATION_PREPERATION", // (오타 주의)
  "FAB IN": "FAB_IN",
  "DOCKING": "DOCKING",
  "CABLE HOOK UP": "CABLE_HOOK_UP",
  "POWER TURN ON": "POWER_TURN_ON",
  "UTILITY TURN ON": "UTILITY_TURN_ON",
  "GAS TURN ON": "GAS_TURN_ON",
  "TEACHING": "TEACHING",
  "PART INSTALLATION": "PART_INSTALLATION",
  "LEAK CHECK": "LEAK_CHECK",
  "TTTM": "TTTM",
  "CUSTOMER CERTIFICATION": "CUSTOMER_CERTIFICATION",
  "PROCESS CONFIRM": "PROCESS_CONFIRM"
};
const DB2DISPLAY = Object.fromEntries(Object.entries(DISPLAY2DB).map(([k,v])=>[v,k]));

/** 보기용 그룹 */
const GROUPS = [
  { category: "PREP & FAB IN", items: ["INSTALLATION PREPARATION","FAB IN"] },
  { category: "DOCK & CABLE", items: ["DOCKING","CABLE HOOK UP"] },
  { category: "TURN ON", items: ["POWER TURN ON","UTILITY TURN ON","GAS TURN ON"] },
  { category: "TEACHING", items: ["TEACHING"] },
  { category: "PARTS & LEAK", items: ["PART INSTALLATION","LEAK CHECK"] },
  { category: "TTTM", items: ["TTTM"] },
  { category: "CERT & PROCESS", items: ["CUSTOMER CERTIFICATION","PROCESS CONFIRM"] }
];
const ITEM2CAT = (()=>{ const m={}; for(const g of GROUPS) for(const it of g.items) m[it]=g.category; return m; })();

function esc(s){ s = (s==null?"":String(s)); return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]); }
const debounce = (fn, ms=200)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
function showToast(text, type="ok"){
  const box = el.toast; if (!box) return;
  box.textContent = text; box.className = `toast ${type} show`;
  setTimeout(()=> box.classList.remove("show"), 1800);
}

async function loadWorkers(){
  const { data } = await axios.get(`${API_BASE}/workers`);
  const list = data?.workers || [];
  el.workerList.innerHTML = list.map(n=>`<option value="${esc(n)}"></option>`).join("");
}

async function fetchAll(worker){
  const { data } = await axios.get(`${API_BASE}/edu?worker=`+encodeURIComponent(worker));
  // [{ item: "INSTALLATION PREPARATION", add_count: 0 }, ...]
  return data?.rows || [];
}

function isMobile(){ return window.matchMedia("(max-width: 960px)").matches; }

function render(rows){
  if (isMobile()) renderCards(rows); else renderTable(rows);
}

function renderTable(rows){
  const q = (el.filter.value||"").trim().toLowerCase();
  const map = new Map(rows.map(r=>[r.item, Number(r.add_count||0)]));
  const frag = document.createDocumentFragment();
  // 그룹 순회
  for (const g of GROUPS){
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
        <td><button class="btn sm savebtn" data-save="${esc(it)}">저장</button></td>
        <td class="result" data-msg="${esc(it)}"></td>
      `;
      frag.appendChild(tr);
    }
  }
  el.tbody.innerHTML = ""; el.tbody.appendChild(frag);
}

function renderCards(rows){
  const q = (el.filter.value||"").trim().toLowerCase();
  const map = new Map(rows.map(r=>[r.item, Number(r.add_count||0)]));
  const frag = document.createDocumentFragment();

  for (const g of GROUPS){
    const visible = g.items.filter(it=> !q || it.toLowerCase().includes(q));
    if (!visible.length) continue;

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
    sec.querySelector(".section-toggle").addEventListener("click", ()=> sec.classList.toggle("collapsed"));
  }
  el.cards.innerHTML = ""; el.cards.appendChild(frag);
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

function startLine(){ document.querySelector(".table-scroll .loading-line")?.classList.add("is-loading"); }
function stopLine(){ document.querySelector(".table-scroll .loading-line")?.classList.remove("is-loading"); }

async function saveOne(item){
  const worker = el.selWorker.value.trim();
  if (!worker) return alert("작업자를 먼저 선택하세요.");
  const root = isMobile() ? el.cards : el.tbody;
  const inp = root.querySelector(`input[data-edit="${CSS.escape(item)}"]`);
  if (!inp) return;

  let value = Number(inp.value||0);
  if (!Number.isFinite(value) || value < 0) value = Math.max(0, Math.floor(Number(inp.value)||0));
  inp.value = String(value);

  const btn = root.querySelector(`button[data-save="${CSS.escape(item)}"]`);
  const msg = root.querySelector(`[data-msg="${CSS.escape(item)}"]`);
  const cur = root.querySelector(`strong[data-cur="${CSS.escape(item)}"]`);

  btn?.setAttribute("disabled","true");
  msg && (msg.textContent = "저장 중…");
  try{
    const prevShown = cur ? Number(cur.textContent||0) : 0;
    const { data } = await axios.patch(`${API_BASE}/cell`, {
      worker, item, mode: "set", value, reason: "integer-setup specialist 편집"
    });
    if (cur) cur.textContent = String(data.next);
    inp.value = String(data.next);
    msg && (msg.textContent = `${dayjs(data.at).format("MM-DD HH:mm")} 저장됨`);
    el.resultLine.textContent = `${dayjs(data.at).format("YYYY-MM-DD HH:mm")} — [${data.worker}] ${data.item} : ${data.prev} → ${data.next} (set)`;
    inp.closest("tr, .card-row")?.classList.add("row-saved");
    setTimeout(()=> inp.closest("tr, .card-row")?.classList.remove("row-saved"), 900);
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
  window.addEventListener("resize", debounce(()=>{
    const inputs = [...document.querySelectorAll('input[data-edit]')];
    if (inputs.length){
      const data = inputs.map(inp=>({ item: inp.dataset.edit, add_count: Number(inp.value||0) }));
      render(data);
    }
  }, 150));
  el.filter.addEventListener("input", debounce(()=>{
    const inputs = [...document.querySelectorAll('input[data-edit]')];
    if (!inputs.length) return;
    const rows = inputs.map(inp=>({ item: inp.dataset.edit, add_count: Number(inp.value||0) }));
    render(rows);
  }, 120));

  el.btnLoad.addEventListener("click", load);
  el.btnReload.addEventListener("click", load);

  document.body.addEventListener("click", (e)=>{
    const stepBtn = e.target.closest(".btn.step");
    if (stepBtn) { onStepClick(stepBtn); return; }
    const saveBtn = e.target.closest("button[data-save]");
    if (saveBtn) { saveOne(saveBtn.dataset.save); return; }
  });
  document.body.addEventListener("keydown", (e)=>{
    if (e.key !== "Enter") return;
    const input = e.target.closest('input[data-edit]');
    if (!input) return;
    e.preventDefault();
    saveOne(input.dataset.edit);
  });
});
