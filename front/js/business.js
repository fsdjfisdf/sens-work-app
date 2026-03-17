(() => {
  const API_ORIGIN = location.port === '3001'
    ? location.origin
    : `${location.protocol}//${location.hostname}:3001`;
  const BUSINESS_API = `${API_ORIGIN}/api/business`;
  const TRIP_REASONS = ['SET UP', 'MAINT', 'SET UP&MAINT', 'GTS'];
  const MONTH_WIDTH = 80;
  const charts = {};

  let allTrips = [];
  let filteredTrips = [];
  let isAdmin = false;
  let editingId = null;

  const dom = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const token = localStorage.getItem('x-access-token');
    if (!token || !token.trim()) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return;
    }

    isAdmin = localStorage.getItem('user-role') === 'admin';
    cacheDom();
    bindNav();
    bindEvents();
    syncAdminUi();
    fetchTrips();
  }

  function cacheDom() {
    dom.menuBtn = document.querySelector('.menu-btn');
    dom.menuBar = document.querySelector('.menu-bar');
    dom.unsigned = document.querySelector('.unsigned');
    dom.signed = document.querySelector('.signed');
    dom.signOut = document.getElementById('sign-out');

    dom.searchName = document.getElementById('search-name');
    dom.searchGroup = document.getElementById('search-group');
    dom.searchSite = document.getElementById('search-site');
    dom.searchCountry = document.getElementById('search-country');
    dom.searchCity = document.getElementById('search-city');
    dom.searchCustomer = document.getElementById('search-customer');
    dom.searchEquipment = document.getElementById('search-equipment');
    dom.searchTripReason = document.getElementById('search-trip-reason');
    dom.searchDateFrom = document.getElementById('search-date-from');
    dom.searchDateTo = document.getElementById('search-date-to');
    dom.searchButton = document.getElementById('search-button');
    dom.resetButton = document.getElementById('reset-button');
    dom.exportButton = document.getElementById('export-button');
    dom.addTripButton = document.getElementById('add-trip-button');

    dom.statTotalTrips = document.getElementById('stat-total-trips');
    dom.statActiveEngineers = document.getElementById('stat-active-engineers');
    dom.statUniqueEngineers = document.getElementById('stat-unique-engineers');
    dom.statTotalDays = document.getElementById('stat-total-days');

    dom.tripBoardWrapper = document.getElementById('trip-board-wrapper');
    dom.tripBoardEmpty = document.getElementById('trip-board-empty');
    dom.tripBoardHeader = document.getElementById('trip-board-header');
    dom.tripBoardBody = document.getElementById('trip-board-body');
    dom.boardRange = document.getElementById('board-range');

    dom.tableBody = document.querySelector('#business-table tbody');
    dom.tableResultText = document.getElementById('table-result-text');

    dom.modal = document.getElementById('trip-modal');
    dom.modalTitle = document.getElementById('trip-modal-title');
    dom.modalClose = document.getElementById('trip-modal-close');
    dom.modalCancel = document.getElementById('trip-form-cancel');
    dom.tripForm = document.getElementById('trip-form');
    dom.tripId = document.getElementById('trip-id');
    dom.tripName = document.getElementById('trip-name');
    dom.tripCompany = document.getElementById('trip-company');
    dom.tripGroup = document.getElementById('trip-group');
    dom.tripSite = document.getElementById('trip-site');
    dom.tripCountry = document.getElementById('trip-country');
    dom.tripCity = document.getElementById('trip-city');
    dom.tripCustomer = document.getElementById('trip-customer');
    dom.tripEquipment = document.getElementById('trip-equipment');
    dom.tripReason = document.getElementById('trip-reason');
    dom.tripStartDate = document.getElementById('trip-start-date');
    dom.tripEndDate = document.getElementById('trip-end-date');
    dom.toast = document.getElementById('toast');

    dom.groupList = document.getElementById('group-list');
    dom.siteList = document.getElementById('site-list');
    dom.countryList = document.getElementById('country-list');
    dom.cityList = document.getElementById('city-list');
    dom.customerList = document.getElementById('customer-list');
    dom.equipmentList = document.getElementById('equipment-list');
  }

  function bindNav() {
    const token = localStorage.getItem('x-access-token');
    if (!token) {
      dom.unsigned?.classList.remove('hidden');
      dom.signed?.classList.add('hidden');
    } else {
      dom.unsigned?.classList.add('hidden');
      dom.signed?.classList.remove('hidden');
    }

    if (dom.menuBtn && dom.menuBar) {
      dom.menuBtn.addEventListener('click', () => {
        dom.menuBar.classList.toggle('open');
      });

      document.addEventListener('click', (event) => {
        if (!dom.menuBtn.contains(event.target) && !dom.menuBar.contains(event.target)) {
          dom.menuBar.classList.remove('open');
        }
      });
    }

    dom.signOut?.addEventListener('click', () => {
      localStorage.removeItem('x-access-token');
      localStorage.removeItem('user-role');
      alert('로그아웃 되었습니다.');
      window.location.replace('./signin.html');
    });
  }

  function bindEvents() {
    dom.searchButton?.addEventListener('click', applyFilters);
    dom.resetButton?.addEventListener('click', resetFilters);
    dom.exportButton?.addEventListener('click', exportToExcel);
    dom.addTripButton?.addEventListener('click', openCreateModal);
    dom.modalClose?.addEventListener('click', closeModal);
    dom.modalCancel?.addEventListener('click', closeModal);
    dom.tripForm?.addEventListener('submit', submitTripForm);

    dom.modal?.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.close === 'modal') {
        closeModal();
      }
    });

    dom.tableBody?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const id = Number(button.dataset.id);
      const action = button.dataset.action;

      if (action === 'edit') {
        openEditModal(id);
      }
      if (action === 'delete') {
        await deleteTrip(id);
      }
    });
  }

  function syncAdminUi() {
    document.querySelectorAll('.admin-only').forEach((element) => {
      element.classList.toggle('hidden', !isAdmin);
    });
  }

  function authConfig() {
    return {
      headers: {
        'x-access-token': localStorage.getItem('x-access-token') || ''
      }
    };
  }

  async function fetchTrips() {
    try {
      const response = await axios.get(BUSINESS_API, authConfig());
      allTrips = (Array.isArray(response.data) ? response.data : [])
        .map(normalizeTrip)
        .sort((a, b) => {
          const endDiff = new Date(b.endDate) - new Date(a.endDate);
          return endDiff !== 0 ? endDiff : b.id - a.id;
        });
      hydrateOptionSources(allTrips);
      applyFilters();
    } catch (error) {
      console.error('해외출장 데이터 조회 실패:', error);
      showToast('해외출장 데이터를 불러오지 못했습니다.', true);
    }
  }

  function normalizeTrip(row) {
    const startDate = toDateOnly(row.START_DATE ?? row.startDate);
    const endDate = toDateOnly(row.END_DATE ?? row.endDate);
    const tripReason = String(row.TRIP_REASON ?? row.tripReason ?? row.reason ?? 'SET UP').trim() || 'SET UP';

    return {
      id: Number(row.id),
      name: String(row.NAME ?? row.name ?? '').trim(),
      company: String(row.COMPANY ?? row.company ?? '').trim(),
      group: String(row.GROUP ?? row.group ?? '').trim(),
      site: String(row.SITE ?? row.site ?? '').trim(),
      country: String(row.COUNTRY ?? row.country ?? '').trim(),
      city: String(row.CITY ?? row.city ?? '').trim(),
      customer: String(row.CUSTOMER ?? row.customer ?? '').trim(),
      equipment: String(row.EQUIPMENT ?? row.equipment ?? '').trim(),
      tripReason,
      startDate,
      endDate,
      tripDays: Number(row.trip_days) || calcTripDays(startDate, endDate)
    };
  }

  function applyFilters() {
    const filters = getFilters();
    filteredTrips = allTrips.filter((trip) => matchesFilter(trip, filters));
    renderSummary(filteredTrips);
    renderTripBoard(filteredTrips);
    renderCharts(filteredTrips);
    renderTable(filteredTrips);
  }

  function getFilters() {
    return {
      name: dom.searchName.value.trim().toLowerCase(),
      group: dom.searchGroup.value,
      site: dom.searchSite.value,
      country: dom.searchCountry.value,
      city: dom.searchCity.value,
      customer: dom.searchCustomer.value,
      equipment: dom.searchEquipment.value,
      tripReason: dom.searchTripReason.value,
      dateFrom: dom.searchDateFrom.value,
      dateTo: dom.searchDateTo.value
    };
  }

  function matchesFilter(trip, filters) {
    const keywordMatched =
      !filters.name ||
      [trip.name, trip.customer, trip.equipment, trip.country, trip.city]
        .join(' ')
        .toLowerCase()
        .includes(filters.name);

    const sameValue = (expected, actual) => !expected || expected === actual;
    const rangeMatched = matchesDateRange(trip, filters.dateFrom, filters.dateTo);

    return keywordMatched
      && sameValue(filters.group, trip.group)
      && sameValue(filters.site, trip.site)
      && sameValue(filters.country, trip.country)
      && sameValue(filters.city, trip.city)
      && sameValue(filters.customer, trip.customer)
      && sameValue(filters.equipment, trip.equipment)
      && sameValue(filters.tripReason, trip.tripReason)
      && rangeMatched;
  }

  function matchesDateRange(trip, dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return true;
    const tripStart = new Date(`${trip.startDate}T00:00:00`);
    const tripEnd = new Date(`${trip.endDate}T00:00:00`);
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    if (from && to) {
      return tripEnd >= from && tripStart <= to;
    }
    if (from) {
      return tripEnd >= from;
    }
    return tripStart <= to;
  }

  function resetFilters() {
    dom.searchName.value = '';
    dom.searchGroup.value = '';
    dom.searchSite.value = '';
    dom.searchCountry.value = '';
    dom.searchCity.value = '';
    dom.searchCustomer.value = '';
    dom.searchEquipment.value = '';
    dom.searchTripReason.value = '';
    dom.searchDateFrom.value = '';
    dom.searchDateTo.value = '';
    applyFilters();
  }

  function renderSummary(data) {
    const totalTrips = data.length;
    const activeNames = new Set(data.filter(isActiveTrip).map((trip) => trip.name));
    const uniqueEngineers = new Set(data.map((trip) => trip.name));
    const totalDays = data.reduce((sum, trip) => sum + trip.tripDays, 0);

    dom.statTotalTrips.textContent = numberFormat(totalTrips);
    dom.statActiveEngineers.textContent = numberFormat(activeNames.size);
    dom.statUniqueEngineers.textContent = numberFormat(uniqueEngineers.size);
    dom.statTotalDays.textContent = numberFormat(totalDays);
  }

  function renderTripBoard(data) {
    dom.tripBoardHeader.innerHTML = '';
    dom.tripBoardBody.innerHTML = '';

    if (!data.length) {
      dom.tripBoardWrapper.classList.add('hidden');
      dom.tripBoardEmpty.classList.remove('hidden');
      dom.boardRange.textContent = '-';
      return;
    }

    dom.tripBoardWrapper.classList.remove('hidden');
    dom.tripBoardEmpty.classList.add('hidden');

    const rangeStart = startOfMonth(new Date(Math.min(...data.map((trip) => toTimestamp(trip.startDate)))));
    const rangeEnd = endOfMonth(new Date(Math.max(...data.map((trip) => toTimestamp(trip.endDate)))));
    const months = buildMonths(rangeStart, rangeEnd);
    const totalDays = daysBetween(rangeStart, rangeEnd) + 1;
    const trackWidth = months.length * MONTH_WIDTH;

    dom.boardRange.textContent = `${formatDate(rangeStart)} ~ ${formatDate(rangeEnd)}`;
    dom.tripBoardHeader.innerHTML = `
      <div class="board-meta-head">Trip Summary</div>
      <div class="board-months" style="grid-template-columns: repeat(${months.length}, ${MONTH_WIDTH}px); width:${trackWidth}px;">
        ${months.map((month) => `<div class="month-cell">${month.label}</div>`).join('')}
      </div>
    `;

    const today = new Date();
    const todayDate = toDateOnly(today);
    const showTodayMarker = todayDate >= formatDate(rangeStart) && todayDate <= formatDate(rangeEnd);
    const todayLeft = showTodayMarker
      ? (daysBetween(rangeStart, new Date(`${todayDate}T00:00:00`)) / totalDays) * trackWidth
      : null;

    const rowsHtml = data
      .slice()
      .sort((a, b) => {
        if (isActiveTrip(a) !== isActiveTrip(b)) return Number(isActiveTrip(b)) - Number(isActiveTrip(a));
        return new Date(b.startDate) - new Date(a.startDate);
      })
      .map((trip) => {
        const start = new Date(`${trip.startDate}T00:00:00`);
        const left = (daysBetween(rangeStart, start) / totalDays) * trackWidth;
        const width = Math.max((trip.tripDays / totalDays) * trackWidth, 56);
        const reasonClass = getReasonClass(trip.tripReason, true);
        const statusBadge = isActiveTrip(trip)
          ? '<span class="badge active">진행 중</span>'
          : '';
        const barLabel = `${escapeHtml(trip.country)} · ${escapeHtml(trip.tripReason)} · ${escapeHtml(trip.customer)}`;

        return `
          <div class="trip-board-row">
            <div class="trip-meta">
              <div class="trip-meta-top">
                <div>
                  <div class="trip-name">${escapeHtml(trip.name)}</div>
                  <div class="trip-meta-sub">${escapeHtml(trip.company)} · ${escapeHtml(trip.group)} / ${escapeHtml(trip.site)}</div>
                </div>
                <div class="trip-id">#${trip.id}</div>
              </div>
              <div class="trip-meta-bottom">${escapeHtml(trip.country)} ${escapeHtml(trip.city)} · ${escapeHtml(trip.customer)} · ${escapeHtml(trip.equipment)}</div>
              <div class="trip-meta-bottom">${trip.startDate} ~ ${trip.endDate} (${trip.tripDays}일) ${statusBadge}</div>
            </div>
            <div class="trip-track" style="width:${trackWidth}px; background-size:${MONTH_WIDTH}px 100%;">
              ${showTodayMarker ? `<span class="today-marker" style="left:${todayLeft}px;"></span>` : ''}
              <div class="trip-bar ${reasonClass} ${isActiveTrip(trip) ? 'active' : ''}" style="left:${left}px; width:${width}px;" title="${trip.name} | ${trip.country} ${trip.city} | ${trip.tripReason} | ${trip.startDate} ~ ${trip.endDate}">
                <span>${barLabel}</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    dom.tripBoardBody.innerHTML = rowsHtml;
  }

  function renderCharts(data) {
    renderMonthlyChart(data);
    renderPurposeChart(data);
    renderCountryChart(data);
    renderEquipmentChart(data);
    renderEngineerDaysChart(data);
    renderGroupSiteChart(data);
  }

  function renderMonthlyChart(data) {
    const source = countByMonth(data, (trip) => trip.startDate);
    renderChart('monthly-trips-chart', {
      type: 'bar',
      data: {
        labels: source.labels,
        datasets: [{
          label: '출장 건수',
          data: source.values,
          backgroundColor: 'rgba(37, 99, 235, 0.18)',
          borderColor: '#2563eb',
          borderWidth: 1.5,
          borderRadius: 8,
          maxBarThickness: 42
        }]
      },
      options: commonBarOptions('건수')
    });
  }

  function renderPurposeChart(data) {
    const counts = TRIP_REASONS.map((reason) => data.filter((trip) => trip.tripReason === reason).length);
    renderChart('purpose-chart', {
      type: 'doughnut',
      data: {
        labels: TRIP_REASONS,
        datasets: [{
          data: counts,
          backgroundColor: ['#2563eb', '#0f766e', '#7c3aed', '#ea580c'],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${numberFormat(context.raw)}건`
            }
          },
          datalabels: {
            color: '#0f172a',
            font: { weight: '800' },
            formatter: (value) => value || ''
          }
        }
      }
    });
  }

  function renderCountryChart(data) {
    const ranked = buildRanking(data, (trip) => trip.country, (trip) => 1, 8);
    renderChart('country-chart', {
      type: 'bar',
      data: {
        labels: ranked.labels,
        datasets: [{
          label: '출장 건수',
          data: ranked.values,
          backgroundColor: 'rgba(15, 118, 110, 0.18)',
          borderColor: '#0f766e',
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: commonHorizontalBarOptions('건수')
    });
  }

  function renderEquipmentChart(data) {
    const ranked = buildRanking(data, (trip) => trip.equipment, (trip) => 1, 8);
    renderChart('equipment-chart', {
      type: 'bar',
      data: {
        labels: ranked.labels,
        datasets: [{
          label: '출장 건수',
          data: ranked.values,
          backgroundColor: 'rgba(124, 58, 237, 0.18)',
          borderColor: '#7c3aed',
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: commonHorizontalBarOptions('건수')
    });
  }

  function renderEngineerDaysChart(data) {
    const ranked = buildRanking(data, (trip) => trip.name, (trip) => trip.tripDays, 10);
    renderChart('engineer-days-chart', {
      type: 'bar',
      data: {
        labels: ranked.labels,
        datasets: [{
          label: '출장 일수',
          data: ranked.values,
          backgroundColor: 'rgba(234, 88, 12, 0.18)',
          borderColor: '#ea580c',
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: commonHorizontalBarOptions('일수')
    });
  }

  function renderGroupSiteChart(data) {
    const ranked = buildRanking(data, (trip) => `${trip.group}/${trip.site}`, (trip) => 1, 10);
    renderChart('group-site-chart', {
      type: 'bar',
      data: {
        labels: ranked.labels,
        datasets: [{
          label: '출장 건수',
          data: ranked.values,
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          borderColor: '#1d4ed8',
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: commonBarOptions('건수')
    });
  }

  function renderTable(data) {
    dom.tableResultText.textContent = `${numberFormat(data.length)}건`;

    if (!data.length) {
      dom.tableBody.innerHTML = `
        <tr>
          <td colspan="14" style="padding:32px 12px; color:#64748b;">조건에 맞는 출장 이력이 없습니다.</td>
        </tr>
      `;
      return;
    }

    dom.tableBody.innerHTML = data.map((trip) => {
      const reasonClass = getReasonClass(trip.tripReason, false);
      const actions = isAdmin
        ? `
          <td>
            <div class="table-actions">
              <button class="table-action-btn" type="button" data-action="edit" data-id="${trip.id}">수정</button>
              <button class="table-action-btn danger" type="button" data-action="delete" data-id="${trip.id}">삭제</button>
            </div>
          </td>
        `
        : '<td class="hidden"></td>';

      return `
        <tr class="${isActiveTrip(trip) ? 'active-row' : ''}">
          <td>${trip.id}</td>
          <td class="name-cell">${escapeHtml(trip.name)}</td>
          <td>${escapeHtml(trip.company)}</td>
          <td>${escapeHtml(trip.group)}</td>
          <td>${escapeHtml(trip.site)}</td>
          <td>${escapeHtml(trip.country)}</td>
          <td>${escapeHtml(trip.city)}</td>
          <td class="customer-cell">${escapeHtml(trip.customer)}</td>
          <td class="equipment-cell">${escapeHtml(trip.equipment)}</td>
          <td><span class="badge ${reasonClass}">${escapeHtml(trip.tripReason)}</span></td>
          <td>${trip.startDate}</td>
          <td>${trip.endDate}</td>
          <td>${trip.tripDays}</td>
          ${actions}
        </tr>
      `;
    }).join('');
  }

  function hydrateOptionSources(data) {
    fillSelect(dom.searchGroup, uniqueValues(data, 'group'));
    fillSelect(dom.searchSite, uniqueValues(data, 'site'));
    fillSelect(dom.searchCountry, uniqueValues(data, 'country'));
    fillSelect(dom.searchCity, uniqueValues(data, 'city'));
    fillSelect(dom.searchCustomer, uniqueValues(data, 'customer'));
    fillSelect(dom.searchEquipment, uniqueValues(data, 'equipment'));

    fillDatalist(dom.groupList, uniqueValues(data, 'group'));
    fillDatalist(dom.siteList, uniqueValues(data, 'site'));
    fillDatalist(dom.countryList, uniqueValues(data, 'country'));
    fillDatalist(dom.cityList, uniqueValues(data, 'city'));
    fillDatalist(dom.customerList, uniqueValues(data, 'customer'));
    fillDatalist(dom.equipmentList, uniqueValues(data, 'equipment'));
  }

  function fillSelect(select, values) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">전체</option>' + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if (values.includes(currentValue)) {
      select.value = currentValue;
    }
  }

  function fillDatalist(datalist, values) {
    datalist.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
  }

  function openCreateModal() {
    if (!isAdmin) return;
    editingId = null;
    dom.modalTitle.textContent = '출장 이력 추가';
    dom.tripForm.reset();
    dom.tripId.value = '';
    dom.tripReason.value = 'SET UP';
    openModal();
  }

  function openEditModal(id) {
    if (!isAdmin) return;
    const trip = allTrips.find((item) => item.id === id);
    if (!trip) return;

    editingId = id;
    dom.modalTitle.textContent = '출장 이력 수정';
    dom.tripId.value = String(trip.id);
    dom.tripName.value = trip.name;
    dom.tripCompany.value = trip.company;
    dom.tripGroup.value = trip.group;
    dom.tripSite.value = trip.site;
    dom.tripCountry.value = trip.country;
    dom.tripCity.value = trip.city;
    dom.tripCustomer.value = trip.customer;
    dom.tripEquipment.value = trip.equipment;
    dom.tripReason.value = trip.tripReason;
    dom.tripStartDate.value = trip.startDate;
    dom.tripEndDate.value = trip.endDate;
    openModal();
  }

  function openModal() {
    dom.modal.classList.remove('hidden');
    dom.modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    dom.modal.classList.add('hidden');
    dom.modal.setAttribute('aria-hidden', 'true');
  }

  async function submitTripForm(event) {
    event.preventDefault();
    if (!isAdmin) return;

    const payload = {
      name: dom.tripName.value.trim(),
      company: dom.tripCompany.value.trim(),
      group: dom.tripGroup.value.trim(),
      site: dom.tripSite.value.trim(),
      country: dom.tripCountry.value.trim(),
      city: dom.tripCity.value.trim(),
      customer: dom.tripCustomer.value.trim(),
      equipment: dom.tripEquipment.value.trim(),
      tripReason: dom.tripReason.value,
      startDate: dom.tripStartDate.value,
      endDate: dom.tripEndDate.value
    };

    if (!validatePayload(payload)) return;

    try {
      if (editingId) {
        await axios.put(`${BUSINESS_API}/${editingId}`, payload, authConfig());
        showToast('출장 이력이 수정되었습니다.');
      } else {
        await axios.post(BUSINESS_API, payload, authConfig());
        showToast('출장 이력이 추가되었습니다.');
      }
      closeModal();
      await fetchTrips();
    } catch (error) {
      console.error('출장 저장 실패:', error);
      showToast(error.response?.data?.error || '출장 저장에 실패했습니다.', true);
    }
  }

  async function deleteTrip(id) {
    if (!isAdmin) return;
    const trip = allTrips.find((item) => item.id === id);
    if (!trip) return;

    const confirmed = window.confirm(`${trip.name} / ${trip.country} ${trip.city} 출장 이력을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${BUSINESS_API}/${id}`, authConfig());
      showToast('출장 이력이 삭제되었습니다.');
      await fetchTrips();
    } catch (error) {
      console.error('출장 삭제 실패:', error);
      showToast(error.response?.data?.error || '출장 삭제에 실패했습니다.', true);
    }
  }

  function validatePayload(payload) {
    const requiredEntries = [
      ['이름', payload.name],
      ['Company', payload.company],
      ['Group', payload.group],
      ['Site', payload.site],
      ['Country', payload.country],
      ['City', payload.city],
      ['Customer', payload.customer],
      ['Equipment', payload.equipment],
      ['출장 목적', payload.tripReason],
      ['Start Date', payload.startDate],
      ['End Date', payload.endDate]
    ];

    const invalid = requiredEntries.find(([, value]) => !value);
    if (invalid) {
      showToast(`${invalid[0]} 값이 비어 있습니다.`, true);
      return false;
    }
    if (!TRIP_REASONS.includes(payload.tripReason)) {
      showToast('출장 목적 값이 올바르지 않습니다.', true);
      return false;
    }
    if (payload.endDate < payload.startDate) {
      showToast('종료일은 시작일보다 빠를 수 없습니다.', true);
      return false;
    }
    return true;
  }

  function exportToExcel() {
    if (!filteredTrips.length) {
      showToast('엑셀로 저장할 데이터가 없습니다.', true);
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
      Reason: trip.tripReason,
      StartDate: trip.startDate,
      EndDate: trip.endDate,
      Days: trip.tripDays
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BusinessTrip');
    XLSX.writeFile(workbook, `business_trip_${toDateOnly(new Date())}.xlsx`);
  }

  function renderChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    charts[canvasId]?.destroy();
    charts[canvasId] = new Chart(ctx, config);
  }

  function commonBarOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#475569' }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#475569' },
          title: { display: true, text: yLabel }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw} ${yLabel}`
          }
        },
        datalabels: {
          color: '#0f172a',
          anchor: 'end',
          align: 'end',
          font: { weight: '800' },
          formatter: (value) => value || ''
        }
      }
    };
  }

  function commonHorizontalBarOptions(xLabel) {
    const base = commonBarOptions(xLabel);
    return {
      ...base,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, color: '#475569' },
          title: { display: true, text: xLabel }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#475569' }
        }
      },
      plugins: {
        ...base.plugins,
        datalabels: {
          color: '#0f172a',
          anchor: 'end',
          align: 'right',
          offset: 4,
          font: { weight: '800' },
          formatter: (value) => value || ''
        }
      }
    };
  }

  function countByMonth(data, selector) {
    const counter = new Map();
    data.forEach((item) => {
      const date = selector(item);
      const key = date.slice(0, 7);
      counter.set(key, (counter.get(key) || 0) + 1);
    });
    const labels = [...counter.keys()].sort();
    return { labels, values: labels.map((label) => counter.get(label)) };
  }

  function buildRanking(data, labelSelector, valueSelector, limit) {
    const map = new Map();
    data.forEach((item) => {
      const label = labelSelector(item) || '미분류';
      map.set(label, (map.get(label) || 0) + valueSelector(item));
    });
    const entries = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return {
      labels: entries.map(([label]) => label),
      values: entries.map(([, value]) => value)
    };
  }

  function buildMonths(start, end) {
    const months = [];
    const cursor = new Date(start);
    cursor.setDate(1);

    while (cursor <= end) {
      months.push({
        label: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
        date: new Date(cursor)
      });
      cursor.setMonth(cursor.getMonth() + 1, 1);
    }
    return months;
  }

  function uniqueValues(data, key) {
    return [...new Set(data.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function getReasonClass(reason, forBar = false) {
    if (reason === 'SET UP') return forBar ? 'trip-bar--setup' : 'reason-setup';
    if (reason === 'MAINT') return forBar ? 'trip-bar--maint' : 'reason-maint';
    if (reason === 'SET UP&MAINT') return forBar ? 'trip-bar--hybrid' : 'reason-hybrid';
    return forBar ? 'trip-bar--gts' : 'reason-gts';
  }

  function isActiveTrip(trip) {
    const today = toDateOnly(new Date());
    return trip.startDate <= today && today <= trip.endDate;
  }

  function calcTripDays(startDate, endDate) {
    const diff = daysBetween(new Date(`${startDate}T00:00:00`), new Date(`${endDate}T00:00:00`));
    return diff + 1;
  }

  function daysBetween(start, end) {
    const ms = end.getTime() - start.getTime();
    return Math.floor(ms / 86400000);
  }

  function toTimestamp(dateString) {
    return new Date(`${dateString}T00:00:00`).getTime();
  }

  function toDateOnly(value) {
    if (!value) return '';
    if (value instanceof Date) {
      return formatDate(value);
    }
    const text = String(value);
    if (text.includes('T')) return text.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    return formatDate(new Date(text));
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function numberFormat(value) {
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  function showToast(message, isError = false) {
    dom.toast.textContent = message;
    dom.toast.style.background = isError ? '#991b1b' : '#0f172a';
    dom.toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      dom.toast.classList.add('hidden');
    }, 2800);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
