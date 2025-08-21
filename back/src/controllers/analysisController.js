const analysisDao = require('./analysisDao');

/**
 * freq: day|week|month
 * group, site: optional
 */
exports.getSeries = async (req, res) => {
  try {
    const { freq = 'month', group = null, site = null } = req.query;
    const series = await analysisDao.getAggregatedSeries({ freq, group, site });
    res.json({ series });
  } catch (e) {
    console.error('getSeries error', e);
    res.status(500).json({ error: 'failed_to_fetch_series' });
  }
};

/**
 * 예측 로직 (JS STL-like)
 * - trend: moving average (윈도우: day=28, week=12, month=12)
 * - seasonality: weekday(7) / weekofyear(52) / month(12) 평균
 * - residual std → 95% CI (±1.96σ)
 * 반환: [{bucket, yhat, yhat_lower, yhat_upper, required_workers}]
 */
exports.getForecast = async (req, res) => {
  try {
    const {
      freq = 'month', horizon = 730,
      group = null, site = null,
      hoursPerDay = 8, daysPerBucket = 22
    } = req.query;

    const h = parseInt(horizon, 10) || 730;
    const hBuckets = horizonToBuckets(freq, h);

    const series = await analysisDao.getAggregatedSeries({ freq, group, site });
    if (!series.length) return res.json({ forecast: [] });

    // 1) 준비: x: index, y: total_hours
    const y = series.map(r => Number(r.total_hours) || 0);

    // 2) trend: 이동평균
    const w = (freq === 'day') ? 28 : (freq === 'week' ? 12 : 12);
    const trend = movingAverage(y, w);

    // 3) seasonal index
    const seasonal = (freq === 'day')
      ? seasonalByKey(series, y, trend, keyOfWeekday)     // 7
      : (freq === 'week')
        ? seasonalByKey(series, y, trend, keyOfWeekOfYear)// 52
        : seasonalByKey(series, y, trend, keyOfMonth);    // 12

    // 4) residuals & sigma
    const resid = y.map((v, i) => v - (trend[i] + seasonal[i]));
    const sigma = std(resid.filter(isFinite));

    // 5) trend extrapolation (선형)
    const slope = lastSlope(trend);
    const lastTrend = trend[trend.length - 1];

    // 6) 생성: 미래 버킷 라벨
    const lastBucket = series[series.length - 1].bucket;
    const buckets = nextBuckets(lastBucket, freq, hBuckets);

    // 7) 미래 예측 yhat = trend_extrap + seasonal_for_bucket
    const forecast = [];
    for (let i = 0; i < buckets.length; i++) {
      const t = lastTrend + slope * (i + 1);
      const s = seasonalForBucket(buckets[i], freq, seasonal, series);
      const yhat = Math.max(0, t + s);
      const yhat_lower = Math.max(0, yhat - 1.96 * sigma);
      const yhat_upper = yhat + 1.96 * sigma;

      // 인원 환산
      const hoursPerWorkerPerBucket = (Number(hoursPerDay) || 8) * (Number(daysPerBucket) || 22);
      const required_workers = hoursPerWorkerPerBucket > 0 ? (yhat / hoursPerWorkerPerBucket) : 0;

      forecast.push({
        bucket: buckets[i],
        yhat, yhat_lower, yhat_upper,
        required_workers
      });
    }

    res.json({ forecast });
  } catch (e) {
    console.error('getForecast error', e);
    res.status(500).json({ error: 'failed_to_forecast' });
  }
};

// ===== Helpers =====
function horizonToBuckets(freq, horizonDays){
  if (freq === 'day') return horizonDays;
  if (freq === 'week') return Math.ceil(horizonDays / 7);
  if (freq === 'month') return Math.ceil(horizonDays / 30);
  return Math.ceil(horizonDays / 30);
}

function movingAverage(arr, win){
  const out = [];
  for (let i=0;i<arr.length;i++){
    const s = Math.max(0, i - win + 1), e = i+1;
    const slice = arr.slice(s, e);
    const m = slice.reduce((a,b)=>a+b,0) / slice.length;
    out.push(m);
  }
  return out;
}

function std(arr){
  if (!arr.length) return 0;
  const m = arr.reduce((a,b)=>a+b,0)/arr.length;
  const v = arr.reduce((a,b)=>a + (b-m)*(b-m), 0)/arr.length;
  return Math.sqrt(v);
}

function lastSlope(arr){
  // 단순: 마지막 10포인트로 기울기
  const n = Math.min(10, arr.length);
  if (n < 2) return 0;
  const xs = Array.from({length: n}, (_,i)=>i+1);
  const ys = arr.slice(-n);
  return linearSlope(xs, ys);
}
function linearSlope(xs, ys){
  const n = xs.length;
  const sx = xs.reduce((a,b)=>a+b,0);
  const sy = ys.reduce((a,b)=>a+b,0);
  const sxx= xs.reduce((a,b)=>a+b*b,0);
  const sxy= xs.reduce((a, x, i)=>a + x*ys[i],0);
  const denom = n*sxx - sx*sx;
  if (denom === 0) return 0;
  return (n*sxy - sx*sy)/denom;
}

// seasonal keys
function keyOfWeekday(bucket){ // YYYY-MM-DD or ISO week label
  const d = new Date(bucket);
  return d.getDay(); // 0..6
}
function keyOfWeekOfYear(bucket){
  const d = new Date(bucket + '-1'); // bucket: 2025-W33 → 안전하게 월요일 보정은 upstream에서 라벨 만들 때 처리
  const isoWeek = bucket; // 이미 서버에서 "YYYY-Www" 형식 라벨 반환 가정
  return isoWeek; // 52개 카테고리처럼 취급
}
function keyOfMonth(bucket){ // "YYYY-MM"
  return parseInt(bucket.split('-')[1], 10); // 1..12
}

function seasonalByKey(series, y, trend, keyFn){
  // 계절성 = 평균( y - trend ) by key
  const acc = new Map();
  for (let i=0;i<series.length;i++){
    const k = keyFn(series[i].bucket);
    const v = y[i] - trend[i];
    if (!acc.has(k)) acc.set(k, {sum:0, cnt:0});
    const o = acc.get(k); o.sum += v; o.cnt += 1;
  }
  const meanByKey = new Map();
  for (const [k, {sum, cnt}] of acc.entries()){
    meanByKey.set(k, cnt ? sum/cnt : 0);
  }
  // 펼치기
  return series.map(r => meanByKey.get(keyFn(r.bucket)) || 0);
}

function seasonalForBucket(bucket, freq, seasonalArr, histSeries){
  // 미래 버킷에 대한 계절성 값: 과거 평균값을 key로 매핑
  if (freq === 'day'){
    return averageByKey(histSeries, seasonalArr, keyOfWeekday, bucket);
  } else if (freq === 'week'){
    return averageByKey(histSeries, seasonalArr, keyOfWeekOfYear, bucket);
  } else {
    return averageByKey(histSeries, seasonalArr, keyOfMonth, bucket);
  }
}
function averageByKey(histSeries, seasonalArr, keyFn, futureBucket){
  const key = keyFn(futureBucket);
  const vals = [];
  for (let i=0;i<histSeries.length;i++){
    if (keyFn(histSeries[i].bucket) === key) vals.push(seasonalArr[i]);
  }
  if (!vals.length) return 0;
  return vals.reduce((a,b)=>a+b,0)/vals.length;
}

// 미래 라벨 생성
function nextBuckets(lastBucket, freq, n){
  const out = [];
  if (freq === 'day'){
    const d = new Date(lastBucket);
    for (let i=1;i<=n;i++){
      const t = new Date(d); t.setDate(t.getDate()+i);
      out.push(t.toISOString().slice(0,10));
    }
  } else if (freq === 'week'){
    // lastBucket 예: "2025-W33"
    const [y, w] = lastBucket.split('-W').map(x=>parseInt(x,10));
    let year=y, week=w;
    for (let i=0;i<n;i++){
      week += 1;
      if (week > 53){ week=1; year += 1; }
      out.push(`${year}-W${String(week).padStart(2,'0')}`);
    }
  } else {
    // month: "YYYY-MM"
    const [y, m] = lastBucket.split('-').map(x=>parseInt(x,10));
    let year=y, month=m;
    for (let i=0;i<n;i++){
      month += 1;
      if (month > 12){ month=1; year += 1; }
      out.push(`${year}-${String(month).padStart(2,'0')}`);
    }
  }
  return out;
}
