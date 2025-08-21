let chartSeries, chartWorkers;
let abortCtrl = null;
let userEditedDaysPerBucket = false;

document.addEventListener('DOMContentLoaded', () => {
  secureGate();

  document.getElementById('btnRun')?.addEventListener('click', runForecast);
  document.getElementById('btnReset')?.addEventListener('click', resetForm);
  document.getElementById('btnCsv')?.addEventListener('click', exportCsv);

  document.getElementById('freq')?.addEventListener('change', () => {
    updateHorizonOptions();
    suggestDaysPerBucket();
    runForecast();
  });
  document.getElementById('daysPerBucket')?.addEventListener('input', () => {
    userEditedDaysPerBucket = true;
  });
  document.getElementById('showConf')?.addEventListener('change', runForecast);
  document.getElementById('includeMove')?.addEventListener('change', runForecast);

  ['planMode','alpha','addBuffer','rounding'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', ()=>{
      if (id==='alpha'){
        const v = Number(document.getElementById('alpha').value);
        document.getElementById('alphaVal').textContent = v.toFixed(2);
      }
      runForecast();
    });
    document.getElementById(id)?.addEventListener('input', ()=>{
      if (id==='alpha'){
        const v = Number(document.getElementById('alpha').value);
        document.getElementById('alphaVal').textContent = v.toFixed(2);
      }
    });
  });

  updateHorizonOptions();
  suggestDaysPerBucket();
  document.getElementById('alphaVal').textContent = Number(document.getElementById('alpha').value).toFixed(2);
  runForecast();
});

function secureGate(){
  const token = localStorage.getItem("x-access-token");
  const role  = localStorage.getItem("user-role");
  const unsigned = document.querySelector(".unsigned");
  const signed   = document.querySelector(".signed");
  if (!token) { unsigned?.classList.remove("hidden"); signed?.classList.add("hidden"); }
  else { unsigned?.classList.add("hidden"); signed?.classList.remove("hidden"); }
  if (!token || role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => { el.style.display='none'; });
  }
  document.querySelector('#sign-out')?.addEventListener('click', ()=>{
    localStorage.removeItem('x-access-token'); localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.'); location.replace('./signin.html');
  });
}

function setLoading(on){
  const btn = document.getElementById('btnRun');
  const ov  = document.getElementById('loading');
  if (btn) btn.disabled = !!on;
  ov?.classList.toggle('hidden', !on);
}

function showNotice(msg){ const el = document.getElementById('noti'); if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }
function hideNotice(){ document.getElementById('noti')?.classList.add('hidden'); }
function showError(msg){ const el = document.getElementById('err'); if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }
function hideError(){ document.getElementById('err')?.classList.add('hidden'); }

function numberFmt(v, d=1){
  if (!isFinite(v)) return '-';
  return new Intl.NumberFormat('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}

function collectParams(){
  const freq   = document.getElementById('freq').value;          // day|week|month
  const horizon= parseInt(document.getElementById('horizon').value, 10); // days
  const group  = document.getElementById('groupSelect').value.trim();
  const site   = document.getElementById('siteSelect').value.trim();
  const hpd    = parseFloat(document.getElementById('hoursPerDay').value) || 8;
  const dpb    = parseInt(document.getElementById('daysPerBucket').value, 10) || 22;
  const includeMove = document.getElementById('includeMove')?.checked ? 1 : 0;

  return { freq, horizon, group: group || null, site: site || null, hoursPerDay: hpd, daysPerBucket: dpb, includeMove, engine: 'reg' };
}

async function runForecast(){
  setLoading(true); hideError(); hideNotice();
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();

  const params = collectParams();
  const token = localStorage.getItem('x-access-token');

  try {
    const seriesRes = await axios.get('http://3.37.73.151:3001/analysis/series', {
      headers: {'x-access-token': token},
      params, signal: abortCtrl.signal
    });
    const series = seriesRes.data?.series || [];

    const fcRes = await axios.get('http://3.37.73.151:3001/analysis/forecast', {
      headers: {'x-access-token': token},
      params, signal: abortCtrl.signal
    });
    const forecast = fcRes.data?.forecast || [];

    let available = 0;
    try {
      const hcRes = await axios.get('http://3.37.73.151:3001/analysis/headcount', {
        headers: {'x-access-token': token},
        params: { group: params.group, site: params.site },
        signal: abortCtrl.signal
      });
      available = Number(hcRes.data?.count) || 0;
    } catch (e) { available = 0; }

    if (!series.length){
      showNotice('표시할 과거 데이터가 없습니다. 필터를 바꿔보세요.');
    }

    const planned = buildPlannedForecast(forecast, params, available);

    renderCharts(series, forecast, planned, params, available);
    renderTable(forecast, planned, available);
    renderKpis(forecast, planned, available);

    const ts = new Date().toLocaleString('ko-KR');
    document.getElementById('lastUpdated').textContent = ts;
  } catch (err) {
    if (axios.isCancel?.(err) || err.name === 'CanceledError') {
      // pass
    } else {
      console.error(err);
      showError('예측 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  } finally {
    setLoading(false);
  }
}

// 계획(상향) + 갭
function buildPlannedForecast(forecast, params, available){
  const mode = document.getElementById('planMode').value; // baseline|upper|blend
  const alpha = Number(document.getElementById('alpha').value || 0.5);
  const bufferPct = Number(document.getElementById('addBuffer').value || 0);
  const rounding = document.getElementById('rounding').value; // ceil|round|floor

  const hpw = (Number(params.hoursPerDay)||8) * (Number(params.daysPerBucket)||22);

  return forecast.map(r => {
    const y = Number(r.yhat)||0;
    const u = Number(r.yhat_upper)||y;
    const base = (mode === 'upper') ? u
               : (mode === 'blend') ? (alpha*u + (1-alpha)*y)
               : y;
    const withBuffer = base * (1 + bufferPct/100);
    const reqBase = hpw>0 ? (y / hpw) : 0;
    const reqPlanRaw = hpw>0 ? (withBuffer / hpw) : 0;

    let reqPlan;
    if (rounding==='ceil') reqPlan = Math.ceil(reqPlanRaw);
    else if (rounding==='floor') reqPlan = Math.floor(reqPlanRaw);
    else reqPlan = Math.round(reqPlanRaw);

    const gap = reqPlan - (Number(available)||0);

    return {
      bucket: r.bucket,
      yhat_plan: withBuffer,
      required_plan: reqPlan,
      required_base: reqBase,
      gap
    };
  });
}

function renderCharts(series, forecast, planned, params, available){
  const ctx1 = document.getElementById('chartSeries').getContext('2d');
  const ctx2 = document.getElementById('chartWorkers').getContext('2d');

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
  const showConf = document.getElementById('showConf')?.checked ?? true;

  const ds = [
    {
      label: '실측(총 작업시간, h)',
      data: [...dataHist, ...new Array(dataFc.length).fill(null)],
      borderWidth: 2,
      tension: 0.2
    },
    {
      label: '예측(총 작업시간, h)',
      data: [...new Array(dataHist.length).fill(null), ...dataFc],
      borderDash: [6,4],
      borderWidth: 2,
      tension: 0.2
    },
    {
      label: '계획(상향, h)',
      data: [...new Array(dataHist.length).fill(null), ...plannedHours],
      borderDash: [2,2],
      borderWidth: 2,
      tension: 0.2
    }
  ];

  if (showConf && dataFc.length){
    ds.push({
      label: '하한',
      data: [...new Array(dataHist.length).fill(null), ...lowerFc],
      borderWidth: 0,
      pointRadius: 0
    });
    ds.push({
      label: '신뢰구간',
      data: [...new Array(dataHist.length).fill(null), ...upperFc],
      borderWidth: 0,
      pointRadius: 0,
      backgroundColor: 'rgba(99,102,241,0.15)',
      fill: '-1'
    });
  }

  if (chartSeries) chartSeries.destroy();
  chartSeries = new Chart(ctx1, {
    type: 'line',
    data: { labels, datasets: ds },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${numberFmt(ctx.parsed.y,1)} h` }
        }
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: '시간(h)' } } },
      elements: { point: { radius: 0 } }
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
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: { label: (ctx)=> `${ctx.dataset.label}: ${numberFmt(ctx.parsed.y,2)} 명` }
        }
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: '인원(명)' } } },
      elements: { point: { radius: 0 } }
    }
  });
}

function renderTable(forecast, planned, available){
  const tbody = document.querySelector('#tblForecast tbody');
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

function renderKpis(forecast, planned, available){
  if (!forecast.length || !planned.length){
    ['kpiNextWorkers','kpiAvgWorkers','kpiForecastHours','kpiNextWorkersBase','kpiAvgWorkersBase','kpiForecastHoursBase','kpiAvailable','kpiNextGap','kpiAvgGap'].forEach(id=>setText(id,'-'));
    return;
  }
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

function paintDelta(id, v){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = numberFmt(v,2);
  el.classList.remove('pos','neg');
  if (v > 0) el.classList.add('neg');
  else if (v < 0) el.classList.add('pos');
}

function setText(id, v){ const el = document.getElementById(id); if (el) el.textContent = v; }

function resetForm(){
  document.getElementById('freq').value = 'month';
  updateHorizonOptions();
  document.getElementById('groupSelect').value = '';
  document.getElementById('siteSelect').value = '';
  document.getElementById('hoursPerDay').value = 8;

  userEditedDaysPerBucket = false;
  suggestDaysPerBucket();

  document.getElementById('planMode').value = 'blend';
  document.getElementById('alpha').value = 0.5;
  document.getElementById('alphaVal').textContent = '0.50';
  document.getElementById('addBuffer').value = 5;
  document.getElementById('rounding').value = 'ceil';
  document.getElementById('includeMove').checked = true;

  document.getElementById('showConf').checked = true;
  runForecast();
}

function updateHorizonOptions(){
  const freq = document.getElementById('freq').value;
  const sel  = document.getElementById('horizon');
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
  sel.value = sel.options[1]?.value ?? sel.options[0]?.value;
}

function suggestDaysPerBucket(){
  if (userEditedDaysPerBucket) return;
  const freq = document.getElementById('freq').value;
  const el   = document.getElementById('daysPerBucket');
  const hint = document.querySelector('#daysHint');
  if (freq === 'day'){ el.value = 1;  if (hint) hint.textContent = '일 기준: 1'; }
  else if (freq === 'week'){ el.value = 5; if (hint) hint.textContent = '주 기준 예: 5'; }
  else { el.value = 22; if (hint) hint.textContent = '월 기준 예: 22'; }
}

function exportCsv(){
  const rows = Array.from(document.querySelectorAll('#tblForecast tbody tr')).map(tr=>{
    return Array.from(tr.querySelectorAll('td')).map(td => td.textContent.replace(/,/g,''));
  });
  if (!rows.length){
    showNotice('내보낼 예측 행이 없습니다.');
    return;
  }
  const header = ['기간','예측 작업시간(h)','계획 작업시간(h)','하한','상한','필요 인원(기본)','필요 인원(계획)','현재 인원','갭(계획−현재)'];
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'forecast_gap.csv'; a.click();
  URL.revokeObjectURL(url);
}
