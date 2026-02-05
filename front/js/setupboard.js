(() => {
  'use strict';

  /* =========================
   * Steps (우리 작업)
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

  /* =========================
   * 타업체 선행조건(체크만)
   * - code는 DB/API key로 쓰기 좋게 영문
   * - requiredBefore: 어떤 step 전에 필요인지 표시용
   * ========================= */
  const PREREQS = [
    {
      code: 'AGV_INSTALL',
      title: 'AGV 설치',
      required: false,
      requiredBefore: 'SILICON',
      desc: 'SILICON 작업 전 설치되어야 하나, 꼭 필수는 아님.'
    },
    {
      code: 'LP_SETUP',
      title: 'LP SET UP',
      required: true,
      requiredBefore: 'TEACHING',
      desc: 'TEACHING 전 필수사항'
    },
    {
      code: 'OHT_CERT',
      title: 'OHT 가동 인증',
      required: true,
      requiredBefore: 'TEACHING',
      desc: 'TEACHING 전 필수사항'
    },
    {
      code: 'TRAY_INSTALL',
      title: 'Tray 설치',
      required: true,
      requiredBefore: 'CABLE H/U',
      desc: 'CABLE HOOK UP 전 필수사항'
    },
    {
      code: 'THREE_PHASE',
      title: '3상 설치',
      required: true,
      requiredBefore: 'POWER T/O',
      desc: 'POWER TURN ON 전 필수사항'
    },
    {
      code: 'PCW_PRESSURE_PASS',
      title: 'PCW LINE 가압 PASS',
      required: true,
      requiredBefore: 'UTILITY T/O',
      desc: 'UTILITY TURN ON 전 필수사항'
    },
    {
      code: 'GAS_PRESSURE_PASS',
      title: 'GAS LINE 가압 PASS',
      required: true,
      requiredBefore: 'GAS T/O',
      desc: 'GAS TURN ON 전 필수사항'
    },
    {
      code: 'RF_CAL',
      title: 'RF CAL',
      required: true,
      requiredBefore: '중간 인증',
      desc: '중간 인증 전 필수사항'
    },
    {
      code: 'ENV_QUAL',
      title: '환경 QUAL',
      required: true,
      requiredBefore: '중간 인증',
      desc: '중간 인증 전 필수사항'
    },
    {
      code: 'MFC_CERT',
      title: 'MFC 인증',
      required: true,
      requiredBefore: '중간 인증',
      desc: '중간 인증 전 필수사항'
    },
    {
      code: 'SEISMIC_BKT',
      title: '지진방지 BKT 체결',
      required: true,
      requiredBefore: '중간 인증',
      desc: '중간 인증 전 필수사항'
    }
  ];

  const STATUS_ORDER = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'HOLD'];

  const $ = (sel, root=document) => root.querySelector(sel);

  const el = {
    btnNew: $('#btnNew'),
    btnApply: $('#btnApply'),
    tableHost: $('#tableHost'),
    statCount: $('#statCount'),

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
    p_last_note: $('#p_last_note'),
    btnSaveProject: $('#btnSaveProject'),
    projSaveHint: $('#projSaveHint'),

    // modal progress
    mpSub: $('#mpSub'),
    mpFill: $('#mpFill'),
    mpPct: $('#mpPct'),

    prereqHost: $('#prereqHost'),
    prBadge: $('#prBadge'),

    stepsHost: $('#stepsHost'),

    toast: $('#toast')
  };

  const state = {
    list: [],
    detailCache: new Map(),      // setupId -> {project, steps, issues}
    prereqCache: new Map(),      // setupId -> { [code]: {done:boolean, note:string, done_date?:string} }
    selectedSetupId: null,
    createMode: false
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

  // 26.02.05 포맷
  function fmtYYMMDD(d) {
    const iso = fmtDateISO(d);
    if (!iso) return '';
    const yy = iso.slice(2,4);
    const mm = iso.slice(5,7);
    const dd = iso.slice(8,10);
    return `${yy}.${mm}.${dd}`;
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

  function parseStepMap(p) {
    const raw = p?.step_status_map;
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function firstNonEmpty(...vals) {
    for (const v of vals) {
      if (v === null || typeof v === 'undefined') continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return '';
  }

  // ✅ 셀 아래 날짜 표시 규칙
  // DONE: actual_end 우선, 없으면 actual_start
  // PLANNED: plan_end
  // IN_PROGRESS: actual_start ~ actual_end(있으면) / 없으면 actual_start~
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
    if (st === 'HOLD') {
      return firstNonEmpty(as, planEnd, '');
    }
    return '';
  }

  // ✅ 모달 진행율: steps 기준 done/total
  function calcStepProgress(steps) {
    const total = steps?.length ? steps.length : STEPS.length;
    const done = (steps || []).filter(s => String(s.status||'').toUpperCase()==='DONE').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }

  async function loadBoard() {
    const q = buildQuery({
      // 백엔드가 equipment_type을 받도록 수정되어 있어야 함
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

      // ✅ 진행율 낮은 설비부터 정렬 (보드에는 진행율 UI는 안 보여도, 정렬은 필요)
      list.sort((a, b) => {
        const ta = Number(a.done_steps || 0) / Math.max(Number(a.total_steps || STEPS.length || 1), 1);
        const tb = Number(b.done_steps || 0) / Math.max(Number(b.total_steps || STEPS.length || 1), 1);
        if (ta !== tb) return ta - tb;
        return String(a.updated_at||'').localeCompare(String(b.updated_at||''));
      });

      state.list = list;
      renderTable();

      el.statCount.textContent = `설비 ${state.list.length}대`;
    } catch (e) {
      el.tableHost.innerHTML = `<div style="padding:16px;color:#b91c1c;">보드 로드 실패: ${escapeHtml(e.message)}</div>`;
      toast(`보드 로드 실패: ${e.message}`);
    }
  }

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

    // ✅ 설비명 클릭 -> 상세 모달
    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(td => {
      td.addEventListener('click', () => {
        const setupId = td.getAttribute('data-setup-id');
        if (setupId) openEditModal(setupId);
      });
    });

    // ✅ 셀 클릭 토글 제거 (아예 이벤트 바인딩 안함)
  }

  function renderRow(p) {
    const name = escapeHtml(p.equipment_name || '(no name)');
    const sub = escapeHtml([p.equipment_type || '-', p.site || '-', p.line || '-'].join(' · '));
    const issues = Number(p.open_issues || 0) > 0 ? `<span class="issueMark" title="OPEN ISSUE">!</span>` : '';

    const stepMap = parseStepMap(p);

    const cells = STEPS.map(s => {
      const st = String(stepMap[String(s.no)] || 'NOT_STARTED').toUpperCase();
      const cls = statusToClass(st);
      const short = statusShort(st);

      // ✅ 보드에서는 날짜를 “모달 열어서 캐시 생기기 전까지” 비워두는 게 안전
      //    (실시간 detail fetch/hover는 실수/부하 증가 가능)
      const dateLabel = '';

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
            <div class="eq-name">${name} ${issues}</div>
          </div>
          <div class="eq-sub">${sub}</div>
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

  // ✅ Start Date Auto: STEP1 Actual Start 우선 → 없으면 Plan End → 빈값
  function computeAutoStartDate(detail) {
    const p = detail?.project || {};
    const steps = detail?.steps || [];
    if (p.start_date) return fmtYYMMDD(p.start_date);

    const s1 = steps.find(x => Number(x.step_no) === 1) || {};
    return firstNonEmpty(fmtYYMMDD(s1.actual_start), fmtYYMMDD(s1.plan_end), '');
  }

  /* =========================
   * Prereq storage (API + fallback)
   * ========================= */
  function prereqLocalKey(setupId) {
    return `setup_prereq:${String(setupId)}`;
  }

  function loadPrereqLocal(setupId) {
    try {
      const raw = localStorage.getItem(prereqLocalKey(setupId));
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : {};
    } catch {
      return {};
    }
  }

  function savePrereqLocal(setupId, data) {
    try {
      localStorage.setItem(prereqLocalKey(setupId), JSON.stringify(data || {}));
    } catch {}
  }

  async function fetchPrereqs(setupId) {
    // 1) 캐시
    if (state.prereqCache.has(setupId)) return state.prereqCache.get(setupId);

    // 2) API 시도 (있으면)
    try {
      // ✅ 너가 백엔드 만들면 여기서 실제 데이터 받게 하면 됨
      // expected: { ok:true, data: { [code]: { done:0|1, note:'', done_date:'YYYY-MM-DD' } } }
      const json = await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/prereqs`);
      const data = json?.data && typeof json.data === 'object' ? json.data : {};
      state.prereqCache.set(setupId, data);
      return data;
    } catch {
      // 3) fallback localStorage
      const local = loadPrereqLocal(setupId);
      state.prereqCache.set(setupId, local);
      return local;
    }
  }

  async function updatePrereq(setupId, code, patch) {
    // patch: {done:boolean, note?:string}
    const cur = state.prereqCache.get(setupId) || {};
    const next = { ...cur };

    const prevRow = next[code] && typeof next[code] === 'object' ? next[code] : {};
    const merged = {
      ...prevRow,
      ...patch
    };

    // done이면 done_date 자동(원하면 지울 수도 있음)
    if (typeof merged.done === 'boolean') {
      if (merged.done) {
        merged.done_date = merged.done_date || fmtDateISO(new Date().toISOString());
      } else {
        merged.done_date = null;
      }
    }

    next[code] = merged;
    state.prereqCache.set(setupId, next);

    // API 시도
    try {
      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/prereqs/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        body: merged
      });
      return { ok: true, via: 'api' };
    } catch {
      // fallback 저장
      savePrereqLocal(setupId, next);
      return { ok: true, via: 'local' };
    }
  }

  function calcPrereqProgress(prMap) {
    const total = PREREQS.length;
    let done = 0;
    for (const it of PREREQS) {
      const row = prMap?.[it.code];
      if (row?.done === true || row?.done === 1 || row?.done === '1') done++;
    }
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function renderPrereqs(setupId, prMap) {
    const prog = calcPrereqProgress(prMap);
    el.prBadge.textContent = `${prog.done}/${prog.total}`;

    el.prereqHost.innerHTML = PREREQS.map(it => {
      const row = prMap?.[it.code] || {};
      const done = row?.done === true || row?.done === 1 || row?.done === '1';
      const note = row?.note || '';
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
            <input class="pr-note" type="text" data-pr-field="note" value="${escapeHtml(note)}" placeholder="메모(선택)"/>
            <button class="btn" data-pr-save="1">저장</button>
          </div>
        </div>
      `;
    }).join('');

    // bind
    el.prereqHost.querySelectorAll('[data-pr-item="1"]').forEach(card => {
      const code = card.getAttribute('data-code');
      const chk = card.querySelector('[data-pr-field="done"]');
      const inp = card.querySelector('[data-pr-field="note"]');
      const btn = card.querySelector('[data-pr-save="1"]');

      // 실수 방지: 체크만 바뀌어도 자동 저장 X (버튼 저장)
      // 대신 체크 변경 시 버튼 강조 느낌만 주고 싶으면 가능하지만 지금은 단순하게 유지
      btn.addEventListener('click', async () => {
        if (!setupId || !code) return;
        const done = !!chk.checked;
        const note = String(inp.value || '').trim();

        try {
          btn.disabled = true;
          btn.textContent = '저장중...';
          const r = await updatePrereq(setupId, code, { done, note });
          const latest = state.prereqCache.get(setupId) || {};
          renderPrereqs(setupId, latest);
          toast(r.via === 'api' ? '선행조건 저장 완료' : '선행조건 저장 완료(로컬)');
        } finally {
          // renderPrereqs에서 버튼이 다시 그려져서 여기서 복구할 필요 없음
        }
      });
    });
  }

  /* =========================
   * Modal
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
    el.p_last_note.value = '';
    el.p_start_date_auto.value = '';

    // 진행율 초기화
    el.mpSub.textContent = '-';
    el.mpFill.style.width = '0%';
    el.mpPct.textContent = '0%';

    // 신규 생성 시: prereq/steps는 보여주지 않음(저장 후 자동 생성/조회)
    el.prereqHost.innerHTML = `<div class="muted small">설비 생성 후 선행조건 체크가 가능합니다.</div>`;
    el.prBadge.textContent = `0/0`;
    el.stepsHost.innerHTML = `<div class="muted small">설비 생성 후 STEP이 자동 생성됩니다.</div>`;

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
    el.prereqHost.innerHTML = '';
    el.projSaveHint.textContent = '';
    el.prBadge.textContent = '0/0';

    try {
      const data = await ensureDetail(String(setupId));
      renderModal(data);

      // ✅ prereq 로드 + 렌더
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

    // ✅ 모달 진행율 표시
    const prog = calcStepProgress(steps);
    el.mpSub.textContent = `DONE ${prog.done} / TOTAL ${prog.total}`;
    el.mpFill.style.width = `${prog.pct}%`;
    el.mpPct.textContent = `${prog.pct}%`;

    // ✅ 보드 셀에 날짜를 굳이 채우고 싶으면, 모달 열 때 해당 설비 행만 날짜 업데이트 가능
    // (원하면 유지, 싫으면 아래 블럭 삭제)
    updateBoardRowDatesFromDetail(String(p.id || p.setup_id || state.selectedSetupId), data);

    // steps render
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

    // bind step events
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

          // cache update
          const cached = state.detailCache.get(setupId);
          if (cached && Array.isArray(cached.steps)) {
            const row = cached.steps.find(x => Number(x.step_no) === stepNo);
            if (row) Object.assign(row, patch);
          }

          // STEP1 기준 자동 start_date 반영(원하면 유지)
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

          // 진행율 UI 업데이트
          const refreshed = await ensureDetail(setupId);
          const prog2 = calcStepProgress(refreshed?.steps || []);
          el.mpSub.textContent = `DONE ${prog2.done} / TOTAL ${prog2.total}`;
          el.mpFill.style.width = `${prog2.pct}%`;
          el.mpPct.textContent = `${prog2.pct}%`;
          el.p_start_date_auto.value = computeAutoStartDate(refreshed) || '';

          hint.textContent = 'saved ✅';

          // 보드 재정렬 반영
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

  function updateBoardRowDatesFromDetail(setupId, detail) {
    // 모달에서 저장/조회 후, 해당 설비 행의 날짜 라벨만 채워주는 용도
    const steps = detail?.steps || [];
    const tds = document.querySelectorAll(`[data-cell="1"][data-setup-id="${setupId}"]`);
    if (!tds.length) return;

    tds.forEach(td => {
      const no = Number(td.getAttribute('data-step-no'));
      const st = String(td.getAttribute('data-status') || 'NOT_STARTED').toUpperCase();
      const row = steps.find(x => Number(x.step_no) === no);
      const label = row ? buildStepDateLabel(row, st) : '';
      const dateEl = td.querySelector('.cellDate');
      if (dateEl) dateEl.textContent = label || '';
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
          // 생성 후 모달을 “상세 모드”로 전환
          state.detailCache.delete(String(newId));
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
      };

      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}`, {
        method: 'PATCH',
        body: patch
      });

      // 캐시 갱신
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

    el.btnSaveProject.addEventListener('click', saveProject);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    if (!getToken()) toast('로그인이 필요합니다. (x-access-token 없음)');
    await loadBoard();
  });

})();
