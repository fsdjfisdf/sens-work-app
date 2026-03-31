(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || localStorage.getItem('token') || '',
    me: null,
    availableRows: [],
    currentStatus: 'SUBMITTED',
    queue: [],
    selectedId: null,
    toastTimer: null,
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  function qs(id) { return document.getElementById(id); }

  async function init() {
    cache();
    bind();

    try {
      const [me, available] = await Promise.all([
        api('/api/checklists/me'),
        api('/api/checklists/available'),
      ]);
      state.me = me;
      state.availableRows = Array.isArray(available?.rows) ? available.rows : [];

      const role = me?.user?.role;
      els.userBadge.textContent = `${me?.engineer?.name || me?.user?.nickname || '사용자'} · ${role || '-'}`;
      if (role !== 'admin') {
        document.body.innerHTML = '<div style="padding:40px;font-family:system-ui">관리자만 접근할 수 있습니다.</div>';
        return;
      }

      renderEquipmentFilter();
      updateTabs();
      await loadCounts();
      await loadQueue();
    } catch (error) {
      console.error(error);
      showToast(error.message || '결재 화면 초기화 중 오류가 발생했습니다.', 'danger');
    }
  }

  function cache() {
    Object.assign(els, {
      userBadge: qs('userBadge'),
      submittedCount: qs('submittedCount'),
      rejectedCount: qs('rejectedCount'),
      approvedCount: qs('approvedCount'),
      equipmentFilter: qs('equipmentFilter'),
      kindFilter: qs('kindFilter'),
      keywordInput: qs('keywordInput'),
      reloadBtn: qs('reloadBtn'),
      queueCountBadge: qs('queueCountBadge'),
      queueList: qs('queueList'),
      detailTitle: qs('detailTitle'),
      detailMeta: qs('detailMeta'),
      detailStatusPill: qs('detailStatusPill'),
      detailEngineer: qs('detailEngineer'),
      detailEquipment: qs('detailEquipment'),
      detailCompletion: qs('detailCompletion'),
      detailComment: qs('detailComment'),
      decisionComment: qs('decisionComment'),
      approveBtn: qs('approveBtn'),
      rejectBtn: qs('rejectBtn'),
      detailSections: qs('detailSections'),
      toast: qs('toast'),
      tabs: [...document.querySelectorAll('.status-tab')],
    });
  }

  function bind() {
    const reloadAll = async () => {
      state.selectedId = null;
      await loadCounts();
      await loadQueue();
    };

    els.tabs.forEach((tab) => {
      tab.addEventListener('click', async () => {
        if (state.currentStatus === tab.dataset.status) return;
        state.currentStatus = tab.dataset.status;
        state.selectedId = null;
        updateTabs();
        await loadQueue();
      });
    });

    els.equipmentFilter.addEventListener('change', reloadAll);
    els.kindFilter.addEventListener('change', reloadAll);
    els.keywordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') reloadAll();
    });
    els.reloadBtn.addEventListener('click', reloadAll);
    els.approveBtn.addEventListener('click', () => decide('APPROVED'));
    els.rejectBtn.addEventListener('click', () => decide('REJECTED'));
  }

  function renderEquipmentFilter() {
    const map = new Map();
    state.availableRows.forEach((row) => {
      if (!map.has(row.equipment_group_code)) {
        map.set(row.equipment_group_code, row.equipment_group_name || row.equipment_group_code);
      }
    });

    const options = ['<option value="">전체</option>'];
    [...map.entries()].forEach(([code, name]) => {
      options.push(`<option value="${escapeAttr(code)}">${escapeHtml(name)}</option>`);
    });
    els.equipmentFilter.innerHTML = options.join('');
  }

  function updateTabs() {
    els.tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.status === state.currentStatus);
    });
  }

  async function loadCounts() {
    const statuses = ['SUBMITTED', 'REJECTED', 'APPROVED'];
    const results = await Promise.all(statuses.map((status) => fetchQueue(status)));
    const countMap = new Map(results.map((result, index) => [statuses[index], Array.isArray(result?.rows) ? result.rows.length : 0]));

    els.submittedCount.textContent = countMap.get('SUBMITTED') || 0;
    els.rejectedCount.textContent = countMap.get('REJECTED') || 0;
    els.approvedCount.textContent = countMap.get('APPROVED') || 0;

    results.forEach((result) => mergeEquipmentOptions(Array.isArray(result?.rows) ? result.rows : []));
  }

  async function fetchQueue(status) {
    const params = new URLSearchParams();
    params.set('status', status);
    if (els.equipmentFilter.value) params.set('equipment_group', els.equipmentFilter.value);
    if (els.kindFilter.value) params.set('kind', els.kindFilter.value);
    if (els.keywordInput.value.trim()) params.set('keyword', els.keywordInput.value.trim());
    return api(`/api/checklists/admin/requests?${params.toString()}`);
  }

  async function loadQueue() {
    setBusy(true);
    try {
      const data = await fetchQueue(state.currentStatus);
      state.queue = Array.isArray(data?.rows) ? data.rows : [];
      mergeEquipmentOptions(state.queue);
      renderQueue();

      if (state.selectedId && state.queue.some((row) => row.response_id === state.selectedId)) {
        await loadDetail(state.selectedId);
      } else if (state.queue[0]) {
        await loadDetail(state.queue[0].response_id);
      } else {
        clearDetail();
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || '결재 목록 조회 중 오류가 발생했습니다.', 'danger');
    } finally {
      setBusy(false);
    }
  }

  function mergeEquipmentOptions(rows) {
    const existing = new Map([...els.equipmentFilter.options].map((option) => [option.value, option.textContent]));
    rows.forEach((row) => {
      if (!existing.has(row.equipment_group_code)) {
        existing.set(row.equipment_group_code, row.equipment_group_name || row.equipment_group_code);
      }
    });

    const currentValue = els.equipmentFilter.value;
    const options = ['<option value="">전체</option>'];
    [...existing.entries()].filter(([value]) => value).sort((a, b) => a[1].localeCompare(b[1], 'ko')).forEach(([code, name]) => {
      options.push(`<option value="${escapeAttr(code)}">${escapeHtml(name)}</option>`);
    });
    els.equipmentFilter.innerHTML = options.join('');
    els.equipmentFilter.value = currentValue;
  }

  function renderQueue() {
    els.queueCountBadge.textContent = `${state.queue.length}건`;

    if (!state.queue.length) {
      els.queueList.className = 'queue-list empty-box';
      els.queueList.textContent = '해당 조건의 체크리스트가 없습니다.';
      return;
    }

    els.queueList.className = 'queue-list';
    els.queueList.innerHTML = state.queue.map((row) => {
      const percent = row.total_questions
        ? Math.round((Number(row.checked_questions || 0) / Number(row.total_questions || 0)) * 1000) / 10
        : 0;
      const when = row.approved_at || row.rejected_at || row.submitted_at || row.updated_at;

      return `
        <button type="button" class="queue-item ${row.response_id === state.selectedId ? 'is-active' : ''}" data-id="${row.response_id}">
          <div class="queue-item__top">
            <strong>${escapeHtml(row.engineer_name || '-')}</strong>
            <span class="status-pill status-pill--${String(row.response_status || '').toLowerCase()}">${escapeHtml(getStatusText(row.response_status))}</span>
          </div>
          <p>${escapeHtml(row.equipment_group_name || row.equipment_group_code || '-')} · ${escapeHtml(row.checklist_kind || '-')}</p>
          <div class="mini-bar"><span style="width:${percent}%"></span></div>
          <div class="queue-item__meta">
            <span>${percent}%</span>
            <span>${escapeHtml(formatDateTime(when))}</span>
          </div>
        </button>
      `;
    }).join('');

    els.queueList.querySelectorAll('.queue-item').forEach((button) => {
      button.addEventListener('click', async () => {
        await loadDetail(Number(button.dataset.id));
      });
    });
  }

  async function loadDetail(responseId) {
    if (!responseId) return;
    try {
      const data = await api(`/api/checklists/admin/requests/${responseId}`);
      state.selectedId = responseId;
      renderQueue();
      renderDetail(data);
    } catch (error) {
      console.error(error);
      showToast(error.message || '상세 조회 중 오류가 발생했습니다.', 'danger');
    }
  }

  function renderDetail(data) {
    const template = data?.template || {};
    const engineer = data?.engineer || {};
    const response = data?.response || {};
    const summary = data?.summary || {};

    els.detailTitle.textContent = template.template_name || '상세 정보';
    els.detailMeta.textContent = `${template.equipment_group_name || template.equipment_group_code || '-'} · ${template.checklist_kind || '-'} · v${template.version_no || 1}`;
    els.detailStatusPill.className = `status-pill status-pill--${String(response.response_status || '').toLowerCase()}`;
    els.detailStatusPill.textContent = getStatusText(response.response_status || '-');

    els.detailEngineer.textContent = `${engineer.name || '-'} · ${engineer.group || '-'} / ${engineer.site || '-'}`;
    els.detailEquipment.textContent = `${template.equipment_group_name || template.equipment_group_code || '-'} / ${template.checklist_kind || '-'}`;
    els.detailCompletion.textContent = `${summary.completion_rate || 0}% (${summary.checked_questions || 0}/${summary.total_questions || 0})`;
    els.detailComment.textContent = response.decision_comment || '-';
    els.decisionComment.value = response.decision_comment || '';

    const canApprove = !!data?.permission?.can_approve;
    els.approveBtn.disabled = !canApprove;
    els.rejectBtn.disabled = !canApprove;

    if (!Array.isArray(data?.sections) || !data.sections.length) {
      els.detailSections.className = 'detail-sections empty-box empty-box--lg';
      els.detailSections.textContent = '표시할 상세 질문이 없습니다.';
      return;
    }

    els.detailSections.className = 'detail-sections';
    els.detailSections.innerHTML = data.sections.map((section, sectionIndex) => {
      const percent = Number(section?.summary?.completion_rate || 0);
      return `
        <article class="detail-section">
          <div class="detail-section__head">
            <div>
              <h3>${sectionIndex + 1}. ${escapeHtml(section.section_name)}</h3>
              <p>${section.summary.checked_questions}/${section.summary.total_questions} 완료</p>
            </div>
            <div style="width:min(220px,32%)">
              <div class="mini-bar"><span style="width:${percent}%"></span></div>
            </div>
          </div>
          <div class="detail-question-list">
            ${section.questions.map((question, questionIndex) => `
              <div class="detail-question ${question.is_checked ? 'is-checked' : ''}">
                <div class="detail-question__meta">
                  <span>${sectionIndex + 1}.${questionIndex + 1}</span>
                  <code>${escapeHtml(question.question_code || '-')}</code>
                  <b>${question.is_checked ? '완료' : '미완료'}</b>
                </div>
                <p>${escapeHtml(question.question_text || '')}</p>
              </div>
            `).join('')}
          </div>
        </article>
      `;
    }).join('');
  }

  async function decide(decision) {
    if (!state.selectedId) {
      showToast('결재 대상을 먼저 선택하세요.', 'danger');
      return;
    }

    const message = decision === 'APPROVED' ? '이 체크리스트를 승인하시겠습니까?' : '이 체크리스트를 반려하시겠습니까?';
    if (!window.confirm(message)) return;

    try {
      const data = await api(`/api/checklists/admin/requests/${state.selectedId}/decision`, {
        method: 'POST',
        body: {
          decision,
          comment: els.decisionComment.value.trim(),
        },
      });
      renderDetail(data);
      await loadCounts();
      await loadQueue();
      showToast(decision === 'APPROVED' ? '승인 처리했습니다.' : '반려 처리했습니다.');
    } catch (error) {
      console.error(error);
      showToast(error.message || '결재 처리 중 오류가 발생했습니다.', 'danger');
    }
  }

  function clearDetail() {
    state.selectedId = null;
    els.detailTitle.textContent = '항목을 선택하세요.';
    els.detailMeta.textContent = '왼쪽 목록에서 한 건을 선택하면 상세가 표시됩니다.';
    els.detailStatusPill.className = 'status-pill status-pill--idle';
    els.detailStatusPill.textContent = '-';
    els.detailEngineer.textContent = '-';
    els.detailEquipment.textContent = '-';
    els.detailCompletion.textContent = '-';
    els.detailComment.textContent = '-';
    els.decisionComment.value = '';
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;
    els.detailSections.className = 'detail-sections empty-box empty-box--lg';
    els.detailSections.textContent = '상세 체크리스트가 여기에 표시됩니다.';
  }

  function setBusy(disabled) {
    els.reloadBtn.disabled = disabled;
    els.equipmentFilter.disabled = disabled;
    els.kindFilter.disabled = disabled;
  }

  function getStatusText(status) {
    const map = {
      SUBMITTED: '결재 대기',
      REJECTED: '반려',
      APPROVED: '승인 완료',
      ACTIVE: '작성중',
    };
    return map[String(status || '').toUpperCase()] || String(status || '-');
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
    els.toast.classList.remove('hidden');
    state.toastTimer = setTimeout(() => {
      els.toast.classList.add('hidden');
    }, 2600);
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }
})();
