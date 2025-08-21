const analysisDao = require('../dao/analysisDao');

/** ==== 날짜/유틸 ==== */
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
function toDateAny(x) {
  if (!x) return new Date(NaN);
  const d = new Date(x);
  d.setHours(0,0,0,0);
  return d;
}
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function diffDays(a,b){ return Math.round((toDateAny(b)-toDateAny(a))/86400000); }
function dayOfYear(d){ const start = new Date(d.getFullYear(),0,0); return Math.floor((d - start) / 86400000); }
function isWeekend(d){ const z = d.getDay(); return z===0 || z===6; }

/** 한국 공휴일(필요시 확장) */
const HOLIDAYS = new Set([
  '2024-01-01','2024-02-09','2024-02-10','2024-02-11','2024-02-12',
  '2024-03-01','2024-05-05','2024-05-06','2024-05-15','2024-06-06',
  '2024-08-15','2024-09-16','2024-09-17','2024-09-18','2024-10-03',
  '2024-10-09','2024-12-25','2024-10-01',
  '2025-01-01','2025-01-27','2025-01-28','2025-01-29','2025-01-30',
  '2025-03-03','2025-05-01','2025-05-05','2025-05-06','2025-06-03','2025-06-06','2025-08-15'
]);
function isHoliday(d){ return HOLIDAYS.has(ymd(d)); }

/** 리샘플/라벨 */
function startOfISOWeek(d) {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // Mon=0..Sun=6
  dt.setHours(0,0,0,0);
  dt.setDate(dt.getDate() - day);
  return dt;
}
function weekNumberISO(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp - yearStart)/86400000) + 1) / 7);
}
function monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function bucketLabel(d, freq) {
  if (freq === 'day')  return ymd(d);
  if (freq === 'week') return `${d.getFullYear()}-W${pad2(weekNumberISO(d))}`;
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
}

/** 일 단위 결측 0 채우기 */
function toDailyWithZeros(rows){
  if (!rows || !rows.length) return [];
  let min = toDateAny(rows[0].date);
  let max = toDateAny(rows[0].date);
  const map = new Map();
  for (const r of rows){
    const d = toDateAny(r.date);
    const k = ymd(d);
    map.set(k, (map.get(k)||0) + Number(r.hours||0));
    if (d < min) min = d;
    if (d > max) max = d;
  }
  const out = [];
  for (let d = new Date(min); d <= max; d.setDate(d.getDate()+1)){
    const k = ymd(d);
    out.push({ date: new Date(d), value: Number(map.get(k)||0) });
  }
  return out;
}

/** == Ridge(λ) 선형회귀: Xβ≈y, β=(XᵀX+λI)⁻¹Xᵀy == */
function ridgeSolve(X, y, lambda=0.1){
  const n = X.length; const p = X[0].length;
  // XtX
  const XtX = Array.from({length:p},()=>Array(p).fill(0));
  const Xty = Array(p).fill(0);
  for (let i=0;i<n;i++){
    const xi = X[i];
    for (let a=0;a<p;a++){
      Xty[a]+= xi[a]*y[i];
      for (let b=0;b<p;b++) XtX[a][b]+= xi[a]*xi[b];
    }
  }
  for (let a=0;a<p;a++) XtX[a][a]+= lambda;

  // Solve (Gaussian elimination)
  // Augment [XtX | Xty]
  const A = XtX.map((row,i)=>[...row, Xty[i]]);
  for (let i=0;i<p;i++){
    // pivot
    let maxR=i;
    for (let r=i+1;r<p;r++) if (Math.abs(A[r][i])>Math.abs(A[maxR][i])) maxR=r;
    if (maxR!==i){ const tmp=A[i]; A[i]=A[maxR]; A[maxR]=tmp; }
    const piv = A[i][i] || 1e-12;
    for (let c=i;c<=p;c++) A[i][c]/=piv;
    for (let r=0;r<p;r++){
      if (r===i) continue;
      const f = A[r][i];
      for (let c=i;c<=p;c++) A[r][c]-=f*A[i][c];
    }
  }
  return A.map(row=>row[p]);
}

/** 피처 생성: t, 요일 더미, 연간 Fourier(k=3), 휴일/주말 더미 */
function makeFeatures(dates){
  const X = [];
  const t0 = dates[0];
  const N = dates.length;
  for (let i=0;i<N;i++){
    const d = dates[i];
    const t = i / Math.max(1,N-1);      // 0~1 정규화 추세
    const t2 = t*t;                      // 곡률(옵션)
    const dow = [1,2,3,4,5,6,0].indexOf(d.getDay()); // Mon=0..Sun=6 형태
    // 요일 더미(6개, 일자유도 방지: intercept과 중복 피함)
    const dowDummy = Array(6).fill(0);   // Mon..Sat
    if (dow<=5) dowDummy[dow]=1;         // Sun은 전부 0
    // 연간 Fourier k=3
    const doy = dayOfYear(d);
    const P = 365.25;
    const fourier = [];
    for (let k=1;k<=3;k++){
      const ang = 2*Math.PI*k*(doy/P);
      fourier.push(Math.sin(ang), Math.cos(ang));
    }
    const hday = isHoliday(d)?1:0;
    const wknd = isWeekend(d)?1:0;

    X.push([1, t, t2, ...dowDummy, ...fourier, hday, wknd]);
  }
  return X;
}

/** yhat & σ */
function fitAndPredict(dailyTrain, dailyFuture){
  const datesTrain = dailyTrain.map(r=>r.date);
  const y = dailyTrain.map(r=>r.value);
  const X = makeFeatures(datesTrain);
  const beta = ridgeSolve(X, y, 0.5); // λ 조정 가능(0.1~2)

  // 잔차로 σ
  const yhatTrain = X.map(row => row.reduce((s,v,j)=>s+v*beta[j],0));
  const resid = y.map((v,i)=> v - yhatTrain[i]);
  const m = resid.reduce((a,b)=>a+b,0)/(Math.max(1,resid.length));
  const s2 = resid.reduce((a,b)=>a+(b-m)*(b-m),0) / Math.max(1, resid.length- X[0].length);
  const sigma = Math.sqrt(Math.max(1e-8, s2 || 0));

  // 미래
  const Xf = makeFeatures(dailyFuture);
  const yhat = Xf.map(row => Math.max(0, row.reduce((s,v,j)=>s+v*beta[j],0)));
  return { yhat, sigma };
}

/** 집계 */
function aggregateToFreq(dates, values, freq){
  const map = new Map(); // key -> sum
  for (let i=0;i<dates.length;i++){
    const d = dates[i];
    const key = bucketLabel(d, freq);
    map.set(key, (map.get(key)||0) + values[i]);
  }
  // 정렬 출력
  return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
}

/** ==== API ==== */

// 과거 시리즈(합산 + 리샘플만)
exports.getSeries = async (req, res) => {
  try {
    const freq        = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group       = req.query.group || null;
    const site        = req.query.site || null;
    const start       = req.query.startDate || null;
    const end         = req.query.endDate || null;
    const includeMove = (req.query.includeMove==='0' || req.query.includeMove==='false') ? 0 : 1;

    const dailyRaw = await analysisDao.fetchDailyHours({ group, site, startDate: start, endDate: end, includeMove });
    const daily    = toDailyWithZeros(dailyRaw);

    // freq 집계
    const labels = [];
    const vals   = [];
    if (daily.length){
      if (freq==='day'){
        for (const r of daily){ labels.push(ymd(r.date)); vals.push(r.value); }
      } else if (freq==='week'){
        const map = new Map();
        for (const r of daily){
          const w = startOfISOWeek(r.date);
          const key = `${w.getFullYear()}-W${pad2(weekNumberISO(r.date))}`;
          map.set(key,(map.get(key)||0)+r.value);
        }
        for (const [k,v] of Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]))){
          labels.push(k); vals.push(v);
        }
      } else {
        const map = new Map();
        for (const r of daily){
          const m = monthStart(r.date);
          const key = `${m.getFullYear()}-${pad2(m.getMonth()+1)}`;
          map.set(key,(map.get(key)||0)+r.value);
        }
        for (const [k,v] of Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]))){
          labels.push(k); vals.push(v);
        }
      }
    }

    const series = labels.map((b,i)=>({ bucket:b, total_hours: vals[i]||0 }));
    return res.json({ series });
  } catch (err) {
    console.error('getSeries error:', err);
    return res.status(500).json({ series: [], error: 'Failed to build series' });
  }
};

// 회귀(추세+주간/연간+휴일) 기반 예측
exports.getForecast = async (req, res) => {
  try {
    const freq        = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group       = req.query.group || null;
    const site        = req.query.site || null;
    const start       = req.query.startDate || null;
    const end         = req.query.endDate || null;
    const horizonDays = parseInt(req.query.horizon, 10) || 730;
    const includeMove = (req.query.includeMove==='0' || req.query.includeMove==='false') ? 0 : 1;
    // engine 파라미터는 현재 reg만 지원 (향후 확장 여지)
    // const engine = (req.query.engine || 'reg').toLowerCase();

    const dailyRaw = await analysisDao.fetchDailyHours({ group, site, startDate: start, endDate: end, includeMove });
    const daily    = toDailyWithZeros(dailyRaw);
    if (!daily.length) return res.json({ forecast: [] });

    // 미래 날짜들
    const lastDate = daily[daily.length-1].date;
    const futureDates = [];
    for (let i=1;i<=horizonDays;i++) futureDates.push(addDays(lastDate, i));

    // 모델 적합 & 예측(일 단위)
    const { yhat, sigma } = fitAndPredict(daily, futureDates);

    // 신뢰구간(간단 근사)
    const lower = yhat.map(v=>Math.max(0, v - 1.96*sigma));
    const upper = yhat.map(v=>v + 1.96*sigma);

    // 요청 주기(freq)로 집계
    const agg = aggregateToFreq(futureDates, yhat,   freq);
    const aggL= aggregateToFreq(futureDates, lower,  freq);
    const aggU= aggregateToFreq(futureDates, upper,  freq);

    // 병합
    const out = agg.map(([k,v])=>{
      const lo = (aggL.find(([kk])=>kk===k)||[null,0])[1];
      const up = (aggU.find(([kk])=>kk===k)||[null,0])[1];
      return { bucket: k, yhat: v, yhat_lower: lo, yhat_upper: up };
    });

    return res.json({ forecast: out });
  } catch (err) {
    console.error('getForecast error:', err);
    return res.status(500).json({ forecast: [], error: 'Failed to forecast' });
  }
};

// 현재 인원 (userDB)
exports.getHeadcount = async (req, res) => {
  try {
    const group = req.query.group || null;
    const site  = req.query.site || null;
    const count = await analysisDao.countHeadcount({ group, site });
    return res.json({ count });
  } catch (err) {
    console.error('getHeadcount error:', err);
    return res.status(500).json({ count: 0, error: 'Failed to fetch headcount' });
  }
};
