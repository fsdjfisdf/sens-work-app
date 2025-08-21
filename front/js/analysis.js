let chartSeries, chartWorkers;

document.addEventListener('DOMContentLoaded', () => {
  secureGate();
  document.getElementById('btnRun')?.addEventListener('click', runForecast);
  document.getElementById('btnReset')?.addEventListener('click', resetForm);
  runForecast(); // 첫 로딩 실행
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

async function runForecast(){
  const params = collectParams();
  const token = localStorage.getItem('x-access-token');

  // 1) 과거 시계열 조회
  const seriesRes = await axios.get('http://3.37.73.151:3001/analysis/series', {
    headers: {'x-access-token': token},
    params
  }).catch(e => ({ data: { series: [] }}));
  const series = seriesRes.data.series || [];

  // 2) 예측
  const fcRes = await axios.get('http://3.37.73.151:3001/analysis/forecast', {
    headers: {'x-access-token': token},
    params
  }).catch(e => ({ data: { forecast: [] }}));
  const forecast = fcRes.data.forecast || [];

  // 3) 그래프/표/KPI 렌더
  renderCharts(series, forecast);
  renderTable(forecast);
  renderKpis(forecast);
}

function collectParams(){
  const freq   = document.getElementById('freq').value;          // day|week|month
  const horizon= parseInt(document.getElementById('horizon').value, 10); // days 기준
  const group  = document.getElementById('groupSelect').value.trim();
  const site   = document.getElementById('siteSelect').value.trim();
  const hpd    = parseFloat(document.getElementById('hoursPerDay').value) || 8;
  const dpb    = parseInt(document.getElementById('daysPerBucket').value, 10) || 22;

  return { freq, horizon, group: group || null, site: site || null, hoursPerDay: hpd, daysPerBucket: dpb };
}

function renderCharts(series, forecast){
  const ctx1 = document.getElementById('chartSeries').getContext('2d');
  const ctx2 = document.getElementById('chartWorkers').getContext('2d');

  const labelsHist = series.map(r=>r.bucket);
  const dataHist   = series.map(r=>r.total_hours);

  const labelsFc = forecast.map(r=>r.bucket);
  const dataFc   = forecast.map(r=>r.yhat);
  const lowerFc  = forecast.map(r=>r.yhat_lower);
  const upperFc  = forecast.map(r=>r.yhat_upper);

  // 합친 축 라벨
  const labels = [...labelsHist, ...labelsFc];

  // 신뢰구간 영역 데이터
  const confBand = {
    labels: labelsFc,
    upper: upperFc,
    lower: lowerFc
  };

  if (chartSeries) chartSeries.destroy();
  chartSeries = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '실측(총 작업시간, h)',
          data: [...dataHist, ...new Array(dataFc.length).fill(null)],
          borderWidth: 2,
        },
        {
          label: '예측(총 작업시간, h)',
          data: [...new Array(dataHist.length).fill(null), ...dataFc],
          borderDash: [6,4],
          borderWidth: 2,
        },
        // 신뢰구간 밴드(투명 fill)
        {
          label: '신뢰구간 상한',
          data: [...new Array(dataHist.length).fill(null), ...confBand.upper],
          borderWidth: 0,
          fill: '+1'
        },
        {
          label: '신뢰구간 하한',
          data: [...new Array(dataHist.length).fill(null), ...confBand.lower],
          borderWidth: 0,
          fill: '-1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '시간(h)' } }
      },
      elements: { point: { radius: 0 } }
    }
  });

  // 필요 인원 그래프
  const workers = forecast.map(r => r.required_workers);
  if (chartWorkers) chartWorkers.destroy();
  chartWorkers = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: labelsFc,
      datasets: [
        { label: '필요 인원(예측)', data: workers, borderWidth: 2 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true }},
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '인원(명)' } }
      },
      elements: { point: { radius: 0 } }
    }
  });
}

function renderTable(forecast){
  const tbody = document.querySelector('#tblForecast tbody');
  tbody.innerHTML = '';
  forecast.slice(0, 30).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.bucket}</td>
      <td>${fmt(row.yhat)}</td>
      <td>${fmt(row.yhat_lower)}</td>
      <td>${fmt(row.yhat_upper)}</td>
      <td>${fmt(row.required_workers, 2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderKpis(forecast){
  if (!forecast.length){
    setText('kpiNextWorkers','-'); setText('kpiAvgWorkers','-'); setText('kpiForecastHours','-'); return;
  }
  const next = forecast[0].required_workers;
  const avg  = forecast.reduce((a,b)=>a+b.required_workers,0)/forecast.length;
  const sumH = forecast.reduce((a,b)=>a+b.yhat,0);

  setText('kpiNextWorkers', fmt(next,2));
  setText('kpiAvgWorkers', fmt(avg,2));
  setText('kpiForecastHours', fmt(sumH));
}

function setText(id, v){ document.getElementById(id).textContent = v; }
function fmt(v, d=1){ return (Math.round(v*10**d)/10**d).toFixed(d); }

function resetForm(){
  document.getElementById('freq').value = 'month';
  document.getElementById('horizon').value = '730';
  document.getElementById('groupSelect').value = '';
  document.getElementById('siteSelect').value = '';
  document.getElementById('hoursPerDay').value = 8;
  document.getElementById('daysPerBucket').value = 22;
  runForecast();
}
