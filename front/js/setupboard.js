(() => {
  'use strict';

  /* =========================
   * Step template (표시용)
   * ✅ 5,6) STEP 번호 표시 제거 + 출력명 변경
   * ========================= */
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

  const STATUS_ORDER = ['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'HOLD'];

  /* =========================
   * DOM
   * ========================= */
  const $ = (sel, root=document) => root.querySelector(sel);

  const el = {
    btnNew: $('#btnNew'),
    btnRefresh: $('#btnRefresh'),
    btnApply: $('#btnApply'),
    tableHost: $('#tableHost'),
    statCount: $('#statCount'),

    // ✅ filters
    fEqType: $('#fEqType'),
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
    p_site: $('#p_site'),
    p_line: $('#p_line'),
    p_location: $('#p_location'),
    p_board_status: $('#p_board_status'),
    p_start_date_auto: $('#p_start_date_auto'),
    p_target_date: $('#p_target_date'),
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
    createMode: false,

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

  function parseStepMap(p) {
    const raw = p?.step_status_map;
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function computeAutoStartDate(detail) {
    const p = detail?.project || {};
    const steps = detail?.steps || [];
    if (p.start_date) return fmtDate(p.start_date);

    const s1 = steps.find(x => Number(x.step_no) === 1) || {};
    const d = firstNonEmpty(fmtDate(s1.actual_start), fmtDate(s1.plan_start), '');
    return d;
  }

  /* =========================
   * Board list
   * ========================= */
  async function loadBoard() {
    const q = buildQuery({
      equipment_type: el.fEqType.value,  // ✅ 2) EQ TYPE 필터 파라미터
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
   * Render: 행=설비, 열=작업항목
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
              <!-- ✅ 5) STEP 번호 제거, 이름만 -->
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

    // 설비명 클릭 -> 상세 모달
    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(a => {
      a.addEventListener('click', () => {
        const setupId = a.getAttribute('data-setup-id');
        if (setupId) openEditModal(setupId);
      });
    });

    // 셀 클릭 -> 상태 토글 PATCH (기능은 유지)
    el.tableHost.querySelectorAll('[data-cell="1"]').forEach(td => {
      td.addEventListener('click', async () => {
        const setupId = td.getAttribute('data-setup-id');
        const stepNo = Number(td.getAttribute('data-step-no'));
        if (!setupId || !stepNo) return;
        await toggleCellStatus(td, setupId, stepNo);
      });

      // hover tooltip 유지(요청에서 기능 삭제 요구는 없음)
      td.addEventListener('mouseenter', onCellEnter);
      td.addEventListener('mousemove', onCellMove);
      td.addEventListener('mouseleave', onCellLeave);
    });
  }

  function renderRow(p) {
    const name = escapeHtml(p.equipment_name || '(no name)');
    // ✅ Customer 삭제, EQ TYPE 포함해서 표시
    const sub = escapeHtml([p.equipment_type || '-', p.site || '-', p.line || '-'].join(' · '));
    const issues = Number(p.open_issues || 0) > 0 ? `<span class="issueMark" title="OPEN ISSUE">!</span>` : '';

    const stepMap = parseStepMap(p);

    const cells = STEPS.map(s => {
      const st = String(stepMap[String(s.no)] || 'NOT_STARTED').toUpperCase();
      const cls = statusToClass(st);
      const short = statusShort(st);

      return `
        <td class="cell"
            data-cell="1"
            data-setup-id="${p.setup_id}"
            data-step-no="${s.no}"
            data-status="${st}">
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
    const cur = (td.getAttribute('data-status') || 'NOT_STARTED').toUpperCase();
    const nxt = nextStatus(cur);

    updateCellUI(td, nxt, 'saving...');

    try {
      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
        method: 'PATCH',
        body: { status: nxt }
      });

      td.setAttribute('data-status', nxt);
      updateCellUI(td, nxt, '');

      const cached = state.detailCache.get(String(setupId));
      if (cached?.steps) {
        const row = cached.steps.find(x => Number(x.step_no) === Number(stepNo));
        if (row) row.status = nxt;
        else cached.steps.push({ step_no: stepNo, status: nxt });
      }

      toast(`STEP ${stepNo} → ${nxt} 저장됨`);
    } catch (e) {
      updateCellUI(td, cur, '');
      td.setAttribute('data-status', cur);
      toast(`DB 저장 실패: ${e.message}`);
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

    el.tooltip.classList.remove('hidden');
    el.tooltip.innerHTML = `<div class="tip-title">Loading...</div>`;
    placeTooltip(clientX, clientY);

    try {
      const detail = await ensureDetail(setupId);
      if (state.hoverKey !== key) return;

      const stepName = STEPS.find(s => s.no === stepNo)?.name || `STEP ${stepNo}`;
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === stepNo) || {};

      const planDate   = firstNonEmpty(fmtDate(row.plan_start), fmtDate(row.plan_end), '-');
      const actualDate = firstNonEmpty(fmtDate(row.actual_start), fmtDate(row.actual_end), '-');
      const workers    = firstNonEmpty(row.workers, '-');
      const note       = firstNonEmpty(row.note, '-');

      el.tooltip.innerHTML = `
        <div class="tip-title">${escapeHtml(stepName)}</div>
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
    }, 180);
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
    state.createMode = false;
    el.btnSaveProject.textContent = 'SAVE';
  }

  function openCreateModal() {
    state.createMode = true;
    state.selectedSetupId = null;
    openModalShell();

    el.mTitle.textContent = '신규 설비 추가';
    el.mMeta.textContent = '필수: 설비명, Site, Line';

    el.p_equipment_name.value = '';
    el.p_equipment_type.value = '';
    el.p_site.value = '';
    el.p_line.value = '';
    el.p_location.value = '';
    el.p_board_status.value = 'PLANNED';
    el.p_target_date.value = '';
    el.p_last_note.value = '';
    el.p_start_date_auto.value = '';

    el.stepsHost.innerHTML = `<div class="muted">저장하면 STEP 1~17이 자동 생성됩니다.</div>`;
    el.issuesHost.innerHTML = `<div class="muted">프로젝트 생성 후 이슈 확인/등록 가능</div>`;

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
   * Render modal
   * 7) Owner 필드 제거 완료
   * 8) Start Date 자동 표시 + Step1 저장 시 프로젝트 start_date 반영
   * ========================= */
  function renderModal(data) {
    const p = data?.project || {};
    const steps = data?.steps || [];
    const issues = data?.issues || [];

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
    el.p_target_date.value = fmtDate(p.target_date);
    el.p_last_note.value = p.last_note || '';

    // ✅ 8) Start Date 자동(프로젝트 start_date 없으면 STEP1 actual/plan에서)
    el.p_start_date_auto.value = computeAutoStartDate(data) || '';

    const byNo = new Map();
    for (const s of steps) byNo.set(Number(s.step_no), s);

    el.stepsHost.innerHTML = STEPS.map(t => {
      const s = byNo.get(t.no) || {};
      const st = (s.status || 'NOT_STARTED').toUpperCase();
      const desc = s.step_description ? String(s.step_description) : '';

      const planDate = fmtDate(s.plan_start);
      const actualDate = fmtDate(s.actual_start);

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

          // ✅ 8) STEP 1 날짜가 들어오면 프로젝트 start_date 자동 반영(PATCH)
          if (stepNo === 1) {
            const auto = firstNonEmpty(patch.actual_start, patch.plan_start, null);
            if (auto) {
              try {
                await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`, {
                  method: 'PATCH',
                  body: { start_date: auto }
                });
                // 모달 표시값도 즉시 반영
                el.p_start_date_auto.value = auto;
              } catch (_) {
                // start_date 반영 실패는 step 저장 자체 실패보다 중요도 낮음
              }
            }
          }

          hint.textContent = 'saved ✅';

          // 보드 셀도 즉시 반영(status만)
          const td = el.tableHost.querySelector(
            `[data-cell="1"][data-setup-id="${setupId}"][data-step-no="${stepNo}"]`
          );
          if (td && patch.status) updateCellUI(td, patch.status, '');

          toast(`${STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`} 저장 완료`);
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
        const step = i.step_no ? `${STEPS.find(s=>s.no===Number(i.step_no))?.name || `STEP ${i.step_no}`}` : 'STEP -';
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
   * Save project (CREATE / SAVE)
   * ✅ 7) owner 제거
   * ✅ 8) start_date는 자동(수정 시 payload에서 제거, step1로 반영)
   * ========================= */
  async function saveProject() {
    const isCreate = state.createMode === true;
    const setupId = state.selectedSetupId;

    const payloadBase = {
      equipment_name: el.p_equipment_name.value.trim(),
      equipment_type: el.p_equipment_type.value.trim() || null,
      site: el.p_site.value.trim(),
      line: el.p_line.value.trim(),
      location: el.p_location.value.trim() || null,
      target_date: el.p_target_date.value || null,
      last_note: el.p_last_note.value.trim() || null
    };

    if (!payloadBase.equipment_name) return toast('설비명은 필수입니다.');
    if (!payloadBase.site) return toast('Site는 필수입니다.');
    if (!payloadBase.line) return toast('Line은 필수입니다.');

    try {
      el.projSaveHint.textContent = 'saving...';

      if (isCreate) {
        const json = await apiFetch(`/api/setup-projects`, {
          method: 'POST',
          body: payloadBase
        });

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

      const patch = {
        ...payloadBase,
        board_status: el.p_board_status.value
        // start_date는 여기서 보내지 않음 (STEP1 저장시 자동 반영)
      };

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
   * Events
   * ========================= */
  function bindEvents() {
    el.btnNew.addEventListener('click', openCreateModal);
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
