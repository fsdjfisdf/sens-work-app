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
    toggleCompact: $('#toggleCompact'),
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

    toast: $('#toast')
  };

  /* =========================
   * State
   * ========================= */
  const state = {
    list: [],
    // setupId -> detail cache
    detailCache: new Map(),
    selectedSetupId: null,
    compact: true
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
    const res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

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

  /* =========================
   * Load board list
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
   * Step status source
   * - 매트릭스에서 "정확한 step별 상태"를 표시/수정하려면
   *   setup_project_steps를 이미 가지고 있어야 함.
   * - 여기서는:
   *   1) 보드 리스트는 가볍게 표시(추정) 가능하지만
   *   2) 수정하려면 "현재 상태"를 알아야 하므로
   *   3) 첫 렌더 시 각 설비 detail을 병렬로 일부 가져오는 전략(최대 200이면 무거움)
   *
   * 현실적인 타협:
   * - 화면 렌더는 "추정(진행 step 기준)"으로 먼저 표시
   * - 사용자가 셀 클릭하면, 그 설비의 detail을 한 번 가져와서
   *   정확한 상태 기반으로 토글 후 PATCH.
   *
   * => 속도/정확도/서버부하 균형
   * ========================= */

  function estimateStatusForCell(projectRow, stepNo) {
    // listBoard 응답에 in_progress_step_no / board_status가 있으므로 "초기 표시"만 추정
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
   * Render table (행=설비, 열=스텝)
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
          ${STEPS.map(s => `<th>Step ${s.no}</th>`).join('')}
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

    // bind row title click -> open modal
    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(a => {
      a.addEventListener('click', () => {
        const setupId = a.getAttribute('data-setup-id');
        if (setupId) openModal(setupId);
      });
    });

    // bind cell click -> toggle status + patch
    el.tableHost.querySelectorAll('[data-cell="1"]').forEach(td => {
      td.addEventListener('click', async () => {
        const setupId = td.getAttribute('data-setup-id');
        const stepNo = Number(td.getAttribute('data-step-no'));
        if (!setupId || !stepNo) return;

        await toggleCellStatus(td, setupId, stepNo);
      });
    });

    // compact toggle class
    const card = el.tableHost.closest('.board');
    card.classList.toggle('compact', el.toggleCompact.checked);
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
        <td class="cell" data-cell="1" data-setup-id="${p.setup_id}" data-step-no="${s.no}" title="클릭: 상태 변경">
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
   * Toggle cell status (정확 상태 기반)
   * ========================= */
  async function ensureDetail(setupId) {
    if (state.detailCache.has(setupId)) return state.detailCache.get(setupId);

    const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`);
    const data = json?.data;
    state.detailCache.set(setupId, data);
    return data;
  }

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
      updateCellUI(td, 'IN_PROGRESS', 'saving...'); // 임시 표시

      const detail = await ensureDetail(setupId);
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === Number(stepNo));

      const cur = row?.status || 'NOT_STARTED';
      const nxt = nextStatus(cur);

      // PATCH step
      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
        method: 'PATCH',
        body: { status: nxt }
      });

      // 캐시 업데이트
      if (row) row.status = nxt;
      else steps.push({ step_no: stepNo, status: nxt }); // 비정상일 때 방어

      updateCellUI(td, nxt, '');
      toast(`Step ${stepNo} → ${nxt}`);
    } catch (e) {
      // 실패 시 UI 복구: 추정값으로 되돌리기(정확 복구는 detail reload가 필요)
      updateCellUI(td, 'NOT_STARTED', '');
      toast(`상태 변경 실패: ${e.message}`);
    }
  }

  /* =========================
   * Modal: open/close & render detail
   * ========================= */
  function openModalShell() {
    el.modal.classList.remove('hidden');
  }
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

    // fill project fields
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

    // steps map
    const byNo = new Map();
    for (const s of steps) byNo.set(Number(s.step_no), s);

    el.stepsHost.innerHTML = STEPS.map(t => {
      const s = byNo.get(t.no) || {};
      const st = (s.status || 'NOT_STARTED').toUpperCase();

      const desc = s.step_description ? String(s.step_description) : '';

      return `
        <div class="step-card" data-step-card="1" data-step-no="${t.no}">
          <div class="step-top">
            <div>
              <div class="step-name">${t.no}. ${escapeHtml(t.name)}</div>
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
              <label>Plan Start</label>
              <input type="date" data-field="plan_start" value="${escapeHtml(fmtDate(s.plan_start))}"/>
            </div>
            <div class="field">
              <label>Plan End</label>
              <input type="date" data-field="plan_end" value="${escapeHtml(fmtDate(s.plan_end))}"/>
            </div>
            <div class="field">
              <label>Workers</label>
              <input type="text" data-field="workers" value="${escapeHtml(s.workers || '')}" placeholder="정현우,김동한"/>
            </div>

            <div class="field">
              <label>Actual Start</label>
              <input type="date" data-field="actual_start" value="${escapeHtml(fmtDate(s.actual_start))}"/>
            </div>
            <div class="field">
              <label>Actual End</label>
              <input type="date" data-field="actual_end" value="${escapeHtml(fmtDate(s.actual_end))}"/>
            </div>
            <div class="field wide" style="grid-column: span 2;">
              <label>Note</label>
              <input type="text" data-field="note" value="${escapeHtml(s.note || '')}" placeholder="메모"/>
            </div>
          </div>

          <div class="step-actions">
            <span class="muted small" data-hint="1"></span>
            <button class="btn primary" data-save-step="1">이 Step 저장</button>
          </div>
        </div>
      `;
    }).join('');

    // bind step card events
    el.stepsHost.querySelectorAll('[data-step-card="1"]').forEach(card => {
      const stepNo = Number(card.getAttribute('data-step-no'));
      const selStatus = card.querySelector('[data-field="status"]');
      const pill = card.querySelector('[data-pill="1"]');
      const hint = card.querySelector('[data-hint="1"]');
      const btn = card.querySelector('[data-save-step="1"]');

      // change status UI instantly
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

        try {
          hint.textContent = 'saving...';
          await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
            method: 'PATCH',
            body: patch
          });

          // cache update (최소한 status는 반영)
          const data = state.detailCache.get(setupId);
          if (data && Array.isArray(data.steps)) {
            const row = data.steps.find(x => Number(x.step_no) === stepNo);
            if (row) Object.assign(row, patch);
          }

          hint.textContent = 'saved ✅';

          // 보드(매트릭스)도 즉시 반영: 같은 셀 찾아 업데이트
          const td = el.tableHost.querySelector(`[data-cell="1"][data-setup-id="${setupId}"][data-step-no="${stepNo}"]`);
          if (td && patch.status) updateCellUI(td, patch.status, '');

          toast(`Step ${stepNo} 저장 완료`);
          setTimeout(() => (hint.textContent = ''), 1500);
        } catch (e) {
          hint.textContent = `fail: ${e.message}`;
          toast(`Step 저장 실패: ${e.message}`);
        }
      });
    });

    // issues render
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

      // 캐시 무효화 후 재조회(정확하게)
      state.detailCache.delete(setupId);
      const data = await ensureDetail(setupId);
      renderModal(data);

      // 리스트도 재로드(헤더/정렬/필터 반영)
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

    el.toggleCompact.addEventListener('change', () => {
      const card = el.tableHost.closest('.board');
      card.classList.toggle('compact', el.toggleCompact.checked);
    });

    el.btnClose.addEventListener('click', closeModal);

    el.modal.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-close');
      if (close === '1') closeModal();
    });

    el.btnSaveProject.addEventListener('click', saveProject);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();

    if (!getToken()) {
      toast('로그인이 필요합니다. (x-access-token 없음)');
    }
    await loadBoard();
  });

})();
