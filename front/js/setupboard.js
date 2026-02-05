(() => {
  'use strict';

  /* =========================
   * CONFIG
   * ========================= */

  // ✅ 작업이력 API
  // 네가 현재 쓰는 엔드포인트 그대로 기본값으로 둠.
  // 만약 백엔드가 /work-logs 로 제공한다면 아래 URL만 바꾸면 됨.
  const WORKLOG_API_URL = 'http://3.37.73.151:3001/logs';
  // 예) const WORKLOG_API_URL = '/api/work-logs';

  /**
   * ✅ STEP 순서
   */
  const STEPS = [
    { no: 1,  name: 'TEMPLATE DRAW', desc: '설비/랙/펌프 타공부 도면 작성(OHT LINE 기준)' },
    { no: 2,  name: 'TEMPLATE 확인', desc: '업체 타공부 도면 대조 및 정상 여부 확인' },
    { no: 3,  name: 'FAB IN', desc: '설비/랙 반입 및 BOX PART 반입 체크리스트 진행' },
    { no: 4,  name: 'DOCKING', desc: '모듈 도킹 + 내부 CABLE HOOK UP + ROBOT LEVELING' },
    { no: 5,  name: 'CABLE H/U', desc: '설비/랙/펌프 간 케이블 연결' },
    { no: 6,  name: 'SILICON', desc: '이물 유입 방지(랙: POWER ON 전, 펌프: AGV CABLE 후 마감)' },
    { no: 7,  name: 'POWER T/O', desc: 'AC RACK 및 설비 TURN ON(특이사항 다발 구간)' },
    { no: 8,  name: 'UTILITY T/O', desc: 'PCW/CDA/VAC TURN ON(PCW LINE 가압 PASS 선행)' },
    { no: 9,  name: 'CHILLER T/O', desc: 'CHILLER TURN ON' },
    { no: 10, name: 'HEAT EX T/O', desc: 'WALL TEMP 조절 HEAT EXCHANGER TURN ON' },
    { no: 11, name: 'PUMP T/O', desc: 'TM/PM/AM/LL PUMPING 위해 PUMP TURN ON(방치압 TEST)' },
    { no: 12, name: 'TEACHING', desc: 'EFEM/TM 로봇 및 모듈 WAFER TEACHING(LOAD PORT/OHT/TM BLADE/CASSETTE 선행)' },
    { no: 13, name: 'GAS T/O', desc: 'H2/NF3 사용, GAS LINE 가압 PASS 선행' },
    { no: 14, name: 'TTTM', desc: '고객 SPEC에 맞춰 GAS/PCW/CDA/PUMP/FFU/VAC 등 조절' },
    { no: 15, name: '인증 준비', desc: '고객 인증 전 설비 안전 상태 등 점검' },
    { no: 16, name: '중간 인증', desc: '고객사 인증(지진방지/환경QUAL/RF CAL/MFC 인증 선행)' },
    { no: 17, name: 'PROCESS CONFIRM', desc: 'AGING 진행으로 설비 이상 여부 검증(고객 진행)' }
  ];

  /**
   * ✅ STEP 키워드(작업이력 매칭용)
   * - description 뿐 아니라 task_name/setup_item/transfer_item/work_type 등에 포함될 수 있어서
   *   "haystack"으로 묶어 검색함.
   */
  const STEP_KEYWORDS = {
    1:  ['TEMPLATE','DRAW','타공'],
    2:  ['TEMPLATE','DRAW','타공'],
    3:  ['FAB IN','PACKING LIST','PACKING'],
    4:  ['DOCKING','내부 HOOK UP'],
    5:  ['CABLE HOOK UP','HOOK UP'],
    6:  ['SILICON'],
    7:  ['POWER TURN ON','SYCON','RACK'],
    8:  ['UTILITY TURN ON','UTILITY','VAC','CDA','PCW'],
    9:  ['CHILLER'],
    10: ['HEAT EX'],
    11: ['PUMP TURN ON','방치압'],
    12: ['ROBOT','TEACHING'],
    13: ['GAS TURN ON','GAS'],
    14: ['TTTM','REPORT'],
    15: ['중간 인증','가동 인증','중간 가동 인증'],
    16: ['PROCESS CONFIRM'],
    17: ['PROCESS CONFIRM']
  };

  const STATUS_ORDER = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'HOLD'];

  /**
   * ✅ 선행조건 순서
   */
  const PREREQS = [
    { code:'TRAY_INSTALL',          title:'TRAY 설치',           required:true,  beforeStepNo:5,  requiredBefore:'CABLE HOOK UP',   desc:'CABLE HOOK UP 전 필수' },
    { code:'THREE_PHASE',           title:'3상 설치',            required:true,  beforeStepNo:7,  requiredBefore:'POWER TURN ON',    desc:'POWER TURN ON 전 필수' },
    { code:'AGV_INSTALL',           title:'AGV 설치',            required:false, beforeStepNo:6,  requiredBefore:'SILICON 작업',     desc:'SILICON 작업 전 설치 권장' },
    { code:'PCW_PRESSURE_PASS',     title:'PCW LINE 가압 PASS',  required:true,  beforeStepNo:8,  requiredBefore:'UTILITY TURN ON',  desc:'UTILITY TURN ON 전 필수(LEAK 확인)' },
    { code:'LP_SETUP',              title:'LP SET UP',           required:true,  beforeStepNo:12, requiredBefore:'TEACHING',         desc:'TEACHING 전 필수' },
    { code:'OHT_CERT',              title:'OHT 가동 인증',       required:true,  beforeStepNo:12, requiredBefore:'TEACHING',         desc:'TEACHING 전 필수' },
    { code:'GAS_PRESSURE_PASS',     title:'GAS LINE 가압 PASS',  required:true,  beforeStepNo:13, requiredBefore:'GAS TURN ON',      desc:'GAS TURN ON 전 필수' },
    { code:'RF_CAL',                title:'RF CAL',              required:true,  beforeStepNo:16, requiredBefore:'중간 인증',        desc:'중간 인증 전 필수' },
    { code:'ENV_QUAL',              title:'환경 QUAL',           required:true,  beforeStepNo:16, requiredBefore:'중간 인증',        desc:'중간 인증 전 필수' },
    { code:'MFC_CERT',              title:'MFC 인증',            required:true,  beforeStepNo:16, requiredBefore:'중간 인증',        desc:'중간 인증 전 필수' },
    { code:'SEISMIC_BKT',           title:'지진방지 BKT 체결',   required:true,  beforeStepNo:16, requiredBefore:'중간 인증',        desc:'중간 인증 전 필수' },
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
    tabLogs: $('#tabLogs'),
    viewSteps: $('#viewSteps'),
    viewPrereq: $('#viewPrereq'),
    viewLogs: $('#viewLogs'),

    stepsHost: $('#stepsHost'),
    prereqHost: $('#prereqHost'),
    prBadge: $('#prBadge'),

    // logs UI
    logsHost: $('#logsHost'),
    logBadge: $('#logBadge'),
    logQ: $('#logQ'),
    logStep: $('#logStep'),
    logLimit: $('#logLimit'),
    btnReloadLogs: $('#btnReloadLogs'),

    // help modal
    helpModal: $('#helpModal'),
    btnHelpClose: $('#btnHelpClose'),
    helpFlowHost: $('#helpFlowHost'),
    helpPrereqHost: $('#helpPrereqHost'),

    tooltip: $('#tooltip'),
    toast: $('#toast')
  };

  const state = {
    list: [],
    detailCache: new Map(),  // setupId -> {project, steps, prereqs}
    prereqCache: new Map(),  // setupId -> map(code->row)
    selectedSetupId: null,
    createMode: false,

    hoverTimer: null,
    hoverKey: null,

    // worklogs
    workLogsCache: null,
    workLogsFetchedAt: 0,
    equipmentLogs: []
  };

  /* =========================================================
   * Utils
   * ========================================================= */
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
    if (!el.toast) return;
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

  /* =========================================================
   * Tooltip (잔상/작은 점 남는 현상 방지)
   * - hidden 클래스 + display + 좌표 원복을 함께 처리
   * - mouseout/mouseleave 중복 호출에도 안전
   * ========================================================= */
  function ensureTooltipEl() {
    if (el.tooltip) return;
    const div = document.createElement('div');
    div.id = 'tooltip';
    div.className = 'tooltip hidden';
    div.style.position = 'fixed';
    div.style.zIndex = '9500';
    div.style.pointerEvents = 'none';
    document.body.appendChild(div);
    el.tooltip = div;
  }

  function hideTooltip() {
    ensureTooltipEl();
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
    state.hoverKey = null;

    // ✅ 확실한 숨김(잔상 방지)
    el.tooltip.classList.add('hidden');
    el.tooltip.innerHTML = '';
    el.tooltip.style.display = 'none';
    el.tooltip.style.left = '-9999px';
    el.tooltip.style.top = '-9999px';
  }

  function forceShowTooltip() {
    ensureTooltipEl();
    el.tooltip.style.display = 'block';
    el.tooltip.classList.remove('hidden');
  }

  function placeTooltip(x, y) {
    ensureTooltipEl();
    const pad = 14;
    const maxX = window.innerWidth - pad - 10;
    const maxY = window.innerHeight - pad - 10;
    el.tooltip.style.left = Math.min(x + 14, maxX) + 'px';
    el.tooltip.style.top  = Math.min(y + 14, maxY) + 'px';
  }

  async function showTooltipForCell(td, clientX, clientY) {
    ensureTooltipEl();
    if (!td || !td.isConnected) return;

    const setupId = td.getAttribute('data-setup-id');
    const stepNo = Number(td.getAttribute('data-step-no'));
    if (!setupId || !stepNo) return;

    const key = `${setupId}:${stepNo}`;
    state.hoverKey = key;

    forceShowTooltip();
    el.tooltip.innerHTML = `<div class="tip-title">Loading...</div>`;
    placeTooltip(clientX, clientY);

    try {
      const detail = await ensureDetail(setupId);
      if (state.hoverKey !== key) return;

      const stepName = STEPS.find(s => s.no === stepNo)?.name || `STEP ${stepNo}`;
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === stepNo) || {};

      const planEnd = firstNonEmpty(fmtYYMMDD(row.plan_end), '-');
      const as = firstNonEmpty(fmtYYMMDD(row.actual_start), '-');
      const ae = firstNonEmpty(fmtYYMMDD(row.actual_end), '-');

      const workers = firstNonEmpty(row.workers, row.worker, row.worker_names, row.task_man, row.owner, '-');
      const note = firstNonEmpty(row.note, row.memo, row.remark, row.comment, '-', '');

      el.tooltip.innerHTML = `
        <div class="tip-title">${escapeHtml(stepName)}</div>
        <div class="tip-grid">
          <div class="tip-k">Plan End</div><div class="tip-v">${escapeHtml(planEnd)}</div>
          <div class="tip-k">Actual S</div><div class="tip-v">${escapeHtml(as)}</div>
          <div class="tip-k">Actual E</div><div class="tip-v">${escapeHtml(ae)}</div>
          <div class="tip-k">작업자</div><div class="tip-v">${escapeHtml(workers)}</div>
          <div class="tip-k">특이사항</div><div class="tip-v">${escapeHtml(note || '-')}</div>
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
      placeTooltip(clientX, clientY);
    }
  }

  function onCellEnter(e) {
    clearTimeout(state.hoverTimer);
    const td = e.currentTarget;
    state.hoverTimer = setTimeout(() => {
      showTooltipForCell(td, e.clientX, e.clientY);
    }, 120);
  }

  function onCellMove(e) {
    ensureTooltipEl();
    if (el.tooltip.classList.contains('hidden')) return;
    placeTooltip(e.clientX, e.clientY);
  }

  function onCellLeave() {
    hideTooltip();
  }

  /* =========================================================
   * Help (순서도)
   * ========================================================= */
  function renderHelpFlowchart() {
    el.helpFlowHost.innerHTML = `
      <div class="flowchart-track">
        ${STEPS.map((s, idx) => `
          <div class="fc-row">
            <div class="fc-left">
              <div class="fc-badge">${s.no}</div>
              ${idx < STEPS.length - 1 ? `<div class="fc-line"></div>` : ``}
            </div>
            <div class="fc-card">
              <div class="fc-title">${escapeHtml(s.name)}</div>
              <div class="fc-desc">${escapeHtml(s.desc || '')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const groups = new Map();
    for (const it of PREREQS) {
      const k = Number(it.beforeStepNo || 0);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(it);
    }

    const sortedKeys = Array.from(groups.keys()).sort((a,b)=>a-b);
    el.helpPrereqHost.innerHTML = `
      ${sortedKeys.map(stepNo => {
        const stepName = STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`;
        const items = groups.get(stepNo) || [];
        return `
          <div class="prgrp">
            <div class="prgrp-head">
              <div class="prgrp-title">Before ${escapeHtml(stepName)}</div>
            </div>
            <div class="prgrp-body">
              ${items.map(it => `
                <div class="prpill ${it.required ? 'req' : 'opt'}">
                  <div class="prpill-top">
                    <span class="prpill-name">${escapeHtml(it.title)}</span>
                    <span class="prpill-tag">${it.required ? '필수' : '옵션'}</span>
                  </div>
                  <div class="prpill-desc">${escapeHtml(it.desc)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  /* =========================================================
   * Board
   * ========================================================= */
  async function loadBoard() {
    const q = buildQuery({
      equipment_type: el.fEqType?.value,
      site: el.fSite?.value,
      line: el.fLine?.value,
      status: el.fStatus?.value,
      q: el.fQ?.value?.trim?.() || '',
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

      if (el.statCount) el.statCount.textContent = `설비 ${state.list.length}대`;
    } catch (e) {
      if (el.tableHost) {
        el.tableHost.innerHTML = `<div style="padding:16px;color:#b91c1c;">보드 로드 실패: ${escapeHtml(e.message)}</div>`;
      }
      toast(`보드 로드 실패: ${e.message}`);
    }
  }

  async function prefetchDetailsForBoard() {
    const ids = state.list.slice(0, 80).map(p => String(p.setup_id));
    for (const id of ids) {
      if (!state.detailCache.has(id)) {
        try { await ensureDetail(id); } catch {}
      }
    }
    renderTable();
  }

  function renderTable() {
    hideTooltip();
    const list = state.list;
    if (!el.tableHost) return;

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

    // 설비 클릭 -> 모달
    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(a => {
      a.addEventListener('click', () => {
        const setupId = a.getAttribute('data-setup-id');
        if (setupId) openEditModal(setupId);
      });
    });

    // 셀 클릭/hover
    const tds = el.tableHost.querySelectorAll('[data-cell="1"]');
    tds.forEach(td => {
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

    // 이벤트 위임(보험)
    el.tableHost.addEventListener('mouseover', (e) => {
      const td = e.target?.closest?.('[data-cell="1"]');
      if (!td) return;
      onCellEnter({ currentTarget: td, clientX: e.clientX, clientY: e.clientY });
    });
    el.tableHost.addEventListener('mousemove', (e) => {
      const td = e.target?.closest?.('[data-cell="1"]');
      if (!td) return;
      onCellMove(e);
    });
    el.tableHost.addEventListener('mouseout', (e) => {
      const td = e.target?.closest?.('[data-cell="1"]');
      if (!td) return;
      onCellLeave();
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
    const data = json?.data || json;
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

  /* =========================================================
   * Modal + Tabs
   * ========================================================= */
  function openModalShell() {
    if (el.modal) {
      el.modal.classList.remove('hidden');
      el.modal.setAttribute('aria-hidden','false');
    }
  }

  function closeModal() {
    if (el.modal) {
      el.modal.classList.add('hidden');
      el.modal.setAttribute('aria-hidden','true');
    }
    state.selectedSetupId = null;
    state.createMode = false;
    state.equipmentLogs = [];

    if (el.btnSaveProject) el.btnSaveProject.textContent = 'SAVE';
    setTab('steps');
    hideTooltip();
  }

  function setTab(mode) {
    const isSteps = mode === 'steps';
    const isPrereq = mode === 'prereq';
    const isLogs = mode === 'logs';

    el.tabSteps?.classList?.toggle('active', isSteps);
    el.tabPrereq?.classList?.toggle('active', isPrereq);
    el.tabLogs?.classList?.toggle('active', isLogs);

    el.viewSteps?.classList?.toggle('hidden', !isSteps);
    el.viewPrereq?.classList?.toggle('hidden', !isPrereq);
    el.viewLogs?.classList?.toggle('hidden', !isLogs);
  }

  function openCreateModal() {
    state.createMode = true;
    state.selectedSetupId = null;
    openModalShell();
    setTab('steps');

    if (el.mTitle) el.mTitle.textContent = '신규 설비 추가';
    if (el.mMeta) el.mMeta.textContent = '필수: 설비명, Site, Line';

    if (el.p_equipment_name) el.p_equipment_name.value = '';
    if (el.p_equipment_type) el.p_equipment_type.value = '';
    if (el.p_site) el.p_site.value = '';
    if (el.p_line) el.p_line.value = '';
    if (el.p_location) el.p_location.value = '';
    if (el.p_board_status) el.p_board_status.value = 'PLANNED';
    if (el.p_last_note) el.p_last_note.value = '';
    if (el.p_start_date_auto) el.p_start_date_auto.value = '';

    if (el.stepsHost) el.stepsHost.innerHTML = `<div class="muted small">설비 생성 후 STEP이 자동 생성됩니다.</div>`;
    if (el.prereqHost) el.prereqHost.innerHTML = `<div class="muted small">설비 생성 후 선행조건 체크가 가능합니다.</div>`;
    if (el.logsHost) el.logsHost.innerHTML = `<div class="muted small" style="padding:12px;">설비 생성 후 작업이력을 볼 수 있습니다.</div>`;

    if (el.prBadge) el.prBadge.textContent = `0/0`;
    if (el.logBadge) el.logBadge.textContent = `0`;

    fillLogStepSelect();

    if (el.btnSaveProject) el.btnSaveProject.textContent = 'CREATE';
    if (el.projSaveHint) el.projSaveHint.textContent = '';
  }

  function openEditModal(setupId) {
    state.createMode = false;
    if (el.btnSaveProject) el.btnSaveProject.textContent = 'SAVE';
    openModal(setupId);
  }

  async function openModal(setupId) {
    state.selectedSetupId = String(setupId);
    openModalShell();
    setTab('steps');

    if (el.mTitle) el.mTitle.textContent = '로딩 중...';
    if (el.mMeta) el.mMeta.textContent = '';
    if (el.stepsHost) el.stepsHost.innerHTML = '';
    if (el.prereqHost) el.prereqHost.innerHTML = '';
    if (el.logsHost) el.logsHost.innerHTML = '';
    if (el.prBadge) el.prBadge.textContent = `0/0`;
    if (el.logBadge) el.logBadge.textContent = `0`;
    if (el.projSaveHint) el.projSaveHint.textContent = '';

    fillLogStepSelect();

    try {
      const data = await ensureDetail(String(setupId));
      renderModal(data);

      // prereq
      const prMap = await fetchPrereqs(String(setupId));
      renderPrereqs(String(setupId), prMap);

      // logs (미리 로딩해두기)
      await loadEquipmentLogsForModal();
      renderLogsUI();
    } catch (e) {
      if (el.mTitle) el.mTitle.textContent = '상세 로드 실패';
      if (el.mMeta) el.mMeta.textContent = e.message;
      toast(`상세 로드 실패: ${e.message}`);
    }
  }

  function renderModal(data) {
    const p = data?.project || {};
    const steps = data?.steps || [];

    if (el.mTitle) el.mTitle.textContent = p.equipment_name || `SETUP #${p.id || ''}`;
    if (el.mMeta) {
      el.mMeta.textContent = [
        p.equipment_type || '-',
        p.site || '-',
        p.line || '-',
        p.location ? `@${p.location}` : ''
      ].filter(Boolean).join(' · ');
    }

    if (el.p_equipment_name) el.p_equipment_name.value = p.equipment_name || '';
    if (el.p_equipment_type) el.p_equipment_type.value = p.equipment_type || '';
    if (el.p_site) el.p_site.value = p.site || '';
    if (el.p_line) el.p_line.value = p.line || '';
    if (el.p_location) el.p_location.value = p.location || '';
    if (el.p_board_status) el.p_board_status.value = (p.board_status || 'PLANNED').toUpperCase();
    if (el.p_last_note) el.p_last_note.value = p.last_note || '';
    if (el.p_start_date_auto) el.p_start_date_auto.value = computeAutoStartDate(data) || '';

    const byNo = new Map();
    for (const s of steps) byNo.set(Number(s.step_no), s);

    if (!el.stepsHost) return;

    el.stepsHost.innerHTML = STEPS.map(t => {
      const s = byNo.get(t.no) || {};
      const st = (s.status || 'NOT_STARTED').toUpperCase();
      const desc = firstNonEmpty(s.step_description, t.desc, '');

      const planEnd = fmtDateISO(s.plan_end);
      const actualStart = fmtDateISO(s.actual_start);
      const actualEnd = fmtDateISO(s.actual_end);

      const workersVal = firstNonEmpty(s.workers, s.worker, s.worker_names, '');
      const noteVal = firstNonEmpty(s.note, s.memo, s.remark, '');

      return `
        <div class="step-card" data-step-card="1" data-step-no="${t.no}">
          <div class="step-top">
            <div>
              <div class="step-card-title">${escapeHtml(t.no)}. ${escapeHtml(t.name)}</div>
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
              <input type="text" data-field="workers" value="${escapeHtml(workersVal)}" placeholder="정현우,김동한"/>
            </div>

            <div class="field wide note-wide">
              <label>Note</label>
              <input type="text" data-field="note" value="${escapeHtml(noteVal)}" placeholder="특이사항"/>
            </div>
          </div>

          <div class="step-actions">
            <span class="muted small" data-hint="1"></span>
            <button class="btn primary" data-save-step="1" type="button">SAVE</button>
            <button class="btn" data-open-logs="1" type="button" title="이 Step 관련 작업이력 보기">관련 이력</button>
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
      const btnLogs = card.querySelector('[data-open-logs="1"]');

      selStatus?.addEventListener('change', () => {
        const st = selStatus.value;
        pill.classList.remove('ns','pl','ip','dn','hd');
        pill.classList.add(statusToClass(st));
        pill.textContent = statusShort(st);
      });

      btn?.addEventListener('click', async () => {
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
          if (hint) hint.textContent = 'saving...';
          await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
            method: 'PATCH',
            body: patch
          });

          state.detailCache.delete(setupId);
          await ensureDetail(setupId);

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

          if (hint) hint.textContent = 'saved ✅';
          await loadBoard();
          toast(`${STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`} 저장 완료`);
          setTimeout(() => { if (hint) hint.textContent = ''; }, 1500);

          // logs 최신화(저장 후 바로 반영되게)
          try { await loadEquipmentLogsForModal(); renderLogsUI(); } catch {}
        } catch (e) {
          if (hint) hint.textContent = `fail: ${e.message}`;
          toast(`STEP 저장 실패: ${e.message}`);
        }
      });

      // ✅ step에서 바로 “관련 이력” 보기 -> 작업이력 탭으로 이동 + step 필터 자동
      btnLogs?.addEventListener('click', async () => {
        setTab('logs');
        if (el.logStep) el.logStep.value = String(stepNo);
        try {
          await loadEquipmentLogsForModal();
          renderLogsUI();
        } catch (e) {
          toast(`작업이력 로드 실패: ${e.message}`);
        }
      });
    });
  }

  async function saveProject() {
    const isCreate = state.createMode === true;
    const setupId = state.selectedSetupId;

    const payloadBase = {
      equipment_name: el.p_equipment_name?.value?.trim?.() || '',
      equipment_type: el.p_equipment_type?.value?.trim?.() || null,
      site: el.p_site?.value?.trim?.() || '',
      line: el.p_line?.value?.trim?.() || '',
      location: el.p_location?.value?.trim?.() || null,
      last_note: el.p_last_note?.value?.trim?.() || null
    };

    if (!payloadBase.equipment_name) return toast('설비명은 필수입니다.');
    if (!payloadBase.site) return toast('Site는 필수입니다.');
    if (!payloadBase.line) return toast('Line은 필수입니다.');

    try {
      if (el.projSaveHint) el.projSaveHint.textContent = 'saving...';

      if (isCreate) {
        const json = await apiFetch(`/api/setup-projects`, { method: 'POST', body: payloadBase });
        const newId = json?.setup_id || json?.setupId || json?.id;

        if (el.projSaveHint) el.projSaveHint.textContent = 'created ✅';
        toast('설비가 생성되었습니다.');

        await loadBoard();

        if (newId) {
          state.createMode = false;
          if (el.btnSaveProject) el.btnSaveProject.textContent = 'SAVE';
          await openModal(String(newId));
        } else {
          closeModal();
        }
        return;
      }

      if (!setupId) return toast('setupId가 없습니다.');

      const patch = { ...payloadBase, board_status: el.p_board_status?.value };

      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`, {
        method: 'PATCH',
        body: patch
      });

      state.detailCache.delete(setupId);
      const data = await ensureDetail(setupId);
      renderModal(data);

      await loadBoard();

      if (el.projSaveHint) el.projSaveHint.textContent = 'saved ✅';
      toast('Project 저장 완료');
      setTimeout(() => { if (el.projSaveHint) el.projSaveHint.textContent = ''; }, 1500);

      // logs도 다시 로드(설비명 변경했을 수 있음)
      try { await loadEquipmentLogsForModal(); renderLogsUI(); } catch {}
    } catch (e) {
      if (el.projSaveHint) el.projSaveHint.textContent = `fail: ${e.message}`;
      toast(`Project 저장 실패: ${e.message}`);
    }
  }

  /* =========================================================
   * Prereq (DB ONLY)
   * ========================================================= */
  function normalizePrereqResponse(json) {
    const data = json?.data;

    if (data && typeof data === 'object' && !Array.isArray(data)) return data;

    if (Array.isArray(data)) {
      const map = {};
      for (const r of data) {
        const k = r?.prereq_key || r?.code || r?.key;
        if (k) map[k] = r;
      }
      return map;
    }

    if (json && typeof json === 'object' && json.updated && typeof json.updated === 'object') {
      return json.updated;
    }
    return {};
  }

  async function fetchPrereqs(setupId) {
    if (state.prereqCache.has(setupId)) return state.prereqCache.get(setupId);

    const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/prereqs`);
    const map = normalizePrereqResponse(json);

    state.prereqCache.set(setupId, map);
    return map;
  }

  function isPrereqDone(row) {
    if (!row) return false;
    if (row.is_done === 1 || row.is_done === '1' || row.is_done === true) return true;
    if (row.done === 1 || row.done === '1' || row.done === true) return true;
    return false;
  }

  function getPrereqDoneDate(row) {
    const d = row?.done_at || row?.done_date || row?.doneAt || null;
    return d ? fmtYYMMDD(d) : '';
  }

  function calcPrereqProgress(prMap) {
    const total = PREREQS.length;
    let done = 0;
    for (const it of PREREQS) {
      const row = prMap?.[it.code];
      if (isPrereqDone(row)) done++;
    }
    return { total, done };
  }

  function normalizePrereqRowForCache(code, anyRow, doneBool) {
    const isDone = (typeof doneBool === 'boolean') ? doneBool : isPrereqDone(anyRow);
    const doneDate = anyRow?.done_at || anyRow?.done_date || anyRow?.doneAt || null;

    return {
      ...(anyRow || {}),
      done: isDone,
      done_date: doneDate,
      is_done: isDone ? 1 : 0,
      done_at: doneDate,
      prereq_key: anyRow?.prereq_key || code
    };
  }

  async function savePrereq(setupId, code, done) {
    const payload = { is_done: !!done };

    const json = await apiFetch(
      `/api/setup-projects/${encodeURIComponent(setupId)}/prereqs/${encodeURIComponent(code)}`,
      { method: 'PATCH', body: payload }
    );

    const rawRow = json?.data || json?.updated || json || null;

    const cur = state.prereqCache.get(setupId) || {};
    const merged = normalizePrereqRowForCache(code, rawRow || cur[code], !!done);

    const next = { ...cur, [code]: merged };
    state.prereqCache.set(setupId, next);
    return next;
  }

  function renderPrereqs(setupId, prMap) {
    const prog = calcPrereqProgress(prMap);
    if (el.prBadge) el.prBadge.textContent = `${prog.done}/${prog.total}`;
    if (!el.prereqHost) return;

    el.prereqHost.innerHTML = PREREQS.map(it => {
      const row = prMap?.[it.code] || {};
      const done = isPrereqDone(row);
      const doneDate = getPrereqDoneDate(row);

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
            <button class="btn" data-pr-save="1" type="button">저장</button>
          </div>
        </div>
      `;
    }).join('');

    el.prereqHost.querySelectorAll('[data-pr-item="1"]').forEach(card => {
      const code = card.getAttribute('data-code');
      const chk = card.querySelector('[data-pr-field="done"]');
      const btn = card.querySelector('[data-pr-save="1"]');

      btn?.addEventListener('click', async () => {
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

  /* =========================================================
   * Work Logs (설비명 매칭 + Step 키워드 매칭)
   * ========================================================= */
  function normText(s){
    return String(s ?? '')
      .toUpperCase()
      .replaceAll(/\s+/g,' ')
      .trim();
  }

  function eqNameMatch(logEqName, targetEqName){
    const a = normText(logEqName);
    const b = normText(targetEqName);
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    return false;
  }

  function logHaystack(log){
    return normText([
      log.task_description,
      log.task_name,
      log.setup_item,
      log.transfer_item,
      log.work_type,
      log.work_type2,
      log.task_cause,
      log.task_result,
      log.status,
      log.SOP,
      log.tsguide
    ].filter(Boolean).join(' | '));
  }

  async function fetchAllWorkLogs({ force=false } = {}){
    const now = Date.now();
    const TTL = 1000 * 60 * 3; // 3분 캐시
    if (!force && state.workLogsCache && (now - state.workLogsFetchedAt) < TTL) {
      return state.workLogsCache;
    }

    const res = await fetch(WORKLOG_API_URL);
    if (!res.ok) throw new Error('작업 이력을 가져오지 못했습니다.');
    const workLogs = await res.json();

    state.workLogsCache = Array.isArray(workLogs) ? workLogs : [];
    state.workLogsFetchedAt = now;
    return state.workLogsCache;
  }

  function fillLogStepSelect(){
    if (!el.logStep) return;
    el.logStep.innerHTML = `
      <option value="">ALL</option>
      ${STEPS.map(s => `<option value="${s.no}">${s.no}. ${escapeHtml(s.name)}</option>`).join('')}
    `;
  }

  async function loadEquipmentLogsForModal({ force=false } = {}){
    const setupId = state.selectedSetupId;
    if (!setupId) return [];

    const detail = await ensureDetail(setupId);
    const eqName = detail?.project?.equipment_name || '';

    const all = await fetchAllWorkLogs({ force });
    const matched = all.filter(l => eqNameMatch(l.equipment_name, eqName));

    matched.sort((a,b) => String(b.task_date||'').localeCompare(String(a.task_date||'')));

    state.equipmentLogs = matched;
    return matched;
  }

  function filterLogs(logs, stepNo, q){
    let out = logs.slice();

    const query = normText(q);
    if (stepNo) {
      const kws = (STEP_KEYWORDS[Number(stepNo)] || []).map(normText).filter(Boolean);
      if (kws.length) {
        out = out.filter(l => {
          const hay = logHaystack(l);
          return kws.some(kw => hay.includes(kw));
        });
      }
    }

    if (query) {
      out = out.filter(l => {
        const hay = normText([
          l.task_man, l.group, l.site, l.line, l.equipment_type,
          l.equipment_name, logHaystack(l)
        ].filter(Boolean).join(' | '));
        return hay.includes(query);
      });
    }

    return out;
  }

  function renderLogsUI(){
    if (!el.logsHost) return;

    const stepNo = el.logStep?.value ? Number(el.logStep.value) : null;
    const q = el.logQ?.value || '';
    const limit = Number(el.logLimit?.value || 100);

    const base = state.equipmentLogs || [];
    const filtered = filterLogs(base, stepNo, q).slice(0, limit);

    if (el.logBadge) el.logBadge.textContent = String(filtered.length);

    if (!filtered.length) {
      el.logsHost.innerHTML = `<div style="padding:16px;color:#6b7280;">매칭되는 작업 이력이 없습니다.</div>`;
      return;
    }

    const rows = filtered.map(l => {
      const date = (l.task_date ? String(l.task_date).split('T')[0] : '');
      const man = escapeHtml(l.task_man || '');
      const tname = escapeHtml(l.task_name || '');
      const mins = escapeHtml(String(l.task_duration || ''));
      const eqt = escapeHtml(l.equipment_type || '');
      const site = escapeHtml(l.site || '');
      const line = escapeHtml(l.line || '');
      const desc = escapeHtml(l.task_description || '');

      const id = escapeHtml(String(l.id));

      return `
        <tr>
          <td style="min-width:96px;">${escapeHtml(date)}</td>
          <td style="min-width:110px;">${man}</td>
          <td style="min-width:140px;"><b>${tname}</b></td>
          <td style="min-width:130px;">${eqt} · ${site} · ${line}</td>
          <td style="min-width:80px;text-align:right;">${mins}</td>
          <td style="min-width:280px;">
            <span class="log-more" data-log-more="1" data-id="${id}">내용 보기</span>
            <div class="log-desc" data-log-desc="1" data-id="${id}">${desc || '-'}</div>
          </td>
        </tr>
      `;
    }).join('');

    el.logsHost.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>DATE</th>
            <th>WORKER</th>
            <th>TASK</th>
            <th>EQ</th>
            <th>TIME</th>
            <th>DESCRIPTION</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    el.logsHost.querySelectorAll('[data-log-more="1"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const box = el.logsHost.querySelector(`[data-log-desc="1"][data-id="${CSS.escape(id)}"]`);
        if (!box) return;
        box.classList.toggle('open');
        btn.textContent = box.classList.contains('open') ? '내용 닫기' : '내용 보기';
      });
    });
  }

  /* =========================================================
   * Help modal
   * ========================================================= */
  function openHelp() {
    renderHelpFlowchart();
    el.helpModal?.classList?.remove('hidden');
    el.helpModal?.setAttribute('aria-hidden','false');
  }
  function closeHelp() {
    el.helpModal?.classList?.add('hidden');
    el.helpModal?.setAttribute('aria-hidden','true');
  }

  /* =========================================================
   * Events
   * ========================================================= */
  function bindEvents() {
    ensureTooltipEl();
    hideTooltip();

    el.btnNew?.addEventListener('click', openCreateModal);
    el.btnApply?.addEventListener('click', loadBoard);

    el.fQ?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadBoard();
    });

    el.btnClose?.addEventListener('click', closeModal);

    el.modal?.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-close');
      if (close === '1') closeModal();
    });

    el.tabSteps?.addEventListener('click', () => setTab('steps'));

    el.tabPrereq?.addEventListener('click', async () => {
      setTab('prereq');
      const setupId = state.selectedSetupId;
      if (!setupId) return;

      try {
        const prMap = await fetchPrereqs(setupId);
        renderPrereqs(setupId, prMap);
      } catch (e) {
        if (el.prereqHost) {
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
        }
        toast(`선행조건 로드 실패: ${e.message}`);
      }
    });

    el.tabLogs?.addEventListener('click', async () => {
      setTab('logs');
      fillLogStepSelect();
      try {
        await loadEquipmentLogsForModal();
        renderLogsUI();
      } catch (e) {
        toast(`작업이력 로드 실패: ${e.message}`);
      }
    });

    el.btnSaveProject?.addEventListener('click', saveProject);

    el.btnHelp?.addEventListener('click', openHelp);
    el.btnHelpClose?.addEventListener('click', closeHelp);
    el.helpModal?.addEventListener('click', (e) => {
      const close = e.target?.getAttribute?.('data-help-close');
      if (close === '1') closeHelp();
    });

    // logs filters
    el.logQ?.addEventListener('input', () => renderLogsUI());
    el.logStep?.addEventListener('change', () => renderLogsUI());
    el.logLimit?.addEventListener('change', () => renderLogsUI());

    el.btnReloadLogs?.addEventListener('click', async () => {
      try {
        await loadEquipmentLogsForModal({ force:true });
        renderLogsUI();
        toast('작업이력 새로고침 완료');
      } catch (e) {
        toast(`새로고침 실패: ${e.message}`);
      }
    });

    // tooltip 안정성
    window.addEventListener('scroll', () => hideTooltip(), { passive: true });
    window.addEventListener('resize', () => hideTooltip(), { passive: true });
    document.addEventListener('visibilitychange', () => hideTooltip());
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    if (!getToken()) toast('로그인이 필요합니다. (x-access-token 없음)');
    await loadBoard();
  });

})();
