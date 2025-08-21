const analysisDao = require('../dao/analysisDao');

// =============================
// 시계열 원본 조회
// =============================
exports.getSeries = async (req, res) => {
  try {
    const { freq = 'month', group = null, site = null } = req.query;
    const series = await analysisDao.getAggregatedSeries({ freq, group, site });
    return res.status(200).json({ series });
  } catch (err) {
    console.error('getSeries error', err.message);
    return res.status(500).json({ error: 'failed_to_fetch_series' });
  }
};

// =============================
// 장기 예측 (간단 STL-like)
// =============================
exports.getForecast = async (req, res) => {
  try {
    const {
      freq = 'month',
      horizon = 730,            // days 기반 입력(1~2년)
      group = null,
      site = null,
      hoursPerDay = 8,          // 1인 하루 근무시간
      daysPerBucket = 22        // 집계단위별 근무가능일수(월=22/주=5/일=1 등)
    } = req.query;

    const H = parseInt(horizon, 10) || 730;
    const bucketsToForecast = horizonToBuckets(freq, H);

    // 1) 과거 시계열
    const series = await analysisDao.getAggregatedSeries({ freq, group, site });
    if (!series.length) return res.status(200).json({ forecast: [] });

    const y = series.map(r => Number(r.total_hours) || 0);

    // 2) 추세(이동평균)
    const win = (freq === 'day') ? 28 : (freq === 'week' ? 12 : 12);
    const trend = movingAverage(y, win);

    // 3) 계절성(평균 잔차 by key)
    const seasonal = (freq === 'day')
      ? seasonalByKey(series, y, trend, keyOfWeekday)      // 7
      : (freq === 'week')
        ? seasonalByKey(series, y, trend, keyOfWeekOfYear) // 52
        : seasonalByKey(series, y, trend, keyOfMonth);     // 12

    // 4) 잔차 표준편차 → 신뢰구간
    const resid = y.map((v, i) => v - (trend[i] + seasonal[i]));
    const sigma = std(resid.filter(Number.isFinite));

    // 5) 추세 외삽(마지막 10포인트 선형 기울기)
    const slope = lastSlope(trend);
    const lastTrend = trend[trend.length - 1];

    // 6) 미래 라벨 생성
    const lastBucket = series[series.length - 1].bucket;
    const buckets = nextBuckets(lastBucket, freq, bucketsToForecast);

    // 7) 미래 예측 생성
    const hpw = (Number(hoursPerDay) || 8) * (Number(daysPerBucket) || defaultDaysPerBucket(freq));
    const forecast = [];
    for (let i = 0; i < buckets.length; i++) {
      const t = lastTrend + slope * (i + 1);
      const s = seasonalForBucket(buckets[i], freq, seasonal, series);
      const yhat = Math.max(0, t + s);
      const yhat_lower = Math.max(0, yhat - 1.96 * sigma);
      const yhat_upper = yhat + 1.96 * sigma;

      const required_workers = hpw > 0 ? (yhat / hpw) : 0;

      forecast.push({
        bucket: buckets[i],
        yhat,
        yhat_lower,
        yhat_upper,
        required_workers
      });
    }

    return res.status(200).json({ forecast });
  } catch (err) {
    console.error('getForecast error', err.message);
    return res.status(500).json({ error: 'failed_to_forecast' });
  }
};

// =============================
// Helpers (컨트롤러에 캡슐화)
// =============================
function horizonToBuckets(freq, horizonDays){
  if (freq === 'day') return horizonDays;
  if (freq === 'week') return Math.ceil(horizonDays / 7);
  // month
  return Math.ceil(horizonDays / 30);
}

function defaultDaysPerBucket(freq){
  if (freq === 'day') return 1;
  if (freq === 'week') return 5;
  return 22; // month
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
  const n = Math.min(10, arr.length);
  if (n < 2) return 0;
  const xs = Array.from({length:n}, (_,i)=>i+1);
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
  if (!denom) return 0;
  return (n*sxy - sx*sy)/denom;
}

// 계절성 키
function keyOfWeekday(bucket){ // YYYY-MM-DD
  const d = new Date(bucket);
  return d.getDay(); // 0..6
}
function keyOfWeekOfYear(bucket){ // "YYYY-Www"
  return bucket; // 52개 카테고리처럼 취급
}
function keyOfMonth(bucket){ // "YYYY-MM"
  return parseInt(bucket.split('-')[1], 10); // 1..12
}

function seasonalByKey(series, y, trend, keyFn){
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
  return series.map(r => meanByKey.get(keyFn(r.bucket)) ?? 0);
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

function seasonalForBucket(bucket, freq, seasonalArr, histSeries){
  if (freq === 'day')   return averageByKey(histSeries, seasonalArr, keyOfWeekday, bucket);
  if (freq === 'week')  return averageByKey(histSeries, seasonalArr, keyOfWeekOfYear, bucket);
  return averageByKey(histSeries, seasonalArr, keyOfMonth, bucket);
}

function nextBuckets(lastBucket, freq, n){
  const out = [];
  if (freq === 'day'){
    const d = new Date(lastBucket);
    for (let i=1;i<=n;i++){
      const t = new Date(d); t.setDate(t.getDate()+i);
      out.push(t.toISOString().slice(0,10));
    }
  } else if (freq === 'week'){
    // lastBucket: "YYYY-Www"
    let [y, w] = lastBucket.split('-W');
    let year = parseInt(y,10), week = parseInt(w,10);
    for (let i=0;i<n;i++){
      week += 1;
      if (week > 53){ week = 1; year += 1; }
      out.push(`${year}-W${String(week).padStart(2,'0')}`);
    }
  } else {
    // month: "YYYY-MM"
    let [y, m] = lastBucket.split('-').map(x=>parseInt(x,10));
    let year = y, month = m;
    for (let i=0;i<n;i++){
      month += 1;
      if (month > 12){ month = 1; year += 1; }
      out.push(`${year}-${String(month).padStart(2,'0')}`);
    }
  }
  return out;
}
