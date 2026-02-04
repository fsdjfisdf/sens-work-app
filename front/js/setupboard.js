(() => {
  'use strict';

  /* =========================
   *  Config: Step names (1~17)
   *  - DB template와 별개로, 화면에서는 항상 1~17을 행으로 표시
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

  /* =========================
   *  Helpers
   * ========================= */
  const $ = (sel, root = document) => root.querySelector(sel);

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

  function fmtDate(d) {
    if (!d) return '-';
    const s = String(d);
    // "2026-02-04T..." -> "2026-02-04"
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.add('hidden'), 2200);
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

  /* =========================
   *  State
   * ========================= */
  const state = {
    list: [], // board rows
    selectedSetupId: null,
    compact: true
  };

  /* =========================
   *  DOM refs
   * ========================= */
  const el = {
    matrixHost: $('#matrixHost'),
    statCount: $('#statCount'),

    fCustomer: $('#fCustomer'),
    fSite: $('#fSite'),
    fLine: $('#fLine'),
    fStatus: $('#fStatus'),
    fQ: $('#fQ'),
    fSort: $('#fSort'),

    btnApply: $('#btnApply'),
    btnRefresh: $('#btnRefresh'),
    toggleCompact: $('#toggleCompact'),

    detailPanel: $('#detailPanel'),
    btnCloseDetail: $('#btnCloseDetail'),
    dTitle: $('#dTitle'),
    dMeta: $('#dMeta'),
    dKpis: $('#dKpis'),
    dSteps: $('#dSteps'),
    dIssues: $('#dIssues'),

    btnNewProject: $('#btnNewProject'),
    modalNew: $('#modalNew'),
    btnCreate: $('#btnCreate'),

    nEquipmentName: $('#nEquipmentName'),
    nEquipmentType: $('#nEquipmentType'),
    nCustomer: $('#nCustomer'),
    nSite: $('#nSite'),
    nLine: $('#nLine'),
    nLocation: $('#nLocation'),
    nStartDate: $('#nStartDate'),
    nTargetDate: $('#nTargetDate'),
    nOwnerMain: $('#nOwnerMain'),
    nOwnerSupport: $('#nOwnerSupport'),
    nLastNote: $('#nLastNote'),
  };

  /* =========================
   *  Render: Matrix table
   * ========================= */
  function renderMatrix(list) {
    const count = list.length;
    el.statCount.textContent = `설비 ${count}대`;

    if (!count) {
      el.matrixHost.innerHTML = `
        <div style="padding:16px; color:#6b7280;">
          데이터가 없습니다. (필터 조건을 확인하거나, 프로젝트를 추가하세요)
        </div>
      `;
      return;
    }

    // Build a quick lookup by setup_id -> (step_no -> status)
    const stepMapBySetup = new Map();
    for (const p of list) {
      // API listBoard는 step status를 “한 칼럼”으로만 주고 있음 (done_steps, total_steps, in_progress_step_no)
      // 상세는 /setup-projects/:id 에서 step별로 받는다.
      // 매트릭스에서는 "추정"을 하되, 정확한 step 상태는 클릭 상세에서 확인.
      // 추정 규칙:
      // - step_no < in_progress_step_no : DONE (완료로 간주)
      // - step_no == in_progress_step_no : IN_PROGRESS
      // - 그 외 : NOT_STARTED
      const inProg = Number(p.in_progress_step_no || 0);
      const m = new Map();
      for (const st of STEPS) {
        let s = 'NOT_STARTED';
        if (inProg && st.no < inProg) s = 'DONE';
        if (inProg && st.no === inProg) s = 'IN_PROGRESS';
        // 프로젝트가 DONE이면 모두 DONE
        if (String(p.board_status || '').toUpperCase() === 'DONE') s = 'DONE';
        // HOLD이면 아직 안 한 것들은 HOLD처럼 보이게(가시성)
        if (String(p.board_status || '').toUpperCase() === 'HOLD' && s === 'NOT_STARTED') s = 'HOLD';
        m.set(st.no, s);
      }
      stepMapBySetup.set(p.setup_id, m);
    }

    const theadCols = list.map(p => {
      const name = escapeHtml(p.equipment_name || '(no name)');
      const sub = [
        p.customer || '-',
        p.site || '-',
        p.line || '-'
      ].join(' · ');
      const target = p.target_date ? ` | T:${fmtDate(p.target_date)}` : '';
      const issues = Number(p.open_issues || 0) > 0 ? `<span class="issueMark" title="OPEN ISSUE">!</span>` : '';
      return `
        <th class="eq-head" data-setup-id="${p.setup_id}" title="클릭: 상세 보기">
          <div class="eq-name">${name}${issues}</div>
          <div class="eq-sub">${escapeHtml(sub)}${escapeHtml(target)}</div>
        </th>
      `;
    }).join('');

    const tbodyRows = STEPS.map(step => {
      const cells = list.map(p => {
        const m = stepMapBySetup.get(p.setup_id);
        const st = m?.get(step.no) || 'NOT_STARTED';
        const cls = statusToClass(st);
        const short = statusShort(st);
        const tip = `${p.equipment_name} / Step ${step.no} ${step.name} : ${st}`;
        return `
          <td class="cell" title="${escapeHtml(tip)}">
            <span class="pill ${cls}">${short}</span>
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td class="step-col">
            ${step.no}. ${escapeHtml(step.name)}
          </td>
          ${cells}
        </tr>
      `;
    }).join('');

    el.matrixHost.innerHTML = `
      <table class="matrix">
        <thead>
          <tr>
            <th class="step-col">작업 항목 (1~17)</th>
            ${theadCols}
          </tr>
        </thead>
        <tbody>
          ${tbodyRows}
        </tbody>
      </table>
    `;

    // click handlers for equipment header
    el.matrixHost.querySelectorAll('.eq-head').forEach(th => {
      th.addEventListener('click', () => {
        const setupId = th.getAttribute('data-setup-id');
        if (setupId) openDetail(setupId);
      });
    });
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /* =========================
   *  Detail panel
   * ========================= */
  async function openDetail(setupId) {
    state.selectedSetupId = String(setupId);
    el.detailPanel.classList.remove('hidden');
    el.dTitle.textContent = '로딩 중...';
    el.dMeta.textContent = '';
    el.dKpis.innerHTML = '';
    el.dSteps.innerHTML = '';
    el.dIssues.innerHTML = '';

    try {
      const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`);
      const data = json?.data;
      const project = data?.project;
      const steps = data?.steps || [];
      const issues = data?.issues || [];

      el.dTitle.textContent = project?.equipment_name || `SETUP #${setupId}`;
      el.dMeta.textContent = [
        project?.equipment_type || '-',
        project?.customer || '-',
        project?.site || '-',
        project?.line || '-',
        project?.location ? `@${project.location}` : ''
      ].filter(Boolean).join(' · ');

      // KPIs
      const done = steps.filter(s => String(s.status).toUpperCase() === 'DONE').length;
      const total = steps.length || 17;
      const ip = steps.find(s => String(s.status).toUpperCase() === 'IN_PROGRESS');
      const openIssues = issues.filter(i => String(i.state).toUpperCase() === 'OPEN').length;

      el.dKpis.innerHTML = `
        <div class="kpi"><div class="k">Board Status</div><div class="v">${escapeHtml(project?.board_status || '-')}</div></div>
        <div class="kpi"><div class="k">Progress</div><div class="v">${done}/${total}</div></div>
        <div class="kpi"><div class="k">In Progress Step</div><div class="v">${ip ? `${ip.step_no}` : '-'}</div></div>
        <div class="kpi"><div class="k">Open Issues</div><div class="v">${openIssues}</div></div>
        <div class="kpi"><div class="k">Start</div><div class="v">${fmtDate(project?.start_date)}</div></div>
        <div class="kpi"><div class="k">Target</div><div class="v">${fmtDate(project?.target_date)}</div></div>
      `;

      // Steps list
      const stepsByNo = new Map();
      for (const s of steps) stepsByNo.set(Number(s.step_no), s);

      el.dSteps.innerHTML = STEPS.map(t => {
        const s = stepsByNo.get(t.no);
        const st = s?.status || 'NOT_STARTED';
        const cls = statusToClass(st);

        const workers = s?.workers ? String(s.workers) : '-';
        const note = s?.note ? String(s.note) : '';
        const planStart = fmtDate(s?.plan_start);
        const planEnd = fmtDate(s?.plan_end);
        const actStart = fmtDate(s?.actual_start);
        const actEnd = fmtDate(s?.actual_end);

        const desc = s?.step_description ? String(s.step_description) : '';

        return `
          <div class="step-row">
            <div class="step-row-top">
              <div>
                <div class="step-name">${t.no}. ${escapeHtml(t.name)}</div>
                ${desc ? `<div class="step-sub">${escapeHtml(desc)}</div>` : ``}
              </div>
              <div>
                <span class="pill ${cls}" title="${escapeHtml(String(st).toUpperCase())}">${statusShort(st)}</span>
              </div>
            </div>

            <div class="step-meta">
              <div class="meta-item"><b>예정</b>${escapeHtml(planStart)} ~ ${escapeHtml(planEnd)}</div>
              <div class="meta-item"><b>실적</b>${escapeHtml(actStart)} ~ ${escapeHtml(actEnd)}</div>
              <div class="meta-item"><b>작업자</b>${escapeHtml(workers)}</div>
              <div class="meta-item"><b>메모</b>${note ? escapeHtml(note) : '-'}</div>
            </div>
          </div>
        `;
      }).join('');

      // Issues
      const open = issues.filter(i => String(i.state).toUpperCase() === 'OPEN');
      if (!issues.length) {
        el.dIssues.innerHTML = `<div class="muted">등록된 이슈가 없습니다.</div>`;
      } else {
        el.dIssues.innerHTML = issues.map(i => {
          const sev = String(i.severity || 'MAJOR').toUpperCase();
          const cat = String(i.category || 'ETC').toUpperCase();
          const st = String(i.state || 'OPEN').toUpperCase();
          const stepNo = i.step_no ? `STEP ${i.step_no}` : 'STEP -';
          return `
            <div class="issue-card">
              <div class="t">${escapeHtml(i.title || '(no title)')}</div>
              <div class="m">${escapeHtml(i.content || '')}</div>
              <div class="s">
                <span class="badge issue">!</span>
                <span>${escapeHtml(stepNo)}</span>
                <span>${escapeHtml(sev)}</span>
                <span>${escapeHtml(cat)}</span>
                <span>${escapeHtml(st)}</span>
                ${i.owner ? `<span>Owner: ${escapeHtml(i.owner)}</span>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      if (openIssues > 0) {
        toast(`이슈 ${openIssues}건이 열려있습니다.`);
      }
    } catch (e) {
      el.dTitle.textContent = '상세 로드 실패';
      el.dMeta.textContent = e.message;
      toast(`상세 불러오기 실패: ${e.message}`);
    }
  }

  function closeDetail() {
    state.selectedSetupId = null;
    el.detailPanel.classList.add('hidden');
  }

  /* =========================
   *  Load list
   * ========================= */
  async function loadBoard() {
    try {
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

      const json = await apiFetch(`/api/setup-board?${q}`);
      const list = json?.data || [];
      state.list = list;

      renderMatrix(list);

      // 선택된 상세가 있으면 갱신
      if (state.selectedSetupId) {
        openDetail(state.selectedSetupId);
      }
    } catch (e) {
      el.matrixHost.innerHTML = `
        <div style="padding:16px; color:#b91c1c;">
          보드 로드 실패: ${escapeHtml(e.message)}
        </div>
      `;
      toast(`보드 로드 실패: ${e.message}`);
    }
  }

  /* =========================
   *  Create project
   * ========================= */
  function openModal() {
    el.modalNew.classList.remove('hidden');
  }
  function closeModal() {
    el.modalNew.classList.add('hidden');
  }

  async function createProject() {
    const payload = {
      equipment_name: el.nEquipmentName.value.trim(),
      equipment_type: el.nEquipmentType.value.trim() || null,
      customer: el.nCustomer.value || null,
      site: el.nSite.value,
      line: el.nLine.value,
      location: el.nLocation.value.trim() || null,
      start_date: el.nStartDate.value || null,
      target_date: el.nTargetDate.value || null,
      owner_main: el.nOwnerMain.value.trim() || null,
      owner_support: el.nOwnerSupport.value.trim() || null,
      last_note: el.nLastNote.value.trim() || null
    };

    if (!payload.equipment_name) return toast('설비명을 입력하세요.');
    if (!payload.site) return toast('SITE를 선택하세요.');
    if (!payload.line) return toast('LINE을 선택하세요.');

    try {
      const json = await apiFetch('/api/setup-projects', { method: 'POST', body: payload });
      toast(`생성 완료 (ID: ${json?.setup_id})`);
      closeModal();

      // 초기화
      el.nEquipmentName.value = '';
      el.nEquipmentType.value = '';
      el.nCustomer.value = '';
      el.nSite.value = '';
      el.nLine.value = '';
      el.nLocation.value = '';
      el.nStartDate.value = '';
      el.nTargetDate.value = '';
      el.nOwnerMain.value = '';
      el.nOwnerSupport.value = '';
      el.nLastNote.value = '';

      await loadBoard();
      if (json?.setup_id) openDetail(json.setup_id);
    } catch (e) {
      toast(`생성 실패: ${e.message}`);
    }
  }

  /* =========================
   *  Events
   * ========================= */
  function bindEvents() {
    el.btnApply.addEventListener('click', loadBoard);
    el.btnRefresh.addEventListener('click', loadBoard);

    // Enter in search box
    el.fQ.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadBoard();
    });

    el.toggleCompact.addEventListener('change', () => {
      state.compact = el.toggleCompact.checked;
      // toggle class on matrix container
      const wrap = el.matrixHost.closest('.matrix-wrap');
      if (state.compact) wrap.classList.add('compact');
      else wrap.classList.remove('compact');
    });

    el.btnCloseDetail.addEventListener('click', closeDetail);

    // modal open/close
    el.btnNewProject.addEventListener('click', openModal);
    el.modalNew.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-close');
      if (close === '1') closeModal();
    });
    el.btnCreate.addEventListener('click', createProject);

    // init compact class
    const wrap = el.matrixHost.closest('.matrix-wrap');
    wrap.classList.toggle('compact', el.toggleCompact.checked);
  }

  /* =========================
   *  Boot
   * ========================= */
  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();

    // 로그인 토큰 없으면 안내 (페이지는 뜨되 API 401이 날 것)
    if (!getToken()) {
      toast('로그인이 필요합니다. (x-access-token 없음)');
    }
    await loadBoard();
  });

})();
