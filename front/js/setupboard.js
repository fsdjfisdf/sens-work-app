(() => {
  'use strict';

  /* =========================
   * Step template (표시용)
   * ========================= */
  const STEPS = [
    { no: 1,  name: 'TEMPLATE DRAWING' },
    { no: 2,  name: 'TEMPLATE 타공 확인' },
    { no: 3,  name: 'FAB IN' },
    { no: 4,  name: 'DOCKING' },
    { no: 5,  name: 'CABLE HOOK UP' },
    { no: 6,  name: 'SILICON 작업' },
    { no: 7,  name: 'POWER TURN ON' },
    { no: 8,  name: 'UTILITY TURN ON' },
    { no: 9,  name: 'TEACHING' },
    { no: 10, name: 'GAS TURN ON' },
    { no: 11, name: 'PUMP TURN ON' },
    { no: 12, name: 'CHILLER TURN ON' },
    { no: 13, name: 'HEAT EXCHANGER TURN ON' },
    { no: 14, name: 'TTTM' },
    { no: 15, name: '중간 인증 준비' },
    { no: 16, name: '중간 인증' },
    { no: 17, name: 'PROCESS CONFIRM' }
  ];

  const STATUS_ORDER = ['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'HOLD'];

  /* =========================
   * DOM
   * ========================= */
  const $ = (sel, root=document) => root.querySelector(sel);

  const el = {
    btnRefresh: $('#btnRefresh'),
    btnApply: $('#btnApply'),
    tableHost: $('#tableHost'),
    statCount: $('#statCount'),

    fCustomer: $('#fCustomer'),
    fSite: $('#fSite'),
    fLine: $('#fLine'),
    fStatus: $('#fStatus'),
    fQ: $('#fQ'),
    fSort: $('#fSort'),

    modal: $('#modal'),
    btnClose: $('#btnClose'),
    mTitle: $('#mTitle'),
    mMeta: $('#mMeta'),

    // project form
    p_equipment_name: $('#p_equipment_name'),
    p_equipment_type: $('#p_equipment_type'),
    p_customer: $('#p_customer'),
    p_site: $('#p_site'),
    p_line: $('#p_line'),
    p_location: $('#p_location'),
    p_board_status: $('#p_board_status'),
    p_start_date: $('#p_start_date'),
    p_target_date: $('#p_target_date'),
    p_owner_main: $('#p_owner_main'),
    p_owner_support: $('#p_owner_support'),
    p_last_note: $('#p_last_note'),
    btnSaveProject: $('#btnSaveProject'),
    projSaveHint: $('#projSaveHint'),

    stepsHost: $('#stepsHost'),
    issuesHost: $('#issuesHost'),

    tooltip: $('#tooltip'),
    toast: $('#toast')
  };

  /* =========================
   * State
   * ========================= */
  const state = {
    list: [],
    detailCache: new Map(), // setupId -> {project, steps, issues}
    selectedSetupId: null,
    hoverTimer: null,
    hoverKey: null
  };

  /* =========================
   * Helpers
   * ========================= */
  function getToken() {
    return localStorage.getItem('x-access-token') || '';
  }

  async function apiFetch(path, { method='GET', body=null } = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'x-access-token': getToken()
    };
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : null });

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

  function fmtDate(d) {
    if (!d) return '';
    const s = String(d);
    return s.length >= 10 ? s.slice(0, 10) : s;
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
    return 'ns';
  }

  function statusShort(st) {
    const s = String(st || '').toUpperCase();
    if (s === 'DONE') return 'D';
    if (s === 'IN_PROGRESS') return 'P';
    if (s === 'HOLD') return 'H';
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

  /* =========================
   * Board list
   * ========================= */
  async function loadBoard() {
    const q = buildQuery({
      customer: el.fCustomer.value,
      site: el.fSite.value,
      line: el.fLine.value,
      status: el.fStatus.value,
      q: el.fQ.value.trim(),
      sort: el.fSort.value,
      limit: 200,
      offset: 0
    });

    try {
      const json = await apiFetch(`/api/setup-board?${q}`);
      state.list = json?.data || [];
      renderTable();
      el.statCount.textContent = `설비 ${state.list.length}대`;
    } catch (e) {
      el.tableHost.innerHTML = `<div style="padding:16px;color:#b91c1c;">보드 로드 실패: ${escapeHtml(e.message)}</div>`;
      toast(`보드 로드 실패: ${e.message}`);
    }
  }

  /* =========================
   * Estimation (초기 표시용)
   * ========================= */
  function estimateStatusForCell(projectRow, stepNo) {
    const boardStatus = String(projectRow.board_status || '').toUpperCase();
    if (boardStatus === 'DONE') return 'DONE';
    if (boardStatus === 'HOLD') return 'HOLD';

    const ip = Number(projectRow.in_progress_step_no || 0);
    if (!ip) return 'NOT_STARTED';
    if (stepNo < ip) return 'DONE';
    if (stepNo === ip) return 'IN_PROGRESS';
    return 'NOT_STARTED';
  }

  /* =========================
   * Render: 행=설비, 열=작업명
   * ========================= */
  function renderTable() {
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
                <div class="step-no">STEP ${s.no}</div>
                <div class="step-name">${escapeHtml(s.name)}</div>
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

    // 설비명 클릭 -> 모달
    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(a => {
      a.addEventListener('click', () => {
        const setupId = a.getAttribute('data-setup-id');
        if (setupId) openModal(setupId);
      });
    });

    // 셀 클릭 -> 상태 토글 PATCH
    el.tableHost.querySelectorAll('[data-cell="1"]').forEach(td => {
      td.addEventListener('click', async () => {
        const setupId = td.getAttribute('data-setup-id');
        const stepNo = Number(td.getAttribute('data-step-no'));
        if (!setupId || !stepNo) return;
        await toggleCellStatus(td, setupId, stepNo);
      });

      // hover tooltip
      td.addEventListener('mouseenter', onCellEnter);
      td.addEventListener('mousemove', onCellMove);
      td.addEventListener('mouseleave', onCellLeave);
    });
  }

  function renderRow(p) {
    const name = escapeHtml(p.equipment_name || '(no name)');
    const sub = escapeHtml([p.customer || '-', p.site || '-', p.line || '-'].join(' · '));
    const issues = Number(p.open_issues || 0) > 0 ? `<span class="issueMark" title="OPEN ISSUE">!</span>` : '';

    const cells = STEPS.map(s => {
      const st = estimateStatusForCell(p, s.no);
      const cls = statusToClass(st);
      const short = statusShort(st);
      return `
        <td class="cell"
            data-cell="1"
            data-setup-id="${p.setup_id}"
            data-step-no="${s.no}">
          <span class="pill ${cls}">${short}</span>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td class="eq-col" data-open-detail="1" data-setup-id="${p.setup_id}" title="클릭: 상세 보기">
          <div class="eq-name">${name} ${issues}</div>
          <div class="eq-sub">${sub} · Updated: ${escapeHtml(fmtDate(p.updated_at) || '-')}</div>
        </td>
        ${cells}
      </tr>
    `;
  }

  /* =========================
   * Detail cache
   * ========================= */
  async function ensureDetail(setupId) {
    if (state.detailCache.has(setupId)) return state.detailCache.get(setupId);
    const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`);
    const data = json?.data;
    state.detailCache.set(setupId, data);
    return data;
  }

  /* =========================
   * Toggle cell status
   * ========================= */
  function updateCellUI(td, status, savingText = '') {
    const pill = td.querySelector('.pill');
    if (!pill) return;
    pill.classList.remove('ns', 'ip', 'dn', 'hd');
    pill.classList.add(statusToClass(status));
    pill.textContent = statusShort(status);

    let s = td.querySelector('.saving');
    if (!savingText) {
      if (s) s.remove();
      return;
    }
    if (!s) {
      s = document.createElement('span');
      s.className = 'saving';
      td.appendChild(s);
    }
    s.textContent = savingText;
  }

  async function toggleCellStatus(td, setupId, stepNo) {
    try {
      updateCellUI(td, 'IN_PROGRESS', 'saving...');

      const detail = await ensureDetail(setupId);
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === Number(stepNo));

      const cur = row?.status || 'NOT_STARTED';
      const nxt = nextStatus(cur);

      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
        method: 'PATCH',
        body: { status: nxt }
      });

      if (row) row.status = nxt;
      else steps.push({ step_no: stepNo, status: nxt });

      updateCellUI(td, nxt, '');
      toast(`STEP ${stepNo} → ${nxt}`);
    } catch (e) {
      updateCellUI(td, 'NOT_STARTED', '');
      toast(`상태 변경 실패: ${e.message}`);
    }
  }

  /* =========================
   * Tooltip (hover)
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
    const setupId = td.getAttribute('data-setup-id');
    const stepNo = Number(td.getAttribute('data-step-no'));
    if (!setupId || !stepNo) return;

    const key = `${setupId}:${stepNo}`;
    state.hoverKey = key;

    // 로딩 표시
    el.tooltip.classList.remove('hidden');
    el.tooltip.innerHTML = `<div class="tip-title">Loading...</div>`;
    placeTooltip(clientX, clientY);

    try {
      const detail = await ensureDetail(setupId);
      if (state.hoverKey !== key) return; // 다른 셀로 이동했으면 무시

      const stepName = STEPS.find(s => s.no === stepNo)?.name || `STEP ${stepNo}`;
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === stepNo) || {};

      const planDate   = firstNonEmpty(fmtDate(row.plan_start), fmtDate(row.plan_end), '-');
      const actualDate = firstNonEmpty(fmtDate(row.actual_start), fmtDate(row.actual_end), '-');
      const workers    = firstNonEmpty(row.workers, '-');
      const note       = firstNonEmpty(row.note, '-');

      el.tooltip.innerHTML = `
        <div class="tip-title">STEP ${stepNo} · ${escapeHtml(stepName)}</div>
        <div class="tip-grid">
          <div class="tip-k">예정일</div><div class="tip-v">${escapeHtml(planDate || '-')}</div>
          <div class="tip-k">실행일</div><div class="tip-v">${escapeHtml(actualDate || '-')}</div>
          <div class="tip-k">작업자</div><div class="tip-v">${escapeHtml(workers || '-')}</div>
          <div class="tip-k">특이사항</div><div class="tip-v">${escapeHtml(note || '-')}</div>
        </div>
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
    const td = e.currentTarget;
    const setupId = td.getAttribute('data-setup-id');
    const stepNo = td.getAttribute('data-step-no');
    if (!setupId || !stepNo) return;

    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => {
      showTooltipForCell(td, e.clientX, e.clientY);
    }, 180); // 살짝 딜레이
  }

  function onCellMove(e) {
    if (el.tooltip.classList.contains('hidden')) return;
    placeTooltip(e.clientX, e.clientY);
  }

  function onCellLeave() {
    hideTooltip();
  }

  /* =========================
   * Modal open/close
   * ========================= */
  function openModalShell() { el.modal.classList.remove('hidden'); }
  function closeModal() {
    el.modal.classList.add('hidden');
    state.selectedSetupId = null;
  }

  async function openModal(setupId) {
    state.selectedSetupId = String(setupId);
    openModalShell();

    el.mTitle.textContent = '로딩 중...';
    el.mMeta.textContent = '';
    el.stepsHost.innerHTML = '';
    el.issuesHost.textContent = '-';
    el.projSaveHint.textContent = '';

    try {
      const data = await ensureDetail(String(setupId));
      renderModal(data);
    } catch (e) {
      el.mTitle.textContent = '상세 로드 실패';
      el.mMeta.textContent = e.message;
      toast(`상세 로드 실패: ${e.message}`);
    }
  }

  /* =========================
   * Render modal (Plan Date 1개, Actual Date 1개)
   *  - 서버 컬럼은 plan_start / actual_start에 저장
   * ========================= */
  function renderModal(data) {
    const p = data?.project || {};
    const steps = data?.steps || [];
    const issues = data?.issues || [];

    el.mTitle.textContent = p.equipment_name || `SETUP #${p.id || ''}`;
    el.mMeta.textContent = [
      p.equipment_type || '-',
      p.customer || '-',
      p.site || '-',
      p.line || '-',
      p.location ? `@${p.location}` : ''
    ].filter(Boolean).join(' · ');

    // project fields
    el.p_equipment_name.value = p.equipment_name || '';
    el.p_equipment_type.value = p.equipment_type || '';
    el.p_customer.value = p.customer || '';
    el.p_site.value = p.site || '';
    el.p_line.value = p.line || '';
    el.p_location.value = p.location || '';
    el.p_board_status.value = (p.board_status || 'PLANNED').toUpperCase();
    el.p_start_date.value = fmtDate(p.start_date);
    el.p_target_date.value = fmtDate(p.target_date);
    el.p_owner_main.value = p.owner_main || '';
    el.p_owner_support.value = p.owner_support || '';
    el.p_last_note.value = p.last_note || '';

    const byNo = new Map();
    for (const s of steps) byNo.set(Number(s.step_no), s);

    el.stepsHost.innerHTML = STEPS.map(t => {
      const s = byNo.get(t.no) || {};
      const st = (s.status || 'NOT_STARTED').toUpperCase();
      const desc = s.step_description ? String(s.step_description) : '';

      // plan_date = plan_start만 사용 / actual_date = actual_start만 사용
      const planDate = fmtDate(s.plan_start);
      const actualDate = fmtDate(s.actual_start);

      return `
        <div class="step-card" data-step-card="1" data-step-no="${t.no}">
          <div class="step-top">
            <div>
              <div class="step-card-title">${t.no}. ${escapeHtml(t.name)}</div>
              ${desc ? `<div class="step-desc">${escapeHtml(desc)}</div>` : ``}
            </div>
            <div>
              <span class="pill ${statusToClass(st)}" data-pill="1">${statusShort(st)}</span>
            </div>
          </div>

          <div class="step-grid">
            <div class="field">
              <label>Status</label>
              <select data-field="status">
                <option value="NOT_STARTED" ${st==='NOT_STARTED'?'selected':''}>NOT_STARTED</option>
                <option value="IN_PROGRESS" ${st==='IN_PROGRESS'?'selected':''}>IN_PROGRESS</option>
                <option value="DONE" ${st==='DONE'?'selected':''}>DONE</option>
                <option value="HOLD" ${st==='HOLD'?'selected':''}>HOLD</option>
              </select>
            </div>

            <div class="field">
              <label>Plan Date</label>
              <input type="date" data-field="plan_start" value="${escapeHtml(planDate)}"/>
            </div>

            <div class="field">
              <label>Actual Date</label>
              <input type="date" data-field="actual_start" value="${escapeHtml(actualDate)}"/>
            </div>

            <div class="field">
              <label>Workers</label>
              <input type="text" data-field="workers" value="${escapeHtml(s.workers || '')}" placeholder="정현우,김동한"/>
            </div>

            <div class="field wide" style="grid-column: span 4;">
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

    // step save events
    el.stepsHost.querySelectorAll('[data-step-card="1"]').forEach(card => {
      const stepNo = Number(card.getAttribute('data-step-no'));
      const selStatus = card.querySelector('[data-field="status"]');
      const pill = card.querySelector('[data-pill="1"]');
      const hint = card.querySelector('[data-hint="1"]');
      const btn = card.querySelector('[data-save-step="1"]');

      selStatus.addEventListener('change', () => {
        const st = selStatus.value;
        pill.classList.remove('ns','ip','dn','hd');
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

        // 불필요 컬럼 제거(서버에 보내지 않음)
        // (현재 UI에 plan_end/actual_end가 없으므로 굳이 안 보냄)

        try {
          hint.textContent = 'saving...';
          await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
            method: 'PATCH',
            body: patch
          });

          // cache update
          const data = state.detailCache.get(setupId);
          if (data && Array.isArray(data.steps)) {
            const row = data.steps.find(x => Number(x.step_no) === stepNo);
            if (row) Object.assign(row, patch);
          }

          hint.textContent = 'saved ✅';

          // 보드 셀도 즉시 반영(status만)
          const td = el.tableHost.querySelector(
            `[data-cell="1"][data-setup-id="${setupId}"][data-step-no="${stepNo}"]`
          );
          if (td && patch.status) updateCellUI(td, patch.status, '');

          toast(`STEP ${stepNo} 저장 완료`);
          setTimeout(() => (hint.textContent = ''), 1500);
        } catch (e) {
          hint.textContent = `fail: ${e.message}`;
          toast(`STEP 저장 실패: ${e.message}`);
        }
      });
    });

    // issues
    if (!issues.length) {
      el.issuesHost.innerHTML = `<div class="muted">등록된 이슈가 없습니다.</div>`;
    } else {
      el.issuesHost.innerHTML = issues.map(i => {
        const sev = escapeHtml(String(i.severity || 'MAJOR'));
        const st = escapeHtml(String(i.state || 'OPEN'));
        const cat = escapeHtml(String(i.category || 'ETC'));
        const step = i.step_no ? `STEP ${i.step_no}` : 'STEP -';
        const title = escapeHtml(i.title || '(no title)');
        const content = escapeHtml(i.content || '');
        return `
          <div class="step-card" style="border-color: rgba(239,68,68,.20); background: rgba(239,68,68,.05);">
            <div style="font-weight:1000;">${title}</div>
            <div class="muted small" style="margin-top:6px; white-space:pre-wrap;">${content}</div>
            <div class="muted small" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
              <span class="issueMark">!</span>
              <span>${escapeHtml(step)}</span>
              <span>${sev}</span>
              <span>${cat}</span>
              <span>${st}</span>
              ${i.owner ? `<span>Owner: ${escapeHtml(i.owner)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /* =========================
   * Save project patch
   * ========================= */
  async function saveProject() {
    const setupId = state.selectedSetupId;
    if (!setupId) return;

    const patch = {
      equipment_name: el.p_equipment_name.value.trim(),
      equipment_type: el.p_equipment_type.value.trim() || null,
      customer: el.p_customer.value || null,
      site: el.p_site.value.trim(),
      line: el.p_line.value.trim(),
      location: el.p_location.value.trim() || null,
      board_status: el.p_board_status.value,
      start_date: el.p_start_date.value || null,
      target_date: el.p_target_date.value || null,
      owner_main: el.p_owner_main.value.trim() || null,
      owner_support: el.p_owner_support.value.trim() || null,
      last_note: el.p_last_note.value.trim() || null
    };

    try {
      el.projSaveHint.textContent = 'saving...';
      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`, {
        method: 'PATCH',
        body: patch
      });

      // 캐시 무효화 후 재조회(정확히)
      state.detailCache.delete(setupId);
      const data = await ensureDetail(setupId);
      renderModal(data);

      // 리스트도 재로드
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
   * Events
   * ========================= */
  function bindEvents() {
    el.btnRefresh.addEventListener('click', loadBoard);
    el.btnApply.addEventListener('click', loadBoard);

    el.fQ.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadBoard();
    });

    el.btnClose.addEventListener('click', closeModal);

    el.modal.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-close');
      if (close === '1') closeModal();
    });

    el.btnSaveProject.addEventListener('click', saveProject);

    window.addEventListener('scroll', () => {
      // 스크롤 시 떠있는 툴팁 위치가 어색해져서 숨김
      hideTooltip();
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();

    if (!getToken()) {
      toast('로그인이 필요합니다. (x-access-token 없음)');
    }
    await loadBoard();
  });

})();
