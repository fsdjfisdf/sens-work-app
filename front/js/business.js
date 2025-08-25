/* ============================================================================
   S-WORKS — business.v2.js
   - Timeline canvas: retina, quarter grid, glow, hover/pin tooltip, wheel-zoom
   - Legend with counts, refined colors, better hit-testing
   - Fix: duplicated #current-engineer-count creation removed
   ========================================================================== */

let businessData = []; // 데이터를 전역 변수로 유지

document.addEventListener('DOMContentLoaded', () => {
  let currentUserNickname = null;

  // --- 로그인 체크 ---
  const token = localStorage.getItem('x-access-token');
  if (!token || token.trim() === '') {
    alert('로그인이 필요합니다.');
    window.location.replace('./signin.html');
    return;
  }

  // --- DOM 캐시 ---
  const tableBody = document.querySelector('#business-table tbody');
  const uniqueEngineerCountEl = document.getElementById('unique-engineer-count');
  const currentEngineerCountEl = document.getElementById('current-engineer-count');

  // 타임라인 캔버스 & 컨테이너
  const container = document.getElementById('chart-container');
  const canvas = document.getElementById('trip-chart');
  const ctx = canvas.getContext('2d');

  // 툴팁
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  // --- Theme helpers (CSS 변수와 동기화 시도) ---
  const css = getComputedStyle(document.documentElement);
  const THEME = {
    text: css.getPropertyValue('--text')?.trim() || '#0f172a',
    border: css.getPropertyValue('--border')?.trim() || '#e2e8f0',
    hair: css.getPropertyValue('--hair')?.trim() || '#eef2f7',
    accent: css.getPropertyValue('--accent')?.trim() || '#2563eb',
    theadBg: css.getPropertyValue('--thead-bg')?.trim() || '#0b3b7a'
  };

  // --- 타임라인 상태 ---
  let zoomFactor = 1.0;           // 가로 줌 배율
  const margin = 60;              // 좌우/상하 여백
  const baseYearWidth = 240;      // 1년당 px (줌 기준)
  let pinnedTrip = null;          // 클릭으로 고정된 아이템
  let hoverTrip = null;           // 마우스오버 아이템
  let geometry = null;            // 히트테스트용 도형 목록
  let timeRange = { start: '2018-01-01', end: '2025-12-31' }; // 동적 업뎃

  // --- 국가 색상 팔레트(정돈) ---
  const COUNTRY_COLORS = {
    USA: '#3b82f6',       // blue
    Ireland: '#22c55e',   // green
    Japan: '#f59e0b',     // amber
    China: '#ef4444',     // red
    Taiwan: '#8b5cf6',    // purple
    Singapore: '#6b7280'  // gray
  };

  // --- 유틸 ---
  const dateToTimestamp = (date) => new Date(date).getTime();
  const formatDate = (d) => (typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]);
  const padDate = (date, days) => {
    const r = new Date(date);
    r.setDate(r.getDate() + days);
    return formatDate(r);
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const hexToRgba = (hex, alpha = 1) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 동적 범위: 데이터 기준으로 1년 패딩
  const computeTimeRange = (data) => {
    if (!data || data.length === 0) return { start: '2018-01-01', end: '2025-12-31' };
    const min = new Date(Math.min(...data.map(d => dateToTimestamp(d.START_DATE))));
    const max = new Date(Math.max(...data.map(d => dateToTimestamp(d.END_DATE))));
    const start = new Date(min.getFullYear() - 1, 0, 1);
    const end = new Date(max.getFullYear() + 1, 11, 31);
    return { start: formatDate(start), end: formatDate(end) };
  };

  // 날짜→X좌표 맵핑
  const dateToX = (date) => {
    const t = dateToTimestamp(date);
    const t0 = dateToTimestamp(timeRange.start);
    const t1 = dateToTimestamp(timeRange.end);
    const usableW = (yearCount() * baseYearWidth * zoomFactor);
    return margin + ((t - t0) / (t1 - t0)) * usableW;
  };

  const yearCount = () => {
    const s = new Date(timeRange.start).getFullYear();
    const e = new Date(timeRange.end).getFullYear();
    return (e - s + 1);
  };

  // --- 현재 사용자 조회 ---
  async function getCurrentUser() {
    try {
      const response = await axios.get('http://3.37.73.151:3001/user-info', {
        headers: { 'x-access-token': localStorage.getItem('x-access-token') }
      });
      currentUserNickname = response.data?.result?.NAME || null;
      console.log('현재 로그인한 사용자:', currentUserNickname);
    } catch (error) {
      console.error('현재 사용자 정보를 가져오는 중 오류:', error);
    }
  }

  // --- 카운트 UI ---
  const calculateUniqueEngineers = (data) => {
    const unique = new Set(data.map(t => t.NAME));
    uniqueEngineerCountEl.textContent = `Total Engineers: ${unique.size}`;
  };

  const calculateCurrentEngineers = (data) => {
    const today = new Date();
    const curr = data.filter(t => new Date(t.START_DATE) <= today && today <= new Date(t.END_DATE));
    const unique = new Set(curr.map(t => t.NAME));
    currentEngineerCountEl.textContent = `Currently On Business Trips: ${unique.size}`;
  };

  // --- 데이터 요청 ---
  const fetchTrips = async () => {
    try {
      const response = await axios.get('http://3.37.73.151:3001/api/business');
      await getCurrentUser();
      businessData = response.data || [];
      renderTable(businessData);
      timeRange = computeTimeRange(businessData);
      renderTimeline(businessData);
      calculateUniqueEngineers(businessData);
      calculateCurrentEngineers(businessData);
      renderYearlyTripsChart(businessData);
      renderGroupSiteChart(businessData);
      renderCountryCityChart(businessData);
      renderEquipmentChart(businessData);
      renderEngineerTripCountChart(businessData);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  // --- 테이블 렌더 ---
  const renderTable = (data) => {
    const sorted = [...data].sort((a, b) => a.id - b.id);
    tableBody.innerHTML = '';
    sorted.forEach(trip => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${trip.id}</td>
        <td>${trip.NAME}</td>
        <td>${trip.GROUP}</td>
        <td>${trip.SITE}</td>
        <td>${trip.COUNTRY}</td>
        <td>${trip.CITY}</td>
        <td>${trip.CUSTOMER}</td>
        <td>${trip.EQUIPMENT}</td>
        <td>${formatDate(trip.START_DATE)}</td>
        <td>${formatDate(trip.END_DATE)}</td>
      `;
      tableBody.appendChild(row);
    });
  };

  // =============================================================================
  // 타임라인 (세련 스타일)
  // =============================================================================

  // 레이아웃/렌더 한 번에
  const renderTimeline = (data) => {
    geometry = { rows: [], segments: [], years: [] };
    hoverTrip = null; pinnedTrip = pinnedTrip && data.includes(pinnedTrip) ? pinnedTrip : null;

    // --- 캔버스 크기 계산 (레티나 스케일링) ---
    const years = yearCount();
    const cssWidth = margin * 2 + years * baseYearWidth * zoomFactor;
    const cssHeight = 720; // 충분한 높이(범례+축)
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    ctx.resetTransform?.();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // --- 배경 ---
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // --- 범례(국가별 + 카운트) ---
    drawLegend(ctx, cssWidth);

    // --- 그리드/축 ---
    drawGridAndAxes(ctx, cssWidth, cssHeight);

    // --- 라인 배치 (겹침 최소화) ---
    const rows = []; // each row is array of trips placed in this row
    const sorted = [...data].sort((a, b) => {
      // 같은 이름끼리 뭉치되, 시작일 빠른 순
      if (a.NAME === b.NAME) return dateToTimestamp(a.START_DATE) - dateToTimestamp(b.START_DATE);
      return a.NAME.localeCompare(b.NAME, 'en');
    });

    const lineHeight = 32;
    const yBase = margin + 70;   // 범례 아래로
    const padded = 30;           // 히트 테스트용 확장 일 수

    sorted.forEach(trip => {
      const x1 = dateToX(formatDate(trip.START_DATE));
      const x2 = dateToX(formatDate(trip.END_DATE));
      const x1e = dateToX(padDate(formatDate(trip.START_DATE), -padded));
      const x2e = dateToX(padDate(formatDate(trip.END_DATE), padded));

      // 빈 자리에 배치
      let rowIndex = rows.findIndex(row =>
        row.every(ex => {
          const ex1 = dateToX(padDate(formatDate(ex.START_DATE), -padded));
          const ex2 = dateToX(padDate(formatDate(ex.END_DATE), padded));
          return x2e < ex1 || x1e > ex2;
        })
      );
      if (rowIndex === -1) { rowIndex = rows.length; rows.push([]); }
      rows[rowIndex].push(trip);

      const y = yBase + rowIndex * lineHeight;

      // 선 스타일
      const color = COUNTRY_COLORS[trip.COUNTRY] || '#94a3b8';
      const glow = hexToRgba(color, 0.25);

      // Hover/Pin 강조
      const isActive = pinnedTrip === trip || hoverTrip === trip;
      const lw = isActive ? 10 : 8;

      ctx.save();
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.shadowColor = isActive ? glow : hexToRgba(color, 0.15);
      ctx.shadowBlur = isActive ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      ctx.restore();

      // 라벨 (충분히 길면 pill)
      const segWidth = x2 - x1;
      const labelText = trip.NAME;
      if (segWidth > 88) {
        const labelX = clamp(x1 + segWidth * 0.5, x1 + 44, x2 - 44);
        drawLabelPill(ctx, labelX, y - 12, labelText, color);
      } else {
        // 짧으면 라인 시작 위에 텍스트만
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(labelText, x1 + 6, y - 6);
      }

      geometry.segments.push({ x1, x2, y, trip, color, rowIndex });
    });

    geometry.rows = rows;
  };

  // --- 범례 ---
  function drawLegend(ctx, width) {
    const counts = {};
    (businessData || []).forEach(t => { counts[t.COUNTRY] = (counts[t.COUNTRY] || 0) + 1; });

    const items = Object.keys(COUNTRY_COLORS);
    const box = 12, gap = 10, pad = 10;
    const totalW = items.reduce((acc, k) => acc + (box + gap + ctx.measureText(k).width + 28), 0) + pad * 2;

    ctx.save();
    ctx.font = '12px Inter, system-ui, sans-serif';
    const left = Math.max(margin, (width - totalW) / 2);
    let x = left, y = margin + 8;

    items.forEach((key) => {
      const color = COUNTRY_COLORS[key];
      // 색상칩
      ctx.fillStyle = color;
      ctx.strokeStyle = THEME.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect?.(x, y, box, box, 3);
      if (!ctx.roundRect) { ctx.rect(x, y, box, box); }
      ctx.fill(); ctx.stroke();

      // 텍스트 + 카운트 배지
      ctx.fillStyle = THEME.text;
      ctx.fillText(`${key}`, x + box + 6, y + box - 2);

      const c = counts[key] || 0;
      const badgeText = String(c);
      const txw = ctx.measureText(badgeText).width;
      const bx = x + box + 6 + ctx.measureText(key).width + 8;
      const by = y - 1;
      ctx.fillStyle = hexToRgba(color, .10);
      ctx.strokeStyle = hexToRgba(color, .35);
      ctx.beginPath();
      const w = txw + 12, h = box + 2;
      ctx.roundRect?.(bx, by, w, h, 8);
      if (!ctx.roundRect) { ctx.rect(bx, by, w, h); }
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(badgeText, bx + 6, y + box - 3);

      x += Math.max(112, box + gap + ctx.measureText(key).width + txw + 26);
    });
    ctx.restore();
  }

  // --- 그리드 + 축 ---
  function drawGridAndAxes(ctx, w, h) {
    const startY = margin + 50;
    const endY = h - margin;
    const yearStart = new Date(timeRange.start).getFullYear();
    const yearEnd = new Date(timeRange.end).getFullYear();

    ctx.save();
    ctx.strokeStyle = THEME.hair;
    ctx.lineWidth = 1;

    for (let y = startY; y <= endY; y += 32) { // 행 가이드 (은은)
      ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(w - margin, y); ctx.stroke();
    }

    for (let y = startY; y <= endY; y += 32 * 5) { // 조금 더 진한 구분
      ctx.strokeStyle = '#e9eef7'; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(w - margin, y); ctx.stroke();
      ctx.strokeStyle = THEME.hair;
    }

    // 연/분기 수직선
    for (let year = yearStart; year <= yearEnd; year++) {
      const xYear = dateToX(`${year}-01-01`);
      // 연 라인(진)
      ctx.strokeStyle = '#d1d9e8';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(xYear, startY); ctx.lineTo(xYear, endY); ctx.stroke();

      // 레이블
      ctx.fillStyle = '#334155';
      ctx.font = '12.5px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(String(year), xYear, endY + 10);

      // 분기 (은은)
      ['04-01', '07-01', '10-01'].forEach(m => {
        const xQ = dateToX(`${year}-${m}`);
        ctx.strokeStyle = '#edf2fa';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xQ, startY); ctx.lineTo(xQ, endY); ctx.stroke();
      });
    }

    // 오늘 라인 (글로우)
    const today = formatDate(new Date());
    const xToday = dateToX(today);
    ctx.strokeStyle = hexToRgba('#ef4444', 0.9);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.shadowColor = hexToRgba('#ef4444', 0.35);
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(xToday, startY); ctx.lineTo(xToday, endY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // --- 라벨 필(rounded pill) ---
  function drawLabelPill(ctx, cx, cy, text, color) {
    ctx.save();
    ctx.font = '12px Inter, system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    const padX = 8, padY = 5, r = 999;
    const w = tw + padX * 2, h = 20;
    const x = Math.round(cx - w / 2), y = Math.round(cy - h);

    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.strokeStyle = hexToRgba(color, .45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(x, y, w, h, r);
    if (!ctx.roundRect) { ctx.rect(x, y, w, h); }
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, y + h / 2);
    ctx.restore();
  }

  // --- 히트 테스트 ---
  function findTripAt(x, y) {
    if (!geometry) return null;
    // 허용 범위 (선 두께 + 여유)
    for (let i = 0; i < geometry.segments.length; i++) {
      const s = geometry.segments[i];
      if (x >= s.x1 - 4 && x <= s.x2 + 4 && Math.abs(y - s.y) <= 8) {
        return s.trip;
      }
    }
    return null;
  }

  // --- 툴팁 렌더 ---
  function showTooltip(trip, mx, my) {
    if (!trip) { tooltip.style.display = 'none'; return; }
    const color = COUNTRY_COLORS[trip.COUNTRY] || '#94a3b8';
    tooltip.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>
        <strong style="font-weight:800">${trip.NAME}</strong>
      </div>
      <div style="font-size:12.5px; line-height:1.5;">
        ${formatDate(trip.START_DATE)} ~ ${formatDate(trip.END_DATE)}<br/>
        ${trip.COUNTRY}${trip.CITY ? ' · ' + trip.CITY : ''}${trip.CUSTOMER ? ' · ' + trip.CUSTOMER : ''}
      </div>
      <div style="margin-top:6px;color:#94a3b8;font-size:11.5px;">Click to pin / Unpin</div>
    `;
    tooltip.style.display = 'block';

    // 화면 밖으로 나가지 않도록 보정
    const rect = container.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    let left = rect.left + mx + 12;
    let top = rect.top + my - (ttRect.height / 2);

    if (left + ttRect.width > window.innerWidth - 8) left = window.innerWidth - ttRect.width - 8;
    if (top < 8) top = 8;
    if (top + ttRect.height > window.innerHeight - 8) top = window.innerHeight - ttRect.height - 8;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  // --- 인터랙션: hover / pin / wheel-zoom ---
  const localPoint = (evt) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width) / dpr;
    const y = (evt.clientY - rect.top) * (canvas.height / rect.height) / dpr;
    return { x, y };
  };

  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = localPoint(e);
    const t = findTripAt(x, y);
    if (t !== hoverTrip) {
      hoverTrip = t;
      renderTimeline(businessData);
    }
    // 툴팁은 캔버스 좌표 대신 컨테이너 상대 좌표로
    const rect = canvas.getBoundingClientRect();
    showTooltip(hoverTrip || pinnedTrip, e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('mouseleave', () => {
    hoverTrip = null;
    if (!pinnedTrip) tooltip.style.display = 'none';
    renderTimeline(businessData);
  });

  canvas.addEventListener('click', (e) => {
    const { x, y } = localPoint(e);
    const t = findTripAt(x, y);
    pinnedTrip = (pinnedTrip && t && pinnedTrip === t) ? null : t || pinnedTrip;
    if (!pinnedTrip) tooltip.style.display = 'none';
    renderTimeline(businessData);
  });

  // 줌 (휠): 컨테이너 수평 위치 보존
  container.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return; // 터치패드 수평 스크롤 보호
    e.preventDefault();

    const prevWidth = parseFloat(canvas.style.width || '0');
    const mouseX = e.clientX - container.getBoundingClientRect().left + container.scrollLeft;

    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    zoomFactor = clamp(zoomFactor * factor, 0.6, 3.5);

    renderTimeline(businessData);

    const newWidth = parseFloat(canvas.style.width || '0');
    const scale = newWidth / prevWidth || 1;
    const newScrollLeft = (mouseX * scale) - (e.clientX - container.getBoundingClientRect().left);
    container.scrollLeft = clamp(newScrollLeft, 0, canvas.scrollWidth || 1e9);
  }, { passive: false });

  // 창 크기 변경 시 재렌더(선명도 유지)
  window.addEventListener('resize', () => {
    renderTimeline(businessData);
  });

  // =============================================================================
  // 필터/리셋 & 보조 함수
  // =============================================================================
  const filterData = () => {
    const name = document.getElementById('search-name').value.toLowerCase();
    const group = document.getElementById('search-group').value;
    const site = document.getElementById('search-site').value;
    const country = document.getElementById('search-country').value;
    const city = document.getElementById('search-city').value;
    const customer = document.getElementById('search-customer').value;
    const equipment = document.getElementById('search-equipment').value;

    const filtered = businessData.filter(trip =>
      (name === '' || trip.NAME.toLowerCase().includes(name)) &&
      (group === 'SELECT' || trip.GROUP === group) &&
      (site === 'SELECT' || trip.SITE === site) &&
      (country === 'SELECT' || trip.COUNTRY === country) &&
      (city === 'SELECT' || trip.CITY === city) &&
      (customer === 'SELECT' || trip.CUSTOMER === customer) &&
      (equipment === 'SELECT' || trip.EQUIPMENT === equipment)
    );

    renderTable(filtered);
    timeRange = computeTimeRange(filtered.length ? filtered : businessData); // 범위 업데이트
    renderTimeline(filtered);
    renderYearlyTripsChart(filtered);
    calculateUniqueEngineers(filtered);
    renderGroupSiteChart(filtered);
    renderCountryCityChart(filtered);
    renderEquipmentChart(filtered);
    renderEngineerTripCountChart(filtered);
    calculateCurrentEngineers(filtered);
  };

  const resetFilters = () => {
    document.getElementById('search-name').value = '';
    document.getElementById('search-group').value = 'SELECT';
    document.getElementById('search-site').value = 'SELECT';
    document.getElementById('search-country').value = 'SELECT';
    document.getElementById('search-city').innerHTML = '<option value="SELECT">City</option>';
    document.getElementById('search-customer').value = 'SELECT';
    document.getElementById('search-equipment').value = 'SELECT';

    renderTable(businessData);
    timeRange = computeTimeRange(businessData);
    renderTimeline(businessData);
    calculateUniqueEngineers(businessData);
    renderYearlyTripsChart(businessData);
    renderGroupSiteChart(businessData);
    renderCountryCityChart(businessData);
    renderEquipmentChart(businessData);
    renderEngineerTripCountChart(businessData);
    calculateCurrentEngineers(businessData);
  };

  const updateCityOptions = (country) => {
    const citySelect = document.getElementById('search-city');
    citySelect.innerHTML = '<option value="SELECT">City</option>';
    const cityOptions = {
      USA: ['Portland', 'Arizona', 'Texas'],
      Ireland: ['Leixlip'],
      Japan: ['Hiroshima'],
      China: ['Wuxi', 'Xian', 'Shanghai', 'Beijing'],
      Taiwan: ['Taichoung'],
      Singapore: ['Singapore'],
    };
    (cityOptions[country] || []).forEach(city => {
      const opt = document.createElement('option');
      opt.value = city; opt.textContent = city;
      citySelect.appendChild(opt);
    });
  };

  // =============================================================================
  // Chart.js (원래 코드 유지 – 색만 약간 정돈)
  // =============================================================================
  let yearlyTripsChart = null;
  let groupSiteChart = null;
  let countryCityChart = null;
  let equipmentChart = null;
  let engineerTripCountChart = null;

  const renderYearlyTripsChart = (data) => {
    const ctx2 = document.getElementById('yearly-trips-chart').getContext('2d');
    const years = Array.from({ length: 2025 - 2018 + 1 }, (_, i) => 2018 + i);
    const tripsPerYear = years.map(y => data.filter(t => new Date(t.START_DATE).getFullYear() === y).length);
    if (yearlyTripsChart) yearlyTripsChart.destroy();
    yearlyTripsChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Yearly Business Trips',
          data: tripsPerYear,
          backgroundColor: 'rgba(37, 99, 235, 0.18)',
          borderColor: '#2563eb',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Trips' } },
          x: { title: { display: true, text: 'Years' } }
        },
        plugins: {
          tooltip: { callbacks: { label: (c) => `${c.raw} trips` } },
          datalabels: { color: '#0f172a', anchor: 'end', align: 'end', font: { size: 12 } }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const renderGroupSiteChart = (data) => {
    const ctx2 = document.getElementById('group-site-chart').getContext('2d');
    const pairs = ['PEE1-PT', 'PEE1-HS', 'PEE1-IC', 'PEE1-CJ', 'PEE2-PT', 'PEE2-HS', 'PSKH-PSKH'];
    const values = pairs.map(pair => {
      const [g, s] = pair.split('-');
      return data.filter(t => t.GROUP === g && t.SITE === s).length;
    });
    if (groupSiteChart) groupSiteChart.destroy();
    groupSiteChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: pairs,
        datasets: [{
          label: 'Trips per Group-Site',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.18)',
          borderColor: '#6366f1',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Trips' } },
          x: { title: { display: true, text: 'Group-Site' } }
        },
        plugins: {
          tooltip: { callbacks: { label: (c) => `${c.raw} trips` } },
          datalabels: { color: '#0f172a', anchor: 'end', align: 'end', font: { size: 12 } }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const renderCountryCityChart = (data) => {
    const ctx2 = document.getElementById('country-city-chart').getContext('2d');
    const pairs = [...new Set(data.map(t => `${t.COUNTRY}-${t.CITY}`))];
    const counts = pairs.map(p => {
      const [c, city] = p.split('-');
      return data.filter(t => t.COUNTRY === c && t.CITY === city).length;
    });
    if (countryCityChart) countryCityChart.destroy();
    countryCityChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: pairs,
        datasets: [{
          label: 'Trips per Country-City',
          data: counts,
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderColor: '#f59e0b',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Trips' } },
          x: { title: { display: true, text: 'Country-City' } }
        },
        plugins: {
          tooltip: { callbacks: { label: (c) => `${c.raw} trips` } },
          datalabels: { color: '#0f172a', anchor: 'end', align: 'end', font: { size: 12 } }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const renderEquipmentChart = (data) => {
    const ctx2 = document.getElementById('equipment-chart').getContext('2d');
    const labels = [...new Set(data.map(t => t.EQUIPMENT))];
    const values = labels.map(eq => data.filter(t => t.EQUIPMENT === eq).length);
    if (equipmentChart) equipmentChart.destroy();
    equipmentChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Trips per Equipment',
          data: values,
          backgroundColor: 'rgba(14, 165, 233, 0.2)',
          borderColor: '#0ea5e9',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Trips' } },
          x: { title: { display: true, text: 'Equipment' } }
        },
        plugins: {
          tooltip: { callbacks: { label: (c) => `${c.raw} trips` } },
          datalabels: { color: '#0f172a', anchor: 'end', align: 'end', font: { size: 12 } }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const renderEngineerTripCountChart = (data) => {
    const ctx2 = document.getElementById('engineer-trip-count-chart').getContext('2d');
    const countsPerName = data.reduce((acc, t) => { acc[t.NAME] = (acc[t.NAME] || 0) + 1; return acc; }, {});
    const bins = [1, 2, 3, 4, '5+'];
    const values = bins.map(b => b === '5+' ? Object.values(countsPerName).filter(v => v >= 5).length
                                            : Object.values(countsPerName).filter(v => v === b).length);
    if (engineerTripCountChart) engineerTripCountChart.destroy();
    engineerTripCountChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: bins,
        datasets: [{
          label: 'Engineer Trip Count',
          data: values,
          backgroundColor: 'rgba(239, 68, 68, 0.18)',
          borderColor: '#ef4444',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Number of Engineers' } },
          x: { title: { display: true, text: 'Trip Count Categories' } }
        },
        plugins: {
          tooltip: { callbacks: { label: (c) => `${c.raw} engineers` } },
          datalabels: { color: '#0f172a', anchor: 'end', align: 'end', font: { size: 12 } }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  // =============================================================================
  // 이벤트: 검색/리셋/도시옵션
  // =============================================================================
  document.getElementById('search-button').addEventListener('click', filterData);
  document.getElementById('reset-button').addEventListener('click', resetFilters);
  document.getElementById('search-country').addEventListener('change', (e) => updateCityOptions(e.target.value));

  // =============================================================================
  // 엑셀 내보내기 (원본 유지)
  // =============================================================================
  document.getElementById('export-button').addEventListener('click', () => {
    if (!businessData || businessData.length === 0) {
      alert('No data available to export!');
      return;
    }
    const sheet = businessData.map((trip) => ({
      ID: trip.id,
      Name: trip.NAME,
      Group: trip.GROUP,
      Site: trip.SITE,
      Country: trip.COUNTRY,
      City: trip.CITY,
      Customer: trip.CUSTOMER,
      Equipment: trip.EQUIPMENT,
      'Start Date': formatDate(trip.START_DATE),
      'End Date': formatDate(trip.END_DATE),
    }));

    const ws = XLSX.utils.json_to_sheet(sheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Business Trips');
    XLSX.writeFile(wb, 'Business_Trips.xlsx');
  });

  // 시작!
  fetchTrips();
});
