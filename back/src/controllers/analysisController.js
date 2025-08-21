// src/controllers/analysisController.js
const analysisDao = require('../dao/analysisDao');

/** ===== 공통 유틸 ===== */
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

function toDateAny(x) {
  if (!x) return new Date(NaN);
  if (x instanceof Date) {
    const d = new Date(x);
    d.setHours(0,0,0,0);
    return d;
  }
  if (typeof x === 'string') {
    const d = new Date(`${x}T00:00:00`);
    d.setHours(0,0,0,0);
    return d;
  }
  const d = new Date(x);
  d.setHours(0,0,0,0);
  return d;
}

// 집계 기준 경계
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
function monthStart(d) {
  const dt = new Date(d);
  dt.setHours(0,0,0,0);
  dt.setDate(1);
  return dt;
}

// 일 → (day|week|month) 합계 리샘플 + 결측 0 채움
function resample(dailyRows, freq) {
  if (!Array.isArray(dailyRows) || !dailyRows.length) return [];

  const buckets = new Map(); // key -> { date, label, value }
  let minDate = toDateAny(dailyRows[0].date);
  let maxDate = toDateAny(dailyRows[0].date);

  const pushVal = (key, dateStart, label, v) => {
    const cur = buckets.get(key);
    if (cur) cur.value += v;
    else buckets.set(key, { date: dateStart, label, value: v });
  };

  for (const r of dailyRows) {
    const d = toDateAny(r.date);
    if (d < minDate) minDate = d;
    if (d > maxDate) maxDate = d;

    if (freq === 'day') {
      pushVal(ymd(d), d, ymd(d), r.hours);
    } else if (freq === 'week') {
      const s = startOfISOWeek(d);
      const label = `${s.getFullYear()}-W${pad2(weekNumberISO(d))}`;
      pushVal(`W:${ymd(s)}`, s, label, r.hours);
    } else { // month
      const s = monthStart(d);
      const label = `${s.getFullYear()}-${pad2(s.getMonth()+1)}`;
      pushVal(`M:${s.getFullYear()}-${pad2(s.getMonth()+1)}`, s, label, r.hours);
    }
  }

  const out = [];
  if (freq === 'day') {
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate()+1)) {
      const key = ymd(d);
      out.push(buckets.get(key) || { date: new Date(d), label: key, value: 0 });
    }
  } else if (freq === 'week') {
    let s = startOfISOWeek(minDate);
    const end = startOfISOWeek(maxDate);
    for (; s <= end; s.setDate(s.getDate()+7)) {
      const key = `W:${ymd(s)}`;
      const label = `${s.getFullYear()}-W${pad2(weekNumberISO(s))}`;
      out.push(buckets.get(key) || { date: new Date(s), label, value: 0 });
    }
  } else {
    let s = monthStart(minDate);
    const end = monthStart(maxDate);
    for (; s <= end; s = new Date(s.getFullYear(), s.getMonth()+1, 1)) {
      const key = `M:${s.getFullYear()}-${pad2(s.getMonth()+1)}`;
      const label = `${s.getFullYear()}-${pad2(s.getMonth()+1)}`;
      out.push(buckets.get(key) || { date: new Date(s), label, value: 0 });
    }
  }
  return out;
}

function stepsFromHorizon(freq, horizonDays) {
  const d = Number(horizonDays) || 365;
  if (freq === 'day')  return Math.max(1, Math.round(d / 1));
  if (freq === 'week') return Math.max(1, Math.round(d / 7));
  return Math.max(1, Math.round(d / 30));
}
function nextStartDate(cur, freq) {
  if (freq === 'day')  { const d = new Date(cur); d.setDate(d.getDate()+1); return d; }
  if (freq === 'week') { const d = new Date(cur); d.setDate(d.getDate()+7); return d; }
  return new Date(cur.getFullYear(), cur.getMonth()+1, 1);
}
function bucketLabel(d, freq) {
  if (freq === 'day')  return ymd(d);
  if (freq === 'week') return `${d.getFullYear()}-W${pad2(weekNumberISO(d))}`;
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
}
function stdDev(arr) {
  if (!arr.length) return 0;
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  const v = arr.reduce((a,b)=>a+(b-m)*(b-m),0) / Math.max(1, arr.length-1);
  return Math.sqrt(v);
}

/** ===== 비음 선형회귀(β ≥ 0) =====
 * 시계열을 등간격 index t = 0..N-1 로 두고,
 * OLS로 (a, b)를 추정 후 b<0이면 b=0으로 클리핑.
 */
function fitNonNegativeLinear(series) {
  const N = series.length;
  if (N === 0) return { a: 0, b: 0, sigma: 0 };

  const t = Array.from({length: N}, (_, i)=> i);
  const y = series.map(r => Number(r.value) || 0);

  const meanT = t.reduce((a,b)=>a+b,0) / N;
  const meanY = y.reduce((a,b)=>a+b,0) / N;

  let covTY = 0, varT = 0;
  for (let i=0;i<N;i++){
    covTY += (t[i]-meanT)*(y[i]-meanY);
    varT  += (t[i]-meanT)*(t[i]-meanT);
  }
  let b = (varT>0) ? (covTY/varT) : 0;
  if (!(isFinite(b))) b = 0;
  if (b < 0) b = 0; // 🔒 비음 제약

  const a = meanY - b*meanT;

  // 훈련 잔차 표준편차
  const resid = y.map((yi, i) => yi - (a + b * t[i]));
  let sigma = stdDev(resid);
  if (!isFinite(sigma) || sigma <= 0) {
    const meanAbs = y.reduce((s,v)=>s+Math.abs(v),0) / Math.max(1,y.length);
    sigma = Math.max(1e-6, meanAbs * 0.15);
  }
  return { a, b, sigma };
}

/** ===== 컨트롤러 ===== */

// 과거 시리즈(집계)
exports.getSeries = async (req, res) => {
  try {
    const freq   = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const start  = req.query.startDate || null;
    const end    = req.query.endDate || null;

    // ▶ 이동시간 포함 여부(기본 true)
    const includeMove = (req.query.includeMove ?? '1');
    const includeMoveBool = !['0','false','False','FALSE'].includes(String(includeMove));

    const daily = await analysisDao.fetchDailyHours({
      group, site, startDate: start, endDate: end, includeMove: includeMoveBool
    });
    const series = resample(daily, freq).map(r => ({
      bucket: r.label,
      total_hours: r.value
    }));
    return res.json({ series });
  } catch (err) {
    console.error('getSeries error:', err);
    return res.status(500).json({ series: [], error: 'Failed to build series' });
  }
};

// 미래 예측(추세만, β≥0)
exports.getForecast = async (req, res) => {
  try {
    const freq   = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const start  = req.query.startDate || null;
    const end    = req.query.endDate || null;
    const horizonDays = parseInt(req.query.horizon, 10) || 730;

    const includeMove = (req.query.includeMove ?? '1');
    const includeMoveBool = !['0','false','False','FALSE'].includes(String(includeMove));

    const daily  = await analysisDao.fetchDailyHours({
      group, site, startDate: start, endDate: end, includeMove: includeMoveBool
    });
    const series = resample(daily, freq);
    if (!series.length) return res.json({ forecast: [] });

    // (a, b) 적합 (b >= 0)
    const { a, b, sigma } = fitNonNegativeLinear(series);

    // 예측 스텝 수
    const steps = stepsFromHorizon(freq, horizonDays);
    let cur = series[series.length - 1].date;

    const out = [];
    // 훈련의 마지막 인덱스 기준 앞으로 이어감: t = N, N+1, ...
    const t0 = series.length;
    for (let i=0; i<steps; i++) {
      cur = nextStartDate(cur, freq);
      const t = t0 + i;
      let yhat = a + b * t;
      if (!isFinite(yhat) || yhat < 0) yhat = 0;

      const lower = Math.max(0, yhat - 1.96 * sigma);
      const upper = yhat + 1.96 * sigma;

      out.push({
        bucket: bucketLabel(cur, freq),
        yhat, yhat_lower: lower, yhat_upper: upper
      });
    }
    return res.json({ forecast: out });
  } catch (err) {
    console.error('getForecast error:', err);
    return res.status(500).json({ forecast: [], error: 'Failed to forecast' });
  }
};

// 현재 인원(userDB)
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
