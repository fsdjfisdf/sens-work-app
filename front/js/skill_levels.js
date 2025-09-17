/* ==========================================================================
   S-WORKS — skill_levels.js
   - /api/skill/levels 목록 → 필터/표시/CSV 저장
   - /api/skill/levels/:id 상세 → 모달 + 차트
   ========================================================================== */

const API_BASE = "http://3.37.73.151:3001/api";

let rawList = [];
let filtered = [];
let chartMain = null;
let chartMulti = null;

document.addEventListener('DOMContentLoaded', async () => {
  bindUI();
  await loadList();                 // 목록 최초 로드
  hydrateFilters(rawList);          // 그룹/사이트 옵션 생성
  applyFilterAndRender();           // 표 렌더
});

function bindUI() {
  const $ = (id) => document.getElementById(id);

  $('btn-search').addEventListener('click', applyFilterAndRender);
  $('btn-reset').addEventListener('click', () => {
    $('f-name').value = '';
    $('f-group').value = '';
    $('f-site').value = '';
    $('f-eq').value = '';
    $('f-report').value = '';
    $('f-main-only').checked = false;
    $('f-multi-only').checked = false;
    applyFilterAndRender();
  });
  $('btn-export').addEventListener('click', exportTableToCSV);

  // 상세 모달
  $('detail-close').addEventListener('click', closeDetail);
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeDetail();
  });
}

/* --------------------- Data Load --------------------- */
async function loadList() {
  setLoading(true);
  try {
    const token = localStorage.getItem('x-access-token');
    const res = await axios.get(`${API_BASE}/skill/levels`, {
      headers: { 'x-access-token': token }
    });
    if (!res.data?.isSuccess) throw new Error('API 실패');
    rawList = res.data.result || [];
    document.getElementById('m-total').textContent = rawList.length;
    const mainCnt = rawList.filter(r => r.main_level !== null).length;
    const multiCnt = rawList.filter(r => r.multi_level !== null).length;
    document.getElementById('m-main').textContent = mainCnt;
    document.getElementById('m-multi').textContent = multiCnt;
  } catch (err) {
    console.error('[loadList]', err);
    showError(true);
  } finally {
    setLoading(false);
  }
}

/* --------------------- Filters --------------------- */
function hydrateFilters(list) {
  const groupSel = document.getElementById('f-group');
  const siteSel  = document.getElementById('f-site');

  const groups = [...new Set(list.map(r => r.GROUP).filter(Boolean))].sort();
  const sites  = [...new Set(list.map(r => r.SITE).filter(Boolean))].sort();

  for (const g of groups) {
    const op = document.createElement('option');
    op.value = g; op.textContent = g;
    groupSel.appendChild(op);
  }
  for (const s of sites) {
    const op = document.createElement('option');
    op.value = s; op.textContent = s;
    siteSel.appendChild(op);
  }
}

function applyFilterAndRender() {
  const name    = document.getElementById('f-name').value.trim();
  const group   = document.getElementById('f-group').value;
  const site    = document.getElementById('f-site').value;
  const eq      = document.getElementById('f-eq').value;
  const report  = document.getElementById('f-report').value;
  const mainOnly  = document.getElementById('f-main-only').checked;
  const multiOnly = document.getElementById('f-multi-only').checked;

  filtered = rawList.filter(r => {
    if (name && !String(r.NAME).includes(name)) return false;
    if (group && r.GROUP !== group) return false;
    if (site && r.SITE !== site) return false;
    if (report && String(r['LEVEL(report)']) !== report) return false;

    if (eq) {
      const inMain  = r['MAIN EQ'] === eq;
      const inMulti = r['MULTI EQ'] === eq;
      if (!inMain && !inMulti) return false;
    }

    if (mainOnly && r.main_level === null) return false;
    if (multiOnly && r.multi_level === null) return false;

    return true;
  });

  renderTable();
}

/* --------------------- Table --------------------- */
function renderTable() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    document.getElementById('empty').classList.remove('hidden');
  } else {
    document.getElementById('empty').classList.add('hidden');
  }

  for (const r of filtered) {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="name">${escapeHtml(r.NAME ?? '')}</td>
      <td>${escapeHtml(r.GROUP ?? '')}</td>
      <td>${escapeHtml(r.SITE ?? '')}</td>
      <td><span class="badge">${escapeHtml(r['LEVEL(report)'] ?? '')}</span></td>

      <td>${escapeHtml(r['MAIN EQ'] ?? '-')}</td>
      <td class="mono">${fmtPct(r.main_avg)}</td>
      <td>${badgeLevel(r.main_level, 'main')}</td>

      <td>${escapeHtml(r['MULTI EQ'] ?? '-')}</td>
      <td class="mono">${fmtPct(r.multi_setup)}</td>
      <td>${badgeLevel(r.multi_level, 'multi')}</td>

      <td><button class="btn tiny" data-open="${r.ID}">보기</button></td>
    `;

    // 상세 버튼
    tr.querySelector('[data-open]')?.addEventListener('click', () => openDetail(r.ID));
    tbody.appendChild(tr);
  }
}

/* --------------------- Detail --------------------- */
async function openDetail(id) {
  const token = localStorage.getItem('x-access-token');
  try {
    setLoading(true);
    const { data } = await axios.get(`${API_BASE}/skill/levels/${id}`, {
      headers: { 'x-access-token': token }
    });
    if (!data?.isSuccess) throw new Error('상세 실패');

    const u = data.result;
    // 텍스트 채우기
    setText('d-name', u.NAME);
    setText('d-group', u.GROUP);
    setText('d-site', u.SITE);
    setText('d-report', u['LEVEL(report)']);
    setText('d-main-eq', u['MAIN EQ'] ?? '-');
    setText('d-multi-eq', u['MULTI EQ'] ?? '-');
    setTag('d-main-lvl', 'MAIN', u.capability.main_level);
    setTag('d-multi-lvl', 'MULTI', u.capability.multi_level);

    // 차트 준비
    drawMainChart(u);
    drawMultiChart(u);

    // 모달 열기
    const modal = document.getElementById('detail-modal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  } catch (err) {
    console.error('[openDetail]', err);
    alert('상세 조회 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
}

function closeDetail() {
  const modal = document.getElementById('detail-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  // 차트 정리
  if (chartMain)  { chartMain.destroy(); chartMain = null; }
  if (chartMulti) { chartMulti.destroy(); chartMulti = null; }
}

function drawMainChart(u) {
  const ctx = document.getElementById('chart-main').getContext('2d');
  const eq = u['MAIN EQ'];
  const avg = u.metrics?.main?.average ?? 0;

  const t = u.thresholds?.main || null; // {'1-1','1-2','1-3','2'}
  const labels = ['1-1','1-2','1-3','2'];
  const tvals  = labels.map(k => t ? (t[k]*100).toFixed(1) : 0);
  const avgVal = (avg*100).toFixed(1);

  chartMain = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: `${eq || 'MAIN'} 임계값(%)`,
          data: tvals,
          backgroundColor: 'rgba(153,102,255,0.2)',
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 1
        },
        {
          label: '내 평균(SETUP+MAINT)',
          data: labels.map(() => avgVal),
          type: 'line',
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.25,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => `${v}%` }
        }
      },
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          formatter: (value, ctx) => `${value}%`,
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: { size: 11 }
        },
        tooltip: {
          callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue}%` }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawMultiChart(u) {
  const ctx = document.getElementById('chart-multi').getContext('2d');
  const eq = u['MULTI EQ'];
  const setupOnly = u.metrics?.multi?.setupOnly ?? 0;
  const th = u.thresholds_multi?.multi?.['2-2'] ?? 0;

  chartMulti = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lv 2-2'],
      datasets: [
        {
          label: `${eq || 'MULTI'} 임계값(2-2, %)`,
          data: [ (th*100).toFixed(1) ],
          backgroundColor: 'rgba(255,159,64,0.2)',
          borderColor: 'rgba(255,159,64,1)',
          borderWidth: 1
        },
        {
          label: '내 SET UP(%)',
          data: [ (setupOnly*100).toFixed(1) ],
          backgroundColor: 'rgba(54,162,235,0.2)',
          borderColor: 'rgba(54,162,235,1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } }
      },
      plugins: {
        datalabels: {
          formatter: (v) => `${v}%`,
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: { size: 11 }
        },
        tooltip: {
          callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue}%` }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

/* --------------------- Utils --------------------- */
function setLoading(on) {
  document.getElementById('loading').classList.toggle('hidden', !on);
}
function showError(on) {
  document.getElementById('error').classList.toggle('hidden', !on);
}
function setText(id, val) {
  const el = document.getElementById(id);
  el.textContent = val ?? '-';
}
function setTag(id, prefix, lvl) {
  const el = document.getElementById(id);
  if (lvl === null || lvl === undefined) {
    el.className = 'tag';
    el.textContent = `${prefix}: -`;
    return;
  }
  el.className = 'tag ' + (lvl === '2' || lvl === '2-2' ? 'ok' : lvl === '1-3' ? 'good' : lvl === '1-2' ? 'mid' : lvl === '1-1' ? 'low' : 'zero');
  el.textContent = `${prefix}: ${lvl}`;
}
function badgeLevel(lvl, kind) {
  if (lvl === null || lvl === undefined) return `<span class="pill">-</span>`;
  const cls =
    (lvl === '2' || lvl === '2-2') ? 'ok' :
    (lvl === '1-3') ? 'good' :
    (lvl === '1-2') ? 'mid' :
    (lvl === '1-1') ? 'low' : 'zero';
  return `<span class="pill ${cls}">${lvl}</span>`;
}
function fmtPct(x) {
  const v = Number(x);
  if (!isFinite(v)) return '-';
  return `${(v*100).toFixed(1)}%`;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* CSV 내보내기 */
function exportTableToCSV() {
  const headers = ['Name','Group','Site','LEVEL(report)','MAIN EQ','MAIN Avg','MAIN Level','MULTI EQ','MULTI SET UP','MULTI Level'];
  const rows = filtered.map(r => [
    r.NAME, r.GROUP, r.SITE, r['LEVEL(report)'], r['MAIN EQ'], (r.main_avg??0), r.main_level??'',
    r['MULTI EQ'], (r.multi_setup??0), r.multi_level??''
  ]);

  const csv = [headers, ...rows].map(r =>
    r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skill_levels_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
