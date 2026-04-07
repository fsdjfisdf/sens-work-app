(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || localStorage.getItem('token') || '',
    meRole: localStorage.getItem('user-role') || '',
    filters: null,
    matrix: null,
    engineerAvgMap: new Map(),
    adminItems: [],
    manualCredits: [],
    manualEditId: null,
    toastTimer: null,
  };

  const els = {};
  document.addEventListener('DOMContentLoaded', init);

  function qs(id) { return document.getElementById(id); }

  async function init() {
    cache();
    bind();
    applyDefaultDates();
    toggleAdminUI();

    try {
      await loadFilters();
      await search();
    } catch (error) {
      console.error(error);
      showToast(error.message || '초기화 실패', 'danger');
    }
  }

  function cache() {
    Object.assign(els, {
      equipmentGroup: qs('equipmentGroup'),
      domain: qs('domain'),
      sourceWorkType: qs('sourceWorkType'),
      engineerGroup: qs('engineerGroup'),
      site: qs('site'),
      keyword: qs('keyword'),
      dateFrom: qs('dateFrom'),
      dateTo: qs('dateTo'),
      reloadBtn: qs('reloadBtn'),
      exportBtn: qs('exportBtn'),
      rebuildBtn: qs('rebuildBtn'),
      adminPanel: qs('adminPanel'),
      manualEngineer: qs('manualEngineer'),
      manualItem: qs('manualItem'),
      manualSourceWorkType: qs('manualSourceWorkType'),
      manualEffectiveDate: qs('manualEffectiveDate'),
      manualMainCount: qs('manualMainCount'),
      manualSupportCount: qs('manualSupportCount'),
      manualConvertedCount: qs('manualConvertedCount'),
      manualNote: qs('manualNote'),
      saveManualBtn: qs('saveManualBtn'),
      cancelManualEditBtn: qs('cancelManualEditBtn'),
      manualEditState: qs('manualEditState'),
      refreshManualListBtn: qs('refreshManualListBtn'),
      manualCreditTbody: qs('manualCreditTbody'),
      syncCapabilityBtn: qs('syncCapabilityBtn'),
      syncMonthlyBtn: qs('syncMonthlyBtn'),
      monthlyYm: qs('monthlyYm'),
      adminResult: qs('adminResult'),
      searchBtn: qs('searchBtn'),
      engineerCount: qs('engineerCount'),
      itemCount: qs('itemCount'),
      avgPci: qs('avgPci'),
      sourceTypeLabel: qs('sourceTypeLabel'),
      matrixWrap: qs('matrixWrap'),
      matrixEmpty: qs('matrixEmpty'),
      detailPanel: qs('detailPanel'),
      detailBackdrop: qs('detailBackdrop'),
      closeDetailBtn: qs('closeDetailBtn'),
      detailTitle: qs('detailTitle'),
      detailSub: qs('detailSub'),
      detailPciScore: qs('detailPciScore'),
      detailSelfScore: qs('detailSelfScore'),
      detailHistoryScore: qs('detailHistoryScore'),
      detailHistoryRatio: qs('detailHistoryRatio'),
      detailRequiredCount: qs('detailRequiredCount'),
      detailMainCount: qs('detailMainCount'),
      detailSupportCount: qs('detailSupportCount'),
      detailConvertedCount: qs('detailConvertedCount'),
      detailEventCount: qs('detailEventCount'),
      detailSelfProgress: qs('detailSelfProgress'),
      selfQuestionList: qs('selfQuestionList'),
      eventList: qs('eventList'),
      toast: qs('toast'),
    });
  }

  function bind() {
    els.reloadBtn.addEventListener('click', async () => {
      await loadFilters();
      await search();
    });
    els.searchBtn.addEventListener('click', search);
    els.exportBtn.addEventListener('click', exportExcel);
    els.rebuildBtn.addEventListener('click', rebuildRange);
    if (els.saveManualBtn) els.saveManualBtn.addEventListener('click', saveManualCredit);
    if (els.cancelManualEditBtn) els.cancelManualEditBtn.addEventListener('click', resetManualForm);
    if (els.refreshManualListBtn) els.refreshManualListBtn.addEventListener('click', loadManualCredits);
    if (els.syncCapabilityBtn) els.syncCapabilityBtn.addEventListener('click', syncCapabilityScore);
    if (els.syncMonthlyBtn) els.syncMonthlyBtn.addEventListener('click', syncMonthlyCapability);
    els.closeDetailBtn.addEventListener('click', closeDetail);
    els.detailBackdrop.addEventListener('click', closeDetail);
    els.domain.addEventListener('change', handleDomainChange);
    els.keyword.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') search();
    });
  }

  function applyDefaultDates() {
    const now = new Date();
    const from = new Date(now);
    from.setFullYear(now.getFullYear() - 1);
    els.dateTo.value = toDateInputValue(now);
    els.dateFrom.value = toDateInputValue(from);
    if (els.monthlyYm) els.monthlyYm.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
  }

  function handleDomainChange() {
    const domain = els.domain.value;
    if (domain === 'MAINT') {
      els.sourceWorkType.value = 'MAINT';
      els.sourceWorkType.disabled = true;
      if (els.manualSourceWorkType) { els.manualSourceWorkType.value = 'MAINT'; els.manualSourceWorkType.disabled = true; }
    } else {
      if (els.sourceWorkType.value === 'MAINT') els.sourceWorkType.value = 'MERGED';
      els.sourceWorkType.disabled = false;
      if (els.manualSourceWorkType) { if (els.manualSourceWorkType.value === 'MAINT') els.manualSourceWorkType.value = 'MERGED'; els.manualSourceWorkType.disabled = false; }
    }
  }

  async function loadFilters() {
    const data = await api('/api/pci/filters');
    state.filters = data;

    renderSelectOptions(els.equipmentGroup, data.equipment_groups || [], {
      placeholder: false,
      getValue: (row) => row.code,
      getLabel: (row) => row.display_name || row.code,
    });

    fillSimpleOptions(els.engineerGroup, data.groups || [], true);
    fillSimpleOptions(els.site, data.sites || [], true);

    if (!els.equipmentGroup.value && (data.equipment_groups || []).length) {
      els.equipmentGroup.value = data.equipment_groups[0].code;
    }

    handleDomainChange();
  }

  function renderSelectOptions(select, rows, { placeholder = true, getValue, getLabel }) {
    const html = [];
    if (placeholder) html.push('<option value="">전체</option>');
    for (const row of rows) html.push(`<option value="${escapeAttr(getValue(row))}">${escapeHtml(getLabel(row))}</option>`);
    select.innerHTML = html.join('');
  }

  function fillSimpleOptions(select, values, includeAll) {
    const html = [];
    if (includeAll) html.push('<option value="">전체</option>');
    for (const value of values) html.push(`<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`);
    select.innerHTML = html.join('');
  }

  function collectFilters() {
    return {
      equipment_group: els.equipmentGroup.value,
      domain: els.domain.value,
      source_work_type: els.domain.value === 'MAINT' ? 'MAINT' : els.sourceWorkType.value,
      group: els.engineerGroup.value,
      site: els.site.value,
      keyword: els.keyword.value.trim(),
      date_from: els.dateFrom.value,
      date_to: els.dateTo.value,
    };
  }

  async function search() {
    const params = new URLSearchParams(collectFilters());
    const data = await api(`/api/pci/matrix?${params.toString()}`);
    state.matrix = data;
    state.engineerAvgMap = new Map((data.engineer_averages || []).map((row) => [row.engineer_id, row.avg_pci]));
    renderSummary(data);
    renderMatrix(data);
    if (state.meRole === 'admin') {
      await loadAdminItems();
      populateManualEngineerOptions();
      await loadManualCredits();
    }
  }

  function renderSummary(data) {
    els.engineerCount.textContent = String(data.summary?.engineer_count || data.engineers?.length || 0);
    els.itemCount.textContent = String(data.summary?.item_count || data.items?.length || 0);
    els.avgPci.textContent = `${Number(data.summary?.avg_pci || 0).toFixed(1)}%`;
    els.sourceTypeLabel.textContent = data.meta?.source_work_type || '-';
  }

  function renderMatrix(data) {
    const engineers = data.engineers || [];
    const items = data.items || [];

    if (!engineers.length || !items.length) {
      els.matrixWrap.classList.add('hidden');
      els.matrixEmpty.classList.remove('hidden');
      els.matrixEmpty.textContent = '표시할 데이터가 없습니다.';
      return;
    }

    const cellMap = new Map((data.cells || []).map((row) => [`${row.pci_item_id}:${row.engineer_id}`, row]));

    const html = `
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="sticky-col cat-col">카테고리</th>
            <th class="sticky-col sticky-col--second item-col">작업 항목</th>
            ${engineers.map((eng) => renderEngineerHead(eng)).join('')}
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => renderRow(item, engineers, cellMap)).join('')}
        </tbody>
      </table>
    `;

    els.matrixWrap.innerHTML = html;
    els.matrixWrap.classList.remove('hidden');
    els.matrixEmpty.classList.add('hidden');
    els.matrixWrap.querySelectorAll('.pci-cell').forEach((cell) => {
      cell.addEventListener('click', () => openDetail(cell.dataset.engineerId, cell.dataset.pciItemId));
    });
  }

  function renderEngineerHead(engineer) {
    const avg = state.engineerAvgMap.get(engineer.engineer_id) || 0;
    return `
      <th class="engineer-col">
        <div class="engineer-head">
          <div class="engineer-name">${escapeHtml(engineer.engineer_name)}</div>
          <div class="engineer-sub">${escapeHtml([engineer.group, engineer.site].filter(Boolean).join(' / ') || '-')}</div>
          <div class="engineer-avg">평균 ${avg.toFixed(1)}%</div>
        </div>
      </th>
    `;
  }

  function renderRow(item, engineers, cellMap) {
    return `
      <tr>
        <td class="sticky-col cat-col">${escapeHtml(item.category || '-')}</td>
        <td class="sticky-col sticky-col--second item-col">
          <div class="item-name">${escapeHtml(item.item_name_kr || item.item_name || item.item_code)}</div>
          <div class="item-sub">${escapeHtml(item.item_name || item.item_code)} · 기준 ${Number(item.required_count || 0)}</div>
        </td>
        ${engineers.map((eng) => {
          const cell = cellMap.get(`${item.pci_item_id}:${eng.engineer_id}`) || makeEmptyCell(eng.engineer_id, item.pci_item_id);
          const score = Number(cell.pci_score || 0);
          return `
            <td class="pci-cell ${getHeatClass(score)}" data-engineer-id="${eng.engineer_id}" data-pci-item-id="${item.pci_item_id}" title="클릭해서 상세 보기">
              <span class="pci-value">${score.toFixed(0)}%</span>
              <span class="pci-meta">
                Self ${Number(cell.self_score || 0).toFixed(1)} / Hist ${Number(cell.history_score || 0).toFixed(1)}<br>
                M ${Number(cell.main_count || 0).toFixed(1)} / S ${Number(cell.support_count || 0).toFixed(1)}
              </span>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  }

  function makeEmptyCell(engineerId, pciItemId) {
    return { engineer_id: engineerId, pci_item_id: pciItemId, pci_score: 0, self_score: 0, history_score: 0, main_count: 0, support_count: 0 };
  }

  function getHeatClass(score) {
    if (score <= 0) return 'heat-0';
    if (score < 20) return 'heat-1';
    if (score < 40) return 'heat-2';
    if (score < 60) return 'heat-3';
    if (score < 80) return 'heat-4';
    return 'heat-5';
  }

  async function openDetail(engineerId, pciItemId) {
    try {
      const params = new URLSearchParams({
        engineer_id: engineerId,
        pci_item_id: pciItemId,
        date_from: els.dateFrom.value,
        date_to: els.dateTo.value,
        source_work_type: els.domain.value === 'MAINT' ? 'MAINT' : els.sourceWorkType.value,
      });
      const data = await api(`/api/pci/cell-detail?${params.toString()}`);
      renderDetail(data);
      els.detailPanel.classList.add('is-open');
      els.detailPanel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('panel-open');
    } catch (error) {
      console.error(error);
      showToast(error.message || '상세 조회 실패', 'danger');
    }
  }

  function renderDetail(data) {
    const summary = data.summary || {};
    const engineer = data.engineer || {};
    const item = data.item || {};

    els.detailTitle.textContent = `${engineer.name || '-'} · ${item.item_name_kr || item.item_name || item.item_code || '-'}`;
    els.detailSub.textContent = `${item.equipment_group_code || '-'} / ${item.pci_domain || '-'} / ${data.filters?.source_work_type || '-'}`;

    els.detailPciScore.textContent = `${Number(summary.pci_score || 0).toFixed(1)}%`;
    els.detailSelfScore.textContent = String(Number(summary.self_score || 0).toFixed(1));
    els.detailHistoryScore.textContent = String(Number(summary.history_score || 0).toFixed(1));
    els.detailHistoryRatio.textContent = `${(Number(summary.history_ratio || 0) * 100).toFixed(1)}%`;
    els.detailRequiredCount.textContent = String(Number(summary.required_count || 0));
    els.detailMainCount.textContent = String(Number(summary.main_count || 0).toFixed(1));
    els.detailSupportCount.textContent = String(Number(summary.support_count || 0).toFixed(1));
    els.detailConvertedCount.textContent = String(Number(summary.converted_count || 0).toFixed(2));
    els.detailEventCount.textContent = String(Number(summary.event_count || 0));
    els.detailSelfProgress.textContent = `${Number(summary.self_checked_questions || 0)} / ${Number(summary.self_total_questions || 0)}`;

    renderSelfQuestions(data.self_questions || []);
    renderEvents(data.events || []);
  }

  function renderSelfQuestions(rows) {
    if (!rows.length) {
      els.selfQuestionList.innerHTML = `<div class="list-item"><div class="list-item__meta">연결된 self checklist 문항이 없습니다.</div></div>`;
      return;
    }

    els.selfQuestionList.innerHTML = rows.map((row) => `
      <article class="list-item">
        <div class="list-item__title">${escapeHtml(row.question_text || row.question_code || '-')}</div>
        <div class="badge-row">
          <span class="badge badge--neutral">문항코드 ${escapeHtml(row.question_code || '-')}</span>
          <span class="badge ${row.is_checked ? 'badge--ok' : 'badge--off'}">${row.is_checked ? '체크됨' : '체크 안됨'}</span>
          <span class="badge badge--neutral">응답상태 ${escapeHtml(row.response_status || '-')}</span>
          ${Number(row.mapped_question_count || 0) > 1 ? `<span class="badge badge--neutral">중복문항 ${Number(row.mapped_question_count)}개 통합</span>` : ''}
        </div>
      </article>
    `).join('');
  }

  function renderEvents(rows) {
    if (!rows.length) {
      els.eventList.innerHTML = `<div class="list-item"><div class="list-item__meta">집계된 작업이 없습니다.</div></div>`;
      return;
    }

    els.eventList.innerHTML = rows.map((row) => `
      <article class="list-item">
        <div class="list-item__title">${escapeHtml(row.task_date || '-')} · ${escapeHtml(row.task_name || '-')}</div>
        <div class="badge-row">
          <span class="badge badge--neutral">${escapeHtml(row.source_work_type || row.work_type || '-')}</span>
          <span class="badge badge--neutral">${escapeHtml(row.role || '-')}</span>
          <span class="badge badge--neutral">M ${Number(row.main_count || 0).toFixed(1)} / S ${Number(row.support_count || 0).toFixed(1)}</span>
          <span class="badge badge--neutral">환산 ${Number(row.converted_count || 0).toFixed(2)}</span>
        </div>
        <div class="list-item__meta">${escapeHtml(row.equipment_type || '-')} / ${escapeHtml(row.equipment_name || '-')} / 그룹 ${escapeHtml(row.event_group || '-')} / 사이트 ${escapeHtml(row.event_site || '-')} / 라인 ${escapeHtml(row.line || '-')}</div>
        <div class="list-item__body">
          ${row.setup_item ? `setup_item: ${escapeHtml(row.setup_item)}<br>` : ''}
          ${row.task_description ? `설명: ${escapeHtml(row.task_description)}<br>` : ''}
          ${row.task_cause ? `원인: ${escapeHtml(row.task_cause)}<br>` : ''}
          ${row.task_result ? `결과: ${escapeHtml(row.task_result)}` : ''}
        </div>
      </article>
    `).join('');
  }

  async function exportExcel() {
    try {
      const params = new URLSearchParams(collectFilters());
      const res = await fetch(`/api/pci/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          ...(state.token ? { 'x-access-token': state.token, Authorization: `Bearer ${state.token}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || json.error || '엑셀 추출 실패');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      a.href = url;
      a.download = match ? decodeURIComponent(match[1]) : 'pci_matrix.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('엑셀 파일을 다운로드했습니다.');
    } catch (error) {
      console.error(error);
      showToast(error.message || '엑셀 추출 실패', 'danger');
    }
  }

  function closeDetail() {
    els.detailPanel.classList.remove('is-open');
    els.detailPanel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('panel-open');
  }

  async function rebuildRange() {
    const ok = window.confirm(`현재 기간(${els.dateFrom.value} ~ ${els.dateTo.value})으로 PCI 집계를 다시 수행할까요?`);
    if (!ok) return;
    try {
      await api('/api/pci/admin/rebuild', { method: 'POST', body: { date_from: els.dateFrom.value, date_to: els.dateTo.value } });
      showToast('재집계를 시작했습니다.');
      await search();
    } catch (error) {
      console.error(error);
      showToast(error.message || '재집계 실패', 'danger');
    }
  }

  function toggleAdminUI() {
    const hide = state.meRole !== 'admin';
    els.rebuildBtn.classList.toggle('hidden', hide);
    if (els.adminPanel) els.adminPanel.classList.toggle('hidden', hide);
  }


  async function loadAdminItems() {
    const params = new URLSearchParams({
      equipment_group: els.equipmentGroup.value,
      domain: els.domain.value,
      keyword: '',
    });
    const data = await api(`/api/pci/admin/items?${params.toString()}`);
    state.adminItems = data.rows || [];
    populateManualItemOptions();
  }

  function populateManualEngineerOptions() {
    const engineers = state.matrix?.engineers || [];
    if (!els.manualEngineer) return;
    if (!engineers.length) {
      els.manualEngineer.innerHTML = '<option value="">조회된 엔지니어 없음</option>';
      return;
    }
    els.manualEngineer.innerHTML = engineers.map((row) =>
      `<option value="${row.engineer_id}">${escapeHtml(row.engineer_name)}${row.group || row.site ? ` (${escapeHtml([row.group,row.site].filter(Boolean).join('/') )})` : ''}</option>`
    ).join('');
  }

  function populateManualItemOptions() {
    if (!els.manualItem) return;
    const items = state.adminItems || [];
    if (!items.length) {
      els.manualItem.innerHTML = '<option value="">조회된 항목 없음</option>';
      return;
    }
    els.manualItem.innerHTML = items.map((row) =>
      `<option value="${row.id}">${escapeHtml(row.item_name_kr || row.item_name || row.item_code)} · ${escapeHtml(row.item_code)}</option>`
    ).join('');
  }

  async function loadManualCredits() {
    if (state.meRole !== 'admin') return;
    const params = new URLSearchParams({
      equipment_group: els.equipmentGroup.value,
      domain: els.domain.value,
      keyword: '',
    });
    const data = await api(`/api/pci/admin/manual-credits?${params.toString()}`);
    state.manualCredits = data.rows || [];
    renderManualCredits();
  }

  function renderManualCredits() {
    const rows = state.manualCredits || [];
    if (!rows.length) {
      els.manualCreditTbody.innerHTML = '<tr><td colspan="10" class="table-empty">등록된 수동 가산이 없습니다.</td></tr>';
      return;
    }
    els.manualCreditTbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(formatDateTime(row.created_at))}</td>
        <td>${escapeHtml(row.engineer_name || '-')}</td>
        <td>${escapeHtml(row.item_name_kr || row.item_name || row.item_code || '-')}</td>
        <td>${escapeHtml(row.source_work_type || '-')}</td>
        <td>${Number(row.main_count_add || 0).toFixed(1)}</td>
        <td>${Number(row.support_count_add || 0).toFixed(1)}</td>
        <td>${Number(row.converted_count_add || 0).toFixed(1)}</td>
        <td>${escapeHtml(row.effective_date || '-')}</td>
        <td>${escapeHtml(row.note || '-')}</td>
        <td>
          <div class="table-actions">
            <button class="small-btn small-btn--edit" type="button" data-manual-edit="${row.id}">수정</button>
            <button class="small-btn small-btn--delete" type="button" data-manual-delete="${row.id}">삭제</button>
          </div>
        </td>
      </tr>
    `).join('');
    els.manualCreditTbody.querySelectorAll('[data-manual-edit]').forEach((btn) => btn.addEventListener('click', () => fillManualForm(btn.dataset.manualEdit)));
    els.manualCreditTbody.querySelectorAll('[data-manual-delete]').forEach((btn) => btn.addEventListener('click', () => deleteManualCredit(btn.dataset.manualDelete)));
  }

  function fillManualForm(id) {
    const row = (state.manualCredits || []).find((item) => String(item.id) === String(id));
    if (!row) return;
    state.manualEditId = row.id;
    els.manualEngineer.value = String(row.engineer_id);
    els.manualItem.value = String(row.pci_item_id);
    els.manualSourceWorkType.value = row.source_work_type || 'MERGED';
    els.manualEffectiveDate.value = row.effective_date || '';
    els.manualMainCount.value = Number(row.main_count_add || 0);
    els.manualSupportCount.value = Number(row.support_count_add || 0);
    els.manualConvertedCount.value = Number(row.converted_count_add || 0);
    els.manualNote.value = row.note || '';
    els.manualEditState.textContent = `수정 중 #${row.id}`;
    els.cancelManualEditBtn.classList.remove('hidden');
  }

  function resetManualForm() {
    state.manualEditId = null;
    if (els.manualEngineer.options.length) els.manualEngineer.selectedIndex = 0;
    if (els.manualItem.options.length) els.manualItem.selectedIndex = 0;
    els.manualMainCount.value = '0';
    els.manualSupportCount.value = '0';
    els.manualConvertedCount.value = '0';
    els.manualEffectiveDate.value = '';
    els.manualNote.value = '';
    els.manualEditState.textContent = '신규 등록';
    els.cancelManualEditBtn.classList.add('hidden');
    handleDomainChange();
  }

  async function saveManualCredit() {
    try {
      const body = {
        engineer_id: Number(els.manualEngineer.value),
        pci_item_id: Number(els.manualItem.value),
        source_work_type: els.manualSourceWorkType.value,
        effective_date: els.manualEffectiveDate.value,
        main_count_add: Number(els.manualMainCount.value || 0),
        support_count_add: Number(els.manualSupportCount.value || 0),
        converted_count_add: Number(els.manualConvertedCount.value || 0),
        note: els.manualNote.value.trim(),
      };
      if (state.manualEditId) {
        await api(`/api/pci/admin/manual-credits/${state.manualEditId}`, { method: 'PUT', body });
        showToast('수동 가산을 수정했습니다.');
      } else {
        await api('/api/pci/admin/manual-credits', { method: 'POST', body });
        showToast('수동 가산을 등록했습니다.');
      }
      resetManualForm();
      await loadManualCredits();
      await search();
    } catch (error) {
      console.error(error);
      showToast(error.message || '수동 가산 저장 실패', 'danger');
    }
  }

  async function deleteManualCredit(id) {
    const ok = window.confirm('이 수동 가산을 삭제할까요?');
    if (!ok) return;
    try {
      await api(`/api/pci/admin/manual-credits/${id}`, { method: 'DELETE' });
      showToast('수동 가산을 삭제했습니다.');
      if (String(state.manualEditId || '') === String(id)) resetManualForm();
      await loadManualCredits();
      await search();
    } catch (error) {
      console.error(error);
      showToast(error.message || '수동 가산 삭제 실패', 'danger');
    }
  }

  async function syncCapabilityScore() {
    const ok = window.confirm(`현재 필터 기준으로 capability_score 를 업데이트할까요?\n설비군: ${els.equipmentGroup.value}\n기간: ${els.dateFrom.value} ~ ${els.dateTo.value}`);
    if (!ok) return;
    try {
      const data = await api('/api/pci/admin/capability-score/sync', {
        method: 'POST',
        body: collectFilters(),
      });
      els.adminResult.textContent = `capability_score 업데이트 완료 · 대상 ${data.affected_rows || 0}명 · eq_id ${data.eq_id || '-'} (${data.eq_code || '-'})`;
      showToast('capability_score 업데이트 완료');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'capability_score 업데이트 실패', 'danger');
    }
  }

  async function syncMonthlyCapability() {
    const ym = els.monthlyYm.value;
    if (!ym) {
      showToast('월을 선택하세요.', 'danger');
      return;
    }
    const ok = window.confirm(`${ym} 기준으로 monthly_capability 를 업데이트할까요?`);
    if (!ok) return;
    try {
      const data = await api('/api/pci/admin/monthly-capability/sync', {
        method: 'POST',
        body: {
          ym,
          group: els.engineerGroup.value,
          site: els.site.value,
          keyword: els.keyword.value.trim(),
        },
      });
      els.adminResult.textContent = `monthly_capability 업데이트 완료 · ${data.ym} · 대상 ${data.affected_rows || 0}명`;
      showToast('monthly_capability 업데이트 완료');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'monthly_capability 업데이트 실패', 'danger');
    }
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { 'x-access-token': state.token, Authorization: `Bearer ${state.token}` } : {}),
      },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.isSuccess === false) {
      const err = new Error(json.message || json.error || '요청 실패');
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json.data;
  }

  function toDateInputValue(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function showToast(message, type = 'success') {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.className = `toast toast--${type}`;
    els.toast.classList.remove('hidden');
    state.toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2500);
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
