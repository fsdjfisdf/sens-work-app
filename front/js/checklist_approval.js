(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || localStorage.getItem('token') || '',
    me: null,
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
      const me = await api('/api/checklists/me');
      state.me = me;
      const role = me?.user?.role;
      els.userBadge.textContent = `${me?.engineer?.name || me?.user?.nickname || '사용자'} · ${role || '-'}`;
      if (role !== 'admin') {
        document.body.innerHTML = '<div style="padding:40px;font-family:system-ui">관리자만 접근할 수 있습니다.</div>';
        return;
      }
      buildEquipmentFilter();
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
      approvedCount: qs('approvedCount'),
      rejectedCount: qs('rejectedCount'),
      statusFilter: qs('statusFilter'),
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
    });
  }

  function bind() {
    els.statusFilter.addEventListener('change', loadQueue);
    els.equipmentFilter.addEventListener('change', loadQueue);
    els.kindFilter.addEventListener('change', loadQueue);
    els.keywordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadQueue();
    });
    els.reloadBtn.addEventListener('click', loadQueue);
    els.approveBtn.addEventListener('click', () => decide('APPROVED'));
    els.rejectBtn.addEventListener('click', () => decide('REJECTED'));
  }

  function buildEquipmentFilter() {
    const access = Array.isArray(state.me?.access) ? state.me.access : [];
    els.equipmentFilter.innerHTML = '<option value="">전체</option>' + access.map((row) =>
      `<option value="${escapeAttr(row.code)}">${escapeHtml(row.display_name)}</option>`
    ).join('');
  }

  async function loadQueue() {
    setButtonsDisabled(true);
    try {
      const params = new URLSearchParams();
      if (els.statusFilter.value) params.set('status', els.statusFilter.value);
      if (els.equipmentFilter.value) params.set('equipment_group', els.equipmentFilter.value);
      if (els.kindFilter.value) params.set('kind', els.kindFilter.value);
      if (els.keywordInput.value.trim()) params.set('keyword', els.keywordInput.value.trim());

      const data = await api(`/api/checklists/admin/requests?${params.toString()}`);
      state.queue = Array.isArray(data?.rows) ? data.rows : [];
      renderQueue();
      renderCounts();

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
      setButtonsDisabled(false);
    }
  }

  function renderCounts() {
    const rows = state.queue;
    els.submittedCount.textContent = rows.filter((row) => row.response_status === 'SUBMITTED').length;
    els.approvedCount.textContent = rows.filter((row) => row.response_status === 'APPROVED').length;
    els.rejectedCount.textContent = rows.filter((row) => row.response_status === 'REJECTED').length;
  }

  function renderQueue() {
    els.queueCountBadge.textContent = `${state.queue.length}건`;

    if (!state.queue.length) {
      els.queueList.className = 'queue-list empty-box';
      els.queueList.textContent = '불러온 결재 요청이 없습니다.';
      return;
    }

    els.queueList.className = 'queue-list';
    els.queueList.innerHTML = state.queue.map((row) => {
      const percent = row.total_questions
        ? Math.round((Number(row.checked_questions || 0) / Number(row.total_questions || 0)) * 1000) / 10
        : 0;

      return `
        <button type="button" class="queue-item ${row.response_id === state.selectedId ? 'is-active' : ''}" data-id="${row.response_id}">
          <div class="queue-item__top">
            <strong>${escapeHtml(row.engineer_name)}</strong>
            <span class="status-pill status-pill--${String(row.response_status || '').toLowerCase()}">${escapeHtml(row.response_status)}</span>
          </div>
          <p>${escapeHtml(row.equipment_group_name)} · ${escapeHtml(row.checklist_kind)}</p>
          <div class="mini-bar"><span style="width:${percent}%"></span></div>
          <div class="queue-item__meta">
            <span>${percent}%</span>
            <span>${escapeHtml(formatDateTime(row.submitted_at || row.updated_at))}</span>
          </div>
        </button>
      `;
    }).join('');

    els.queueList.querySelectorAll('.queue-item').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await loadDetail(Number(btn.dataset.id));
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
    els.detailStatusPill.textContent = response.response_status || '-';

    els.detailEngineer.textContent = `${engineer.name || '-'} · ${engineer.group || '-'} / ${engineer.site || '-'}`;
    els.detailEquipment.textContent = `${template.equipment_group_name || template.equipment_group_code || '-'} / ${template.checklist_kind || '-'}`;
    els.detailCompletion.textContent = `${summary.completion_rate || 0}% (${summary.checked_questions || 0}/${summary.total_questions || 0})`;
    els.detailComment.textContent = response.decision_comment || '-';
    els.decisionComment.value = response.decision_comment || '';

    const canApprove = data?.permission?.can_approve;
    els.approveBtn.disabled = !canApprove;
    els.rejectBtn.disabled = !canApprove;

    if (!data?.sections?.length) {
      els.detailSections.className = 'detail-sections empty-box empty-box--lg';
      els.detailSections.textContent = '표시할 상세 질문이 없습니다.';
      return;
    }

    els.detailSections.className = 'detail-sections';
    els.detailSections.innerHTML = data.sections.map((section, index) => `
      <article class="detail-section">
        <div class="detail-section__head">
          <div>
            <h3>${index + 1}. ${escapeHtml(section.section_name)}</h3>
            <p>${section.summary.checked_questions}/${section.summary.total_questions} 완료</p>
          </div>
          <div class="mini-bar mini-bar--wide"><span style="width:${section.summary.completion_rate}%"></span></div>
          <strong>${section.summary.completion_rate}%</strong>
        </div>
        <div class="detail-question-list">
          ${section.questions.map((q, qIndex) => `
            <div class="detail-question ${q.is_checked ? 'is-checked' : ''}">
              <div class="detail-question__meta">
                <span>${index + 1}.${qIndex + 1}</span>
                <code>${escapeHtml(q.question_code)}</code>
                <b>${q.is_checked ? '완료' : '미완료'}</b>
              </div>
              <p>${escapeHtml(q.question_text)}</p>
            </div>
          `).join('')}
        </div>
      </article>
    `).join('');
  }

  async function decide(decision) {
    if (!state.selectedId) {
      showToast('결재 대상을 먼저 선택하세요.', 'danger');
      return;
    }

    const confirmMsg = decision === 'APPROVED'
      ? '이 체크리스트를 승인할까요?'
      : '이 체크리스트를 반려할까요?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const data = await api(`/api/checklists/admin/requests/${state.selectedId}/decision`, {
        method: 'POST',
        body: {
          decision,
          comment: els.decisionComment.value.trim(),
        },
      });
      renderDetail(data);
      await loadQueue();
      showToast(decision === 'APPROVED' ? '승인 처리했습니다.' : '반려 처리했습니다.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || '결재 처리 중 오류가 발생했습니다.', 'danger');
    }
  }

  function clearDetail() {
    state.selectedId = null;
    els.detailTitle.textContent = '결재 대상을 선택하세요.';
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
    els.detailSections.textContent = '상세 체크리스트 내용이 여기에 표시됩니다.';
  }

  function setButtonsDisabled(disabled) {
    els.reloadBtn.disabled = disabled;
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

  function formatDateTime(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
