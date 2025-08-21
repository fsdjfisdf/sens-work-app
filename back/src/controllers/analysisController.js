const analysisDao = require('../dao/analysisDao');

/** ===== 유틸 ===== */
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

// 주/월 경계
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

// 일 → (day|week|month) 합계 리샘플 + 결측 0
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

/** ===== 비음(≥0) 선형회귀 ===== */
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
  if (b < 0) b = 0; // 🔒 추세 하락 금지

  const a = meanY - b*meanT;

  const resid = y.map((yi, i) => yi - (a + b * t[i]));
  let sigma = stdDev(resid);
  if (!isFinite(sigma) || sigma <= 0) {
    const meanAbs = y.reduce((s,v)=>s+Math.abs(v),0) / Math.max(1,y.length);
    sigma = Math.max(1e-6, meanAbs * 0.15);
  }
  return { a, b, sigma };
}

/** ===== 월 라벨 포맷: 25Y-SEP ===== */
function toYYMonLabel(bucket) {
  // bucket: 'YYYY-MM'
  const mNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const [Y, M] = String(bucket).split('-');
  const yy = Y.slice(2);
  const idx = Math.max(1, Math.min(12, parseInt(M,10))) - 1;
  return `${yy}Y-${mNames[idx]}`;
}

/** ===== 컨트롤러 ===== */

// 과거 시리즈
exports.getSeries = async (req, res) => {
  try {
    const freq   = (req.query.freq || 'month').toLowerCase(); // day|week|month
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const start  = req.query.startDate || null;
    const end    = req.query.endDate || null;
    const includeMove = (req.query.includeMove ?? '1');
    const includeMoveBool = !['0','false','False','FALSE'].includes(String(includeMove));

    const daily = await analysisDao.fetchDailyHours({ group, site, startDate: start, endDate: end, includeMove: includeMoveBool });
    const series = resample(daily, freq).map(r => ({ bucket: r.label, total_hours: r.value }));
    return res.json({ series });
  } catch (err) {
    console.error('getSeries error:', err);
    return res.status(500).json({ series: [], error: 'Failed to build series' });
  }
};

// 단조 우상향 추세 예측(계절 無)
exports.getForecast = async (req, res) => {
  try {
    const freq   = (req.query.freq || 'month').toLowerCase();
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const start  = req.query.startDate || null;
    const end    = req.query.endDate || null;
    const horizonDays = parseInt(req.query.horizon, 10) || 730;
    const includeMove = (req.query.includeMove ?? '1');
    const includeMoveBool = !['0','false','False','FALSE'].includes(String(includeMove));

    const daily  = await analysisDao.fetchDailyHours({ group, site, startDate: start, endDate: end, includeMove: includeMoveBool });
    const series = resample(daily, freq);
    if (!series.length) return res.json({ forecast: [] });

    const { a, b, sigma } = fitNonNegativeLinear(series);
    const steps = stepsFromHorizon(freq, horizonDays);
    let cur = series[series.length - 1].date;

    const out = [];
    const t0 = series.length;
    for (let i=0; i<steps; i++) {
      cur = nextStartDate(cur, freq);
      const t = t0 + i;
      let yhat = a + b * t;
      if (!isFinite(yhat) || yhat < 0) yhat = 0;

      const lower = Math.max(0, yhat - 1.96 * sigma);
      const upper = yhat + 1.96 * sigma;

      out.push({ bucket: bucketLabel(cur, freq), yhat, yhat_lower: lower, yhat_upper: upper });
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

/**
 * 증원 시점 표: 월 기준으로 (그룹-사이트)별 필요 인원 누적 갭을 반환
 * Params:
 *  - group/site (선택), includeMove, horizon
 *  - hoursPerDay, daysPerBucket, rounding(ceil|round|floor)
 *  - planMode(baseline|upper|blend), alpha(0..1), bufferPct
 *  - absencePct (예: 10 => 10%), travelPerBucket (명/월)
 */
exports.getHiringPlan = async (req, res) => {
  try {
    const group  = req.query.group || null;
    const site   = req.query.site || null;
    const includeMove = (req.query.includeMove ?? '1');
    const includeMoveBool = !['0','false','False','FALSE'].includes(String(includeMove));
    const horizonDays = parseInt(req.query.horizon, 10) || (24*30); // 기본 24개월

    const hoursPerDay   = Math.max(0.1, parseFloat(req.query.hoursPerDay) || 8);
    const daysPerBucket = Math.max(1, parseInt(req.query.daysPerBucket,10) || 22);
    const hpw = hoursPerDay * daysPerBucket;

    const rounding = (req.query.rounding || 'ceil').toLowerCase();
    const planMode = (req.query.planMode || 'blend').toLowerCase();
    const alpha    = Math.min(1, Math.max(0, parseFloat(req.query.alpha) || 0.5));
    const bufferPct= Math.max(0, parseFloat(req.query.bufferPct) || 5);

    const absencePct = Math.max(0, parseFloat(req.query.absencePct) || 10); // %
    const travelPerBucket = Math.max(0, parseFloat(req.query.travelPerBucket) || 0);

    // 対象 (group, site) 목록
    let pairs = [];
    if (group && site) {
      pairs = [{ grp: String(group).trim(), site: String(site).trim() }];
    } else {
      pairs = await analysisDao.listPairs({ group: group || null });
    }
    // 월 라벨 배열 준비용 (첫 행에서 채택)
    let monthBuckets = null;

    const rows = [];
    for (const p of pairs) {
      // 1) 과거→월 집계
      const daily = await analysisDao.fetchDailyHours({
        group: p.grp, site: p.site, startDate: null, endDate: null, includeMove: includeMoveBool
      });
      const series = resample(daily, 'month');
      if (!series.length) continue;

      // 2) 추세 적합
      const { a, b, sigma } = fitNonNegativeLinear(series);

      // 3) 미래 월 예측
      const steps = stepsFromHorizon('month', horizonDays);
      let cur = series[series.length - 1].date;
      const fcs = [];
      const t0  = series.length;
      for (let i=0; i<steps; i++){
        cur = nextStartDate(cur, 'month');
        const t = t0 + i;
        let yhat = a + b * t; if (!isFinite(yhat) || yhat < 0) yhat = 0;
        const upper = yhat + 1.96 * sigma;
        const base  = (planMode==='upper') ? upper
                    : (planMode==='blend') ? (alpha*upper + (1-alpha)*yhat)
                    : yhat; // baseline
        const withBuffer = base * (1 + bufferPct/100);

        // 4) 인원 환산 (+ 결원 반영)
        let req = hpw>0 ? (withBuffer / hpw) : 0;
        // 결원율 적용: 필요 인원을 1/(1-α) 배
        const absentRate = Math.min(0.9, absencePct/100); // 과한 폭주 방지
        req = (absentRate < 0.999) ? (req / (1 - absentRate)) : (req * 10); // 99.9% 방지
        // 해외출장 결원 추가(명/월)
        req += travelPerBucket;

        // 반올림
        let reqRounded;
        if (rounding==='ceil') reqRounded = Math.ceil(req);
        else if (rounding==='floor') reqRounded = Math.floor(req);
        else reqRounded = Math.round(req);

        fcs.push({ bucket: bucketLabel(cur, 'month'), reqRounded });
      }

      // 5) 단조(누적 최대) 보정
      const reqMono = [];
      for (let i=0; i<fcs.length; i++){
        const v = fcs[i].reqRounded;
        reqMono[i] = (i===0) ? v : Math.max(reqMono[i-1], v);
      }

      // 6) 현재 인원
      const available = await analysisDao.countHeadcount({ group: p.grp, site: p.site });

      // 7) 누적 갭 (월별)
      const cumGap = reqMono.map(v => Math.max(0, v - available));

      if (!monthBuckets) monthBuckets = fcs.map(r => r.bucket);

      rows.push({
        key: `${p.grp}-${p.site}`,
        available,
        buckets: fcs.map(r => r.bucket),
        required: reqMono,
        cumGap
      });
    }

    // 응답 라벨은 '25Y-SEP' 형식으로도 제공
    const monthsYYMon = (monthBuckets || []).map(toYYMonLabel);

    return res.json({
      months: monthBuckets || [],
      months_fmt: monthsYYMon,
      rows
    });
  } catch (err) {
    console.error('getHiringPlan error:', err);
    return res.status(500).json({ months: [], rows: [], error: 'Failed to build hiring plan' });
  }
};
