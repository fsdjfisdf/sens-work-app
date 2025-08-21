/* global Chart, axios */
'use strict';

/* ==========================================================================
   S-WORKS — analysis.js (Predicted Workers)
   - Apply 버튼으로 해외출장 입력 반영(서버 호출은 그대로, 프론트에서 월별 +증가분 적용)
   - 결원(휴가/교육) 비율(%) 보정: /(1 - pct)
   - 주말·공휴일(대한민국, 2024~2027 + 대체휴일 + 근로자의날) 제외하여 버킷별 근무일수 반영
   - 그래프 높이 축소(series=160, workers=140)
   - “월별 해외출장 인원 입력(명)”에는 합계 표시 없음
   - “증원 시점 요약”에만 그룹별/전체 합계 행 표시
   - 두 표 열 너비 및 가로 스크롤 동기화
   ========================================================================== */

let chartSeries, chartWorkers;
let abortCtrl = null;        // series/forecast/headcount 공용
let hpAbortCtrl = null;      // hiring-plan 전용
let hpReqSeq = 0;            // 응답 역전 방지 시퀀스
let isSyncInstalled = false; // 스크롤 동기화 설치 가드
let userEditedDaysPerBucket = false;

const LS_TRIP = 'analysis.tripMatrix.v1';
const LS_TRIP_APPLIED_SNAPSHOT = 'analysis.tripMatrix.applied.snapshot.v1';

/* === 그룹 구성 === */
const GROUPS = {
  PEE1: ['PEE1-PT','PEE1-HS','PEE1-IC','PEE1-CJ'],
  PEE2: ['PEE2-PT','PEE2-HS'],
  PSKH: ['PSKH-PSKH']
};
const GROUP_ORDER = ['PEE1','PEE2','PSKH'];
const PAIRS = GROUP_ORDER.flatMap(g => GROUPS[g]); // 렌더 순서

/* ===== DOM 헬퍼 ===== */
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
function on(sel, evt, cb){ const el = typeof sel==='string' ? qs(sel) : sel; el && el.addEventListener(evt, cb); }
function setText(id, v){ const el = document.getElementById(id); if (el) el.textContent = v; }
function val(sel){ const el = qs(sel); return el ? el.value : null; }

/* ===== 공통 ===== */
function secureGate(){
  const token = localStorage.getItem("x-access-token");
  const role  = localStorage.getItem("user-role");
  const unsigned = qs(".unsigned");
  const signed   = qs(".signed");
  if (!token) { unsigned?.classList.remove("hidden"); signed?.classList.add("hidden"); }
  else { unsigned?.classList.add("hidden"); signed?.classList.remove("hidden"); }
  if (!token || role !== 'admin') {
    qsa('.admin-only').forEach(el => { el.style.display='none'; });
  }
  on('#sign-out','click', ()=>{
    localStorage.removeItem('x-access-token'); localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.'); location.replace('./signin.html');
  });
}

function setLoading(on){
  const btn = qs('#btnRun');
  const ov  = qs('#loading');
  if (btn) btn.disabled = !!on;
  ov?.classList.toggle('hidden', !on);
}

function showNotice(msg){ const el = qs('#noti'); if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }
function hideNotice(){ qs('#noti')?.classList.add('hidden'); }
function showError(msg){ const el = qs('#err'); if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }
function hideError(){ qs('#err')?.classList.add('hidden'); }

function numberFmt(v, d=1){
  if (!isFinite(v)) return '-';
  return new Intl.NumberFormat('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}

/* ===== LocalStorage: 월별 해외출장 입력 ===== */
function loadTripMatrix(){
  try { return JSON.parse(localStorage.getItem(LS_TRIP) || '{}'); }
  catch(e){ return {}; }
}
function saveTripMatrix(m){
  localStorage.setItem(LS_TRIP, JSON.stringify(m||{}));
}

/* 미적용 상태 스냅샷(문자열 비교용) */
function getTripSnapshot(){
  const m = loadTripMatrix();
  const months = Object.keys(m).sort();
  const canon = {};
  for (const month of months){
    const row = m[month] || {};
    const obj = {};
    for (const k of PAIRS) { if (row[k] != null) obj[k] = Number(row[k])||0; }
    canon[month] = obj;
  }
  return JSON.stringify(canon);
}
function loadAppliedSnapshot(){ return localStorage.getItem(LS_TRIP_APPLIED_SNAPSHOT) || ''; }
function saveAppliedSnapshot(str){ localStorage.setItem(LS_TRIP_APPLIED_SNAPSHOT, String(str||'')); }

/* Dirty 상태 UI 반영 */
function setTripDirtyState(dirty){
  const btn = qs('#btnApplyTrips');
  if (btn){
    btn.disabled = !dirty;
    btn.classList.toggle('primary', !!dirty);
    btn.title = dirty ? '미적용 변경사항을 반영합니다' : '변경사항 없음';
  }
  const hint = qs('#tripApplyHint');
  if (hint){
    hint.textContent = dirty
      ? '미적용 변경사항이 있습니다. [적용]을 눌러 반영하세요.'
      : '입력값은 LocalStorage에 저장되었습니다.';
  }
}

/* ===== 주말/공휴일 제외 유틸 ===== */
/** 2024~2027 대한민국 공휴일(대체공휴일 포함) + (옵션) 근로자의날 */
const HOLIDAYS_PUBLIC = [
  // ---------- 2024 ----------
  '2024-01-01','2024-02-09','2024-02-10','2024-02-11','2024-02-12',
  '2024-03-01','2024-04-10','2024-05-05','2024-05-06','2024-05-15',
  '2024-06-06','2024-08-15',
  '2024-09-16','2024-09-17','2024-09-18',
  '2024-10-03','2024-10-09','2024-12-25',
  // ---------- 2025 ----------
  '2025-01-01','2025-01-27','2025-01-28','2025-01-29','2025-01-30',
  '2025-03-01','2025-03-03',
  '2025-05-05','2025-05-06',
  '2025-06-06','2025-08-15',
  '2025-10-03','2025-10-05','2025-10-06','2025-10-07',
  '2025-10-09','2025-12-25',
  // ---------- 2026 ----------
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18',
  '2026-03-01','2026-03-02',
  '2026-05-05','2026-05-24','2026-05-25',
  '2026-06-03','2026-06-06',
  '2026-08-15','2026-08-17',
  '2026-09-24','2026-09-25','2026-09-26','2026-09-27',
  '2026-10-03','2026-10-05','2026-10-09',
  '2026-12-25',
  // ---------- 2027 ----------
  '2027-01-01','2027-02-06','2027-02-08','2027-02-09',
  '2027-03-01',
  '2027-05-05','2027-05-13',
  '2027-06-06','2027-06-07',
  '2027-08-15','2027-08-16',
  '2027-09-14','2027-09-15','2027-09-16',
  '2027-10-03','2027-10-04','2027-10-09',
  '2027-12-25'
];
const INCLUDE_LABOR_DAY = true;
const EXTRAS_NON_WORKING = INCLUDE_LABOR_DAY ? ['2024-05-01','2025-05-01','2026-05-01','2027-05-01'] : [];
const HOLIDAY_SET = new Set([...HOLIDAYS_PUBLIC, ...EXTRAS_NON_WORKING]);

function ymd(d){
  if (!(d instanceof Date)) return String(d);
  const tz = new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return tz.toISOString().slice(0,10);
}
function isWeekend(d){ const k = d.getDay(); return k===0 || k===6; }
function isHoliday(d){ return HOLIDAY_SET.has(ymd(d)); }

function businessDaysBetween(startDate, endDate){
  const s = new Date(startDate), e = new Date(endDate);
  if (e < s) return 0;
  let cnt = 0, cur = new Date(s);
  while (cur <= e){
    if (!isWeekend(cur) && !isHoliday(cur)) cnt++;
    cur.setDate(cur.getDate()+1);
  }
  return cnt;
}
function businessDaysInMonth(year, month1to12){
  const y = Number(year), m = Number(month1to12)-1;
  const first = new Date(y, m, 1);
  const last  = new Date(y, m+1, 0);
  return businessDaysBetween(first, last);
}

/* ISO 주차 계산 */
function getISOWeekParts(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // 목요일 기준
  const dayNum = (date.getUTCDay() || 7);
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}
function isoWeekStartUTC(isoYear, isoWeek){
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const day  = jan4.getUTCDay() || 7; // 1~7
  const mon1 = new Date(jan4);
  mon1.setUTCDate(jan4.getUTCDate() - day + 1); // ISO1주 월요일
  const start = new Date(mon1);
  start.setUTCDate(mon1.getUTCDate() + (isoWeek-1)*7);
  return start; // Monday 00:00 UTC
}
function businessDaysInISOWeek(isoYear, isoWeek){
  const startUTC = isoWeekStartUTC(isoYear, isoWeek);
  const start = new Date(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), startUTC.getUTCDate());
  const end   = new Date(start); end.setDate(start.getDate()+6);
  return businessDaysBetween(start, end);
}

/** 버킷별 근무가능일수
 * - month: YYYY-MM
 * - week:  YYYY-Www (ISO week)
 * - day:   YYYY-MM-DD
 * - 그 외: fallback(daysPerBucket)
 */
function workingDaysForBucket(bucket, freq, fallbackDays){
  const s = String(bucket||'').trim();
  try{
    if (freq==='month' || /^\d{4}-\d{2}$/.test(s)){
      const [y,m] = s.split('-').map(Number);
      return Math.max(1, businessDaysInMonth(y,m));
    }
    if (freq==='week' || /^\d{4}-W\d{2}$/i.test(s)){
      const [yy, wwRaw] = s.split('-W');
      const ww = Number(wwRaw);
      return Math.max(1, businessDaysInISOWeek(Number(yy), ww));
    }
    if (freq==='day' || /^\d{4}-\d{2}-\d{2}$/.test(s)){
      // 휴일/주말이어도 예측치가 0이 아닐 수 있으므로 최소 1일
      return 1;
    }
  }catch(e){ /* ignore */ }
  return Math.max(1, Number(fallbackDays)||1);
}

/* ===== 파라미터/옵션 ===== */
function collectParams(){
  const freq   = val('#freq');                              // day|week|month
  const horizon= parseInt(val('#horizon'), 10);             // days
  const group  = (val('#groupSelect')||'').trim();
  const site   = (val('#siteSelect')||'').trim();
  const hpd    = parseFloat(val('#hoursPerDay')) || 8;
  const dpb    = parseInt(val('#daysPerBucket'), 10) || 21; // fallback
  const rounding  = val('#rounding');
  const planMode  = val('#planMode');
  const alpha     = Number(val('#alpha') || 0.5);
  const bufferPct = Number(val('#addBuffer') || 0);
  const absencePct= Number(val('#absencePct') || 0);
  const includeMove = !!qs('#includeMove')?.checked;

  return {
    freq, horizon,
    group: group || null, site: site || null,
    hoursPerDay: hpd, daysPerBucket: dpb,
    rounding, planMode, alpha, bufferPct, absencePct, includeMove
  };
}

function updateHorizonOptions(){
  const freq = val('#freq');
  const sel  = qs('#horizon');
  if (!sel) return;
  sel.innerHTML = '';
  if (freq === 'day'){
    sel.append(new Option('1년 (365일)', '365'));
    sel.append(new Option('2년 (730일)', '730'));
  } else if (freq === 'week'){
    sel.append(new Option('1년 (52주)',  String(52*7)));
    sel.append(new Option('2년 (104주)', String(104*7)));
  } else {
    sel.append(new Option('1년 (12개월)',  String(12*30)));
    sel.append(new Option('2년 (24개월)', String(24*30)));
  }
  sel.value = sel.options[0]?.value ?? sel.options[1]?.value;
}

/* 주말/공휴일 반영한 기본 근무일 제안 */
function suggestDaysPerBucket(){
  if (userEditedDaysPerBucket) return;
  const freq = val('#freq');
  const el   = qs('#daysPerBucket');
  const hint = qs('#daysHint');
  if (!el) return;

  const today = new Date();
  let v = 21, hintText = '';

  if (freq === 'day'){
    v = 1; hintText = '일 기준: 1';
  } else if (freq === 'week'){
    const {year, week} = getISOWeekParts(today);
    v = businessDaysInISOWeek(year, week);
    hintText = `이번 주 근무일수: ${v}`;
  } else {
    v = businessDaysInMonth(today.getFullYear(), today.getMonth()+1);
    hintText = `이번 달 근무일수: ${v}`;
  }
  el.value = v;
  if (hint) hint.textContent = hintText;
}

/* ===== 데이터 호출 ===== */
async function runForecast(){
  setLoading(true); hideError(); hideNotice();
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();

  const params = collectParams();
  const token = localStorage.getItem('x-access-token');

  try {
    // 1) 과거 시계열
    const seriesRes = await axios.get('http://3.37.73.151:3001/analysis/series', {
      headers: {'x-access-token': token},
      params: { ...params, _ts: Date.now() },
      signal: abortCtrl.signal
    });
    const series = seriesRes.data?.series || [];

    // 2) 예측
    const fcRes = await axios.get('http://3.37.73.151:3001/analysis/forecast', {
      headers: {'x-access-token': token},
      params: { ...params, _ts: Date.now() },
      signal: abortCtrl.signal
    });
    const forecast = fcRes.data?.forecast || [];

    // 3) 현재 인원(userDB)
    let available = 0;
    try {
      const hcRes = await axios.get('http://3.37.73.151:3001/analysis/headcount', {
        headers: {'x-access-token': token},
        params: { group: params.group, site: params.site, _ts: Date.now() },
        signal: abortCtrl.signal
      });
      available = Number(hcRes.data?.count) || 0;
    } catch (e) { available = 0; }

    if (!series.length){ showNotice('표시할 과거 데이터가 없습니다. 필터를 바꿔보세요.'); }

    // 4) 계획(상향) + 갭 계산 — (근무일수/결원 보정 반영)
    const planned = buildPlannedForecast(forecast, params, available);

    // 5) 렌더
    renderCharts(series, forecast, planned, params, available);
    renderTable(forecast, planned, available);
    renderKpis(forecast, planned, available);

    // 6) 증원표 + 입력표
    const plan = await fetchHiringPlanOnly(params);
    window._hiringPlan = plan || { months:[], months_fmt:[], rows:[] };

    renderTripEditor(window._hiringPlan);  // (합계 없음)
    renderHiringTable(window._hiringPlan); // (그룹/전체 합계)

    // 열/스크롤 동기화
    syncHiringTables();

    // 스냅샷 = 적용 상태
    saveAppliedSnapshot(getTripSnapshot());
    setTripDirtyState(false);

    setText('lastUpdated', new Date().toLocaleString('ko-KR'));
  } catch (err) {
    if (!axios.isCancel?.(err) && err.name !== 'CanceledError') {
      console.error(err);
      showError('예측 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  } finally {
    setLoading(false);
  }
}

/* Apply 버튼: 증원표만 다시 계산 (월별 출장 입력 반영) */
async function applyTrips(){
  await updateHiringPlanOnly();
  saveAppliedSnapshot(getTripSnapshot());
  setTripDirtyState(false);
  hideNotice();
}

/* 증원표만 다시 계산 (Apply 시 호출) */
async function updateHiringPlanOnly(){
  const params = collectParams();

  if (hpAbortCtrl) hpAbortCtrl.abort();
  hpAbortCtrl = new AbortController();
  const mySeq = ++hpReqSeq;

  try{
    const plan = await fetchHiringPlanOnly(params, { signal: hpAbortCtrl.signal, noCache: true });
    if (mySeq !== hpReqSeq) return;

    window._hiringPlan = plan || { months:[], months_fmt:[], rows:[] };
    renderHiringTable(window._hiringPlan);

    syncHiringTables();
    showNotice('해외출장 입력값이 적용되었습니다.');
  } catch(e){
    if (!axios.isCancel?.(e) && e.name !== 'CanceledError') {
      console.error(e);
      showError('증원표 계산에 실패했습니다.');
    }
  }
}

/* 백엔드 호출: /analysis/hiring-plan (서버 로직은 변경 없음) */
async function fetchHiringPlanOnly(params, opts={}){
  const token = localStorage.getItem('x-access-token');
  const tripMatrix = loadTripMatrix();
  const _ts = Date.now();

  const hpRes = await axios.get('http://3.37.73.151:3001/analysis/hiring-plan', {
    headers: {'x-access-token': token},
    signal: opts.signal,
    params: {
      // 월 기준 고정
      freq: 'month',
      horizon: 24*30,
      hoursPerDay: params.hoursPerDay,
      daysPerBucket: params.daysPerBucket,
      rounding: params.rounding,
      planMode: params.planMode,
      alpha: params.alpha,
      bufferPct: params.bufferPct,
      absencePct: params.absencePct,
      includeMove: params.includeMove ? 1 : 0,
      // 월별 입력 행렬
      tripMatrix: JSON.stringify(tripMatrix),
      group: params.group,
      site: params.site,
      _ts
    }
  });
  return hpRes.data;
}

/* ===== 계획(상향) + 갭 (그래프/KPI용)
   - 버킷별 근무가능일수(주말/공휴일 제외) 반영
   - 결원(휴가/교육) 보정: /(1 - absencePct)
========================================================================== */
function buildPlannedForecast(forecast, params, available){
  const mode        = params.planMode; // baseline|upper|blend
  const alpha       = Number(params.alpha || 0.5);
  const bufferPct   = Number(params.bufferPct || 0);
  const rounding    = params.rounding;
  const hoursPerDay = Number(params.hoursPerDay)||8;
  const availRate   = Math.max(0.01, 1 - (Number(params.absencePct||0)/100)); // 결원 보정

  const safe = (x)=> Math.max(0.0001, x);

  return forecast.map(r => {
    const y = Number(r.yhat)||0;
    const u = Number(r.yhat_upper)||y;

    const baseHours = (mode === 'upper') ? u
                    : (mode === 'blend') ? (alpha*u + (1-alpha)*y)
                    : y;

    // 버킷별 근무가능일수 적용
    const effDays = workingDaysForBucket(r.bucket, params.freq, params.daysPerBucket);
    const hpw     = hoursPerDay * effDays;         // 1인당 버킷 시간
    const denom   = safe(hpw * availRate);         // 결원 보정

    const reqBase    = y         / denom;
    const reqPlanRaw = (baseHours * (1 + bufferPct/100)) / denom;

    let reqPlan;
    if (rounding==='ceil')      reqPlan = Math.ceil(reqPlanRaw);
    else if (rounding==='floor')reqPlan = Math.floor(reqPlanRaw);
    else                        reqPlan = Math.round(reqPlanRaw);

    const gap = reqPlan - (Number(available)||0);

    return {
      bucket: r.bucket,
      yhat_plan: baseHours * (1 + bufferPct/100), // 계획(상향) 시간 (표시용)
      required_plan: reqPlan,
      required_base: reqBase,
      gap
    };
  });
}

/* ===== 그래프 ===== */
function renderCharts(series, forecast, planned, params, available){
  // 높이 축소
  const c1 = qs('#chartSeries');
  const c2 = qs('#chartWorkers');
  if (c1) c1.height = 160;
  if (c2) c2.height = 140;

  const ctx1 = c1?.getContext('2d');
  const ctx2 = c2?.getContext('2d');
  if (!ctx1 || !ctx2) return;

  const labelsHist = series.map(r=>r.bucket);
  const dataHist   = series.map(r=>r.total_hours);

  const labelsFc = forecast.map(r=>r.bucket);
  const dataFc   = forecast.map(r=>r.yhat);
  const lowerFc  = forecast.map(r=>r.yhat_lower);
  const upperFc  = forecast.map(r=>r.yhat_upper);

  const plannedHours = planned.map(p=>p.yhat_plan);
  const baseWorkers  = planned.map(p=>p.required_base);
  const planWorkers  = planned.map(p=>p.required_plan);
  const gaps         = planned.map(p=>p.gap);

  const labels = [...labelsHist, ...labelsFc];
  const showConf = !!qs('#showConf')?.checked;

  const ds = [
    { label: '실측(총 작업시간, h)', data: [...dataHist, ...new Array(dataFc.length).fill(null)], borderWidth: 2, tension: 0.2 },
    { label: '예측(총 작업시간, h)', data: [...new Array(dataHist.length).fill(null), ...dataFc], borderDash: [6,4], borderWidth: 2, tension: 0.2 },
    { label: '계획(상향, h)', data: [...new Array(dataHist.length).fill(null), ...plannedHours], borderDash: [2,2], borderWidth: 2, tension: 0.2 }
  ];
  if (showConf && dataFc.length){
    ds.push({ label: '하한', data: [...new Array(dataHist.length).fill(null), ...lowerFc], borderWidth: 0, pointRadius: 0 });
    ds.push({ label: '신뢰구간', data: [...new Array(dataHist.length).fill(null), ...upperFc], borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(99,102,241,0.15)', fill: '-1' });
  }

  if (chartSeries) chartSeries.destroy();
  chartSeries = new Chart(ctx1, {
    type: 'line',
    data: { labels, datasets: ds },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, labels: { boxWidth: 10 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${numberFmt(ctx.parsed.y,1)} h` } }
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: '시간(h)' } } },
      elements: { point: { radius: 0 } },
      layout: { padding: { top: 4, right: 6, bottom: 2, left: 4 } }
    }
  });

  if (chartWorkers) chartWorkers.destroy();
  chartWorkers = new Chart(ctx2, {
    data: {
      labels: labelsFc,
      datasets: [
        { type: 'line', label: '필요 인원(기본)', data: baseWorkers, borderWidth: 2, tension: 0.2 },
        { type: 'line', label: '필요 인원(계획)', data: planWorkers, borderWidth: 2, borderDash: [4,3], tension: 0.2 },
        { type: 'line', label: '현재 인원(고정)', data: labelsFc.map(()=>available), borderWidth: 2, borderDash: [2,2], tension: 0, stepped: true },
        { type: 'bar',  label: '갭(계획−현재)', data: gaps, yAxisID: 'y', barPercentage: 0.65, order: 0 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, labels: { boxWidth: 10 } },
        tooltip: { callbacks: { label: (ctx)=> `${ctx.dataset.label}: ${numberFmt(ctx.parsed.y,2)} 명` } }
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: '인원(명)' } } },
      elements: { point: { radius: 0 } },
      layout: { padding: { top: 4, right: 6, bottom: 2, left: 4 } }
    }
  });
}

/* ===== 예측표(일부) ===== */
function renderTable(forecast, planned, available){
  const tbody = qs('#tblForecast tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (let i=0; i<Math.min(30, forecast.length); i++){
    const f = forecast[i];
    const p = planned[i];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.bucket}</td>
      <td>${numberFmt(f.yhat,1)}</td>
      <td>${numberFmt(p.yhat_plan,1)}</td>
      <td>${numberFmt(f.yhat_lower,1)}</td>
      <td>${numberFmt(f.yhat_upper,1)}</td>
      <td>${numberFmt(p.required_base,2)}</td>
      <td>${numberFmt(p.required_plan,2)}</td>
      <td>${numberFmt(available,0)}</td>
      <td>${numberFmt(p.gap,2)}</td>
    `;
    tbody.appendChild(tr);
  }
}

/* ===== KPI ===== */
function renderKpis(forecast, planned, available){
  if (!forecast.length || !planned.length){
    ['kpiNextWorkers','kpiAvgWorkers','kpiForecastHours','kpiNextWorkersBase','kpiAvgWorkersBase','kpiForecastHoursBase','kpiAvailable','kpiNextGap','kpiAvgGap'].forEach(id=>setText(id,'-'));
  }else{
    const nextPlan = planned[0].required_plan;
    const avgPlan  = planned.reduce((a,b)=>a+b.required_plan,0)/planned.length;
    const sumPlanH = planned.reduce((a,b)=>a+b.yhat_plan,0);

    const nextBase = planned[0].required_base;
    const avgBase  = planned.reduce((a,b)=>a+b.required_base,0)/planned.length;
    const sumBaseH = forecast.reduce((a,b)=>a+b.yhat,0);

    setText('kpiNextWorkers', numberFmt(nextPlan,2));
    setText('kpiAvgWorkers', numberFmt(avgPlan,2));
    setText('kpiForecastHours', numberFmt(sumPlanH,1));
    setText('kpiNextWorkersBase', numberFmt(nextBase,2));
    setText('kpiAvgWorkersBase', numberFmt(avgBase,2));
    setText('kpiForecastHoursBase', numberFmt(sumBaseH,1));

    setText('kpiAvailable', numberFmt(available,0));
    paintDelta('kpiNextGap', nextPlan - available);
    paintDelta('kpiAvgGap',  avgPlan - available);
  }
}
function paintDelta(id, v){
  const el = qs('#'+id);
  if (!el) return;
  el.textContent = numberFmt(v,2);
  el.classList.remove('pos','neg');
  if (v > 0) el.classList.add('neg');   // 부족(빨강)
  else if (v < 0) el.classList.add('pos'); // 여유(초록)
}

/* ===== ⑤-1 월별 해외출장 입력 테이블 (합계 없음) ===== */
function renderTripEditor(plan){
  const thead = document.getElementById('tripEditThead') || qs('#tblTripEdit thead');
  const tbody = document.getElementById('tripEditTbody') || qs('#tblTripEdit tbody');
  if (!thead || !tbody){ console.warn('Trip editor containers not found.'); return; }

  thead.innerHTML = ''; tbody.innerHTML = '';

  const monthsToShow = Math.min(Number(val('#monthsToShow')||12), (plan?.months?.length||0));
  if (!plan || !plan.months || !monthsToShow){
    thead.innerHTML = '<tr><th class="sticky-col">사이트</th></tr>';
    return;
  }

  const months = plan.months.slice(0, monthsToShow);
  const monthsFmt = plan.months_fmt.slice(0, monthsToShow);
  const tripMatrix = loadTripMatrix();

  // 헤더
  const trH = document.createElement('tr');
  trH.innerHTML = ['<th class="sticky-col">사이트</th>', ...monthsFmt.map(m => `<th>${m}</th>`)].join('');
  thead.appendChild(trH);

  // 사이트 행만 표시(합계 없음)
  for (const g of GROUP_ORDER){
    for (const key of GROUPS[g]){
      const tr = document.createElement('tr');
      const cells = [`<td class="sticky-col"><b>${key}</b></td>`];
      for (let i=0;i<monthsToShow;i++){
        const mKey = months[i];
        const cur = (tripMatrix?.[mKey]?.[key]);
        const valNum = (Number.isFinite(Number(cur)) ? Number(cur) : 0);
        cells.push(`
          <td>
            <input type="number" min="0" step="1" value="${valNum}"
                   data-month="${mKey}" data-key="${key}" class="trip-input"/>
          </td>
        `);
      }
      tr.innerHTML = cells.join('');
      tbody.appendChild(tr);
    }
  }

  // 입력 변경: 저장 (Apply는 별도 버튼)
  tbody.oninput = (e)=>{
    const t = e.target;
    if (!t.classList.contains('trip-input')) return;
    const month = t.dataset.month;
    const key   = t.dataset.key;
    const num   = Math.max(0, Number(t.value)||0);

    const mat = loadTripMatrix();
    mat[month] = mat[month] || {};
    mat[month][key] = num;
    saveTripMatrix(mat);

    t.classList.add('edited');
    setTimeout(()=> t.classList.remove('edited'), 600);

    const dirtyNow = getTripSnapshot() !== loadAppliedSnapshot();
    setTripDirtyState(dirtyNow);
  };
}

/* ===== ⑤-2 증원 시점 요약 테이블 (프론트에서 출장 수치 +) ===== */
function renderHiringTable(plan){
  const thead = document.getElementById('tblHiringThead') || qs('#tblHiring thead');
  const tbody = document.getElementById('tblHiringTbody') || qs('#tblHiring tbody');
  if (!thead || !tbody){ console.warn('Hiring table containers not found.'); return; }
  thead.innerHTML = ''; tbody.innerHTML = '';

  if (!plan || !plan.months || !plan.rows || !plan.rows.length){
    thead.innerHTML = '<tr><th>사이트</th></tr>';
    return;
  }

  const monthsToShow = Math.min(Number(val('#monthsToShow') || 12), plan.months.length);
  const months = plan.months.slice(0, monthsToShow);
  const monthsFmt = plan.months_fmt.slice(0, monthsToShow);
  const tripMatrix = loadTripMatrix();

  // 헤더
  const trH = document.createElement('tr');
  trH.innerHTML = ['<th class="sticky-col">사이트</th>', ...monthsFmt.map(m => `<th>${m}</th>`)].join('');
  thead.appendChild(trH);

  // 사이트별 plusAdj 저장 (그룹/전체 합계 계산에 사용)
  const sitePlusByMonth = {}; // { key: number[] }

  // 사이트 순서를 그룹 기준으로 정렬해서 렌더
  const rowMap = new Map(plan.rows.map(r=>[r.key, r]));

  for (const g of GROUP_ORDER){
    for (const key of GROUPS[g]){
      const row = rowMap.get(key);
      if (!row) continue;

      // 사이트 증가분 계산 (서버 증가분 + 출장 입력)
      const plusArr = [];
      for (let i=0;i<monthsToShow;i++){
        const baseCumPrev = i===0 ? 0 : (row.cumGap[i-1] || 0);
        const baseCum     = row.cumGap[i] || 0;
        const basePlus    = Math.max(0, baseCum - baseCumPrev);

        const tripPlus    = Math.max(0, Number(tripMatrix?.[months[i]]?.[key]) || 0);
        const plusAdj     = basePlus + tripPlus;
        plusArr[i] = plusAdj;
      }
      sitePlusByMonth[key] = plusArr;

      // 행 렌더
      const tr = document.createElement('tr');
      const cells = [`<td class="sticky-col"><b>${key}</b></td>`];
      let siteCum = 0;
      for (let i=0;i<monthsToShow;i++){
        const p = plusArr[i] || 0;
        siteCum += p;
        let text = p > 0 ? `+${p}` : '0';
        if (siteCum > 0) text += ` (${siteCum})`;
        const cls = p > 0 ? 'hi-plus' : 'hi-zero';
        cells.push(`<td class="${cls}">${text}</td>`);
      }
      tr.innerHTML = cells.join('');
      tbody.appendChild(tr);
    }

    // 그룹 합계 행
    const trSub = document.createElement('tr');
    trSub.className = 'row-subtotal';
    const subCells = [`<td class="sticky-col"><b>${g}</b></td>`];

    let groupCum = 0;
    for (let i=0;i<monthsToShow;i++){
      let sumPlus = 0;
      for (const key of GROUPS[g]) {
        const arr = sitePlusByMonth[key] || [];
        sumPlus += Math.max(0, Number(arr[i]) || 0);
      }
      groupCum += sumPlus;

      let text = sumPlus > 0 ? `+${sumPlus}` : '0';
      if (groupCum > 0) text += ` (${groupCum})`;
      const cls = sumPlus > 0 ? 'hi-plus' : 'hi-zero';
      subCells.push(`<td class="${cls}">${text}</td>`);
    }
    trSub.innerHTML = subCells.join('');
    tbody.appendChild(trSub);
  }

  // 전체 합계 행
  const trAll = document.createElement('tr');
  trAll.className = 'row-total';
  const totalCells = ['<td class="sticky-col"><b>ALL</b></td>'];

  let grandCum = 0;
  for (let i=0;i<monthsToShow;i++){
    let totalPlus = 0;
    for (const g of GROUP_ORDER){
      for (const key of GROUPS[g]) {
        const arr = sitePlusByMonth[key] || [];
        totalPlus += Math.max(0, Number(arr[i]) || 0);
      }
    }
    grandCum += totalPlus;

    let text = totalPlus > 0 ? `+${totalPlus}` : '0';
    if (grandCum > 0) text += ` (${grandCum})`;
    const cls = totalPlus > 0 ? 'hi-plus' : 'hi-zero';
    totalCells.push(`<td class="${cls}">${text}</td>`);
  }
  trAll.innerHTML = totalCells.join('');
  tbody.appendChild(trAll);
}

/* ===== 열 너비 동기화 + 스크롤 동기화 ===== */
function syncHiringTables(){
  const tripTbl = document.getElementById('tblTripEdit');
  const hireTbl = document.getElementById('tblHiring');
  if (!tripTbl || !hireTbl) return;

  requestAnimationFrame(() => {
    const tripHdr = tripTbl.querySelector('thead tr');
    const hireHdr = hireTbl.querySelector('thead tr');
    if (!tripHdr || !hireHdr) return;

    const tripThs = Array.from(tripHdr.children);
    const hireThs = Array.from(hireHdr.children);
    const cols = Math.min(tripThs.length, hireThs.length);
    if (cols === 0) return;

    const widths = [];
    for (let i=0;i<cols;i++){
      const w1 = Math.ceil(tripThs[i].getBoundingClientRect().width);
      const w2 = Math.ceil(hireThs[i].getBoundingClientRect().width);
      const min = (i===0) ? 140 : 92;
      widths[i] = Math.max(w1, w2, min);
    }

    applyColgroup(tripTbl, 'tripCols', widths);
    applyColgroup(hireTbl, 'hiringCols', widths);
  });
}

function applyColgroup(table, colgroupId, widths){
  let cg = document.getElementById(colgroupId) || table.querySelector('colgroup');
  if (!cg){
    cg = document.createElement('colgroup');
    cg.id = colgroupId;
    table.insertBefore(cg, table.firstChild);
  }
  cg.innerHTML = '';
  widths.forEach(px => {
    const col = document.createElement('col');
    col.style.width = px + 'px';
    cg.appendChild(col);
  });
  table.style.tableLayout = 'fixed';
}

/* 수평 스크롤 동기화 (양방향) */
function installScrollSync(group){
  if (isSyncInstalled) return;
  const wraps = Array.from(document.querySelectorAll(`.sync-scroll[data-sync="${group}"]`));
  if (!wraps.length) return;
  let syncing = false;
  wraps.forEach(w => {
    w.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      const x = w.scrollLeft;
      wraps.forEach(o => { if (o !== w) o.scrollLeft = x; });
      syncing = false;
    }, { passive: true });
  });
  window.addEventListener('resize', () => { syncHiringTables(); }, { passive: true });
  isSyncInstalled = true;
}

/* ===== 기타 ===== */
function resetForm(){
  qs('#freq').value = 'month';
  updateHorizonOptions();
  qs('#groupSelect').value = '';
  qs('#siteSelect').value = '';
  qs('#hoursPerDay').value = 8;

  userEditedDaysPerBucket = false;
  suggestDaysPerBucket();

  qs('#planMode').value = 'blend';
  qs('#alpha').value = 0.5;
  setText('alphaVal', '0.50');
  qs('#addBuffer').value = 5;
  qs('#rounding').value = 'ceil';
  qs('#absencePct').value = 10;
  qs('#includeMove').checked = true;

  qs('#showConf').checked = true;

  runForecast();
}

// CSV 내보내기 (예측표 일부)
function exportCsv(){
  const rows = qsa('#tblForecast tbody tr').map(tr=> Array.from(tr.querySelectorAll('td')).map(td => td.textContent.replace(/,/g,'')));
  if (!rows.length){ showNotice('내보낼 예측 행이 없습니다.'); return; }
  const header = ['기간','예측 작업시간(h)','계획 작업시간(h)','하한','상한','필요 인원(기본)','필요 인원(계획)','현재 인원','갭(계획−현재)'];
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'forecast_gap.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ===== 초기 로딩 ===== */
document.addEventListener('DOMContentLoaded', () => {
  secureGate();

  // 기본 이벤트
  on('#btnRun','click', runForecast);
  on('#btnReset','click', resetForm);
  on('#btnCsv','click', exportCsv);
  on('#showConf','change', runForecast);
  on('#includeMove','change', runForecast);

  // Apply & Reset(입력)
  on('#btnApplyTrips', 'click', applyTrips);
  on('#btnResetTrips','click', () => {
    localStorage.removeItem(LS_TRIP);
    renderTripEditor(window._hiringPlan);
    setTripDirtyState(true);
    showNotice('입력이 초기화되었습니다. [적용]을 눌러 계산에 반영하세요.');
  });

  on('#monthsToShow','change', ()=> {
    renderTripEditor(window._hiringPlan);
    renderHiringTable(window._hiringPlan);
    syncHiringTables();
  });

  ['planMode','alpha','addBuffer','rounding','absencePct'].forEach(id=>{
    on(`#${id}`,'change', ()=>{
      if (id==='alpha'){
        const v = Number(val('#alpha'));
        setText('alphaVal', v.toFixed(2));
      }
      runForecast();
    });
    on(`#${id}`,'input', ()=>{
      if (id==='alpha'){
        const v = Number(val('#alpha'));
        setText('alphaVal', v.toFixed(2));
      }
    });
  });

  on('#freq','change', () => { updateHorizonOptions(); suggestDaysPerBucket(); });
  on('#daysPerBucket','input', () => { userEditedDaysPerBucket = true; });

  // 초기 값/상태
  updateHorizonOptions();
  suggestDaysPerBucket();
  setText('alphaVal', Number(val('#alpha')||0.5).toFixed(2));

  // 그래프 섹션은 기본 접힘
  qs('#sec-graphs')?.removeAttribute('open');

  // 수평 스크롤 동기화 설치
  installScrollSync('hiring');

  // 스냅샷 기준 설정
  if (!loadAppliedSnapshot()) saveAppliedSnapshot(getTripSnapshot());
  setTripDirtyState(getTripSnapshot() !== loadAppliedSnapshot());

  runForecast();
});
