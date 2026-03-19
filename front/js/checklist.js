(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || '',
    me: null,
    available: [],
    currentEquipmentGroup: '',
    currentKind: 'SETUP',
    currentChecklist: null,
    dirty: false,
    toastTimer: null,
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindEvents();

    if (!state.token) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return;
    }

    try {
      setLoading(true, '체크리스트 화면을 불러오는 중입니다.');
      await loadBootstrap();
      await loadChecklist();
    } catch (error) {
      handleError(error, '초기 화면 로딩 실패');
    } finally {
      setLoading(false);
    }
  }

  function cacheElements() {
    Object.assign(els, {
      userBadge: document.getElementById('userBadge'),
      overallCompletion: document.getElementById('overallCompletion'),
      responseStatus: document.getElementById('responseStatus'),
      equipmentSelect: document.getElementById('equipmentSelect'),
      kindSelect: document.getElementById('kindSelect'),
      questionSearch: document.getElementById('questionSearch'),
      incompleteOnly: document.getElementById('incompleteOnly'),
      reloadBtn: document.getElementById('reloadBtn'),
      saveBtn: document.getElementById('saveBtn'),
      submitBtn: document.getElementById('submitBtn'),
      screenHint: document.getElementById('screenHint'),
      profileInfo: document.getElementById('profileInfo'),
      sectionProgressList: document.getElementById('sectionProgressList'),
      templateTitle: document.getElementById('templateTitle'),
      templateMeta: document.getElementById('templateMeta'),
      checklistForm: document.getElementById('checklistForm'),
      checklistSections: document.getElementById('checklistSections'),
      checkAllVisibleBtn: document.getElementById('checkAllVisibleBtn'),
      uncheckAllVisibleBtn: document.getElementById('uncheckAllVisibleBtn'),
      adminPanel: document.getElementById('adminPanel'),
      accessEngineerId: document.getElementById('accessEngineerId'),
      accessEquipmentGroup: document.getElementById('accessEquipmentGroup'),
      accessType: document.getElementById('accessType'),
      accessReason: document.getElementById('accessReason'),
      loadAccessBtn: document.getElementById('loadAccessBtn'),
      saveAccessBtn: document.getElementById('saveAccessBtn'),
      accessResult: document.getElementById('accessResult'),
      logoutBtn: document.getElementById('logoutBtn'),
      toast: document.getElementById('toast'),
    });
  }

  function bindEvents() {
    els.equipmentSelect.addEventListener('change', async (e) => {
      state.currentEquipmentGroup = e.target.value;
      await guardedReloadChecklist();
    });

    els.kindSelect.addEventListener('change', async (e) => {
      state.currentKind = e.target.value;
      await guardedReloadChecklist();
    });

    els.questionSearch.addEventListener('input', applyQuestionFilters);
    els.incompleteOnly.addEventListener('change', applyQuestionFilters);
    els.reloadBtn.addEventListener('click', () => guardedReloadChecklist(true));
    els.saveBtn.addEventListener('click', () => saveChecklist('ACTIVE'));
    els.submitBtn.addEventListener('click', () => saveChecklist('SUBMITTED'));
    els.checkAllVisibleBtn.addEventListener('click', () => bulkToggleVisible(true));
    els.uncheckAllVisibleBtn.addEventListener('click', () => bulkToggleVisible(false));
    els.logoutBtn.addEventListener('click', logout);

    els.loadAccessBtn.addEventListener('click', loadEngineerAccess);
    els.saveAccessBtn.addEventListener('click', saveEngineerAccess);

    window.addEventListener('beforeunload', (e) => {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  async function loadBootstrap() {
    const [me, available] = await Promise.all([
      api('/api/checklists/me'),
      api('/api/checklists/available'),
    ]);

    state.me = me;
    state.available = Array.isArray(available?.rows) ? available.rows : [];
    renderMe(me);
    buildSelectors(me, state.available);
    renderAdminPanel(me);
  }

  function renderMe(me) {
    const userName = me?.engineer?.name || me?.user?.nickname || '사용자';
    const group = me?.engineer?.group || me?.user?.group || '-';
    const site = me?.engineer?.site || me?.user?.site || '-';
    els.userBadge.textContent = `${userName} · ${group}/${site}`;

    const rows = [
      ['로그인 사용자', me?.user?.nickname || '-'],
      ['엔지니어', me?.engineer?.name || '미연결'],
      ['매핑 방식', me?.engineer?.resolved_by || '-'],
      ['그룹', group],
      ['사이트', site],
      ['권한', me?.user?.role || '-'],
    ];

    els.profileInfo.innerHTML = rows.map(([dt, dd]) => `<dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(dd)}</dd>`).join('');
  }

  function buildSelectors(me, availableRows) {
    const access = Array.isArray(me?.access) ? me.access.filter((row) => row.allowed) : [];
    const codeToName = new Map(access.map((row) => [row.code, row.display_name]));

    const grouped = new Map();
    for (const row of availableRows) {
      if (!grouped.has(row.equipment_group_code)) grouped.set(row.equipment_group_code, new Set());
      grouped.get(row.equipment_group_code).add(row.checklist_kind);
    }

    const equipmentCodes = [...grouped.keys()].filter((code) => codeToName.has(code));
    els.equipmentSelect.innerHTML = equipmentCodes.length
      ? equipmentCodes.map((code) => `<option value="${escapeAttr(code)}">${escapeHtml(codeToName.get(code) || code)}</option>`).join('')
      : '<option value="">접근 가능한 설비 없음</option>';

    els.accessEquipmentGroup.innerHTML = (me?.access || []).map((row) => (
      `<option value="${escapeAttr(row.code)}">${escapeHtml(row.display_name)}</option>`
    )).join('');

    state.currentEquipmentGroup = equipmentCodes[0] || '';
    if (state.currentEquipmentGroup) {
      els.equipmentSelect.value = state.currentEquipmentGroup;
    }

    const kinds = grouped.get(state.currentEquipmentGroup) || new Set();
    if (!kinds.has(state.currentKind)) {
      state.currentKind = kinds.has('SETUP') ? 'SETUP' : (kinds.has('MAINT') ? 'MAINT' : 'SETUP');
    }
    els.kindSelect.value = state.currentKind;
    updateHint();
  }

  function renderAdminPanel(me) {
    const role = me?.user?.role;
    if (role === 'admin' || role === 'editor') {
      els.adminPanel.classList.remove('hidden');
    } else {
      els.adminPanel.classList.add('hidden');
    }
  }

  async function loadChecklist() {
    if (!state.currentEquipmentGroup) {
      renderEmptyChecklist('접근 가능한 설비가 없습니다. 관리자에게 권한을 확인하세요.');
      return;
    }

    const params = new URLSearchParams({
      equipment_group: state.currentEquipmentGroup,
      kind: state.currentKind,
    });

    const data = await api(`/api/checklists/my?${params.toString()}`);
    state.currentChecklist = data;
    state.dirty = false;
    renderChecklist(data);
    updateHint();
  }

  async function guardedReloadChecklist(force = false) {
    if (!force && state.dirty) {
      const ok = window.confirm('저장되지 않은 변경사항이 있습니다. 새로 불러오면 사라집니다. 계속하시겠습니까?');
      if (!ok) {
        syncSelectorsToState();
        return;
      }
    }
    try {
      setLoading(true, '체크리스트를 불러오는 중입니다.');
      adjustKindByAvailability();
      await loadChecklist();
    } catch (error) {
      handleError(error, '체크리스트 재조회 실패');
    } finally {
      setLoading(false);
    }
  }

  function adjustKindByAvailability() {
    const rows = state.available.filter((row) => row.equipment_group_code === state.currentEquipmentGroup);
    const kinds = new Set(rows.map((row) => row.checklist_kind));
    if (!kinds.has(state.currentKind)) {
      state.currentKind = kinds.has('SETUP') ? 'SETUP' : (kinds.has('MAINT') ? 'MAINT' : 'SETUP');
      els.kindSelect.value = state.currentKind;
    }
  }

  function syncSelectorsToState() {
    if (state.currentEquipmentGroup) els.equipmentSelect.value = state.currentEquipmentGroup;
    if (state.currentKind) els.kindSelect.value = state.currentKind;
  }

  function renderChecklist(data) {
    const template = data?.template;
    const sections = Array.isArray(data?.sections) ? data.sections : [];
    const summary = data?.summary || {};
    const responseStatus = data?.response?.response_status || 'NEW';

    els.templateTitle.textContent = template?.template_name || '체크리스트';
    els.templateMeta.textContent = [
      template?.equipment_group_code || '-',
      template?.checklist_kind || '-',
      `문항 ${summary.total_questions ?? 0}개`,
      `버전 ${template?.version_no ?? '-'}`
    ].join(' · ');

    els.overallCompletion.textContent = `${formatPercent(summary.completion_rate || 0)}`;
    els.responseStatus.textContent = responseStatus;

    if (!sections.length) {
      renderEmptyChecklist('표시할 질문이 없습니다. 카탈로그 동기화 또는 템플릿 데이터를 확인하세요.');
      renderSectionProgress([]);
      return;
    }

    els.checklistSections.innerHTML = sections.map((section, sectionIndex) => {
      const summaryText = `${section.summary.checked_questions}/${section.summary.total_questions} · ${formatPercent(section.summary.completion_rate)}`;
      return `
        <section class="section-card" data-section-index="${sectionIndex}" data-section-name="${escapeAttr(section.section_name || 'GENERAL')}">
          <div class="section-card__head">
            <div class="section-card__title-wrap">
              <h3>${escapeHtml(section.section_name || 'GENERAL')}</h3>
              <div class="section-card__meta">${escapeHtml(summaryText)}</div>
            </div>
            <div class="section-card__actions">
              <button class="btn btn--ghost js-section-check-all" type="button">섹션 전체 체크</button>
              <button class="btn btn--ghost js-section-uncheck-all" type="button">섹션 전체 해제</button>
            </div>
          </div>
          <div class="section-card__body">
            ${section.questions.map((question) => `
              <label class="question-row ${question.is_checked ? 'is-checked' : ''}" data-question-code="${escapeAttr(question.question_code)}" data-search="${escapeAttr((question.question_code + ' ' + question.question_text).toLowerCase())}">
                <input
                  class="question-checkbox"
                  type="checkbox"
                  data-question-id="${question.id}"
                  data-question-code="${escapeAttr(question.question_code)}"
                  ${question.is_checked ? 'checked' : ''}
                />
                <div class="question-main">
                  <span class="question-code">${escapeHtml(question.question_code)}</span>
                  <div class="question-text">${escapeHtml(question.question_text)}</div>
                </div>
                <div class="question-state">${question.is_checked ? '완료' : '미완료'}</div>
              </label>
            `).join('')}
          </div>
        </section>
      `;
    }).join('');

    bindRenderedChecklistEvents();
    renderSectionProgress(sections);
    applyQuestionFilters();
  }

  function bindRenderedChecklistEvents() {
    els.checklistSections.querySelectorAll('.question-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', onQuestionToggle);
    });

    els.checklistSections.querySelectorAll('.js-section-check-all').forEach((btn) => {
      btn.addEventListener('click', () => toggleSection(btn, true));
    });

    els.checklistSections.querySelectorAll('.js-section-uncheck-all').forEach((btn) => {
      btn.addEventListener('click', () => toggleSection(btn, false));
    });
  }

  function onQuestionToggle(event) {
    state.dirty = true;
    const checkbox = event.currentTarget;
    const row = checkbox.closest('.question-row');
    row.classList.toggle('is-checked', checkbox.checked);
    row.querySelector('.question-state').textContent = checkbox.checked ? '완료' : '미완료';
    recalcLiveSummary();
    applyQuestionFilters();
  }

  function toggleSection(triggerBtn, checked) {
    const sectionCard = triggerBtn.closest('.section-card');
    sectionCard.querySelectorAll('.question-row:not(.hidden) .question-checkbox').forEach((checkbox) => {
      checkbox.checked = checked;
      const row = checkbox.closest('.question-row');
      row.classList.toggle('is-checked', checked);
      row.querySelector('.question-state').textContent = checked ? '완료' : '미완료';
    });
    state.dirty = true;
    recalcLiveSummary();
    applyQuestionFilters();
  }

  function bulkToggleVisible(checked) {
    els.checklistSections.querySelectorAll('.question-row:not(.hidden) .question-checkbox').forEach((checkbox) => {
      checkbox.checked = checked;
      const row = checkbox.closest('.question-row');
      row.classList.toggle('is-checked', checked);
      row.querySelector('.question-state').textContent = checked ? '완료' : '미완료';
    });
    state.dirty = true;
    recalcLiveSummary();
    applyQuestionFilters();
  }

  function recalcLiveSummary() {
    const sections = [...els.checklistSections.querySelectorAll('.section-card')].map((sectionCard) => {
      const rows = [...sectionCard.querySelectorAll('.question-row')];
      const total = rows.length;
      const checked = rows.filter((row) => row.querySelector('.question-checkbox').checked).length;
      const rate = total ? round1((checked / total) * 100) : 0;
      sectionCard.querySelector('.section-card__meta').textContent = `${checked}/${total} · ${formatPercent(rate)}`;
      return {
        section_name: sectionCard.dataset.sectionName || 'GENERAL',
        summary: {
          total_questions: total,
          checked_questions: checked,
          completion_rate: rate,
        },
      };
    });

    const totalQuestions = sections.reduce((sum, section) => sum + section.summary.total_questions, 0);
    const checkedQuestions = sections.reduce((sum, section) => sum + section.summary.checked_questions, 0);
    const overall = totalQuestions ? round1((checkedQuestions / totalQuestions) * 100) : 0;
    els.overallCompletion.textContent = formatPercent(overall);
    renderSectionProgress(sections);
  }

  function renderSectionProgress(sections) {
    if (!sections.length) {
      els.sectionProgressList.className = 'section-progress-list empty-state-small';
      els.sectionProgressList.textContent = '아직 불러온 데이터가 없습니다.';
      return;
    }

    els.sectionProgressList.className = 'section-progress-list';
    els.sectionProgressList.innerHTML = sections.map((section) => `
      <div class="section-progress-item">
        <div class="section-progress-item__top">
          <span>${escapeHtml(section.section_name || 'GENERAL')}</span>
          <span>${formatPercent(section.summary.completion_rate)} · ${section.summary.checked_questions}/${section.summary.total_questions}</span>
        </div>
        <div class="progress-bar"><span style="width:${section.summary.completion_rate}%;"></span></div>
      </div>
    `).join('');
  }

  function applyQuestionFilters() {
    const q = (els.questionSearch.value || '').trim().toLowerCase();
    const incompleteOnly = els.incompleteOnly.checked;

    els.checklistSections.querySelectorAll('.section-card').forEach((sectionCard) => {
      let visibleCount = 0;
      sectionCard.querySelectorAll('.question-row').forEach((row) => {
        const matchSearch = !q || row.dataset.search.includes(q);
        const checked = row.querySelector('.question-checkbox').checked;
        const matchIncomplete = !incompleteOnly || !checked;
        const visible = matchSearch && matchIncomplete;
        row.classList.toggle('hidden', !visible);
        if (visible) visibleCount += 1;
      });
      sectionCard.classList.toggle('hidden', visibleCount === 0);
    });
  }

  async function saveChecklist(status) {
    if (!state.currentEquipmentGroup) return;
    try {
      setLoading(true, status === 'SUBMITTED' ? '제출 상태로 저장하는 중입니다.' : '저장하는 중입니다.');
      const answers = collectAnswers();
      const payload = {
        equipment_group: state.currentEquipmentGroup,
        kind: state.currentKind,
        response_status: status,
        answers,
      };
      const data = await api('/api/checklists/my', {
        method: 'PUT',
        body: payload,
      });
      state.currentChecklist = data;
      state.dirty = false;
      renderChecklist(data);
      showToast(status === 'SUBMITTED' ? '제출 상태로 저장했습니다.' : '저장했습니다.', 'success');
    } catch (error) {
      handleError(error, '체크리스트 저장 실패');
    } finally {
      setLoading(false);
    }
  }

  function collectAnswers() {
    return [...els.checklistSections.querySelectorAll('.question-checkbox')].map((checkbox) => ({
      question_id: Number(checkbox.dataset.questionId),
      question_code: checkbox.dataset.questionCode,
      is_checked: checkbox.checked,
    }));
  }

  async function loadEngineerAccess() {
    const engineerId = Number(els.accessEngineerId.value);
    if (!engineerId) {
      showToast('Engineer ID를 입력하세요.', 'error');
      return;
    }
    try {
      setLoading(true, '접근 예외를 조회하는 중입니다.');
      const data = await api(`/api/checklists/admin/access?engineer_id=${engineerId}`);
      renderAccessResult(data);
    } catch (error) {
      handleError(error, '접근 예외 조회 실패');
    } finally {
      setLoading(false);
    }
  }

  async function saveEngineerAccess() {
    const engineerId = Number(els.accessEngineerId.value);
    const equipmentGroup = els.accessEquipmentGroup.value;
    const accessType = els.accessType.value;
    const reason = (els.accessReason.value || '').trim();

    if (!engineerId) {
      showToast('Engineer ID를 입력하세요.', 'error');
      return;
    }

    try {
      setLoading(true, '접근 예외를 저장하는 중입니다.');
      const data = await api('/api/checklists/admin/access', {
        method: 'PUT',
        body: {
          engineer_id: engineerId,
          equipment_group: equipmentGroup,
          access_type: accessType,
          reason,
        },
      });
      renderAccessResult(data);
      showToast('접근 예외를 저장했습니다.', 'success');
    } catch (error) {
      handleError(error, '접근 예외 저장 실패');
    } finally {
      setLoading(false);
    }
  }

  function renderAccessResult(data) {
    const engineer = data?.engineer;
    const overrides = Array.isArray(data?.overrides) ? data.overrides : [];
    const finalAccess = Array.isArray(data?.final_access) ? data.final_access : [];

    els.accessResult.className = 'admin__result';
    els.accessResult.innerHTML = `
      <div class="access-result-box">
        <h3>${escapeHtml(engineer?.name || '-')} · ${escapeHtml(engineer?.group || '-')} / ${escapeHtml(engineer?.site || '-')}</h3>
        <p class="muted">현재 override ${overrides.length}건</p>
        <div class="access-chip-list">
          ${finalAccess.map((row) => `
            <span class="access-chip ${row.allowed ? 'access-chip--allow' : 'access-chip--deny'}">
              ${escapeHtml(row.display_name)} · ${row.allowed ? '허용' : '차단'}
            </span>
          `).join('')}
        </div>
        ${overrides.length ? `
          <div class="divider"></div>
          <strong>Override 목록</strong>
          <ul>
            ${overrides.map((row) => `
              <li>${escapeHtml(row.equipment_group_code)} · ${escapeHtml(row.access_type)}${row.reason ? ` · ${escapeHtml(row.reason)}` : ''}</li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  }

  function renderEmptyChecklist(message) {
    els.templateTitle.textContent = '체크리스트';
    els.templateMeta.textContent = '설비와 유형을 선택하세요.';
    els.overallCompletion.textContent = '-';
    els.responseStatus.textContent = '-';
    els.checklistSections.className = 'checklist-sections empty-state';
    els.checklistSections.textContent = message;
  }

  function updateHint() {
    const equipmentLabel = els.equipmentSelect.selectedOptions[0]?.textContent || '-';
    els.screenHint.textContent = `현재 선택: ${equipmentLabel} / ${state.currentKind}. 저장은 ACTIVE, 제출 상태 저장은 SUBMITTED로 기록됩니다.`;
  }

  function setLoading(isLoading, hint = '') {
    [els.reloadBtn, els.saveBtn, els.submitBtn, els.equipmentSelect, els.kindSelect, els.loadAccessBtn, els.saveAccessBtn]
      .filter(Boolean)
      .forEach((el) => { el.disabled = isLoading; });
    if (hint) els.screenHint.textContent = hint;
    else updateHint();
  }

  async function api(path, options = {}) {
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': state.token,
        ...(options.headers || {}),
      },
    };

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(buildUrl(path), config);
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

    if (!response.ok) {
      const error = new Error(data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  function buildUrl(path) {
    const customBase = window.API_BASE_URL || localStorage.getItem('api-base-url');
    if (customBase) return `${customBase.replace(/\/$/, '')}${path}`;

    const { protocol, hostname, port } = window.location;
    if (port === '3001') return path;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001${path}`;
    }
    return `${protocol}//${hostname}:3001${path}`;
  }

  function handleError(error, fallbackMessage) {
    console.error(fallbackMessage, error);
    if (error?.status === 401) {
      alert('로그인 정보가 만료되었거나 유효하지 않습니다. 다시 로그인하세요.');
      logout();
      return;
    }
    showToast(error?.message || fallbackMessage, 'error');
  }

  function logout() {
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('username');
    window.location.replace('./signin.html');
  }

  function showToast(message, tone = 'success') {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.className = `toast toast--${tone}`;
    state.toastTimer = setTimeout(() => {
      els.toast.className = 'toast hidden';
      els.toast.textContent = '';
    }, 2800);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function formatPercent(value) {
    return `${round1(value)}%`;
  }
})();
