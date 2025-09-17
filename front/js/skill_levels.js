/* ==========================================================================
   S-WORKS — skill_levels.js (전체)
   - /api/skill/levels 목록 → 필터/표시/엑셀 저장(클라이언트 생성)
   - /api/skill/levels/:id 상세 → 모달 + 차트 + 기준 역량/부족도
   - 승급 계산: DB 저장값(LEVEL, MULTI LEVEL) vs 현재 산정값 비교
   - "설명 ?" 모달
   ========================================================================== */

const API_BASE = "http://3.37.73.151:3001/api";

let rawList = [];
let filtered = [];
let chartMain = null;
let chartMulti = null;

// 승급 표기 스타일: true면 숫자(0→2), false면 라벨(0→1-2)
const SHOW_NUMERIC_PROMO = false;

document.addEventListener('DOMContentLoaded', async () => {
  bindUI();
  await loadList();
  hydrateFilters(rawList);
  applyFilterAndRender();
});

/* --------------------- DOM Helper --------------------- */
function $(id) { return document.getElementById(id); }

/* --------------------- Bind UI ------------------------ */
function bindUI() {
  $('btn-search')?.addEventListener('click', applyFilterAndRender);

  $('btn-reset')?.addEventListener('click', () => {
    $('f-name').value = '';
    $('f-group').value = '';
    $('f-site').value = '';
    $('f-eq').value = '';
    $('f-report').value = '';
    applyFilterAndRender();
  });

  // 엑셀: 클라이언트에서 생성 (XLSX)
  $('btn-export')?.addEventListener('click', () => {
    try {
      exportToXLSX();
    } catch (e) {
      console.error('[export]', e);
      alert('엑셀 저장 중 오류가 발생했습니다.');
    }
  });

  // 상세 모달
  $('detail-close')?.addEventListener('click', closeDetail);
  $('detail-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeDetail();
  });

  // 설명 모달
  $('btn-guide')?.addEventListener('click', () => openModal('guide-modal'));
  $('guide-close')?.addEventListener('click', () => closeModal('guide-modal'));
  $('guide-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'guide-modal') closeModal('guide-modal');
  });

  // ESC로 가장 위 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const open = document.querySelectorAll('.modal.open');
      if (open.length) {
        open[open.length - 1].classList.remove('open');
        updateBodyScroll();
      }
    }
  });
}

/* --------------------- Modal helpers ------------------ */
function openModal(id){
  const m = $(id);
  if (!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  updateBodyScroll();
}
function closeModal(id){
  const m = $(id);
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  updateBodyScroll();
}
function updateBodyScroll(){
  const anyOpen = !!document.querySelector('.modal.open');
  document.body.classList.toggle('no-scroll', anyOpen);
}

/* --------------------- Data Load ---------------------- */
async function loadList() {
  setLoading(true);
  try {
    const token = localStorage.getItem('x-access-token');
    const res = await axios.get(`${API_BASE}/skill/levels`, {
      headers: { 'x-access-token': token }
    });
    if (!res.data?.isSuccess) throw new Error('API 실패');
    rawList = res.data.result || [];
  } catch (err) {
    console.error('[loadList]', err);
    showError(true);
  } finally {
    setLoading(false);
  }
}

/* --------------------- Filters ------------------------ */
function hydrateFilters(list) {
  const groupSel = $('f-group');
  const siteSel  = $('f-site');

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
  const name    = $('f-name').value.trim();
  const group   = $('f-group').value;
  const site    = $('f-site').value;
  const eq      = $('f-eq').value;
  const report  = $('f-report').value;

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
    return true;
  });

  renderTable();
}

/* --------------------- Table -------------------------- */
function renderTable() {
  const tbody = $('tbody');
  tbody.innerHTML = '';

  $('empty').classList.toggle('hidden', filtered.length !== 0);

  for (const r of filtered) {
    const tr = document.createElement('tr');

    const promo = computePromotionString(r);

    tr.innerHTML = `
      <td class="name">${escapeHtml(r.NAME ?? '')}</td>
      <td>${escapeHtml(r.GROUP ?? '')}</td>
      <td>${escapeHtml(r.SITE ?? '')}</td>
      <td><span class="badge">${escapeHtml(r['LEVEL(report)'] ?? '')}</span></td>

      <td>${escapeHtml(r['MAIN EQ'] ?? '-')}</td>
      <td class="mono">${fmtPct(r.main_avg)}</td>
      <td>${badgeLevel(r.main_level)}</td>

      <td>${escapeHtml(r['MULTI EQ'] ?? '-')}</td>
      <td class="mono">${fmtPct(r.multi_setup)}</td>
      <td>${badgeLevel(r.multi_level)}</td>

      <td class="promo">${promo}</td>
      <td><button class="btn tiny" data-open="${r.ID}">보기</button></td>
    `;

    tr.querySelector('[data-open]')?.addEventListener('click', () => openDetail(r.ID));
    tbody.appendChild(tr);
  }
}

/* --------------------- Promotion Logic ---------------- */
// 문자열↔정수 매핑 (DB LEVEL: 1..4 | 표시: 1-1/1-2/1-3/2)
function mainIntToStr(n) {
  switch (Number(n) || 0) {
    case 1: return '1-1';
    case 2: return '1-2';
    case 3: return '1-3';
    case 4: return '2';
    default: return '0';
  }
}
function mainStrToInt(s) {
  switch (String(s || '')) {
    case '1-1': return 1;
    case '1-2': return 2;
    case '1-3': return 3;
    case '2':   return 4;
    default:    return 0;
  }
}

function getPromotionParts(r){
  const calcMainStr = r.main_level;                     // '1-2' 등
  const calcMainInt = mainStrToInt(calcMainStr);        // 2 등
  const savedMainInt = (r.level_int === null || r.level_int === undefined)
    ? null : Number(r.level_int);

  const calcMultiInt = (r.multi_level === '2-2') ? 1 : 0;
  const savedMultiInt = (r.multi_level_int === null || r.multi_level_int === undefined)
    ? null : Number(r.multi_level_int);

  const parts = [];

  const baseMain = (savedMainInt === null ? 0 : savedMainInt);
  if (calcMainInt > baseMain) {
    const fromLabel = SHOW_NUMERIC_PROMO ? String(baseMain) : mainIntToStr(baseMain);
    const toLabel   = SHOW_NUMERIC_PROMO ? String(calcMainInt) : calcMainStr;
    parts.push(`MAIN: ${fromLabel} → ${toLabel}`);
  }

  if (r['LEVEL(report)'] === '2-2') {
    const baseMulti = (savedMultiInt === null ? 0 : savedMultiInt);
    if (calcMultiInt > baseMulti) {
      const fromLabel = baseMulti === 1 ? '2-2' : '0';
      const toLabel   = '2-2';
      parts.push(`MULTI: ${fromLabel} → ${toLabel}`);
    }
  }
  return parts;
}

function computePromotionString(r) {
  const parts = getPromotionParts(r);
  return parts.length ? parts.join(' / ') : '-';
}

/* --------------------- Detail ------------------------ */
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

    // 차트 + 분석
    drawMainChart(u);
    drawMultiChart(u);
    renderMainAnalysis(u);
    renderMultiAnalysis(u);

    // 모달 열기
    openModal('detail-modal');
  } catch (err) {
    console.error('[openDetail]', err);
    alert('상세 조회 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
}

function closeDetail() {
  closeModal('detail-modal');
  if (chartMain)  { chartMain.destroy(); chartMain = null; }
  if (chartMulti) { chartMulti.destroy(); chartMulti = null; }
}

/* --------------------- Charts ------------------------ */
function drawMainChart(u) {
  const ctx = $('chart-main').getContext('2d');
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
          label: `${eq || 'MAIN'} 기준 역량(%)`,
          data: tvals,
          backgroundColor: 'rgba(153,102,255,0.2)',
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 1
        },
        {
          label: '내 평균(SET UP + MAINT)',
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
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } } },
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          formatter: (value) => `${value}%`,
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: { size: 11 }
        },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue}%` } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function drawMultiChart(u) {
  const ctx = $('chart-multi').getContext('2d');
  const eq = u['MULTI EQ'];
  const setupOnly = u.metrics?.multi?.setupOnly ?? 0;
  const th = u.thresholds_multi?.multi?.['2-2'] ?? 0;

  chartMulti = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lv 2-2'],
      datasets: [
        {
          label: `${eq || 'MULTI'} 기준 역량(2-2, % )`,
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
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } } },
      plugins: {
        datalabels: {
          formatter: (v) => `${v}%`,
          color: 'black',
          anchor: 'end',
          align: 'end',
          font: { size: 11 }
        },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue}%` } }
      }
    },
    plugins: [ChartDataLabels]
  });
}

/* --------------------- Analysis ----------------------- */
function pct(x){ return Number.isFinite(Number(x)) ? (Number(x)*100).toFixed(1) : '0.0'; }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function setProgress(barId, textId, currentPct, targetPct){
  const bar = $(barId);
  const txt = $(textId);
  const width = clamp(currentPct, 0, 100);
  bar.style.width = width + '%';
  if (currentPct >= targetPct) bar.classList.add('reached'); else bar.classList.remove('reached');
  txt.textContent = `현재 ${currentPct.toFixed(1)}% / 목표 ${targetPct.toFixed(1)}%`;
}

function renderMainAnalysis(u){
  const report = String(u['LEVEL(report)'] ?? '0');
  const eq = u['MAIN EQ'];
  const t = u.thresholds?.main || null;
  const avg = Number(u.metrics?.main?.average ?? 0);
  const su  = Number(u.metrics?.main?.setup ?? 0);
  const mt  = Number(u.metrics?.main?.maint ?? 0);

  const critEl = $('crit-main');
  const gapEl  = $('gap-main');
  const weakEl = $('weak-main');

  if (!eq || !t){
    critEl.innerHTML = `<em>해당 MAIN EQ의 기준표가 없습니다.</em>`;
    gapEl.textContent = '';
    weakEl.textContent = '';
    setProgress('prog-main','prog-main-text', 0, 0);
    return;
  }

  const track = (report === '1') ? ['1-1','1-2','1-3'] : ['2'];
  const critLis = track.map(k=>{
    const need = t[k];
    const ok = avg >= need;
    return `<li>Lv.${k} ≥ <strong>${pct(need)}%</strong> — <span class="${ok?'pass':'fail'}">${ok?'충족':'미충족'}</span></li>`;
  }).join('');
  critEl.innerHTML = `
    <div><strong>설비:</strong> ${escapeHtml(eq)} / <strong>평균:</strong> ${pct(avg)}%</div>
    <ul style="margin:6px 0 0 18px;">${critLis}</ul>
    <div style="margin-top:4px;color:#666;">* MAIN은 <b>SET UP</b>과 <b>MAINT</b>의 평균으로 판정합니다.</div>
  `;

  const nextKey = track.find(k => avg < t[k]);
  if (nextKey){
    const target = t[nextKey];
    const gap = (target - avg) * 100;
    gapEl.innerHTML = `다음 목표 <b>Lv.${nextKey}</b> 까지 <b>${gap.toFixed(1)}%p</b> 부족`;
    setProgress('prog-main', 'prog-main-text', Number(pct(avg)), Number(pct(target)));
  } else {
    gapEl.innerHTML = `<b>역량 내 모든 기준 충족</b> (부족도 0%p)`;
    const target = t[ track[track.length-1] ];
    setProgress('prog-main', 'prog-main-text', Number(pct(avg)), Number(pct(target)));
  }

  const suPct = Number(pct(su));
  const mtPct = Number(pct(mt));
  const weakIs = (suPct === mtPct) ? '동일' : (suPct < mtPct ? 'SET UP' : 'MAINT');
  const diff = Math.abs(suPct - mtPct).toFixed(1);
  weakEl.innerHTML =
    (weakIs === '동일')
      ? `SET UP와 MAINT가 동일 수준입니다.`
      : `상대적으로 <b>${weakIs}</b> 역량이 낮습니다. (차이 <b>${diff}%p</b>)`;
}

function renderMultiAnalysis(u){
  const report = String(u['LEVEL(report)'] ?? '0');
  const eq = u['MULTI EQ'];
  const th = u.thresholds_multi?.multi?.['2-2'] ?? null;
  const su = Number(u.metrics?.multi?.setupOnly ?? 0);

  const critEl = $('crit-multi');
  const gapEl  = $('gap-multi');

  if (report !== '2-2'){
    critEl.innerHTML = `<em>MULTI는 <b>LEVEL(report)=2-2</b>일 때만 SET UP으로 평가합니다.</em>`;
    gapEl.textContent = '';
    setProgress('prog-multi','prog-multi-text', 0, 0);
    return;
  }
  if (!eq || th == null){
    critEl.innerHTML = `<em>해당 MULTI EQ의 기준표(2-2)가 없습니다.</em>`;
    gapEl.textContent = '';
    setProgress('prog-multi','prog-multi-text', 0, 0);
    return;
  }

  const suPct = Number(pct(su));
  const thPct = Number(pct(th));
  const ok = su >= th;

  critEl.innerHTML = `
    <div><strong>설비:</strong> ${escapeHtml(eq)} / <strong>SET UP:</strong> ${suPct.toFixed(1)}%</div>
    <div>Lv.<b>2-2</b> 합격 기준: <b>${thPct.toFixed(1)}%</b> (SET UP 단독)</div>
  `;

  if (ok){
    gapEl.innerHTML = `<b>합격 기준 충족</b> (부족도 0%p)`;
  } else {
    const gap = (th - su) * 100;
    gapEl.innerHTML = `Lv.2-2 까지 <b>${gap.toFixed(1)}%p</b> 부족`;
  }
  setProgress('prog-multi','prog-multi-text', suPct, thPct);
}

/* --------------------- Excel Export ------------------- */
function exportToXLSX(){
  if (!Array.isArray(filtered) || filtered.length === 0){
    alert('내보낼 데이터가 없습니다. 검색 조건을 확인해 주세요.');
    return;
  }
  const rows = filtered.map(r => ({
    'Name': r.NAME ?? '',
    'Group': r.GROUP ?? '',
    'Site': r.SITE ?? '',
    '필기 LEVEL': String(r['LEVEL(report)'] ?? ''),
    'MAIN EQ': r['MAIN EQ'] ?? '',
    'MAIN Avg': fmtPct(r.main_avg),
    'MAIN Level': r.main_level ?? '-',
    'MULTI EQ': r['MULTI EQ'] ?? '',
    'MULTI SET UP': fmtPct(r.multi_setup),
    'MULTI Level': r.multi_level ?? '-',
    '승급': computePromotionString(r)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, '역량 레벨');

  const filename = `skill_levels_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/* --------------------- Utils -------------------------- */
function setLoading(on) { $('loading').classList.toggle('hidden', !on); }
function showError(on) { $('error').classList.toggle('hidden', !on); }
function setText(id, val) { $(id).textContent = val ?? '-'; }
function setTag(id, prefix, lvl) {
  const el = $(id);
  if (lvl === null || lvl === undefined) {
    el.className = 'tag';
    el.textContent = `${prefix}: -`;
    return;
  }
  el.className = 'tag ' + (lvl === '2' || lvl === '2-2' ? 'ok' : lvl === '1-3' ? 'good' : lvl === '1-2' ? 'mid' : lvl === '1-1' ? 'low' : 'zero');
  el.textContent = `${prefix}: ${lvl}`;
}
function badgeLevel(lvl) {
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
