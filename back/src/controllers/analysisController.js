const analysisDao = require('../dao/analysisDao');

/** 유틸 */
const pad2 = n => String(n).padStart(2, '0');
const toDate = s => new Date(s + 'T00:00:00'); // local midnight
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

// ISO 주간: 월=0..일=6
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

/** 일 단위 → (day|week|month)로 리샘플 + 빈 구간 0채움 */
function resample(dailyRows, freq) {
  if (!Array.isArray(dailyRows) || !dailyRows.length) return [];

  // 1) 키/라벨/시작일 계산
  const buckets = new Map(); // key -> { date(start), label, value }
  let minDate = toDate(dailyRows[0].date);
  let maxDate = toDate(dailyRows[0].date);

  const pushVal = (key, dateStart, label, v) => {
    const cur = buckets.get(key);
    if (cur) cur.value += v; else buckets.set(key, { date: dateStart, label, value: v });
  };

  for (const r of dailyRows) {
    const d = toDate(r.date);
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

  // 2) 시퀀스 보장 + 결측 0 채움
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

/** 시즌 키: day→요일(0~6), week→주(1~53), month→월(1~12) */
function seasonKey(d, freq) {
  if (freq === 'day') return (d.getDay() + 6) % 7; // Mon=0..Sun=6
  if (freq === 'week') return weekNumberISO(d);    // 1..53
  return d.getMonth()+1;                           // 1..12
}

/** 시즌 계수(평균/전체평균) */
function seasonalFactors(series, freq) {
  if (!series.length) return { map: new Map(), fallback: 1 };

  const sums = new Map();
  const counts = new Map();
  let total = 0, n = 0;

  for (const row of series) {
    const k = seasonKey(row.date, freq);
    sums.set(k, (sums.get(k)||0) + row.value);
    counts.set(k, (counts.get(k)||0) + 1);
    total += row.value; n += 1;
  }
  const overallMean = n ? total / n : 1;
  const fac = new Map();

  // 안전장치: 전부 0이면 1로
  const denom = overallMean > 0 ? overallMean : 1;

  for (const [k, s] of sums.entries()) {
    const c = counts.get(k) || 1;
    const mean = s / c;
    fac.set(k, mean / denom || 1);
  }

  return { map: fac, fallback: 1 };
}

/** 표준편차 */
function stdDev(arr) {
  if (!arr.length) return 0;
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  const v = arr.reduce((a,b)=>a+(b-m)*(b-m),0) / Math.max(1, arr.length-1);
  return Math.sqrt(v);
}

/** 레벨(추세 없는 평균 기반). 최근 W개 가중 */
function baseLevel(series, factors, freq) {
  if (!series.length) return 0;
  const W = (freq === 'day') ? 28 : (freq === 'week' ? 12 : 12);
  const N = Math.min(W, series.length);
  let sum = 0;
  for (let i = series.length - N; i < series.length; i++) {
    const row = series[i];
    const k = seasonKey(row.date, freq);
    const f = factors.map.get(k) ?? factors.fallback;
    const z = f !== 0 ? (row.value / f) : row.value; // 탈계절화
    sum += z;
  }
  return sum / N;
}

/** 예측 스텝 계산 (프런트 horizon은 '일' 기준) */
function stepsFromHorizon(freq, horizonDays) {
  const d = Number(horizonDays) || 365;
  if (freq === 'day')  return Math.max(1, Math.round(d / 1));
  if (freq === 'week') return Math.max(1, Math.round(d / 7));
  return Math.max(1, Math.round(d / 30));
}

/** 다음 버킷 시작일 */
function nextStartDate(cur, freq) {
  if (freq === 'day')  { const d = new Date(cur); d.setDate(d.getDate()+1); return d; }
  if (freq === 'week') { const d = new Date(cur); d.setDate(d.getDate()+7); return d; }
  return new Date(cur.getFullYear(), cur.getMonth()+1, 1);
}

/** 버킷 라벨 */
function bucketLabel(d, freq) {
  if (freq === 'day')  return ymd(d);
  if (freq === 'week') return `${d.getFullYear()}-W${pad2(weekNumberISO(d))}`;
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
}

/** 컨트롤러: 과거 시리즈 */
exports.getSeries = async (req, res) => {
  try {
    const freq   = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const start  = req.query.startDate || null;
    const end    = req.query.endDate || null;

    const daily = await analysisDao.fetchDailyHours({ group, site, startDate: start, endDate: end });
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

/** 컨트롤러: 예측 */
exports.getForecast = async (req, res) => {
  try {
    const freq   = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const start  = req.query.startDate || null;
    const end    = req.query.endDate || null;
    const horizonDays = parseInt(req.query.horizon, 10) || 730;

    const daily = await analysisDao.fetchDailyHours({ group, site, startDate: start, endDate: end });
    const series = resample(daily, freq);
    if (!series.length) return res.json({ forecast: [] });

    // 시즌 계수 & 레벨
    const factors = seasonalFactors(series, freq);
    const level   = baseLevel(series, factors, freq);

    // 단순 잔차 표준편차 (레벨*season 예측 대비)
    const residuals = series.map(row => {
      const k = seasonKey(row.date, freq);
      const s = factors.map.get(k) ?? factors.fallback;
      const pred = level * s;
      return row.value - pred;
    });
    let sigma = stdDev(residuals);
    // 너무 작을 때 안정적 CI 확보
    if (!isFinite(sigma) || sigma <= 0) sigma = (series.reduce((a,b)=>a+b.value,0)/series.length) * 0.15;

    // 예측
    const steps = stepsFromHorizon(freq, horizonDays);
    let cur = series[series.length - 1].date;
    const out = [];
    for (let i=0; i<steps; i++) {
      cur = nextStartDate(cur, freq);
      const k = seasonKey(cur, freq);
      const s = factors.map.get(k) ?? factors.fallback;
      const yhat = Math.max(0, level * s);
      const yhat_lower = Math.max(0, yhat - 1.96 * sigma);
      const yhat_upper = yhat + 1.96 * sigma;
      out.push({
        bucket: bucketLabel(cur, freq),
        yhat,
        yhat_lower,
        yhat_upper
      });
    }
    return res.json({ forecast: out });
  } catch (err) {
    console.error('getForecast error:', err);
    return res.status(500).json({ forecast: [], error: 'Failed to forecast' });
  }
};

/** 컨트롤러: 현재 인원(userDB) */
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
