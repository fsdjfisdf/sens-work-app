(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || localStorage.getItem('token') || '',
    me: null,
    availableRows: [],
    currentEquipmentGroup: '',
    currentKind: 'SETUP',
    checklist: null,
    dirty: false,
    collapsedSections: new Set(),
    toastTimer: null,
  };

  const els = {};

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function qs(id) { return document.getElementById(id); }

  function getMissingRequiredElements() {
    const requiredIds = [
      'userBadge',
      'overallCompletion',
      'responseStatus',
      'questionCount',
      'statusBanner',
      'equipmentSelect',
      'kindSelect',
      'questionSearch',
      'incompleteOnly',
      'collapseAllBtn',
      'expandAllBtn',
      'checkAllVisibleBtn',
      'uncheckAllVisibleBtn',
      'reloadBtn',
      'screenHint',
      'profileInfo',
      'availableEquipmentList',
      'sectionProgressList',
      'templateTitle',
      'templateMeta',
      'checklistSections',
      'saveBtn',
      'submitBtn',
      'toast',
    ];

    return requiredIds.filter((id) => !document.getElementById(id));
  }

  async function init() {
    cache();

    const missing = getMissingRequiredElements();
    if (missing.length) {
      console.error('[Checklist] Missing required DOM elements:', missing);
      const msg = `CHECKLIST.html 구조가 checklist.js와 맞지 않습니다. 누락된 id: ${missing.join(', ')}`;
      const toastEl = document.getElementById('toast');
      if (toastEl) {
        toastEl.textContent = msg;
        toastEl.className = 'toast';
      }
      return;
    }

    bind();

    try {
      await loadBootstrap();
      await loadChecklist();
    } catch (error) {
      console.error(error);
      showToast(error.message || '초기 화면 로딩 중 오류가 발생했습니다.', 'danger');
    }
  }

  function cache() {
    Object.assign(els, {
      userBadge: qs('userBadge'),
      approvalLink: qs('approvalLink'),
      overallCompletion: qs('overallCompletion'),
      responseStatus: qs('responseStatus'),
      questionCount: qs('questionCount'),
      statusBanner: qs('statusBanner'),
      equipmentSelect: qs('equipmentSelect'),
      kindSelect: qs('kindSelect'),
      questionSearch: qs('questionSearch'),
      incompleteOnly: qs('incompleteOnly'),
      collapseAllBtn: qs('collapseAllBtn'),
      expandAllBtn: qs('expandAllBtn'),
      checkAllVisibleBtn: qs('checkAllVisibleBtn'),
      uncheckAllVisibleBtn: qs('uncheckAllVisibleBtn'),
      reloadBtn: qs('reloadBtn'),
      screenHint: qs('screenHint'),
      profileInfo: qs('profileInfo'),
      availableEquipmentList: qs('availableEquipmentList'),
      sectionProgressList: qs('sectionProgressList'),
      adminAccessPanel: qs('adminAccessPanel'),
      accessEngineerId: qs('accessEngineerId'),
      accessEquipmentGroup: qs('accessEquipmentGroup'),
      accessType: qs('accessType'),
      accessReason: qs('accessReason'),
      loadAccessBtn: qs('loadAccessBtn'),
      saveAccessBtn: qs('saveAccessBtn'),
      accessResult: qs('accessResult'),
      templateTitle: qs('templateTitle'),
      templateMeta: qs('templateMeta'),
      checklistSections: qs('checklistSections'),
      saveBtn: qs('saveBtn'),
      submitBtn: qs('submitBtn'),
      toast: qs('toast'),
    });
  }

  function bind() {
    els.equipmentSelect.addEventListener('change', async () => {
      state.currentEquipmentGroup = els.equipmentSelect.value;
      await guardedReload();
    });
    els.kindSelect.addEventListener('change', async () => {
      state.currentKind = els.kindSelect.value;
      await guardedReload();
    });
    els.questionSearch.addEventListener('input', applyFilters);
    els.incompleteOnly.addEventListener('change', applyFilters);
    els.reloadBtn.addEventListener('click', () => guardedReload(true));
    els.saveBtn.addEventListener('click', () => saveChecklist('ACTIVE'));
    els.submitBtn.addEventListener('click', () => saveChecklist('SUBMITTED'));
    els.checkAllVisibleBtn.addEventListener('click', () => bulkToggleVisible(true));
    els.uncheckAllVisibleBtn.addEventListener('click', () => bulkToggleVisible(false));
    els.collapseAllBtn.addEventListener('click', () => setAllSectionsCollapsed(true));
    els.expandAllBtn.addEventListener('click', () => setAllSectionsCollapsed(false));
    els.loadAccessBtn?.addEventListener('click', loadEngineerAccess);
    els.saveAccessBtn?.addEventListener('click', saveEngineerAccess);

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
    state.availableRows = Array.isArray(available?.rows) ? available.rows : [];

    renderMe();
    buildSelectors();
    renderAvailableEquipment();
    renderAdminPanel();
  }

  function renderMe() {
    const user = state.me?.user || {};
    const engineer = state.me?.engineer || {};
    els.userBadge.textContent = `${engineer.name || user.nickname || '사용자'} · ${engineer.group || user.group || '-'} / ${engineer.site || user.site || '-'}`;

    els.profileInfo.innerHTML = `
      <dt>이름</dt><dd>${escapeHtml(engineer.name || user.nickname || '-')}</dd>
      <dt>권한</dt><dd>${escapeHtml(user.role || '-')}</dd>
      <dt>GROUP</dt><dd>${escapeHtml(engineer.group || user.group || '-')}</dd>
      <dt>SITE</dt><dd>${escapeHtml(engineer.site || user.site || '-')}</dd>
      <dt>매핑 방식</dt><dd>${escapeHtml(engineer.resolved_by || '-')}</dd>
      <dt>Engineer ID</dt><dd>${engineer.id || '-'}</dd>
    `;
  }

  function buildSelectors() {
    const equipmentMap = new Map();
    state.availableRows.forEach((row) => {
      if (!equipmentMap.has(row.equipment_group_code)) {
        equipmentMap.set(row.equipment_group_code, {
          code: row.equipment_group_code,
          name: row.equipment_group_name || row.equipment_group_code,
        });
      }
    });

    const equipmentItems = [...equipmentMap.values()];
    els.equipmentSelect.innerHTML = equipmentItems.length
      ? equipmentItems.map((item) => `<option value="${escapeAttr(item.code)}">${escapeHtml(item.name)}</option>`).join('')
      : '<option value="">접근 가능한 설비 없음</option>';

    if (!state.currentEquipmentGroup || !equipmentMap.has(state.currentEquipmentGroup)) {
      state.currentEquipmentGroup = equipmentItems[0]?.code || '';
    }
    els.equipmentSelect.value = state.currentEquipmentGroup;

    const allEquipmentOptions = Array.isArray(state.me?.access)
      ? state.me.access.map((row) => `<option value="${escapeAttr(row.code)}">${escapeHtml(row.display_name)}</option>`).join('')
      : '';
    els.accessEquipmentGroup.innerHTML = allEquipmentOptions;
  }

  function renderAvailableEquipment() {
    const access = Array.isArray(state.me?.access) ? state.me.access : [];
    const allowed = access.filter((row) => row.allowed);

    if (!allowed.length) {
      els.availableEquipmentList.className = 'mini-list empty-box';
      els.availableEquipmentList.textContent = '접근 가능한 설비 없음';
      return;
    }

    els.availableEquipmentList.className = 'mini-list';
    els.availableEquipmentList.innerHTML = allowed.map((row) => {
      const templates = state.availableRows.filter((v) => v.equipment_group_code === row.code);
      const kinds = templates.map((v) => v.checklist_kind).sort().join(' / ');
      return `
        <button type="button" class="equipment-chip ${row.code === state.currentEquipmentGroup ? 'is-active' : ''}" data-eq="${escapeAttr(row.code)}">
          <strong>${escapeHtml(row.display_name)}</strong>
          <span>${escapeHtml(kinds || '템플릿 없음')}</span>
        </button>
      `;
    }).join('');

    els.availableEquipmentList.querySelectorAll('.equipment-chip').forEach((btn) => {
      btn.addEventListener('click', async () => {
        els.equipmentSelect.value = btn.dataset.eq;
        state.currentEquipmentGroup = btn.dataset.eq;
        await guardedReload();
      });
    });
  }

  function renderAdminPanel() {
    const role = state.me?.user?.role;
    const isAdmin = role === 'admin';
    const canManageAccess = role === 'admin' || role === 'editor';

    els.adminAccessPanel.classList.toggle('hidden', !canManageAccess);
    els.approvalLink.classList.toggle('hidden', !isAdmin);
  }

  async function guardedReload(force = false) {
    if (!force && state.dirty) {
      const proceed = window.confirm('저장되지 않은 변경사항이 있습니다. 계속 이동할까요?');
      if (!proceed) {
        els.equipmentSelect.value = state.currentEquipmentGroup;
        els.kindSelect.value = state.currentKind;
        return;
      }
    }
    await loadChecklist();
  }

  async function loadChecklist() {
    if (!state.currentEquipmentGroup) {
      els.checklistSections.className = 'empty-box empty-box--lg';
      els.checklistSections.textContent = '접근 가능한 설비가 없습니다.';
      return;
    }

    els.kindSelect.value = state.currentKind;
    setToolbarDisabled(true);
    setStatusBanner('체크리스트를 불러오는 중입니다.', 'loading');

    try {
      const data = await api(`/api/checklists/my?equipment_group=${encodeURIComponent(state.currentEquipmentGroup)}&kind=${encodeURIComponent(state.currentKind)}`);
      state.checklist = data;
      state.dirty = false;
      state.collapsedSections.clear();

      renderChecklist();
      updateSummary();
      applyFilters();
    } finally {
      setToolbarDisabled(false);
    }
  }

  function renderChecklist() {
    const data = state.checklist;
    const template = data?.template;
    const response = data?.response;
    const permission = data?.permission || {};
    const status = response?.response_status || 'ACTIVE';

    els.templateTitle.textContent = `${template?.equipment_group_code || '-'} · ${template?.checklist_kind || '-'} Checklist`;
    els.templateMeta.textContent = `${template?.template_name || ''} ${template?.version_no ? `(v${template.version_no})` : ''}`;

    if (!data?.sections?.length) {
      els.checklistSections.className = 'empty-box empty-box--lg';
      els.checklistSections.textContent = '표시할 질문이 없습니다.';
      updateStatusBanner(status, permission, response);
      updateActionButtons(status, permission);
      return;
    }

    els.checklistSections.className = 'section-stack';
    els.checklistSections.innerHTML = data.sections.map((section, idx) => renderSection(section, idx + 1)).join('');

    els.checklistSections.querySelectorAll('.section-head').forEach((head) => {
      head.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const code = head.dataset.sectionCode;
        toggleSection(code);
      });
    });

    els.checklistSections.querySelectorAll('.question-check').forEach((checkbox) => {
      checkbox.addEventListener('change', handleQuestionToggle);
    });

    els.checklistSections.querySelectorAll('.js-section-check-all').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSectionQuestions(btn.dataset.sectionCode, true);
      });
    });
    els.checklistSections.querySelectorAll('.js-section-uncheck-all').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSectionQuestions(btn.dataset.sectionCode, false);
      });
    });

    updateStatusBanner(status, permission, response);
    updateActionButtons(status, permission);
  }

  function renderSection(section, index) {
    const percent = Number(section?.summary?.completion_rate || 0);
    const questions = section.questions.map((q, qIndex) => `
      <label class="question-card ${q.is_checked ? 'is-checked' : ''}" data-question-row>
        <input class="question-check" type="checkbox" data-question-id="${q.id}" ${q.is_checked ? 'checked' : ''} />
        <div class="question-copy">
          <div class="question-meta">
            <span class="question-index">${index}.${qIndex + 1}</span>
            <span class="question-code">${escapeHtml(q.question_code)}</span>
            <span class="question-state">${q.is_checked ? '완료' : '미완료'}</span>
          </div>
          <div class="question-text">${escapeHtml(q.question_text)}</div>
        </div>
      </label>
    `).join('');

    return `
      <article class="section-card ${state.collapsedSections.has(section.section_code) ? 'is-collapsed' : ''}" data-section-code="${escapeAttr(section.section_code)}">
        <div class="section-head" data-section-code="${escapeAttr(section.section_code)}">
          <div class="section-head__left">
            <span class="section-chip">${index}</span>
            <div>
              <h3>${escapeHtml(section.section_name)}</h3>
              <p>${section.summary.checked_questions}/${section.summary.total_questions} 완료</p>
            </div>
          </div>

          <div class="section-head__right">
            <div class="section-bar"><span style="width:${percent}%"></span></div>
            <strong>${percent}%</strong>
            <button type="button" class="btn btn--line btn--sm js-section-check-all" data-section-code="${escapeAttr(section.section_code)}">전체 체크</button>
            <button type="button" class="btn btn--line btn--sm js-section-uncheck-all" data-section-code="${escapeAttr(section.section_code)}">전체 해제</button>
          </div>
        </div>
        <div class="section-body">
          ${questions}
        </div>
      </article>
    `;
  }

  function handleQuestionToggle(event) {
    const checkbox = event.currentTarget;
    const card = checkbox.closest('.question-card');
    card.classList.toggle('is-checked', checkbox.checked);
    const stateEl = card.querySelector('.question-state');
    if (stateEl) stateEl.textContent = checkbox.checked ? '완료' : '미완료';
    state.dirty = true;
    updateSummaryFromDom();
    applyFilters();
  }

  function updateSummary() {
    const summary = state.checklist?.summary || { completion_rate: 0, checked_questions: 0, total_questions: 0 };
    els.overallCompletion.textContent = `${summary.completion_rate || 0}%`;
    els.responseStatus.textContent = state.checklist?.response?.response_status || 'ACTIVE';
    els.questionCount.textContent = `${summary.checked_questions || 0} / ${summary.total_questions || 0}`;

    const sections = state.checklist?.sections || [];
    if (!sections.length) {
      els.sectionProgressList.className = 'section-progress-stack empty-box';
      els.sectionProgressList.textContent = '아직 불러온 데이터가 없습니다.';
      return;
    }

    els.sectionProgressList.className = 'section-progress-stack';
    els.sectionProgressList.innerHTML = sections.map((section) => `
      <div class="progress-card">
        <div class="progress-card__top">
          <strong>${escapeHtml(section.section_name)}</strong>
          <span>${section.summary.completion_rate}%</span>
        </div>
        <div class="section-bar"><span style="width:${section.summary.completion_rate}%"></span></div>
        <p>${section.summary.checked_questions}/${section.summary.total_questions} 완료</p>
      </div>
    `).join('');
  }

  function updateSummaryFromDom() {
    const sectionEls = [...els.checklistSections.querySelectorAll('.section-card')];
    let totalQuestions = 0;
    let totalChecked = 0;
    const sectionSummaries = [];

    sectionEls.forEach((sectionEl) => {
      const rows = [...sectionEl.querySelectorAll('.question-card')];
      const checked = rows.filter((row) => row.querySelector('.question-check').checked).length;
      const total = rows.length;
      const percent = total ? Math.round((checked / total) * 1000) / 10 : 0;
      totalQuestions += total;
      totalChecked += checked;

      const code = sectionEl.dataset.sectionCode;
      const title = sectionEl.querySelector('h3')?.textContent || code;
      sectionSummaries.push({
        code,
        title,
        checked,
        total,
        percent,
      });

      const strong = sectionEl.querySelector('.section-head__right strong');
      if (strong) strong.textContent = `${percent}%`;
      const p = sectionEl.querySelector('.section-head__left p');
      if (p) p.textContent = `${checked}/${total} 완료`;
      const bar = sectionEl.querySelector('.section-bar span');
      if (bar) bar.style.width = `${percent}%`;
    });

    const overall = totalQuestions ? Math.round((totalChecked / totalQuestions) * 1000) / 10 : 0;
    els.overallCompletion.textContent = `${overall}%`;
    els.questionCount.textContent = `${totalChecked} / ${totalQuestions}`;

    els.sectionProgressList.className = 'section-progress-stack';
    els.sectionProgressList.innerHTML = sectionSummaries.map((section) => `
      <div class="progress-card">
        <div class="progress-card__top">
          <strong>${escapeHtml(section.title)}</strong>
          <span>${section.percent}%</span>
        </div>
        <div class="section-bar"><span style="width:${section.percent}%"></span></div>
        <p>${section.checked}/${section.total} 완료</p>
      </div>
    `).join('');
  }

  function updateStatusBanner(status, permission, response) {
    const comment = response?.decision_comment ? `사유: ${response.decision_comment}` : '';
    if (status === 'SUBMITTED') {
      setStatusBanner('결재 요청이 제출되었습니다. 관리자 승인 전까지 수정할 수 없습니다.', 'submitted');
    } else if (status === 'APPROVED') {
      setStatusBanner(`승인 완료된 체크리스트입니다. ${comment}`.trim(), 'approved');
    } else if (status === 'REJECTED') {
      setStatusBanner(`반려된 체크리스트입니다. 수정 후 다시 결재 요청하세요. ${comment}`.trim(), 'rejected');
    } else {
      setStatusBanner(permission?.can_submit
        ? '질문을 체크한 뒤 임시 저장 또는 결재 요청을 진행할 수 있습니다.'
        : '현재 상태에서는 수정할 수 없습니다.', 'idle');
    }
  }

  function updateActionButtons(status, permission) {
    const canEdit = !!permission?.can_edit;
    const canSubmit = !!permission?.can_submit;

    els.saveBtn.disabled = !canEdit;
    els.submitBtn.disabled = !canSubmit;
    els.questionSearch.disabled = false;
    els.incompleteOnly.disabled = false;

    els.checklistSections.querySelectorAll('.question-check').forEach((el) => {
      el.disabled = !canEdit;
    });

    els.checklistSections.querySelectorAll('.js-section-check-all, .js-section-uncheck-all').forEach((el) => {
      el.disabled = !canEdit;
    });
  }

  function applyFilters() {
    const keyword = (els.questionSearch.value || '').trim().toLowerCase();
    const incompleteOnly = els.incompleteOnly.checked;

    const sections = [...els.checklistSections.querySelectorAll('.section-card')];
    sections.forEach((section) => {
      let visibleCount = 0;
      section.querySelectorAll('.question-card').forEach((card) => {
        const text = (card.innerText || '').toLowerCase();
        const isChecked = card.querySelector('.question-check').checked;
        const matched = (!keyword || text.includes(keyword)) && (!incompleteOnly || !isChecked);
        card.classList.toggle('hidden', !matched);
        if (matched) visibleCount += 1;
      });
      section.classList.toggle('hidden-by-filter', visibleCount === 0);
    });

    const visibleQuestions = els.checklistSections.querySelectorAll('.question-card:not(.hidden)').length;
    els.screenHint.textContent = `현재 보이는 질문 ${visibleQuestions}개`;
  }

  function toggleSection(code) {
    const card = els.checklistSections.querySelector(`.section-card[data-section-code="${CSS.escape(code)}"]`);
    if (!card) return;
    const isCollapsed = card.classList.toggle('is-collapsed');
    if (isCollapsed) state.collapsedSections.add(code);
    else state.collapsedSections.delete(code);
  }

  function setAllSectionsCollapsed(collapsed) {
    els.checklistSections.querySelectorAll('.section-card').forEach((card) => {
      card.classList.toggle('is-collapsed', collapsed);
      const code = card.dataset.sectionCode;
      if (collapsed) state.collapsedSections.add(code);
      else state.collapsedSections.delete(code);
    });
  }

  function setSectionQuestions(sectionCode, checked) {
    const section = els.checklistSections.querySelector(`.section-card[data-section-code="${CSS.escape(sectionCode)}"]`);
    if (!section) return;

    section.querySelectorAll('.question-card:not(.hidden) .question-check').forEach((checkbox) => {
      if (checkbox.disabled) return;
      checkbox.checked = checked;
      const card = checkbox.closest('.question-card');
      card.classList.toggle('is-checked', checked);
      const stateEl = card.querySelector('.question-state');
      if (stateEl) stateEl.textContent = checked ? '완료' : '미완료';
    });

    state.dirty = true;
    updateSummaryFromDom();
    applyFilters();
  }

  function bulkToggleVisible(checked) {
    els.checklistSections.querySelectorAll('.question-card:not(.hidden) .question-check').forEach((checkbox) => {
      if (checkbox.disabled) return;
      checkbox.checked = checked;
      const card = checkbox.closest('.question-card');
      card.classList.toggle('is-checked', checked);
      const stateEl = card.querySelector('.question-state');
      if (stateEl) stateEl.textContent = checked ? '완료' : '미완료';
    });
    state.dirty = true;
    updateSummaryFromDom();
    applyFilters();
  }

  async function saveChecklist(nextStatus) {
    if (!state.checklist?.template) return;

    const payload = {
      equipment_group: state.currentEquipmentGroup,
      kind: state.currentKind,
      response_status: nextStatus,
      answers: collectAnswersFromDom(),
    };

    const message = nextStatus === 'SUBMITTED'
      ? '현재 체크 상태로 결재 요청을 보낼까요? 제출 후에는 승인 전까지 수정할 수 없습니다.'
      : '현재 체크 상태를 저장할까요?';

    const ok = window.confirm(message);
    if (!ok) return;

    setToolbarDisabled(true);
    try {
      const saved = await api('/api/checklists/my', {
        method: 'PUT',
        body: payload,
      });
      state.checklist = saved;
      state.dirty = false;
      renderChecklist();
      updateSummary();
      applyFilters();
      showToast(nextStatus === 'SUBMITTED' ? '결재 요청을 보냈습니다.' : '체크리스트를 저장했습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || '저장 중 오류가 발생했습니다.', 'danger');
    } finally {
      setToolbarDisabled(false);
    }
  }

  function collectAnswersFromDom() {
    return [...els.checklistSections.querySelectorAll('.question-check')].map((checkbox) => ({
      question_id: Number(checkbox.dataset.questionId),
      is_checked: checkbox.checked,
    }));
  }

  async function loadEngineerAccess() {
    const engineerId = Number(els.accessEngineerId.value);
    if (!engineerId) {
      showToast('Engineer ID를 입력하세요.', 'danger');
      return;
    }

    try {
      const data = await api(`/api/checklists/admin/access?engineer_id=${engineerId}`);
      const overrides = Array.isArray(data?.overrides) ? data.overrides : [];
      if (!overrides.length) {
        els.accessResult.className = 'empty-box empty-box--sm';
        els.accessResult.textContent = '예외 설정이 없습니다.';
        return;
      }

      els.accessResult.className = 'access-list';
      els.accessResult.innerHTML = overrides.map((row) => `
        <div class="access-item">
          <strong>${escapeHtml(row.equipment_group_code)}</strong>
          <span>${escapeHtml(row.access_type)}</span>
          <p>${escapeHtml(row.reason || '-')}</p>
        </div>
      `).join('');
    } catch (error) {
      console.error(error);
      showToast(error.message || '예외 조회 중 오류가 발생했습니다.', 'danger');
    }
  }

  async function saveEngineerAccess() {
    const payload = {
      engineer_id: Number(els.accessEngineerId.value),
      equipment_group: els.accessEquipmentGroup.value,
      access_type: els.accessType.value,
      reason: els.accessReason.value.trim(),
    };

    if (!payload.engineer_id || !payload.equipment_group) {
      showToast('Engineer ID와 설비 그룹을 확인하세요.', 'danger');
      return;
    }

    try {
      await api('/api/checklists/admin/access', {
        method: 'PUT',
        body: payload,
      });
      showToast('접근 예외를 저장했습니다.', 'success');
      await loadEngineerAccess();
    } catch (error) {
      console.error(error);
      showToast(error.message || '접근 예외 저장 중 오류가 발생했습니다.', 'danger');
    }
  }

  function setToolbarDisabled(disabled) {
    [els.reloadBtn, els.saveBtn, els.submitBtn, els.checkAllVisibleBtn, els.uncheckAllVisibleBtn, els.collapseAllBtn, els.expandAllBtn]
      .forEach((btn) => { if (btn) btn.disabled = disabled; });
  }

  function setStatusBanner(message, type = 'idle') {
    els.statusBanner.className = `status-banner status-banner--${type}`;
    els.statusBanner.textContent = message;
  }

  async function api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(state.token ? { 'x-access-token': state.token, Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error || data?.message || '요청 처리 실패');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function showToast(message, type = 'success') {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.className = `toast toast--${type}`;
    state.toast.classList?.remove('hidden');
    state.toastTimer = setTimeout(() => {
      els.toast.classList.add('hidden');
    }, 2600);
  }

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(v) {
    return escapeHtml(v).replace(/"/g, '&quot;');
  }
})();
