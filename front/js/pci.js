(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || localStorage.getItem('token') || '',
    meRole: localStorage.getItem('user-role') || '',
    filters: null,
    matrix: null,
    engineerAvgMap: new Map(),
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
      rebuildBtn: qs('rebuildBtn'),
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
      detailSelfCompleted: qs('detailSelfCompleted'),
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
    els.rebuildBtn.addEventListener('click', rebuildRange);
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
  }

  function handleDomainChange() {
    const domain = els.domain.value;
    if (domain === 'MAINT') {
      els.sourceWorkType.value = 'MAINT';
      els.sourceWorkType.disabled = true;
    } else {
      if (els.sourceWorkType.value === 'MAINT') els.sourceWorkType.value = 'MERGED';
      els.sourceWorkType.disabled = false;
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
    for (const row of rows) {
      html.push(`<option value="${escapeAttr(getValue(row))}">${escapeHtml(getLabel(row))}</option>`);
    }
    select.innerHTML = html.join('');
  }

  function fillSimpleOptions(select, values, includeAll) {
    const html = [];
    if (includeAll) html.push('<option value="">전체</option>');
    for (const value of values) {
      html.push(`<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`);
    }
    select.innerHTML = html.join('');
  }

  async function search() {
    if (!els.equipmentGroup.value) {
      showToast('설비군을 먼저 선택하세요.', 'danger');
      return;
    }

    const domain = els.domain.value;
    const params = new URLSearchParams({
      equipment_group: els.equipmentGroup.value,
      domain,
      source_work_type: domain === 'MAINT' ? 'MAINT' : els.sourceWorkType.value,
      group: els.engineerGroup.value,
      site: els.site.value,
      keyword: els.keyword.value.trim(),
      date_from: els.dateFrom.value,
      date_to: els.dateTo.value,
    });

    try {
      const data = await api(`/api/pci/matrix?${params.toString()}`);
      state.matrix = data;
      state.engineerAvgMap = computeEngineerAverages(data);
      renderSummary(data);
      renderMatrix(data);
    } catch (error) {
      console.error(error);
      els.matrixWrap.classList.add('hidden');
      els.matrixEmpty.classList.remove('hidden');
      els.matrixEmpty.textContent = error.message || '조회 실패';
      showToast(error.message || '조회 실패', 'danger');
    }
  }

  function computeEngineerAverages(data) {
    const avgMap = new Map();
    const engineers = data.engineers || [];
    const cells = data.cells || [];

    for (const engineer of engineers) {
      const scores = cells
        .filter((cell) => cell.engineer_id === engineer.engineer_id)
        .map((cell) => Number(cell.pci_score || 0));
      const avg = scores.length ? scores.reduce((acc, cur) => acc + cur, 0) / scores.length : 0;
      avgMap.set(engineer.engineer_id, Number(avg.toFixed(1)));
    }
    return avgMap;
  }

  function renderSummary(data) {
    const engineers = data.engineers || [];
    const items = data.items || [];
    const scores = (data.cells || []).map((row) => Number(row.pci_score || 0));
    const avg = scores.length ? scores.reduce((acc, cur) => acc + cur, 0) / scores.length : 0;

    els.engineerCount.textContent = String(engineers.length);
    els.itemCount.textContent = String(items.length);
    els.avgPci.textContent = `${avg.toFixed(1)}%`;
    els.sourceTypeLabel.textContent = data?.filters?.source_work_type || data?.meta?.source_work_type || '-';
  }

  function renderMatrix(data) {
    const engineers = data.engineers || [];
    const items = data.items || [];
    const cellMap = new Map((data.cells || []).map((row) => [`${row.pci_item_id}:${row.engineer_id}`, row]));

    if (!engineers.length || !items.length) {
      els.matrixWrap.classList.add('hidden');
      els.matrixEmpty.classList.remove('hidden');
      els.matrixEmpty.textContent = '조건에 맞는 데이터가 없습니다.';
      return;
    }

    const html = `
      <table class="matrix">
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
            <td
              class="pci-cell ${getHeatClass(score)}"
              data-engineer-id="${eng.engineer_id}"
              data-pci-item-id="${item.pci_item_id}"
              title="클릭해서 상세 보기"
            >
              <span class="pci-value">${score.toFixed(0)}%</span>
              <span class="pci-meta">
                ${cell.self_completed ? 'Self O' : 'Self X'}<br>
                M ${Number(cell.main_count || 0).toFixed(1)} / S ${Number(cell.support_count || 0).toFixed(1)}
              </span>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  }

  function makeEmptyCell(engineerId, pciItemId) {
    return {
      engineer_id: engineerId,
      pci_item_id: pciItemId,
      pci_score: 0,
      self_completed: false,
      main_count: 0,
      support_count: 0,
    };
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
    els.detailSelfCompleted.textContent = summary.self_completed ? '완료' : '미완료';

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
          ${Number(row.approved_response_count || 0) > 0 ? `<span class="badge badge--neutral">승인본 ${Number(row.approved_response_count)}건</span>` : ''}
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
        <div class="list-item__meta">
          ${escapeHtml(row.equipment_type || '-')} / ${escapeHtml(row.equipment_name || '-')} / 그룹 ${escapeHtml(row.event_group || '-')} / 사이트 ${escapeHtml(row.event_site || '-')} / 라인 ${escapeHtml(row.line || '-')}
        </div>
        <div class="list-item__body">
          ${row.setup_item ? `setup_item: ${escapeHtml(row.setup_item)}<br>` : ''}
          ${row.task_description ? `설명: ${escapeHtml(row.task_description)}<br>` : ''}
          ${row.task_cause ? `원인: ${escapeHtml(row.task_cause)}<br>` : ''}
          ${row.task_result ? `결과: ${escapeHtml(row.task_result)}` : ''}
        </div>
      </article>
    `).join('');
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
      await api('/api/pci/admin/rebuild', {
        method: 'POST',
        body: {
          date_from: els.dateFrom.value,
          date_to: els.dateTo.value,
        },
      });
      showToast('재집계를 시작했습니다.');
      await search();
    } catch (error) {
      console.error(error);
      showToast(error.message || '재집계 실패', 'danger');
    }
  }

  function toggleAdminUI() {
    els.rebuildBtn.classList.toggle('hidden', state.meRole !== 'admin');
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? {
          'x-access-token': state.token,
          Authorization: `Bearer ${state.token}`,
        } : {}),
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
