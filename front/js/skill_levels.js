/* ==========================================================================
   S-WORKS — 역량 레벨 뷰어 (skill_levels.js)
   - 목록:   GET  /api/skill/levels
   - 상세:   GET  /api/skill/levels/:id
   - 엑셀:   (1) window.XLSX 있으면 프론트 생성
            (2) 없으면 GET /api/skill/levels/export (필터 적용) 다운로드
   - 승급:   DB 저장값(LEVEL=1..4, MULTI LEVEL=0/1) vs 산정값 비교
             * DB 키 대소문자/공백 변형 허용
   ========================================================================== */

const API_BASE = "http://3.37.73.151:3001/api";

let rawList = [];
let filtered = [];
let chartMain = null;
let chartMulti = null;

/* --------------------- Boot --------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  bindUI();
  await loadList();
  hydrateFilters(rawList);
  applyFilterAndRender();
});

/* --------------------- UI Bindings --------------------- */
function bindUI() {
  const $ = (id) => document.getElementById(id);

  $('btn-search')?.addEventListener('click', applyFilterAndRender);
  $('btn-reset')?.addEventListener('click', () => {
    $('f-name') && ( $('f-name').value = '' );
    $('f-group') && ( $('f-group').value = '' );
    $('f-site') && ( $('f-site').value = '' );
    $('f-eq') && ( $('f-eq').value = '' );
    $('f-report') && ( $('f-report').value = '' );
    applyFilterAndRender();
  });
  $('btn-export')?.addEventListener('click', exportTableToExcel);

  // 상세 모달 닫기
  const closeBtn = document.getElementById('detail-close');
  closeBtn?.addEventListener('click', closeDetail);
  const modal = document.getElementById('detail-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeDetail();
  });

  // “설명(도움말)” 버튼(있으면)
  const helpBtn = document.getElementById('btn-help');
  helpBtn?.addEventListener('click', showHowItWorks);
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
    rawList = (res.data.result || []).map(enrichWithPromotion);
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

  if (!groupSel || !siteSel) return;

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
  const name    = document.getElementById('f-name')?.value.trim() || '';
  const group   = document.getElementById('f-group')?.value || '';
  const site    = document.getElementById('f-site')?.value || '';
  const eq      = document.getElementById('f-eq')?.value || '';
  const report  = document.getElementById('f-report')?.value || '';

  filtered = rawList.filter(r => {
    if (name && !String(r.NAME ?? '').includes(name)) return false;
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

/* --------------------- Table --------------------- */
function renderTable() {
  const tbody = document.getElementById('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const empty = document.getElementById('empty');
  if (empty) empty.classList.toggle('hidden', filtered.length > 0);

  for (const r of filtered) {
    const tr = document.createElement('tr');

    // 승급 문구 조합
    const promos = [];
    if (r._promotion?.mainMsg) promos.push(r._promotion.mainMsg);
    if (r._promotion?.multiMsg) promos.push(r._promotion.multiMsg);
    const promoText = promos.join(' / ') || '-';

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

      <td class="promo">${escapeHtml(promoText)}</td>
      <td><button class="btn tiny" data-open="${r.ID}">보기</button></td>
    `;

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

    // DB 저장값도 안전하게 읽어 승급 태그/표시용으로 사용
    const promoPack = enrichWithPromotion(u)._promotion || {};

    // 텍스트 채우기
    setText('d-name', u.NAME);
    setText('d-group', u.GROUP);
    setText('d-site', u.SITE);
    setText('d-report', u['LEVEL(report)']);
    setText('d-main-eq', u['MAIN EQ'] ?? '-');
    setText('d-multi-eq', u['MULTI EQ'] ?? '-');

    setTag('d-main-lvl', 'MAIN', u.capability?.main_level ?? u.main_level);
    setTag('d-multi-lvl', 'MULTI', u.capability?.multi_level ?? u.multi_level);

    // 차트 + 분석
    drawMainChart(u);
    drawMultiChart(u);
    renderMainAnalysis(u);
    renderMultiAnalysis(u);

    // (선택) 승급 제안 텍스트 박스가 있다면 갱신
    const promoEl = document.getElementById('d-promo');
    if (promoEl) {
      promoEl.textContent = promoPack.hasPromotion
        ? `승급 제안 — ${[promoPack.mainMsg, promoPack.multiMsg].filter(Boolean).join(' / ')}`
        : '승급 제안 없음';
    }

    // 모달 열기
    const modal = document.getElementById('detail-modal');
    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden', 'false');
  } catch (err) {
    console.error('[openDetail]', err);
    alert('상세 조회 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
}

function closeDetail() {
  const modal = document.getElementById('detail-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  if (chartMain)  { chartMain.destroy(); chartMain = null; }
  if (chartMulti) { chartMulti.destroy(); chartMulti = null; }
}

/* --------------------- Charts --------------------- */
function drawMainChart(u) {
  const ctx = document.getElementById('chart-main')?.getContext('2d');
  if (!ctx) return;

  const eq = u['MAIN EQ'];
  const avg = u.metrics?.main?.average ?? 0;

  // 기준 역량(=임계값) 표
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
          label: '내 평균(SET UP+MAINT)',
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
        y: { beginAtZero: true, ticks: { callback: (v) => `${v}%` } }
      },
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
  const ctx = document.getElementById('chart-multi')?.getContext('2d');
  if (!ctx) return;

  const eq = u['MULTI EQ'];
  const setupOnly = u.metrics?.multi?.setupOnly ?? 0;
  const th = u.thresholds_multi?.multi?.['2-2'] ?? 0;

  chartMulti = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lv 2-2'],
      datasets: [
        {
          label: `${eq || 'MULTI'} 기준 역량(2-2, %)`,
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

/* --------------------- Analysis (기준 & 부족도) --------------------- */
function pct(x){ return isFinite(x) ? (x*100).toFixed(1) : '0.0'; }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function setProgress(barId, textId, currentPct, targetPct){
  const bar = document.getElementById(barId);
  const txt = document.getElementById(textId);
  if (!bar || !txt) return;
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

  const critEl = document.getElementById('crit-main');
  const gapEl  = document.getElementById('gap-main');
  const weakEl = document.getElementById('weak-main');

  if (!critEl || !gapEl || !weakEl) return;

  if (!eq || !t){
    critEl.innerHTML = `<em>해당 MAIN EQ의 기준표가 없습니다.</em>`;
    gapEl.textContent = '';
    weakEl.textContent = '';
    setProgress('prog-main','prog-main-text', 0, 0);
    return;
  }

  // 트랙: report=1 → 1-1/1-2/1-3, report=2 또는 2-2 → 2
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
    gapEl.innerHTML = `<b>트랙 내 모든 기준 충족</b> (부족도 0%p)`;
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

  const critEl = document.getElementById('crit-multi');
  const gapEl  = document.getElementById('gap-multi');
  if (!critEl || !gapEl) return;

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

/* --------------------- Promotion (승급) --------------------- */
// 공백/대소문자 무시 키 탐색
function pickKey(obj, target) {
  const norm = (s) => String(s).replace(/\s+/g,'').toUpperCase();
  const want = norm(target);
  return Object.keys(obj || {}).find(k => norm(k) === want);
}

// DB 저장값 읽기
function readDbMainLevelInt(r) {
  const key = pickKey(r, 'LEVEL'); // 1..4 저장
  const raw = key ? r[key] : undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null; // null이면 비교 스킵
}
function readDbMultiLevelInt(r) {
  const key = pickKey(r, 'MULTI LEVEL'); // 0/1 저장
  const raw = key ? r[key] : undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null; // null이면 비교 스킵
}

function mainStrToInt(s){
  if (!s) return 0;
  switch(String(s)){
    case '1-1': return 1;
    case '1-2': return 2;
    case '1-3': return 3;
    case '2':   return 4;
    default:    return 0;
  }
}
function mainIntToStr(n){
  switch(Number(n)||0){
    case 1: return '1-1';
    case 2: return '1-2';
    case 3: return '1-3';
    case 4: return '2';
    default:return '0';
  }
}

// 목록/상세 공용: 승급 정보 부가
function enrichWithPromotion(r){
  // DB 값
  const dbMainInt   = readDbMainLevelInt(r);      // null | 1..4
  const dbMultiInt  = readDbMultiLevelInt(r);     // null | 0/1

  // 산정값 (백엔드가 계산해 준 문자열 레벨)
  const calcMainInt  = mainStrToInt(r.main_level || r.capability?.main_level);
  const calcMultiInt = ((r.multi_level || r.capability?.multi_level) === '2-2') ? 1 : 0;

  // DB 값이 없으면 승급 비교 스킵
  const mainUp  = (dbMainInt !== null)  ? (calcMainInt  > dbMainInt ) : false;
  const multiUp = (dbMultiInt !== null) ? (calcMultiInt > dbMultiInt) : false;

  const mainMsg  = mainUp
    ? `MAIN: ${mainIntToStr(dbMainInt)} → ${mainIntToStr(calcMainInt)}`
    : '';

  const multiMsg = multiUp
    ? `MULTI: ${dbMultiInt===0 ? '0' : '2-2'} → 2-2`
    : '';

  return {
    ...r,
    _promotion: {
      hasPromotion: mainUp || multiUp,
      mainUp, multiUp,
      mainMsg, multiMsg,
      dbMainInt, dbMultiInt,
      calcMainInt, calcMultiInt
    }
  };
}

/* --------------------- Export to Excel --------------------- */
async function exportTableToExcel() {
  try {
    // 수집
    const rows = filtered.map(r => {
      const promos = [];
      if (r._promotion?.mainMsg) promos.push(r._promotion.mainMsg);
      if (r._promotion?.multiMsg) promos.push(r._promotion.multiMsg);
      const promoText = promos.join(' / ') || '-';

      return {
        'Name': r.NAME ?? '',
        'Group': r.GROUP ?? '',
        'Site': r.SITE ?? '',
        '필기 LEVEL': r['LEVEL(report)'] ?? '',
        'MAIN EQ': r['MAIN EQ'] ?? '',
        'MAIN Avg': fmtPctNum(r.main_avg),
        'MAIN Level': r.main_level ?? '',
        'MULTI EQ': r['MULTI EQ'] ?? '',
        'MULTI SET UP': fmtPctNum(r.multi_setup),
        'MULTI Level': r.multi_level ?? '',
        '승급': promoText
      };
    });

    // 1) 프론트에서 생성 (SheetJS가 있으면)
    if (window.XLSX && typeof XLSX.utils?.json_to_sheet === 'function') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Skill Levels');
      XLSX.writeFile(wb, `skill_levels_${new Date().toISOString().slice(0,10)}.xlsx`);
      return;
    }

    // 2) 백엔드에서 생성 (필터 전달)
    const token = localStorage.getItem('x-access-token');
    const params = collectFilterParams();
    const res = await axios.get(`${API_BASE}/skill/levels/export`, {
      headers: { 'x-access-token': token },
      params,
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill_levels_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[exportTableToExcel]', err);
    alert('엑셀 저장 중 오류가 발생했습니다.');
  }
}
function collectFilterParams(){
  return {
    name   : document.getElementById('f-name')?.value.trim() || '',
    group  : document.getElementById('f-group')?.value || '',
    site   : document.getElementById('f-site')?.value || '',
    eq     : document.getElementById('f-eq')?.value || '',
    report : document.getElementById('f-report')?.value || ''
  };
}

/* --------------------- Help (설명) --------------------- */
function showHowItWorks(){
  const text = [
    '🔎 역량 레벨 산정 방식',
    '',
    '1) DB의 LEVEL(report)은 필기 통과 레벨입니다.',
    '   - 0, 1, 2, 2-2로 저장됩니다.',
    '',
    '2) 실제 역량 평가는 장비별 “기준 역량(%)”을 기준으로 합니다.',
    '   - MAIN: (SET UP + MAINT) 평균으로 판정',
    '   - MULTI(2-2): SET UP 단독으로 판정',
    '',
    '3) 레벨 매핑',
    '   - MAIN → 0, 1-1, 1-2, 1-3, 2',
    '   - MULTI → 2-2 (해당 EQ의 SET UP만 반영)',
    '',
    '4) 2-2는 레벨2보다 상위입니다.',
    '   - 예) report가 2-2여도 MAIN 평균이 2에 도달하면 MAIN 레벨은 2로 보여줍니다.',
    '',
    '5) 승급 제안',
    '   - DB에 저장된 레벨(LEVEL=1~4, MULTI LEVEL=0/1)과 산정 레벨을 비교해 상향이 필요한 경우 “승급”에 표시합니다.',
  ].join('\n');
  alert(text);
}

/* --------------------- Utils --------------------- */
function setLoading(on) {
  document.getElementById('loading')?.classList.toggle('hidden', !on);
}
function showError(on) {
  document.getElementById('error')?.classList.toggle('hidden', !on);
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '-';
}
function setTag(id, prefix, lvl) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lvl === null || lvl === undefined) {
    el.className = 'tag';
    el.textContent = `${prefix}: -`;
    return;
  }
  el.className = 'tag ' + (lvl === '2' || lvl === '2-2' ? 'ok' : lvl === '1-3' ? 'good' : lvl === '1-2' ? 'mid' : lvl === '1-1' ? 'low' : 'zero');
  el.textContent = `${prefix}: ${lvl}`;
}
function badgeLevel(lvl) {
  if (lvl === null || lvl === undefined || lvl === '-') return `<span class="pill">-</span>`;
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
function fmtPctNum(x) {
  const v = Number(x);
  if (!isFinite(v)) return '';
  return (v*100).toFixed(1) + '%';
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
