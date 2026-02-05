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

  // 상태 토글 순서
  const STATUS_ORDER = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'HOLD'];

  const $ = (sel, root=document) => root.querySelector(sel);

  const el = {
    btnNew: $('#btnNew'),
    btnApply: $('#btnApply'),
    tableHost: $('#tableHost'),
    statCount: $('#statCount'),
    statHint: $('#statHint'),

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

    prereqHost: $('#prereqHost'),
    prSummary: $('#prSummary'),

    stepsHost: $('#stepsHost'),

    tooltip: $('#tooltip'),
    toast: $('#toast')
  };

  const state = {
    list: [],
    detailCache: new Map(),     // setupId -> {project, steps, prereqs}
    rowMeta: new Map(),         // setupId -> computed meta for locks/prereqProgress
    selectedSetupId: null,
    createMode: false,
    hoverTimer: null,
    hoverKey: null,
    bgHydrateRunning: false
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

  // 26.02.05
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
    if (st === 'HOLD') return firstNonEmpty(as, planEnd, '');
    return '';
  }

  // Step 진행율: DONE 비율
  function calcProgressFromBoardRow(p) {
    const total = Number(p.total_steps || STEPS.length || 1);
    const done  = Number(p.done_steps || 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { pct, done, total };
  }

  // ===========================
  // ✅ Prereq 메타 계산 (락/진행률)
  // ===========================
  function computePrereqMeta(detail) {
    const prereqs = Array.isArray(detail?.prereqs) ? detail.prereqs : [];

    // active만
    const active = prereqs.filter(p => Number(p.is_active ?? 1) === 1);

    // 필수만(잠금 기준)
    const required = active.filter(p => Number(p.is_required ?? 1) === 1);

    const total = required.length;
    const done = required.filter(p => Number(p.is_done ?? 0) === 1).length;
    const pct = total ? Math.round((done / total) * 100) : 100;

    // step별 필요한 prereq 미완료 목록
    // 규칙: required_before_step_no <= stepNo 인 필수 조건이 done이 아니면 그 step은 잠김
    const missingByStepNo = new Map(); // stepNo -> [prereqName...]
    for (const step of STEPS) {
      const stepNo = step.no;
      const miss = required
        .filter(p => p.required_before_step_no !== null && p.required_before_step_no !== undefined)
        .filter(p => Number(p.required_before_step_no) <= stepNo)
        .filter(p => Number(p.is_done ?? 0) !== 1)
        .map(p => String(p.prereq_name || p.prereq_key || 'PREREQ'));

      missingByStepNo.set(stepNo, miss);
    }

    // 전체 미완료(필수)
    const missingRequiredNames = required
      .filter(p => Number(p.is_done ?? 0) !== 1)
      .map(p => String(p.prereq_name || p.prereq_key || 'PREREQ'));

    return {
      prRequiredTotal: total,
      prRequiredDone: done,
      prRequiredPct: pct,
      missingByStepNo,
      missingRequiredNames
    };
  }

  function isStepLocked(setupId, stepNo) {
    const meta = state.rowMeta.get(String(setupId));
    if (!meta) return false;
    const miss = meta.missingByStepNo.get(Number(stepNo)) || [];
    return miss.length > 0;
  }

  function missingTextForStep(setupId, stepNo) {
    const meta = state.rowMeta.get(String(setupId));
    if (!meta) return '';
    const miss = meta.missingByStepNo.get(Number(stepNo)) || [];
    if (!miss.length) return '';
    // 너무 길면 줄이기
    const head = miss.slice(0, 3).join(', ');
    const tail = miss.length > 3 ? ` 외 ${miss.length - 3}개` : '';
    return `${head}${tail}`;
  }

  // ===========================
  // Board Load / Render
  // ===========================
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

      // 진행율 낮은 설비부터 정렬
      list.sort((a, b) => {
        const pa = calcProgressFromBoardRow(a).pct;
        const pb = calcProgressFromBoardRow(b).pct;
        if (pa !== pb) return pa - pb;
        const ta = String(a.updated_at || '');
        const tb = String(b.updated_at || '');
        return ta.localeCompare(tb);
      });

      state.list = list;
      renderTable();

      el.statCount.textContent = `설비 ${state.list.length}대`;
      el.statHint.textContent = `· Prereq 잠금/진행률은 자동 로딩 후 반영됩니다.`;

      // ✅ 백그라운드로 detail을 일부 미리 불러서:
      // - Prereq 진행률/락 표시
      // - 날짜 라벨
      hydrateDetailsInBackground();

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

    // 설비명 클릭 -> 모달
    el.tableHost.querySelectorAll('[data-open-detail="1"]').forEach(a => {
      a.addEventListener('click', () => {
        const setupId = a.getAttribute('data-setup-id');
        if (setupId) openEditModal(setupId);
      });
    });

    // 셀 클릭 -> 상태 토글 PATCH
    el.tableHost.querySelectorAll('[data-cell="1"]').forEach(td => {
      td.addEventListener('click', async () => {
        const setupId = td.getAttribute('data-setup-id');
        const stepNo = Number(td.getAttribute('data-step-no'));
        if (!setupId || !stepNo) return;

        // ✅ 잠김이면 토스트 안내 후 종료
        if (isStepLocked(setupId, stepNo)) {
          const msg = missingTextForStep(setupId, stepNo);
          toast(`🔒 Prereq 미완료: ${msg}`);
          return;
        }

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
    const sub = escapeHtml([p.equipment_type || '-', p.site || '-', p.line || '-'].join(' · '));

    const stepMap = parseStepMap(p);

    // Step 진행율
    const prog = calcProgressFromBoardRow(p);

    // Prereq 진행율(상세 로드 전에는 unknown)
    const meta = state.rowMeta.get(String(p.setup_id)) || null;
    const prPct = meta ? meta.prRequiredPct : null;
    const prDone = meta ? meta.prRequiredDone : null;
    const prTot = meta ? meta.prRequiredTotal : null;

    const prText = (prPct === null) ? '—' : `${prPct}%`;
    const prSub  = (prPct === null) ? '' : `${prDone}/${prTot}`;

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

      const locked = isStepLocked(p.setup_id, s.no);
      const lockTitle = locked ? `Prereq 미완료: ${missingTextForStep(p.setup_id, s.no)}` : '';

      return `
        <td class="cell ${locked ? 'locked' : ''}"
            data-cell="1"
            data-setup-id="${p.setup_id}"
            data-step-no="${s.no}"
            data-status="${st}"
            title="${escapeHtml(lockTitle)}">
          <div class="pillWrap">
            <span class="pill ${cls}">${short}</span>
            <div class="cellDate">${escapeHtml(dateLabel)}</div>
          </div>
          ${locked ? `<div class="lockOverlay" aria-label="locked"><span class="lockEmoji">🔒</span></div>` : ``}
        </td>
      `;
    }).join('');

    return `
      <tr data-row="1" data-setup-id="${p.setup_id}">
        <td class="eq-col" data-open-detail="1" data-setup-id="${p.setup_id}">
          <div class="eq-top">
            <div class="eq-name">${name}</div>

            <div class="eq-progress">
              <!-- ✅ Dual progress: Step / Prereq -->
              <div class="dual">
                <div class="dualRow">
                  <span class="dualLabel">STEP</span>
                  <div class="progressBar" aria-label="step progress ${prog.pct}%">
                    <div class="progressFill" style="width:${prog.pct}%;"></div>
                  </div>
                  <span class="dualPct">${escapeHtml(`${prog.pct}%`)}</span>
                </div>

                <div class="dualRow">
                  <span class="dualLabel pr">PR</span>
                  <div class="progressBar prBar" aria-label="prereq progress">
                    <div class="progressFill prFill" style="width:${prPct === null ? 0 : prPct}%;"></div>
                  </div>
                  <span class="dualPct prText">${escapeHtml(prText)}</span>
                </div>
              </div>

              <div class="progressMeta">
                <span class="progressSub muted">${escapeHtml(`${prog.done}/${prog.total}`)}</span>
                <span class="progressSub muted prSubText">${escapeHtml(prSub)}</span>
              </div>
            </div>
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

    // ✅ Prereq 메타 계산 저장
    try {
      const meta = computePrereqMeta(data);
      state.rowMeta.set(String(setupId), meta);
    } catch {}

    return data;
  }

  // ✅ 보드 row DOM에 detail 기반(Prereq/락/날짜) 반영
  function applyDetailToBoardRow(setupId, detail) {
    const sid = String(setupId);
    const row = el.tableHost.querySelector(`[data-row="1"][data-setup-id="${sid}"]`);
    if (!row) return;

    const meta = state.rowMeta.get(sid) || computePrereqMeta(detail);
    state.rowMeta.set(sid, meta);

    // Prereq bar/텍스트 업데이트
    const prFill = row.querySelector('.prFill');
    const prTextEl = row.querySelector('.prText');
    const prSubText = row.querySelector('.prSubText');
    if (prFill) prFill.style.width = `${meta.prRequiredPct}%`;
    if (prTextEl) prTextEl.textContent = `${meta.prRequiredPct}%`;
    if (prSubText) prSubText.textContent = `${meta.prRequiredDone}/${meta.prRequiredTotal}`;

    // 각 셀 락 + 날짜 라벨 업데이트
    const stepRows = Array.isArray(detail?.steps) ? detail.steps : [];
    row.querySelectorAll('[data-cell="1"]').forEach(td => {
      const stepNo = Number(td.getAttribute('data-step-no'));
      const st = String(td.getAttribute('data-status') || 'NOT_STARTED').toUpperCase();

      // 날짜
      const srow = stepRows.find(x => Number(x.step_no) === stepNo) || null;
      const label = srow ? buildStepDateLabel(srow, st) : '';
      const dateEl = td.querySelector('.cellDate');
      if (dateEl) dateEl.textContent = label || '';

      // 락
      const locked = isStepLocked(sid, stepNo);
      td.classList.toggle('locked', locked);

      const title = locked ? `Prereq 미완료: ${missingTextForStep(sid, stepNo)}` : '';
      td.setAttribute('title', title);

      const overlay = td.querySelector('.lockOverlay');
      if (locked && !overlay) {
        td.insertAdjacentHTML('beforeend', `<div class="lockOverlay" aria-label="locked"><span class="lockEmoji">🔒</span></div>`);
      }
      if (!locked && overlay) overlay.remove();
    });
  }

  // ✅ 백그라운드로 일부 detail을 미리 로드(Prereq/락/날짜 반영)
  async function hydrateDetailsInBackground() {
    if (state.bgHydrateRunning) return;
    state.bgHydrateRunning = true;

    const ids = state.list.map(x => String(x.setup_id)).filter(Boolean);

    // 너무 과하게 때리지 않도록 상위 60개만(스크롤/필터에 따라 충분)
    const target = ids.slice(0, 60);

    const concurrency = 6;
    let idx = 0;

    async function worker() {
      while (idx < target.length) {
        const my = target[idx++];
        try {
          const detail = await ensureDetail(my);
          applyDetailToBoardRow(my, detail);
        } catch {}
      }
    }

    const tasks = Array.from({ length: concurrency }, worker);
    await Promise.all(tasks);

    state.bgHydrateRunning = false;
  }

  // ===========================
  // Project Start Date Auto
  // ===========================
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

    // detail 기반 날짜 계산(없으면 빈)
    let dateLabel = '';
    const cached = state.detailCache.get(String(setupId));
    if (cached?.steps) {
      const row = cached.steps.find(x => Number(x.step_no) === Number(stepNo)) || null;
      if (row) {
        // nxt 상태를 적용했을 때의 날짜 라벨을 추정
        // (실제 날짜는 저장 후 다시 detail 로드/캐시 갱신으로 반영됨)
        dateLabel = buildStepDateLabel(row, nxt);
      }
    }

    updateCellUI(td, nxt, dateLabel, 'saving...');

    try {
      await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/steps/${stepNo}`, {
        method: 'PATCH',
        body: { status: nxt }
      });

      td.setAttribute('data-status', nxt);

      // 캐시 업데이트
      if (cached?.steps) {
        const row = cached.steps.find(x => Number(x.step_no) === Number(stepNo));
        if (row) row.status = nxt;
      }

      // 최신 detail 다시 불러서(날짜/락/Prereq 모두 정합)
      state.detailCache.delete(String(setupId));
      const detail = await ensureDetail(String(setupId));
      applyDetailToBoardRow(String(setupId), detail);

      // 진행율 정렬 반영 위해 보드 리로드
      await loadBoard();

      toast(`${STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`} → ${nxt} 저장됨`);
    } catch (e) {
      updateCellUI(td, cur, '', '');
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

      // 보드 row 반영(Prereq/락/날짜)
      applyDetailToBoardRow(setupId, detail);

      const stepName = STEPS.find(s => s.no === stepNo)?.name || `STEP ${stepNo}`;
      const steps = detail?.steps || [];
      const row = steps.find(x => Number(x.step_no) === stepNo) || {};

      const planEnd = firstNonEmpty(fmtYYMMDD(row.plan_end), '-');
      const as = firstNonEmpty(fmtYYMMDD(row.actual_start), '-');
      const ae = firstNonEmpty(fmtYYMMDD(row.actual_end), '-');
      const workers = firstNonEmpty(row.workers, '-');
      const note = firstNonEmpty(row.note, '-');

      // 해당 step 잠김 안내
      const locked = isStepLocked(setupId, stepNo);
      const miss = locked ? missingTextForStep(setupId, stepNo) : '';

      el.tooltip.innerHTML = `
        <div class="tip-title">${escapeHtml(stepName)} ${locked ? `<span class="tip-lock">🔒</span>` : ``}</div>
        ${locked ? `<div class="tip-warn">Prereq 미완료: ${escapeHtml(miss)}</div>` : ``}
        <div class="tip-grid">
          <div class="tip-k">Plan End</div><div class="tip-v">${escapeHtml(planEnd)}</div>
          <div class="tip-k">Actual S</div><div class="tip-v">${escapeHtml(as)}</div>
          <div class="tip-k">Actual E</div><div class="tip-v">${escapeHtml(ae)}</div>
          <div class="tip-k">작업자</div><div class="tip-v">${escapeHtml(workers)}</div>
          <div class="tip-k">특이사항</div><div class="tip-v">${escapeHtml(note)}</div>
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

  function onCellLeave() { hideTooltip(); }

  /* =========================
   * Modal
   * ========================= */
  function openModalShell() { el.modal.classList.remove('hidden'); }

  function closeModal() {
    el.modal.classList.add('hidden');
    state.selectedSetupId = null;
    state.createMode = false;
    el.btnSaveProject.textContent = 'SAVE';
    el.prereqHost.innerHTML = '';
    el.prSummary.textContent = '-';
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

    // 신규 생성에서는 prereq/steps 표시 안내 제거(요구사항)
    el.prereqHost.innerHTML = '';
    el.prSummary.textContent = '· 생성 후 자동 생성됩니다.';
    el.stepsHost.innerHTML = '';

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
    el.prereqHost.innerHTML = '';
    el.prSummary.textContent = '';
    el.stepsHost.innerHTML = '';
    el.projSaveHint.textContent = '';

    try {
      const data = await ensureDetail(String(setupId));
      renderModal(data);
      applyDetailToBoardRow(String(setupId), data);
    } catch (e) {
      el.mTitle.textContent = '상세 로드 실패';
      el.mMeta.textContent = e.message;
      toast(`상세 로드 실패: ${e.message}`);
    }
  }

  function renderModal(data) {
    const p = data?.project || {};
    const steps = data?.steps || [];
    const prereqs = Array.isArray(data?.prereqs) ? data.prereqs : [];

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

    // ===========================
    // ✅ Prereq 렌더
    // ===========================
    const meta = computePrereqMeta(data);
    state.rowMeta.set(String(p.id), meta);

    el.prSummary.textContent = `· 필수 ${meta.prRequiredDone}/${meta.prRequiredTotal} (${meta.prRequiredPct}%)`;

    // 정렬: sort_order, 없으면 required_before_step_no, 없으면 name
    const sorted = prereqs.slice().sort((a, b) => {
      const sa = Number(a.sort_order ?? 999);
      const sb = Number(b.sort_order ?? 999);
      if (sa !== sb) return sa - sb;
      const ra = Number(a.required_before_step_no ?? 999);
      const rb = Number(b.required_before_step_no ?? 999);
      if (ra !== rb) return ra - rb;
      return String(a.prereq_name || a.prereq_key || '').localeCompare(String(b.prereq_name || b.prereq_key || ''));
    });

    el.prereqHost.innerHTML = sorted.map(pr => {
      const key = String(pr.prereq_key || '');
      const name = String(pr.prereq_name || pr.prereq_key || 'PREREQ');
      const desc = String(pr.description || '');
      const isRequired = Number(pr.is_required ?? 1) === 1;
      const beforeNo = pr.required_before_step_no === null || typeof pr.required_before_step_no === 'undefined'
        ? null
        : Number(pr.required_before_step_no);
      const isDone = Number(pr.is_done ?? 0) === 1;

      const beforeLabel = beforeNo ? `STEP ${beforeNo} (${STEPS.find(s=>s.no===beforeNo)?.name || ''}) 전` : '—';
      const badge = isRequired ? `<span class="tag req">필수</span>` : `<span class="tag opt">권장</span>`;

      return `
        <div class="pr-item" data-pr-key="${escapeHtml(key)}">
          <label class="pr-check">
            <input type="checkbox" ${isDone ? 'checked' : ''} data-pr-done="1"/>
            <span class="pr-title">${escapeHtml(name)}</span>
          </label>

          <div class="pr-meta">
            ${badge}
            <span class="muted small">· ${escapeHtml(beforeLabel)}</span>
          </div>

          ${desc ? `<div class="pr-desc">${escapeHtml(desc)}</div>` : ``}

          <div class="pr-actions">
            <input class="pr-note" type="text" placeholder="메모(선택)" value="${escapeHtml(pr.note || '')}" data-pr-note="1"/>
            <button class="btn prBtn" data-pr-save="1">저장</button>
            <span class="muted small prHint" data-pr-hint="1"></span>
          </div>
        </div>
      `;
    }).join('');

    // prereq 이벤트
    el.prereqHost.querySelectorAll('.pr-item').forEach(item => {
      const key = item.getAttribute('data-pr-key');
      const chk = item.querySelector('[data-pr-done="1"]');
      const note = item.querySelector('[data-pr-note="1"]');
      const btn = item.querySelector('[data-pr-save="1"]');
      const hint = item.querySelector('[data-pr-hint="1"]');

      const save = async () => {
        const setupId = state.selectedSetupId;
        if (!setupId) return;

        const is_done = chk.checked ? 1 : 0;
        const payload = { is_done, note: note.value.trim() || null };

        try {
          hint.textContent = 'saving...';
          await apiFetch(`/api/setup-projects/${encodeURIComponent(setupId)}/prereqs/${encodeURIComponent(key)}`, {
            method: 'PATCH',
            body: payload
          });

          // cache 업데이트(최소 반영)
          const cached = state.detailCache.get(String(setupId));
          if (cached?.prereqs) {
            const row = cached.prereqs.find(x => String(x.prereq_key) === String(key));
            if (row) {
              row.is_done = is_done;
              row.note = payload.note;
              row.done_at = is_done ? (row.done_at || new Date().toISOString().slice(0,19).replace('T',' ')) : null;
            }
          }

          // 메타 재계산 후 UI 반영
          const detailNow = state.detailCache.get(String(setupId)) || data;
          const metaNow = computePrereqMeta(detailNow);
          state.rowMeta.set(String(setupId), metaNow);
          el.prSummary.textContent = `· 필수 ${metaNow.prRequiredDone}/${metaNow.prRequiredTotal} (${metaNow.prRequiredPct}%)`;

          // Step 카드들 잠금 안내/보드 락 반영
          renderStepsWithLocks(detailNow);

          // 보드 row 반영
          applyDetailToBoardRow(String(setupId), detailNow);

          hint.textContent = 'saved ✅';
          toast('Prereq 저장 완료');

          setTimeout(() => (hint.textContent = ''), 1200);
        } catch (e) {
          hint.textContent = `fail: ${e.message}`;
          toast(`Prereq 저장 실패: ${e.message}`);
        }
      };

      btn.addEventListener('click', save);
      // 체크만 바꿔도 바로 저장하고 싶으면(UX 더 좋음)
      chk.addEventListener('change', save);
    });

    // ===========================
    // ✅ Steps 렌더 (Prereq 잠금 포함)
    // ===========================
    renderStepsWithLocks(data);
  }

  function renderStepsWithLocks(data) {
    const steps = data?.steps || [];
    const setupId = state.selectedSetupId || String(data?.project?.id || '');

    const byNo = new Map();
    for (const s of steps) byNo.set(Number(s.step_no), s);

    // step별 미완료 prereq 계산
    const meta = state.rowMeta.get(String(setupId)) || computePrereqMeta(data);

    el.stepsHost.innerHTML = STEPS.map(t => {
      const s = byNo.get(t.no) || {};
      const st = (s.status || 'NOT_STARTED').toUpperCase();
      const desc = s.step_description ? String(s.step_description) : '';

      const planEnd = fmtDateISO(s.plan_end);
      const actualStart = fmtDateISO(s.actual_start);
      const actualEnd = fmtDateISO(s.actual_end);

      const missing = meta.missingByStepNo.get(t.no) || [];
      const locked = missing.length > 0;

      const missText = missing.length
        ? `${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ` 외 ${missing.length - 4}개` : ''}`
        : '';

      return `
        <div class="step-card ${locked ? 'stepLocked' : ''}" data-step-card="1" data-step-no="${t.no}">
          <div class="step-top">
            <div>
              <div class="step-card-title">${escapeHtml(t.name)}</div>
              ${desc ? `<div class="step-desc">${escapeHtml(desc)}</div>` : ``}
              ${locked ? `<div class="step-lock-hint">🔒 Prereq 미완료: ${escapeHtml(missText)}</div>` : ``}
            </div>
            <div>
              <span class="pill ${statusToClass(st)}" data-pill="1">${statusShort(st)}</span>
            </div>
          </div>

          <div class="step-grid step-grid-planend">
            <div class="field">
              <label>Status</label>
              <select data-field="status" ${locked ? 'disabled' : ''}>
                <option value="NOT_STARTED" ${st==='NOT_STARTED'?'selected':''}>NOT_STARTED</option>
                <option value="PLANNED" ${st==='PLANNED'?'selected':''}>PLANNED</option>
                <option value="IN_PROGRESS" ${st==='IN_PROGRESS'?'selected':''}>IN_PROGRESS</option>
                <option value="DONE" ${st==='DONE'?'selected':''}>DONE</option>
                <option value="HOLD" ${st==='HOLD'?'selected':''}>HOLD</option>
              </select>
            </div>

            <div class="field">
              <label>Plan End</label>
              <input type="date" data-field="plan_end" value="${escapeHtml(planEnd)}" ${locked ? 'disabled' : ''}/>
            </div>

            <div class="field">
              <label>Actual Start</label>
              <input type="date" data-field="actual_start" value="${escapeHtml(actualStart)}" ${locked ? 'disabled' : ''}/>
            </div>

            <div class="field">
              <label>Actual End</label>
              <input type="date" data-field="actual_end" value="${escapeHtml(actualEnd)}" ${locked ? 'disabled' : ''}/>
            </div>

            <div class="field">
              <label>Workers</label>
              <input type="text" data-field="workers" value="${escapeHtml(s.workers || '')}" placeholder="정현우,김동한" ${locked ? 'disabled' : ''}/>
            </div>

            <div class="field wide note-wide">
              <label>Note</label>
              <input type="text" data-field="note" value="${escapeHtml(s.note || '')}" placeholder="특이사항" ${locked ? 'disabled' : ''}/>
            </div>
          </div>

          <div class="step-actions">
            <span class="muted small" data-hint="1"></span>
            <button class="btn primary" data-save-step="1" ${locked ? 'disabled' : ''}>SAVE</button>
          </div>
        </div>
      `;
    }).join('');

    // step 이벤트 바인딩
    el.stepsHost.querySelectorAll('[data-step-card="1"]').forEach(card => {
      const stepNo = Number(card.getAttribute('data-step-no'));
      const selStatus = card.querySelector('[data-field="status"]');
      const pill = card.querySelector('[data-pill="1"]');
      const hint = card.querySelector('[data-hint="1"]');
      const btn = card.querySelector('[data-save-step="1"]');

      if (selStatus) {
        selStatus.addEventListener('change', () => {
          const st = selStatus.value;
          pill.classList.remove('ns','pl','ip','dn','hd');
          pill.classList.add(statusToClass(st));
          pill.textContent = statusShort(st);
        });
      }

      if (btn) {
        btn.addEventListener('click', async () => {
          const setupId = state.selectedSetupId;
          if (!setupId) return;

          // ✅ 잠김이면 저장 막고 안내
          if (isStepLocked(setupId, stepNo)) {
            toast(`🔒 Prereq 미완료: ${missingTextForStep(setupId, stepNo)}`);
            return;
          }

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

            // STEP1 날짜가 생기면 start_date 자동 반영
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

            // 최신 detail 재반영
            state.detailCache.delete(setupId);
            const fresh = await ensureDetail(setupId);

            // 모달 재렌더(Prereq 잠금 포함)
            renderModal(fresh);

            // 보드 반영
            applyDetailToBoardRow(setupId, fresh);

            // 진행율 정렬 반영 위해 리로드
            await loadBoard();

            toast(`${STEPS.find(s=>s.no===stepNo)?.name || `STEP ${stepNo}`} 저장 완료`);
            setTimeout(() => (hint.textContent = ''), 1300);
          } catch (e) {
            hint.textContent = `fail: ${e.message}`;
            toast(`STEP 저장 실패: ${e.message}`);
          }
        });
      }
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

    window.addEventListener('scroll', () => hideTooltip(), { passive: true });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    if (!getToken()) toast('로그인이 필요합니다. (x-access-token 없음)');
    await loadBoard();
  });

})();
