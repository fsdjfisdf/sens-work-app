(() => {
  'use strict';

  const state = {
    me: null,
    available: [],
    myRequests: [],
    adminQueue: [],
    adminHistory: [],
    accessDetail: null,
    checklistPayload: null,
    checklistMode: 'edit',
    detailPayload: null,
    detailMode: 'view',
    filters: {
      workspace: { equipment: '', kind: '', search: '' },
      requests: { status: '', equipment: '', kind: '', search: '' },
      rejected: { equipment: '', kind: '', search: '' },
      queue: { status: 'SUBMITTED', group: '', site: '', equipment: '', kind: '', search: '' },
      history: { decision: '', group: '', site: '', equipment: '', kind: '', search: '' },
    },
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindElements();
    bindEvents();
    try {
      const meData = await api('/api/checklists/me');
      state.me = meData;
      renderUserBadge();
      toggleRoleUI();
      await reloadAll();
    } catch (err) {
      console.error(err);
      showToast(err.message || '체크리스트 화면을 불러오지 못했습니다.', 'danger');
    }
  }

  function bindElements() {
    const ids = [
      'userBadge','refreshBtn','tabBar',
      'workspaceEquipmentFilter','workspaceKindFilter','workspaceSearch','workspaceList',
      'requestsStatusFilter','requestsEquipmentFilter','requestsKindFilter','requestsSearch','requestsList',
      'rejectedEquipmentFilter','rejectedKindFilter','rejectedSearch','rejectedList',
      'queueStatusFilter','queueGroupFilter','queueSiteFilter','queueEquipmentFilter','queueKindFilter','queueSearch','queueList',
      'historyDecisionFilter','historyGroupFilter','historySiteFilter','historyEquipmentFilter','historyKindFilter','historySearch','historyList',
      'accessEngineerId','loadAccessBtn','accessSummary','accessCurrentList','accessEquipmentSelect','accessTypeSelect','accessReasonInput','saveAccessBtn',
      'checklistModal','checklistModalEyebrow','checklistModalTitle','checklistModalMeta','checklistModalStatus','modalSearchInput','modalOnlyUnchecked','modalExpandBtn','modalCollapseBtn','modalMarkVisibleBtn','modalClearVisibleBtn','modalNotice','modalSections','modalFooterInfo','modalSaveBtn','modalSubmitBtn',
      'detailModal','detailModalEyebrow','detailModalTitle','detailModalMeta','detailModalStatus','detailDecisionBox','detailDecisionComment','detailDecisionInfo','detailSections','detailFooterInfo','detailFooterActions','detailRejectBtn','detailApproveBtn',
      'toast'
    ];
    ids.forEach(id => { els[id] = document.getElementById(id); });
  }

  function bindEvents() {
    els.refreshBtn.addEventListener('click', reloadAll);
    els.tabBar.addEventListener('click', onTabClick);

    bindFilter('workspaceEquipmentFilter', 'workspace', 'equipment', renderWorkspace);
    bindFilter('workspaceKindFilter', 'workspace', 'kind', renderWorkspace);
    bindFilter('workspaceSearch', 'workspace', 'search', renderWorkspace, 'input');

    bindFilter('requestsStatusFilter', 'requests', 'status', renderRequests);
    bindFilter('requestsEquipmentFilter', 'requests', 'equipment', renderRequests);
    bindFilter('requestsKindFilter', 'requests', 'kind', renderRequests);
    bindFilter('requestsSearch', 'requests', 'search', renderRequests, 'input');

    bindFilter('rejectedEquipmentFilter', 'rejected', 'equipment', renderRejected);
    bindFilter('rejectedKindFilter', 'rejected', 'kind', renderRejected);
    bindFilter('rejectedSearch', 'rejected', 'search', renderRejected, 'input');

    bindFilter('queueStatusFilter', 'queue', 'status', loadAdminQueue);
    bindFilter('queueGroupFilter', 'queue', 'group', renderQueue);
    bindFilter('queueSiteFilter', 'queue', 'site', renderQueue);
    bindFilter('queueEquipmentFilter', 'queue', 'equipment', renderQueue);
    bindFilter('queueKindFilter', 'queue', 'kind', renderQueue);
    bindFilter('queueSearch', 'queue', 'search', renderQueue, 'input');

    bindFilter('historyDecisionFilter', 'history', 'decision', loadAdminHistory);
    bindFilter('historyGroupFilter', 'history', 'group', renderHistory);
    bindFilter('historySiteFilter', 'history', 'site', renderHistory);
    bindFilter('historyEquipmentFilter', 'history', 'equipment', renderHistory);
    bindFilter('historyKindFilter', 'history', 'kind', renderHistory);
    bindFilter('historySearch', 'history', 'search', renderHistory, 'input');

    els.loadAccessBtn.addEventListener('click', loadAccessDetail);
    els.saveAccessBtn.addEventListener('click', saveAccessOverride);

    els.workspaceList.addEventListener('click', onWorkspaceClick);
    els.requestsList.addEventListener('click', onRequestsClick);
    els.rejectedList.addEventListener('click', onRejectedClick);
    els.queueList.addEventListener('click', onQueueClick);
    els.historyList.addEventListener('click', onHistoryClick);
    els.accessCurrentList.addEventListener('click', onAccessListClick);

    document.querySelectorAll('[data-close="checklist"]').forEach(n => n.addEventListener('click', closeChecklistModal));
    document.querySelectorAll('[data-close="detail"]').forEach(n => n.addEventListener('click', closeDetailModal));

    els.modalSearchInput.addEventListener('input', renderChecklistSections);
    els.modalOnlyUnchecked.addEventListener('change', renderChecklistSections);
    els.modalExpandBtn.addEventListener('click', () => setAllSectionOpen(true, els.modalSections));
    els.modalCollapseBtn.addEventListener('click', () => setAllSectionOpen(false, els.modalSections));
    els.modalMarkVisibleBtn.addEventListener('click', () => toggleVisibleQuestions(true));
    els.modalClearVisibleBtn.addEventListener('click', () => toggleVisibleQuestions(false));
    els.modalSections.addEventListener('change', onChecklistAnswerChange);
    els.modalSaveBtn.addEventListener('click', () => submitChecklist('ACTIVE'));
    els.modalSubmitBtn.addEventListener('click', () => submitChecklist('SUBMITTED'));

    els.detailRejectBtn.addEventListener('click', () => decideChecklist('REJECTED'));
    els.detailApproveBtn.addEventListener('click', () => decideChecklist('APPROVED'));
  }

  function bindFilter(id, group, key, callback, eventName = 'change') {
    els[id].addEventListener(eventName, () => {
      state.filters[group][key] = els[id].value.trim();
      callback();
    });
  }

  async function reloadAll() {
    try {
      await Promise.all([
        loadAvailable(),
        loadMyRequests(),
        isAdmin() ? loadAdminQueue() : Promise.resolve(),
        isAdmin() ? loadAdminHistory() : Promise.resolve(),
      ]);
      showToast('새로고침되었습니다.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || '데이터를 불러오지 못했습니다.', 'danger');
    }
  }

  async function loadAvailable() {
    const data = await api('/api/checklists/available');
    state.available = Array.isArray(data.rows) ? data.rows : [];
    hydrateEquipmentOptions();
    renderWorkspace();
  }

  async function loadMyRequests() {
    const data = await api('/api/checklists/my/requests');
    state.myRequests = Array.isArray(data.rows) ? data.rows : [];
    hydrateRequestOptions();
    renderRequests();
    renderRejected();
  }

  async function loadAdminQueue() {
    if (!isAdmin()) return;
    const params = new URLSearchParams();
    if (state.filters.queue.status) params.set('status', state.filters.queue.status);
    const data = await api(`/api/checklists/admin/requests${params.toString() ? `?${params.toString()}` : ''}`);
    state.adminQueue = Array.isArray(data.rows) ? data.rows : [];
    hydrateQueueOptions();
    renderQueue();
  }

  async function loadAdminHistory() {
    if (!isAdmin()) return;
    const params = new URLSearchParams();
    if (state.filters.history.decision) params.set('decision', state.filters.history.decision);
    const data = await api(`/api/checklists/admin/history${params.toString() ? `?${params.toString()}` : ''}`);
    state.adminHistory = Array.isArray(data.rows) ? data.rows : [];
    hydrateHistoryOptions();
    renderHistory();
  }

  function renderUserBadge() {
    const user = state.me?.user || {};
    const engineer = state.me?.engineer || {};
    els.userBadge.textContent = `${user.nickname || '-'} · ${engineer.group || user.group || '-'} / ${engineer.site || user.site || '-'}`;
  }

  function toggleRoleUI() {
    document.querySelectorAll('.admin-only').forEach(node => node.classList.toggle('hidden', !isAdmin()));
    document.querySelectorAll('.admin-manage-only').forEach(node => node.classList.toggle('hidden', !canManageAccess()));
  }

  function onTabClick(e) {
    const btn = e.target.closest('.cl-tab');
    if (!btn) return;
    const tab = btn.dataset.tab;
    document.querySelectorAll('.cl-tab').forEach(node => node.classList.toggle('is-active', node === btn));
    document.querySelectorAll('.cl-panel').forEach(node => node.classList.toggle('is-active', node.dataset.panel === tab));
  }

  function hydrateEquipmentOptions() {
    const options = buildOptionsFromRows(state.available, 'equipment_group_code', 'equipment_group_name', true);
    els.workspaceEquipmentFilter.innerHTML = options;
    els.accessEquipmentSelect.innerHTML = buildOptionsFromRows(state.available, 'equipment_group_code', 'equipment_group_name', false);
  }

  function hydrateRequestOptions() {
    const options = buildOptionsFromRows(state.myRequests, 'equipment_group_code', 'equipment_group_name', true);
    els.requestsEquipmentFilter.innerHTML = options;
    els.rejectedEquipmentFilter.innerHTML = options;
  }

  function hydrateQueueOptions() {
    els.queueGroupFilter.innerHTML = buildOptionsFromRows(state.adminQueue, 'engineer_group', 'engineer_group', true, '전체 그룹');
    els.queueSiteFilter.innerHTML = buildOptionsFromRows(state.adminQueue, 'engineer_site', 'engineer_site', true, '전체 사이트');
    els.queueEquipmentFilter.innerHTML = buildOptionsFromRows(state.adminQueue, 'equipment_group_code', 'equipment_group_name', true);
  }

  function hydrateHistoryOptions() {
    els.historyGroupFilter.innerHTML = buildOptionsFromRows(state.adminHistory, 'engineer_group', 'engineer_group', true, '전체 그룹');
    els.historySiteFilter.innerHTML = buildOptionsFromRows(state.adminHistory, 'engineer_site', 'engineer_site', true, '전체 사이트');
    els.historyEquipmentFilter.innerHTML = buildOptionsFromRows(state.adminHistory, 'equipment_group_code', 'equipment_group_name', true);
  }

  function renderWorkspace() {
    const f = state.filters.workspace;
    const rows = state.available.filter(row => {
      if (f.equipment && row.equipment_group_code !== f.equipment) return false;
      if (f.kind && row.checklist_kind !== f.kind) return false;
      if (f.search && !matchesSearch(row, f.search, ['equipment_group_name','template_name','checklist_kind'])) return false;
      return true;
    });
    if (!rows.length) {
      els.workspaceList.innerHTML = emptyBox('표시할 체크리스트가 없습니다.');
      return;
    }
    els.workspaceList.innerHTML = rows.map(row => {
      const rate = calcRate(row.checked_count, row.question_count);
      return `
        <article class="select-card">
          <div class="select-card__head">
            <div>
              <p class="kicker">${escapeHtml(row.equipment_group_name || row.equipment_group_code)}</p>
              <h3>${escapeHtml(row.template_name)}</h3>
            </div>
            <span class="status-chip status-chip--${statusClass(row.response_status || 'ACTIVE')}">${escapeHtml(row.response_status || 'ACTIVE')}</span>
          </div>
          <div class="meta-row">
            <span>${escapeHtml(row.checklist_kind)}</span>
            <span>${Number(row.checked_count || 0)} / ${Number(row.question_count || 0)}</span>
            <span>${rate}%</span>
          </div>
          <div class="progress"><span style="width:${rate}%"></span></div>
          <div class="card-actions">
            <button class="btn btn-primary js-open-checklist" type="button" data-equipment="${escapeAttr(row.equipment_group_code)}" data-kind="${escapeAttr(row.checklist_kind)}">체크하기</button>
          </div>
        </article>`;
    }).join('');
  }

  function renderRequests() {
    const f = state.filters.requests;
    const rows = state.myRequests.filter(row => row.response_status !== 'REJECTED').filter(row => {
      if (f.status && row.response_status !== f.status) return false;
      if (f.equipment && row.equipment_group_code !== f.equipment) return false;
      if (f.kind && row.checklist_kind !== f.kind) return false;
      if (f.search && !matchesSearch(row, f.search, ['equipment_group_name','template_name','checklist_kind','decision_comment'])) return false;
      return true;
    });
    els.requestsList.innerHTML = renderRequestStack(rows, '요청 내역이 없습니다.', false);
  }

  function renderRejected() {
    const f = state.filters.rejected;
    const rows = state.myRequests.filter(row => row.response_status === 'REJECTED').filter(row => {
      if (f.equipment && row.equipment_group_code !== f.equipment) return false;
      if (f.kind && row.checklist_kind !== f.kind) return false;
      if (f.search && !matchesSearch(row, f.search, ['equipment_group_name','template_name','decision_comment'])) return false;
      return true;
    });
    els.rejectedList.innerHTML = renderRequestStack(rows, '반려된 체크리스트가 없습니다.', true);
  }

  function renderRequestStack(rows, emptyText, allowRewrite) {
    if (!rows.length) return emptyBox(emptyText);
    return rows.map(row => {
      const rate = calcRate(row.checked_questions, row.total_questions);
      const dateLabel = row.response_status === 'APPROVED' ? '승인일' : row.response_status === 'SUBMITTED' ? '제출일' : '수정일';
      const dateValue = formatDate(row.approved_at || row.submitted_at || row.updated_at);
      return `
        <article class="list-card">
          <div class="list-card__main">
            <div class="list-card__title-row">
              <div>
                <p class="kicker">${escapeHtml(row.equipment_group_name)}</p>
                <h3>${escapeHtml(row.template_name)}</h3>
              </div>
              <span class="status-chip status-chip--${statusClass(row.response_status)}">${escapeHtml(row.response_status)}</span>
            </div>
            <div class="meta-row">
              <span>${escapeHtml(row.checklist_kind)}</span>
              <span>${Number(row.checked_questions || 0)} / ${Number(row.total_questions || 0)}</span>
              <span>${rate}%</span>
              <span>${dateLabel} ${escapeHtml(dateValue)}</span>
            </div>
            ${row.decision_comment ? `<div class="comment-box">${escapeHtml(row.decision_comment)}</div>` : ''}
          </div>
          <div class="list-card__actions">
            <button class="btn js-view-my-request" type="button" data-response-id="${row.response_id}">상세</button>
            ${allowRewrite ? `<button class="btn btn-primary js-rewrite-request" type="button" data-equipment="${escapeAttr(row.equipment_group_code)}" data-kind="${escapeAttr(row.checklist_kind)}">재작성</button>` : ''}
          </div>
        </article>`;
    }).join('');
  }

  function renderQueue() {
    const f = state.filters.queue;
    const rows = state.adminQueue.filter(row => {
      if (f.group && row.engineer_group !== f.group) return false;
      if (f.site && row.engineer_site !== f.site) return false;
      if (f.equipment && row.equipment_group_code !== f.equipment) return false;
      if (f.kind && row.checklist_kind !== f.kind) return false;
      if (f.search && !matchesSearch(row, f.search, ['engineer_name','equipment_group_name','template_name','engineer_group','engineer_site'])) return false;
      return true;
    });
    if (!rows.length) {
      els.queueList.innerHTML = emptyBox('조건에 맞는 결재 대기 이력이 없습니다.');
      return;
    }
    els.queueList.innerHTML = rows.map(row => queueCard(row, 'js-open-approval')).join('');
  }

  function renderHistory() {
    const f = state.filters.history;
    const rows = state.adminHistory.filter(row => {
      if (f.group && row.engineer_group !== f.group) return false;
      if (f.site && row.engineer_site !== f.site) return false;
      if (f.equipment && row.equipment_group_code !== f.equipment) return false;
      if (f.kind && row.checklist_kind !== f.kind) return false;
      if (f.search && !matchesSearch(row, f.search, ['engineer_name','equipment_group_name','template_name','engineer_group','engineer_site'])) return false;
      return true;
    });
    if (!rows.length) {
      els.historyList.innerHTML = emptyBox('내 결재 이력이 없습니다.');
      return;
    }
    els.historyList.innerHTML = rows.map(row => queueCard(row, 'js-open-history')).join('');
  }

  function queueCard(row, btnClass) {
    const rate = calcRate(row.checked_questions, row.total_questions);
    return `
      <article class="list-card list-card--approval">
        <div class="list-card__main">
          <div class="list-card__title-row">
            <div>
              <p class="kicker">${escapeHtml(row.engineer_group || '-')} / ${escapeHtml(row.engineer_site || '-')}</p>
              <h3>${escapeHtml(row.engineer_name || '-')} · ${escapeHtml(row.template_name)}</h3>
            </div>
            <span class="status-chip status-chip--${statusClass(row.response_status)}">${escapeHtml(row.response_status)}</span>
          </div>
          <div class="meta-row">
            <span>${escapeHtml(row.equipment_group_name)}</span>
            <span>${escapeHtml(row.checklist_kind)}</span>
            <span>${Number(row.checked_questions || 0)} / ${Number(row.total_questions || 0)}</span>
            <span>${rate}%</span>
            <span>${escapeHtml(formatDate(row.submitted_at || row.approved_at || row.rejected_at || row.updated_at))}</span>
          </div>
          ${row.decision_comment ? `<div class="comment-box">${escapeHtml(row.decision_comment)}</div>` : ''}
        </div>
        <div class="list-card__actions">
          <button class="btn btn-primary ${btnClass}" type="button" data-response-id="${row.response_id}">열기</button>
        </div>
      </article>`;
  }

  async function onWorkspaceClick(e) {
    const btn = e.target.closest('.js-open-checklist');
    if (!btn) return;
    await openChecklist(btn.dataset.equipment, btn.dataset.kind);
  }

  async function onRequestsClick(e) {
    const detailBtn = e.target.closest('.js-view-my-request');
    if (!detailBtn) return;
    await openMyRequestDetail(detailBtn.dataset.responseId);
  }

  async function onRejectedClick(e) {
    const detailBtn = e.target.closest('.js-view-my-request');
    if (detailBtn) {
      await openMyRequestDetail(detailBtn.dataset.responseId);
      return;
    }
    const rewriteBtn = e.target.closest('.js-rewrite-request');
    if (!rewriteBtn) return;
    await openChecklist(rewriteBtn.dataset.equipment, rewriteBtn.dataset.kind);
  }

  async function onQueueClick(e) {
    const btn = e.target.closest('.js-open-approval');
    if (!btn) return;
    await openApprovalDetail(btn.dataset.responseId);
  }

  async function onHistoryClick(e) {
    const btn = e.target.closest('.js-open-history');
    if (!btn) return;
    await openApprovalDetail(btn.dataset.responseId, true);
  }

  async function openChecklist(equipmentGroup, kind) {
    try {
      const payload = await api(`/api/checklists/my?equipment_group=${encodeURIComponent(equipmentGroup)}&kind=${encodeURIComponent(kind)}`);
      state.checklistPayload = payload;
      state.checklistMode = 'edit';
      populateChecklistModal();
      openModal(els.checklistModal);
    } catch (err) {
      console.error(err);
      showToast(err.message || '체크리스트를 불러오지 못했습니다.', 'danger');
    }
  }

  async function openMyRequestDetail(responseId) {
    try {
      const payload = await api(`/api/checklists/my/requests/${responseId}`);
      state.detailPayload = payload;
      state.detailMode = 'view';
      populateDetailModal();
      openModal(els.detailModal);
    } catch (err) {
      console.error(err);
      showToast(err.message || '상세를 불러오지 못했습니다.', 'danger');
    }
  }

  async function openApprovalDetail(responseId, historyOnly = false) {
    try {
      const payload = await api(`/api/checklists/admin/requests/${responseId}`);
      state.detailPayload = payload;
      state.detailMode = historyOnly ? 'history' : 'approve';
      populateDetailModal();
      openModal(els.detailModal);
    } catch (err) {
      console.error(err);
      showToast(err.message || '결재 상세를 불러오지 못했습니다.', 'danger');
    }
  }

  function populateChecklistModal() {
    const payload = state.checklistPayload;
    if (!payload) return;
    els.checklistModalEyebrow.textContent = `${payload.template?.equipment_group_name || payload.template?.equipment_group_code || '-'} · ${payload.template?.checklist_kind || '-'}`;
    els.checklistModalTitle.textContent = payload.template?.template_name || '체크리스트';
    els.checklistModalMeta.textContent = `${payload.engineer?.name || '-'} · ${payload.engineer?.group || '-'} / ${payload.engineer?.site || '-'}`;
    els.checklistModalStatus.textContent = payload.response?.response_status || 'ACTIVE';
    els.checklistModalStatus.className = `status-chip status-chip--${statusClass(payload.response?.response_status || 'ACTIVE')}`;
    const comment = payload.response?.decision_comment;
    if (comment && payload.response?.response_status === 'REJECTED') {
      els.modalNotice.textContent = `반려 사유: ${comment}`;
      els.modalNotice.classList.remove('hidden');
    } else if (payload.response?.response_status === 'SUBMITTED') {
      els.modalNotice.textContent = '결재 대기 중이라 수정할 수 없습니다.';
      els.modalNotice.classList.remove('hidden');
    } else if (payload.response?.response_status === 'APPROVED') {
      els.modalNotice.textContent = '승인 완료된 체크리스트입니다.';
      els.modalNotice.classList.remove('hidden');
    } else {
      els.modalNotice.classList.add('hidden');
      els.modalNotice.textContent = '';
    }
    const canEdit = !!payload.permission?.can_edit;
    els.modalSaveBtn.disabled = !canEdit;
    els.modalSubmitBtn.disabled = !payload.permission?.can_submit;
    els.modalSearchInput.value = '';
    els.modalOnlyUnchecked.checked = false;
    renderChecklistSections();
  }

  function renderChecklistSections() {
    const payload = state.checklistPayload;
    if (!payload) return;
    const search = els.modalSearchInput.value.trim().toLowerCase();
    const onlyUnchecked = els.modalOnlyUnchecked.checked;
    const canEdit = !!payload.permission?.can_edit;
    const sections = (payload.sections || []).map(section => {
      const questions = (section.questions || []).filter(q => {
        if (search && !(String(q.question_text || '').toLowerCase().includes(search) || String(q.question_code || '').toLowerCase().includes(search))) return false;
        if (onlyUnchecked && q.is_checked) return false;
        return true;
      });
      return { ...section, filteredQuestions: questions };
    }).filter(section => section.filteredQuestions.length > 0);

    if (!sections.length) {
      els.modalSections.innerHTML = emptyBox('조건에 맞는 질문이 없습니다.');
      els.modalFooterInfo.textContent = summaryText(payload.summary);
      return;
    }

    els.modalSections.innerHTML = sections.map((section, idx) => {
      const checked = section.filteredQuestions.filter(q => q.is_checked).length;
      const total = section.filteredQuestions.length;
      return `
        <section class="cl-accordion ${idx === 0 ? 'is-open' : ''}" data-section>
          <button class="cl-accordion__head" type="button" data-accordion-toggle>
            <div>
              <strong>${escapeHtml(section.section_name)}</strong>
              <span>${checked} / ${total}</span>
            </div>
            <span class="accordion-arrow">▾</span>
          </button>
          <div class="cl-accordion__body">
            ${section.filteredQuestions.map(q => `
              <label class="question-row ${q.is_checked ? 'is-checked' : ''}">
                <input type="checkbox" data-question-id="${q.id}" ${q.is_checked ? 'checked' : ''} ${!canEdit ? 'disabled' : ''} />
                <div class="question-row__text">
                  <span class="question-row__code">${escapeHtml(q.question_code)}</span>
                  <strong>${escapeHtml(q.question_text)}</strong>
                </div>
              </label>`).join('')}
          </div>
        </section>`;
    }).join('');

    els.modalSections.querySelectorAll('[data-accordion-toggle]').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('[data-section]').classList.toggle('is-open'));
    });

    const currentSummary = calcSummaryFromPayload(payload);
    els.modalFooterInfo.textContent = summaryText(currentSummary);
  }

  function onChecklistAnswerChange(e) {
    const input = e.target.closest('input[type="checkbox"][data-question-id]');
    if (!input || !state.checklistPayload) return;
    const qid = Number(input.dataset.questionId);
    for (const section of state.checklistPayload.sections || []) {
      const q = (section.questions || []).find(item => item.id === qid);
      if (q) {
        q.is_checked = input.checked;
        break;
      }
    }
    input.closest('.question-row')?.classList.toggle('is-checked', input.checked);
    els.modalFooterInfo.textContent = summaryText(calcSummaryFromPayload(state.checklistPayload));
  }

  function setAllSectionOpen(isOpen, container) {
    container.querySelectorAll('[data-section]').forEach(sec => sec.classList.toggle('is-open', isOpen));
  }

  function toggleVisibleQuestions(nextChecked) {
    const canEdit = !!state.checklistPayload?.permission?.can_edit;
    if (!canEdit) return;
    els.modalSections.querySelectorAll('input[type="checkbox"][data-question-id]').forEach(input => {
      input.checked = nextChecked;
      const qid = Number(input.dataset.questionId);
      for (const section of state.checklistPayload.sections || []) {
        const q = (section.questions || []).find(item => item.id === qid);
        if (q) q.is_checked = nextChecked;
      }
      input.closest('.question-row')?.classList.toggle('is-checked', nextChecked);
    });
    els.modalFooterInfo.textContent = summaryText(calcSummaryFromPayload(state.checklistPayload));
  }

  async function submitChecklist(responseStatus) {
    try {
      const payload = state.checklistPayload;
      if (!payload) return;
      const body = {
        equipment_group: payload.template?.equipment_group_code,
        kind: payload.template?.checklist_kind,
        response_status: responseStatus,
        answers: flattenAnswers(payload.sections),
      };
      const result = await api('/api/checklists/my', { method: 'PUT', body });
      state.checklistPayload = result;
      populateChecklistModal();
      await Promise.all([loadAvailable(), loadMyRequests()]);
      if (isAdmin()) await Promise.all([loadAdminQueue(), loadAdminHistory()]);
      showToast(responseStatus === 'SUBMITTED' ? '결재 요청되었습니다.' : '저장되었습니다.', 'success');
      if (responseStatus === 'SUBMITTED') closeChecklistModal();
    } catch (err) {
      console.error(err);
      showToast(err.message || '저장 중 오류가 발생했습니다.', 'danger');
    }
  }

  function populateDetailModal() {
    const payload = state.detailPayload;
    if (!payload) return;
    els.detailModalEyebrow.textContent = `${payload.template?.equipment_group_name || payload.template?.equipment_group_code || '-'} · ${payload.template?.checklist_kind || '-'}`;
    els.detailModalTitle.textContent = payload.template?.template_name || '상세';
    els.detailModalMeta.textContent = `${payload.engineer?.name || '-'} · ${payload.engineer?.group || '-'} / ${payload.engineer?.site || '-'}`;
    els.detailModalStatus.textContent = payload.response?.response_status || '-';
    els.detailModalStatus.className = `status-chip status-chip--${statusClass(payload.response?.response_status || 'ACTIVE')}`;
    els.detailFooterInfo.textContent = summaryText(payload.summary);

    if (payload.response?.decision_comment) {
      els.detailDecisionInfo.textContent = `결재 의견: ${payload.response.decision_comment}`;
      els.detailDecisionInfo.classList.remove('hidden');
    } else {
      els.detailDecisionInfo.textContent = '';
      els.detailDecisionInfo.classList.add('hidden');
    }

    const canApprove = state.detailMode === 'approve' && !!payload.permission?.can_approve;
    els.detailDecisionBox.classList.toggle('hidden', !canApprove);
    els.detailRejectBtn.classList.toggle('hidden', !canApprove);
    els.detailApproveBtn.classList.toggle('hidden', !canApprove);
    els.detailDecisionComment.value = payload.response?.decision_comment || '';

    els.detailSections.innerHTML = (payload.sections || []).map(section => `
      <section class="cl-accordion is-open" data-section>
        <button class="cl-accordion__head" type="button" data-accordion-toggle>
          <div>
            <strong>${escapeHtml(section.section_name)}</strong>
            <span>${Number(section.summary?.checked_questions || 0)} / ${Number(section.summary?.total_questions || 0)}</span>
          </div>
          <span class="accordion-arrow">▾</span>
        </button>
        <div class="cl-accordion__body">
          ${(section.questions || []).map(q => `
            <div class="question-row question-row--readonly ${q.is_checked ? 'is-checked' : ''}">
              <div class="readonly-check ${q.is_checked ? 'is-on' : ''}">${q.is_checked ? '✓' : ''}</div>
              <div class="question-row__text">
                <span class="question-row__code">${escapeHtml(q.question_code)}</span>
                <strong>${escapeHtml(q.question_text)}</strong>
              </div>
            </div>`).join('')}
        </div>
      </section>`).join('');

    els.detailSections.querySelectorAll('[data-accordion-toggle]').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('[data-section]').classList.toggle('is-open'));
    });
  }

  async function decideChecklist(decision) {
    try {
      const responseId = state.detailPayload?.response?.id;
      if (!responseId) return;
      const comment = els.detailDecisionComment.value.trim();
      await api(`/api/checklists/admin/requests/${responseId}/decision`, {
        method: 'POST',
        body: { decision, comment },
      });
      showToast(decision === 'APPROVED' ? '승인 완료' : '반려 완료', 'success');
      closeDetailModal();
      await Promise.all([loadMyRequests(), loadAdminQueue(), loadAdminHistory()]);
    } catch (err) {
      console.error(err);
      showToast(err.message || '결재 처리 중 오류가 발생했습니다.', 'danger');
    }
  }

  async function loadAccessDetail() {
    const engineerId = Number(els.accessEngineerId.value);
    if (!engineerId) {
      showToast('Engineer ID를 입력하세요.', 'warning');
      return;
    }
    try {
      const data = await api(`/api/checklists/admin/access?engineer_id=${engineerId}`);
      state.accessDetail = data;
      renderAccessDetail();
    } catch (err) {
      console.error(err);
      showToast(err.message || '예외 권한 정보를 불러오지 못했습니다.', 'danger');
    }
  }

  function renderAccessDetail() {
    const data = state.accessDetail;
    if (!data?.engineer) {
      els.accessSummary.innerHTML = emptyBox('불러온 엔지니어 정보가 없습니다.');
      els.accessCurrentList.innerHTML = '';
      return;
    }
    els.accessSummary.innerHTML = `
      <div class="engineer-summary">
        <strong>${escapeHtml(data.engineer.name)}</strong>
        <span>ID ${data.engineer.id}</span>
        <span>${escapeHtml(data.engineer.group || '-')} / ${escapeHtml(data.engineer.site || '-')}</span>
      </div>`;

    const defaultMap = new Map((data.default_access || []).map(row => [row.code, row.allowed]));
    const overrideMap = new Map((data.overrides || []).map(row => [row.equipment_group_code, row]));
    els.accessCurrentList.innerHTML = (data.final_access || []).map(row => {
      const override = overrideMap.get(row.code);
      return `
        <article class="list-card list-card--compact">
          <div class="list-card__main">
            <div class="list-card__title-row">
              <h3>${escapeHtml(row.display_name)}</h3>
              <span class="status-chip ${row.allowed ? 'status-chip--approved' : 'status-chip--rejected'}">${row.allowed ? '허용' : '차단'}</span>
            </div>
            <div class="meta-row">
              <span>기본 권한 ${defaultMap.get(row.code) ? '허용' : '차단'}</span>
              <span>${override ? `예외 ${escapeHtml(override.access_type)}` : '예외 없음'}</span>
              <span>${override?.reason ? escapeHtml(override.reason) : ''}</span>
            </div>
          </div>
          <div class="list-card__actions">
            ${override ? `<button class="btn js-delete-access" type="button" data-equipment="${escapeAttr(row.code)}">예외 삭제</button>` : ''}
          </div>
        </article>`;
    }).join('');
  }

  async function saveAccessOverride() {
    const engineerId = Number(els.accessEngineerId.value);
    if (!engineerId) {
      showToast('먼저 Engineer ID를 입력하세요.', 'warning');
      return;
    }
    try {
      await api('/api/checklists/admin/access', {
        method: 'PUT',
        body: {
          engineer_id: engineerId,
          equipment_group: els.accessEquipmentSelect.value,
          access_type: els.accessTypeSelect.value,
          reason: els.accessReasonInput.value.trim(),
        },
      });
      showToast('예외 권한이 저장되었습니다.', 'success');
      els.accessReasonInput.value = '';
      await loadAccessDetail();
    } catch (err) {
      console.error(err);
      showToast(err.message || '예외 권한 저장에 실패했습니다.', 'danger');
    }
  }

  async function onAccessListClick(e) {
    const btn = e.target.closest('.js-delete-access');
    if (!btn) return;
    const engineerId = Number(els.accessEngineerId.value);
    if (!engineerId) return;
    try {
      await api(`/api/checklists/admin/access/${engineerId}/${encodeURIComponent(btn.dataset.equipment)}`, { method: 'DELETE' });
      showToast('예외 권한이 삭제되었습니다.', 'success');
      await loadAccessDetail();
    } catch (err) {
      console.error(err);
      showToast(err.message || '예외 권한 삭제에 실패했습니다.', 'danger');
    }
  }

  function closeChecklistModal() {
    closeModal(els.checklistModal);
    state.checklistPayload = null;
  }

  function closeDetailModal() {
    closeModal(els.detailModal);
    state.detailPayload = null;
  }

  function openModal(node) {
    node.classList.remove('hidden');
    node.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal(node) {
    node.classList.add('hidden');
    node.setAttribute('aria-hidden', 'true');
    if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
      document.body.classList.remove('modal-open');
    }
  }

  async function api(path, options = {}) {
    const token = getToken();
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'x-access-token': token, Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(path, {
      method: options.method || 'GET',
      credentials: 'include',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.message || `HTTP ${res.status}`);
    return json;
  }

  function getToken() {
    return localStorage.getItem('x-access-token')
      || sessionStorage.getItem('x-access-token')
      || localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || sessionStorage.getItem('token')
      || sessionStorage.getItem('accessToken')
      || '';
  }

  function isAdmin() { return state.me?.user?.role === 'admin'; }
  function canManageAccess() { return ['admin', 'editor'].includes(state.me?.user?.role); }

  function calcRate(checked, total) {
    const c = Number(checked || 0), t = Number(total || 0);
    if (!t) return 0;
    return Math.round((c / t) * 1000) / 10;
  }

  function calcSummaryFromPayload(payload) {
    const questions = flattenAnswers(payload.sections);
    const total = questions.length;
    const checked = questions.filter(row => row.is_checked).length;
    return { total_questions: total, checked_questions: checked, completion_rate: calcRate(checked, total) };
  }

  function summaryText(summary) {
    return `완료 ${Number(summary.checked_questions || 0)} / ${Number(summary.total_questions || 0)} · ${Number(summary.completion_rate || 0)}%`;
  }

  function flattenAnswers(sections) {
    return (sections || []).flatMap(section => (section.questions || []).map(q => ({
      question_id: q.id,
      question_code: q.question_code,
      is_checked: !!q.is_checked,
      note: q.note || null,
    })));
  }

  function buildOptionsFromRows(rows, codeKey, nameKey, includeAll = true, allLabel = '전체 설비') {
    const map = new Map();
    (rows || []).forEach(row => {
      const code = row[codeKey];
      const name = row[nameKey] || row[codeKey];
      if (code && !map.has(code)) map.set(code, name);
    });
    const opts = [];
    if (includeAll) opts.push(`<option value="">${escapeHtml(allLabel)}</option>`);
    for (const [code, name] of map.entries()) {
      opts.push(`<option value="${escapeAttr(code)}">${escapeHtml(name)}</option>`);
    }
    return opts.join('');
  }

  function matchesSearch(row, rawSearch, keys) {
    const search = String(rawSearch || '').trim().toLowerCase();
    if (!search) return true;
    return keys.some(key => String(row[key] || '').toLowerCase().includes(search));
  }

  function formatDate(value) {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return String(value);
    }
  }

  function pad(v) { return String(v).padStart(2, '0'); }

  function statusClass(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'APPROVED') return 'approved';
    if (s === 'REJECTED') return 'rejected';
    if (s === 'SUBMITTED') return 'submitted';
    return 'idle';
  }

  function emptyBox(message) {
    return `<div class="empty-box">${escapeHtml(message)}</div>`;
  }

  function showToast(message, tone = 'info') {
    clearTimeout(showToast._timer);
    els.toast.textContent = message;
    els.toast.className = `toast toast--${tone}`;
    els.toast.classList.remove('hidden');
    showToast._timer = setTimeout(() => els.toast.classList.add('hidden'), 2800);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function escapeAttr(value) { return escapeHtml(value); }
})();
