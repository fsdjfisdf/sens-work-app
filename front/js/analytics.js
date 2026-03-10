/* analytics.js — Dashboard Charts */
'use strict';
const API = 'http://3.37.73.151:3001';
const token = localStorage.getItem('x-access-token') || '';
axios.defaults.headers.common['x-access-token'] = token;
const me = (() => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } })();

/* ── Palette ── */
const C = {
  blue: '#2563eb', blueL: 'rgba(37,99,235,.15)', red: '#ef4444', redL: 'rgba(239,68,68,.12)',
  green: '#22c55e', greenL: 'rgba(34,197,94,.12)', amber: '#f59e0b', amberL: 'rgba(245,158,11,.15)',
  purple: '#8b5cf6', purpleL: 'rgba(139,92,246,.15)', cyan: '#06b6d4', pink: '#ec4899',
  slate: '#64748b', slateL: 'rgba(100,116,139,.12)',
  set: ['#2563eb','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#64748b','#f97316','#14b8a6']
};
const charts = {};

/* ── Helpers ── */
function toast(type, msg) { const r = document.getElementById('toast-root'); if (!r) return; const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg; r.appendChild(el); setTimeout(() => el.remove(), 4000); }
function fmtDate(d) { if (!d) return '—'; return String(d).split('T')[0]; }
function getFilters() { return { company: document.getElementById('f-company').value, group: document.getElementById('f-group').value, site: document.getElementById('f-site').value, name: document.getElementById('f-name').selectedOptions[0]?.text === '전체' ? '' : document.getElementById('f-name').selectedOptions[0]?.text || '' }; }
function qs(f) { const p = new URLSearchParams(); for (const [k,v] of Object.entries(f)) { if (v) p.set(k, v); } return p.toString(); }
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }
function getCtx(id) { destroyChart(id); return document.getElementById(id)?.getContext('2d'); }

/* ── Nav ── */
function initNav() {
  if (me) { document.querySelectorAll('.sign-container.unsigned').forEach(e => e.classList.add('hidden')); document.querySelectorAll('.sign-container.signed').forEach(e => e.classList.remove('hidden')); }
  document.getElementById('sign-out')?.addEventListener('click', () => { localStorage.removeItem('x-access-token'); location.href = './signin.html'; });
  document.querySelector('.menu-btn')?.addEventListener('click', () => document.querySelector('.menu-bar')?.classList.toggle('open'));
}

/* ── Tabs ── */
function initTabs() {
  document.querySelectorAll('.cat-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.cat-section').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelector(`.cat-section[data-cat="${t.dataset.cat}"]`)?.classList.add('active');
  }));
}

/* ── Info buttons ── */
function initInfoBtns() {
  document.querySelectorAll('.info-btn').forEach(b => b.addEventListener('click', () => {
    document.getElementById('desc-text').textContent = b.dataset.desc;
    document.getElementById('desc-popup').style.display = 'flex';
  }));
  document.getElementById('desc-close')?.addEventListener('click', () => document.getElementById('desc-popup').style.display = 'none');
  document.getElementById('desc-popup')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.style.display = 'none'; });
}

/* ── Filters ── */
async function initFilters() {
  try {
    const { data } = await axios.get(`${API}/analytics/filters`);
    const sel = (id, arr) => { const s = document.getElementById(id); arr.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; s.appendChild(o); }); };
    sel('f-company', data.companies);
    sel('f-group', data.groups);
    sel('f-site', data.sites);
    const ns = document.getElementById('f-name');
    data.engineers.forEach(e => { const o = document.createElement('option'); o.value = e.ID; o.textContent = e.NAME; ns.appendChild(o); });
  } catch { toast('error', '필터 로드 실패'); }
}

/* ══════════════════════════════════════════════════════════════
   CHART RENDERERS
   ══════════════════════════════════════════════════════════════ */

/* 1. Head Count */
async function renderHeadCount(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/headcount?${qs(f)}`);
    const ctx = getCtx('chart-headcount'); if (!ctx) return;
    // Build monthly series from 2023-01 to now
    const now = new Date(); const labels = []; let d = new Date(2023, 0);
    while (d <= now) { labels.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); d.setMonth(d.getMonth()+1); }
    const hireMap = {}; data.hires.forEach(r => hireMap[r.ym] = r.cnt);
    const resignMap = {}; data.resigns.forEach(r => resignMap[r.ym] = r.cnt);
    // Cumulative (rough: current total - future hires + future resigns)
    let running = data.currentTotal;
    const cumulative = labels.map(() => 0);
    // Work backwards from current
    for (let i = labels.length - 1; i >= 0; i--) {
      cumulative[i] = running;
      running = running - (hireMap[labels[i]] || 0) + (resignMap[labels[i]] || 0);
    }
    charts['chart-headcount'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { type: 'line', label: '재직 인원', data: cumulative, borderColor: C.blue, backgroundColor: C.blueL, tension: .3, yAxisID: 'y', fill: true, pointRadius: 2 },
          { label: '입사', data: labels.map(l => hireMap[l] || 0), backgroundColor: C.green, yAxisID: 'y1' },
          { label: '퇴사', data: labels.map(l => -(resignMap[l] || 0)), backgroundColor: C.red, yAxisID: 'y1' }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { position: 'left', title: { display: true, text: '재직 인원' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '입사/퇴사' } } } }
    });
  } catch { }
}

/* 2. HR Distribution */
async function renderHR(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/hr-distribution?${qs(f)}`);
    // Company
    let ctx = getCtx('chart-company'); if (ctx) {
      charts['chart-company'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.byCompany.map(r=>r.label), datasets: [{ data: data.byCompany.map(r=>r.cnt), backgroundColor: [C.blue, C.green, C.amber, C.purple] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}명 (${Math.round(c.raw/data.byCompany.reduce((s,r)=>s+r.cnt,0)*100)}%)` } } } } });
    }
    // Experience
    ctx = getCtx('chart-experience'); if (ctx) {
      charts['chart-experience'] = new Chart(ctx, { type: 'bar', data: { labels: data.byExp.map(r=>r.label), datasets: [{ label: '인원', data: data.byExp.map(r=>r.cnt), backgroundColor: C.set.slice(0, data.byExp.length), borderRadius: 6 }] }, options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } } });
    }
    // Group/Site
    ctx = getCtx('chart-groupsite'); if (ctx) {
      charts['chart-groupsite'] = new Chart(ctx, { type: 'bar', data: { labels: data.byGroupSite.map(r=>r.label), datasets: [{ label: '인원', data: data.byGroupSite.map(r=>r.cnt), backgroundColor: C.set.slice(0, data.byGroupSite.length), borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
    }
  } catch { }
}

/* 3. Level Distribution */
async function renderLevelDist(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/level-distribution?${qs(f)}`);
    const ctx = getCtx('chart-level-dist'); if (!ctx) return;
    const total = data.reduce((s,r)=>s+r.cnt,0);
    charts['chart-level-dist'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.map(r=>`Lv.${r.label}`), datasets: [{ data: data.map(r=>r.cnt), backgroundColor: [C.slate, C.blue, C.green, C.amber, C.purple, C.pink] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}명 (${Math.round(c.raw/total*100)}%)` } } } } });
  } catch { }
}

/* 4. Level Achievement */
async function renderLevelAchieve(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/level-achievement?${qs(f)}`);
    const ctx = getCtx('chart-level-achieve'); if (!ctx) return;
    const valid = data.filter(r => r.avg_days && r.cnt > 0);
    charts['chart-level-achieve'] = new Chart(ctx, { type: 'bar', data: { labels: valid.map(r=>`Lv.${r.level_code}`), datasets: [{ label: '평균 일수', data: valid.map(r=>r.avg_days), backgroundColor: C.set.slice(0, valid.length), borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw}일 (${(c.raw/30).toFixed(1)}개월), ${valid[c.dataIndex].cnt}명` } } }, scales: { y: { title: { display: true, text: '일수' } } } } });
  } catch { }
}

/* 5. Level Trend (quarterly, 2020 Q1 ~ now) */
async function renderLevelTrend(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/level-trend?${qs(f)}`);
    const ctx = getCtx('chart-level-trend'); if (!ctx) return;
    const SCORE = { '0': 0, '1-1': 0.5, '1-2': 1, '1-3': 1.5, '2': 2, '2-2': 3, '2-3': 4, '2-4': 5 };
    const LEVELS = ['0', '1-1', '1-2', '1-3', '2', '2-2', '2-3', '2-4'];
    // Build quarters
    const quarters = []; let qd = new Date(2020, 0);
    const now = new Date();
    while (qd <= now) { const q = Math.floor(qd.getMonth() / 3) + 1; quarters.push(`${qd.getFullYear()} Q${q}`); qd.setMonth(qd.getMonth() + 3); }
    // For each engineer, determine level at each quarter end
    const qLabels = quarters;
    const levelCounts = {}; LEVELS.forEach(l => levelCounts[l] = new Array(qLabels.length).fill(0));
    const avgScores = new Array(qLabels.length).fill(0);
    const totals = new Array(qLabels.length).fill(0);
    data.forEach(eng => {
      const hireDate = eng.HIRE ? new Date(eng.HIRE) : null;
      const achieves = [
        { level: '1-1', date: eng.l1 ? new Date(eng.l1) : null },
        { level: '1-2', date: eng.l2 ? new Date(eng.l2) : null },
        { level: '1-3', date: eng.l3 ? new Date(eng.l3) : null },
        { level: '2',   date: eng.l4 ? new Date(eng.l4) : null },
        { level: '2-2', date: eng.l22 ? new Date(eng.l22) : null },
        { level: '2-3', date: eng.l23 ? new Date(eng.l23) : null },
        { level: '2-4', date: eng.l24 ? new Date(eng.l24) : null },
      ];
      qLabels.forEach((ql, qi) => {
        const [y, qn] = ql.split(' Q'); const qEnd = new Date(+y, +qn * 3, 0);
        if (hireDate && hireDate > qEnd) return; // 아직 입사 전
        let curLevel = '0';
        achieves.forEach(a => { if (a.date && a.date <= qEnd) curLevel = a.level; });
        levelCounts[curLevel][qi]++;
        avgScores[qi] += SCORE[curLevel] || 0;
        totals[qi]++;
      });
    });
    const avgLine = avgScores.map((s, i) => totals[i] ? +(s / totals[i]).toFixed(2) : null);
    const colors = { '0': '#94a3b8', '1-1': '#60a5fa', '1-2': '#2563eb', '1-3': '#1d4ed8', '2': '#22c55e', '2-2': '#f59e0b', '2-3': '#f97316', '2-4': '#ef4444' };
    const datasets = LEVELS.map(l => ({ label: `Lv.${l}`, data: levelCounts[l], backgroundColor: colors[l], stack: 'a', yAxisID: 'y1' }));
    datasets.push({ type: 'line', label: '평균 점수', data: avgLine, borderColor: C.blue, borderWidth: 3, tension: .3, yAxisID: 'y', pointRadius: 3, pointBackgroundColor: C.blue });
    charts['chart-level-trend'] = new Chart(ctx, { type: 'bar', data: { labels: qLabels, datasets }, options: { responsive: true, plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } }, scales: { y: { position: 'left', title: { display: true, text: '평균 점수' }, min: 0 }, y1: { position: 'right', stacked: true, grid: { drawOnChartArea: false }, title: { display: true, text: '인원' }, ticks: { stepSize: 1 } }, x: { stacked: true, ticks: { maxRotation: 45, font: { size: 10 } } } } } });
  } catch(e) { console.error(e); }
}

/* 6. Capability */
async function renderCapability(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/capability?${qs(f)}`);
    const ctx = getCtx('chart-capability'); if (!ctx) return;
    const m = data.monthly.filter(r => r.ym >= '2024-09');
    const goals = data.goals;
    const goalLine = m.map(r => {
      const y = +r.ym.split('-')[0];
      return y === 2024 ? goals.g24 : y === 2025 ? goals.g25 : goals.g26;
    });
    charts['chart-capability'] = new Chart(ctx, { type: 'line', data: {
      labels: m.map(r => r.ym),
      datasets: [
        { label: '전체', data: m.map(r => r.avg_total ? +r.avg_total.toFixed(3) : null), borderColor: C.blue, backgroundColor: C.blueL, fill: true, tension: .3, pointRadius: 3 },
        { label: 'SETUP', data: m.map(r => r.avg_setup ? +r.avg_setup.toFixed(3) : null), borderColor: C.green, tension: .3, pointRadius: 2, borderDash: [] },
        { label: 'MAINT', data: m.map(r => r.avg_maint ? +r.avg_maint.toFixed(3) : null), borderColor: C.amber, tension: .3, pointRadius: 2 },
        { label: '목표', data: goalLine, borderColor: C.red, borderDash: [6, 4], pointRadius: 0, borderWidth: 2 }
      ]
    }, options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 1, ticks: { callback: v => (v*100).toFixed(0)+'%' } }, x: { ticks: { maxRotation: 45, font: { size: 10 } } } } } });
  } catch { }
}

/* 7. Equipment Capability */
async function renderEqCapa(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/eq-capability?${qs(f)}`);
    const ctx = getCtx('chart-eq-capa'); if (!ctx) return;
    const valid = data.filter(r => r.eng_count > 0);
    charts['chart-eq-capa'] = new Chart(ctx, { type: 'bar', data: {
      labels: valid.map(r => r.eq_name),
      datasets: [
        { label: 'SETUP', data: valid.map(r => r.avg_setup ? +r.avg_setup.toFixed(3) : 0), backgroundColor: C.blue, borderRadius: 4 },
        { label: 'MAINT', data: valid.map(r => r.avg_maint ? +r.avg_maint.toFixed(3) : 0), backgroundColor: C.green, borderRadius: 4 }
      ]
    }, options: { responsive: true, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${(c.raw*100).toFixed(1)}%` } } }, scales: { y: { min: 0, max: 1, ticks: { callback: v => (v*100)+'%' } } } } });
  } catch { }
}

/* 8. MPI */
async function renderMPI(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/mpi?${qs(f)}`);
    const ctx = getCtx('chart-mpi'); if (!ctx) return;
    charts['chart-mpi'] = new Chart(ctx, { type: 'bar', data: {
      labels: data.distribution.map(r => `MPI ${r.label}`),
      datasets: [{ label: '인원', data: data.distribution.map(r => r.cnt), backgroundColor: C.set.slice(0, data.distribution.length), borderRadius: 6 }]
    }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 } } } } });
  } catch { }
}

/* 9. Worklog Stats */
async function renderWorklog(f) {
  try {
    const { data } = await axios.get(`${API}/analytics/worklog-stats?${qs(f)}`);
    // Monthly hours
    let ctx = getCtx('chart-monthly-hours'); if (ctx) {
      charts['chart-monthly-hours'] = new Chart(ctx, { type: 'bar', data: {
        labels: data.monthlyHours.map(r => r.ym),
        datasets: [
          { type: 'line', label: '건수', data: data.monthlyHours.map(r => r.event_count), borderColor: C.blue, yAxisID: 'y1', tension: .3, pointRadius: 3 },
          { label: '작업시간(분)', data: data.monthlyHours.map(r => r.total_minutes), backgroundColor: C.greenL, borderColor: C.green, borderWidth: 1, borderRadius: 4, yAxisID: 'y' }
        ]
      }, options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { position: 'left', title: { display: true, text: '분' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '건' }, ticks: { stepSize: 1 } }, x: { ticks: { maxRotation: 45 } } } } });
    }
    // Work Type
    ctx = getCtx('chart-worktype'); if (ctx) {
      charts['chart-worktype'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.byWorkType.map(r=>r.label), datasets: [{ data: data.byWorkType.map(r=>r.cnt), backgroundColor: [C.blue, C.green, C.amber, C.purple] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
    // Work Sort
    ctx = getCtx('chart-worksort'); if (ctx) {
      charts['chart-worksort'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.byWorkType2.map(r=>r.label), datasets: [{ data: data.byWorkType2.map(r=>r.cnt), backgroundColor: [C.red, C.blue, C.green, C.amber, C.slate] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
    // Shift
    ctx = getCtx('chart-shift'); if (ctx) {
      charts['chart-shift'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.byShift.map(r=>r.label), datasets: [{ data: data.byShift.map(r=>r.cnt), backgroundColor: [C.amber, C.blue] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
    // Overtime
    ctx = getCtx('chart-overtime'); if (ctx) {
      charts['chart-overtime'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.byOvertime.map(r=>r.label), datasets: [{ data: data.byOvertime.map(r=>r.cnt), backgroundColor: [C.green, C.red] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
    // Rework
    ctx = getCtx('chart-rework'); if (ctx) {
      charts['chart-rework'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.reworkRatio.map(r=>r.label), datasets: [{ data: data.reworkRatio.map(r=>r.cnt), backgroundColor: [C.red, C.slate] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
    // Rework reason
    ctx = getCtx('chart-rework-reason'); if (ctx && data.reworkReason.length) {
      charts['chart-rework-reason'] = new Chart(ctx, { type: 'doughnut', data: { labels: data.reworkReason.map(r=>r.label), datasets: [{ data: data.reworkReason.map(r=>r.cnt), backgroundColor: [C.red, C.amber, C.purple, C.slate, C.blue] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
  } catch(e) { console.error(e); }
}

/* ── Engineer Info ── */
async function showEngineerInfo(name) {
  const card = document.getElementById('eng-info');
  if (!name) { card.style.display = 'none'; return; }
  try {
    const { data } = await axios.get(`${API}/analytics/engineer-info?name=${encodeURIComponent(name)}`);
    if (!data) { card.style.display = 'none'; return; }
    card.style.display = '';
    document.getElementById('ei-name').textContent = data.NAME;
    document.getElementById('ei-empid').textContent = data.EMPLOYEE_ID || '—';
    document.getElementById('ei-company').textContent = data.COMPANY || '—';
    document.getElementById('ei-groupsite').textContent = `${data.GROUP} / ${data.SITE}`;
    document.getElementById('ei-hire').textContent = fmtDate(data.HIRE);
    document.getElementById('ei-level').textContent = `Lv.${data['LEVEL(report)']} (내부:${data.LEVEL}, PSK:${data['LEVEL(PSK)']})`;
    document.getElementById('ei-capa').textContent = data.CAPA ? `${(data.CAPA * 100).toFixed(1)}%` : '—';
    document.getElementById('ei-mpi').textContent = data.MPI ?? '—';
  } catch { card.style.display = 'none'; }
}

/* ── Excel Export ── */
async function doExport() {
  try {
    toast('success', '엑셀 준비 중...');
    const f = getFilters();
    const { data } = await axios.get(`${API}/analytics/export/excel?${qs(f)}`);
    if (!data.length) { toast('error', '데이터 없음'); return; }
    const hd = ['이름', '회사', '사번', 'Group', 'Site', '입사일', 'Level(report)', 'Level(내부)', 'Level(PSK)', 'Multi Level', 'MAIN EQ', 'MULTI EQ', 'SETUP CAPA', 'MAINT CAPA', 'MULTI CAPA', 'CAPA', 'MPI', 'Role'];
    const rows = data.map(r => [r.NAME, r.COMPANY, r.EMPLOYEE_ID, r.GROUP, r.SITE, fmtDate(r.HIRE), r.level_report, r.level_internal, r.level_psk, r.multi_level, r['MAIN EQ'], r['MULTI EQ'], r['SET UP CAPA'], r['MAINT CAPA'], r['MULTI CAPA'], r.CAPA, r.MPI, r.role]);
    const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet([hd, ...rows]);
    ws['!cols'] = hd.map((h, i) => ({ wch: Math.min(Math.max(h.length, ...rows.slice(0, 50).map(r => String(r[i] || '').length)) + 2, 30) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Engineers');
    XLSX.writeFile(wb, `engineers_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast('success', '다운로드 완료');
  } catch { toast('error', '엑셀 추출 실패'); }
}

/* ── Load All ── */
async function loadAll() {
  const f = getFilters();
  const name = document.getElementById('f-name').selectedOptions[0]?.text;
  if (name && name !== '전체') showEngineerInfo(name);
  else document.getElementById('eng-info').style.display = 'none';

  // 모든 차트 병렬 로딩
  await Promise.allSettled([
    renderHeadCount(f), renderHR(f), renderLevelDist(f), renderLevelAchieve(f),
    renderLevelTrend(f), renderCapability(f), renderEqCapa(f), renderMPI(f), renderWorklog(f)
  ]);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) { alert('로그인이 필요합니다.'); location.href = './signin.html'; return; }
  initNav(); initTabs(); initInfoBtns();
  await initFilters();
  document.getElementById('btn-apply')?.addEventListener('click', loadAll);
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    ['f-company', 'f-group', 'f-site', 'f-name'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
    document.getElementById('eng-info').style.display = 'none';
    loadAll();
  });
  document.getElementById('btn-export')?.addEventListener('click', doExport);
  // 초기 로딩
  loadAll();
});
