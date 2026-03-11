'use strict';
const API = 'http://3.37.73.151:3001';
const token = localStorage.getItem('x-access-token') || '';
axios.defaults.headers.common['x-access-token'] = token;
const me = (() => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } })();

function isAdminUser(u){
  const role = (u?.role || u?.ROLE || u?.user_role || '').toString().toLowerCase();
  return role==='admin' || role==='administrator' || u?.is_admin===1 || u?.isAdmin===true || u?.admin===true;
}
if(!token || !isAdminUser(me)){
  alert('관리자만 접근 가능합니다.');
  location.href = './index.html';
}

function qs(s,p=document){return p.querySelector(s)}
function qsa(s,p=document){return [...p.querySelectorAll(s)]}
function fmtPct(v){ return `${Number(v||0).toFixed(1)}%`; }
function fmtN(v){ return Number(v||0).toLocaleString(); }
function fmt1(v){ return Number(v||0).toFixed(1); }
function ymLabel(ym){ return (ym||'').replace('-', '.'); }
function safeText(v){ return (v===null || v===undefined || v==='') ? '-' : v; }

const chartStore = {};
const C = {
  primary:'rgba(37,99,235,.78)',
  primaryFill:'rgba(37,99,235,.18)',
  teal:'rgba(13,148,136,.72)',
  tealFill:'rgba(13,148,136,.18)',
  amber:'rgba(217,119,6,.75)',
  amberFill:'rgba(217,119,6,.18)',
  red:'rgba(239,68,68,.82)',
  redFill:'rgba(239,68,68,.18)',
  gray:'rgba(148,163,184,.78)',
  grayFill:'rgba(148,163,184,.20)',
  muted:['rgba(37,99,235,.72)','rgba(13,148,136,.72)','rgba(217,119,6,.75)','rgba(99,102,241,.72)','rgba(139,92,246,.72)','rgba(244,114,182,.72)','rgba(14,165,233,.72)','rgba(120,113,108,.72)']
};

function destroyChart(id){ if(chartStore[id]){ chartStore[id].destroy(); delete chartStore[id]; } }
function noDataPlugin(){
  return {
    id:'noDataPlugin',
    afterDraw(chart){
      const ds = chart.data?.datasets || [];
      const has = ds.some(d => Array.isArray(d.data) && d.data.some(v => Number(v) > 0));
      if(has) return;
      const {ctx, chartArea} = chart;
      if(!chartArea) return;
      ctx.save();
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = '600 13px Arial';
      ctx.fillText('데이터 없음', (chartArea.left+chartArea.right)/2, (chartArea.top+chartArea.bottom)/2);
      ctx.restore();
    }
  };
}
Chart.register(noDataPlugin());
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', { display:false });

function makeChart(id, cfg){
  destroyChart(id);
  const cv = qs(`#${id}`);
  if(!cv) return null;
  chartStore[id] = new Chart(cv, cfg);
  return chartStore[id];
}

function vBar(id, labels, datasets, extra={}){
  return makeChart(id, {
    type:'bar',
    data:{labels, datasets},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:'index', intersect:false},
      scales:{
        x:{ticks:{color:'#cbd5e1', maxRotation:0, autoSkip:true}, grid:{display:false}},
        y:{beginAtZero:true, ticks:{color:'#cbd5e1'}, grid:{color:'rgba(148,163,184,.14)'}}
      },
      plugins:{legend:{labels:{color:'#e5e7eb'}}, tooltip:{enabled:true}, datalabels:{display:false}},
      ...extra
    }
  });
}

function lineChart(id, labels, datasets, extra={}){
  return makeChart(id, {
    type:'line',
    data:{labels, datasets},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:'index', intersect:false},
      scales:{
        x:{ticks:{color:'#cbd5e1'}, grid:{display:false}},
        y:{beginAtZero:true, ticks:{color:'#cbd5e1'}, grid:{color:'rgba(148,163,184,.14)'}}
      },
      plugins:{legend:{labels:{color:'#e5e7eb'}}, tooltip:{enabled:true}, datalabels:{display:false}},
      ...extra
    }
  });
}

function doughnut(id, labels, data, title=''){
  return makeChart(id, {
    type:'doughnut',
    data:{ labels, datasets:[{ data, backgroundColor: labels.map((_,i)=>C.muted[i % C.muted.length]), borderWidth:0 }] },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:'64%',
      plugins:{
        legend:{position:'bottom', labels:{color:'#e5e7eb', boxWidth:10}},
        title:title?{display:true,text:title,color:'#e5e7eb'}:undefined,
        datalabels:{display:false}
      }
    }
  });
}

function setSummaryCard(id, title, value, sub){
  const el = qs(id); if(!el) return;
  el.innerHTML = `<div class="summary-label">${title}</div><div class="summary-value">${safeText(value)}</div><div class="summary-sub">${safeText(sub)}</div>`;
}

async function fetchJSON(url, params={}){
  const { data } = await axios.get(url, { params });
  return data;
}

async function loadFilters(){
  const f = await fetchJSON(`${API}/analytics/filters`);
  fillSelect('#company-filter', ['ALL', ...(f.companies||[])]);
  fillSelect('#group-filter', ['ALL', ...(f.groups||[])]);
  fillSelect('#site-filter', ['ALL', ...(f.sites||[])]);
  const nameSel = qs('#name-filter');
  if(nameSel){
    nameSel.innerHTML = ['<option value="">ALL</option>']
      .concat((f.engineers||[]).map(e=>`<option value="${escapeHtml(e.NAME)}">${escapeHtml(e.NAME)}</option>`))
      .join('');
  }
  const eqSel = qs('#eq-filter');
  if(eqSel){
    eqSel.innerHTML = ['<option value="">ALL</option>']
      .concat((f.eqOptions||[]).map(e=>`<option value="${e.id}">${escapeHtml(e.name)}${e.code ? ` (${escapeHtml(e.code)})` : ''}</option>`))
      .join('');
  }
}
function fillSelect(sel, arr){ const el=qs(sel); if(!el) return; el.innerHTML = arr.map(v=>`<option value="${v==='ALL'?'':escapeHtml(v)}">${escapeHtml(v)}</option>`).join(''); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

function currentFilters(){
  return {
    company: qs('#company-filter')?.value || '',
    group: qs('#group-filter')?.value || '',
    site: qs('#site-filter')?.value || '',
    name: qs('#name-filter')?.value || ''
  };
}

function renderHeadCount(head){
  const labels = Array.from(new Set([...(head.hires||[]).map(r=>r.ym), ...(head.resigns||[]).map(r=>r.ym)])).sort();
  const hireMap = new Map((head.hires||[]).map(r=>[r.ym, Number(r.cnt||0)]));
  const resignMap = new Map((head.resigns||[]).map(r=>[r.ym, Number(r.cnt||0)]));
  const hires = labels.map(k=>hireMap.get(k)||0);
  const resigns = labels.map(k=>resignMap.get(k)||0);
  lineChart('chart-headcount', labels.map(ymLabel), [
    { label:'입사', data:hires, borderColor:C.primary, backgroundColor:C.primaryFill, fill:true, tension:.25 },
    { label:'퇴사', data:resigns, borderColor:C.red, backgroundColor:C.redFill, fill:true, tension:.25 }
  ]);
  setSummaryCard('#sum-headcount','현재 인원', fmtN(head.currentTotal), `월별 입·퇴사 추이`);
}

function renderHRDistribution(hr){
  doughnut('chart-company', (hr.byCompany||[]).map(r=>r.label||'-'), (hr.byCompany||[]).map(r=>Number(r.cnt||0)), '회사 분포');
  vBar('chart-experience', (hr.byExp||[]).map(r=>r.label), [{ label:'인원', data:(hr.byExp||[]).map(r=>Number(r.cnt||0)), backgroundColor:C.primary }]);
  vBar('chart-groupsite', (hr.byGroupSite||[]).map(r=>r.label), [{ label:'인원', data:(hr.byGroupSite||[]).map(r=>Number(r.cnt||0)), backgroundColor:C.teal }]);
}

function renderLevelDistribution(rows){
  vBar('chart-level-dist', rows.map(r=>r.label), [{ label:'인원', data:rows.map(r=>Number(r.cnt||0)), backgroundColor:C.primary }]);
}

function renderLevelAchievement(rows){
  vBar('chart-level-achieve', rows.map(r=>r.level_code), [{ label:'평균 소요일', data:rows.map(r=>Number(r.avg_days||0)), backgroundColor:C.amber }]);
}

function renderLevelTrend(rows){
  const quarterSet = Array.from(new Set((rows||[]).map(r=>r.quarter))).sort();
  const levels = ['1-1','1-2','1-3','2','2-2','2-3','2-4'];
  const datasets = levels.map((lv, i) => ({
    label: lv,
    data: quarterSet.map(q => Number((rows.find(r => r.quarter===q && r.level_code===lv) || {}).cnt || 0)),
    backgroundColor: C.muted[i % C.muted.length],
    borderColor: C.muted[i % C.muted.length],
    fill: true,
    tension:.25
  }));
  makeChart('chart-level-trend', {
    type:'line',
    data:{ labels:quarterSet, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      scales:{ x:{stacked:true, ticks:{color:'#cbd5e1'}, grid:{display:false}}, y:{stacked:true, beginAtZero:true, ticks:{color:'#cbd5e1'}, grid:{color:'rgba(148,163,184,.14)'}} },
      plugins:{ legend:{labels:{color:'#e5e7eb'}}, datalabels:{display:false} }
    }
  });
}

function renderCapability(monthly, eqcap){
  lineChart('chart-capability', (monthly||[]).map(r=>ymLabel(r.ym)), [
    { label:'평균 TOTAL', data:(monthly||[]).map(r=>Number(r.avg_total||0)), borderColor:C.primary, backgroundColor:C.primaryFill, fill:true, tension:.25 },
    { label:'평균 SET UP', data:(monthly||[]).map(r=>Number(r.avg_setup||0)), borderColor:C.teal, backgroundColor:C.tealFill, fill:true, tension:.25 },
    { label:'평균 MAINT', data:(monthly||[]).map(r=>Number(r.avg_maint||0)), borderColor:C.amber, backgroundColor:C.amberFill, fill:true, tension:.25 }
  ]);
  vBar('chart-eq-cap', (eqcap||[]).map(r=>r.label), [
    { label:'SET UP', data:(eqcap||[]).map(r=>Number(r.setup_score||0)), backgroundColor:C.primary },
    { label:'MAINT', data:(eqcap||[]).map(r=>Number(r.maint_score||0)), backgroundColor:C.teal }
  ]);
}

function renderWorklogStats(ws){
  lineChart('chart-monthly-hours', (ws.monthlyHours||[]).map(r=>ymLabel(r.ym)), [
    { label:'시간', data:(ws.monthlyHours||[]).map(r=>Number(r.hours||0)), borderColor:C.primary, backgroundColor:C.primaryFill, fill:true, tension:.25 },
    { label:'건수', data:(ws.monthlyHours||[]).map(r=>Number(r.count||0)), borderColor:C.teal, backgroundColor:C.tealFill, fill:true, tension:.25 }
  ]);
  doughnut('chart-worktype', (ws.byWorkType||[]).map(r=>r.label), (ws.byWorkType||[]).map(r=>Number(r.cnt||0)), 'Work Type');
  doughnut('chart-worktype2', (ws.byWorkType2||[]).map(r=>r.label), (ws.byWorkType2||[]).map(r=>Number(r.cnt||0)), 'Work Type 2');
  vBar('chart-shift', (ws.byShift||[]).map(r=>r.label), [{ label:'건수', data:(ws.byShift||[]).map(r=>Number(r.cnt||0)), backgroundColor:C.teal }], { indexAxis:'y' });
  vBar('chart-overtime', (ws.byOvertime||[]).map(r=>r.label), [{ label:'건수', data:(ws.byOvertime||[]).map(r=>Number(r.cnt||0)), backgroundColor:C.amber }], { indexAxis:'y' });
  doughnut('chart-rework-ratio', (ws.reworkRatio||[]).map(r=>r.label), (ws.reworkRatio||[]).map(r=>Number(r.cnt||0)), 'Rework Ratio');
  doughnut('chart-rework-reason', (ws.reworkReason||[]).map(r=>r.label), (ws.reworkReason||[]).map(r=>Number(r.cnt||0)), 'Rework Reason');
}

function renderEngineerTable(rows){
  const tb = qs('#eng-table tbody');
  if(!tb) return;
  tb.innerHTML = (rows||[]).map(r=>`
    <tr>
      <td>${safeText(r.name)}</td>
      <td>${safeText(r.company)}</td>
      <td>${safeText(r.employee_id)}</td>
      <td>${safeText(r.group)}</td>
      <td>${safeText(r.site)}</td>
      <td>${safeText(r.hire_date ? String(r.hire_date).slice(0,10) : '-')}</td>
      <td>${safeText(r.role)}</td>
      <td>${safeText(r.main_eq_name)}</td>
      <td>${safeText(r.multi_eq_name)}</td>
      <td>${safeText(r.level_report)}</td>
      <td>${safeText(r.level_internal)}</td>
      <td>${safeText(r.level_psk)}</td>
      <td>${safeText(r.multi_level)}</td>
      <td>${safeText(r.multi_level_psk)}</td>
      <td>${safeText(r.g25)}</td>
      <td>${safeText(r.g26)}</td>
    </tr>
  `).join('');
  setSummaryCard('#sum-engineers', '조회 인원', fmtN(rows?.length||0), '필터 적용 결과');
}

function renderMPI(rows){
  vBar('chart-mpi', (rows||[]).map(r=>r.eqName), [
    { label:'MAIN 지정', data:(rows||[]).map(r=>Number(r.mainCount||0)), backgroundColor:C.primary },
    { label:'MULTI 지정', data:(rows||[]).map(r=>Number(r.multiCount||0)), backgroundColor:C.teal },
    { label:'역량 점수 존재', data:(rows||[]).map(r=>Number(r.capaCount||0)), backgroundColor:C.amber }
  ]);
}

async function loadAll(){
  const f = currentFilters();
  const [head, hr, lvDist, lvAch, lvTrend, cap, eqcap, ws, info, mpi] = await Promise.all([
    fetchJSON(`${API}/analytics/headcount`, f),
    fetchJSON(`${API}/analytics/hr-distribution`, f),
    fetchJSON(`${API}/analytics/level-distribution`, f),
    fetchJSON(`${API}/analytics/level-achievement`, f),
    fetchJSON(`${API}/analytics/level-trend`, f),
    fetchJSON(`${API}/analytics/capability`, f),
    fetchJSON(`${API}/analytics/eq-capability`, f),
    fetchJSON(`${API}/analytics/worklog-stats`, f),
    fetchJSON(`${API}/analytics/engineer-info`, f),
    fetchJSON(`${API}/analytics/mpi-coverage`, f)
  ]);

  renderHeadCount(head);
  renderHRDistribution(hr);
  renderLevelDistribution(lvDist);
  renderLevelAchievement(lvAch);
  renderLevelTrend(lvTrend);
  renderCapability(cap, eqcap);
  renderWorklogStats(ws);
  renderEngineerTable(info);
  renderMPI(mpi);
}

function initEvents(){
  qs('#btn-search')?.addEventListener('click', loadAll);
  qs('#btn-reset')?.addEventListener('click', ()=>{
    qsa('select.filter, input.filter').forEach(el=>el.value='');
    loadAll();
  });

  qs('#btn-export-json')?.addEventListener('click', async ()=>{
    const data = await fetchJSON(`${API}/analytics/export/excel`, currentFilters());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytics_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  qs('#btn-add-engineer')?.addEventListener('click', ()=> openEngineerModal());
  qs('#eng-save')?.addEventListener('click', saveEngineer);
  qs('#eng-cancel')?.addEventListener('click', closeEngineerModal);
}

function openEngineerModal(data={}){
  const modal = qs('#engineer-modal');
  modal?.classList.add('open');
  qs('#eng-id').value = data.id || '';
  qs('#eng-name').value = data.name || '';
  qs('#eng-company').value = data.company || '';
  qs('#eng-employee-id').value = data.employee_id || '';
  qs('#eng-group').value = data.group || '';
  qs('#eng-site').value = data.site || '';
  qs('#eng-hire-date').value = data.hire_date ? String(data.hire_date).slice(0,10) : '';
  qs('#eng-role').value = data.role || 'WORKER';
  qs('#eng-main-eq-id').value = data.main_eq_id || '';
  qs('#eng-multi-eq-id').value = data.multi_eq_id || '';
  qs('#eng-level-internal').value = data.level_internal || 0;
  qs('#eng-level-psk').value = data.level_psk || 0;
  qs('#eng-level-report').value = data.level_report || '';
  qs('#eng-multi-level').value = data.multi_level || 0;
  qs('#eng-multi-level-psk').value = data.multi_level_psk || 0;
}
function closeEngineerModal(){ qs('#engineer-modal')?.classList.remove('open'); }

async function saveEngineer(){
  const id = qs('#eng-id').value;
  const payload = {
    name: qs('#eng-name').value.trim(),
    company: qs('#eng-company').value.trim(),
    employee_id: Number(qs('#eng-employee-id').value || 0) || null,
    group: qs('#eng-group').value.trim(),
    site: qs('#eng-site').value.trim(),
    hire_date: qs('#eng-hire-date').value || null,
    role: qs('#eng-role').value || 'WORKER',
    main_eq_id: Number(qs('#eng-main-eq-id').value || 0) || null,
    multi_eq_id: Number(qs('#eng-multi-eq-id').value || 0) || null,
    level_internal: Number(qs('#eng-level-internal').value || 0),
    level_psk: Number(qs('#eng-level-psk').value || 0),
    level_report: qs('#eng-level-report').value.trim(),
    multi_level: Number(qs('#eng-multi-level').value || 0),
    multi_level_psk: Number(qs('#eng-multi-level-psk').value || 0)
  };
  if(!payload.name) return alert('이름은 필수입니다.');
  if(id) await axios.put(`${API}/analytics/engineer/${id}`, payload);
  else await axios.post(`${API}/analytics/engineer`, payload);
  closeEngineerModal();
  await loadAll();
}

function fillStaticEqOptions(){
  const ids = ['#eng-main-eq-id', '#eng-multi-eq-id'];
  ids.forEach(sel => {
    const el = qs(sel);
    if(el && !el.dataset.ready){
      axios.get(`${API}/analytics/filters`).then(({data})=>{
        el.innerHTML = ['<option value="">선택</option>']
          .concat((data.eqOptions||[]).map(e=>`<option value="${e.id}">${escapeHtml(e.name)}</option>`))
          .join('');
        el.dataset.ready = '1';
      }).catch(console.error);
    }
  });
}

window.addEventListener('DOMContentLoaded', async ()=>{
  fillStaticEqOptions();
  initEvents();
  await loadFilters();
  await loadAll();
});