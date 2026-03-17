(() => {
  const API_HOST = `${window.location.protocol}//${window.location.hostname}:3001`;
  const BUSINESS_API = `${API_HOST}/api/business`;
  const USER_INFO_API = `${API_HOST}/user-info`;

  const FIXED_REASONS = ['SET UP', 'MAINT', 'SET UP&MAINT', 'GTS'];
  const charts = {};
  let allTrips = [];
  let filteredTrips = [];
  let currentUser = null;

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    setupAuthUi();
    bindEvents();

    try {
      await fetchCurrentUser();
      await loadTrips();
    } catch (error) {
      console.error(error);
      showToast('출장 데이터를 불러오는 중 오류가 발생했습니다.', 'danger');
    }
  }

  function cacheElements() {
    els.menuToggle = document.getElementById('menu-toggle');
    els.menuBar = document.getElementById('menu-bar');
    els.signOut = document.getElementById('sign-out');
    els.overlay = document.getElementById('overlay');
    els.tripModal = document.getElementById('trip-modal');
    els.tripForm = document.getElementById('trip-form');
    els.modalTitle = document.getElementById('modal-title');
    els.modalClose = document.getElementById('modal-close');
    els.cancelButton = document.getElementById('cancel-button');
    els.openCreateModal = document.getElementById('open-create-modal');
    els.exportButton = document.getElementById('export-button');
    els.searchButton = document.getElementById('search-button');
    els.resetButton = document.getElementById('reset-button');
    els.tableBody = document.querySelector('#business-table tbody');
    els.tableCaption = document.getElementById('table-caption');
    els.summaryTotalTrips = document.getElementById('summary-total-trips');
    els.summaryEngineers = document.getElementById('summary-engineers');
    els.summaryActive = document.getElementById('summary-active');
    els.summaryAvgDays = document.getElementById('summary-avg-days');
    els.toastRoot = document.getElementById('toast-root');

    els.filters = {
      name: document.getElementById('filter-name'),
      group: document.getElementById('filter-group'),
      site: document.getElementById('filter-site'),
      country: document.getElementById('filter-country'),
      reason: document.getElementById('filter-reason'),
      equipment: document.getElementById('filter-equipment'),
      customer: document.getElementById('filter-customer'),
      status: document.getElementById('filter-status'),
      startDate: document.getElementById('filter-start-date'),
      endDate: document.getElementById('filter-end-date'),
    };

    els.form = {
      id: document.getElementById('trip-id'),
      name: document.getElementById('trip-name'),
      company: document.getElementById('trip-company'),
      group: document.getElementById('trip-group'),
      site: document.getElementById('trip-site'),
      country: document.getElementById('trip-country'),
      city: document.getElementById('trip-city'),
      customer: document.getElementById('trip-customer'),
      equipment: document.getElementById('trip-equipment'),
      reason: document.getElementById('trip-reason'),
      startDate: document.getElementById('trip-start-date'),
      endDate: document.getElementById('trip-end-date'),
    };

    els.optionTargets = {
      name: document.getElementById('name-options'),
      equipment: document.getElementById('equipment-options'),
      customer: document.getElementById('customer-options'),
      group: document.getElementById('group-options'),
      site: document.getElementById('site-options'),
      country: document.getElementById('country-options'),
      city: document.getElementById('city-options'),
    };
  }

  function setupAuthUi() {
    const token = getToken();
    const unsigned = document.querySelector('.unsigned');
    const signed = document.querySelector('.signed');

    if (!token) {
      if (unsigned) unsigned.classList.remove('hidden');
      if (signed) signed.classList.add('hidden');
      window.location.replace('./signin.html');
      return;
    }

    if (unsigned) unsigned.classList.add('hidden');
    if (signed) signed.classList.remove('hidden');
  }

  function bindEvents() {
    els.menuToggle?.addEventListener('click', () => {
      els.menuBar?.classList.toggle('open');
    });

    els.signOut?.addEventListener('click', () => {
      localStorage.removeItem('x-access-token');
      window.location.replace('./signin.html');
    });

    els.openCreateModal?.addEventListener('click', () => openModal());
    els.modalClose?.addEventListener('click', closeModal);
    els.cancelButton?.addEventListener('click', closeModal);
    els.overlay?.addEventListener('click', closeModal);

    els.searchButton?.addEventListener('click', applyFilters);
    els.resetButton?.addEventListener('click', resetFilters);
    els.exportButton?.addEventListener('click', exportCurrentData);
    els.tripForm?.addEventListener('submit', handleSave);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });
  }

  async function fetchCurrentUser() {
    try {
      const response = await axios.get(USER_INFO_API, {
        headers: { 'x-access-token': getToken() }
      });
      currentUser = response?.data?.result || response?.data || null;
    } catch (error) {
      console.warn('user-info 조회 실패', error?.response?.data || error.message);
      currentUser = null;
    }
  }

  async function loadTrips() {
    const response = await axios.get(BUSINESS_API, {
      headers: { 'x-access-token': getToken() }
    });

    allTrips = (response.data || []).map(normalizeTrip);
    filteredTrips = [...allTrips];

    populateFilterOptions(allTrips);
    renderAll();
  }

  function normalizeTrip(row) {
    return {
      id: row.id ?? row.ID,
      name: row.NAME ?? row.name ?? '',
      company: row.COMPANY ?? row.company ?? '',
      group: row.GROUP ?? row.group ?? '',
      site: row.SITE ?? row.site ?? '',
      country: row.COUNTRY ?? row.country ?? '',
      city: row.CITY ?? row.city ?? '',
      customer: row.CUSTOMER ?? row.customer ?? '',
      equipment: row.EQUIPMENT ?? row.equipment ?? '',
      tripReason: row.TRIP_REASON ?? row.trip_reason ?? 'SET UP',
      startDate: normalizeDate(row.START_DATE ?? row.startDate ?? row.start_date),
      endDate: normalizeDate(row.END_DATE ?? row.endDate ?? row.end_date),
      createdAt: row.created_at ?? row.CREATED_AT ?? null,
      updatedAt: row.updated_at ?? row.UPDATED_AT ?? null,
    };
  }

  function normalizeDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  function populateFilterOptions(data) {
    fillSelect(els.filters.group, uniqueSorted(data.map(item => item.group)));
    fillSelect(els.filters.site, uniqueSorted(data.map(item => item.site)));
    fillSelect(els.filters.country, uniqueSorted(data.map(item => item.country)));

    fillDatalist(els.optionTargets.name, uniqueSorted(data.map(item => item.name)));
    fillDatalist(els.optionTargets.equipment, uniqueSorted(data.map(item => item.equipment)));
    fillDatalist(els.optionTargets.customer, uniqueSorted(data.map(item => item.customer)));
    fillDatalist(els.optionTargets.group, uniqueSorted(data.map(item => item.group)));
    fillDatalist(els.optionTargets.site, uniqueSorted(data.map(item => item.site)));
    fillDatalist(els.optionTargets.country, uniqueSorted(data.map(item => item.country)));
    fillDatalist(els.optionTargets.city, uniqueSorted(data.map(item => item.city)));
  }

  function fillSelect(select, values) {
    if (!select) return;
    const first = select.querySelector('option');
    const firstText = first ? first.textContent : '전체';
    const current = select.value;
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = firstText;
    select.appendChild(option);
    values.forEach((value) => {
      const el = document.createElement('option');
      el.value = value;
      el.textContent = value;
      select.appendChild(el);
    });
    select.value = values.includes(current) ? current : '';
  }

  function fillDatalist(datalist, values) {
    if (!datalist) return;
    datalist.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
  }

  function uniqueSorted(values) {
    return [...new Set((values || []).map(v => `${v || ''}`.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
  }

  function applyFilters() {
    const criteria = {
      name: els.filters.name.value.trim().toLowerCase(),
      group: els.filters.group.value,
      site: els.filters.site.value,
      country: els.filters.country.value,
      reason: els.filters.reason.value,
      equipment: els.filters.equipment.value.trim().toLowerCase(),
      customer: els.filters.customer.value.trim().toLowerCase(),
      status: els.filters.status.value,
      startDate: els.filters.startDate.value,
      endDate: els.filters.endDate.value,
    };

    filteredTrips = allTrips.filter((trip) => {
      const status = getTripStatus(trip);
      const overlaps = dateRangeOverlaps(trip.startDate, trip.endDate, criteria.startDate, criteria.endDate);

      return (!criteria.name || trip.name.toLowerCase().includes(criteria.name))
        && (!criteria.group || trip.group === criteria.group)
        && (!criteria.site || trip.site === criteria.site)
        && (!criteria.country || trip.country === criteria.country)
        && (!criteria.reason || trip.tripReason === criteria.reason)
        && (!criteria.equipment || trip.equipment.toLowerCase().includes(criteria.equipment))
        && (!criteria.customer || trip.customer.toLowerCase().includes(criteria.customer))
        && (!criteria.status || status === criteria.status)
        && overlaps;
    });

    renderAll();
  }

  function resetFilters() {
    Object.values(els.filters).forEach((input) => {
      input.value = '';
    });
    filteredTrips = [...allTrips];
    renderAll();
  }

  function renderAll() {
    renderSummary(filteredTrips);
    renderTable(filteredTrips);
    renderCharts(filteredTrips);
  }

  function renderSummary(data) {
    const uniqueEngineers = new Set(data.map((item) => item.name).filter(Boolean));
    const activeCount = new Set(data.filter((item) => getTripStatus(item) === 'active').map((item) => item.name)).size;
    const totalDays = data.reduce((sum, trip) => sum + getInclusiveDays(trip.startDate, trip.endDate), 0);
    const average = data.length ? (totalDays / data.length) : 0;

    els.summaryTotalTrips.textContent = formatNumber(data.length);
    els.summaryEngineers.textContent = formatNumber(uniqueEngineers.size);
    els.summaryActive.textContent = formatNumber(activeCount);
    els.summaryAvgDays.textContent = `${average.toFixed(1)}일`;
    els.tableCaption.textContent = `총 ${formatNumber(data.length)}건`;
  }

  function renderTable(data) {
    const sorted = [...data].sort((a, b) => {
      if (a.startDate === b.startDate) return (b.id || 0) - (a.id || 0);
      return (b.startDate || '').localeCompare(a.startDate || '');
    });

    if (!sorted.length) {
      els.tableBody.innerHTML = '<tr><td colspan="13" class="empty-state">조건에 맞는 출장 이력이 없습니다.</td></tr>';
      return;
    }

    els.tableBody.innerHTML = sorted.map((trip) => {
      const status = getTripStatus(trip);
      const days = getInclusiveDays(trip.startDate, trip.endDate);
      return `
        <tr>
          <td>${renderStatusBadge(status)}</td>
          <td>
            <span class="cell-main">${escapeHtml(trip.name)}</span>
            <span class="cell-sub">ID ${escapeHtml(String(trip.id ?? '-'))}</span>
          </td>
          <td>${escapeHtml(trip.company || '-')}</td>
          <td>${escapeHtml(trip.group || '-')}</td>
          <td>${escapeHtml(trip.site || '-')}</td>
          <td>${escapeHtml(trip.country || '-')}</td>
          <td>${escapeHtml(trip.city || '-')}</td>
          <td>${escapeHtml(trip.customer || '-')}</td>
          <td>${escapeHtml(trip.equipment || '-')}</td>
          <td>${renderReasonBadge(trip.tripReason)}</td>
          <td>
            <span class="cell-main">${escapeHtml(formatDisplayDate(trip.startDate))} ~ ${escapeHtml(formatDisplayDate(trip.endDate))}</span>
          </td>
          <td>${formatNumber(days)}일</td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn sm" data-action="edit" data-id="${trip.id}">수정</button>
              <button type="button" class="btn sm danger" data-action="delete" data-id="${trip.id}">삭제</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    els.tableBody.querySelectorAll('[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const trip = allTrips.find((item) => String(item.id) === button.dataset.id);
        if (trip) openModal(trip);
      });
    });

    els.tableBody.querySelectorAll('[data-action="delete"]').forEach((button) => {
      button.addEventListener('click', () => handleDelete(button.dataset.id));
    });
  }

  function renderCharts(data) {
    renderReasonChart(data);
    renderCountryChart(data);
    renderEquipmentChart(data);
    renderEngineerDaysChart(data);
  }

  function destroyChart(name) {
    if (charts[name]) {
      charts[name].destroy();
      charts[name] = null;
    }
  }

  function renderReasonChart(data) {
    const target = document.getElementById('reason-chart');
    destroyChart('reason');

    const counts = FIXED_REASONS.map((reason) => data.filter((item) => item.tripReason === reason).length);
    const total = counts.reduce((sum, value) => sum + value, 0);

    charts.reason = new Chart(target, {
      type: 'doughnut',
      data: {
        labels: FIXED_REASONS,
        datasets: [{
          data: counts,
          backgroundColor: ['#2563eb', '#14b8a6', '#7c3aed', '#f59e0b'],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 6,
        }]
      },
      options: {
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
              padding: 18,
              font: { size: 12, weight: '700' },
              color: '#475569',
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                const value = context.raw || 0;
                const ratio = total ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${context.label}: ${value}건 (${ratio}%)`;
              }
            }
          },
          datalabels: {
            color: '#111827',
            font: { weight: '900', size: 12 },
            formatter(value) {
              return value ? `${value}건` : '';
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  function renderCountryChart(data) {
    const target = document.getElementById('country-chart');
    destroyChart('country');

    const entries = aggregateCounts(data, (item) => item.country || '미입력').slice(0, 8);

    charts.country = new Chart(target, {
      type: 'bar',
      data: {
        labels: entries.map((entry) => entry.label),
        datasets: [{
          data: entries.map((entry) => entry.value),
          backgroundColor: 'rgba(37,99,235,.18)',
          borderColor: '#2563eb',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 34,
        }]
      },
      options: buildHorizontalBarOptions('건')
    });
  }

  function renderEquipmentChart(data) {
    const target = document.getElementById('equipment-chart');
    destroyChart('equipment');

    const entries = aggregateCounts(data, (item) => item.equipment || '미입력').slice(0, 8);

    charts.equipment = new Chart(target, {
      type: 'bar',
      data: {
        labels: entries.map((entry) => entry.label),
        datasets: [{
          data: entries.map((entry) => entry.value),
          backgroundColor: 'rgba(20,184,166,.18)',
          borderColor: '#14b8a6',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 34,
        }]
      },
      options: buildHorizontalBarOptions('건')
    });
  }

  function renderEngineerDaysChart(data) {
    const target = document.getElementById('engineer-days-chart');
    destroyChart('engineerDays');

    const totals = new Map();
    data.forEach((trip) => {
      const days = getInclusiveDays(trip.startDate, trip.endDate);
      totals.set(trip.name || '미입력', (totals.get(trip.name || '미입력') || 0) + days);
    });

    const entries = [...totals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    charts.engineerDays = new Chart(target, {
      type: 'bar',
      data: {
        labels: entries.map((entry) => entry.label),
        datasets: [{
          data: entries.map((entry) => entry.value),
          backgroundColor: 'rgba(124,58,237,.16)',
          borderColor: '#7c3aed',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 34,
        }]
      },
      options: buildHorizontalBarOptions('일')
    });
  }

  function buildHorizontalBarOptions(unit) {
    return {
      indexAxis: 'y',
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#eef2f7' },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
            precision: 0,
            callback(value) {
              return `${value}${unit}`;
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#334155',
            font: { size: 12, weight: '700' }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.raw}${unit}`;
            }
          }
        },
        datalabels: {
          color: '#111827',
          anchor: 'end',
          align: 'right',
          offset: 4,
          clamp: true,
          formatter(value) {
            return `${value}${unit}`;
          },
          font: { size: 11, weight: '900' }
        }
      },
      layout: {
        padding: { right: 28 }
      }
    };
  }

  function aggregateCounts(data, getter) {
    const counts = new Map();
    data.forEach((item) => {
      const key = getter(item);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  function openModal(trip = null) {
    if (trip) {
      els.modalTitle.textContent = '출장 수정';
      els.form.id.value = trip.id ?? '';
      els.form.name.value = trip.name ?? '';
      els.form.company.value = trip.company ?? '';
      els.form.group.value = trip.group ?? '';
      els.form.site.value = trip.site ?? '';
      els.form.country.value = trip.country ?? '';
      els.form.city.value = trip.city ?? '';
      els.form.customer.value = trip.customer ?? '';
      els.form.equipment.value = trip.equipment ?? '';
      els.form.reason.value = trip.tripReason ?? 'SET UP';
      els.form.startDate.value = trip.startDate ?? '';
      els.form.endDate.value = trip.endDate ?? '';
    } else {
      els.modalTitle.textContent = '출장 추가';
      els.tripForm.reset();
      els.form.id.value = '';
      els.form.reason.value = 'SET UP';
    }

    els.overlay.style.display = 'block';
    els.tripModal.style.display = 'block';
    els.tripModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    els.overlay.style.display = 'none';
    els.tripModal.style.display = 'none';
    els.tripModal.setAttribute('aria-hidden', 'true');
  }

  async function handleSave(event) {
    event.preventDefault();

    const payload = {
      name: els.form.name.value.trim(),
      company: els.form.company.value.trim(),
      group: els.form.group.value.trim(),
      site: els.form.site.value.trim(),
      country: els.form.country.value.trim(),
      city: els.form.city.value.trim(),
      customer: els.form.customer.value.trim(),
      equipment: els.form.equipment.value.trim(),
      tripReason: els.form.reason.value,
      startDate: els.form.startDate.value,
      endDate: els.form.endDate.value,
    };

    if (!payload.name || !payload.country || !payload.startDate || !payload.endDate) {
      showToast('이름, 국가, 시작일, 종료일은 필수입니다.', 'danger');
      return;
    }

    if (payload.startDate > payload.endDate) {
      showToast('종료일은 시작일보다 빠를 수 없습니다.', 'danger');
      return;
    }

    const id = els.form.id.value;

    try {
      if (id) {
        await axios.put(`${BUSINESS_API}/${id}`, payload, {
          headers: { 'x-access-token': getToken() }
        });
        showToast('출장 이력을 수정했습니다.', 'success');
      } else {
        await axios.post(BUSINESS_API, payload, {
          headers: { 'x-access-token': getToken() }
        });
        showToast('출장 이력을 추가했습니다.', 'success');
      }

      closeModal();
      await loadTrips();
      applyFilters();
    } catch (error) {
      console.error(error);
      showToast(error?.response?.data?.error || '저장 중 오류가 발생했습니다.', 'danger');
    }
  }

  async function handleDelete(id) {
    const trip = allTrips.find((item) => String(item.id) === String(id));
    const name = trip?.name || '이 출장 이력';

    if (!window.confirm(`${name} 출장 이력을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await axios.delete(`${BUSINESS_API}/${id}`, {
        headers: { 'x-access-token': getToken() }
      });
      showToast('출장 이력을 삭제했습니다.', 'success');
      await loadTrips();
      applyFilters();
    } catch (error) {
      console.error(error);
      showToast(error?.response?.data?.error || '삭제 중 오류가 발생했습니다.', 'danger');
    }
  }

  function exportCurrentData() {
    if (!filteredTrips.length) {
      showToast('내보낼 데이터가 없습니다.', 'danger');
      return;
    }

    const rows = filteredTrips.map((trip) => ({
      ID: trip.id,
      Name: trip.name,
      Company: trip.company,
      Group: trip.group,
      Site: trip.site,
      Country: trip.country,
      City: trip.city,
      Customer: trip.customer,
      Equipment: trip.equipment,
      'Trip Reason': trip.tripReason,
      'Start Date': trip.startDate,
      'End Date': trip.endDate,
      'Trip Days': getInclusiveDays(trip.startDate, trip.endDate),
      Status: statusLabel(getTripStatus(trip)),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Business Trips');
    XLSX.writeFile(wb, 'Business_Trips.xlsx');
  }

  function getTripStatus(trip) {
    const today = todayString();
    if (trip.startDate && trip.startDate > today) return 'upcoming';
    if (trip.endDate && trip.endDate < today) return 'completed';
    return 'active';
  }

  function statusLabel(status) {
    if (status === 'upcoming') return '예정';
    if (status === 'completed') return '완료';
    return '출장중';
  }

  function renderStatusBadge(status) {
    return `<span class="status-badge ${status}">${statusLabel(status)}</span>`;
  }

  function renderReasonBadge(reason) {
    const normalized = (reason || '').toUpperCase();
    let className = 'setup';
    if (normalized === 'MAINT') className = 'maint';
    else if (normalized === 'SET UP&MAINT') className = 'both';
    else if (normalized === 'GTS') className = 'gts';
    return `<span class="reason-badge ${className}">${escapeHtml(reason || 'SET UP')}</span>`;
  }

  function dateRangeOverlaps(startA, endA, startB, endB) {
    if (!startB && !endB) return true;
    const aStart = startA || '';
    const aEnd = endA || startA || '';

    if (startB && aEnd < startB) return false;
    if (endB && aStart > endB) return false;
    return true;
  }

  function getInclusiveDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / 86400000) + 1);
  }

  function formatDisplayDate(value) {
    if (!value) return '-';
    return value;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ko-KR').format(value || 0);
  }

  function todayString() {
    return new Date().toISOString().split('T')[0];
  }

  function getToken() {
    return localStorage.getItem('x-access-token') || '';
  }

  function showToast(message, type = 'default') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'danger' : type === 'success' ? 'success' : ''}`.trim();
    toast.textContent = message;
    els.toastRoot.appendChild(toast);
    setTimeout(() => {
      toast.remove();
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
})();
