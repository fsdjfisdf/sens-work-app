/* analytics.js v2 — all fixes */
'use strict';
const API = 'http://3.37.73.151:3001';
const token = localStorage.getItem('x-access-token') || '';
axios.defaults.headers.common['x-access-token'] = token;
const me = (() => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } })();

// Register datalabels plugin
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', { display: false }); // off by default

/* Semi-transparent palette */
const C = {
  blue:'rgba(37,99,235,.7)', blueF:'rgba(37,99,235,.25)', red:'rgba(239,68,68,.7)', redF:'rgba(239,68,68,.25)',
  green:'rgba(34,197,94,.7)', greenF:'rgba(34,197,94,.25)', amber:'rgba(245,158,11,.7)', amberF:'rgba(245,158,11,.25)',
  purple:'rgba(139,92,246,.7)', purpleF:'rgba(139,92,246,.25)', cyan:'rgba(6,182,212,.7)', pink:'rgba(236,72,153,.7)',
  slate:'rgba(100,116,139,.7)', slateF:'rgba(100,116,139,.25)',
  set:['rgba(37,99,235,.65)','rgba(34,197,94,.65)','rgba(245,158,11,.65)','rgba(239,68,68,.65)','rgba(139,92,246,.65)','rgba(6,182,212,.65)','rgba(236,72,153,.65)','rgba(100,116,139,.65)','rgba(249,115,22,.65)','rgba(20,184,166,.65)'],
  solid:['#2563eb','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#64748b']
};
const charts = {};
let allEngineers = [];

function toast(type, msg) { const r = document.getElementById('toast-root'); if (!r) return; const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg; r.appendChild(el); setTimeout(() => el.remove(), 4000); }
function fmtDate(d) { if (!d) return '—'; return String(d).split('T')[0]; }
function getFilters() { return { company: document.getElementById('f-company').value, group: document.getElementById('f-group').value, site: document.getElementById('f-site').value, name: document.getElementById('f-name-input').dataset.selected || '' }; }
function qs(f) { const p = new URLSearchParams(); for (const [k,v] of Object.entries(f)) { if(v) p.set(k,v); } return p.toString(); }
function destroyChart(id) { if(charts[id]){charts[id].destroy();delete charts[id];} }
function getCtx(id) { destroyChart(id); return document.getElementById(id)?.getContext('2d'); }

/* datalabel presets */
const DL_BAR = { display:true, anchor:'end', align:'end', font:{size:10,weight:'bold'}, color:'#374151', formatter:v=>v||'' };
const DL_PCT = { display:true, font:{size:11,weight:'bold'}, color:'#fff', formatter:(v,ctx)=>{ const t=ctx.dataset.data.reduce((s,x)=>s+x,0); return t?(Math.round(v/t*100)+'%'):''; } };
const DL_LINE = { display:true, align:'top', anchor:'end', font:{size:10,weight:'bold'}, color:'#374151', formatter:v=>(v??'') };

/* Nav */
function initNav() {
  if(me){document.querySelectorAll('.sign-container.unsigned').forEach(e=>e.classList.add('hidden'));document.querySelectorAll('.sign-container.signed').forEach(e=>e.classList.remove('hidden'));}
  document.getElementById('sign-out')?.addEventListener('click',()=>{localStorage.removeItem('x-access-token');location.href='./signin.html';});
  document.querySelector('.menu-btn')?.addEventListener('click',()=>document.querySelector('.menu-bar')?.classList.toggle('open'));
}

/* Tabs */
function initTabs() {
  document.querySelectorAll('.cat-tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.cat-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.cat-section').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.querySelector(`.cat-section[data-cat="${t.dataset.cat}"]`)?.classList.add('active');
  }));
}

function initInfoBtns() {
  document.querySelectorAll('.info-btn').forEach(b=>b.addEventListener('click',()=>{
    document.getElementById('desc-text').textContent=b.dataset.desc;
    document.getElementById('desc-popup').style.display='flex';
  }));
  document.getElementById('desc-close')?.addEventListener('click',()=>document.getElementById('desc-popup').style.display='none');
  document.getElementById('desc-popup')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});
}

/* Engineer Search (14) */
function initEngSearch() {
  const input = document.getElementById('f-name-input');
  const dd = document.getElementById('eng-dropdown');
  const groupSel = document.getElementById('f-group');
  const siteSel = document.getElementById('f-site');

  input.addEventListener('input', () => {
    const v = input.value.trim().toLowerCase();
    const g = groupSel.value, s = siteSel.value;
    let filtered = allEngineers;
    if (g) filtered = filtered.filter(e => e.grp === g);
    if (s) filtered = filtered.filter(e => e.SITE === s);
    if (v) filtered = filtered.filter(e => e.NAME.toLowerCase().includes(v));
    if (!filtered.length || !v) { dd.classList.remove('open'); return; }
    dd.innerHTML = filtered.slice(0, 15).map(e => `<div class="eng-opt" data-name="${e.NAME}"><span>${e.NAME}</span><span class="eng-opt-meta">${e.grp} · ${e.SITE}</span></div>`).join('');
    dd.classList.add('open');
    dd.querySelectorAll('.eng-opt').forEach(o => o.addEventListener('click', () => {
      input.value = o.dataset.name;
      input.dataset.selected = o.dataset.name;
      dd.classList.remove('open');
    }));
  });
  input.addEventListener('focus', () => { if (input.value) input.dispatchEvent(new Event('input')); });
  document.addEventListener('click', e => { if (!e.target.closest('.eng-search-wrap')) dd.classList.remove('open'); });
  input.addEventListener('keydown', e => { if (e.key === 'Backspace' && !input.value) input.dataset.selected = ''; });
}

/* Filters */
async function initFilters() {
  try {
    const {data} = await axios.get(`${API}/analytics/filters`);
    const sel = (id, arr) => { const s = document.getElementById(id); arr.forEach(v => { const o = document.createElement('option'); o.value=v; o.textContent=v; s.appendChild(o); }); };
    sel('f-company', data.companies);
    sel('f-group', data.groups);
    sel('f-site', data.sites);
    allEngineers = data.engineers;
  } catch { toast('error','필터 로드 실패'); }
}

/* ══ CHARTS ══ */

/* 1. Head Count (no negative, show names on hover) */
async function renderHeadCount(f) {
  try {
    const {data} = await axios.get(`${API}/analytics/headcount?${qs(f)}`);
    const ctx = getCtx('chart-headcount'); if(!ctx) return;
    const now = new Date(); const labels = []; let d = new Date(2023,0);
    while(d<=now){labels.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()+1);}
    const hireMap={},hireName={};data.hires.forEach(r=>{hireMap[r.ym]=r.cnt;hireName[r.ym]=r.names;});
    const resignMap={},resignName={};data.resigns.forEach(r=>{resignMap[r.ym]=r.cnt;resignName[r.ym]=r.names;});
    // forward 누적(입사 전=0, 1명 선택 시에도 자연스러운 형태)
    let running=0;const cumulative=[];
    labels.forEach(l=>{running += (hireMap[l]||0) - (resignMap[l]||0); cumulative.push(Math.max(0,running));});
    charts['chart-headcount']=new Chart(ctx,{type:'bar',data:{labels,datasets:[
      {type:'line',label:'재직 인원',data:cumulative,borderColor:C.solid[0],backgroundColor:C.blueF,tension:.3,yAxisID:'y',fill:true,pointRadius:1,datalabels:DL_LINE},
      {label:'입사',data:labels.map(l=>hireMap[l]||0),backgroundColor:C.green,yAxisID:'y1'},
      {label:'퇴사',data:labels.map(l=>resignMap[l]||0),backgroundColor:C.red,yAxisID:'y1'}
    ]},options:{responsive:true,plugins:{legend:{position:'top',labels:{font:{size:11}}},datalabels:{display:true},tooltip:{callbacks:{afterLabel:c=>{const l=labels[c.dataIndex];if(c.datasetIndex===1&&hireName[l])return hireName[l];if(c.datasetIndex===2&&resignName[l])return resignName[l];return'';}}}},scales:{y:{position:'left',title:{display:true,text:'재직',font:{size:11}},ticks:{stepSize:1}},y1:{position:'right',grid:{drawOnChartArea:false},title:{display:true,text:'입사/퇴사',font:{size:11}},ticks:{stepSize:1}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
  }catch{}
}

/* 2. HR */
async function renderHR(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/hr-distribution?${qs(f)}`);
    let ctx=getCtx('chart-company');if(ctx){
      charts['chart-company']=new Chart(ctx,{type:'doughnut',data:{labels:data.byCompany.map(r=>r.label),datasets:[{data:data.byCompany.map(r=>r.cnt),backgroundColor:[C.blue,C.green,C.amber]}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }
    ctx=getCtx('chart-experience');if(ctx){
      charts['chart-experience']=new Chart(ctx,{type:'bar',data:{labels:data.byExp.map(r=>r.label),datasets:[{label:'인원',data:data.byExp.map(r=>r.cnt),backgroundColor:C.set.slice(0,data.byExp.length),borderRadius:4}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false},datalabels:DL_BAR}}});
    }
    ctx=getCtx('chart-groupsite');if(ctx){
      charts['chart-groupsite']=new Chart(ctx,{type:'bar',data:{labels:data.byGroupSite.map(r=>r.label),datasets:[{label:'인원',data:data.byGroupSite.map(r=>r.cnt),backgroundColor:C.set.slice(0,data.byGroupSite.length),borderRadius:4}]},options:{responsive:true,plugins:{legend:{display:false},datalabels:DL_BAR},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}});
    }
  }catch{}
}

/* 3. Level Dist — vertical bar (fix 3) */
async function renderLevelDist(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/level-distribution?${qs(f)}`);
    const ctx=getCtx('chart-level-dist');if(!ctx)return;
    const total=data.reduce((s,r)=>s+r.cnt,0);
    charts['chart-level-dist']=new Chart(ctx,{type:'bar',data:{labels:data.map(r=>`Lv.${r.label}`),datasets:[{label:'인원',data:data.map(r=>r.cnt),backgroundColor:C.set.slice(0,data.length),borderRadius:4}]},options:{responsive:true,plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:10,weight:'bold'},formatter:(v,ctx2)=>`${v}명(${Math.round(v/total*100)}%)`}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}});
  }catch{}
}

/* 4. Level Achievement */
async function renderLevelAchieve(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/level-achievement?${qs(f)}`);
    const ctx=getCtx('chart-level-achieve');if(!ctx)return;
    const valid=data.filter(r=>r.avg_days&&r.cnt>0);
    charts['chart-level-achieve']=new Chart(ctx,{type:'bar',data:{labels:valid.map(r=>`Lv.${r.level_code}`),datasets:[{label:'평균 일수',data:valid.map(r=>r.avg_days),backgroundColor:C.set.slice(0,valid.length),borderRadius:4}]},options:{responsive:true,plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:10,weight:'bold'},formatter:(v,c)=>`${v}일 (${valid[c.dataIndex].cnt}명)`}},scales:{y:{title:{display:true,text:'일수',font:{size:11}}}}}});
  }catch{}
}

/* 5. Level Trend — improved readability (fix 5) */
async function renderLevelTrend(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/level-trend?${qs(f)}`);
    const ctx=getCtx('chart-level-trend');if(!ctx)return;
    const SCORE={'0':0,'1-1':0.5,'1-2':1,'1-3':1.5,'2':2,'2-2':3,'2-3':4,'2-4':5};
    const LEVELS=['0','1-1','1-2','1-3','2','2-2','2-3','2-4'];
    const quarters=[];let qd=new Date(2020,0);const now=new Date();
    while(qd<=now){const q=Math.floor(qd.getMonth()/3)+1;quarters.push(`${qd.getFullYear()} Q${q}`);qd.setMonth(qd.getMonth()+3);}
    const isSingle = data.length === 1;
    const levelCounts={};LEVELS.forEach(l=>levelCounts[l]=new Array(quarters.length).fill(0));
    const avgScores=new Array(quarters.length).fill(0);const totals=new Array(quarters.length).fill(0);
    data.forEach(eng=>{
      const hireDate=eng.HIRE?new Date(eng.HIRE):null;
      const achieves=[{level:'1-1',date:eng.l1?new Date(eng.l1):null},{level:'1-2',date:eng.l2?new Date(eng.l2):null},{level:'1-3',date:eng.l3?new Date(eng.l3):null},{level:'2',date:eng.l4?new Date(eng.l4):null},{level:'2-2',date:eng.l22?new Date(eng.l22):null},{level:'2-3',date:eng.l23?new Date(eng.l23):null},{level:'2-4',date:eng.l24?new Date(eng.l24):null}];
      quarters.forEach((ql,qi)=>{const[y,qn]=ql.split(' Q');const qEnd=new Date(+y,+qn*3,0);if(hireDate&&hireDate>qEnd)return;let curLevel='0';achieves.forEach(a=>{if(a.date&&a.date<=qEnd)curLevel=a.level;});levelCounts[curLevel][qi]++;avgScores[qi]+=SCORE[curLevel]||0;totals[qi]++;});
    });
    const avgLine=avgScores.map((s,i)=>totals[i]?+(s/totals[i]).toFixed(2):null);
    const colors={'0':'rgba(148,163,184,.5)','1-1':'rgba(96,165,250,.5)','1-2':'rgba(37,99,235,.5)','1-3':'rgba(29,78,216,.6)','2':'rgba(34,197,94,.5)','2-2':'rgba(245,158,11,.5)','2-3':'rgba(249,115,22,.5)','2-4':'rgba(239,68,68,.5)'};
    const datasets=[];
    if(isSingle) {
      // 개인: 레벨 점수만 꺾은선으로
      datasets.push({type:'line',label:`${data[0].NAME} 레벨 점수`,data:avgLine,borderColor:C.solid[0],borderWidth:3,tension:.3,pointRadius:4,pointBackgroundColor:C.solid[0],fill:false});
    } else {
      LEVELS.forEach(l=>datasets.push({label:`Lv.${l}`,data:levelCounts[l],backgroundColor:colors[l],stack:'a',yAxisID:'y1'}));
      datasets.push({type:'line',label:'평균 점수',data:avgLine,borderColor:C.solid[0],borderWidth:3,tension:.3,yAxisID:'y',pointRadius:2});
    }
    const scales = isSingle
      ? {y:{title:{display:true,text:'레벨 점수',font:{size:11}},min:0,max:5.5},x:{ticks:{maxRotation:45,font:{size:9}}}}
      : {y:{position:'left',title:{display:true,text:'평균 점수',font:{size:11}},min:0},y1:{position:'right',stacked:true,grid:{drawOnChartArea:false},title:{display:true,text:'인원',font:{size:11}},ticks:{stepSize:1}},x:{stacked:true,ticks:{maxRotation:45,font:{size:9}}}};
    charts['chart-level-trend']=new Chart(ctx,{type:'bar',data:{labels:quarters,datasets},options:{responsive:true,plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:10}}},datalabels:{display:false}},scales}});
  }catch(e){console.error(e);}
}

/* 6. Capability (fix 4 — add MULTI) */
async function renderCapability(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/capability?${qs(f)}`);
    const ctxS=getCtx('chart-capability-smm');
    const ctxT=getCtx('chart-capability-total');
    if(!ctxS && !ctxT) return;
    const m=data.monthly.filter(r=>r.ym>='2024-09');
    const goals=data.goals;
    const goalLine=m.map(r=>{const y=+r.ym.split('-')[0];return y===2025?goals.g25:goals.g26;});

    if(ctxS){
      charts['chart-capability-smm']=new Chart(ctxS,{type:'line',data:{labels:m.map(r=>r.ym),datasets:[
        {label:'SETUP',data:m.map(r=>r.avg_setup?+r.avg_setup.toFixed(3):null),borderColor:C.solid[0],backgroundColor:C.blueF,fill:true,tension:.3,pointRadius:2},
        {label:'MAINT',data:m.map(r=>r.avg_maint?+r.avg_maint.toFixed(3):null),borderColor:C.solid[1],tension:.3,pointRadius:2},
        {label:'MULTI',data:m.map(r=>r.avg_multi?+r.avg_multi.toFixed(3):null),borderColor:C.solid[4],borderDash:[4,4],tension:.3,pointRadius:2}
      ]},options:{responsive:true,plugins:{legend:{position:'top',labels:{font:{size:11}}},datalabels:{display:false}},scales:{y:{min:0,max:1,ticks:{callback:v=>(v*100).toFixed(0)+'%'}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
    }
    if(ctxT){
      charts['chart-capability-total']=new Chart(ctxT,{type:'line',data:{labels:m.map(r=>r.ym),datasets:[
        {label:'전체',data:m.map(r=>r.avg_total?+r.avg_total.toFixed(3):null),borderColor:C.solid[2],backgroundColor:C.greenF,fill:true,tension:.3,pointRadius:2},
        {label:'목표',data:goalLine,borderColor:C.solid[3],borderDash:[6,4],pointRadius:0,borderWidth:2}
      ]},options:{responsive:true,plugins:{legend:{position:'top',labels:{font:{size:11}}},datalabels:{display:false}},scales:{y:{min:0,max:1,ticks:{callback:v=>(v*100).toFixed(0)+'%'}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
    }
  }catch{}
}

/* 7. Equipment Capability (fix 6 — add avg, exclude non-users) */
async function renderEqCapa(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/eq-capability?${qs(f)}`);
    const ctx=getCtx('chart-eq-capa');if(!ctx)return;
    const valid=data.filter(r=>r.eng_count>0);
    charts['chart-eq-capa']=new Chart(ctx,{type:'bar',data:{labels:valid.map(r=>`${r.eq_name} (${r.eng_count}명)`),datasets:[
      {label:'SETUP',data:valid.map(r=>r.avg_setup?+r.avg_setup.toFixed(3):0),backgroundColor:C.blue,borderRadius:3},
      {label:'MAINT',data:valid.map(r=>r.avg_maint?+r.avg_maint.toFixed(3):0),backgroundColor:C.green,borderRadius:3},
      {label:'평균',data:valid.map(r=>r.avg_total?+r.avg_total.toFixed(3):0),backgroundColor:C.amber,borderRadius:3}
    ]},options:{responsive:true,plugins:{legend:{position:'top'},datalabels:{display:true,anchor:'end',align:'end',font:{size:9},formatter:v=>v?(v*100).toFixed(0)+'%':''}},scales:{y:{min:0,max:1,ticks:{callback:v=>(v*100)+'%'}}}}});
  }catch{}
}

/* 8. MPI Coverage (MPI>=2) */
async function renderMPICoverage(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/mpi-coverage?${qs(f)}`);
    const ctx=getCtx('chart-mpi-coverage');if(!ctx)return;
    const rows=(data.byEquipment||[]).filter(r=>Number(r.cnt||0)>0);
    charts['chart-mpi-coverage']=new Chart(ctx,{type:'bar',data:{labels:rows.map(r=>r.eq),datasets:[{label:'인원',data:rows.map(r=>r.cnt),backgroundColor:C.set.slice(0,rows.length),borderRadius:4}]},
      options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:11,weight:'bold'},formatter:(v)=>`${v}명`},tooltip:{callbacks:{afterLabel:(c)=>{const names=rows[c.dataIndex]?.names;return names?` ${names}`:'';}}}},scales:{x:{ticks:{stepSize:1}}}}});
  }catch(e){console.error(e);}
}

/* 9. Worklog (fix 8,9,10) */
async function renderWorklog(f) {
  try {
    const {data}=await axios.get(`${API}/analytics/worklog-stats?${qs(f)}`);
    // Monthly hours
    let ctx=getCtx('chart-monthly-hours');if(ctx){
      charts['chart-monthly-hours']=new Chart(ctx,{type:'bar',data:{labels:data.monthlyHours.map(r=>r.ym),datasets:[
        {type:'line',label:'건수',data:data.monthlyHours.map(r=>r.event_count),borderColor:C.solid[0],yAxisID:'y1',tension:.3,pointRadius:2},
        {label:'작업시간(분)',data:data.monthlyHours.map(r=>r.total_minutes),backgroundColor:C.greenF,borderColor:C.solid[1],borderWidth:1,borderRadius:3,yAxisID:'y'}
      ]},options:{responsive:true,plugins:{legend:{position:'top'},datalabels:{display:false}},scales:{y:{position:'left',title:{display:true,text:'분',font:{size:11}}},y1:{position:'right',grid:{drawOnChartArea:false},title:{display:true,text:'건',font:{size:11}},ticks:{stepSize:1}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
    }
    // Work Type — MAINT / RELOCATION / SET UP만
    ctx=getCtx('chart-worktype');if(ctx){
      const ORDER=['MAINT','RELOCATION','SET UP'];
      const map={};(data.byWorkType||[]).forEach(r=>map[r.label]=r.cnt);
      const labels=ORDER.filter(k=>map[k]);
      const vals=labels.map(k=>map[k]||0);
      const t=vals.reduce((s,x)=>s+x,0);
      charts['chart-worktype']=new Chart(ctx,{type:'bar',data:{labels, datasets:[{data:vals,backgroundColor:[C.blue,C.green,C.amber],borderRadius:4}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:11,weight:'bold'},formatter:(v)=>t?`${v}건 (${Math.round(v/t*100)}%)`:`${v}건`}}}});
    }
    // Work Sort — horizontal bar (fix 8)
    ctx=getCtx('chart-worksort');if(ctx){
      charts['chart-worksort']=new Chart(ctx,{type:'bar',data:{labels:data.byWorkType2.map(r=>r.label),datasets:[{data:data.byWorkType2.map(r=>r.cnt),backgroundColor:[C.red,C.blue,C.green,C.amber,C.slate],borderRadius:4}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:11,weight:'bold'},formatter:(v,c)=>{const t=data.byWorkType2.reduce((s,r)=>s+r.cnt,0);return`${v}건 (${Math.round(v/t*100)}%)`;}}}}});
    }
    // Shift
    ctx=getCtx('chart-shift');if(ctx){
      charts['chart-shift']=new Chart(ctx,{type:'doughnut',data:{labels:data.byShift.map(r=>r.label),datasets:[{data:data.byShift.map(r=>r.cnt),backgroundColor:[C.amber,C.blue]}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }
    // Overtime
    ctx=getCtx('chart-overtime');if(ctx){
      charts['chart-overtime']=new Chart(ctx,{type:'doughnut',data:{labels:data.byOvertime.map(r=>r.label),datasets:[{data:data.byOvertime.map(r=>r.cnt),backgroundColor:[C.green,C.red]}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }

    // Group/Site - Shift ratio
    ctx=getCtx('chart-shift-gs');if(ctx){
      const rows=(data.shiftByGroupSite||[]).filter(r=>r.total_cnt>0);
      const labels=rows.map(r=>r.label);
      const vals=rows.map(r=>+(r.afternoon_cnt/r.total_cnt*100).toFixed(1));
      charts['chart-shift-gs']=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'오후 근무 비율(%)',data:vals,backgroundColor:C.blue,borderRadius:4}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:11,weight:'bold'},formatter:v=>`${v}%`}},scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'}}}}});
    }

    // Group/Site - Overtime ratio
    ctx=getCtx('chart-overtime-gs');if(ctx){
      const rows=(data.overtimeByGroupSite||[]).filter(r=>r.total_cnt>0);
      const labels=rows.map(r=>r.label);
      const vals=rows.map(r=>+(r.overtime_cnt/r.total_cnt*100).toFixed(1));
      charts['chart-overtime-gs']=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label:'초과 근무 비율(%)',data:vals,backgroundColor:C.red,borderRadius:4}]},options:{responsive:true,indexAxis:'y',plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',font:{size:11,weight:'bold'},formatter:v=>`${v}%`}},scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'}}}}});
    }
    // Rework
    ctx=getCtx('chart-rework');if(ctx){
      charts['chart-rework']=new Chart(ctx,{type:'doughnut',data:{labels:data.reworkRatio.map(r=>r.label),datasets:[{data:data.reworkRatio.map(r=>r.cnt),backgroundColor:[C.red,C.slate]}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }
    // Rework reason — vertical bar (fix 9)
    ctx=getCtx('chart-rework-reason');if(ctx&&data.reworkReason.length){
      charts['chart-rework-reason']=new Chart(ctx,{type:'bar',data:{labels:data.reworkReason.map(r=>r.label),datasets:[{label:'건수',data:data.reworkReason.map(r=>r.cnt),backgroundColor:[C.red,C.amber,C.purple,C.slate,C.blue],borderRadius:4}]},options:{responsive:true,plugins:{legend:{display:false},datalabels:DL_BAR},scales:{y:{ticks:{stepSize:1}}}}});
    }
  }catch(e){console.error(e);}
}

/* Engineer Info (fix 17 — Lv.1 (1-1) format) */
async function showEngineerInfo(name) {
  const card=document.getElementById('eng-info');
  if(!name){card.style.display='none';return;}
  try {
    const {data}=await axios.get(`${API}/analytics/engineer-info?name=${encodeURIComponent(name)}`);
    if(!data){card.style.display='none';return;}
    card.style.display='';
    document.getElementById('ei-name').textContent=data.NAME;
    document.getElementById('ei-empid').textContent=data.EMPLOYEE_ID||'—';
    document.getElementById('ei-company').textContent=data.COMPANY||'—';
    document.getElementById('ei-groupsite').textContent=`${data.GROUP} / ${data.SITE}`;
    document.getElementById('ei-hire').textContent=fmtDate(data.HIRE);
    // Lv.2 (2-2) 형태 (fix 17)
    const lr = data['LEVEL(report)'] || '0';
    const lvInternal = data.LEVEL || 0;
    // level_report 그대로 표시
    document.getElementById('ei-level').textContent = `Lv.${lr}`;
    document.getElementById('ei-capa').textContent=data.CAPA?`${(data.CAPA*100).toFixed(1)}%`:'—';
    document.getElementById('ei-mpi').textContent=data.MPI??'—';
  }catch{card.style.display='none';}
}

/* Excel (fix 16 — more data) */
async function doExport() {
  try {
    toast('success','엑셀 준비 중...');
    const {data}=await axios.get(`${API}/analytics/export/excel?${qs(getFilters())}`);
    if(!data.length){toast('error','데이터 없음');return;}
    const hd=['이름','회사','사번','Group','Site','입사일','Level(report)','Level(내부)','Level(PSK)','Multi Level','Multi Level(PSK)','MAIN EQ','MULTI EQ',
      'SUPRA N SETUP','SUPRA N MAINT','SUPRA XP SETUP','SUPRA XP MAINT','INTEGER SETUP','INTEGER MAINT','PRECIA SETUP','PRECIA MAINT','ECOLITE SETUP','ECOLITE MAINT','GENEVA SETUP','GENEVA MAINT','HDW SETUP','HDW MAINT',
      'SETUP CAPA','MAINT CAPA','MULTI CAPA','CAPA','MPI',
      'SUPRA N MPI','SUPRA XP MPI','INTEGER MPI','PRECIA MPI','ECOLITE MPI','GENEVA MPI','HDW MPI',
      'Lv1-1 취득','Lv1-2 취득','Lv1-3 취득','Lv2 취득','Lv2-2 취득','Lv2-3 취득','Role'];
    const rows=data.map(r=>[r.NAME,r.COMPANY,r.EMPLOYEE_ID,r.GROUP,r.SITE,fmtDate(r.HIRE),r.level_report,r.level_internal,r.level_psk,r.multi_level,r.multi_level_psk,r['MAIN EQ'],r['MULTI EQ'],
      r['SUPRA N SET UP'],r['SUPRA N MAINT'],r['SUPRA XP SET UP'],r['SUPRA XP MAINT'],r['INTEGER SET UP'],r['INTEGER MAINT'],r['PRECIA SET UP'],r['PRECIA MAINT'],r['ECOLITE SET UP'],r['ECOLITE MAINT'],r['GENEVA SET UP'],r['GENEVA MAINT'],r['HDW SET UP'],r['HDW MAINT'],
      r['SET UP CAPA'],r['MAINT CAPA'],r['MULTI CAPA'],r.CAPA,r.MPI,
      r['SUPRA N MPI'],r['SUPRA XP MPI'],r['INTEGER MPI'],r['PRECIA MPI'],r['ECOLITE MPI'],r['GENEVA MPI'],r['HDW MPI'],
      fmtDate(r['Level1 Achieve']),fmtDate(r['Level2 Achieve']),fmtDate(r['Level3 Achieve']),fmtDate(r['Level4 Achieve']),fmtDate(r['Level2-2(B) Achieve']),fmtDate(r['Level2-2(A) Achieve']),r.role]);
    const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet([hd,...rows]);
    ws['!cols']=hd.map((h,i)=>({wch:Math.min(Math.max(h.length,...rows.slice(0,30).map(r=>String(r[i]||'').length))+2,25)}));
    XLSX.utils.book_append_sheet(wb,ws,'Engineers');
    XLSX.writeFile(wb,`engineers_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast('success','다운로드 완료');
  }catch{toast('error','엑셀 추출 실패');}
}

/* Add Engineer (fix 15) */
function initAddEngineer() {
  document.getElementById('btn-add-eng')?.addEventListener('click',()=>{
    document.getElementById('add-overlay').style.display='block';
    document.getElementById('add-modal').style.display='block';
  });
  const closeAdd=()=>{document.getElementById('add-overlay').style.display='none';document.getElementById('add-modal').style.display='none';};
  document.getElementById('a-cancel')?.addEventListener('click',closeAdd);
  document.getElementById('add-overlay')?.addEventListener('click',closeAdd);
  document.getElementById('a-save')?.addEventListener('click', async ()=>{
    const b={
      name:document.getElementById('a-name').value.trim(),
      company:document.getElementById('a-company').value,
      employee_id:document.getElementById('a-empid').value||null,
      group:document.getElementById('a-group').value,
      site:document.getElementById('a-site').value,
      hire_date:document.getElementById('a-hire').value||null,
      main_eq:document.getElementById('a-maineq').value||null,
      multi_eq:document.getElementById('a-multieq').value||null,
      g25: document.getElementById('a-g25')?.value ? Number(document.getElementById('a-g25').value) : null,
      g26: document.getElementById('a-g26')?.value ? Number(document.getElementById('a-g26').value) : null,
      lv_goal_25: document.getElementById('a-lvgoal25')?.value ? Number(document.getElementById('a-lvgoal25').value) : null,
      mlv_goal_25: document.getElementById('a-mlvgoal25')?.value ? Number(document.getElementById('a-mlvgoal25').value) : null,
    };
    if(!b.name){toast('error','이름을 입력하세요.');return;}
    try{await axios.post(`${API}/analytics/engineer`,b);toast('success',`${b.name} 등록 완료`);closeAdd();await initFilters();loadAll();}catch(e){toast('error',e.response?.data?.error||'등록 실패');}
  });
}

/* Edit Engineer */
function initEditEngineer() {
  const btn = document.getElementById('btn-edit-eng');
  const open = () => {
    document.getElementById('edit-overlay').style.display='block';
    document.getElementById('edit-modal').style.display='block';
  };
  const close = () => {
    document.getElementById('edit-overlay').style.display='none';
    document.getElementById('edit-modal').style.display='none';
  };
  btn?.addEventListener('click', async ()=>{
    const name = document.getElementById('f-name-input').dataset.selected || '';
    if(!name) return;
    try {
      const {data} = await axios.get(`${API}/analytics/engineer-info?name=${encodeURIComponent(name)}`);
      if(!data) { toast('error','엔지니어 정보를 찾을 수 없습니다.'); return; }
      document.getElementById('e-id').value = data.ID;
      document.getElementById('e-name').value = data.NAME||'';
      document.getElementById('e-company').value = data.COMPANY||'SE&S';
      document.getElementById('e-empid').value = data.EMPLOYEE_ID||'';
      document.getElementById('e-group').value = data.GROUP||'';
      document.getElementById('e-site').value = data.SITE||'';
      document.getElementById('e-hire').value = fmtDate(data.HIRE)==='—'?'':fmtDate(data.HIRE);
      document.getElementById('e-maineq').value = data['MAIN EQ']||'';
      document.getElementById('e-multieq').value = data['MULTI EQ']||'';
      document.getElementById('e-g25').value = (data.g25 ?? '');
      document.getElementById('e-g26').value = (data.g26 ?? '');
      document.getElementById('e-lvgoal25').value = (data.lv_goal_25 ?? '');
      document.getElementById('e-mlvgoal25').value = (data.mlv_goal_25 ?? '');
      document.getElementById('e-status').value = 'ACTIVE';
      document.getElementById('e-resign').value = '';
      open();
    } catch (e) {
      toast('error','엔지니어 정보 로드 실패');
    }
  });
  document.getElementById('e-cancel')?.addEventListener('click', close);
  document.getElementById('edit-overlay')?.addEventListener('click', close);

  document.getElementById('e-save')?.addEventListener('click', async ()=>{
    const id = document.getElementById('e-id').value;
    const status = document.getElementById('e-status').value;
    const body = {
      name: document.getElementById('e-name').value.trim(),
      company: document.getElementById('e-company').value,
      employee_id: document.getElementById('e-empid').value||null,
      group: document.getElementById('e-group').value,
      site: document.getElementById('e-site').value,
      hire_date: document.getElementById('e-hire').value||null,
      main_eq: document.getElementById('e-maineq').value||null,
      multi_eq: document.getElementById('e-multieq').value||null,
      g25: document.getElementById('e-g25').value===''?undefined:Number(document.getElementById('e-g25').value),
      g26: document.getElementById('e-g26').value===''?undefined:Number(document.getElementById('e-g26').value),
      lv_goal_25: document.getElementById('e-lvgoal25').value===''?undefined:Number(document.getElementById('e-lvgoal25').value),
      mlv_goal_25: document.getElementById('e-mlvgoal25').value===''?undefined:Number(document.getElementById('e-mlvgoal25').value),
    };
    if(!body.name){toast('error','이름을 입력하세요.');return;}
    try {
      if(status==='RESIGNED'){
        const resign_date = document.getElementById('e-resign').value;
        if(!resign_date){toast('error','퇴사일을 입력하세요.');return;}
        await axios.post(`${API}/analytics/engineer/resign`, { id, name: body.name, resign_date });
        toast('success','퇴사 처리 완료');
        close();
        await initFilters();
        // 선택 해제
        const ni=document.getElementById('f-name-input');ni.value='';ni.dataset.selected='';
        document.getElementById('btn-edit-eng').disabled=true;
        loadAll();
        return;
      }
      await axios.put(`${API}/analytics/engineer/${id}`, body);
      toast('success','저장 완료');
      close();
      await initFilters();
      // 선택 이름 유지
      document.getElementById('f-name-input').value = body.name;
      document.getElementById('f-name-input').dataset.selected = body.name;
      loadAll();
    } catch (e) {
      toast('error', e.response?.data?.error || '저장 실패');
    }
  });
}

/* Load All */
async function loadAll() {
  const f=getFilters();
  const name=f.name;
  const editBtn=document.getElementById('btn-edit-eng');
  if(editBtn) editBtn.disabled = !name;
  if(name)showEngineerInfo(name);else document.getElementById('eng-info').style.display='none';
  await Promise.allSettled([renderHeadCount(f),renderHR(f),renderLevelDist(f),renderLevelAchieve(f),renderLevelTrend(f),renderCapability(f),renderEqCapa(f),renderMPICoverage(f),renderWorklog(f)]);
}

/* Init */
document.addEventListener('DOMContentLoaded', async ()=>{
  if(!token){alert('로그인이 필요합니다.');location.href='./signin.html';return;}
  initNav();initTabs();initInfoBtns();initEngSearch();initAddEngineer();initEditEngineer();
  await initFilters();
  document.getElementById('btn-apply')?.addEventListener('click',loadAll);
  document.getElementById('btn-reset')?.addEventListener('click',()=>{
    ['f-company','f-group','f-site'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    const ni=document.getElementById('f-name-input');ni.value='';ni.dataset.selected='';
    document.getElementById('eng-info').style.display='none';
    const eb=document.getElementById('btn-edit-eng'); if(eb) eb.disabled=true;
    loadAll();
  });
  document.getElementById('btn-export')?.addEventListener('click',doExport);
  loadAll();
});
