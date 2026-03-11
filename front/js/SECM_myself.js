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
  blue:'rgba(37,99,235,.70)',
  red:'rgba(239,68,68,.78)',
  green:'rgba(34,197,94,.70)',
  amber:'rgba(245,158,11,.70)',
  slate:'rgba(100,116,139,.70)',
  rankGray:'rgba(148,163,184,.78)',
  fillBlue:'rgba(37,99,235,.18)',
  fillRed:'rgba(239,68,68,.18)',
  fillSlate:'rgba(100,116,139,.16)',
  set:['rgba(37,99,235,.65)','rgba(100,116,139,.65)','rgba(34,197,94,.65)','rgba(245,158,11,.65)','rgba(239,68,68,.65)','rgba(139,92,246,.65)','rgba(6,182,212,.65)'],
  worksort:['rgba(79,70,229,.68)','rgba(71,85,105,.68)','rgba(14,165,233,.68)','rgba(139,92,246,.68)','rgba(217,119,6,.68)','rgba(148,163,184,.72)','rgba(15,118,110,.68)']
};

const charts = {};

function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

function isRatioLike(arr){
  const nums = arr.filter(v=>v!=null && !Number.isNaN(v)).map(Number);
  if(!nums.length) return false;
  const mx = Math.max(...nums);
  return mx <= 1.5; // 0~1 ratio
}
function toPct(v){ return v==null ? null : (Number(v) * 100); }
function fmt1(v){ return (v==null || Number.isNaN(v)) ? '' : (Math.round(Number(v)*10)/10).toString(); }
function minutesToHours(min){
  const m = Number(min||0);
  const h = m/60;
  return Math.round(h*10)/10;
}
function fmtHours(min){ return `${minutesToHours(min)}h`; }

function setNoData(canvasId){
  const cv = document.getElementById(canvasId);
  if(!cv) return;
  const card = cv.closest('.chart-card');
  if(!card) return;
  cv.style.display='none';
  if(card.querySelector('.no-data')) return;
  const d = document.createElement('div');
  d.className='no-data';
  d.textContent='데이터 없음';
  card.appendChild(d);
}

function barV(id, labels, datasets, opts={}){
  destroyChart(id);
  const el = document.getElementById(id);
  if(!el) return;
  if(!labels?.length){ setNoData(id); return; }
  el.style.display='block';
  el.closest('.chart-card')?.querySelector('.no-data')?.remove();

  charts[id] = new Chart(el, {
    type:'bar',
    data:{ labels, datasets },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{ position:'bottom' },
        datalabels:{
          display: true,
          anchor:'end',
          align:'end',
          clamp:true,
          clip:false,
          font:{ weight:'800', size:10 },
          formatter:(v,ctx)=> opts.formatter ? opts.formatter(v,ctx) : (v==null?'':fmt1(v))
        },
        tooltip:{ callbacks:{ label:(c)=> `${c.dataset.label}: ${fmt1(c.raw)}` } }
      },
      scales:{
        y:{ beginAtZero:true, suggestedMax: opts.suggestedMax ?? undefined }
      }
    }
  });
}

function barH(id, labels, data, opts={}){
  destroyChart(id);
  const el = document.getElementById(id);
  if(!el) return;
  if(!labels?.length){ setNoData(id); return; }
  el.style.display='block';
  el.closest('.chart-card')?.querySelector('.no-data')?.remove();

  charts[id] = new Chart(el,{
    type:'bar',
    data:{
      labels,
      datasets:[{
        label: opts.label || '',
        data,
        borderRadius:8,
        backgroundColor: opts.colors || C.blue
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        datalabels:{
          display:true,
          anchor:'end',
          align:'right',
          clamp:true,
          clip:false,
          font:{ weight:'800', size:10 },
          formatter:(v,ctx)=>{
            if(opts.percentTotal){
              const total = opts.percentTotal;
              const pct = total ? (Number(v||0)/total*100) : 0;
              return `${v} (${Math.round(pct)}%)`;
            }
            return opts.formatter ? opts.formatter(v,ctx) : `${v}`;
          }
        }
      },
      scales:{
        x:{ beginAtZero:true }
      }
    }
  });
}

function line(id, labels, datasets, opts={}){
  destroyChart(id);
  const el = document.getElementById(id);
  if(!el) return;
  if(!labels?.length){ setNoData(id); return; }
  el.style.display='block';
  el.closest('.chart-card')?.querySelector('.no-data')?.remove();

  charts[id] = new Chart(el,{
    type:'line',
    data:{ labels, datasets },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ position:'bottom' },
        datalabels:{
          display: (ctx)=>{
            if(opts.labelMode==='last') return ctx.dataIndex === ctx.dataset.data.length-1;
            if(opts.labelMode==='all') return true;
            return ctx.dataIndex === ctx.dataset.data.length-1;
          },
          anchor:'end',
          align:'top',
          clamp:true,
          clip:false,
          font:{ weight:'800', size:10 },
          formatter:(v)=> opts.formatter ? opts.formatter(v) : (v==null?'':fmt1(v))
        }
      },
      scales:{
        y:{
          beginAtZero: opts.beginAtZero ?? false,
          suggestedMin: opts.suggestedMin ?? undefined,
          suggestedMax: opts.suggestedMax ?? undefined
        }
      }
    }
  });
}

function area(id, labels, dataset, opts={}){
  destroyChart(id);
  const el = document.getElementById(id);
  if(!el) return;
  if(!labels?.length){ setNoData(id); return; }
  el.style.display='block';
  el.closest('.chart-card')?.querySelector('.no-data')?.remove();

  charts[id] = new Chart(el,{
    type:'line',
    data:{ labels, datasets:[dataset] },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        datalabels:{
          display:(ctx)=> opts.points?.has(ctx.dataIndex) || false,
          anchor:'end',
          align:'top',
          clamp:true,
          clip:false,
          font:{ weight:'900', size:10 },
          formatter:(v,ctx)=> opts.labelMap?.get(ctx.dataIndex) || ''
        }
      },
      scales:{
        y:{ beginAtZero:true, ticks:{ callback:(v)=> scoreToLevel(v) } }
      }
    }
  });
}

function donut(id, labels, values, opts={}){
  destroyChart(id);
  const el = document.getElementById(id);
  if(!el) return;
  if(!labels?.length){ setNoData(id); return; }
  el.style.display='block';
  el.closest('.chart-card')?.querySelector('.no-data')?.remove();

  const total = values.reduce((a,b)=>a+Number(b||0),0) || 0;

  charts[id] = new Chart(el,{
    type:'doughnut',
    data:{ labels, datasets:[{ data: values, backgroundColor: labels.map((_,i)=>(opts.colors || C.set)[i % (opts.colors || C.set).length]), borderWidth:0 }]},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:'62%',
      plugins:{
        legend:{ position:'bottom' },
        datalabels:{
          display:(ctx)=>{
            const v = Number(ctx.dataset.data[ctx.dataIndex]||0);
            return total>0 && (v/total)>=0.06; // show only >=6%
          },
          anchor:'end',
          align:'end',
          clamp:true,
          clip:false,
          font:{ weight:'900', size:10 },
          formatter:(v,ctx)=>{
            const pct = total ? (Number(v||0)/total*100) : 0;
            return `${Math.round(pct)}%`;
          }
        }
      }
    }
  });
}

// Build quarter labels from hire to now
function buildQuarterLabels(hireDateStr){
  if(!hireDateStr) return [];
  const hire = new Date(hireDateStr);
  if(Number.isNaN(hire.getTime())) return [];
  const now = new Date();
  const labels = [];
  const dates = [];
  // start from hire quarter start
  const q = Math.floor(hire.getMonth()/3);
  let y = hire.getFullYear();
  let m = q*3;
  let d = new Date(y,m,1);
  while(d <= now){
    const qn = Math.floor(d.getMonth()/3)+1;
    labels.push(`${d.getFullYear()} Q${qn}`);
    dates.push(new Date(d));
    d = new Date(d.getFullYear(), d.getMonth()+3, 1);
  }
  return { labels, dates };
}
function scoreToLevel(s){
  const map = new Map([[0,'0'],[1,'1'],[1.1,'1-1'],[1.2,'1-2'],[1.3,'1-3'],[2,'2'],[2.2,'2-2'],[2.3,'2-3'],[2.4,'2-4']]);
  const n = Number(s);
  if(map.has(n)) return map.get(n);
  // fallback
  return String(s);
}

function levelToScore(code){
  const map = { '0':0,'1':1,'1-1':1.1,'1-2':1.2,'1-3':1.3,'2':2.0,'2-2':2.2,'2-3':2.3,'2-4':2.4 };
  const s = map[code];
  return s!=null ? s : (Number(code)||0);
}
function computeLevelTimeline(profile){
  const hire = profile?.hire_date;
  const { labels, dates } = buildQuarterLabels(hire);
  if(!labels.length) return { labels:[], values:[], points:new Set(), labelMap:new Map() };

  // Build achieved list
  const ach = profile?.achieved || {};
  const achieved = [];
  for(const [lv, dt] of Object.entries(ach)){
    if(dt) achieved.push({ lv, dt: new Date(dt) });
  }
  achieved.sort((a,b)=>a.dt-b.dt);

  // Current level by time
  let cur = '0';
  const values = dates.map((qd)=>{
    for(const a of achieved){
      if(a.dt <= qd) cur = a.lv;
    }
    return levelToScore(cur);
  });

  // Points where level changed: nearest quarter index after achieved date
  const points = new Set();
  const labelMap = new Map();
  achieved.forEach(a=>{
    // find first quarter >= achieved date
    const idx = dates.findIndex(d=>d >= a.dt);
    if(idx>=0){
      points.add(idx);
      const yyyy = a.dt.getFullYear();
      const mm = String(a.dt.getMonth()+1).padStart(2,'0');
      const dd = String(a.dt.getDate()).padStart(2,'0');
      labelMap.set(idx, `${a.lv} (${yyyy}-${mm}-${dd})`);
    }
  });

  return { labels, values, points, labelMap };
}

function unitLabel(unit, fallback='CAPA'){
  return unit === 'minutes' ? '작업시간(분)' : fallback;
}

function buildRankSeries(list, myName, valueKey, limit=30){
  const ranked = (list || []).map((row, idx) => ({
    rank: idx + 1,
    name: row.name,
    value: Number(row[valueKey] || 0),
  }));
  const top = ranked.slice(0, limit);
  if (!top.some(x => x.name === myName)) {
    const mine = ranked.find(x => x.name === myName);
    if (mine) top.push(mine);
  }
  return top;
}

async function load(){
  try{
    const { data } = await axios.get(`${API}/analytics/myself/dashboard`);
    if(!data?.profile){
      toast('error','내 정보를 찾을 수 없습니다. (engineer 매칭 실패)');
      return;
    }

    // Profile grid
    const p = data.profile;
    const grid = qs('#profile-grid');
    const fields = [
      ['이름', p.name], ['회사', p.company], ['사번', p.employee_id],
      ['GROUP', p.group], ['SITE', p.site], ['입사일', p.hire_date ? String(p.hire_date).slice(0,10) : '-'],
      ['레벨', p.level_report], ['MAIN EQ', p.main_eq], ['MULTI EQ', p.multi_eq],
      ['SET UP CAPA', p.setup_capa], ['MAINT CAPA', p.maint_capa], ['MULTI CAPA', p.multi_capa],
      ['TOTAL CAPA', p.capa]
    ];
    grid.innerHTML = fields.map(([k,v])=>`
      <div class="p-field"><div class="p-label">${k}</div><div class="p-value">${(v==null||v==='')?'-':v}</div></div>
    `).join('');

    // Rank KPIs (this month)
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    const timeRank = (data.rank?.timeRank || []).map(r=>({ name:r.name, v:Number(r.total_minutes||0) }));
    const taskRank = (data.rank?.taskRank || []).map(r=>({ name:r.name, v:Number(r.cnt||0) }));
    const myName = data.rank?.myName || p.name;

    function calcRank(list){
      const total = list.length;
      const idx = list.findIndex(x=>x.name===myName);
      const rank = idx>=0 ? (idx+1) : null;
      const pct = (rank && total) ? Math.round(rank/total*100) : null;
      const myVal = idx>=0 ? list[idx].v : 0;
      return { total, rank, pct, myVal };
    }
    const tr = calcRank(timeRank);
    const kr = calcRank(taskRank);

    // This month hours (myself)
    const mh = (data.work?.monthlyHours || []).find(r=>r.ym===ym);
    const myMonthMin = mh ? Number(mh.total_minutes||0) : 0;
    const myMonthEvents = mh ? Number(mh.event_count||0) : 0;

    qs('#kpi-month-hours').textContent = fmtHours(myMonthMin);
    qs('#kpi-month-events').textContent = `이번달 작업 ${myMonthEvents}건`;
    qs('#kpi-time-rank').textContent = tr.rank ? `${tr.rank} / ${tr.total}` : '-';
    qs('#kpi-time-top').textContent = tr.pct ? `TOP ${tr.pct}%` : '-';
    qs('#kpi-task-rank').textContent = kr.rank ? `${kr.rank} / ${kr.total}` : '-';
    qs('#kpi-task-top').textContent = kr.pct ? `TOP ${kr.pct}%` : '-';
    qs('#meta-time-rank').textContent = `내 ${fmtHours(tr.myVal)} · TOP ${tr.pct ?? '-'}%`;
    qs('#meta-task-rank').textContent = `내 ${kr.myVal}건 · TOP ${kr.pct ?? '-'}%`;

    // 1) Equipment capability (vertical grouped bars)
    const eqCap = (data.capability?.eqCapability || []).filter(r=>r.setup!=null || r.maint!=null);
    const eqLabels = eqCap.map(r=>r.eq);
    const setupValsRaw = eqCap.map(r=>r.setup==null?0:Number(r.setup));
    const maintValsRaw = eqCap.map(r=>r.maint==null?0:Number(r.maint));
    const ratioMode = isRatioLike([...setupValsRaw, ...maintValsRaw]);
    const setupVals = ratioMode ? setupValsRaw.map(toPct) : setupValsRaw;
    const maintVals = ratioMode ? maintValsRaw.map(toPct) : maintValsRaw;

    barV('chart-eq-cap', eqLabels, [
      { label:'SET UP', data: setupVals, backgroundColor:C.blue, borderRadius:8 },
      { label:'MAINT', data: maintVals, backgroundColor:C.slate, borderRadius:8 }
    ], {
      formatter:(v)=> ratioMode ? `${fmt1(v)}%` : fmt1(v),
      suggestedMax: ratioMode ? 110 : undefined
    });

    // 2) Main/Multi capability
    const main = data.capability?.main || {};
    const multi = data.capability?.multi || {};
    const mmLabels = ['MAIN SETUP','MAIN MAINT','MULTI SETUP','MULTI MAINT'];
    const mmRaw = [
      main.setup!=null?Number(main.setup):0,
      main.maint!=null?Number(main.maint):0,
      multi.setup!=null?Number(multi.setup):0,
      multi.maint!=null?Number(multi.maint):0
    ];
    const mmRatio = isRatioLike(mmRaw);
    const mmVals = mmRatio ? mmRaw.map(toPct) : mmRaw;
    barV('chart-mainmulti-cap', mmLabels, [
      { label:`${main.eq||'MAIN'} / ${multi.eq||'MULTI'}`, data:mmVals, backgroundColor:[C.blue,C.slate,C.blue,C.slate], borderRadius:10 }
    ], { formatter:(v)=> mmRatio?`${fmt1(v)}%`:fmt1(v), suggestedMax: mmRatio?110:undefined });

    // 3) Monthly main setup/maint
    const mMain = data.capability?.monthlyMain || [];
    const mainUnit = data.capability?.monthlyMainUnit || 'capa';
    const mLabels = mMain.map(r=>r.ym);
    const mSetupRaw = mMain.map(r=>r.setup==null?null:Number(r.setup));
    const mMaintRaw = mMain.map(r=>r.maint==null?null:Number(r.maint));
    const mRatio = (mainUnit==='capa') && isRatioLike([...mSetupRaw.filter(v=>v!=null), ...mMaintRaw.filter(v=>v!=null)]);
    const mSetup = mRatio ? mSetupRaw.map(v=>v==null?null:toPct(v)) : mSetupRaw;
    const mMaint = mRatio ? mMaintRaw.map(v=>v==null?null:toPct(v)) : mMaintRaw;
    const mainMeta = qs('#meta-monthly-main');
    if(mainMeta) mainMeta.textContent = unitLabel(mainUnit);

    line('chart-monthly-main', mLabels, [
      { label: mainUnit==='minutes' ? 'SET UP (분)' : 'SET UP', data:mSetup, borderColor:C.blue, backgroundColor:C.fillBlue, tension:.35, fill:false },
      { label: mainUnit==='minutes' ? 'MAINT (분)' : 'MAINT', data:mMaint, borderColor:C.slate, backgroundColor:C.fillSlate, tension:.35, fill:false },
    ], { labelMode:'last', formatter:(v)=> {
      if(v==null) return '';
      if(mainUnit==='minutes') return `${Math.round(Number(v))}`;
      return mRatio?`${fmt1(v)}%`:fmt1(v);
    } });

    // 5) Monthly multi setup/maint
    const mMulti = data.capability?.monthlyMulti || [];
    const multiUnit = data.capability?.monthlyMultiUnit || 'capa';
    const multiMeta = qs('#meta-monthly-multi');
    if(multiMeta) multiMeta.textContent = unitLabel(multiUnit);
    const mmLabels2 = mMulti.map(r=>r.ym);
    const mmSetup2 = mMulti.map(r=>r.setup==null?null:Number(r.setup));
    const mmMaint2 = mMulti.map(r=>r.maint==null?null:Number(r.maint));
    const mmRatio2 = (multiUnit==='capa') && isRatioLike([...mmSetup2.filter(v=>v!=null), ...mmMaint2.filter(v=>v!=null)]);
    const mmSetup2v = mmRatio2 ? mmSetup2.map(v=>v==null?null:toPct(v)) : mmSetup2;
    const mmMaint2v = mmRatio2 ? mmMaint2.map(v=>v==null?null:toPct(v)) : mmMaint2;

    line('chart-monthly-multi', mmLabels2, [
      { label: multiUnit==='minutes' ? 'SET UP (분)' : 'SET UP', data:mmSetup2v, borderColor:C.blue, backgroundColor:C.fillBlue, tension:.35, fill:false },
      { label: multiUnit==='minutes' ? 'MAINT (분)' : 'MAINT', data:mmMaint2v, borderColor:C.slate, backgroundColor:C.fillSlate, tension:.35, fill:false },
    ], { labelMode:'last', formatter:(v)=> {
      if(v==null) return '';
      if(multiUnit==='minutes') return `${Math.round(Number(v))}`;
      return mmRatio2?`${fmt1(v)}%`:fmt1(v);
    } });

    // 6) Monthly avg capa + goal
    const mAvg = data.capability?.monthlyAvg || [];
    const aLabels = mAvg.map(r=>r.ym);
    const aTotalRaw = mAvg.map(r=>r.total==null?null:Number(r.total));
    const aRatio = isRatioLike(aTotalRaw.filter(v=>v!=null));
    const aTotal = aRatio ? aTotalRaw.map(v=>v==null?null:toPct(v)) : aTotalRaw;
    const goalVal = mAvg.find(r=>r.goal!=null)?.goal;
    const goalArr = (goalVal!=null) ? aLabels.map(()=> aRatio ? toPct(goalVal) : Number(goalVal)) : [];

    line('chart-monthly-avg', aLabels, [
      { label:'CAPA', data:aTotal, borderColor:C.blue, backgroundColor:C.fillBlue, tension:.35, fill:false },
      ...(goalArr.length ? [{ label:'목표', data:goalArr, borderColor:C.red, backgroundColor:C.fillRed, tension:0, fill:false, borderDash:[6,4] }] : [])
    ], { labelMode:'last', formatter:(v)=> aRatio?`${fmt1(v)}%`:fmt1(v) });

    // 7) Monthly work hours
    const mhRows = data.work?.monthlyHours || [];
    const whLabels = mhRows.map(r=>r.ym);
    const whHours = mhRows.map(r=> minutesToHours(r.total_minutes));
    line('chart-monthly-hours', whLabels, [
      { label:'근무시간(h)', data:whHours, borderColor:C.blue, backgroundColor:C.fillBlue, tension:.35, fill:true },
      { label:'작업건수', data: mhRows.map(r=>Number(r.event_count||0)), borderColor:C.slate, backgroundColor:C.fillSlate, tension:.35, fill:false, yAxisID:'y1' }
    ], {
      labelMode:'last',
      formatter:(v)=> fmt1(v),
      beginAtZero:true,
      // second axis
    });
    // add second axis (hack): update chart options
    if(charts['chart-monthly-hours']){
      charts['chart-monthly-hours'].options.scales.y1 = { position:'right', grid:{ drawOnChartArea:false }, beginAtZero:true };
      charts['chart-monthly-hours'].update();
    }

    // 8) Level timeline (quarter area)
    const lt = computeLevelTimeline(p);
    area('chart-level-timeline', lt.labels, {
      label:'Level',
      data: lt.values,
      borderColor:C.blue,
      backgroundColor:C.fillBlue,
      tension:.25,
      fill:true,
      pointRadius:3
    }, { points: lt.points, labelMap: lt.labelMap });

    // 9) Work Type donut
    const wt = data.work?.byWorkType || [];
    donut('chart-worktype', wt.map(r=>r.label||'N/A'), wt.map(r=>Number(r.cnt||0)));

    // 10) Work Sort donut
    const ws = data.work?.byWorkSort || [];
    donut('chart-worksort', ws.map(r=>r.label||'N/A'), ws.map(r=>Number(r.cnt||0)), { colors:C.worksort });

    // 11) Time rank (vertical / anonymized)
    const timeList = buildRankSeries(data.rank?.timeRank || [], myName, 'total_minutes', 30);
    const tLabels = timeList.map(x=>`#${x.rank}`);
    const tVals = timeList.map(x=> minutesToHours(x.value));
    const tColors = timeList.map(x=> x.name===myName ? C.red : C.rankGray);
    barV('chart-time-rank', tLabels, [
      { label:'근무시간(h)', data:tVals, backgroundColor:tColors, borderRadius:8 }
    ], { formatter:(v)=> `${fmt1(v)}h` });

    // 12) Task rank (vertical / anonymized)
    const taskList = buildRankSeries(data.rank?.taskRank || [], myName, 'cnt', 30);
    const kLabels = taskList.map(x=>`#${x.rank}`);
    const kVals = taskList.map(x=>x.value);
    const kColors = taskList.map(x=> x.name===myName ? C.red : C.rankGray);
    barV('chart-task-rank', kLabels, [
      { label:'작업건수', data:kVals, backgroundColor:kColors, borderRadius:8 }
    ], { formatter:(v)=> `${v}` });

    // 13~15 Group/Site/Line (horizontal)
    const g = data.work?.byGroup || [];
    barH('chart-group', g.map(r=>r.label), g.map(r=>Number(r.cnt||0)), { percentTotal: g.reduce((a,b)=>a+Number(b.cnt||0),0) });

    const s = data.work?.bySite || [];
    barH('chart-site', s.map(r=>r.label), s.map(r=>Number(r.cnt||0)), { percentTotal: s.reduce((a,b)=>a+Number(b.cnt||0),0) });

    const l = data.work?.byLine || [];
    barH('chart-line', l.map(r=>r.label), l.map(r=>Number(r.cnt||0)), { percentTotal: l.reduce((a,b)=>a+Number(b.cnt||0),0) });

    // 16~17 shift/overtime (horizontal + percent)
    const sh = data.work?.byShift || [];
    barH('chart-shift', sh.map(r=>r.label), sh.map(r=>Number(r.cnt||0)), { percentTotal: sh.reduce((a,b)=>a+Number(b.cnt||0),0) });

    const ot = data.work?.byOvertime || [];
    barH('chart-overtime', ot.map(r=>r.label), ot.map(r=>Number(r.cnt||0)), { percentTotal: ot.reduce((a,b)=>a+Number(b.cnt||0),0) });

    // 18 eq type (horizontal)
    const eqt = data.work?.byEqType || [];
    barH('chart-eqtype', eqt.slice(0,12).map(r=>r.label), eqt.slice(0,12).map(r=>Number(r.cnt||0)), { percentTotal: eqt.reduce((a,b)=>a+Number(b.cnt||0),0) });

    // 19 rework counting (line)
    const rw = data.work?.reworkMonthly || [];
    line('chart-rework', rw.map(r=>r.ym), [
      { label:'Rework(건)', data: rw.map(r=>Number(r.cnt||0)), borderColor:C.red, backgroundColor:C.fillRed, tension:.35, fill:true }
    ], { labelMode:'all', formatter:(v)=> v==null?'':`${v}` });

  }catch(e){
    console.error(e);
    if(e?.response?.status===401){ location.href='./signin.html'; return; }
    toast('error','데이터 로딩 실패');
  }
}

// Info popup
(function initDesc(){
  document.addEventListener('click',(e)=>{
    const btn = e.target.closest('.info-btn');
    if(!btn) return;
    const desc = btn.getAttribute('data-desc') || '';
    const pop = document.createElement('div');
    pop.className='desc-popup';
    pop.innerHTML = `<div class="desc-content"><p>${desc}</p><button class="menu-item" style="width:100%;justify-content:center">닫기</button></div>`;
    document.body.appendChild(pop);
    pop.addEventListener('click',(ev)=>{ if(ev.target===pop || ev.target.closest('button')) pop.remove(); });
  });
})();

load();