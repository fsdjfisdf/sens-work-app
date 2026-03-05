/**
 * worklog_new.js — 4단계 · 작업자별 시간 · Work Items/Parts · Overlay 수정
 */
'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  const API = 'http://3.37.73.151:3001';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const getV = id => (document.getElementById(id)?.value || '').trim();

  /* ── Auth ── */
  if (!localStorage.getItem('x-access-token')) { alert('로그인이 필요합니다.'); location.replace('./signin.html'); return; }
  const authH = () => ({ 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('x-access-token') });
  const me = (() => { try { return JSON.parse(atob(localStorage.getItem('x-access-token').split('.')[1])); } catch { return null; } })();

  /* ── Nav ── */
  if (me) { $$('.sign-container.unsigned').forEach(e => e.classList.add('hidden')); $$('.sign-container.signed').forEach(e => e.classList.remove('hidden')); if (me.role !== 'admin') $$('.admin-only').forEach(e => e.style.display = 'none'); }
  $('#sign-out')?.addEventListener('click', () => { localStorage.removeItem('x-access-token'); location.replace('./signin.html'); });
  $('.menu-btn')?.addEventListener('click', () => $('.menu-bar')?.classList.toggle('open'));

  /* ── Today ── */
  const today = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; };
  const td = document.getElementById('task_date'); if (td && !td.value) td.value = today();

  /* ── Enter block ── */
  $('#worklogForm')?.addEventListener('keydown', e => { if (e.key === 'Enter' && document.activeElement?.tagName !== 'TEXTAREA') e.preventDefault(); });

  /* ── Toast ── */
  function showToast(type, msg) { const r = document.getElementById('toast-root'); if (!r) return; const el = document.createElement('div'); el.className = `toast ${type === 'error' ? 'danger' : type}`; el.textContent = msg; r.appendChild(el); setTimeout(() => el.remove(), 5000); }

  /* ══ STEPS ══ */
  let curStep = 1; const STEPS = 4;
  function goStep(n) { const c = $(`.form-step[data-step="${curStep}"]`), x = $(`.form-step[data-step="${n}"]`); if (!x || c === x) return; c?.classList.remove('active'); x.classList.add('active'); curStep = n; updInd(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function updInd() { $$('.step-dot').forEach(d => { const t = +d.dataset.target; d.classList.toggle('active', t === curStep); d.classList.toggle('completed', t < curStep); }); $$('.step-line').forEach((l, i) => l.classList.toggle('done', i + 1 < curStep)); }
  $$('.next-step').forEach(b => b.addEventListener('click', () => { if (valStep(curStep)) goStep(curStep + 1); }));
  $$('.prev-step').forEach(b => b.addEventListener('click', () => goStep(curStep - 1)));

  /* ══ EMS ══ */
  let emsOvr = false;
  const emsH = document.getElementById('ems-hint');
  function recEms() { const w = getV('warranty'); if (!w || w === 'SELECT') return null; return w === 'WO' ? 1 : 0; }
  function applyEms(f = false) { const r = recEms(); if (r === null) { if (emsH) emsH.textContent = '권고: -'; return; } if (emsH) emsH.textContent = `권고: ${r === 1 ? '유상' : '무상'}`; if (!emsOvr || f) { const rd = $(`input[name="emsChoice"][value="${r}"]`); if (rd) rd.checked = true; } }
  document.getElementById('warranty')?.addEventListener('change', () => { emsOvr = false; applyEms(); });
  $$('input[name="emsChoice"]').forEach(r => r.addEventListener('change', () => { emsOvr = true; }));
  document.getElementById('ems-auto-btn')?.addEventListener('click', () => { emsOvr = false; applyEms(true); });
  function curEms() { const c = $('input[name="emsChoice"]:checked'); return c ? Number(c.value) : null; }

  /* ══ WORK TYPE 표시/숨김 + Work Items/Parts ══ */
  let masterItems = [], masterParts = [];
  const selectedWI = []; // { master_id?, item_name_free? }
  const selectedParts = []; // { master_id?, part_name_free?, qty }

  document.getElementById('workType')?.addEventListener('change', function () {
    const isSetup = this.value === 'SET UP' || this.value === 'RELOCATION';
    const isMaint = this.value === 'MAINT';
    document.getElementById('setup-item-row')?.classList.toggle('hidden', !isSetup);
    document.getElementById('worksort-row')?.classList.toggle('hidden', !isMaint);
    document.getElementById('work-items-section')?.classList.toggle('hidden', !isMaint);
    document.getElementById('parts-section')?.classList.toggle('hidden', !isMaint);
    if (isMaint) fetchMasterData();
  });

  // EQ TYPE 변경 시 마스터 재로딩
  document.getElementById('equipment_type')?.addEventListener('change', () => {
    if (getV('workType') === 'MAINT') fetchMasterData();
  });

  async function fetchMasterData() {
    const eqType = getV('equipment_type');
    if (!eqType || eqType === 'SELECT') return;
    try {
      const [wiRes, ptRes] = await Promise.all([
        axios.get(`${API}/wl/master/work-items?equipment_type=${encodeURIComponent(eqType)}`, { headers: authH() }),
        axios.get(`${API}/wl/master/parts?equipment_type=${encodeURIComponent(eqType)}`, { headers: authH() }),
      ]);
      masterItems = wiRes.data.items || [];
      masterParts = ptRes.data.parts || [];
      renderWIList();
      renderPartMasterList();
    } catch { /* silent */ }
  }

  /* -- Work Items multi-select -- */
  function renderWIList(filter = '') {
    const list = document.getElementById('wi-list');
    const f = filter.toLowerCase();
    const html = masterItems
      .filter(it => !f || it.item_name.toLowerCase().includes(f) || (it.item_name_kr || '').toLowerCase().includes(f))
      .map(it => {
        const chosen = selectedWI.some(s => s.master_id === it.id);
        return `<div class="ms-opt ${chosen ? 'chosen' : ''}" data-mid="${it.id}">${it.item_name}${it.item_name_kr ? ` (${it.item_name_kr})` : ''}</div>`;
      }).join('');
    list.innerHTML = html || '<div class="ms-opt" style="color:var(--muted);cursor:default;">항목 없음</div>';
  }

  function renderWIChips() {
    const c = document.getElementById('wi-chips');
    c.innerHTML = selectedWI.map((s, i) => {
      const label = s.master_id ? (masterItems.find(m => m.id === s.master_id)?.item_name || `#${s.master_id}`) : s.item_name_free;
      return `<span class="ms-chip">${label}<button class="ms-chip-x" data-idx="${i}">×</button></span>`;
    }).join('');
    c.querySelectorAll('.ms-chip-x').forEach(b => b.addEventListener('click', () => { selectedWI.splice(+b.dataset.idx, 1); renderWIChips(); renderWIList($('#wi-search')?.value || ''); }));
  }

  document.getElementById('wi-search')?.addEventListener('focus', () => { document.getElementById('wi-list').classList.add('open'); renderWIList(); });
  document.getElementById('wi-search')?.addEventListener('input', e => renderWIList(e.target.value));
  document.getElementById('wi-list')?.addEventListener('click', e => {
    const opt = e.target.closest('.ms-opt[data-mid]');
    if (!opt) return;
    const mid = +opt.dataset.mid;
    const idx = selectedWI.findIndex(s => s.master_id === mid);
    if (idx >= 0) selectedWI.splice(idx, 1); else selectedWI.push({ master_id: mid });
    renderWIChips(); renderWIList($('#wi-search')?.value || '');
  });
  document.addEventListener('click', e => { if (!e.target.closest('#ms-work-items')) document.getElementById('wi-list')?.classList.remove('open'); });
  document.getElementById('wi-free-add')?.addEventListener('click', () => {
    const v = document.getElementById('wi-free').value.trim();
    if (!v) return;
    selectedWI.push({ item_name_free: v });
    document.getElementById('wi-free').value = '';
    renderWIChips();
  });

  /* -- Parts -- */
  function renderPartMasterList(filter = '') {
    const list = document.getElementById('part-master-list');
    const f = filter.toLowerCase();
    list.innerHTML = masterParts
      .filter(p => !f || p.part_name.toLowerCase().includes(f))
      .map(p => `<div class="ms-opt" data-pmid="${p.id}">${p.part_name}${p.part_name_kr ? ` (${p.part_name_kr})` : ''}</div>`)
      .join('');
  }

  function renderPartsRows() {
    const c = document.getElementById('parts-list');
    c.innerHTML = selectedParts.map((p, i) => {
      const label = p.master_id ? (masterParts.find(m => m.id === p.master_id)?.part_name || `#${p.master_id}`) : p.part_name_free;
      return `<div class="parts-row"><span style="flex:1;font-size:13px;font-weight:600;">${label}</span><span style="font-size:12px;color:var(--muted);">×${p.qty}</span><button class="btn-remove" data-idx="${i}">−</button></div>`;
    }).join('');
    c.querySelectorAll('.btn-remove').forEach(b => b.addEventListener('click', () => { selectedParts.splice(+b.dataset.idx, 1); renderPartsRows(); }));
  }

  document.getElementById('part-name')?.addEventListener('focus', () => { document.getElementById('part-master-list').classList.add('open'); renderPartMasterList(); });
  document.getElementById('part-name')?.addEventListener('input', e => renderPartMasterList(e.target.value));
  document.getElementById('part-master-list')?.addEventListener('click', e => {
    const opt = e.target.closest('.ms-opt[data-pmid]');
    if (!opt) return;
    const mid = +opt.dataset.pmid;
    const name = masterParts.find(m => m.id === mid)?.part_name || '';
    document.getElementById('part-name').value = name;
    document.getElementById('part-master-list').classList.remove('open');
  });
  document.addEventListener('click', e => { if (!e.target.closest('#parts-section')) document.getElementById('part-master-list')?.classList.remove('open'); });

  document.getElementById('part-add-btn')?.addEventListener('click', () => {
    const name = document.getElementById('part-name').value.trim();
    const qty = Number(document.getElementById('part-qty').value) || 1;
    if (!name) return;
    const master = masterParts.find(m => m.part_name === name);
    if (master) selectedParts.push({ master_id: master.id, qty });
    else selectedParts.push({ part_name_free: name, qty });
    document.getElementById('part-name').value = '';
    document.getElementById('part-qty').value = '1';
    renderPartsRows();
  });

  /* ══ Worker 관련 ══ */
  function calcWD(c) {
    const s = c.querySelector('.worker-start-time')?.value || '', e = c.querySelector('.worker-end-time')?.value || '';
    const n = Number(c.querySelector('.worker-none-time')?.value) || 0, m = Number(c.querySelector('.worker-move-time')?.value) || 0;
    const el = c.querySelector('.worker-calc-duration'); if (!el) return;
    if (!s || !e) { el.textContent = '—'; return; }
    const toM = t => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };
    const tot = toM(e) - toM(s) - n - m;
    el.textContent = tot <= 0 ? '0분' : `${Math.floor(tot/60)}시간 ${tot%60}분`;
  }
  function bindWTC(c) { ['worker-start-time','worker-end-time','worker-none-time','worker-move-time'].forEach(cls => c.querySelector(`.${cls}`)?.addEventListener('input', () => calcWD(c))); }
  const firstW = $('.task-man-container'); if (firstW) bindWTC(firstW);

  function mkWorker(name = '', role = 'main') {
    const d = document.createElement('div'); d.className = 'task-man-container';
    d.innerHTML = `<div class="worker-main-row"><input type="text" class="task-man-input" placeholder="이름" value="${name.replace(/"/g,'&quot;')}" required><select class="task-man-role"><option value="main"${role==='main'?' selected':''}>main</option><option value="support"${role==='support'?' selected':''}>support</option></select><button type="button" class="btn-remove remove-worker">−</button></div><div class="worker-time-row"><div><label>START</label><input type="time" class="worker-start-time"></div><div><label>END</label><input type="time" class="worker-end-time"></div><div><label>NONE(분)</label><input type="number" class="worker-none-time" min="0" value="0"></div><div><label>MOVE(분)</label><input type="number" class="worker-move-time" min="0" value="0"></div></div><div class="worker-duration-preview">실 작업: <span class="worker-calc-duration">—</span></div>`;
    d.querySelector('.remove-worker').addEventListener('click', () => { d.remove(); updRmBtns(); });
    bindWTC(d); return d;
  }
  function updRmBtns() { const b = $$('.remove-worker'); b.forEach((x, i) => { x.disabled = (i === 0 && b.length === 1); }); }

  document.getElementById('add-worker')?.addEventListener('click', () => {
    const c = document.getElementById('task-mans-container'), ba = c.querySelector('.worker-bulk-actions');
    c.insertBefore(mkWorker(), ba); updRmBtns();
  });
  document.getElementById('copy-time-all')?.addEventListener('click', () => {
    const cs = $$('.task-man-container'); if (cs.length < 2) return;
    const src = cs[0]; const sv = src.querySelector('.worker-start-time')?.value||'', ev = src.querySelector('.worker-end-time')?.value||'', nv = src.querySelector('.worker-none-time')?.value||'0', mv = src.querySelector('.worker-move-time')?.value||'0';
    cs.slice(1).forEach(c => { c.querySelector('.worker-start-time').value = sv; c.querySelector('.worker-end-time').value = ev; c.querySelector('.worker-none-time').value = nv; c.querySelector('.worker-move-time').value = mv; calcWD(c); });
    showToast('success', '시간이 전체 복사되었습니다.');
  });

  /* ══ Dynamic textarea ══ */
  function addDyn(cid, ic, inp, rc, aid) {
    document.getElementById(aid)?.addEventListener('click', () => {
      const c = document.getElementById(cid), b = document.getElementById(aid);
      const d = document.createElement('div'); d.className = ic;
      d.innerHTML = `<textarea class="${inp}" rows="3"></textarea><button type="button" class="btn-remove ${rc}">−</button>`;
      d.querySelector(`.${rc}`).addEventListener('click', () => d.remove());
      c.insertBefore(d, b);
    });
  }
  addDyn('task-descriptions-container','task-desc-item','task-description-input','remove-desc','add-desc');
  addDyn('task-causes-container','task-cause-item','task-cause-input','remove-cause','add-cause');
  addDyn('task-results-container','task-result-item','task-result-input','remove-result','add-result');

  /* ══ Validation ══ */
  function valStep(s) {
    switch (s) {
      case 1: {
        if (!getV('task_date')) { showToast('error','WORK DATE를 입력하세요.'); return false; }
        if (!getV('equipment_name')) { showToast('error','EQ NAME을 입력하세요.'); return false; }
        if (getV('group') === 'SELECT') { showToast('error','GROUP을 선택하세요.'); return false; }
        if (getV('site') === 'SELECT') { showToast('error','SITE를 선택하세요.'); return false; }
        if (getV('equipment_type') === 'SELECT') { showToast('error','EQ TYPE을 선택하세요.'); return false; }
        if (getV('warranty') === 'SELECT') { showToast('error','WARRANTY를 선택하세요.'); return false; }
        if (curEms() === null) { showToast('error','EMS를 선택하세요.'); return false; }
        return true;
      }
      case 2: { if (getV('workType') === 'SELECT') { showToast('error','WORK TYPE을 선택하세요.'); return false; } return true; }
      case 3: {
        const cs = $$('.task-man-container');
        const ns = cs.map(c => c.querySelector('.task-man-input')?.value.trim()).filter(Boolean);
        if (!ns.length) { showToast('error','작업자를 1명 이상 입력하세요.'); return false; }
        for (const c of cs) {
          const n = c.querySelector('.task-man-input')?.value.trim(); if (!n) continue;
          const s = c.querySelector('.worker-start-time')?.value, e = c.querySelector('.worker-end-time')?.value;
          if (!s || !e) { showToast('error', `${n}의 시작/종료 시간을 입력하세요.`); return false; }
          const toS = t => { const [h,m] = t.split(':').map(Number); return h*3600+m*60; };
          if (toS(e) <= toS(s)) { showToast('error', `${n}의 종료 시간은 시작 시간보다 늦어야 합니다.`); return false; }
        }
        return true;
      }
      case 4: { if (!getV('task_name')) { showToast('error','TITLE을 입력하세요.'); return false; } return true; }
      default: return true;
    }
  }

  /* ══ Preview ══ */
  document.getElementById('preview-save')?.addEventListener('click', () => {
    for (let i = 1; i <= STEPS; i++) { if (!valStep(i)) { goStep(i); return; } }
    const now = new Date();
    if (now.getHours() < 11 && getV('task_date') === today()) { if (!confirm('현재 시간이 오전 11시 이전입니다. 오늘 작업이 맞습니까?')) { goStep(1); return; } }

    const ws = $$('.task-man-container').map(c => {
      const n = c.querySelector('.task-man-input')?.value.trim() || '', r = c.querySelector('.task-man-role')?.value || 'main';
      const s = c.querySelector('.worker-start-time')?.value || '', e = c.querySelector('.worker-end-time')?.value || '';
      const nn = c.querySelector('.worker-none-time')?.value || '0', mm = c.querySelector('.worker-move-time')?.value || '0';
      return n ? `${n}(${r}) ${s}~${e} 논:${nn}분 무브:${mm}분` : '';
    }).filter(Boolean);

    const wiStr = selectedWI.map(s => s.master_id ? (masterItems.find(m => m.id === s.master_id)?.item_name || '') : s.item_name_free).join(', ');
    const ptStr = selectedParts.map(p => { const nm = p.master_id ? (masterParts.find(m => m.id === p.master_id)?.part_name || '') : p.part_name_free; return `${nm} ×${p.qty}`; }).join(', ');

    document.getElementById('pv-date').textContent = getV('task_date');
    document.getElementById('pv-ems').textContent = curEms() === 1 ? '유상 (EMS)' : '무상 (WI)';
    document.getElementById('pv-site').textContent = `${getV('site')} / ${getV('line')}`;
    document.getElementById('pv-eqname').textContent = getV('equipment_name');
    document.getElementById('pv-eqtype').textContent = getV('equipment_type');
    document.getElementById('pv-worktype').textContent = `${getV('workType')} / ${getV('workType2') || getV('additionalWorkType') || '-'}`;
    document.getElementById('pv-workitems').textContent = wiStr || '—';
    document.getElementById('pv-parts').textContent = ptStr || '—';
    document.getElementById('pv-workers').textContent = ws.join('\n');
    document.getElementById('pv-title').textContent = getV('task_name');
    document.getElementById('pv-rework').textContent = document.getElementById('is-rework')?.checked ? '✅ Rework' : '-';
    showOverlay('preview-modal');
  });

  /* ══ Overlay 관리 (핵심 수정) ══ */
  const overlay = document.getElementById('modal-overlay');
  let activeModal = null;

  function showOverlay(modalId) {
    activeModal = modalId;
    overlay.style.display = 'block';
    document.getElementById(modalId).style.display = 'block';
  }
  function hideAll() {
    overlay.style.display = 'none';
    ['preview-modal', 'result-modal', 'popup'].forEach(id => { document.getElementById(id).style.display = 'none'; });
    activeModal = null;
  }

  // 오버레이 클릭 → 모든 모달/팝업 닫기
  overlay.addEventListener('click', hideAll);

  document.getElementById('cancel-save')?.addEventListener('click', hideAll);

  /* ══ Submit ══ */
  document.getElementById('confirm-save')?.addEventListener('click', async () => {
    hideAll();
    const workers = $$('.task-man-container').map(c => ({
      name: c.querySelector('.task-man-input')?.value.trim() || '',
      role: c.querySelector('.task-man-role')?.value || 'main',
      start_time: c.querySelector('.worker-start-time')?.value ? c.querySelector('.worker-start-time').value + ':00' : null,
      end_time: c.querySelector('.worker-end-time')?.value ? c.querySelector('.worker-end-time').value + ':00' : null,
      none_time: Number(c.querySelector('.worker-none-time')?.value) || 0,
      move_time: Number(c.querySelector('.worker-move-time')?.value) || 0,
    })).filter(w => w.name);

    const task_description = $$('.task-description-input').map(el => el.value.trim()).filter(Boolean).join('\n');
    const task_cause = $$('.task-cause-input').map(el => el.value.trim()).filter(Boolean).join('\n');
    const task_result = $$('.task-result-input').map(el => el.value.trim()).filter(Boolean).join('\n');

    const payload = {
      task_name: getV('task_name'), task_date: getV('task_date'), country: getV('country') || 'KR',
      group: getV('group'), site: getV('site'), line: getV('line'),
      equipment_type: getV('equipment_type'), equipment_name: getV('equipment_name'),
      warranty: getV('warranty'), ems: curEms(),
      work_type: getV('workType'), work_type2: getV('workType2') || null,
      setup_item: getV('additionalWorkType') || null,
      status: getV('status'), task_description, task_cause, task_result,
      SOP: getV('SOP'), tsguide: getV('tsguide'),
      start_time: null, end_time: null, none_time: 0, move_time: 0,
      is_rework: document.getElementById('is-rework')?.checked ? 1 : 0,
      workers,
      workItems: selectedWI,
      parts: selectedParts,
    };

    try {
      const res = await axios.post(`${API}/wl/submit`, payload, { headers: authH() });
      if (res.status === 201) {
        document.getElementById('result-msg').textContent = '결재 대기 등록이 완료되었습니다.';
        document.getElementById('result-code').textContent = `Work Code: ${res.data.work_code || '-'}`;
        showOverlay('result-modal');
      }
    } catch (err) {
      const s = err.response?.status, m = err.response?.data?.error || err.message;
      let t = '저장 실패'; if (s === 401) t = '인증 만료'; if (s === 400) t = '입력 오류'; if (s === 403) t = '권한 없음'; if (s >= 500) t = '서버 오류';
      showToast('error', `${t}: ${m}`);
    }
  });

  document.getElementById('result-ok')?.addEventListener('click', () => { hideAll(); $('#worklogForm')?.reset(); selectedWI.length = 0; selectedParts.length = 0; renderWIChips(); renderPartsRows(); goStep(1); });

  /* ══ PASTE ══ */
  const pasteTA = document.getElementById('paste-textarea');
  document.getElementById('paste-button')?.addEventListener('click', () => showOverlay('popup'));
  document.getElementById('paste-cancel')?.addEventListener('click', hideAll);
  pasteTA?.addEventListener('input', () => { document.getElementById('paste-lines').textContent = pasteTA.value.split('\n').length; document.getElementById('paste-chars').textContent = pasteTA.value.length; });
  document.getElementById('paste-submit')?.addEventListener('click', () => { const t = pasteTA?.value || ''; if (!t.trim()) return; parsePaste(t); hideAll(); });

  function parsePaste(raw) {
    const lines = raw.split('\n'); let title = '', statusL = [], actL = [], cauL = [], resL = [], wLine = '', tLine = '', sec = '';
    for (const l of lines) {
      const t = l.trim(); if (!t) continue;
      if (!title && !t.match(/^\d\)/)) { title = t; continue; }
      if (t.match(/^1\)\s*STATUS/i)) { sec = 'st'; continue; }
      if (t.match(/^2\)\s*ACTION/i)) { sec = 'ac'; continue; }
      if (t.match(/^3\)\s*CAUSE/i)) { sec = 'ca'; continue; }
      if (t.match(/^4\)\s*RESULT/i)) { sec = 're'; continue; }
      if (t.match(/^5\)/)) { sec = ''; continue; }
      if (t.match(/^작업자\s*[:：]/)) { wLine = t; continue; }
      if (t.match(/^작업\s*시간\s*[:：]/)) { tLine = t; continue; }
      if (sec === 'st') statusL.push(t); else if (sec === 'ac') actL.push(t); else if (sec === 'ca') cauL.push(t); else if (sec === 're') resL.push(t);
    }
    if (title) { const el = document.getElementById('task_name'); if (el) el.value = title; }
    if (statusL.length) { const el = document.getElementById('status'); if (el) el.value = statusL.join('\n'); }
    fillDyn('task-descriptions-container', '.task-description-input', 'task-desc-item', 'remove-desc', 'add-desc', actL);
    fillDyn('task-causes-container', '.task-cause-input', 'task-cause-item', 'remove-cause', 'add-cause', cauL);
    fillDyn('task-results-container', '.task-result-input', 'task-result-item', 'remove-result', 'add-result', resL);
    let pS = '', pE = '', pN = 0, pM = 0;
    if (tLine) { const m = tLine.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/); if (m) { pS = m[1].padStart(5,'0'); pE = m[2].padStart(5,'0'); } const nm = tLine.match(/논\s*(\d+)/); const mm = tLine.match(/무브\s*(\d+)/); if (nm) pN = +nm[1]; if (mm) pM = +mm[1]; }
    if (wLine) {
      const names = wLine.replace(/^작업자\s*[:：]\s*/,'').split(/[,，、]/).map(s=>s.trim()).filter(Boolean);
      const con = document.getElementById('task-mans-container'), ba = con.querySelector('.worker-bulk-actions');
      $$('.task-man-container').slice(1).forEach(el => el.remove());
      if (names[0]) { const f = $('.task-man-container'); if (f) { f.querySelector('.task-man-input').value = names[0]; if (pS) f.querySelector('.worker-start-time').value = pS; if (pE) f.querySelector('.worker-end-time').value = pE; f.querySelector('.worker-none-time').value = pN; f.querySelector('.worker-move-time').value = pM; calcWD(f); } }
      names.slice(1).forEach(name => { const r = mkWorker(name); r.querySelector('.worker-start-time').value = pS; r.querySelector('.worker-end-time').value = pE; r.querySelector('.worker-none-time').value = pN; r.querySelector('.worker-move-time').value = pM; con.insertBefore(r, ba); calcWD(r); });
      updRmBtns();
    }
    goStep(4);
  }

  function fillDyn(cid, isel, ic, rc, aid, lines) {
    if (!lines.length) return;
    const c = document.getElementById(cid), b = document.getElementById(aid);
    c.querySelectorAll(`.${ic}`).forEach(el => el.remove());
    const d = document.createElement('div'); d.className = ic;
    d.innerHTML = `<textarea class="${isel.replace('.','')}" rows="4"></textarea><button type="button" class="btn-remove ${rc}">−</button>`;
    d.querySelector('textarea').value = lines.join('\n');
    d.querySelector(`.${rc}`).addEventListener('click', () => d.remove());
    c.insertBefore(d, b);
  }

  /* ══ Equipment Modal ══ */
  document.querySelector('.equipment-add-modal-close')?.addEventListener('click', () => document.getElementById('equipment-add-modal')?.classList.remove('active'));
  document.getElementById('cancel-equipment-add')?.addEventListener('click', () => document.getElementById('equipment-add-modal')?.classList.remove('active'));
});
