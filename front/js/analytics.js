'use strict';
const API='http://3.37.73.151:3001';
const token=localStorage.getItem('x-access-token')||'';
axios.defaults.headers.common['x-access-token']=token;
const me=(()=>{try{return JSON.parse(atob(token.split('.')[1]));}catch{return null;}})();
const isAdmin=u=>{const r=(u?.role||u?.ROLE||u?.user_role||u?.userRole||'').toString().toLowerCase();return['admin','administrator','super','root'].includes(r)||u?.is_admin===1||u?.isAdmin===true||u?.admin===true;};
if(!token){location.href='./signin.html';}
if(token&&!isAdmin(me)){
  document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,Segoe UI,Roboto,Apple SD Gothic Neo,Noto Sans KR,sans-serif;">관리자만 접근 가능한 페이지입니다.</div>';
  throw new Error('admin_only');
}

Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels',{display:false});

const C={navy:'rgba(15,23,42,.8)',navyF:'rgba(15,23,42,.10)',blue:'rgba(59,130,246,.70)',blueF:'rgba(59,130,246,.12)',teal:'rgba(20,184,166,.62)',amber:'rgba(245,158,11,.62)',rose:'rgba(244,63,94,.62)',slate:'rgba(100,116,139,.58)'};
const charts={};
let allEngineers=[];

const toast=(type,msg)=>{const r=document.getElementById('toast-root');if(!r)return;const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=msg;r.appendChild(el);setTimeout(()=>el.remove(),3500);};
const fmtDate=d=>d?String(d).split('T')[0]:'';
const getFilters=()=>({company:document.getElementById('f-company').value,group:document.getElementById('f-group').value,site:document.getElementById('f-site').value,name:document.getElementById('f-name-input').dataset.selected||''});
const qs=f=>{const p=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v)p.set(k,v);});return p.toString();};
const destroy=id=>{if(charts[id]){charts[id].destroy();delete charts[id];}};
const ctx=id=>{destroy(id);return document.getElementById(id)?.getContext('2d');};
const headroom=(m,r=0.12,min=1)=>m+Math.max(min,Math.ceil(m*r));
const range01=vals=>{const v=vals.filter(x=>x!==null&&x!==undefined&&isFinite(x));if(!v.length)return{min:0,max:1};let mn=Math.min(...v),mx=Math.max(...v);const pad=mn===mx?Math.max(.03,mx*.08):Math.max(.03,(mx-mn)*.25);mn=Math.max(0,mn-pad);mx=Math.min(1,mx+pad);return{min:mn,max:mx};};

const DL_INT={display:true,anchor:'end',align:'end',offset:2,clip:false,font:{size:10,weight:'bold'},color:'#0f172a',formatter:v=>(v||v===0)?v:''};
const DL_PCT={display:true,font:{size:11,weight:'bold'},color:'#fff',formatter:(v,c)=>{const t=c.dataset.data.reduce((s,x)=>s+x,0);return t?`${Math.round(v/t*100)}%`:'';}};
const DL_PCT_LINE={display:(c)=>{const v=c.dataset.data?.[c.dataIndex];if(v==null)return false;const n=c.dataset.data.length;return n>14?(c.dataIndex%2===0||c.dataIndex===n-1):true;},align:'top',anchor:'end',offset:4,clip:false,font:{size:10,weight:'bold'},color:'#0f172a',formatter:v=>v==null?'':`${Math.round(v*1000)/10}%`};
const DL_SCORE_LINE={display:(c)=>{const v=c.dataset.data?.[c.dataIndex];if(v==null)return false;const n=c.dataset.data.length;return n>12?(c.dataIndex%2===0||c.dataIndex===n-1):true;},align:'top',anchor:'end',offset:4,clip:false,font:{size:10,weight:'bold'},color:'#0f172a',formatter:v=>v==null?'':String(v)};

function initNav(){
  document.querySelectorAll('.sign-container.unsigned').forEach(e=>e.classList.add('hidden'));
  document.querySelectorAll('.sign-container.signed').forEach(e=>e.classList.remove('hidden'));
  document.getElementById('sign-out')?.addEventListener('click',()=>{localStorage.removeItem('x-access-token');location.href='./signin.html';});
  document.querySelector('.menu-btn')?.addEventListener('click',()=>document.querySelector('.menu-bar')?.classList.toggle('open'));
}
function initTabs(){
  document.querySelectorAll('.cat-tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.cat-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.cat-section').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.querySelector(`.cat-section[data-cat="${t.dataset.cat}"]`)?.classList.add('active');
  }));
}
function initInfoBtns(){
  document.querySelectorAll('.info-btn').forEach(b=>b.addEventListener('click',()=>{document.getElementById('desc-text').textContent=b.dataset.desc||'';document.getElementById('desc-popup').style.display='flex';}));
  document.getElementById('desc-close')?.addEventListener('click',()=>document.getElementById('desc-popup').style.display='none');
  document.getElementById('desc-popup')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});
}

async function initFilters(){
  try{
    const {data}=await axios.get(`${API}/analytics/filters`);
    const fill=(id,arr)=>{const s=document.getElementById(id);const first=s.querySelector('option');s.innerHTML='';if(first)s.appendChild(first);(arr||[]).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o);});};
    fill('f-company',data.companies);fill('f-group',data.groups);fill('f-site',data.sites);
    allEngineers=data.engineers||[];
  }catch(e){console.error(e);toast('error','필터 로드 실패');}
}

function initEngSearch(){
  const input=document.getElementById('f-name-input');
  const dd=document.getElementById('eng-dropdown');
  const gs=()=>({g:document.getElementById('f-group').value,s:document.getElementById('f-site').value});
  input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    const {g,s}=gs();
    let list=allEngineers;
    if(g)list=list.filter(e=>e.grp===g);
    if(s)list=list.filter(e=>e.SITE===s);
    if(q)list=list.filter(e=>e.NAME.toLowerCase().includes(q));
    if(!q||!list.length){dd.classList.remove('open');return;}
    dd.innerHTML=list.slice(0,16).map(e=>`<div class="eng-opt" data-name="${e.NAME}"><span>${e.NAME}</span><span class="eng-opt-meta">${e.grp} · ${e.SITE}</span></div>`).join('');
    dd.classList.add('open');
    dd.querySelectorAll('.eng-opt').forEach(o=>o.addEventListener('click',()=>{input.value=o.dataset.name;input.dataset.selected=o.dataset.name;dd.classList.remove('open');document.getElementById('btn-edit-eng').disabled=false;}));
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.eng-search-wrap'))dd.classList.remove('open');});
}

async function showEngineerInfo(name){
  const card=document.getElementById('eng-info');
  if(!name){card.style.display='none';return;}
  try{
    const {data}=await axios.get(`${API}/analytics/engineer-info?name=${encodeURIComponent(name)}`);
    if(!data){card.style.display='none';return;}
    card.style.display='';
    document.getElementById('ei-name').textContent=data.NAME||'—';
    document.getElementById('ei-empid').textContent=data.EMPLOYEE_ID||'—';
    document.getElementById('ei-company').textContent=data.COMPANY||'—';
    document.getElementById('ei-groupsite').textContent=`${data.GROUP||data['GROUP']||'—'} / ${data.SITE||'—'}`;
    document.getElementById('ei-hire').textContent=fmtDate(data.HIRE)||'—';
    document.getElementById('ei-level').textContent=`Lv.${data['LEVEL(report)']||'0'}`;
    document.getElementById('ei-capa').textContent=(data.CAPA||data.CAPA===0)?`${(Number(data.CAPA)*100).toFixed(1)}%`:'—';
    document.getElementById('ei-mpi').textContent=(data.MPI||data.MPI===0)?String(data.MPI):'—';
  }catch(e){console.error(e);}
}

async function doExport(){
  try{
    const {data}=await axios.get(`${API}/analytics/export/excel?${qs(getFilters())}`);
    if(!Array.isArray(data)||!data.length){toast('error','데이터가 없습니다.');return;}
    const rows=data.map(r=>{const o={...r};Object.keys(o).forEach(k=>{if(k.toLowerCase().includes('achieve')||k==='HIRE')o[k]=fmtDate(o[k]);});return o;});
    const ws=XLSX.utils.json_to_sheet(rows);
    const headers=Object.keys(rows[0]);
    ws['!cols']=headers.map(h=>({wch:Math.min(26,Math.max(10,h.length+2))}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Engineers');
    XLSX.writeFile(wb,`engineers_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast('success','다운로드 완료');
  }catch(e){console.error(e);toast('error','엑셀 추출 실패');}
}

// ── Charts
async function renderHeadCount(f){
  try{
    const {data}=await axios.get(`${API}/analytics/headcount?${qs(f)}`);
    const c=ctx('chart-headcount');if(!c)return;
    const now=new Date();const labels=[];let d=new Date(2023,0,1);
    while(d<=now){labels.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()+1);}
    const hires={},hn={};(data.hires||[]).forEach(r=>{hires[r.ym]=Number(r.cnt)||0;hn[r.ym]=r.names;});
    const resigns={},rn={};(data.resigns||[]).forEach(r=>{resigns[r.ym]=Number(r.cnt)||0;rn[r.ym]=r.names;});

    let run=Number(data.currentTotal)||0;const rev=[];
    for(let i=labels.length-1;i>=0;i--){const ym=labels[i];rev.push(Math.max(0,run));run=run-(hires[ym]||0)+(resigns[ym]||0);if(run<0)run=0;}
    const hc=rev.reverse();

    const maxY=headroom(Math.max(...hc,0),.14,2);
    const maxY1=headroom(Math.max(...labels.map(l=>hires[l]||0),...labels.map(l=>resigns[l]||0),0),.25,1);

    charts['chart-headcount']=new Chart(c,{type:'bar',data:{labels,datasets:[
      {type:'line',label:'재직 인원',data:hc,borderColor:C.navy,backgroundColor:C.navyF,borderWidth:2,tension:.25,pointRadius:1,fill:true,yAxisID:'y',
        datalabels:{...DL_INT,display:(ctx)=>{const n=ctx.dataset.data.length;return n>18?(ctx.dataIndex%3===0||ctx.dataIndex===n-1):true;}}},
      {label:'입사',data:labels.map(l=>hires[l]||0),backgroundColor:C.teal,borderRadius:4,yAxisID:'y1',datalabels:{display:false}},
      {label:'퇴사',data:labels.map(l=>resigns[l]||0),backgroundColor:C.rose,borderRadius:4,yAxisID:'y1',datalabels:{display:false}},
    ]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top',labels:{font:{size:11}}},tooltip:{callbacks:{afterLabel:(c)=>{const ym=labels[c.dataIndex];if(c.dataset.label==='입사'&&hn[ym])return ` ${hn[ym]}`;if(c.dataset.label==='퇴사'&&rn[ym])return ` ${rn[ym]}`;return'';}}}},scales:{y:{min:0,max:maxY,ticks:{stepSize:1},title:{display:true,text:'재직'}},y1:{position:'right',min:0,max:maxY1,grid:{drawOnChartArea:false},ticks:{stepSize:1},title:{display:true,text:'입사/퇴사'}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
  }catch(e){console.error(e);}
}

async function renderHR(f){
  try{
    const {data}=await axios.get(`${API}/analytics/hr-distribution?${qs(f)}`);
    let c=ctx('chart-company');
    if(c){charts['chart-company']=new Chart(c,{type:'doughnut',data:{labels:(data.byCompany||[]).map(r=>r.label||'미입력'),datasets:[{data:(data.byCompany||[]).map(r=>Number(r.cnt)||0),backgroundColor:[C.navy,C.slate,C.blue],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});}

    c=ctx('chart-experience');
    if(c){
      const rows=data.byExp||[];const maxX=headroom(Math.max(...rows.map(r=>Number(r.cnt)||0),0),.2,1);
      charts['chart-experience']=new Chart(c,{type:'bar',data:{labels:rows.map(r=>r.label),datasets:[{label:'인원',data:rows.map(r=>Number(r.cnt)||0),backgroundColor:C.blue,borderRadius:5}]},options:{responsive:true,indexAxis:'y',layout:{padding:{right:18}},plugins:{legend:{display:false},datalabels:DL_INT},scales:{x:{min:0,max:maxX,ticks:{stepSize:1}}}}});
    }

    c=ctx('chart-groupsite');
    if(c){
      const rows=(data.byGroupSite||[]).slice().sort((a,b)=>(Number(b.cnt)||0)-(Number(a.cnt)||0)).slice(0,20);
      const maxX=headroom(Math.max(...rows.map(r=>Number(r.cnt)||0),0),.2,1);
      charts['chart-groupsite']=new Chart(c,{type:'bar',data:{labels:rows.map(r=>r.label),datasets:[{label:'인원',data:rows.map(r=>Number(r.cnt)||0),backgroundColor:C.slate,borderRadius:5}]},options:{responsive:true,indexAxis:'y',layout:{padding:{right:18}},plugins:{legend:{display:false},datalabels:DL_INT},scales:{x:{min:0,max:maxX,ticks:{stepSize:1}},y:{ticks:{font:{size:10}}}}}});
    }
  }catch(e){console.error(e);}
}

async function renderLevelDist(f){
  try{
    const {data}=await axios.get(`${API}/analytics/level-distribution?${qs(f)}`);
    const c=ctx('chart-level-dist');if(!c)return;
    const rows=(data||[]).map(r=>({label:String(r.label),cnt:Number(r.cnt)||0}));
    const total=rows.reduce((s,r)=>s+r.cnt,0)||1;
    const score={'0':0,'1':1,'2':2,'2-2':3,'2-3':4,'2-4':5};
    const avg=rows.reduce((s,r)=>s+(score[r.label]??0)*r.cnt,0)/total;
    const near=Object.entries(score).sort((a,b)=>Math.abs(a[1]-avg)-Math.abs(b[1]-avg))[0]?.[0]||'0';
    document.getElementById('avg-level-badge').textContent=`평균 Lv.${near} (${avg.toFixed(2)}점)`;
    const maxY=headroom(Math.max(...rows.map(r=>r.cnt),0),.2,1);
    charts['chart-level-dist']=new Chart(c,{type:'bar',data:{labels:rows.map(r=>`Lv.${r.label}`),datasets:[{label:'인원',data:rows.map(r=>r.cnt),backgroundColor:C.navyF,borderColor:C.navy,borderWidth:1,borderRadius:5}]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',clip:false,font:{size:10,weight:'bold'},color:'#0f172a',formatter:v=>`${v}명 (${Math.round(v/total*100)}%)`}},scales:{y:{min:0,max:maxY,ticks:{stepSize:1}}}}});
  }catch(e){console.error(e);}
}

async function renderLevelAchieve(f){
  try{
    const {data}=await axios.get(`${API}/analytics/level-achievement?${qs(f)}`);
    const c=ctx('chart-level-achieve');if(!c)return;
    const rows=(data||[]).filter(r=>r.avg_days!=null&&Number(r.cnt||0)>0);
    const maxY=headroom(Math.max(...rows.map(r=>Number(r.avg_days)||0),0),.18,8);
    charts['chart-level-achieve']=new Chart(c,{type:'bar',data:{labels:rows.map(r=>`Lv.${r.level_code}`),datasets:[{label:'평균 일수',data:rows.map(r=>Number(r.avg_days)||0),backgroundColor:C.blueF,borderColor:C.blue,borderWidth:1,borderRadius:5}]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{display:false},datalabels:{display:true,anchor:'end',align:'end',clip:false,font:{size:10,weight:'bold'},color:'#0f172a',formatter:(v,ctx)=>`${v}일 (${rows[ctx.dataIndex].cnt}명)`}},scales:{y:{min:0,max:maxY,title:{display:true,text:'일수'}}}}});
  }catch(e){console.error(e);}
}

async function renderLevelTrend(f){
  try{
    const {data}=await axios.get(`${API}/analytics/level-trend?${qs(f)}`);
    const c=ctx('chart-level-trend');if(!c)return;
    const SCORE={'0':0,'1-1':.5,'1-2':1,'1-3':1.5,'2':2,'2-2':3,'2-3':4,'2-4':5};
    const LEVELS=['0','1-1','1-2','1-3','2','2-2','2-3','2-4'];

    const quarters=[];let qd=new Date(2020,0,1);const now=new Date();
    while(qd<=now){const q=Math.floor(qd.getMonth()/3)+1;quarters.push(`${qd.getFullYear()} Q${q}`);qd.setMonth(qd.getMonth()+3);}

    const isSingle=Array.isArray(data)&&data.length===1;
    const counts={};LEVELS.forEach(l=>counts[l]=new Array(quarters.length).fill(0));
    const sum=new Array(quarters.length).fill(0);const tot=new Array(quarters.length).fill(0);

    (data||[]).forEach(eng=>{
      const hire=eng.HIRE?new Date(eng.HIRE):null;
      let d22=eng.l22?new Date(eng.l22):null;
      let d23=eng.l23?new Date(eng.l23):null;
      let d24=eng.l24?new Date(eng.l24):null;
      const lr=String(eng.level_report||'');
      if(lr==='2-3'&&!d23&&d24){d23=d24;d24=null;} // 2-3 보정

      const ach=[
        {l:'1-1',d:eng.l1?new Date(eng.l1):null},{l:'1-2',d:eng.l2?new Date(eng.l2):null},{l:'1-3',d:eng.l3?new Date(eng.l3):null},{l:'2',d:eng.l4?new Date(eng.l4):null},
        {l:'2-2',d:d22},{l:'2-3',d:d23},{l:'2-4',d:d24}
      ];

      quarters.forEach((ql,qi)=>{
        const [y,qn]=ql.split(' Q');const qEnd=new Date(+y,+qn*3,0);
        if(hire&&hire>qEnd)return;
        let cur='0';ach.forEach(a=>{if(a.d&&a.d<=qEnd)cur=a.l;});
        counts[cur][qi]++;sum[qi]+=SCORE[cur]||0;tot[qi]++;
      });
    });

    const avg=sum.map((s,i)=>tot[i]?+(s/tot[i]).toFixed(2):null);
    const maxCnt=Math.max(...LEVELS.map(l=>Math.max(...counts[l])),0);

    if(isSingle){
      charts['chart-level-trend']=new Chart(c,{
        type:'line',
        data:{labels:quarters,datasets:[{label:`${data[0].NAME} 평균 점수`,data:avg,borderColor:C.navy,backgroundColor:C.navyF,borderWidth:2,tension:.25,pointRadius:2,fill:false,datalabels:DL_SCORE_LINE}]},
        options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top'}},scales:{y:{min:0,max:5.5,title:{display:true,text:'레벨 점수'}},x:{ticks:{maxRotation:45,font:{size:9}}}}}
      });
      return;
    }

    const color={
      '0':'rgba(100,116,139,.20)','1-1':'rgba(59,130,246,.20)','1-2':'rgba(59,130,246,.32)','1-3':'rgba(59,130,246,.44)',
      '2':'rgba(20,184,166,.28)','2-2':'rgba(20,184,166,.38)','2-3':'rgba(245,158,11,.34)','2-4':'rgba(244,63,94,.28)'
    };
    const ds=LEVELS.map(l=>({type:'bar',label:`Lv.${l}`,data:counts[l],backgroundColor:color[l],stack:'a',yAxisID:'y1',datalabels:{display:false}}));
    ds.push({type:'line',label:'평균 점수',data:avg,borderColor:C.navy,borderWidth:2,tension:.25,pointRadius:1,fill:false,yAxisID:'y',datalabels:DL_SCORE_LINE});

    charts['chart-level-trend']=new Chart(c,{type:'bar',data:{labels:quarters,datasets:ds},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{min:0,max:5.5,title:{display:true,text:'평균 점수'}},y1:{position:'right',stacked:true,min:0,max:headroom(maxCnt,.12,2),grid:{drawOnChartArea:false},ticks:{stepSize:1},title:{display:true,text:'인원'}},x:{stacked:true,ticks:{maxRotation:45,font:{size:9}}}}}});
  }catch(e){console.error(e);}
}

async function renderCapability(f){
  try{
    const {data}=await axios.get(`${API}/analytics/capability?${qs(f)}`);
    const rows=(data.monthly||[]).filter(r=>r.ym>='2024-09');
    const labels=rows.map(r=>r.ym);
    const setup=rows.map(r=>r.avg_setup==null?null:+Number(r.avg_setup).toFixed(3));
    const maint=rows.map(r=>r.avg_maint==null?null:+Number(r.avg_maint).toFixed(3));
    const multi=rows.map(r=>r.avg_multi==null?null:+Number(r.avg_multi).toFixed(3));
    const total=rows.map(r=>r.avg_total==null?null:+Number(r.avg_total).toFixed(3));
    const g25=data.goals?.g25??null, g26=data.goals?.g26??null;
    const goal=labels.map(ym=>{const y=Number(ym.split('-')[0]);return y===2025?g25:y===2026?g26:null;}).map(v=>v==null?null:+Number(v).toFixed(3));

    let c=ctx('chart-capability-smm');
    if(c){
      const r=range01([...setup,...maint,...multi].filter(v=>v!=null));
      charts['chart-capability-smm']=new Chart(c,{type:'line',data:{labels,datasets:[
        {label:'SETUP',data:setup,borderColor:C.blue,backgroundColor:C.blueF,tension:.25,pointRadius:2,fill:false,datalabels:DL_PCT_LINE},
        {label:'MAINT',data:maint,borderColor:C.teal,tension:.25,pointRadius:2,fill:false,datalabels:DL_PCT_LINE},
        {label:'MULTI',data:multi,borderColor:C.amber,tension:.25,pointRadius:2,fill:false,borderDash:[5,4],datalabels:DL_PCT_LINE}
      ]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top',labels:{font:{size:11}}}},scales:{y:{min:r.min,max:r.max,ticks:{callback:v=>`${Math.round(v*100)}%`}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
    }

    c=ctx('chart-capability-total');
    if(c){
      const r=range01([...total,...goal].filter(v=>v!=null));
      charts['chart-capability-total']=new Chart(c,{type:'line',data:{labels,datasets:[
        {label:'전체',data:total,borderColor:C.navy,backgroundColor:C.navyF,borderWidth:2,tension:.25,pointRadius:2,fill:true,datalabels:DL_PCT_LINE},
        {label:'목표',data:goal,borderColor:C.slate,borderWidth:2,pointRadius:0,borderDash:[6,4],fill:false,datalabels:{display:false}}
      ]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top',labels:{font:{size:11}}}},scales:{y:{min:r.min,max:r.max,ticks:{callback:v=>`${Math.round(v*100)}%`}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
    }
  }catch(e){console.error(e);}
}

async function renderEqCapa(f){
  try{
    const {data}=await axios.get(`${API}/analytics/eq-capability?${qs(f)}`);
    const c=ctx('chart-eq-capa');if(!c)return;
    const rows=(data||[]).filter(r=>Number(r.eng_count||0)>0);
    const labels=rows.map(r=>`${r.eq_name} (${r.eng_count}명)`);
    const s=rows.map(r=>r.avg_setup?+Number(r.avg_setup).toFixed(3):0);
    const m=rows.map(r=>r.avg_maint?+Number(r.avg_maint).toFixed(3):0);
    const a=rows.map(r=>r.avg_total?+Number(r.avg_total).toFixed(3):0);
    const mx=Math.max(...s,...m,...a,0);const maxY=Math.min(1,mx+.08);
    charts['chart-eq-capa']=new Chart(c,{type:'bar',data:{labels,datasets:[
      {label:'SETUP',data:s,backgroundColor:C.blue,borderRadius:4},
      {label:'MAINT',data:m,backgroundColor:C.teal,borderRadius:4},
      {label:'평균',data:a,backgroundColor:C.slate,borderRadius:4}
    ]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top'},datalabels:{display:true,anchor:'end',align:'end',clip:false,font:{size:9,weight:'bold'},color:'#0f172a',formatter:v=>v?`${Math.round(v*100)}%`:''}},scales:{y:{min:0,max:maxY,ticks:{callback:v=>`${Math.round(v*100)}%`}},x:{ticks:{font:{size:10}}}}}});
  }catch(e){console.error(e);}
}

async function renderWorklog(f){
  try{
    const {data}=await axios.get(`${API}/analytics/worklog-stats?${qs(f)}`);

    let c=ctx('chart-monthly-hours');
    if(c){
      const labels=(data.monthlyHours||[]).map(r=>r.ym);
      const hours=(data.monthlyHours||[]).map(r=>Number(r.total_minutes||0)/60);
      const events=(data.monthlyHours||[]).map(r=>Number(r.event_count||0));
      const maxH=headroom(Math.max(...hours,0),.14,5);const maxE=headroom(Math.max(...events,0),.2,3);
      charts['chart-monthly-hours']=new Chart(c,{type:'bar',data:{labels,datasets:[
        {label:'총 작업시간(Hr)',data:hours.map(v=>+v.toFixed(1)),backgroundColor:C.slate,borderRadius:4,yAxisID:'y',datalabels:{...DL_INT,formatter:v=>v?String(v):''}},
        {type:'line',label:'건수',data:events,borderColor:C.navy,backgroundColor:C.navyF,tension:.25,pointRadius:1,fill:false,yAxisID:'y1',datalabels:{display:false}}
      ]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{position:'top',labels:{font:{size:11}}}},scales:{y:{min:0,max:maxH,title:{display:true,text:'시간(Hr)'}},y1:{position:'right',min:0,max:maxE,grid:{drawOnChartArea:false},ticks:{stepSize:1},title:{display:true,text:'건수'}},x:{ticks:{maxRotation:45,font:{size:9}}}}}});
    }

    c=ctx('chart-worktype');
    if(c){
      const allow=new Set(['MAINT','SET UP','RELOCATION']);
      const rows=(data.byWorkType||[]).filter(r=>allow.has(String(r.label||'')));
      charts['chart-worktype']=new Chart(c,{type:'doughnut',data:{labels:rows.map(r=>r.label),datasets:[{data:rows.map(r=>Number(r.cnt)||0),backgroundColor:[C.teal,C.blue,C.amber],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }

    c=ctx('chart-worksort');
    if(c){
      const rows=(data.byWorkType2||[]);const vals=rows.map(r=>Number(r.cnt)||0);const maxY=headroom(Math.max(...vals,0),.2,1);
      charts['chart-worksort']=new Chart(c,{type:'bar',data:{labels:rows.map(r=>r.label),datasets:[{label:'건수',data:vals,backgroundColor:C.blue,borderRadius:4}]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{display:false},datalabels:DL_INT},scales:{y:{min:0,max:maxY,ticks:{stepSize:1}}}}});
    }

    c=ctx('chart-shift');
    if(c){
      const rows=data.byShift||[];charts['chart-shift']=new Chart(c,{type:'doughnut',data:{labels:rows.map(r=>r.label),datasets:[{data:rows.map(r=>Number(r.cnt)||0),backgroundColor:[C.blue,C.slate],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }

    c=ctx('chart-overtime');
    if(c){
      const rows=data.byOvertime||[];charts['chart-overtime']=new Chart(c,{type:'doughnut',data:{labels:rows.map(r=>r.label),datasets:[{data:rows.map(r=>Number(r.cnt)||0),backgroundColor:[C.slate,C.rose],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }

    c=ctx('chart-rework');
    if(c){
      const rows=data.reworkRatio||[];charts['chart-rework']=new Chart(c,{type:'doughnut',data:{labels:rows.map(r=>r.label),datasets:[{data:rows.map(r=>Number(r.cnt)||0),backgroundColor:[C.rose,C.slate],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom'},datalabels:DL_PCT}}});
    }

    c=ctx('chart-rework-reason');
    if(c){
      const rows=data.reworkReason||[];const vals=rows.map(r=>Number(r.cnt)||0);const maxY=headroom(Math.max(...vals,0),.2,1);
      charts['chart-rework-reason']=new Chart(c,{type:'bar',data:{labels:rows.map(r=>r.label),datasets:[{label:'건수',data:vals,backgroundColor:C.slate,borderRadius:4}]},options:{responsive:true,layout:{padding:{top:18}},plugins:{legend:{display:false},datalabels:DL_INT},scales:{y:{min:0,max:maxY,ticks:{stepSize:1}}}}});
    }

  }catch(e){console.error(e);}
}

// ── Modals
function initAddEngineer(){
  const open=()=>{document.getElementById('add-overlay').style.display='block';document.getElementById('add-modal').style.display='block';};
  const close=()=>{document.getElementById('add-overlay').style.display='none';document.getElementById('add-modal').style.display='none';};
  document.getElementById('btn-add-eng')?.addEventListener('click',open);
  document.getElementById('a-cancel')?.addEventListener('click',close);
  document.getElementById('add-overlay')?.addEventListener('click',close);
  document.getElementById('a-save')?.addEventListener('click',async()=>{
    const b={
      name:document.getElementById('a-name').value.trim(),company:document.getElementById('a-company').value,employee_id:document.getElementById('a-empid').value||null,
      group:document.getElementById('a-group').value,site:document.getElementById('a-site').value,hire_date:document.getElementById('a-hire').value||null,
      main_eq:document.getElementById('a-maineq').value||null,multi_eq:document.getElementById('a-multieq').value||null,
      g26:document.getElementById('a-g26').value===''?null:Number(document.getElementById('a-g26').value),
      lv_goal_26:document.getElementById('a-lvgoal26').value===''?null:Number(document.getElementById('a-lvgoal26').value)
    };
    if(!b.name){toast('error','이름을 입력하세요.');return;}
    try{await axios.post(`${API}/analytics/engineer`,b);toast('success',`${b.name} 등록 완료`);close();await initFilters();loadAll();}
    catch(e){toast('error',e.response?.data?.error||'등록 실패');}
  });
}

function initEditEngineer(){
  const open=async()=>{
    const name=document.getElementById('f-name-input').dataset.selected||'';if(!name)return;
    try{
      const {data}=await axios.get(`${API}/analytics/engineer-info?name=${encodeURIComponent(name)}`);
      if(!data){toast('error','엔지니어 정보를 찾을 수 없습니다.');return;}
      document.getElementById('e-id').value=data.ID;
      document.getElementById('e-name').value=data.NAME||'';
      document.getElementById('e-company').value=data.COMPANY||'SE&S';
      document.getElementById('e-empid').value=data.EMPLOYEE_ID||'';
      document.getElementById('e-group').value=data.GROUP||data['GROUP']||'PEE1';
      document.getElementById('e-site').value=data.SITE||'PT';
      document.getElementById('e-hire').value=fmtDate(data.HIRE);
      document.getElementById('e-maineq').value=data['MAIN EQ']||'';
      document.getElementById('e-multieq').value=data['MULTI EQ']||'';
      document.getElementById('e-g26').value=(data.g26??'')==null?'':(data.g26??'');
      document.getElementById('e-lvgoal26').value=(data.lv_goal_26??'')==null?'':(data.lv_goal_26??'');
      document.getElementById('e-level-report').value=data['LEVEL(report)']||'';
      document.getElementById('e-l1').value=fmtDate(data['Level1 Achieve']);
      document.getElementById('e-l2').value=fmtDate(data['Level2 Achieve']);
      document.getElementById('e-l3').value=fmtDate(data['Level3 Achieve']);
      document.getElementById('e-l4').value=fmtDate(data['Level4 Achieve']);
      document.getElementById('e-l22').value=fmtDate(data['Level2-2(B) Achieve']);
      document.getElementById('e-l23').value=fmtDate(data['Level2-2(A) Achieve']);
      document.getElementById('e-l24').value=fmtDate(data['Level2-3(B) Achieve']);
      document.getElementById('edit-overlay').style.display='block';
      document.getElementById('edit-modal').style.display='block';
    }catch(e){console.error(e);toast('error','불러오기 실패');}
  };
  const close=()=>{document.getElementById('edit-overlay').style.display='none';document.getElementById('edit-modal').style.display='none';};
  document.getElementById('btn-edit-eng')?.addEventListener('click',open);
  document.getElementById('e-cancel')?.addEventListener('click',close);
  document.getElementById('edit-overlay')?.addEventListener('click',close);
  document.getElementById('e-save')?.addEventListener('click',async()=>{
    const id=document.getElementById('e-id').value;if(!id)return;
    const body={
      name:document.getElementById('e-name').value.trim(),company:document.getElementById('e-company').value,employee_id:document.getElementById('e-empid').value||null,
      group:document.getElementById('e-group').value,site:document.getElementById('e-site').value,hire_date:document.getElementById('e-hire').value||null,
      main_eq:document.getElementById('e-maineq').value||null,multi_eq:document.getElementById('e-multieq').value||null,
      g26:document.getElementById('e-g26').value===''?null:Number(document.getElementById('e-g26').value),
      lv_goal_26:document.getElementById('e-lvgoal26').value===''?null:Number(document.getElementById('e-lvgoal26').value),
      level_report:document.getElementById('e-level-report').value||null,
      l1:document.getElementById('e-l1').value||null,l2:document.getElementById('e-l2').value||null,l3:document.getElementById('e-l3').value||null,l4:document.getElementById('e-l4').value||null,
      l22:document.getElementById('e-l22').value||null,l23:document.getElementById('e-l23').value||null,l24:document.getElementById('e-l24').value||null,
    };
    if(!body.name){toast('error','이름을 입력하세요.');return;}
    try{await axios.put(`${API}/analytics/engineer/${id}`,body);toast('success','저장 완료');close();await initFilters();document.getElementById('f-name-input').value=body.name;document.getElementById('f-name-input').dataset.selected=body.name;document.getElementById('btn-edit-eng').disabled=false;loadAll();}
    catch(e){console.error(e);toast('error',e.response?.data?.error||'저장 실패');}
  });
}

async function loadAll(){
  const f=getFilters();
  document.getElementById('btn-edit-eng').disabled=!f.name;
  if(f.name)showEngineerInfo(f.name);else document.getElementById('eng-info').style.display='none';
  await Promise.allSettled([renderHeadCount(f),renderHR(f),renderLevelDist(f),renderLevelAchieve(f),renderLevelTrend(f),renderCapability(f),renderEqCapa(f),renderWorklog(f)]);
}

document.addEventListener('DOMContentLoaded',async()=>{
  initNav();initTabs();initInfoBtns();initEngSearch();initAddEngineer();initEditEngineer();
  await initFilters();
  document.getElementById('btn-apply')?.addEventListener('click',loadAll);
  document.getElementById('btn-reset')?.addEventListener('click',()=>{['f-company','f-group','f-site'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const ni=document.getElementById('f-name-input');ni.value='';ni.dataset.selected='';document.getElementById('btn-edit-eng').disabled=true;document.getElementById('eng-info').style.display='none';loadAll();});
  document.getElementById('btn-export')?.addEventListener('click',doExport);
  loadAll();
});
