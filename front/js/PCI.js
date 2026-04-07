(() => {
  const state = {
    token: localStorage.getItem('x-access-token') || localStorage.getItem('token') || '',
    meRole: localStorage.getItem('user-role') || '',
    filters: null,
    matrix: null,
    loading: false,
  };

  const els = {};
  document.addEventListener('DOMContentLoaded', init);

  function qs(id) { return document.getElementById(id); }

  async function init() {
    cache();
    bind();
    setDefaultDates();

    try {
      await loadFilters();
      await search();
      toggleAdminUI();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'PCI 초기화에 실패했습니다.', 'danger');
    }
  }

  function cache() {
    Object.assign(els, {
      equipmentGroup: qs('equipmentGroup'),
      domain: qs('domain'),
      sourceWorkType: qs('sourceWorkType'),
      engineerGroup: qs('engineerGroup'),
      site: qs('site'),
      dateFrom: qs('dateFrom'),
      dateTo: qs('dateTo'),
      keyword: qs('keyword'),
      zeroHide: qs('zeroHide'),
      lowOnly: qs('lowOnly'),
      searchBtn: qs('searchBtn'),
      reloadBtn: qs('reloadBtn'),
      rebuildBtn: qs('rebuildBtn'),
      engineerCount: qs('engineerCount'),
      itemCount: qs('itemCount'),
      avgPci: qs('avgPci'),
      sourceTypeLabel: qs('sourceTypeLabel'),
      matrixWrap: qs('matrixWrap'),
      matrixEmpty: qs('matrixEmpty'),
      detailPanel: qs('detailPanel'),
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
    els.searchBtn.addEventListener('click', search);
    els.reloadBtn.addEventListener('click', search);
    els.domain.addEventListener('change', syncSourceTypeWithDomain);
    els.closeDetailBtn.addEventListener('click', closeDetail);
    els.rebuildBtn.addEventListener('click', rebuildRange);
  }

  function setDefaultDates() {
    const today = new Date();
    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);

    els.dateTo.value = toDateInputValue(today);
    els.dateFrom.value = toDateInputValue(yearAgo);
  }

  function syncSourceTypeWithDomain() {
    if (els.domain.value === 'MAINT') {
      els.sourceWorkType.value = 'MAINT';
      els.sourceWorkType.disabled = true;
    } else {
      if (els.sourceWorkType.value === 'MAINT') {
        els.sourceWorkType.value = 'MERGED';
      }
      els.sourceWorkType.disabled = false;
    }
  }

  async function loadFilters() {
    const data = await api('/api/pci/filters');
    state.filters = data;
    renderFilterOptions();
  }

  function renderFilterOptions() {
    const filters = state.filters || {};
    els.equipmentGroup.innerHTML = (filters.equipment_groups || [])
      .map((row) => `<option value="${escapeAttr(row.code)}">${escapeHtml(row.display_name || row.code)}</option>`)
      .join('');

    els.engineerGroup.innerHTML = `<option value="">전체</option>` +
      (filters.groups || []).map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join('');

    els.site.innerHTML = `<option value="">전체</option>` +
      (filters.sites || []).map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join('');

    syncSourceTypeWithDomain();
  }

  async function search() {
    if (state.loading) return;
    state.loading = true;
    els.searchBtn.disabled = true;

    try {
      const query = new URLSearchParams({
        equipment_group: els.equipmentGroup.value,
        domain: els.domain.value,
        source_work_type: els.sourceWorkType.value,
        group: els.engineerGroup.value,
        site: els.site.value,
        keyword: els.keyword.value.trim(),
        date_from: els.dateFrom.value,
        date_to: els.dateTo.value,
      });

      const data = await api(`/api/pci/matrix?${query.toString()}`);
      state.matrix = data;
      renderSummary(data);
      renderMatrix(data);
    } catch (error) {
      console.error(error);
      showToast(error.message || '조회 중 오류가 발생했습니다.', 'danger');
      els.matrixWrap.classList.add('hidden');
      els.matrixEmpty.classList.remove('hidden');
      els.matrixEmpty.textContent = error.message || '조회 실패';
    } finally {
      state.loading = false;
      els.searchBtn.disabled = false;
    }
  }

  function renderSummary(data) {
    const engineers = data.engineers || [];
    const items = data.items || [];
    const cells = filterCells(data.cells || []);

    const avg = cells.length
      ? (cells.reduce((acc, row) => acc + Number(row.pci_score || 0), 0) / cells.length)
      : 0;

    els.engineerCount.textContent = String(engineers.length);
    els.itemCount.textContent = String(items.length);
    els.avgPci.textContent = `${avg.toFixed(1)}%`;
    els.sourceTypeLabel.textContent = data.meta?.source_work_type || '-';
  }

  function renderMatrix(data) {
    const engineers = data.engineers || [];
    const items = data.items || [];
    const filteredCellList = filterCells(data.cells || []);
    const cellMap = new Map(filteredCellList.map((row) => [`${row.pci_item_id}:${row.engineer_id}`, row]));

    if (!engineers.length || !items.length) {
      els.matrixWrap.classList.add('hidden');
      els.matrixEmpty.classList.remove('hidden');
      els.matrixEmpty.textContent = '조건에 맞는 데이터가 없습니다.';
      return;
    }

    const visibleItems = items.filter((item) => {
      const rowCells = engineers.map((eng) => cellMap.get(`${item.pci_item_id}:${eng.engineer_id}`)).filter(Boolean);
      if (!rowCells.length) return !els.zeroHide.checked && !els.lowOnly.checked;
      if (els.zeroHide.checked && rowCells.every((cell) => Number(cell.pci_score || 0) <= 0)) return false;
      if (els.lowOnly.checked && rowCells.every((cell) => Number(cell.pci_score || 0) >= 80)) return false;
      return true;
    });

    if (!visibleItems.length) {
      els.matrixWrap.classList.add('hidden');
      els.matrixEmpty.classList.remove('hidden');
      els.matrixEmpty.textContent = '조건에 맞는 항목이 없습니다.';
      return;
    }

    const html = `
      <table class="matrix">
        <thead>
          <tr>
            <th class="sticky-col cat-col">카테고리</th>
            <th class="sticky-col sticky-col--second item-col">작업 항목</th>
            ${engineers.map((eng) => `
              <th class="engineer-col">
                <div>${escapeHtml(eng.engineer_name)}</div>
                <small>${escapeHtml([eng.group, eng.site].filter(Boolean).join(' / '))}</small>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${visibleItems.map((item) => renderRow(item, engineers, cellMap)).join('')}
        </tbody>
      </table>
    `;

    els.matrixWrap.innerHTML = html;
    els.matrixWrap.classList.remove('hidden');
    els.matrixEmpty.classList.add('hidden');

    els.matrixWrap.querySelectorAll('.pci-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        openDetail(cell.dataset.engineerId, cell.dataset.pciItemId);
      });
    });
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
          const cell = cellMap.get(`${item.pci_item_id}:${eng.engineer_id}`) || {
            engineer_id: eng.engineer_id,
            pci_item_id: item.pci_item_id,
            pci_score: 0,
            self_completed: false,
            converted_count: 0,
            main_count: 0,
            support_count: 0,
          };
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
                ${cell.self_completed ? 'Self O' : 'Self X'} ·
                M ${Number(cell.main_count || 0).toFixed(1)} /
                S ${Number(cell.support_count || 0).toFixed(1)}
              </span>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  }

  function filterCells(cells) {
    return cells.filter((row) => {
      const score = Number(row.pci_score || 0);
      if (els.zeroHide.checked && score <= 0) return false;
      if (els.lowOnly.checked && score >= 80) return false;
      return true;
    });
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
        source_work_type: els.sourceWorkType.value,
      });

      const data = await api(`/api/pci/cell-detail?${params.toString()}`);
      renderDetail(data);
      els.detailPanel.classList.add('is-open');
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

    els.selfQuestionList.innerHTML = (data.self_questions || []).length
      ? data.self_questions.map((row) => `
          <article class="list-item">
            <div class="list-item__title">${escapeHtml(row.question_text || row.question_code || '-')}</div>
            <div class="list-item__meta">
              문항코드: ${escapeHtml(row.question_code || '-')}<br>
              상태: ${row.is_checked ? '체크됨' : '체크 안됨'} / 응답상태: ${escapeHtml(row.response_status || '-')}
            </div>
          </article>
        `).join('')
      : `<div class="list-item"><div class="list-item__meta">연결된 self checklist 문항이 없습니다.</div></div>`;

    els.eventList.innerHTML = (data.events || []).length
      ? data.events.map((row) => `
          <article class="list-item">
            <div class="list-item__title">${escapeHtml(row.task_date || '-')} · ${escapeHtml(row.task_name || '-')}</div>
            <div class="list-item__meta">
              ${escapeHtml(row.equipment_type || '-')} / ${escapeHtml(row.equipment_name || '-')} / ${escapeHtml(row.work_type || '-')} / ${escapeHtml(row.role || '-')}
              <br>
              main ${Number(row.main_count || 0).toFixed(1)} · support ${Number(row.support_count || 0).toFixed(1)} · converted ${Number(row.converted_count || 0).toFixed(2)}
              <br>
              그룹 ${escapeHtml(row.event_group || '-')} / 사이트 ${escapeHtml(row.event_site || '-')} / 라인 ${escapeHtml(row.line || '-')}
            </div>
            <div class="list-item__body">
              ${row.setup_item ? `setup_item: ${escapeHtml(row.setup_item)}<br>` : ''}
              ${row.task_description ? `설명: ${escapeHtml(row.task_description)}<br>` : ''}
              ${row.task_cause ? `원인: ${escapeHtml(row.task_cause)}<br>` : ''}
              ${row.task_result ? `결과: ${escapeHtml(row.task_result)}` : ''}
            </div>
          </article>
        `).join('')
      : `<div class="list-item"><div class="list-item__meta">집계된 작업이 없습니다.</div></div>`;
  }

  function closeDetail() {
    els.detailPanel.classList.remove('is-open');
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

  let toastTimer = null;
  function showToast(message, type = 'success') {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.remove('hidden');
    els.toast.style.borderColor = type === 'danger' ? 'rgba(239,91,114,.35)' : 'rgba(122,162,255,.32)';
    toastTimer = setTimeout(() => {
      els.toast.classList.add('hidden');
    }, 2600);
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
    return escapeHtml(value).replace(/"/g, '&quot;');
  }
})();
