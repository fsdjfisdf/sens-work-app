/* global Chart, axios */
'use strict';

/* ==========================================================================
   S-WORKS — analysis.js (Predicted Workers) — 2025-08-22
   - UI 필터(PEE1-PT 등) → API 표준 필터(group=PEE1, site=PT) 정규화
   - 최초 진입 상태와 [초기화] 동일 적용
   - 빈 파라미터 제거(cleanParams)로 전 엔드포인트 스코프 일치
   - ✅ 전체/그룹/사이트 보기에서도 per-site 기반 채용표·KPI·차트 정합
   ========================================================================== */

let chartSeries, chartWorkers;
let abortCtrl = null;        // series/forecast/headcount 공용
let hpAbortCtrl = null;      // hiring-plan 전용
let hpReqSeq = 0;            // 응답 역전 방지 시퀀스
let isSyncInstalled = false; // 스크롤 동기화 설치 가드
let userEditedDaysPerBucket = false;

/* ====== 관리자 가드 ====== */
document.addEventListener('DOMContentLoaded', async () => {
  await assertAdmin();
});
async function assertAdmin() {
  const token = localStorage.getItem('x-access-token');
  const role  = localStorage.getItem('user-role');
  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.replace('./signin.html');
    throw new Error('no token');
  }
  if (role !== 'admin') {
    alert('접근 권한이 없습니다.');
    window.location.replace('./index.html');
    throw new Error('not admin (local)');
  }
  try {
    const res = await axios.get('http://13.125.122.202:3001/user-info', {
      headers: { 'x-access-token': token }
    });
    const serverRole = res.data?.result?.ROLE || res.data?.result?.role || res.data?.result?.UserRole;
    if (serverRole && serverRole !== 'admin') {
      alert('접근 권한이 없습니다.');
      window.location.replace('./index.html');
      throw new Error('not admin (server)');
    }
  } catch (err) {
    console.error('admin check failed:', err);
    alert('세션이 만료되었거나 권한 확인에 실패했습니다. 다시 로그인해주세요.');
    window.location.replace('./signin.html');
    throw err;
  }
}

// 다른 탭에서 로그아웃된 경우 즉시 차단
window.addEventListener('storage', (e) => {
  if (e.key === 'x-access-token' && !e.newValue) {
    alert('로그아웃되었습니다.');
    window.location.replace('./signin.html');
  }
});

/* ===== 상수/로컬스토리지 ===== */
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
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.');
    location.replace('./signin.html');
  });
}

/* 빈 값/내부 객체 제거하고 서버로 보낼 파라미터만 추림 */
function cleanParams(o){
  const out = {};
  for (const [k,v] of Object.entries(o)){
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'object' && !Array.isArray(v)) continue;
    out[k] = v;
  }
  return out;
}

/* UI 필터 → API 표준 필터 (site는 단일 코드로) */
function apiFiltersFromUI(ui){
  const g = ui.group || null;
  let s = ui.site || null;
  if (s) {
    // 예: "PEE1-PT" → "PT", "PSKH-PSKH" → "PSKH"
    const parts = String(s).split('-');
    s = parts[parts.length - 1];
  }
  return { group: g || null, site: s || null };
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
function numberFmt(v, d=1){ if (!isFinite(v)) return '-'; return new Intl.NumberFormat('ko-KR',{ minimumFractionDigits:d, maximumFractionDigits:d }).format(v); }

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
const HOLIDAYS_PUBLIC = [
  '2024-01-01','2024-02-09','2024-02-10','2024-02-11','2024-02-12',
  '2024-03-01','2024-04-10','2024-05-05','2024-05-06','2024-05-15',
  '2024-06-06','2024-08-15',
  '2024-09-16','2024-09-17','2024-09-18',
  '2024-10-03','2024-10-09','2024-12-25',
  '2025-01-01','2025-01-27','2025-01-28','2025-01-29','2025-01-30',
  '2025-03-01','2025-03-03',
  '2025-05-05','2025-05-06',
  '2025-06-06','2025-08-15',
  '2025-10-03','2025-10-05','2025-10-06','2025-10-07',
  '2025-10-09','2025-12-25',
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18',
  '2026-03-01','2026-03-02',
  '2026-05-05','2026-05-24','2026-05-25',
  '2026-06-03','2026-06-06',
  '2026-08-15','2026-08-17',
  '2026-09-24','2026-09-25','2026-09-26','2026-09-27',
  '2026-10-03','2026-10-05','2026-10-09',
  '2026-12-25',
  '2027-01-01','2027-02-06','2027-02-08','2027-02-09',
  '2027-03-01',
  '2027-05-05','2027-05-13',
  '2027-06-06','2027-06-07',
  '2027-08-15','2027-08-16',
  '2027-09-14','2027-09-15','2027-09-16',
  '2027-10-03','2027-10-04','2027-10-09',
  '2027-12-25'
];
const EXTRAS_NON_WORKING = ['2024-05-01','2025-05-01','2026-05-01','2027-05-01'];
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
  const dayNum = (date.getUTCDay() || 7);
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}
function isoWeekStartUTC(isoYear, isoWeek){
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const day  = jan4.getUTCDay() || 7;
  const mon1 = new Date(jan4);
  mon1.setUTCDate(jan4.getUTCDate() - day + 1);
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

/** 버킷별 근무가능일수 */
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
      return 1;
    }
  }catch(e){}
  return Math.max(1, Number(fallbackDays)||1);
}

/* ===== 파라미터/옵션 ===== */
function collectParams(){
  const freq = val('#freq'); // day|week|month

  let horizonCountInput = parseInt(val('#horizonCount'), 10);
  const hasNew = !Number.isNaN(horizonCountInput);

  let horizonCount, horizonDays;
  if (hasNew) {
    horizonCount = Math.max(1, horizonCountInput || 12);
    horizonDays =
      (freq === 'day')  ? horizonCount :
      (freq === 'week') ? horizonCount * 7 :
                          horizonCount * 30;
  } else {
    const oldHorizonDays = Math.max(1, parseInt(val('#horizon'), 10) || 365);
    horizonDays = oldHorizonDays;
    horizonCount =
      (freq === 'day')  ? oldHorizonDays :
      (freq === 'week') ? Math.max(1, Math.round(oldHorizonDays/7)) :
                          Math.max(1, Math.round(oldHorizonDays/30));
  }

  const group  = (val('#groupSelect')||'').trim();
  const site   = (val('#siteSelect')||'').trim();
  const hpd    = parseFloat(val('#hoursPerDay')) || 3.5;
  const dpb    = parseInt(val('#daysPerBucket'), 10) || 21;
  const rounding  = val('#rounding');
  const planMode  = val('#planMode');
  const alpha     = Number(val('#alpha') || 0.5);
  const bufferPct = Number(val('#addBuffer') || 0);
  const absencePct= Number(val('#absencePct') || 0);
  const includeMove = !!qs('#includeMove')?.checked;
  const normalizeByBizDays = !!qs('#normalizeByBizDays')?.checked;

  const useLower = !!qs('#useLower')?.checked;
  const lowerBlendAlpha = (()=>{
    const v = parseFloat(val('#lowerAlpha'));
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
  })();
  const smoothWin = (()=>{
    const v = parseInt(val('#smoothWin'),10);
    return Number.isFinite(v) ? Math.max(1, v) : 1;
  })();
  let growthCapPct = (()=>{
    const v = parseFloat(val('#growthCapPct'));
    if (!Number.isFinite(v) || v<=0) return 0;
    return v > 1 ? v/100 : v;
  })();
  const growthCapAbs = (()=>{
    const v = parseFloat(val('#growthCapAbs'));
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  })();

  return {
    freq, horizonDays, horizonCount,
    group: group || null, site: site || null,
    hoursPerDay: hpd, daysPerBucket: dpb,
    normalizeByBizDays,
    rounding, planMode, alpha, bufferPct, absencePct, includeMove,
    conservative: { useLower, lowerBlendAlpha, smoothWin, growthCapPct, growthCapAbs }
  };
}

/* 새 입력: 단위 라벨 동기화 */
function updateHorizonUnit(){
  const u = document.getElementById('horizonUnit');
  const freq = val('#freq');
  if (u) u.textContent = (freq === 'day') ? '일' : (freq === 'week' ? '주' : '개월');
  const inp = document.getElementById('horizonCount');
  if (inp){
    if (freq === 'day'  && Number(inp.value) > 365) inp.value = 365;
    if (freq === 'week' && Number(inp.value) > 52)  inp.value = 52;
  }
}

/* 구형 셀렉트 호환(있을 때만 동작) */
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

/* ===== 유틸: 목표 시점 인덱스 ===== */
function indexAtHorizon(planned, params){
  if (!planned?.length) return -1;
  const idx = Math.max(0, Math.min(planned.length - 1, (params.horizonCount || 1) - 1));
  return idx;
}

/* ===== 버킷 문자열 → 월 Key(YYYY-MM) 변환 ===== */
function bucketToMonthKey(bucket) {
  const s = String(bucket || '');
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0,7);
  if (/^\d{4}-W\d{2}$/i.test(s)) { // ISO 주 → 종료일(일요일) 기준 월
    const [yy, wwRaw] = s.split('-W');
    const startUTC = isoWeekStartUTC(Number(yy), Number(wwRaw));
    const endUTC = new Date(startUTC); endUTC.setUTCDate(endUTC.getUTCDate() + 6);
    const d = new Date(endUTC.getUTCFullYear(), endUTC.getUTCMonth(), endUTC.getUTCDate());
    const mm = String(d.getMonth()+1).padStart(2,'0');
    return `${d.getFullYear()}-${mm}`;
  }
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0,7);
  return s;
}

/* ===== 예측표(planned) 기준 월별 +증원 타깃 계산 ===== */
function targetMonthlyIncrementsFromPlanned(monthKeys) {
  const recon = window._recon;
  if (!recon?.planned?.length) return null;
  const { planned, available } = recon;

  const cumByMonth = new Map(); // 'YYYY-MM' -> cum shortage
  for (const p of planned) {
    const key = bucketToMonthKey(p.bucket);
    const cumShort = Math.max(0, Math.round((p.required_plan || 0) - (available || 0)));
    cumByMonth.set(key, cumShort);
  }

  const inc = [];
  let prev = 0;
  for (const m of monthKeys) {
    const cur = (cumByMonth.has(m) ? cumByMonth.get(m) : prev);
    const add = Math.max(0, cur - prev);
    inc.push(add);
    prev = cur;
  }
  return inc;
}

/* ===== 사이트별 +값을 타깃 ALL 합계에 맞추도록 재조정 ===== */
function reconcileSitePlusesToTarget(monthKeys, sitePlusByMonth, rowMap, targetInc) {
  if (!Array.isArray(targetInc)) return sitePlusByMonth;
  const siteKeys = Object.keys(sitePlusByMonth);

  for (let i=0; i<monthKeys.length; i++) {
    const need = targetInc[i] || 0;
    let curSum = 0;
    for (const k of siteKeys) curSum += Math.max(0, sitePlusByMonth[k][i] || 0);

    let diff = need - curSum;
    if (diff === 0) continue;

    const weights = siteKeys.map(k => {
      const row = rowMap.get(k);
      const prev = i === 0 ? 0 : (row?.cumGap?.[i-1] || 0);
      const now  = row?.cumGap?.[i] || 0;
      return Math.max(0, now - prev);
    });
    const totalW = weights.reduce((a,b)=>a+b,0);

    if (diff > 0) {
      const alloc = new Array(siteKeys.length).fill(0);
      if (totalW > 0) {
        const raw = weights.map(w => (w / totalW) * diff);
        const floors = raw.map(Math.floor);
        let remain = diff - floors.reduce((a,b)=>a+b,0);
        for (let j=0;j<siteKeys.length;j++) alloc[j] += floors[j];
        const order = raw.map((v,idx)=>({idx, frac: v - Math.floor(v)}))
                         .sort((a,b)=>b.frac - a.frac);
        for (let k=0; k<remain; k++) {
          const j = order[k % order.length].idx;
          alloc[j] += 1;
        }
      } else {
        for (let k=0; k<diff; k++) alloc[k % siteKeys.length] += 1;
      }
      for (let j=0;j<siteKeys.length;j++){
        const key = siteKeys[j];
        sitePlusByMonth[key][i] = (sitePlusByMonth[key][i] || 0) + alloc[j];
      }
    } else {
      let toRemove = -diff;
      while (toRemove > 0) {
        let pick = -1, best = -1;
        for (let j=0;j<siteKeys.length;j++) {
          const v = sitePlusByMonth[siteKeys[j]][i] || 0;
          if (v > best) { best = v; pick = j; }
        }
        if (best <= 0) break;
        sitePlusByMonth[siteKeys[pick]][i] = best - 1;
        toRemove--;
      }
    }
  }
  return sitePlusByMonth;
}

/* ===== NEW: per-site → 전체(합계)로 집계 (KPI/차트/결론에 사용) ===== */
function aggregateFromPerSite(perSiteList){
  if (!Array.isArray(perSiteList) || !perSiteList.length) return null;

  // 버킷 순서는 첫 사이트의 planned를 기준으로
  const order = (perSiteList[0].planned || []).map(p => p.bucket);

  const sumF = new Map();
  const sumP = new Map();

  for (const s of perSiteList){
    for (const f of (s.forecast || [])){
      const o = sumF.get(f.bucket) || { yhat:0, yhat_lower:0, yhat_upper:0 };
      o.yhat       += Number(f.yhat)||0;
      o.yhat_lower += Number(f.yhat_lower)||0;
      o.yhat_upper += Number(f.yhat_upper)||0;
      sumF.set(f.bucket, o);
    }
    for (const p of (s.planned || [])){
      const o = sumP.get(p.bucket) || { yhat_plan:0, required_plan:0, required_base:0 };
      o.yhat_plan     += Number(p.yhat_plan)||0;
      o.required_plan += Number(p.required_plan)||0;  // per-site 반올림 후 정수 합
      o.required_base += Number(p.required_base)||0;
      sumP.set(p.bucket, o);
    }
  }

  const totalAvailable = perSiteList.reduce((a,b)=> a + (Number(b.available)||0), 0);

  const aggForecast = order.map(b => {
    const v = sumF.get(b) || { yhat:0, yhat_lower:0, yhat_upper:0 };
    return { bucket: b, ...v };
  });

  const aggPlanned = order.map(b => {
    const v = sumP.get(b) || { yhat_plan:0, required_plan:0, required_base:0 };
    return {
      bucket: b,
      yhat_plan: v.yhat_plan,
      required_plan: v.required_plan,
      required_base: v.required_base,
      gap: (v.required_plan - totalAvailable)
    };
  });

  return { aggForecast, aggPlanned, totalAvailable };
}

/* ===== 데이터 호출 ===== */
async function runForecast(){
  setLoading(true); hideError(); hideNotice();
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();

  const params = collectParams();
  const { group: apiGroup, site: apiSite } = apiFiltersFromUI(params);
  const token = localStorage.getItem('x-access-token');

  const baseApiParams = cleanParams({
    freq: params.freq,
    horizon: params.horizonDays,
    group: apiGroup,
    site: apiSite,
    hoursPerDay: params.hoursPerDay,
    daysPerBucket: params.daysPerBucket,
    rounding: params.rounding,
    planMode: params.planMode,
    alpha: params.alpha,
    bufferPct: params.bufferPct,
    absencePct: params.absencePct,
    includeMove: params.includeMove ? 1 : 0,
    normalizeByBizDays: params.normalizeByBizDays ? 1 : 0,
    _ts: Date.now()
  });

  try {
    // 1) 과거 시계열
    const seriesRes = await axios.get('http://13.125.122.202:3001/analysis/series', {
      headers: {'x-access-token': token},
      params: baseApiParams,
      signal: abortCtrl.signal
    });
    const series = seriesRes.data?.series || [];

    // 2) 예측
    const fcRes = await axios.get('http://13.125.122.202:3001/analysis/forecast', {
      headers: {'x-access-token': token},
      params: baseApiParams,
      signal: abortCtrl.signal
    });
    const forecast = fcRes.data?.forecast || [];

    // 3) 현재 인원(userDB)
    let available = 0;
    try {
      const hcRes = await axios.get('http://13.125.122.202:3001/analysis/headcount', {
        headers: {'x-access-token': token},
        params: cleanParams({ group: apiGroup, site: apiSite, _ts: Date.now() }),
        signal: abortCtrl.signal
      });
      available = Number(hcRes.data?.count) || 0;
    } catch (e) { available = 0; }

    if (!series.length){ showNotice('표시할 과거 데이터가 없습니다. 필터를 바꿔보세요.'); }

    // 4) 계획(상향) + 갭 계산
    const planned = buildPlannedForecast(forecast, params, available);

    // 4-1) per-site 상세 수집 (정합성 맞추기 위해)
    let perSiteData = null;
    try {
      if (!apiGroup && !apiSite) {
        // 전체 보기: 전 사이트 수집
        perSiteData = await fetchPerSiteForecasts(params);
      } else if (apiGroup && !apiSite) {
        // 그룹만 선택: 전 사이트 수집 후 해당 그룹만 사용
        const all = await fetchPerSiteForecasts(params);
        perSiteData = all.filter(x => x.key.startsWith(`${apiGroup}-`));
      } else if (apiGroup && apiSite) {
        // 단일 사이트 선택: 현재 결과로 구성
        perSiteData = [{ key: `${apiGroup}-${apiSite}`, forecast, planned, available }];
      }
    } catch (e) {
      console.warn('fetchPerSiteForecasts failed:', e?.message || e);
      perSiteData = null;
    }
    window._perSiteData = perSiteData;

    // 4-2) KPI/차트/결론에 사용할 합계 소스 결정
    let fcForUI = forecast;
    let plannedForUI = planned;
    let availableForUI = available;

    if (Array.isArray(perSiteData) && perSiteData.length){
      const agg = aggregateFromPerSite(perSiteData);
      if (agg){
        fcForUI        = agg.aggForecast;
        plannedForUI   = agg.aggPlanned;
        availableForUI = agg.totalAvailable;
      }
    }

    // ⬇️ 타깃(= 채용표 ALL)과 KPI/차트 정합을 위해 recon은 항상 "합계"로
    window._recon = { planned: plannedForUI, available: availableForUI, params };

    // 5) 렌더
    renderCharts(series, fcForUI, plannedForUI, params, availableForUI); // ✅ 합계 기준
    renderTable(forecast, planned, available, perSiteData);              // 표는 per-site 섹션
    renderKpis(fcForUI, plannedForUI, availableForUI);                   // ✅ 합계 기준
    renderConclusion(fcForUI, plannedForUI, availableForUI);             // ✅ 합계 기준

    // 6) 증원표 + 입력표 (항상 전체 데이터 기반으로 받아와 화면 필터만 적용)
    const plan = await fetchHiringPlanOnly(params);
    window._hiringPlan = plan || { months:[], months_fmt:[], rows:[] };

    renderTripEditor(window._hiringPlan);
    renderHiringTable(window._hiringPlan, perSiteData);                  // ✅ per-site 기반 + 합계 타깃 재분배

    syncHiringTables();

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

/* Apply 버튼: 증원표만 재계산 */
async function applyTrips(){
  await updateHiringPlanOnly();
  saveAppliedSnapshot(getTripSnapshot());
  setTripDirtyState(false);
  hideNotice();
}

/* 증원표만 다시 계산 */
async function updateHiringPlanOnly(){
  const params = collectParams();

  if (hpAbortCtrl) hpAbortCtrl.abort();
  hpAbortCtrl = new AbortController();
  const mySeq = ++hpReqSeq;

  try{
    const plan = await fetchHiringPlanOnly(params, { signal: hpAbortCtrl.signal, noCache: true });
    if (mySeq !== hpReqSeq) return;

    window._hiringPlan = plan || { months:[], months_fmt:[], rows:[] };
    renderHiringTable(window._hiringPlan, window._perSiteData);

    syncHiringTables();
    showNotice('해외출장 입력값이 적용되었습니다.');
  } catch(e){
    if (!axios.isCancel?.(e) && e.name !== 'CanceledError') {
      console.error(e);
      showError('증원표 계산에 실패했습니다.');
    }
  }
}

/* 백엔드 호출: /analysis/hiring-plan
   ※ 항상 전체 범위(그룹/사이트 무필터)로 받아온 뒤, 프런트에서 표시만 필터링 */
async function fetchHiringPlanOnly(params, opts = {}) {
  const token = localStorage.getItem('x-access-token');
  const tripMatrix = loadTripMatrix();

  const hpRes = await axios.get('http://13.125.122.202:3001/analysis/hiring-plan', {
    headers: { 'x-access-token': token },
    signal: opts.signal,
    params: cleanParams({
      // 표는 월 기준 고정
      freq: 'month',
      horizon: 24 * 30,
      hoursPerDay: params.hoursPerDay,
      daysPerBucket: params.daysPerBucket,
      rounding: params.rounding,
      planMode: params.planMode,
      alpha: params.alpha,
      bufferPct: params.bufferPct,
      absencePct: params.absencePct,
      includeMove: params.includeMove ? 1 : 0,
      normalizeByBizDays: params.normalizeByBizDays ? 1 : 0,
      tripMatrix: JSON.stringify(tripMatrix),
      // group/site는 보내지 않음(항상 전체 데이터)
      _ts: Date.now()
    })
  });
  return hpRes.data;
}


/* ===== 계획(상향) + 갭 ===== */
function buildPlannedForecast(forecast, params, available){
  const {
    planMode:mode, alpha:α, bufferPct, rounding,
    hoursPerDay, absencePct, freq, daysPerBucket, normalizeByBizDays,
    conservative
  } = params;

  const availRate = Math.max(0.01, 1 - (Number(absencePct||0)/100));

  const pickPlanHours = (y, u, l) => {
    let base;
    if (mode==='upper') base = u;
    else if (mode==='blend') base = (Number(α||0.5)*u + (1-Number(α||0.5))*y);
    else base = y;

    if (conservative?.useLower) base = l;
    else if (conservative?.lowerBlendAlpha > 0) {
      const β = Math.max(0, Math.min(1, conservative.lowerBlendAlpha));
      base = (1-β)*base + β*l;
    }
    return base;
  };

  let prevAdjReq = null;
  const W = Math.max(1, conservative?.smoothWin || 1);
  const capPct = Math.max(0, conservative?.growthCapPct || 0);
  const capAbs = Math.max(0, conservative?.growthCapAbs || 0);

  return forecast.map((r) => {
    const y = Number(r.yhat)||0;
    const u = Number(r.yhat_upper)||y;
    const l = Number(r.yhat_lower)||y;

    const effDays = workingDaysForBucket(r.bucket, freq, daysPerBucket);
    const refDays = Number(daysPerBucket) || effDays;

    const baseHoursRaw = pickPlanHours(y, u, l);
    const planHours    = normalizeByBizDays ? baseHoursRaw * (effDays / refDays) : baseHoursRaw;
    const baseHours    = normalizeByBizDays ? y            * (effDays / refDays) : y;

    const hpw   = (Number(hoursPerDay)||3.5) * effDays;
    const denom = Math.max(0.0001, hpw * availRate);
    const reqBase = baseHours / denom;

    let reqPlan = planHours / denom;

    if (W > 1) reqPlan = (prevAdjReq==null) ? reqPlan : ((prevAdjReq*(W-1) + reqPlan)/W);

    if (prevAdjReq != null) {
      let maxAllowed = Infinity;
      if (capPct > 0) maxAllowed = Math.min(maxAllowed, prevAdjReq*(1+capPct));
      if (capAbs > 0) maxAllowed = Math.min(maxAllowed, prevAdjReq+capAbs);
      if (isFinite(maxAllowed)) reqPlan = Math.min(reqPlan, maxAllowed);
    }
    prevAdjReq = reqPlan;

    const reqPlanWithBuf = reqPlan * (1 + Number(bufferPct||0)/100);
    let reqPlanRounded;
    if (rounding==='ceil') reqPlanRounded = Math.ceil(reqPlanWithBuf);
    else if (rounding==='floor') reqPlanRounded = Math.floor(reqPlanWithBuf);
    else reqPlanRounded = Math.round(reqPlanWithBuf);

    const gap = reqPlanRounded - (Number(available)||0);

    return {
      bucket: r.bucket,
      yhat_plan: planHours * (1 + Number(bufferPct||0)/100),
      required_plan: reqPlanRounded,
      required_base: reqBase,
      gap
    };
  });
}

/* ===== 그래프 ===== */
function renderCharts(series, forecast, planned, params, available){
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

/* ===== 예측표(일부) — 전체/그룹/사이트에서 per-site 섹션 렌더 ===== */
function renderTable(forecast, planned, available, perSiteList){
  const tbody = qs('#tblForecast tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const MAX_ROWS = 30;

  // ✅ per-site 데이터가 있으면: 사이트별 섹션 출력
  if (Array.isArray(perSiteList) && perSiteList.length){
    const COLSPAN = 9; // 기간~갭까지 9열(테이블 헤더 기준)
    for (const site of perSiteList){
      // 섹션 구분 행
      const sep = document.createElement('tr');
      sep.className = 'site-section';
      sep.innerHTML = `<td colspan="${COLSPAN}"><b>${site.key}</b> — 현재 인원 ${numberFmt(site.available,0)}명</td>`;
      tbody.appendChild(sep);

      // 해당 사이트 예측표
      const len = Math.min(MAX_ROWS, site.forecast.length);
      for (let i=0; i<len; i++){
        const f = site.forecast[i];
        const p = site.planned[i];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${f.bucket}</td>
          <td>${numberFmt(f.yhat,1)}</td>
          <td>${numberFmt(p.yhat_plan,1)}</td>
          <td>${numberFmt(f.yhat_lower,1)}</td>
          <td>${numberFmt(f.yhat_upper,1)}</td>
          <td>${numberFmt(p.required_base,2)}</td>
          <td>${numberFmt(p.required_plan,2)}</td>
          <td>${numberFmt(site.available,0)}</td>
          <td>${numberFmt(p.gap,2)}</td>
        `;
        tbody.appendChild(tr);
      }
    }
    return;
  }

  // ✅ per-site 데이터가 없으면 기존 단일 표 렌더
  const len = Math.min(MAX_ROWS, forecast.length);
  for (let i=0; i<len; i++){
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
  const clearIds = [
    'kpiNextWorkers','kpiForecastHours','kpiNextWorkersBase','kpiForecastHoursBase',
    'kpiAvailable','kpiNextGap','kpiTargetWorkers','kpiTargetWorkersBase','kpiTargetGap','kpiTargetLabel'
  ];
  if (!forecast.length || !planned.length){
    clearIds.forEach(id=>setText(id,'-'));
    return;
  }

  const params = collectParams();

  const nextPlan = planned[0].required_plan;
  const nextBase = planned[0].required_base;

  const sumPlanH = planned.reduce((a,b)=>a+b.yhat_plan,0);
  const sumBaseH = forecast.reduce((a,b)=>a+b.yhat,0);

  setText('kpiNextWorkers', numberFmt(nextPlan,2));
  setText('kpiNextWorkersBase', numberFmt(nextBase,2));
  setText('kpiForecastHours', numberFmt(sumPlanH,1));
  setText('kpiForecastHoursBase', numberFmt(sumBaseH,1));

  setText('kpiAvailable', numberFmt(available,0));
  paintDelta('kpiNextGap', nextPlan - available);

  const tIdx = indexAtHorizon(planned, params);
  const t = planned[tIdx] || planned[planned.length-1];

  setText('kpiTargetWorkers', numberFmt(t.required_plan,2));
  setText('kpiTargetWorkersBase', numberFmt(t.required_base,2));
  paintDelta('kpiTargetGap', (t.required_plan - available));
  setText('kpiTargetLabel', t.bucket || '-');
}

function labelOfFreq(freq){ return freq==='day' ? '일' : (freq==='week' ? '주' : '월'); }
function roundingLabel(r){ return r==='ceil' ? '올림' : (r==='floor' ? '내림' : '반올림'); }

/** KPI 값을 바탕으로 줄글 결론 렌더링 */
function renderConclusion(forecast, planned, available){
  const el = document.getElementById('conclusionText');
  if (!el) return;

  if (!planned || !planned.length){
    el.innerHTML = '<p class="dim">표시할 데이터가 부족합니다. 필터를 조정해 보세요.</p>';
    return;
  }

  const params = collectParams();

  const nextBucket = planned[0].bucket;
  const nextReq    = Number(planned[0].required_plan) || 0;
  const nextGap    = nextReq - (Number(available)||0);

  const targetIdx  = indexAtHorizon(planned, params);
  const target     = planned[targetIdx];
  const targetGap  = (Number(target.required_plan)||0) - (Number(available)||0);

  const firstShortIdx = planned.findIndex(p => (Number(p.required_plan)||0) - (Number(available)||0) > 0);
  const firstShortBucket = firstShortIdx >= 0 ? planned[firstShortIdx].bucket : null;

  const parts = [];
  parts.push(`현재 가용 인원은 <b>${numberFmt(available,0)}명</b>입니다.`);
  parts.push(
    `다음 ${labelOfFreq(params.freq)}(<b>${nextBucket}</b>) 기준 필요한 인원은 <b>${numberFmt(nextReq,0)}명</b>으로, ` +
    (nextGap > 0 ? `<b class="neg">부족 ${numberFmt(nextGap,0)}명</b>입니다.` :
     nextGap < 0 ? `<b class="pos">여유 ${numberFmt(-nextGap,0)}명</b>입니다.` :
                   `<b>정원과 동일</b>합니다.`)
  );
  parts.push(
    `목표 시점(<b>${target.bucket}</b>) 예상 필요 인원은 <b>${numberFmt(target.required_plan,0)}명</b>이며, ` +
    (targetGap > 0 ? `<b class="neg">부족 ${numberFmt(targetGap,0)}명</b> 예상입니다.` :
     targetGap < 0 ? `<b class="pos">여유 ${numberFmt(-targetGap,0)}명</b> 예상입니다.` :
                     `부족/여유가 없습니다.`)
  );
  if (nextGap > 0){
    parts.push(`→ <b class="neg">결론: 즉시 최소 ${numberFmt(nextGap,0)}명</b> 충원이 필요합니다. (목표 인원 ${numberFmt(nextReq,0)}명)`);
  } else if (firstShortBucket){
    parts.push(`→ <b>결론:</b> 당장은 충원 없이 운영 가능하나, <b>${firstShortBucket}</b>부터 부족이 시작되므로 해당 시점에 맞춰 채용 계획을 준비하세요.`);
  } else {
    parts.push(`→ <b>결론:</b> 당장 채용은 필요하지 않습니다. 다만 수요 급증 가능성에 대비해 “증원 시점 요약” 표를 주기적으로 확인하세요.`);
  }
  parts.push(
    `<span class="dim">※ 주말·공휴일 제외 근무일수, 결원률 ${Number(params.absencePct||0)}%, 추가 버퍼 ${Number(params.bufferPct||0)}% 반영, ` +
    `인원 산출은 <b>${roundingLabel(params.rounding)}</b> 기준.</span>`
  );

  const dirty = (typeof getTripSnapshot==='function' && typeof loadAppliedSnapshot==='function')
    ? (getTripSnapshot() !== loadAppliedSnapshot())
    : false;
  if (dirty){
    parts.push(`<span class="dim">참고: 해외출장 입력이 아직 <b>미적용</b> 상태입니다. “적용” 버튼을 눌러 증원 시점 요약표에 반영하세요.</span>`);
  }

  el.innerHTML = parts.map(p => `<p>${p}</p>`).join('');
}

function paintDelta(id, v){
  const el = qs('#'+id);
  if (!el) return;
  el.textContent = numberFmt(v,2);
  el.classList.remove('pos','neg');
  if (v > 0) el.classList.add('neg');
  else if (v < 0) el.classList.add('pos');
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

  const trH = document.createElement('tr');
  trH.innerHTML = ['<th class="sticky-col">사이트</th>', ...monthsFmt.map(m => `<th>${m}</th>`)].join('');
  thead.appendChild(trH);

  for (const g of GROUP_ORDER){
    for (const key of GROUPS[g]){
      // 서버 rows에 존재하지 않는 사이트는 입력행을 숨김
      const exists = (plan.rows || []).some(r => r.key === key);
      if (!exists) continue;

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

/* ===== ⑤-2 증원 시점 요약 테이블 (per-site planned 우선 + 합계 타깃 재분배) ===== */
function renderHiringTable(plan, perSiteList){
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

  // 현재 UI 필터(표시용 필터)
  const { group: fltGroup, site: fltSite } = apiFiltersFromUI(collectParams());
  const showSite = (key) => {
    if (!fltGroup && !fltSite) return true; // 전체 보기
    const [g,s] = key.split('-');
    if (fltGroup && g !== fltGroup) return false;
    if (fltSite  && s !== fltSite)  return false;
    return true;
  };
  const showGroup = (g) => {
    if (!fltGroup && !fltSite) return true;
    if (fltGroup && g !== fltGroup) return false;
    if (fltSite) {
      const any = GROUPS[g].some(k => showSite(k));
      return any;
    }
    return true;
  };

  // 헤더
  const trH = document.createElement('tr');
  trH.innerHTML = ['<th class="sticky-col">사이트</th>', ...monthsFmt.map(m => `<th>${m}</th>`)].join('');
  thead.appendChild(trH);

  // 원본 행 맵(폴백용)
  const rowMap = new Map(plan.rows.map(r => [r.key, r]));

  // 1) 사이트별 +증원 계산
  const sitePlusByMonth = {};
  const usePerSite = Array.isArray(perSiteList) && perSiteList.length > 0;

  if (usePerSite){
    // ✅ per-site planned(required_plan) → 월별 누적부족(cum) → 증분(inc) + 출장가산
    for (const item of perSiteList){
      const key = item.key;
      const available = Number(item.available) || 0;

      // 월별 누적부족(해당 월의 '마지막 버킷' 값으로 덮어쓰기)
      const cumByMonth = new Map();
      for (const p of (item.planned || [])){
        const mKey = bucketToMonthKey(p.bucket);
        const cumShort = Math.max(0, Math.round((Number(p.required_plan)||0) - available));
        cumByMonth.set(mKey, cumShort);
      }

      const incArr = new Array(monthsToShow).fill(0);
      let prev = 0;
      for (let i=0;i<monthsToShow;i++){
        const mKey = months[i];
        const cur = cumByMonth.has(mKey) ? cumByMonth.get(mKey) : prev;
        const add = Math.max(0, cur - prev);
        incArr[i] = add;
        prev = cur;
      }

      // 해외출장 입력 추가(+)
      for (let i=0;i<monthsToShow;i++){
        incArr[i] += Math.max(0, Number(tripMatrix?.[months[i]]?.[key]) || 0);
      }

      sitePlusByMonth[key] = incArr;
    }
  } else {
    // 폴백: 서버 cumGap에서 +증가 추출 (+출장)
    for (const g of GROUP_ORDER){
      for (const key of GROUPS[g]){
        const row = rowMap.get(key);
        if (!row) continue;

        const plusArr = [];
        for (let i=0;i<monthsToShow;i++){
          const baseCumPrev = i===0 ? 0 : (row.cumGap[i-1] || 0);
          const baseCum     = row.cumGap[i] || 0;
          const basePlus    = Math.max(0, baseCum - baseCumPrev);
          const tripPlus    = Math.max(0, Number(tripMatrix?.[months[i]]?.[key]) || 0);
          plusArr[i] = basePlus + tripPlus;
        }
        sitePlusByMonth[key] = plusArr;
      }
    }
  }

  // ✅ 공통: “합계 타깃”(= window._recon의 planned 합계)으로 재분배 → ALL이 KPI/차트와 동일
  const targetInc = targetMonthlyIncrementsFromPlanned(months); // window._recon 사용(합계 기준)
  reconcileSitePlusesToTarget(months, sitePlusByMonth, rowMap, targetInc);

  // 2) 사이트 행 렌더 — 🔎 표시만 필터링
  for (const g of GROUP_ORDER){
    if (!showGroup(g)) continue;

    for (const key of GROUPS[g]){
      if (!showSite(key)) continue;
      const plusArr = sitePlusByMonth[key];
      if (!plusArr) continue;

      const tr = document.createElement('tr');
      const cells = [`<td class="sticky-col"><b>${key}</b></td>`];
      let siteCum = 0;
      for (let i=0;i<monthsToShow;i++){
        const p = Math.max(0, plusArr[i] || 0);
        siteCum += p;
        let text = p > 0 ? `+${p}` : '0';
        if (siteCum > 0) text += ` (${siteCum})`;
        const cls = p > 0 ? 'hi-plus' : 'hi-zero';
        cells.push(`<td class="${cls}">${text}</td>`);
      }
      tr.innerHTML = cells.join('');
      tbody.appendChild(tr);
    }

    // 그룹 합계(표시 중인 사이트만 합산)
    const shownKeys = GROUPS[g].filter(k => showSite(k));
    if (shownKeys.length){
      const trSub = document.createElement('tr');
      trSub.className = 'row-subtotal';
      const subCells = [`<td class="sticky-col"><b>${g}</b></td>`];

      let groupCum = 0;
      for (let i=0;i<monthsToShow;i++){
        let sumPlus = 0;
        for (const key of shownKeys) {
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
  }

  // 3) 전체 합계(ALL) — 🔎 현재 화면에 표시 중인 사이트만 합산
  const trAll = document.createElement('tr');
  trAll.className = 'row-total';
  const totalCells = ['<td class="sticky-col"><b>ALL</b></td>'];

  let grandCum = 0;
  for (let i=0;i<monthsToShow;i++){
    let totalPlus = 0;
    for (const g of GROUP_ORDER){
      for (const key of GROUPS[g]) {
        if (!showSite(key)) continue;
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

/* === per-site 예측/헤드카운트 동시 수집 === */
async function fetchPerSiteForecasts(params){
  const token = localStorage.getItem('x-access-token');
  const headers = { 'x-access-token': token };

  const baseCommon = cleanParams({
    freq: params.freq,
    horizon: params.horizonDays,
    hoursPerDay: params.hoursPerDay,
    daysPerBucket: params.daysPerBucket,
    rounding: params.rounding,
    planMode: params.planMode,
    alpha: params.alpha,
    bufferPct: params.bufferPct,
    absencePct: params.absencePct,
    includeMove: params.includeMove ? 1 : 0,
    normalizeByBizDays: params.normalizeByBizDays ? 1 : 0,
    _ts: Date.now()
  });

  const results = [];
  await Promise.all(PAIRS.map(async (key) => {
    const [grp, st] = key.split('-');
    try{
      const [fcRes, hcRes] = await Promise.all([
        axios.get('http://13.125.122.202:3001/analysis/forecast', {
          headers, signal: abortCtrl?.signal,
          params: { ...baseCommon, group: grp, site: st }
        }),
        axios.get('http://13.125.122.202:3001/analysis/headcount', {
          headers, signal: abortCtrl?.signal,
          params: cleanParams({ group: grp, site: st, _ts: Date.now() })
        })
      ]);
      const forecast = fcRes.data?.forecast || [];
      if (!forecast.length) return; // 데이터 없으면 스킵
      const available = Number(hcRes.data?.count) || 0;
      const planned = buildPlannedForecast(forecast, params, available);
      results.push({ key, forecast, planned, available });
    } catch(e){
      console.warn('per-site fetch failed:', key, e?.message || e);
    }
  }));

  // PAIRS 순으로 정렬 보장
  results.sort((a,b) => PAIRS.indexOf(a.key) - PAIRS.indexOf(b.key));
  return results;
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

/* ===== 기본값 적용(최초/초기화 동일) ===== */
function applyInitialDefaults(){
  qs('#freq').value = 'month';
  const hc = document.getElementById('horizonCount'); if (hc) hc.value = 12;

  qs('#groupSelect').value = '';
  qs('#siteSelect').value = '';

  const hpdEl = qs('#hoursPerDay');
  if (hpdEl) hpdEl.value = 3.5;

  userEditedDaysPerBucket = false;
  suggestDaysPerBucket();

  qs('#planMode').value = 'blend';
  qs('#alpha').value = 0.5; setText('alphaVal', '0.50');
  qs('#addBuffer').value = 5;
  qs('#rounding').value = 'ceil';
  qs('#absencePct').value = 10;

  const include = qs('#includeMove'); if (include) include.checked = true;
  const norm = qs('#normalizeByBizDays'); if (norm) norm.checked = true;
  const conf = qs('#showConf'); if (conf) conf.checked = true;

  if (qs('#useLower')) qs('#useLower').checked = false;
  if (qs('#lowerAlpha')) { qs('#lowerAlpha').value = 0; const el=qs('#lowerAlphaVal'); if (el) el.textContent='0.00'; }
  if (qs('#smoothWin')) qs('#smoothWin').value = 1;
  if (qs('#growthCapPct')) qs('#growthCapPct').value = 0;
  if (qs('#growthCapAbs')) qs('#growthCapAbs').value = 0;

  updateHorizonOptions();
  updateHorizonUnit();
}

/* ===== 초기화 버튼 ===== */
function resetForm(){
  applyInitialDefaults();
  runForecast();
}

/* CSV 내보내기 — 사이트 섹션 행은 제외 */
function exportCsv(){
  const trs = qsa('#tblForecast tbody tr').filter(tr => !tr.classList.contains('site-section'));
  const rows = trs.map(tr=> Array.from(tr.querySelectorAll('td')).map(td => td.textContent.replace(/,/g,'')));
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

  on('#btnRun','click', runForecast);
  on('#btnReset','click', resetForm);
  on('#btnCsv','click', exportCsv);
  on('#showConf','change', runForecast);
  on('#includeMove','change', runForecast);
  on('#normalizeByBizDays','change', runForecast);

  on('#btnApplyTrips', 'click', applyTrips);
  on('#btnResetTrips','click', () => {
    localStorage.removeItem(LS_TRIP);
    renderTripEditor(window._hiringPlan);
    setTripDirtyState(true);
    showNotice('입력이 초기화되었습니다. [적용]을 눌러 계산에 반영하세요.');
  });

  on('#monthsToShow','change', ()=>{
    renderTripEditor(window._hiringPlan);
    renderHiringTable(window._hiringPlan, window._perSiteData);
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

  if (qs('#useLower')) on('#useLower','change', runForecast);
  if (qs('#lowerAlpha')) {
    on('#lowerAlpha','input', ()=>{ const v=Number(val('#lowerAlpha')); const el=qs('#lowerAlphaVal'); if (el) el.textContent=v.toFixed(2); });
    on('#lowerAlpha','change', runForecast);
  }
  if (qs('#smoothWin')) on('#smoothWin','change', runForecast);
  if (qs('#growthCapPct')) on('#growthCapPct','change', runForecast);
  if (qs('#growthCapAbs')) on('#growthCapAbs','change', runForecast);

  on('#freq','change', () => { updateHorizonOptions(); updateHorizonUnit(); suggestDaysPerBucket(); runForecast(); });
  on('#horizonCount','change', runForecast);
  on('#daysPerBucket','input', () => { userEditedDaysPerBucket = true; });

  qs('#sec-graphs')?.removeAttribute('open');

  installScrollSync('hiring');

  applyInitialDefaults();

  if (!loadAppliedSnapshot()) saveAppliedSnapshot(getTripSnapshot());
  setTripDirtyState(getTripSnapshot() !== loadAppliedSnapshot());

  runForecast();
});
