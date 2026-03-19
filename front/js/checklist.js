(() => {
  'use strict';

  const state = {
    token: null,
    me: null,
    available: [],
    workspaceFilter: '',
    currentTemplateKey: null,
    currentChecklist: null,
    checklistSearch: '',
    onlyUnchecked: false,
    myRequests: [],
    rejectedRequests: [],
    approvalQueue: [],
    decisionHistory: [],
    approvalDetail: null,
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindEvents();
    state.token = getToken();

    try {
      const me = await api('/api/checklists/me');
      state.me = me;
      renderUserBadge();
      toggleAdminUI();

      await Promise.all([
        loadWorkspace(),
        loadMyRequests(),
        loadRejectedRequests(),
        state.me?.user?.role === 'admin' ? loadApprovalQueue() : Promise.resolve(),
        state.me?.user?.role === 'admin' ? loadDecisionHistory() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error(error);
      showToast(error.message || '체크리스트 화면을 불러오지 못했습니다.', 'danger');
    }
  }

  function cacheElements() {
    Object.assign(els, {
      userBadge: qs('#userBadge'),
      refreshBtn: qs('#refreshBtn'),
      tabBar: qs('#tabBar'),
      workspaceEquipmentFilter: qs('#workspaceEquipmentFilter'),
      workspaceList: qs('#workspaceList'),
      mineStatusFilter: qs('#mineStatusFilter'),
      myRequestList: qs('#myRequestList'),
      rejectedList: qs('#rejectedList'),
      queueEquipmentFilter: qs('#queueEquipmentFilter'),
      approvalQueueList: qs('#approvalQueueList'),
      historyDecisionFilter: qs('#historyDecisionFilter'),
      decisionHistoryList: qs('#decisionHistoryList'),

      checklistModal: qs('#checklistModal'),
      modalEyebrow: qs('#modalEyebrow'),
      modalTitle: qs('#modalTitle'),
      modalMeta: qs('#modalMeta'),
      modalStatusPill: qs('#modalStatusPill'),
      questionSearchInput: qs('#questionSearchInput'),
      onlyUncheckedToggle: qs('#onlyUncheckedToggle'),
      expandAllBtn: qs('#expandAllBtn'),
      collapseAllBtn: qs('#collapseAllBtn'),
      markVisibleBtn: qs('#markVisibleBtn'),
      clearVisibleBtn: qs('#clearVisibleBtn'),
      decisionBanner: qs('#decisionBanner'),
      checklistSections: qs('#checklistSections'),
      modalSummaryText: qs('#modalSummaryText'),
      saveDraftBtn: qs('#saveDraftBtn'),
      submitRequestBtn: qs('#submitRequestBtn'),

      approvalModal: qs('#approvalModal'),
      approvalTitle: qs('#approvalTitle'),
      approvalMeta: qs('#approvalMeta'),
      approvalStatusPill: qs('#approvalStatusPill'),
      approvalEngineer: qs('#approvalEngineer'),
      approvalCompletion: qs('#approvalCompletion'),
      approvalComment: qs('#approvalComment'),
      approvalSections: qs('#approvalSections'),
      approvalDecisionInfo: qs('#approvalDecisionInfo'),
      approveBtn: qs('#approveBtn'),
      rejectBtn: qs('#rejectBtn'),

      toast: qs('#toast'),
    });
  }

  function bindEvents() {
    els.refreshBtn.addEventListener('click', reloadAll);
    els.tabBar.addEventListener('click', onTabClick);
    els.workspaceEquipmentFilter.addEventListener('change', () => {
      state.workspaceFilter = els.workspaceEquipmentFilter.value;
      renderWorkspace();
    });
    els.mineStatusFilter.addEventListener('change', renderMyRequests);
    els.queueEquipmentFilter.addEventListener('change', renderApprovalQueue);
    els.historyDecisionFilter.addEventListener('change', loadDecisionHistory);

    els.questionSearchInput.addEventListener('input', () => {
      state.checklistSearch = els.questionSearchInput.value.trim().toLowerCase();
      renderChecklistSections();
    });
    els.onlyUncheckedToggle.addEventListener('change', () => {
      state.onlyUnchecked = !!els.onlyUncheckedToggle.checked;
      renderChecklistSections();
    });
    els.expandAllBtn.addEventListener('click', () => toggleAllSections(true));
    els.collapseAllBtn.addEventListener('click', () => toggleAllSections(false));
    els.markVisibleBtn.addEventListener('click', () => markVisibleQuestions(true));
    els.clearVisibleBtn.addEventListener('click', () => markVisibleQuestions(false));
    els.saveDraftBtn.addEventListener('click', () => saveCurrentChecklist('ACTIVE'));
    els.submitRequestBtn.addEventListener('click', () => saveCurrentChecklist('SUBMITTED'));

    els.approveBtn.addEventListener('click', () => decideApproval('APPROVED'));
    els.rejectBtn.addEventListener('click', () => decideApproval('REJECTED'));

    document.querySelectorAll('[data-close="checklist"]').forEach((node) => {
      node.addEventListener('click', closeChecklistModal);
    });
    document.querySelectorAll('[data-close="approval"]').forEach((node) => {
      node.addEventListener('click', closeApprovalModal);
    });
  }

  async function reloadAll() {
    try {
      await Promise.all([
        loadWorkspace(),
        loadMyRequests(),
        loadRejectedRequests(),
        state.me?.user?.role === 'admin' ? loadApprovalQueue() : Promise.resolve(),
        state.me?.user?.role === 'admin' ? loadDecisionHistory() : Promise.resolve(),
      ]);
      showToast('목록을 새로고침했습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || '새로고침 중 오류가 발생했습니다.', 'danger');
    }
  }

  function renderUserBadge() {
    const user = state.me?.user || {};
    const engineer = state.me?.engineer || {};
    els.userBadge.textContent = `${user.nickname || '-'} · ${engineer.group || user.group || '-'} / ${engineer.site || user.site || '-'}`;
  }

  function toggleAdminUI() {
    const isAdmin = state.me?.user?.role === 'admin';
    qsa('.admin-only').forEach((node) => node.classList.toggle('hidden', !isAdmin));
  }

  function onTabClick(event) {
    const btn = event.target.closest('.tab-btn');
    if (!btn) return;
    const tab = btn.dataset.tab;
    qsa('.tab-btn').forEach((node) => node.classList.toggle('is-active', node === btn));
    qsa('.tab-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tab));
  }

  async function loadWorkspace() {
    const data = await api('/api/checklists/available');
    state.available = Array.isArray(data?.rows) ? data.rows : [];
    buildEquipmentFilters();
    renderWorkspace();
  }

  function buildEquipmentFilters() {
    const map = new Map();
    state.available.forEach((row) => {
      if (!map.has(row.equipment_group_code)) {
        map.set(row.equipment_group_code, row.equipment_group_name);
      }
    });
    const options = ['<option value="">전체 설비</option>']
      .concat(Array.from(map.entries()).map(([code, name]) => `<option value="${escapeAttr(code)}">${escapeHtml(name)}</option>`))
      .join('');
    els.workspaceEquipmentFilter.innerHTML = options;
    if (els.queueEquipmentFilter) els.queueEquipmentFilter.innerHTML = options;
  }

  function renderWorkspace() {
    const rows = state.available.filter((row) => !state.workspaceFilter || row.equipment_group_code === state.workspaceFilter);
    if (!rows.length) {
      els.workspaceList.innerHTML = emptyBox('접근 가능한 체크리스트가 없습니다.');
      return;
    }

    els.workspaceList.innerHTML = rows.map((row) => {
      const rate = calcRate(row.checked_count, row.question_count);
      const status = row.response_status || 'ACTIVE';
      return `
        <article class="select-card">
          <div class="select-card__top">
            <div>
              <p class="card-kicker">${escapeHtml(row.equipment_group_name)}</p>
              <h3>${escapeHtml(row.template_name)}</h3>
            </div>
            <span class="status-pill status-pill--${status.toLowerCase()}">${escapeHtml(status)}</span>
          </div>
          <div class="select-card__meta">
            <span>${escapeHtml(row.checklist_kind)}</span>
            <span>${rate}%</span>
            <span>${Number(row.checked_count || 0)} / ${Number(row.question_count || 0)}</span>
          </div>
          <div class="mini-bar"><span style="width:${rate}%"></span></div>
          <div class="select-card__actions">
            <button class="btn primary open-checklist-btn"
              data-equipment="${escapeAttr(row.equipment_group_code)}"
              data-kind="${escapeAttr(row.checklist_kind)}">열기</button>
          </div>
        </article>
      `;
    }).join('');

    qsa('.open-checklist-btn', els.workspaceList).forEach((btn) => {
      btn.addEventListener('click', () => openChecklist(btn.dataset.equipment, btn.dataset.kind));
    });
  }

  async function loadMyRequests() {
    const data = await api('/api/checklists/my/requests');
    state.myRequests = Array.isArray(data?.rows) ? data.rows : [];
    renderMyRequests();
  }

  function renderMyRequests() {
    const statusFilter = els.mineStatusFilter.value;
    const rows = state.myRequests.filter((row) => {
      if (row.response_status === 'REJECTED') return false;
      if (!statusFilter) return ['SUBMITTED', 'APPROVED'].includes(row.response_status);
      return row.response_status === statusFilter;
    });
    renderRequestList(els.myRequestList, rows, '요청 이력이 없습니다.', openMyRequestDetail);
  }

  async function loadRejectedRequests() {
    const data = await api('/api/checklists/my/requests?status=REJECTED');
    state.rejectedRequests = Array.isArray(data?.rows) ? data.rows : [];
    renderRequestList(els.rejectedList, state.rejectedRequests, '반려된 체크리스트가 없습니다.', openRejectedFromList, true);
  }

  async function loadApprovalQueue() {
    const data = await api('/api/checklists/admin/requests?status=SUBMITTED');
    state.approvalQueue = Array.isArray(data?.rows) ? data.rows : [];
    renderApprovalQueue();
  }

  function renderApprovalQueue() {
    const equipmentFilter = els.queueEquipmentFilter.value;
    const rows = state.approvalQueue.filter((row) => !equipmentFilter || row.equipment_group_code === equipmentFilter);
    renderAdminList(els.approvalQueueList, rows, '결재 대기 목록이 없습니다.', openApprovalModal);
  }

  async function loadDecisionHistory() {
    const decision = els.historyDecisionFilter?.value || '';
    const data = await api(`/api/checklists/admin/history${decision ? `?decision=${encodeURIComponent(decision)}` : ''}`);
    state.decisionHistory = Array.isArray(data?.rows) ? data.rows : [];
    renderAdminList(els.decisionHistoryList, state.decisionHistory, '내 결재 이력이 없습니다.', openApprovalModal, true);
  }

  function renderRequestList(container, rows, emptyText, clickHandler, emphasizeRejected = false) {
    if (!rows.length) {
      container.innerHTML = emptyBox(emptyText);
      return;
    }
    container.innerHTML = rows.map((row) => {
      const rate = calcRate(row.checked_questions, row.total_questions);
      const dateText = formatDateTime(row.rejected_at || row.approved_at || row.submitted_at || row.updated_at);
      const rejectedClass = emphasizeRejected && row.response_status === 'REJECTED' ? ' is-rejected' : '';
      return `
        <button type="button" class="list-row${rejectedClass}" data-id="${row.response_id}">
          <div class="list-row__left">
            <div class="list-row__title-wrap">
              <strong>${escapeHtml(row.equipment_group_name)} · ${escapeHtml(row.checklist_kind)}</strong>
              <span class="status-pill status-pill--${String(row.response_status).toLowerCase()}">${escapeHtml(row.response_status)}</span>
            </div>
            <p>${escapeHtml(row.template_name)}</p>
            <small>${dateText}</small>
            ${row.decision_comment ? `<div class="list-note">${escapeHtml(row.decision_comment)}</div>` : ''}
          </div>
          <div class="list-row__right">
            <span>${rate}%</span>
            <span>${Number(row.checked_questions || 0)} / ${Number(row.total_questions || 0)}</span>
          </div>
        </button>
      `;
    }).join('');

    qsa('.list-row', container).forEach((node) => {
      node.addEventListener('click', () => clickHandler(Number(node.dataset.id)));
    });
  }

  function renderAdminList(container, rows, emptyText, clickHandler, history = false) {
    if (!rows.length) {
      container.innerHTML = emptyBox(emptyText);
      return;
    }
    container.innerHTML = rows.map((row) => {
      const rate = calcRate(row.checked_questions, row.total_questions);
      const decisionDate = history ? formatDateTime(row.approved_at || row.rejected_at || row.updated_at) : formatDateTime(row.submitted_at || row.updated_at);
      return `
        <button type="button" class="list-row" data-id="${row.response_id}">
          <div class="list-row__left">
            <div class="list-row__title-wrap">
              <strong>${escapeHtml(row.engineer_name)} · ${escapeHtml(row.equipment_group_name)} · ${escapeHtml(row.checklist_kind)}</strong>
              <span class="status-pill status-pill--${String(row.response_status).toLowerCase()}">${escapeHtml(row.response_status)}</span>
            </div>
            <p>${escapeHtml(row.template_name)}</p>
            <small>${decisionDate}</small>
            ${row.decision_comment ? `<div class="list-note">${escapeHtml(row.decision_comment)}</div>` : ''}
          </div>
          <div class="list-row__right">
            <span>${rate}%</span>
            <span>${Number(row.checked_questions || 0)} / ${Number(row.total_questions || 0)}</span>
          </div>
        </button>
      `;
    }).join('');

    qsa('.list-row', container).forEach((node) => {
      node.addEventListener('click', () => clickHandler(Number(node.dataset.id)));
    });
  }

  async function openChecklist(equipment, kind) {
    try {
      state.checklistSearch = '';
      state.onlyUnchecked = false;
      els.questionSearchInput.value = '';
      els.onlyUncheckedToggle.checked = false;
      const data = await api(`/api/checklists/my?equipment_group=${encodeURIComponent(equipment)}&kind=${encodeURIComponent(kind)}`);
      state.currentTemplateKey = `${equipment}__${kind}`;
      state.currentChecklist = data;
      renderChecklistModal();
      openModal(els.checklistModal);
    } catch (error) {
      console.error(error);
      showToast(error.message || '체크리스트를 불러오지 못했습니다.', 'danger');
    }
  }

  function renderChecklistModal() {
    const data = state.currentChecklist;
    if (!data) return;

    const template = data.template || {};
    const response = data.response || {};
    const summary = data.summary || {};
    const permission = data.permission || {};

    els.modalEyebrow.textContent = `${template.equipment_group_name || template.equipment_group_code || ''} · ${template.checklist_kind || ''}`;
    els.modalTitle.textContent = template.template_name || '체크리스트';
    els.modalMeta.textContent = `v${template.version_no || 1}`;
    setStatusPill(els.modalStatusPill, response.response_status || 'ACTIVE');

    const decisionComment = response.decision_comment ? `반려/결재 의견: ${response.decision_comment}` : '';
    const bannerMsg = response.response_status === 'REJECTED'
      ? (decisionComment || '반려된 체크리스트입니다. 수정 후 다시 결재 요청하세요.')
      : response.response_status === 'SUBMITTED'
        ? '결재 요청이 제출되었습니다. 관리자 승인 전까지 수정할 수 없습니다.'
        : response.response_status === 'APPROVED'
          ? '승인 완료된 체크리스트입니다.'
          : '';
    els.decisionBanner.classList.toggle('hidden', !bannerMsg);
    els.decisionBanner.textContent = bannerMsg;
    els.decisionBanner.className = `decision-banner ${bannerMsg ? '' : 'hidden'} ${String(response.response_status || '').toLowerCase()}`.trim();

    els.saveDraftBtn.disabled = !permission.can_edit;
    els.submitRequestBtn.disabled = !permission.can_submit;

    renderChecklistSections();
    els.modalSummaryText.textContent = `${summary.checked_questions || 0} / ${summary.total_questions || 0} 완료 · ${summary.completion_rate || 0}%`;
  }

  function renderChecklistSections() {
    const data = state.currentChecklist;
    if (!data) return;
    const permission = data.permission || {};
    const search = state.checklistSearch;
    const onlyUnchecked = state.onlyUnchecked;

    const renderedSections = (data.sections || []).map((section, sectionIndex) => {
      const visibleQuestions = (section.questions || []).filter((question) => {
        const matchSearch = !search || question.question_text.toLowerCase().includes(search) || String(question.question_code || '').toLowerCase().includes(search);
        const matchUnchecked = !onlyUnchecked || !question.is_checked;
        return matchSearch && matchUnchecked;
      });

      if (!visibleQuestions.length) return '';

      const summary = calcSectionSummary(visibleQuestions);
      return `
        <section class="section-card" data-section-index="${sectionIndex}">
          <button type="button" class="section-card__head" data-toggle-section>
            <div>
              <p>${sectionIndex + 1}. ${escapeHtml(section.section_name)}</p>
              <small>${summary.checked} / ${summary.total} 완료</small>
            </div>
            <div class="section-card__head-right">
              <div class="mini-bar mini-bar--wide"><span style="width:${summary.rate}%"></span></div>
              <strong>${summary.rate}%</strong>
            </div>
          </button>
          <div class="section-card__body is-open">
            ${visibleQuestions.map((question, idx) => `
              <article class="question-card ${question.is_checked ? 'is-checked' : ''}" data-question-id="${question.id}">
                <div class="question-card__meta">
                  <span>${sectionIndex + 1}.${idx + 1}</span>
                  <code>${escapeHtml(question.question_code)}</code>
                </div>
                <p>${escapeHtml(question.question_text)}</p>
                <div class="question-card__actions">
                  <button type="button" class="toggle-chip ${question.is_checked ? 'is-active' : ''}" data-toggle-question="${question.id}" ${permission.can_edit ? '' : 'disabled'}>
                    ${question.is_checked ? '체크됨' : '미체크'}
                  </button>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    }).filter(Boolean);

    if (!renderedSections.length) {
      els.checklistSections.innerHTML = emptyBox('표시할 질문이 없습니다.');
      return;
    }

    els.checklistSections.innerHTML = renderedSections.join('');

    qsa('[data-toggle-section]', els.checklistSections).forEach((btn) => {
      btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        body.classList.toggle('is-open');
      });
    });

    qsa('[data-toggle-question]', els.checklistSections).forEach((btn) => {
      btn.addEventListener('click', () => toggleQuestion(Number(btn.dataset.toggleQuestion)));
    });

    const summary = calcOverallSummary(data.sections || []);
    els.modalSummaryText.textContent = `${summary.checked} / ${summary.total} 완료 · ${summary.rate}%`;
  }

  function toggleQuestion(questionId) {
    if (!state.currentChecklist?.permission?.can_edit) return;
    for (const section of state.currentChecklist.sections || []) {
      const question = (section.questions || []).find((item) => item.id === questionId);
      if (question) {
        question.is_checked = !question.is_checked;
        break;
      }
    }
    renderChecklistSections();
  }

  function toggleAllSections(open) {
    qsa('.section-card__body', els.checklistSections).forEach((body) => {
      body.classList.toggle('is-open', open);
    });
  }

  function markVisibleQuestions(checked) {
    if (!state.currentChecklist?.permission?.can_edit) return;
    const visibleIds = qsa('[data-toggle-question]', els.checklistSections).map((btn) => Number(btn.dataset.toggleQuestion));
    const visibleIdSet = new Set(visibleIds);
    for (const section of state.currentChecklist.sections || []) {
      for (const question of section.questions || []) {
        if (visibleIdSet.has(question.id)) question.is_checked = checked;
      }
    }
    renderChecklistSections();
  }

  async function saveCurrentChecklist(responseStatus) {
    if (!state.currentChecklist) return;
    const template = state.currentChecklist.template || {};
    const answers = flattenAnswers(state.currentChecklist.sections || []);

    try {
      const data = await api('/api/checklists/my', {
        method: 'PUT',
        body: {
          equipment_group: template.equipment_group_code,
          kind: template.checklist_kind,
          response_status: responseStatus,
          answers,
        },
      });
      state.currentChecklist = data;
      renderChecklistModal();
      await Promise.all([
        loadWorkspace(),
        loadMyRequests(),
        loadRejectedRequests(),
      ]);
      showToast(responseStatus === 'SUBMITTED' ? '결재 요청을 보냈습니다.' : '체크리스트를 저장했습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || '저장 중 오류가 발생했습니다.', 'danger');
    }
  }

  async function openMyRequestDetail(responseId) {
    try {
      const data = await api(`/api/checklists/my/requests/${responseId}`);
      state.currentChecklist = data;
      renderChecklistModal();
      openModal(els.checklistModal);
    } catch (error) {
      console.error(error);
      showToast(error.message || '상세 정보를 불러오지 못했습니다.', 'danger');
    }
  }

  async function openRejectedFromList(responseId) {
    try {
      const data = await api(`/api/checklists/my/requests/${responseId}`);
      state.currentChecklist = data;
      renderChecklistModal();
      openModal(els.checklistModal);
    } catch (error) {
      console.error(error);
      showToast(error.message || '반려 상세를 불러오지 못했습니다.', 'danger');
    }
  }

  async function openApprovalModal(responseId) {
    try {
      const data = await api(`/api/checklists/admin/requests/${responseId}`);
      state.approvalDetail = data;
      renderApprovalModal();
      openModal(els.approvalModal);
    } catch (error) {
      console.error(error);
      showToast(error.message || '결재 상세를 불러오지 못했습니다.', 'danger');
    }
  }

  function renderApprovalModal() {
    const data = state.approvalDetail;
    if (!data) return;
    const template = data.template || {};
    const engineer = data.engineer || {};
    const response = data.response || {};
    const summary = data.summary || {};

    els.approvalTitle.textContent = template.template_name || '결재 상세';
    els.approvalMeta.textContent = `${template.equipment_group_name || template.equipment_group_code || '-'} · ${template.checklist_kind || '-'} · v${template.version_no || 1}`;
    setStatusPill(els.approvalStatusPill, response.response_status || '-');
    els.approvalEngineer.textContent = `${engineer.name || '-'} · ${engineer.group || '-'} / ${engineer.site || '-'}`;
    els.approvalCompletion.textContent = `${summary.checked_questions || 0} / ${summary.total_questions || 0} · ${summary.completion_rate || 0}%`;
    els.approvalComment.value = response.decision_comment || '';
    els.approvalDecisionInfo.textContent = response.decision_comment || '승인 또는 반려 의견을 남길 수 있습니다.';

    const canApprove = !!data.permission?.can_approve;
    els.approveBtn.disabled = !canApprove;
    els.rejectBtn.disabled = !canApprove;

    els.approvalSections.innerHTML = (data.sections || []).map((section, idx) => {
      const summary = calcSectionSummary(section.questions || []);
      return `
        <section class="section-card section-card--readonly">
          <div class="section-card__head section-card__head--static">
            <div>
              <p>${idx + 1}. ${escapeHtml(section.section_name)}</p>
              <small>${summary.checked} / ${summary.total} 완료</small>
            </div>
            <div class="section-card__head-right">
              <div class="mini-bar mini-bar--wide"><span style="width:${summary.rate}%"></span></div>
              <strong>${summary.rate}%</strong>
            </div>
          </div>
          <div class="section-card__body is-open">
            ${(section.questions || []).map((question, qIndex) => `
              <article class="question-card ${question.is_checked ? 'is-checked' : ''}">
                <div class="question-card__meta">
                  <span>${idx + 1}.${qIndex + 1}</span>
                  <code>${escapeHtml(question.question_code)}</code>
                </div>
                <p>${escapeHtml(question.question_text)}</p>
                <div class="question-card__actions">
                  <span class="read-state ${question.is_checked ? 'is-checked' : ''}">${question.is_checked ? '체크됨' : '미체크'}</span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    }).join('') || emptyBox('상세 질문이 없습니다.');
  }

  async function decideApproval(decision) {
    if (!state.approvalDetail?.response?.id) return;
    const confirmMsg = decision === 'APPROVED' ? '이 체크리스트를 승인할까요?' : '이 체크리스트를 반려할까요?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api(`/api/checklists/admin/requests/${state.approvalDetail.response.id}/decision`, {
        method: 'POST',
        body: {
          decision,
          comment: els.approvalComment.value.trim(),
        },
      });
      showToast(decision === 'APPROVED' ? '승인했습니다.' : '반려했습니다.', 'success');
      closeApprovalModal();
      await Promise.all([loadApprovalQueue(), loadDecisionHistory(), loadMyRequests(), loadRejectedRequests()]);
    } catch (error) {
      console.error(error);
      showToast(error.message || '결재 처리 중 오류가 발생했습니다.', 'danger');
    }
  }

  function closeChecklistModal() {
    closeModal(els.checklistModal);
  }

  function closeApprovalModal() {
    closeModal(els.approvalModal);
  }

  function openModal(node) {
    node.classList.remove('hidden');
    node.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal(node) {
    node.classList.add('hidden');
    node.setAttribute('aria-hidden', 'true');
    if (qsa('.modal:not(.hidden)').length === 0) {
      document.body.classList.remove('modal-open');
    }
  }

  function flattenAnswers(sections) {
    return (sections || []).flatMap((section) => (section.questions || []).map((question) => ({
      question_id: question.id,
      is_checked: !!question.is_checked,
      note: question.note || null,
    })));
  }

  function calcSectionSummary(questions) {
    const total = questions.length;
    const checked = questions.filter((q) => !!q.is_checked).length;
    const rate = total ? round1((checked / total) * 100) : 0;
    return { total, checked, rate };
  }

  function calcOverallSummary(sections) {
    const allQuestions = (sections || []).flatMap((section) => section.questions || []);
    return calcSectionSummary(allQuestions);
  }

  function calcRate(checked, total) {
    const c = Number(checked || 0);
    const t = Number(total || 0);
    return t ? round1((c / t) * 100) : 0;
  }

  function setStatusPill(node, status) {
    const value = String(status || '-').toUpperCase();
    node.className = `status-pill status-pill--${value.toLowerCase()}`;
    node.textContent = value;
  }

  function emptyBox(text) {
    return `<div class="empty-box">${escapeHtml(text)}</div>`;
  }

  function round1(n) {
    return Math.round(Number(n || 0) * 10) / 10;
  }

  function formatDateTime(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  function getToken() {
    return localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || sessionStorage.getItem('token')
      || sessionStorage.getItem('accessToken')
      || '';
  }

  async function api(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(state.token ? { 'x-access-token': state.token, Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(path, {
      method: options.method || 'GET',
      credentials: 'include',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || json.message || `HTTP ${res.status}`);
    }
    return json;
  }

  function showToast(message, type = 'success') {
    els.toast.textContent = message;
    els.toast.className = `toast ${type}`;
    els.toast.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => els.toast.classList.add('hidden'), 2200);
  }

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
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
})();
