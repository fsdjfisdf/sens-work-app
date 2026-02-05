(() => {
  'use strict';

  const STEPS = [
    { no: 1,  name: 'TEMPLATE DRAW' },
    { no: 2,  name: 'TEMPLATE 확인' },
    { no: 3,  name: 'FAB IN' },
    { no: 4,  name: 'DOCKING' },
    { no: 5,  name: 'CABLE H/U' },
    { no: 6,  name: 'SILICON' },
    { no: 7,  name: 'POWER T/O' },
    { no: 8,  name: 'UTILITY T/O' },
    { no: 9,  name: 'TEACHING' },
    { no: 10, name: 'GAS T/O' },
    { no: 11, name: 'PUMP T/O' },
    { no: 12, name: 'CHILLER T/O' },
    { no: 13, name: 'HEAT EX T/O' },
    { no: 14, name: 'TTTM' },
    { no: 15, name: '인증 준비' },
    { no: 16, name: '중간 인증' },
    { no: 17, name: 'PROCESS CONFIRM' }
  ];

  const STATUS_ORDER = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'HOLD'];

  // ✅ 선행조건 템플릿(표시는 프론트에서 하되, 저장/조회는 DB API만)
  const PREREQS = [
    { code:'AGV_INSTALL', title:'AGV 설치', required:false, requiredBefore:'SILICON', desc:'SILICON 전 설치 권장' },
    { code:'LP_SETUP', title:'LP SET UP', required:true, requiredBefore:'TEACHING', desc:'TEACHING 전 필수' },
    { code:'OHT_CERT', title:'OHT 가동 인증', required:true, requiredBefore:'TEACHING', desc:'TEACHING 전 필수' },
    { code:'TRAY_INSTALL', title:'Tray 설치', required:true, requiredBefore:'CABLE H/U', desc:'CABLE H/U 전 필수' },
    { code:'THREE_PHASE', title:'3상 설치', required:true, requiredBefore:'POWER T/O', desc:'POWER T/O 전 필수' },
    { code:'PCW_PRESSURE_PASS', title:'PCW LINE 가압 PASS', required:true, requiredBefore:'UTILITY T/O', desc:'UTILITY T/O 전 필수' },
    { code:'GAS_PRESSURE_PASS', title:'GAS LINE 가압 PASS', required:true, requiredBefore:'GAS T/O', desc:'GAS T/O 전 필수' },
    { code:'RF_CAL', title:'RF CAL', required:true, requiredBefore:'중간 인증', desc:'중간 인증 전 필수' },
    { code:'ENV_QUAL', title:'환경 QUAL', required:true, requiredBefore:'중간 인증', desc:'중간 인증 전 필수' },
    { code:'MFC_CERT', title:'MFC 인증', required:true, requiredBefore:'중간 인증', desc:'중간 인증 전 필수' },
    { code:'SEISMIC_BKT', title:'지진방지 BKT 체결', required:true, requiredBefore:'중간 인증', desc:'중간 인증 전 필수' },
  ];

  const $ = (sel, root=document) => root.querySelector(sel);

  const el = {
    btnNew: $('#btnNew'),
    btnHelp: $('#btnHelp'),
    btnApply: $('#btnApply'),
    tableHost: $('#tableHost'),
    statCount: $('#statCount'),

    fEqType: $('#fEqType'),
    fSite: $('#fSite'),
    fLine: $('#fLine'),
    fStatus: $('#fStatus'),
    fQ: $('#fQ'),

    modal: $('#modal'),
    btnClose: $('#btnClose'),
    mTitle: $('#mTitle'),
    mMeta: $('#mMeta'),

    // project form
    p_equipment_name: $('#p_equipment_name'),
    p_equipment_type: $('#p_equipment_type'),
    p_site: $('#p_site'),
    p_line: $('#p_line'),
    p_location: $('#p_location'),
    p_board_status: $('#p_board_status'),
    p_start_date_auto: $('#p_start_date_auto'),
    p_last_note: $('#p_last_note'),
    btnSaveProject: $('#btnSaveProject'),
    projSaveHint: $('#projSaveHint'),

    // modal tabs
    tabSteps: $('#tabSteps'),
    tabPrereq: $('#tabPrereq'),
    viewSteps: $('#viewSteps'),
    viewPrereq: $('#viewPrereq'),

    stepsHost: $('#stepsHost'),
    prereqHost: $('#prereqHost'),
    prBadge: $('#prBadge'),

    // help modal
    helpModal: $('#helpModal'),
    btnHelpClose: $('#btnHelpClose'),

    tooltip: $('#tooltip'),
    toast: $('#toast')
  };

  const state = {
    list: [],
    detailCache: new Map(),  // setupId -> {project, steps}
    prereqCache: new Map(),  // setupId -> map from code to row
    selectedSetupId: null,
    createMode: false,

    hoverTimer: null,
    hoverKey: null
  };

  function getToken() {
    return localStorage.getItem('x-access-token') || '';
  }

  async function apiFetch(path, { method='GET', body=null } = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'x-access-token': getToken()
    };

    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : null });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('x-access-token');
      alert('로그인이 만료되었습니다. 다시 로그인 해주세요.');
      window.location.replace('/signin.html');
      throw new Error('인증 만료');
    }

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) {
      const msg = json?.error || json?.message || text || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function fmtDateISO(d) {
    if (!d) return '';
    const s = String(d);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  function fmtYYMMDD(d) {
    const iso = fmtDateISO(d);
    if (!iso) return '';
    return `${iso.slice(2,4)}.${iso.slice(5,7)}.${iso.slice(8,10)}`;
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.add('hidden'), 2200);
  }

  function statusToClass(st) {
    const s = String(st || '').toUpperCase();
    if (s === 'DONE') return 'dn';
    if (s === 'IN_PROGRESS') return 'ip';
    if (s === 'HOLD') return 'hd';
    if (s === 'PLANNED') return 'pl';
    return 'ns';
  }

  function statusShort(st) {
    const s = String(st || '').toUpperCase();
    if (s === 'DONE') return 'D';
    if (s === 'IN_PROGRESS') return 'I';
    if (s === 'HOLD') return 'H';
    if (s === 'PLANNED') return 'P';
    return '-';
  }

  function buildQuery(params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || typeof v === 'undefined') return;
      if (String(v).trim() === '') return;
      usp.set(k, String(v));
    });
    return usp.toString();
  }

  function nextStatus(cur) {
    const up = String(cur || 'NOT_STARTED').toUpperCase();
    const idx = STATUS_ORDER.indexOf(up);
    return STATUS_ORDER[(idx + 1 + STATUS_ORDER.length) % STATUS_ORDER.length];
  }

  function firstNonEmpty(...vals) {
    for (const v of vals) {
      if (v === null || typeof v === 'undefined') continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return '';
  }

  function parseStepMap(p) {
    const raw = p?.step_status_map;
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function buildStepDateLabel(stepRow, status) {
    const st = String(status || '').toUpperCase();
    const planEnd = fmtYYMMDD(stepRow?.plan_end);
    const as = fmtYYMMDD(stepRow?.actual_start);
    const ae = fmtYYMMDD(stepRow?.actual_end);

    if (st === 'DONE') return firstNonEmpty(ae, as, '');
    if (st === 'PLANNED') return firstNonEmpty(planEnd, '');
    if (st === 'IN_PROGRESS') {
      if (as && ae) return `${as}~${ae}`;
      if (as) return `${as}~`;
      return '';
    }
    if (st === 'HOLD') return firstNonEmpty(as, planEnd, '');
    return '';
  }

  function calcProgressFromBoardRow(p) {
    const total = Number(p.total_steps || STEPS.length || 1);
    const done  = Number(p.done_steps || 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { pct, done, total };
  }

  /* =========================
   * Board
   * ========================= */
  async function loadBoard() {
    const q = buildQuery({
      equipment_type: el.fEqType.value,
      site: el.fSite.value,
      line: el.fLine.value,
      status: el.fStatus.value,
      q: el.fQ.value.trim(),
      limit: 200,
      offset: 0
    });

    try {
      const json = await apiFetch(`/api/setup-board?${q}`);
      const list = json?.data || [];

      list.sort((a, b) => {
        const pa = calcProgressFromBoardRow(a).pct;
        const pb = calcProgressFromBoardRow(b).pct;
        if (pa !== pb) return pa - pb;
        return String(a.updated_at || '').localeCompare(String(b.updated_at || ''));
      });

      state.list = list;
      renderTable();
      prefetchDetailsForBoard();
      el.statCount.textContent = `설비 ${state.list.length}대`;
    } catch (e) {
      el.tableHost.innerHTML = `<div style="padding:16px;color:#b91c1c;">보드 로드 실패: ${escapeHtml(e.message)}</div>`;
      toast(`보드 로드 실패: ${e.message}`);
    }
  }

  async function prefetchDetailsForBoard() {
  const ids = state.list.slice(0, 80).map(p => String(p.setup_id)); // 너무 많으면 제한
  for (const id of ids) {
    if (!state.detailCache.has(id)) {
      try { await ensureDetail(id); } catch {}
    }
  }
  renderTable(); // ✅ 캐시 채워졌으니 날짜 다시 그림
}

  function renderTable() {
    hideTooltip();
    const list = state.list;
    if (!list.length) {
      el.tableHost.innerHTML = `<div style="padding:16px;color:#6b7280;">데이터가 없습니다.</div>`;
      return;
    }

    const thead = `
      <thead>
        <tr>
          <th class="eq-col">설비</th>
          ${STEPS.map(s => `
            <th>
              <div class="step-head" title="${escapeHtml(s.name)}">
                <div class="step-name-only">${escapeHtml(s.name)}</div>
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
    `;

    const tbody = `
      <tbody>
        ${list.map(p => renderRow(p)).join('')}
      </tbody>
    `;

    el.tableHost.innerHTML = `
      <table class="table">
        ${thead}
        ${tbody}
      </table>
    `;

    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(a => {
      a.addEventListener('click', () => {
        const setupId = a.getAttribute('data-setup-id');
        if (setupId) openEditModal(setupId);
      });
    });

    el.tableHost.querySelectorAll('[data-cell="1"]').forEach(td => {
      td.addEventListener('click', async () => {
        const setupId = td.getAttribute('data-setup-id');
        const stepNo = Number(td.getAttribute('data-step-no'));
        if (!setupId || !stepNo) return;
        await toggleCellStatusWithConfirm(td, setupId, stepNo);
      });

      td.addEventListener('mouseenter', onCellEnter);
      td.addEventListener('mousemove', onCellMove);
      td.addEventListener('mouseleave', onCellLeave);
    });
  }

  function renderRow(p) {
    const name = escapeHtml(p.equipment_name || '(no name)');
    const sub = escapeHtml([p.equipment_type || '-', p.site || '-', p.line || '-'].join(' · '));

    const stepMap = parseStepMap(p);
    const prog = calcProgressFromBoardRow(p);

    const cells = STEPS.map(s => {
      const st = String(stepMap[String(s.no)] || 'NOT_STARTED').toUpperCase();
      const cls = statusToClass(st);
      const short = statusShort(st);

      let dateLabel = '';
      const cached = state.detailCache.get(String(p.setup_id));
      if (cached?.steps) {
        const row = cached.steps.find(x => Number(x.step_no) === Number(s.no)) || null;
        if (row) dateLabel = buildStepDateLabel(row, st);
      }

      return `
        <td class="cell"
            data-cell="1"
            data-setup-id="${p.setup_id}"
            data-step-no="${s.no}"
            data-status="${st}">
          <div class="pillWrap">
            <span class="pill ${cls}">${short}</span>
            <div class="cellDate">${escapeHtml(dateLabel)}</div>
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td class="eq-col" data-open-detail="1" data-setup-id="${p.setup_id}">
          <div class="eq-top">
            <div class="eq-name">${name}</div>
          </div>
          <div class="eq-sub">${sub}</div>

          <div class="eq-progress-under">
            <div class="progressBar" aria-label="progress ${prog.pct}%">
              <div class="progressFill" style="width:${prog.pct}%;"></div>
            </div>
            <div class="progressMeta">
              <span class="progressSub muted">${escapeHtml(`${prog.done}/${prog.total}`)}</span>
            </div>
          </div>
        </td>
        ${cells}
      </tr>
    `;
  }

  async function ensureDetail(setupId) {
    if (state.detailCache.has(setupId)) return state.detailCache.get(setupId);
    const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`);
    const data = json?.data;
    state.detailCache.set(setupId, data);
    return data;
  }

  function computeAutoStartDate(detail) {
    const p = detail?.project || {};
    const steps = detail?.steps || [];
    if (p.start_date) return fmtYYMMDD(p.start_date);

    const s1 = steps.find(x => Number(x.step_no) === 1) || {};
    return firstNonEmpty(fmtYYMMDD(s1.actual_start), fmtYYMMDD(s1.plan_end), '');
  }

  function updateCellUI(td, status, dateLabel, savingText = '') {
    const pill = td.querySelector('.pill');
    if (pill) {
      pill.classList.remove('ns','pl','ip','dn','hd');
      pill.classList.add(statusToClass(status));
      pill.textContent = statusShort(status);
    }

    const dateEl = td.querySelector('.cellDate');
    if (dateEl) dateEl.textContent = dateLabel || '';

    let s = td.querySelector('.saving');
    if (!savingText) { if (s) s.remove(); return; }
    if (!s) {
      s = document.createElement('span');
      s.className = 'saving';
      td.appendChild(s);
    }
    s.textContent = savingText;
  }

  async function toggleCellStatusWithConfirm(td, setupId, stepNo) {
    const cur = (td.getAttribute('data-status') || 'NOT_STARTED').toUpperCase();
    const nxt = nextStatus(cur);
    const stepName = STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`;

    const ok = confirm(`[${stepName}]\n${cur} → ${nxt}\n상태를 변경할까요?`);
    if (!ok) return;

    let dateLabel = '';
    const cached = state.detailCache.get(String(setupId));
    if (cached?.steps) {
      const row = cached.steps.find(x => Number(x.step_no) === Number(stepNo)) || null;
      if (row) dateLabel = buildStepDateLabel(row, nxt);
    }

    updateCellUI(td, nxt, dateLabel, 'saving...');

    try {
      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
        method: 'PATCH',
        body: { status: nxt }
      });

      td.setAttribute('data-status', nxt);
      updateCellUI(td, nxt, dateLabel, '');

      if (cached?.steps) {
        const row = cached.steps.find(x => Number(x.step_no) === Number(stepNo));
        if (row) row.status = nxt;
      }

      await loadBoard();
      toast(`${stepName} → ${nxt} 저장됨`);
    } catch (e) {
      updateCellUI(td, cur, '', '');
      td.setAttribute('data-status', cur);
      toast(`DB 저장 실패: ${e.message}`);
    }
  }

  /* =========================
   * Tooltip
   * ========================= */
function hideTooltip() {
  el.tooltip.classList.add('hidden');
  el.tooltip.innerHTML = '';
  clearTimeout(state.hoverTimer);
  state.hoverTimer = null;
  state.hoverKey = null;
}

  function placeTooltip(x, y) {
    const pad = 14;
    const maxX = window.innerWidth - pad;
    const maxY = window.innerHeight - pad;
    el.tooltip.style.left = Math.min(x + 14, maxX) + 'px';
    el.tooltip.style.top  = Math.min(y + 14, maxY) + 'px';
  }

async function showTooltipForCell(td, clientX, clientY) {
  // ✅ td가 사라졌으면(리렌더 됐으면) 그냥 종료
  if (!td || !td.isConnected) return;

  const setupId = td.getAttribute('data-setup-id');
  const stepNo = Number(td.getAttribute('data-step-no'));
  if (!setupId || !stepNo) return;

    const key = `${setupId}:${stepNo}`;
    state.hoverKey = key;

    el.tooltip.classList.remove('hidden');
    el.tooltip.innerHTML = `<div class="tip-title">Loading...</div>`;
    placeTooltip(clientX, clientY);

    try {
      const detail = await ensureDetail(setupId);
      if (state.hoverKey !== key) return;

      const rowTds = document.querySelectorAll(`[data-cell="1"][data-setup-id="${setupId}"]`);
      rowTds.forEach(cell => {
        const no = Number(cell.getAttribute('data-step-no'));
        const st = String(cell.getAttribute('data-status') || 'NOT_STARTED').toUpperCase();
        const stepRow = (detail?.steps || []).find(x => Number(x.step_no) === no) || null;
        const label = stepRow ? buildStepDateLabel(stepRow, st) : '';
        const dateEl = cell.querySelector('.cellDate');
        if (dateEl) dateEl.textContent = label || '';
      });

      const stepName = STEPS.find(s => s.no === stepNo)?.name || `STEP ${stepNo}`;
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === stepNo) || {};

      const planEnd = firstNonEmpty(fmtYYMMDD(row.plan_end), '-');
      const as = firstNonEmpty(fmtYYMMDD(row.actual_start), '-');
      const ae = firstNonEmpty(fmtYYMMDD(row.actual_end), '-');
      const workers = firstNonEmpty(row.workers, '-');
      const note = firstNonEmpty(row.note, '-');

      el.tooltip.innerHTML = `
        <div class="tip-title">${escapeHtml(stepName)}</div>
        <div class="tip-grid">
          <div class="tip-k">Plan End</div><div class="tip-v">${escapeHtml(planEnd)}</div>
          <div class="tip-k">Actual S</div><div class="tip-v">${escapeHtml(as)}</div>
          <div class="tip-k">Actual E</div><div class="tip-v">${escapeHtml(ae)}</div>
          <div class="tip-k">작업자</div><div class="tip-v">${escapeHtml(workers)}</div>
          <div class="tip-k">특이사항</div><div class="tip-v">${escapeHtml(note)}</div>
        </div>
        <div class="tip-foot">클릭: 상태 변경(확인 후 저장)</div>
      `;
      placeTooltip(clientX, clientY);
    } catch (e) {
      if (state.hoverKey !== key) return;
      el.tooltip.innerHTML = `
        <div class="tip-title">Tooltip Error</div>
        <div class="tip-grid">
          <div class="tip-k">msg</div><div class="tip-v">${escapeHtml(e.message)}</div>
        </div>
      `;
    }
  }

  function onCellEnter(e) {
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => {
      showTooltipForCell(e.currentTarget, e.clientX, e.clientY);
    }, 180);
  }
  function onCellMove(e) {
    if (el.tooltip.classList.contains('hidden')) return;
    placeTooltip(e.clientX, e.clientY);
  }
  function onCellLeave() { hideTooltip(); }

  /* =========================
   * Modal + Tabs
   * ========================= */
  function openModalShell() { el.modal.classList.remove('hidden'); }
  function closeModal() {
    el.modal.classList.add('hidden');
    state.selectedSetupId = null;
    state.createMode = false;
    el.btnSaveProject.textContent = 'SAVE';
    setTab('steps');
  }

  function setTab(mode) {
    const isSteps = mode === 'steps';
    el.tabSteps.classList.toggle('active', isSteps);
    el.tabPrereq.classList.toggle('active', !isSteps);
    el.viewSteps.classList.toggle('hidden', !isSteps);
    el.viewPrereq.classList.toggle('hidden', isSteps);
  }

  function openCreateModal() {
    state.createMode = true;
    state.selectedSetupId = null;
    openModalShell();
    setTab('steps');

    el.mTitle.textContent = '신규 설비 추가';
    el.mMeta.textContent = '필수: 설비명, Site, Line';

    el.p_equipment_name.value = '';
    el.p_equipment_type.value = '';
    el.p_site.value = '';
    el.p_line.value = '';
    el.p_location.value = '';
    el.p_board_status.value = 'PLANNED';
    el.p_last_note.value = '';
    el.p_start_date_auto.value = '';

    el.stepsHost.innerHTML = `<div class="muted small">설비 생성 후 STEP이 자동 생성됩니다.</div>`;
    el.prereqHost.innerHTML = `<div class="muted small">설비 생성 후 선행조건 체크가 가능합니다.</div>`;
    el.prBadge.textContent = `0/0`;

    el.btnSaveProject.textContent = 'CREATE';
    el.projSaveHint.textContent = '';
  }

  function openEditModal(setupId) {
    state.createMode = false;
    el.btnSaveProject.textContent = 'SAVE';
    openModal(setupId);
  }

  async function openModal(setupId) {
    state.selectedSetupId = String(setupId);
    openModalShell();
    setTab('steps');

    el.mTitle.textContent = '로딩 중...';
    el.mMeta.textContent = '';
    el.stepsHost.innerHTML = '';
    el.prereqHost.innerHTML = '';
    el.prBadge.textContent = `0/0`;
    el.projSaveHint.textContent = '';

    try {
      const data = await ensureDetail(String(setupId));
      renderModal(data);

      // prereq preload (DB)
      const prMap = await fetchPrereqs(String(setupId));
      renderPrereqs(String(setupId), prMap);
    } catch (e) {
      el.mTitle.textContent = '상세 로드 실패';
      el.mMeta.textContent = e.message;
      toast(`상세 로드 실패: ${e.message}`);
    }
  }

  function renderModal(data) {
    const p = data?.project || {};
    const steps = data?.steps || [];

    el.mTitle.textContent = p.equipment_name || `SETUP #${p.id || ''}`;
    el.mMeta.textContent = [
      p.equipment_type || '-',
      p.site || '-',
      p.line || '-',
      p.location ? `@${p.location}` : ''
    ].filter(Boolean).join(' · ');

    el.p_equipment_name.value = p.equipment_name || '';
    el.p_equipment_type.value = p.equipment_type || '';
    el.p_site.value = p.site || '';
    el.p_line.value = p.line || '';
    el.p_location.value = p.location || '';
    el.p_board_status.value = (p.board_status || 'PLANNED').toUpperCase();
    el.p_last_note.value = p.last_note || '';
    el.p_start_date_auto.value = computeAutoStartDate(data) || '';

    const byNo = new Map();
    for (const s of steps) byNo.set(Number(s.step_no), s);

    el.stepsHost.innerHTML = STEPS.map(t => {
      const s = byNo.get(t.no) || {};
      const st = (s.status || 'NOT_STARTED').toUpperCase();
      const desc = s.step_description ? String(s.step_description) : '';

      const planEnd = fmtDateISO(s.plan_end);
      const actualStart = fmtDateISO(s.actual_start);
      const actualEnd = fmtDateISO(s.actual_end);

      return `
        <div class="step-card" data-step-card="1" data-step-no="${t.no}">
          <div class="step-top">
            <div>
              <div class="step-card-title">${escapeHtml(t.name)}</div>
              ${desc ? `<div class="step-desc">${escapeHtml(desc)}</div>` : ``}
            </div>
            <div>
              <span class="pill ${statusToClass(st)}" data-pill="1">${statusShort(st)}</span>
            </div>
          </div>

          <div class="step-grid step-grid-planend">
            <div class="field">
              <label>Status</label>
              <select data-field="status">
                <option value="NOT_STARTED" ${st==='NOT_STARTED'?'selected':''}>NOT_STARTED</option>
                <option value="PLANNED" ${st==='PLANNED'?'selected':''}>PLANNED</option>
                <option value="IN_PROGRESS" ${st==='IN_PROGRESS'?'selected':''}>IN_PROGRESS</option>
                <option value="DONE" ${st==='DONE'?'selected':''}>DONE</option>
                <option value="HOLD" ${st==='HOLD'?'selected':''}>HOLD</option>
              </select>
            </div>

            <div class="field">
              <label>Plan End</label>
              <input type="date" data-field="plan_end" value="${escapeHtml(planEnd)}"/>
            </div>

            <div class="field">
              <label>Actual Start</label>
              <input type="date" data-field="actual_start" value="${escapeHtml(actualStart)}"/>
            </div>

            <div class="field">
              <label>Actual End</label>
              <input type="date" data-field="actual_end" value="${escapeHtml(actualEnd)}"/>
            </div>

            <div class="field">
              <label>Workers</label>
              <input type="text" data-field="workers" value="${escapeHtml(s.workers || '')}" placeholder="정현우,김동한"/>
            </div>

            <div class="field wide note-wide">
              <label>Note</label>
              <input type="text" data-field="note" value="${escapeHtml(s.note || '')}" placeholder="특이사항"/>
            </div>
          </div>

          <div class="step-actions">
            <span class="muted small" data-hint="1"></span>
            <button class="btn primary" data-save-step="1">SAVE</button>
          </div>
        </div>
      `;
    }).join('');

    el.stepsHost.querySelectorAll('[data-step-card="1"]').forEach(card => {
      const stepNo = Number(card.getAttribute('data-step-no'));
      const selStatus = card.querySelector('[data-field="status"]');
      const pill = card.querySelector('[data-pill="1"]');
      const hint = card.querySelector('[data-hint="1"]');
      const btn = card.querySelector('[data-save-step="1"]');

      selStatus.addEventListener('change', () => {
        const st = selStatus.value;
        pill.classList.remove('ns','pl','ip','dn','hd');
        pill.classList.add(statusToClass(st));
        pill.textContent = statusShort(st);
      });

      btn.addEventListener('click', async () => {
        const setupId = state.selectedSetupId;
        if (!setupId) return;

        const patch = {};
        card.querySelectorAll('[data-field]').forEach(inp => {
          const k = inp.getAttribute('data-field');
          const v = inp.value;
          patch[k] = v === '' ? null : v;
        });

        if (patch.actual_start && patch.actual_end && patch.actual_end < patch.actual_start) {
          toast('Actual End가 Actual Start보다 빠를 수 없습니다.');
          return;
        }

        try {
          hint.textContent = 'saving...';
          await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
            method: 'PATCH',
            body: patch
          });

          const cached = state.detailCache.get(setupId);
          if (cached && Array.isArray(cached.steps)) {
            const row = cached.steps.find(x => Number(x.step_no) === stepNo);
            if (row) Object.assign(row, patch);
          }

          if (stepNo === 1) {
            const autoISO = firstNonEmpty(patch.actual_start, patch.plan_end, null);
            if (autoISO) {
              try {
                await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`, {
                  method: 'PATCH',
                  body: { start_date: autoISO }
                });
              } catch {}
            }
          }

          hint.textContent = 'saved ✅';
          await loadBoard();
          toast(`${STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`} 저장 완료`);
          setTimeout(() => (hint.textContent = ''), 1500);
        } catch (e) {
          hint.textContent = `fail: ${e.message}`;
          toast(`STEP 저장 실패: ${e.message}`);
        }
      });
    });
  }

  async function saveProject() {
    const isCreate = state.createMode === true;
    const setupId = state.selectedSetupId;

    const payloadBase = {
      equipment_name: el.p_equipment_name.value.trim(),
      equipment_type: el.p_equipment_type.value.trim() || null,
      site: el.p_site.value.trim(),
      line: el.p_line.value.trim(),
      location: el.p_location.value.trim() || null,
      last_note: el.p_last_note.value.trim() || null
    };

    if (!payloadBase.equipment_name) return toast('설비명은 필수입니다.');
    if (!payloadBase.site) return toast('Site는 필수입니다.');
    if (!payloadBase.line) return toast('Line은 필수입니다.');

    try {
      el.projSaveHint.textContent = 'saving...';

      if (isCreate) {
        const json = await apiFetch(`/api/setup-projects`, { method: 'POST', body: payloadBase });
        const newId = json?.setup_id || json?.setupId || json?.id;

        el.projSaveHint.textContent = 'created ✅';
        toast('설비가 생성되었습니다.');

        await loadBoard();

        if (newId) {
          state.createMode = false;
          el.btnSaveProject.textContent = 'SAVE';
          await openModal(String(newId));
        } else {
          closeModal();
        }
        return;
      }

      if (!setupId) return toast('setupId가 없습니다.');

      const patch = { ...payloadBase, board_status: el.p_board_status.value };

      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`, {
        method: 'PATCH',
        body: patch
      });

      state.detailCache.delete(setupId);
      const data = await ensureDetail(setupId);
      renderModal(data);

      await loadBoard();

      el.projSaveHint.textContent = 'saved ✅';
      toast('Project 저장 완료');
      setTimeout(() => (el.projSaveHint.textContent = ''), 1500);
    } catch (e) {
      el.projSaveHint.textContent = `fail: ${e.message}`;
      toast(`Project 저장 실패: ${e.message}`);
    }
  }

  /* =========================
   * Prereq (DB ONLY)
   * ========================= */
  async function fetchPrereqs(setupId) {
    if (state.prereqCache.has(setupId)) return state.prereqCache.get(setupId);
    // ✅ DB에서만 가져옴 (API 없으면 에러로 표시)
    const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/prereqs`);
    const data = json?.data && typeof json.data === 'object' ? json.data : {};
    state.prereqCache.set(setupId, data);
    return data;
  }

  function calcPrereqProgress(prMap) {
    const total = PREREQS.length;
    let done = 0;
    for (const it of PREREQS) {
      const row = prMap?.[it.code];
      if (row?.done === true || row?.done === 1 || row?.done === '1') done++;
    }
    return { total, done };
  }

  async function savePrereq(setupId, code, done) {
    // ✅ 최소 PATCH payload (메모 없음)
    const payload = {
      done: !!done,
      done_date: done ? fmtDateISO(new Date().toISOString()) : null
    };

    await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/prereqs/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      body: payload
    });

    // cache update
    const cur = state.prereqCache.get(setupId) || {};
    const prev = cur[code] && typeof cur[code] === 'object' ? cur[code] : {};
    const next = { ...cur, [code]: { ...prev, ...payload } };
    state.prereqCache.set(setupId, next);

    return next;
  }

  function renderPrereqs(setupId, prMap) {
    const prog = calcPrereqProgress(prMap);
    el.prBadge.textContent = `${prog.done}/${prog.total}`;

    el.prereqHost.innerHTML = PREREQS.map(it => {
      const row = prMap?.[it.code] || {};
      const done = row?.done === true || row?.done === 1 || row?.done === '1';
      const doneDate = row?.done_date ? fmtYYMMDD(row.done_date) : '';

      return `
        <div class="pr-item" data-pr-item="1" data-code="${escapeHtml(it.code)}">
          <label class="pr-check">
            <input type="checkbox" data-pr-field="done" ${done ? 'checked' : ''}/>
            <span class="pr-title">${escapeHtml(it.title)}</span>
          </label>

          <div class="pr-meta">
            <span class="tag ${it.required ? 'req' : 'opt'}">${it.required ? '필수' : '옵션'}</span>
            <span class="tag">Before: ${escapeHtml(it.requiredBefore)}</span>
            ${doneDate ? `<span class="tag">Done: ${escapeHtml(doneDate)}</span>` : ``}
          </div>

          <div class="pr-desc">${escapeHtml(it.desc)}</div>

          <div class="pr-actions">
            <button class="btn" data-pr-save="1">저장</button>
          </div>
        </div>
      `;
    }).join('');

    el.prereqHost.querySelectorAll('[data-pr-item="1"]').forEach(card => {
      const code = card.getAttribute('data-code');
      const chk = card.querySelector('[data-pr-field="done"]');
      const btn = card.querySelector('[data-pr-save="1"]');

      btn.addEventListener('click', async () => {
        if (!setupId || !code) return;

        btn.disabled = true;
        btn.textContent = '저장중...';
        try {
          const next = await savePrereq(setupId, code, chk.checked);
          renderPrereqs(setupId, next);
          toast('선행조건 저장 완료(DB)');
        } catch (e) {
          toast(`선행조건 저장 실패: ${e.message}`);
          btn.disabled = false;
          btn.textContent = '저장';
        }
      });
    });
  }

  /* =========================
   * Help modal
   * ========================= */
  function openHelp() { el.helpModal.classList.remove('hidden'); }
  function closeHelp() { el.helpModal.classList.add('hidden'); }

  /* =========================
   * Events
   * ========================= */
  function bindEvents() {
    el.btnNew.addEventListener('click', openCreateModal);
    el.btnApply.addEventListener('click', loadBoard);

    el.fQ.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadBoard();
    });

    el.btnClose.addEventListener('click', closeModal);

    el.modal.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-close');
      if (close === '1') closeModal();
    });

    // tabs
    el.tabSteps.addEventListener('click', () => setTab('steps'));
    el.tabPrereq.addEventListener('click', async () => {
      setTab('prereq');
      const setupId = state.selectedSetupId;
      if (!setupId) return;
      try {
        const prMap = await fetchPrereqs(setupId);
        renderPrereqs(setupId, prMap);
      } catch (e) {
        el.prereqHost.innerHTML = `
          <div class="api-missing">
            <div class="api-title">선행조건 API가 필요합니다</div>
            <div class="api-desc muted">
              GET /api/setup-projects/:id/prereqs<br/>
              PATCH /api/setup-projects/:id/prereqs/:code
            </div>
            <div class="api-desc muted small">현재 응답: ${escapeHtml(e.message)}</div>
          </div>
        `;
        toast(`선행조건 로드 실패: ${e.message}`);
      }
    });

    el.btnSaveProject.addEventListener('click', saveProject);

    // help
    el.btnHelp.addEventListener('click', openHelp);
    el.btnHelpClose.addEventListener('click', closeHelp);
    el.helpModal.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-help-close');
      if (close === '1') closeHelp();
    });

    window.addEventListener('scroll', () => hideTooltip(), { passive: true });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    if (!getToken()) toast('로그인이 필요합니다. (x-access-token 없음)');
    await loadBoard();
  });

})();
