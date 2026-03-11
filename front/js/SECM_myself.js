/* SECM_myself.js — personal dashboard */
'use strict';
const API = 'http://3.37.73.151:3001';
const token = localStorage.getItem('x-access-token') || '';
axios.defaults.headers.common['x-access-token'] = token;

const me = (() => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } })();
if(!token){ location.href='./signin.html'; }

// Sync real nav height to avoid content hidden under fixed nav
function syncNavHeight(){
  const nav = document.querySelector('nav');
  if(!nav) return;
  const h = Math.ceil(nav.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--nav-real', `${h}px`);
}
window.addEventListener('load', syncNavHeight);
window.addEventListener('resize', syncNavHeight);
window.addEventListener('orientationchange', syncNavHeight);
document.addEventListener('click', (e)=>{
  if(e.target.closest('.menu-btn')) setTimeout(syncNavHeight, 80);
});

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function toast(type, msg){
  const root = qs('#toast-root'); if(!root) return;
  const t = document.createElement('div');
  t.className = `toast ${type||''}`.trim();
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(10px)'; }, 2400);
  setTimeout(()=>t.remove(), 2900);
}

// Nav menu
(function initMenu(){
  const btn = qs('.menu-btn');
  const bar = qs('.menu-bar');
  const signed = qs('.sign-container.signed');
  const unsigned = qs('.sign-container.unsigned');
  if(token){ signed?.classList.remove('hidden'); unsigned?.classList.add('hidden'); }
  btn?.addEventListener('click', ()=> bar?.classList.toggle('open'));
  qs('#sign-out')?.addEventListener('click', ()=>{
    localStorage.removeItem('x-access-token');
    location.href='./signin.html';
  });
})();

// Register datalabels plugin
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', { display: false });

/* Palette (muted, premium) */
const C = {
  blue:'rgba(37,99,235,.72)',
  red:'rgba(239,68,68,.78)',
  green:'rgba(20,184,166,.72)',
  amber:'rgba(245,158,11,.72)',
  slate:'rgba(100,116,139,.78)',
  fillBlue:'rgba(37,99,235,.18)',
  fillRed:'rgba(239,68,68,.18)',
  fillSlate:'rgba(100,116,139,.16)',
  set:['rgba(37,99,235,.68)','rgba(100,116,139,.78)','rgba(20,184,166,.68)','rgba(245,158,11,.68)','rgba(99,102,241,.68)','rgba(168,85,247,.68)','rgba(14,165,233,.68)','rgba(71,85,105,.68)']
};

const charts = {};
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
function mountChart(id, config){ destroyChart(id); const el = qs(`#${id}`); if(!el) return null; charts[id] = new Chart(el, config); return charts[id]; }

function noDataPlugin(){
  return {
    id:'noDataText',
    afterDraw(chart){
      const hasData = (chart?.data?.datasets || []).some(ds => Array.isArray(ds.data) && ds.data.some(v => Number(v) > 0));
      if(hasData) return;
      const { ctx, chartArea } = chart;
      if(!chartArea) return;
      ctx.save();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('데이터 없음', (chartArea.left+chartArea.right)/2, (chartArea.top+chartArea.bottom)/2);
      ctx.restore();
    }
  };
}
Chart.register(noDataPlugin());

function fmtNum(v, d=1){ const n = Number(v); return Number.isFinite(n) ? n.toFixed(d) : '-'; }
function fmtDate(v){ if(!v) return '-'; return String(v).slice(0,10); }
function ymLabel(ym){ return String(ym||'').replace('-', '.'); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function setProfile(profile){
  const grid = qs('#profile-grid');
  if(!grid) return;
  const rows = [
    ['이름', profile.name],
    ['회사', profile.company],
    ['사번', profile.employeeId],
    ['GROUP', profile.group],
    ['SITE', profile.site],
    ['입사일', fmtDate(profile.hireDate)],
    ['ROLE', profile.role],
    ['MAIN EQ', profile.mainEqName],
    ['MULTI EQ', profile.multiEqName],
    ['LEVEL', profile.levelReport],
    ['LEVEL_INTERNAL', profile.levelInternal],
    ['LEVEL_PSK', profile.levelPsk],
    ['MULTI_LEVEL', profile.multiLevel],
    ['MULTI_LEVEL_PSK', profile.multiLevelPsk],
    ['2025 CAPA GOAL', profile.goal2025],
    ['2026 CAPA GOAL', profile.goal2026],
    ['2025 LEVEL GOAL', profile.levelGoal2025],
    ['2026 LEVEL GOAL', profile.levelGoal2026],
    ['2025 MULTI GOAL', profile.multiLevelGoal2025],
    ['2026 MULTI GOAL', profile.multiLevelGoal2026]
  ];
  grid.innerHTML = rows.map(([k,v])=>`
    <div class="profile-item">
      <div class="profile-key">${escapeHtml(k)}</div>
      <div class="profile-val">${escapeHtml(v ?? '-')}</div>
    </div>
  `).join('');
  qs('#profile-sub').textContent = `${profile.name || '-'} · ${profile.company || '-'} · ${profile.group || '-'} / ${profile.site || '-'}`;
}

function setKPIs(kpis, ranking){
  qs('#kpi-month-hours').textContent = (kpis.monthHours == null) ? 'N/A' : `${fmtNum(kpis.monthHours,1)}h`;
  qs('#kpi-month-events').textContent = (kpis.monthEvents == null) ? '작업 로그 미연결' : `${kpis.monthEvents}건`;

  qs('#kpi-time-rank').textContent = ranking?.myTimeRank ? `${ranking.myTimeRank}위` : 'N/A';
  qs('#kpi-time-top').textContent = ranking?.totalWorkers ? `총 ${ranking.totalWorkers}명 중` : '작업 로그 미연결';

  qs('#kpi-task-rank').textContent = ranking?.myTaskRank ? `${ranking.myTaskRank}위` : 'N/A';
  qs('#kpi-task-top').textContent = ranking?.totalWorkers ? `총 ${ranking.totalWorkers}명 중` : '작업 로그 미연결';

  qs('#meta-time-rank').textContent = ranking?.myTimeRank ? `내 순위 ${ranking.myTimeRank}위` : '데이터 없음';
  qs('#meta-task-rank').textContent = ranking?.myTaskRank ? `내 순위 ${ranking.myTaskRank}위` : '데이터 없음';
}

function barChart(id, labels, datasets, opt={}){
  return mountChart(id, {
    type:'bar',
    data:{ labels, datasets },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      scales:{
        x:{ ticks:{ color:'#cbd5e1', maxRotation:0, autoSkip:true }, grid:{ display:false } },
        y:{ beginAtZero:true, ticks:{ color:'#cbd5e1' }, grid:{ color:'rgba(148,163,184,.14)' } }
      },
      plugins:{ legend:{ labels:{ color:'#e5e7eb' } }, tooltip:{ enabled:true }, datalabels:{ display:false } },
      ...opt
    }
  });
}

function lineChart(id, labels, datasets, opt={}){
  return mountChart(id, {
    type:'line',
    data:{ labels, datasets },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      scales:{
        x:{ ticks:{ color:'#cbd5e1' }, grid:{ display:false } },
        y:{ beginAtZero:true, ticks:{ color:'#cbd5e1' }, grid:{ color:'rgba(148,163,184,.14)' } }
      },
      plugins:{ legend:{ labels:{ color:'#e5e7eb' } }, tooltip:{ enabled:true }, datalabels:{ display:false } },
      ...opt
    }
  });
}

function doughnutChart(id, labels, data){
  return mountChart(id, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor: labels.map((_,i)=>C.set[i % C.set.length]), borderWidth:0 }] },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:'64%',
      plugins:{ legend:{ position:'bottom', labels:{ color:'#e5e7eb', boxWidth:10 } }, datalabels:{ display:false } }
    }
  });
}

function percentBar(id, labels, data, color){
  return mountChart(id, {
    type:'bar',
    data:{ labels, datasets:[{ data, backgroundColor: color || C.blue, borderRadius:8, barThickness:24 }] },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      indexAxis:'y',
      scales:{
        x:{ beginAtZero:true, max:100, ticks:{ color:'#cbd5e1', callback:v=>`${v}%` }, grid:{ color:'rgba(148,163,184,.14)' } },
        y:{ ticks:{ color:'#cbd5e1' }, grid:{ display:false } }
      },
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(ctx)=>`${fmtNum(ctx.raw,1)}%` } }, datalabels:{ display:false } }
    }
  });
}

function verticalRankChart(id, rankingRows, myIndex){
  const labels = rankingRows.map((_,i)=>`${i+1}`);
  const values = rankingRows.map(r=>Number(r.value||0));
  const colors = rankingRows.map((_,i)=> i===myIndex ? C.red : C.slate);
  return mountChart(id, {
    type:'bar',
    data:{
      labels,
      datasets:[{ data:values, backgroundColor:colors, borderRadius:7, maxBarThickness:26 }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{
        x:{ ticks:{ color:'#cbd5e1' }, grid:{ display:false }, title:{ display:true, text:'순위', color:'#94a3b8' } },
        y:{ beginAtZero:true, ticks:{ color:'#cbd5e1' }, grid:{ color:'rgba(148,163,184,.14)' } }
      },
      plugins:{
        legend:{ display:false },
        tooltip:{
          callbacks:{
            title:(items)=>`${items[0].label}위`,
            label:(ctx)=>`${fmtNum(ctx.raw,1)}`
          }
        },
        datalabels:{ display:false }
      }
    }
  });
}

function renderEqCapability(rows){
  const labels = rows.map(r=>r.eq_name || r.eq_code || '-');
  barChart('chart-eq-cap', labels, [
    { label:'SET UP', data:rows.map(r=>Number(r.setup_score||0)), backgroundColor:C.blue },
    { label:'MAINT', data:rows.map(r=>Number(r.maint_score||0)), backgroundColor:C.green }
  ]);
}

function renderMainMulti(mainMulti){
  const main = mainMulti?.main;
  const multi = mainMulti?.multi;
  const labels = [main?.eqName || 'MAIN', multi?.eqName || 'MULTI'];
  const setup = [Number(main?.setup||0), Number(multi?.setup||0)];
  const maint = [Number(main?.maint||0), Number(multi?.maint||0)];
  barChart('chart-mainmulti-cap', labels, [
    { label:'SET UP', data:setup, backgroundColor:C.blue },
    { label:'MAINT', data:maint, backgroundColor:C.amber }
  ]);
}

function renderMonthlyMain(rows){
  lineChart('chart-monthly-main', rows.map(r=>ymLabel(r.ym)), [
    { label:'SET UP', data:rows.map(r=>Number(r.setup_score||0)), borderColor:C.blue, backgroundColor:C.fillBlue, fill:true, tension:.25 },
    { label:'MAINT', data:rows.map(r=>Number(r.maint_score||0)), borderColor:C.amber, backgroundColor:'rgba(245,158,11,.16)', fill:true, tension:.25 }
  ]);
}

function renderMonthlyMulti(rows){
  lineChart('chart-monthly-multi', rows.map(r=>ymLabel(r.ym)), [
    { label:'SET UP', data:rows.map(r=>Number(r.setup_score||0)), borderColor:C.green, backgroundColor:'rgba(20,184,166,.16)', fill:true, tension:.25 },
    { label:'MAINT', data:rows.map(r=>Number(r.maint_score||0)), borderColor:C.slate, backgroundColor:C.fillSlate, fill:true, tension:.25 }
  ]);
}

function renderMonthlyAvg(rows, profile){
  const goal = Number(profile.goal2026 ?? profile.goal2025 ?? 0);
  lineChart('chart-monthly-avg', rows.map(r=>ymLabel(r.ym)), [
    { label:'TOTAL CAPA', data:rows.map(r=>Number(r.total_score||0)), borderColor:C.blue, backgroundColor:C.fillBlue, fill:true, tension:.25 },
    { label:'연간 목표', data:rows.map(()=>goal), borderColor:C.red, backgroundColor:C.fillRed, borderDash:[6,6], fill:false, tension:0 }
  ]);
}

function renderMonthlyHours(rows){
  lineChart('chart-monthly-hours', rows.map(r=>ymLabel(r.ym)), [
    { label:'시간', data:rows.map(r=>Number(r.hours||0)), borderColor:C.blue, backgroundColor:C.fillBlue, fill:true, tension:.25 },
    { label:'건수', data:rows.map(r=>Number(r.count||0)), borderColor:C.green, backgroundColor:'rgba(20,184,166,.16)', fill:true, tension:.25 }
  ]);
}

function renderWorkType(rows){
  doughnutChart('chart-worktype', rows.map(r=>r.label), rows.map(r=>Number(r.cnt||0)));
}

function renderWorkSort(rows){
  // Muted palette only — no traffic-light feel
  mountChart('chart-worksort', {
    type:'doughnut',
    data:{
      labels: rows.map(r=>r.label),
      datasets:[{
        data: rows.map(r=>Number(r.cnt||0)),
        backgroundColor:[
          'rgba(59,130,246,.72)',
          'rgba(99,102,241,.72)',
          'rgba(20,184,166,.72)',
          'rgba(168,85,247,.72)',
          'rgba(14,165,233,.72)',
          'rgba(120,113,108,.72)',
          'rgba(148,163,184,.72)',
          'rgba(129,140,248,.72)'
        ],
        borderWidth:0
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:'64%',
      plugins:{ legend:{ position:'bottom', labels:{ color:'#e5e7eb', boxWidth:10 } }, datalabels:{ display:false } }
    }
  });
}

function renderDist(id, rows){
  doughnutChart(id, rows.map(r=>r.label), rows.map(r=>Number(r.cnt||0)));
}

function renderShift(rows){
  const sum = rows.reduce((a,b)=>a+Number(b.cnt||0),0) || 1;
  percentBar('chart-shift', rows.map(r=>r.label), rows.map(r=>Number(r.cnt||0)*100/sum), C.green);
}

function renderOvertime(rows){
  const sum = rows.reduce((a,b)=>a+Number(b.cnt||0),0) || 1;
  percentBar('chart-overtime', rows.map(r=>r.label), rows.map(r=>Number(r.cnt||0)*100/sum), C.amber);
}

function renderRework(rows){
  barChart('chart-rework', rows.map(r=>ymLabel(r.ym)), [{ label:'REWORK', data:rows.map(r=>Number(r.cnt||0)), backgroundColor:C.red }]);
}

function renderRanking(ranking){
  const timeRows = (ranking?.timeRank || []).map(r=>({ value:Number(r.hours||0) }));
  const taskRows = (ranking?.taskRank || []).map(r=>({ value:Number(r.count||0) }));
  const myTimeIndex = ranking?.myTimeRank ? Number(ranking.myTimeRank)-1 : -1;
  const myTaskIndex = ranking?.myTaskRank ? Number(ranking.myTaskRank)-1 : -1;
  verticalRankChart('chart-time-rank', timeRows, myTimeIndex);
  verticalRankChart('chart-task-rank', taskRows, myTaskIndex);
}

function levelCodeToNum(code){
  const map = { '0':0, '1':1, '1-1':1.1, '1-2':1.2, '1-3':1.3, '2':2.0, '2-2':2.2, '2-3':2.3, '2-4':2.4 };
  return map[String(code)] ?? 0;
}

function quarterKeyFromDate(dateStr){
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth()/3) + 1;
  return `${y}-Q${q}`;
}

function buildQuarterRange(startDateStr){
  const start = new Date(startDateStr);
  const now = new Date();
  const out = [];
  let y = start.getFullYear();
  let q = Math.floor(start.getMonth()/3) + 1;
  const endY = now.getFullYear();
  const endQ = Math.floor(now.getMonth()/3) + 1;
  while(y < endY || (y === endY && q <= endQ)){
    out.push(`${y}-Q${q}`);
    q += 1;
    if(q === 5){ q = 1; y += 1; }
  }
  return out;
}

function renderLevelTimeline(profile, levelHistory){
  const baseDate = profile.hireDate || new Date().toISOString().slice(0,10);
  const quarters = buildQuarterRange(baseDate);
  const sorted = [...(levelHistory || [])]
    .filter(r=>r.achieved_date)
    .sort((a,b)=>String(a.achieved_date).localeCompare(String(b.achieved_date)));

  let current = levelCodeToNum(profile.levelReport || '0');
  if(sorted.length) current = levelCodeToNum(sorted[0].level_code);

  const qValue = new Map();
  const pointLabels = new Map();
  sorted.forEach((r)=>{
    const qk = quarterKeyFromDate(r.achieved_date);
    qValue.set(qk, levelCodeToNum(r.level_code));
    pointLabels.set(qk, `${r.level_code} (${fmtDate(r.achieved_date)})`);
  });

  const values = [];
  let prev = levelCodeToNum(sorted[0]?.level_code || '0');
  if(!sorted.length) prev = levelCodeToNum(profile.levelReport || '0');
  for(const q of quarters){
    if(qValue.has(q)) prev = qValue.get(q);
    values.push(prev);
  }

  mountChart('chart-level-timeline', {
    type:'line',
    data:{
      labels: quarters,
      datasets:[{
        label:'Level',
        data: values,
        borderColor:C.blue,
        backgroundColor:'rgba(37,99,235,.18)',
        fill:true,
        tension:.15,
        pointRadius: quarters.map(q => pointLabels.has(q) ? 4 : 0),
        pointHoverRadius: quarters.map(q => pointLabels.has(q) ? 5 : 0),
        pointBackgroundColor: quarters.map(q => pointLabels.has(q) ? C.red : C.blue)
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{
        x:{ ticks:{ color:'#cbd5e1' }, grid:{ display:false } },
        y:{ beginAtZero:true, ticks:{ color:'#cbd5e1' }, grid:{ color:'rgba(148,163,184,.14)' } }
      },
      plugins:{
        legend:{ labels:{ color:'#e5e7eb' } },
        tooltip:{
          callbacks:{
            label:(ctx)=> pointLabels.get(ctx.label) || `Level ${ctx.raw}`
          }
        },
        datalabels:{
          display:(ctx)=> pointLabels.has(ctx.chart.data.labels[ctx.dataIndex]),
          align:'top',
          anchor:'end',
          offset:4,
          color:'#fca5a5',
          formatter:(_,ctx)=> pointLabels.get(ctx.chart.data.labels[ctx.dataIndex]) || ''
        }
      }
    }
  });
}

function bindInfoButtons(){
  qsa('.info-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> toast('info', btn.dataset.desc || '설명 없음'));
  });
}

async function loadDashboard(){
  const { data } = await axios.get(`${API}/analytics/myself/dashboard`);
  setProfile(data.profile || {});
  setKPIs(data.kpis || {}, data.ranking || {});

  renderEqCapability(data.eqCapability || []);
  renderMainMulti(data.mainMultiCapability || {});
  renderMonthlyMain(data.monthlyMainCapability || []);
  renderMonthlyMulti(data.monthlyMultiCapability || []);
  renderMonthlyAvg(data.monthlyCapability || [], data.profile || {});
  renderMonthlyHours(data.workStats?.monthlyHours || []);
  renderWorkType(data.workStats?.workType || []);
  renderWorkSort(data.workStats?.workSort || []);
  renderRanking(data.ranking || {});
  renderDist('chart-group', data.workStats?.group || []);
  renderDist('chart-site', data.workStats?.site || []);
  renderDist('chart-line', data.workStats?.line || []);
  renderShift(data.workStats?.shift || []);
  renderOvertime(data.workStats?.overtime || []);
  renderDist('chart-eqtype', data.workStats?.eqType || []);
  renderRework(data.workStats?.rework || []);
  renderLevelTimeline(data.profile || {}, data.levelHistory || []);
}

window.addEventListener('DOMContentLoaded', async ()=>{
  bindInfoButtons();
  try {
    await loadDashboard();
  } catch (e) {
    console.error(e);
    toast('error', e?.response?.data?.error || '대시보드 로딩 실패');
  }
});