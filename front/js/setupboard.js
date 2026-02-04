// front/js/setupboard.js
(() => {
  const API = {
    board: '/api/setup-board',
    createProject: '/api/setup-projects',
    projectDetail: (id) => `/api/setup-projects/${id}`,
    patchStep: (id, stepNo) => `/api/setup-projects/${id}/steps/${stepNo}`,
    createIssue: (id) => `/api/setup-projects/${id}/issues`,
    patchIssue: (issueId) => `/api/setup-issues/${issueId}`,
  };

  const $ = (sel, root=document) => root.querySelector(sel);

  // ---------- Auth ----------
  function getToken() {
    return localStorage.getItem('x-access-token');
  }
  function authHeaders() {
    const token = getToken();
    return token ? { 'x-access-token': token } : {};
  }
  function setNavState() {
    const token = getToken();
    const unsigned = $('#navUnsigned');
    const signed = $('#navSigned');
    if (!token) {
      unsigned.classList.remove('hidden');
      signed.classList.add('hidden');
      return;
    }
    unsigned.classList.add('hidden');
    signed.classList.remove('hidden');

    // 닉네임 표시(네 JWT payload 구조가 다를 수 있으니 안전하게)
    const me = localStorage.getItem('nickname') || localStorage.getItem('userID') || 'signed-in';
    $('#meChip').textContent = me;
  }
  function requireLoginOrRedirect() {
    if (!getToken()) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return false;
    }
    return true;
  }

  // ---------- State ----------
  const state = {
    list: [],
    selectedId: null,
    selectedDetail: null,
    loading: false,
  };

  // ---------- Fetch helpers ----------
  async function apiFetch(url, options={}) {
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }

    if (!res.ok) {
      const msg = (data && data.error) ? data.error : (typeof data === 'string' ? data : `HTTP ${res.status}`);
      throw new Error(msg);
    }
    return data;
  }

  // ---------- Query build ----------
  function buildBoardQuery() {
    const customer = $('#filterCustomer').value.trim();
    const site = $('#filterSite').value.trim();
    const line = $('#filterLine').value.trim();
    const status = $('#filterStatus').value.trim();
    const q = $('#filterQ').value.trim();
    const sort = $('#filterSort').value.trim();

    const params = new URLSearchParams();
    if (customer) params.set('customer', customer);
    if (site) params.set('site', site);
    if (line) params.set('line', line);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    params.set('limit', '200');
    params.set('offset', '0');
    return params.toString();
  }

  // ---------- Render: Board ----------
  function badgeForBoardStatus(s) {
    // PLANNED / IN_PROGRESS / DONE / HOLD / CANCELLED
    if (s === 'DONE') return 'ok';
    if (s === 'HOLD') return 'bad';
    if (s === 'IN_PROGRESS') return 'info';
    if (s === 'CANCELLED') return 'warn';
    return '';
  }

  function fmtDate(v) {
    if (!v) return '-';
    // v가 'YYYY-MM-DD' 또는 timestamp 문자열일 수 있음
    return String(v).slice(0, 10);
  }

  function calcPercent(done, total) {
    const d = Number(done || 0);
    const t = Number(total || 0);
    if (t <= 0) return 0;
    return Math.round((d / t) * 100);
  }

  function renderBoard(list) {
    const wrap = $('#boardList');
    const empty = $('#boardEmpty');
    wrap.innerHTML = '';

    $('#boardCount').textContent = String(list.length);

    if (!list.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    for (const row of list) {
      const percent = calcPercent(row.done_steps, row.total_steps);
      const active = (String(state.selectedId) === String(row.setup_id)) ? 'active' : '';

      const statusClass = badgeForBoardStatus(row.board_status);
      const crit = Number(row.critical_open_issues || 0);
      const open = Number(row.open_issues || 0);

      const el = document.createElement('div');
      el.className = `board-item ${active}`;
      el.dataset.id = row.setup_id;

      el.innerHTML = `
        <div class="row1">
          <div class="eqname">${escapeHtml(row.equipment_name || '-')}</div>
          <div class="meta">
            <span class="badge ${statusClass}">${escapeHtml(row.board_status || '-')}</span>
            ${row.customer ? `<span class="badge">${escapeHtml(row.customer)}</span>` : ''}
            ${row.site ? `<span class="badge">${escapeHtml(row.site)}</span>` : ''}
            ${row.line ? `<span class="badge">${escapeHtml(row.line)}</span>` : ''}
            ${row.equipment_type ? `<span class="badge">${escapeHtml(row.equipment_type)}</span>` : ''}
          </div>
        </div>

        <div class="row2">
          <div class="progress-wrap">
            <div class="progress"><div style="width:${percent}%"></div></div>
            <div class="progress-text">${percent}% (${row.done_steps || 0}/${row.total_steps || 0})</div>
          </div>
        </div>

        <div class="row3">
          <div class="note">📝 ${escapeHtml(row.last_note || '특이사항 없음')}</div>
          <div>
            ${crit > 0 ? `<span class="badge bad">CRIT ${crit}</span>` : ''}
            ${open > 0 ? `<span class="badge warn">OPEN ${open}</span>` : ''}
            <span class="badge">TGT ${escapeHtml(fmtDate(row.target_date))}</span>
            <span class="badge">UPD ${escapeHtml(String(row.updated_at || '').slice(0, 16).replace('T',' '))}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        selectProject(row.setup_id);
      });

      wrap.appendChild(el);
    }
  }

  // ---------- Render: Detail ----------
  function renderDetail(detail) {
    const body = $('#detailBody');
    if (!detail) {
      body.innerHTML = `<div class="placeholder">왼쪽 보드에서 설비를 선택하면 상세가 표시됩니다.</div>`;
      return;
    }

    const p = detail.project;
    const steps = detail.steps || [];
    const issues = detail.issues || [];

    $('#detailTitle').textContent = p.equipment_name || `Setup #${p.id}`;
    $('#detailSub').textContent = [
      p.customer ? `Customer:${p.customer}` : null,
      p.site ? `Site:${p.site}` : null,
      p.line ? `Line:${p.line}` : null,
      p.location ? `Loc:${p.location}` : null,
      p.equipment_type ? `Type:${p.equipment_type}` : null,
    ].filter(Boolean).join('  |  ') || '-';

    // Project quick patch UI(일단 board_status/target/owners/note 정도)
    const projectBlock = `
      <div class="block">
        <h3>Project</h3>
        <div class="grid3">
          <div class="control">
            <label>Board Status</label>
            <select id="p_board_status">
              ${['PLANNED','IN_PROGRESS','DONE','HOLD','CANCELLED'].map(s =>
                `<option value="${s}" ${p.board_status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="control">
            <label>Target Date</label>
            <input id="p_target_date" type="date" value="${escapeAttr(fmtDate(p.target_date) === '-' ? '' : fmtDate(p.target_date))}" />
          </div>
          <div class="control">
            <label>Location</label>
            <input id="p_location" type="text" value="${escapeAttr(p.location || '')}" />
          </div>

          <div class="control">
            <label>Owner(Main)</label>
            <input id="p_owner_main" type="text" value="${escapeAttr(p.owner_main || '')}" />
          </div>
          <div class="control">
            <label>Owner(Support)</label>
            <input id="p_owner_support" type="text" value="${escapeAttr(p.owner_support || '')}" />
          </div>
          <div class="control">
            <label>Last Note</label>
            <input id="p_last_note" type="text" value="${escapeAttr(p.last_note || '')}" />
          </div>
        </div>
        <div class="row" style="margin-top:10px;">
          <div class="small">* Project 정보 저장은 Board와 상세에 반영됩니다.</div>
          <button class="btn btn-primary" id="btnSaveProject">Save</button>
        </div>
      </div>
    `;

    const stepsBlock = `
      <div class="block">
        <h3>Steps (1~17)</h3>
        ${steps.map(s => renderStepRow(p.id, s)).join('')}
      </div>
    `;

    const issuesBlock = `
      <div class="block">
        <h3>Issues</h3>
        ${renderIssueCreate(p.id)}
        ${issues.length ? issues.map(i => renderIssueItem(i)).join('') : `<div class="small">등록된 이슈가 없습니다.</div>`}
      </div>
    `;

    body.innerHTML = projectBlock + stepsBlock + issuesBlock;

    // bind handlers
    $('#btnSaveProject').addEventListener('click', async () => {
      await saveProjectPatch(p.id);
    });

    // step save handlers
    for (const s of steps) {
      const btn = $(`#btnSaveStep_${s.step_no}`);
      if (btn) btn.addEventListener('click', async () => saveStepPatch(p.id, s.step_no));
    }

    // issue create
    const btnIssue = $('#btnCreateIssue');
    if (btnIssue) btnIssue.addEventListener('click', async () => createIssue(p.id));

    // issue resolve/update
    for (const i of issues) {
      const btnU = $(`#btnUpdateIssue_${i.id}`);
      if (btnU) btnU.addEventListener('click', async () => updateIssue(i.id));
    }
  }

  function renderStepRow(setupId, s) {
    const statusOptions = ['NOT_STARTED','SCHEDULED','IN_PROGRESS','DONE','HOLD'];
    const optHtml = statusOptions.map(v => `<option value="${v}" ${s.status===v?'selected':''}>${v}</option>`).join('');

    // datetime-local 포맷
    const toLocal = (val) => {
      if (!val) return '';
      // "2026-02-04T10:30:00.000Z" 혹은 "2026-02-04 10:30:00" 등 다양한 경우 대비
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2,'0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      // 이미 "YYYY-MM-DD HH:MM:SS"면
      const str = String(val).replace(' ', 'T').slice(0, 16);
      return str;
    };

    return `
      <div class="step-row">
        <div class="step-no">${s.step_no}</div>
        <div class="step-main">
          <div class="step-title">
            <strong>${escapeHtml(s.step_name || '-')}</strong>
            <span class="badge ${badgeForStepStatus(s.status)}">${escapeHtml(s.status || '-')}</span>
          </div>
          <div class="step-desc">${escapeHtml(s.step_description || '')}</div>

          <div class="step-mini">
            <div class="control">
              <label>Status</label>
              <select id="st_${s.step_no}_status">${optHtml}</select>
            </div>
            <div class="control">
              <label>Workers (콤마)</label>
              <input id="st_${s.step_no}_workers" type="text" value="${escapeAttr(s.workers || '')}" placeholder="예: 정현우,김동한" />
            </div>

            <div class="control">
              <label>Plan Start</label>
              <input id="st_${s.step_no}_plan_start" type="datetime-local" value="${escapeAttr(toLocal(s.plan_start))}" />
            </div>
            <div class="control">
              <label>Plan End</label>
              <input id="st_${s.step_no}_plan_end" type="datetime-local" value="${escapeAttr(toLocal(s.plan_end))}" />
            </div>

            <div class="control">
              <label>Actual Start</label>
              <input id="st_${s.step_no}_actual_start" type="datetime-local" value="${escapeAttr(toLocal(s.actual_start))}" />
            </div>
            <div class="control">
              <label>Actual End</label>
              <input id="st_${s.step_no}_actual_end" type="datetime-local" value="${escapeAttr(toLocal(s.actual_end))}" />
            </div>
          </div>

          <div class="control" style="margin-top:10px;">
            <label>Note</label>
            <textarea id="st_${s.step_no}_note" placeholder="특이사항...">${escapeHtml(s.note || '')}</textarea>
          </div>

          <div class="step-actions">
            <button class="btn btn-primary" id="btnSaveStep_${s.step_no}">Save Step</button>
            <span class="small">Last update: ${escapeHtml(String(s.updated_at || '').slice(0, 19).replace('T',' '))} / by ${escapeHtml(s.updated_by || '-')}</span>
          </div>
        </div>
      </div>
    `;
  }

  function badgeForStepStatus(s) {
    if (s === 'DONE') return 'ok';
    if (s === 'IN_PROGRESS') return 'info';
    if (s === 'HOLD') return 'bad';
    if (s === 'SCHEDULED') return 'warn';
    return '';
  }

  function renderIssueCreate(setupId) {
    return `
      <div class="issue-item">
        <div class="issue-top">
          <div class="issue-title">+ New Issue</div>
          <button class="btn btn-primary" id="btnCreateIssue">Create</button>
        </div>

        <div class="block" style="margin-top:10px; margin-bottom:0;">
          <div class="grid2">
            <div class="control">
              <label>Step No</label>
              <select id="i_step_no">
                <option value="">(None)</option>
                ${Array.from({length:17}, (_,i)=>i+1).map(n=>`<option value="${n}">${n}</option>`).join('')}
              </select>
            </div>
            <div class="control">
              <label>Owner</label>
              <input id="i_owner" type="text" placeholder="예: 정현우" />
            </div>

            <div class="control">
              <label>Severity</label>
              <select id="i_severity">
                <option value="CRITICAL">CRITICAL</option>
                <option value="MAJOR" selected>MAJOR</option>
                <option value="MINOR">MINOR</option>
                <option value="INFO">INFO</option>
              </select>
            </div>

            <div class="control">
              <label>Category</label>
              <select id="i_category">
                <option value="SAFETY">SAFETY</option>
                <option value="EQUIPMENT" selected>EQUIPMENT</option>
                <option value="UTILITY">UTILITY</option>
                <option value="MATERIAL">MATERIAL</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="VENDOR">VENDOR</option>
                <option value="ETC">ETC</option>
              </select>
            </div>

            <div class="control span2">
              <label>Title *</label>
              <input id="i_title" type="text" placeholder="예: POWER ON 후 알람 지속" />
            </div>

            <div class="control span2">
              <label>Content</label>
              <textarea id="i_content" placeholder="상세 내용..."></textarea>
            </div>
          </div>
          <div class="small error hidden" id="issueCreateError">-</div>
        </div>
      </div>
    `;
  }

  function renderIssueItem(i) {
    const sevClass = (i.severity === 'CRITICAL') ? 'bad'
      : (i.severity === 'MAJOR') ? 'warn'
      : (i.severity === 'MINOR') ? 'info'
      : '';

    const stateClass = (i.state === 'OPEN') ? 'warn' : 'ok';

    return `
      <div class="issue-item" id="issue_${i.id}">
        <div class="issue-top">
          <div class="issue-title">${escapeHtml(i.title || '-')}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
            <span class="badge ${sevClass}">${escapeHtml(i.severity || '-')}</span>
            <span class="badge">${escapeHtml(i.category || '-')}</span>
            <span class="badge ${stateClass}">${escapeHtml(i.state || '-')}</span>
          </div>
        </div>

        <div class="issue-content">${escapeHtml(i.content || '')}</div>

        <div class="issue-meta">
          <span>Step: ${escapeHtml(i.step_no || '-')}</span>
          <span>Owner: ${escapeHtml(i.owner || '-')}</span>
          <span>Updated: ${escapeHtml(String(i.updated_at || '').slice(0, 19).replace('T',' '))}</span>
        </div>

        <div class="block" style="margin-top:10px; margin-bottom:0;">
          <div class="grid2">
            <div class="control">
              <label>State</label>
              <select id="iu_${i.id}_state">
                <option value="OPEN" ${i.state==='OPEN'?'selected':''}>OPEN</option>
                <option value="RESOLVED" ${i.state==='RESOLVED'?'selected':''}>RESOLVED</option>
              </select>
            </div>
            <div class="control">
              <label>Owner</label>
              <input id="iu_${i.id}_owner" type="text" value="${escapeAttr(i.owner || '')}" />
            </div>
            <div class="control span2">
              <label>Content</label>
              <textarea id="iu_${i.id}_content">${escapeHtml(i.content || '')}</textarea>
            </div>
          </div>
          <div class="row" style="margin-top:10px;">
            <div class="small">* 이슈 수정/해결 상태 변경</div>
            <button class="btn btn-secondary" id="btnUpdateIssue_${i.id}">Update</button>
          </div>
        </div>
      </div>
    `;
  }

  // ---------- Actions ----------
  async function loadBoard() {
    if (!requireLoginOrRedirect()) return;
    state.loading = true;

    try {
      const qs = buildBoardQuery();
      const res = await apiFetch(`${API.board}?${qs}`, { method: 'GET' });
      state.list = res.data || [];
      renderBoard(state.list);
      $('#lastLoaded').textContent = `Loaded: ${new Date().toLocaleString()}`;
    } catch (e) {
      alert(`보드 로딩 실패: ${e.message}`);
    } finally {
      state.loading = false;
    }
  }

  async function selectProject(setupId) {
    state.selectedId = setupId;
    renderBoard(state.list); // active 표시

    $('#detailBody').innerHTML = `<div class="placeholder">로딩 중...</div>`;

    try {
      const res = await apiFetch(API.projectDetail(setupId), { method: 'GET' });
      state.selectedDetail = res.data;
      renderDetail(state.selectedDetail);
    } catch (e) {
      $('#detailBody').innerHTML = `<div class="placeholder">상세 로딩 실패: ${escapeHtml(e.message)}</div>`;
    }
  }

  async function saveProjectPatch(setupId) {
    const patch = {
      board_status: $('#p_board_status').value,
      target_date: $('#p_target_date').value || null,
      location: $('#p_location').value.trim() || null,
      owner_main: $('#p_owner_main').value.trim() || null,
      owner_support: $('#p_owner_support').value.trim() || null,
      last_note: $('#p_last_note').value.trim() || null,
    };

    try {
      await apiFetch(API.projectDetail(setupId), {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      await loadBoard();
      await selectProject(setupId);
      toast('Project saved');
    } catch (e) {
      alert(`Project 저장 실패: ${e.message}`);
    }
  }

  function readDtLocal(id) {
    const v = $(id).value;
    if (!v) return null;
    // datetime-local -> "YYYY-MM-DD HH:mm:ss"로 보내기 (백엔드가 DATETIME이면 이게 편함)
    return v.replace('T', ' ') + ':00';
  }

  async function saveStepPatch(setupId, stepNo) {
    const base = `#st_${stepNo}_`;
    const patch = {
      status: $(`${base}status`).value,
      workers: $(`${base}workers`).value.trim() || null,
      plan_start: readDtLocal(`${base}plan_start`),
      plan_end: readDtLocal(`${base}plan_end`),
      actual_start: readDtLocal(`${base}actual_start`),
      actual_end: readDtLocal(`${base}actual_end`),
      note: $(`${base}note`).value.trim() || null
    };

    try {
      await apiFetch(API.patchStep(setupId, stepNo), {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      await loadBoard();
      await selectProject(setupId);
      toast(`Step ${stepNo} saved`);
    } catch (e) {
      alert(`Step 저장 실패: ${e.message}`);
    }
  }

  async function createIssue(setupId) {
    $('#issueCreateError').classList.add('hidden');

    const payload = {
      step_no: $('#i_step_no').value ? Number($('#i_step_no').value) : null,
      severity: $('#i_severity').value,
      category: $('#i_category').value,
      title: $('#i_title').value.trim(),
      content: $('#i_content').value.trim() || null,
      owner: $('#i_owner').value.trim() || null
    };

    if (!payload.title) {
      const el = $('#issueCreateError');
      el.textContent = 'Title은 필수입니다.';
      el.classList.remove('hidden');
      return;
    }

    try {
      await apiFetch(API.createIssue(setupId), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadBoard();
      await selectProject(setupId);
      toast('Issue created');
    } catch (e) {
      const el = $('#issueCreateError');
      el.textContent = e.message;
      el.classList.remove('hidden');
    }
  }

  async function updateIssue(issueId) {
    const patch = {
      state: $(`#iu_${issueId}_state`).value,
      owner: $(`#iu_${issueId}_owner`).value.trim() || null,
      content: $(`#iu_${issueId}_content`).value.trim() || null,
      resolved_at: null
    };

    // state가 RESOLVED면 resolved_at을 자동으로 박아도 좋음(백엔드에서 처리해도 됨)
    if (patch.state === 'RESOLVED') {
      const now = new Date();
      const pad = (n) => String(n).padStart(2,'0');
      patch.resolved_at =
        `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    try {
      await apiFetch(API.patchIssue(issueId), {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });

      // 선택된 프로젝트 다시 로드
      if (state.selectedId) {
        await loadBoard();
        await selectProject(state.selectedId);
      }
      toast('Issue updated');
    } catch (e) {
      alert(`Issue 업데이트 실패: ${e.message}`);
    }
  }

  // ---------- Create Modal ----------
  function openCreate() {
    $('#createError').classList.add('hidden');
    $('#createModal').classList.remove('hidden');
  }
  function closeCreate() {
    $('#createModal').classList.add('hidden');
  }

  async function submitCreate() {
    const payload = {
      equipment_name: $('#c_equipment_name').value.trim(),
      equipment_type: $('#c_equipment_type').value.trim() || null,
      customer: $('#c_customer').value || null,
      site: $('#c_site').value,
      line: $('#c_line').value,
      location: $('#c_location').value.trim() || null,
      target_date: $('#c_target_date').value || null,
      owner_main: $('#c_owner_main').value.trim() || null,
      owner_support: $('#c_owner_support').value.trim() || null,
      last_note: $('#c_last_note').value.trim() || null
    };

    if (!payload.equipment_name || !payload.site || !payload.line) {
      const el = $('#createError');
      el.textContent = 'Equipment Name / Site / Line 은 필수입니다.';
      el.classList.remove('hidden');
      return;
    }

    try {
      const res = await apiFetch(API.createProject, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      closeCreate();
      await loadBoard();
      if (res.setup_id) await selectProject(res.setup_id);
      toast('Created');
    } catch (e) {
      const el = $('#createError');
      el.textContent = e.message;
      el.classList.remove('hidden');
    }
  }

  // ---------- Utils ----------
  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replaceAll('\n',' ');
  }

  let toastTimer = null;
  function toast(msg) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.position = 'fixed';
      el.style.bottom = '18px';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.padding = '10px 14px';
      el.style.border = '1px solid rgba(255,255,255,0.18)';
      el.style.borderRadius = '999px';
      el.style.background = 'rgba(0,0,0,0.55)';
      el.style.backdropFilter = 'blur(8px)';
      el.style.color = 'rgba(255,255,255,0.9)';
      el.style.fontWeight = '800';
      el.style.zIndex = '9999';
      el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 1400);
  }

  // ---------- Events ----------
  function bindEvents() {
    $('#btnLogout').addEventListener('click', () => {
      localStorage.removeItem('x-access-token');
      alert('로그아웃 되었습니다.');
      window.location.replace('./signin.html');
    });

    $('#btnRefresh').addEventListener('click', loadBoard);
    $('#btnSearch').addEventListener('click', loadBoard);

    // Enter in search
    $('#filterQ').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadBoard();
    });

    // Auto refresh on filter change
    ['filterCustomer','filterSite','filterLine','filterStatus','filterSort'].forEach(id => {
      $( '#' + id ).addEventListener('change', loadBoard);
    });

    $('#btnCreate').addEventListener('click', openCreate);
    $('#btnCloseCreate').addEventListener('click', closeCreate);
    $('#btnCreateCancel').addEventListener('click', closeCreate);
    $('#btnCreateSubmit').addEventListener('click', submitCreate);

    // modal backdrop close
    $('#createModal').addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close === '1') closeCreate();
    });

    // detail close
    $('#btnCloseDetail').addEventListener('click', () => {
      state.selectedId = null;
      state.selectedDetail = null;
      $('#detailTitle').textContent = '설비를 선택하세요';
      $('#detailSub').textContent = '-';
      renderDetail(null);
      renderBoard(state.list);
    });
  }

  // ---------- Init ----------
  async function init() {
    setNavState();
    if (!requireLoginOrRedirect()) return;
    bindEvents();
    await loadBoard();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
