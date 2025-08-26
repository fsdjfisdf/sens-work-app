// === 설정 ===
// 같은 호스트/포트에서 서빙 중이면 빈 문자열 유지. 포트/호스트 다르면 "http://<IP>:3001"
const API_BASE_URL = "http://3.37.73.151:3001";

// Chart.js datalabels (있을 때만 등록)
try { if (window.Chart && window.ChartDataLabels) Chart.register(window.ChartDataLabels); } catch (_){}

// 날짜 유틸
function fmtYMD(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
function addDays(iso,days){ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+days); return fmtYMD(d); }
function getKstMondayISO(base = new Date()) {
  const kst = new Date(base.getTime() + 9*60*60*1000);
  const dow = kst.getUTCDay(); // 0=일
  const diff = (dow === 0 ? -6 : 1 - dow);
  const mon = new Date(kst);
  mon.setUTCDate(kst.getUTCDate() + diff);
  return fmtYMD(mon);
}
function ensureMonday(dateStr){ if(!dateStr) return getKstMondayISO(); return getKstMondayISO(new Date(dateStr+'T00:00:00')); }

// 표시 유틸
function n2(x,fix=2){ if(x==null||isNaN(x)) return '-'; return Number(x).toFixed(fix); }
function tidy(s){ return (s||'').toString().trim(); }
function setStatus(msg, isError=false){
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'status ' + (isError ? 'err' : 'ok');
}

// 시간 파싱
function hhmmssToHours(s){
  if (!s) return 0;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s.trim());
  if (!m) return 0;
  const h = parseInt(m[1]||'0',10), mi=parseInt(m[2]||'0',10), se=parseInt(m[3]||'0',10);
  return (h*3600 + mi*60 + se)/3600;
}

// === 서버 통신 ===
async function requestWeekly({ group, site, week, force=false }) {
  const token = localStorage.getItem('x-access-token');
  const headers = token ? { 'x-access-token': token } : {};

  const url1 = `${API_BASE_URL}/reports/weekly-summary?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(week)}${force ? '&force=1' : ''}`;
  try {
    const res = await axios.get(url1, { headers });
    return res.data;
  } catch (e) {
    if (e?.response?.status === 401) { alert('로그인이 필요합니다.'); window.location.replace('./signin.html'); throw e; }
    if (e?.response?.status === 404) {
      const url2 = `${API_BASE_URL}/api/reports/weekly?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(week)}${force ? '&force=1' : ''}`;
      const res2 = await axios.get(url2, { headers });
      return res2.data;
    }
    throw e;
  }
}

// 원시 로그 폴백: /reports/weekly-raw 없으면 /logs 모두 받아서 필터
async function fetchRawLogs({ group, site, weekStart, weekEnd }) {
  const token = localStorage.getItem('x-access-token');
  const headers = token ? { 'x-access-token': token } : {};
  // 1) 시도: /reports/weekly-raw (있을 수도)
  const try1 = `${API_BASE_URL}/reports/weekly-raw?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&start=${encodeURIComponent(weekStart)}&end=${encodeURIComponent(weekEnd)}`;
  try {
    const r1 = await axios.get(try1, { headers });
    if (Array.isArray(r1.data)) return r1.data;
  } catch(_){ /* continue */ }

  // 2) 폴백: /logs (전체) 가져와서 클라에서 필터링
  const url = `${API_BASE_URL}/logs`;
  const r2 = await axios.get(url, { headers });
  const rows = Array.isArray(r2.data) ? r2.data : [];
  const start = new Date(weekStart+'T00:00:00'), end = new Date(weekEnd+'T23:59:59');

  return rows.filter(row=>{
    const g = (row.group ?? row.GROUP ?? '').toString().trim();
    const s = (row.site ?? row.SITE ?? '').toString().trim();
    const d = new Date((row.task_date ?? row.TASK_DATE) + 'T00:00:00');
    return g===group && s===site && d>=start && d<=end;
  });
}

// === 클라 계산 analytics ===
function computeAnalytics(rows){
  // 안전화: 컬럼 이름 통일
  const R = rows.map(r=>({
    id: r.id,
    task_name: r.task_name,
    task_date: r.task_date,
    task_man: r.task_man,
    group: r.group,
    site: r.site,
    equipment_name: r.equipment_name,
    task_cause: r.task_cause,
    status: r.status,
    task_duration: r.task_duration,
    start_time: r.start_time,
    SOP: r.SOP,
    tsguide: r.tsguide
  }));

  // 상위 장비(시간)
  const equipMap = {};
  R.forEach(x=>{
    const key = tidy(x.equipment_name) || '(미기재)';
    const h = hhmmssToHours(x.task_duration);
    equipMap[key] = equipMap[key] || { equipment_name:key, hours:0, count:0 };
    equipMap[key].hours += h; equipMap[key].count += 1;
  });
  const top_equipment_by_hours = Object.values(equipMap).sort((a,b)=>b.hours-a.hours).slice(0,5);

  // 상위 원인
  const causeMap = {};
  R.forEach(x=>{
    const key = tidy(x.task_cause) || '미기재';
    const h = hhmmssToHours(x.task_duration);
    causeMap[key] = causeMap[key] || { cause:key, count:0, hours:0 };
    causeMap[key].count += 1; causeMap[key].hours += h;
  });
  const top_causes = Object.values(causeMap).sort((a,b)=> b.count - a.count || b.hours - a.hours).slice(0,5);

  // 요일별(월~일)
  const by_day = [0,0,0,0,0,0,0];
  R.forEach(x=>{
    if (!x.task_date) return;
    const d = new Date(x.task_date+'T00:00:00');
    const dow = d.getDay(); // 0일~6토
    const i = (dow===0)?6:(dow-1);
    by_day[i] += 1;
  });

  // 시간대별(시작 시간 기준)
  const by_hour = new Array(24).fill(0);
  R.forEach(x=>{
    if (!x.start_time) return;
    const m = /^(\d{1,2}):/.exec(x.start_time);
    if (!m) return;
    const h = Math.max(0, Math.min(23, parseInt(m[1],10)));
    by_hour[h] += 1;
  });

  // SOP/TS 사용률 (Y/YES/TRUE/사용/O 면 사용으로 카운트)
  const yes = v => /^(y|yes|true|사용|o)$/i.test(tidy(v));
  const sop_used = { used:0, total:R.length };
  const ts_used  = { used:0, total:R.length };
  R.forEach(x=>{ if (yes(x.SOP)) sop_used.used += 1; if (yes(x.tsguide)) ts_used.used += 1; });

  // 미해결/오픈
  const isClosed = s => /close|closed|done|완료|종료/i.test(tidy(s));
  const open_tasks = R.filter(x=>!isClosed(x.status))
    .slice(0,50)
    .map(x=>({ id:x.id, task_date:x.task_date, equipment_name:x.equipment_name, task_name:x.task_name, task_hours:n2(hhmmssToHours(x.task_duration)), status:x.status }));

  // 상위 엔지니어(시간) — 여러 명 표기시 균등 배분
  const engMap = {};
  R.forEach(x=>{
    const names = (x.task_man||'').split(',').map(s=> tidy(s).replace(/\(.*?\)/g,'')).filter(Boolean);
    const h = hhmmssToHours(x.task_duration);
    const share = names.length ? (h / names.length) : 0;
    const countShare = names.length ? (1/names.length) : 0;
    names.forEach(n=>{
      engMap[n] = engMap[n] || { name:n, hours:0, count:0 };
      engMap[n].hours += share;
      engMap[n].count += countShare;
    });
  });
  const top_engineers_by_hours = Object.values(engMap).sort((a,b)=>b.hours-a.hours).slice(0,5)
    .map(x=>({ name:x.name, hours:x.hours, count: Math.round(x.count)}));

  return {
    top_equipment_by_hours,
    top_causes,
    by_day,
    by_hour,
    sop_used,
    tsguide_used: ts_used,
    open_tasks,
    top_engineers_by_hours
  };
}

// === 차트 핸들 ===
let kpiChart, byDayChart, byHourChart, sopChart, tsChart;

// === 렌더 ===
function render(d) {
  const weekStart = d?.week_start || '';
  const weekEnd = weekStart ? addDays(weekStart, 6) : '';

  // 한줄/메타/배지
  const one = d?.llm_summary_json?.one_liner || '-';
  const oneEl = document.getElementById('one'); if (oneEl) oneEl.textContent = one;
  const metaEl = document.getElementById('meta'); if (metaEl) metaEl.textContent = `${d.group}-${d.site} / 주 시작: ${weekStart} (월)`;
  const rangeEl = document.getElementById('range-pill'); if (rangeEl) rangeEl.textContent = weekStart ? `${d.group}-${d.site} · ${weekStart}~${weekEnd}` : '';

  const srcEl = document.getElementById('src-pill');
  if (srcEl) {
    const metaObj = d?.llm_summary_json?.__meta || {};
    srcEl.classList.remove('ai','rule');
    if (metaObj.source === 'ai') { srcEl.textContent = `AI 요약${metaObj.model ? ' · ' + metaObj.model : ''}`; srcEl.classList.add('ai'); }
    else { srcEl.textContent = '룰 요약'; srcEl.classList.add('rule'); }
  }

  // KPI 카드
  const k = d?.kpis_json || {};
  const kEl = document.getElementById('kpis');
  if (kEl) {
    kEl.innerHTML = '';
    const pairs = [
      ['총 작업수', k.total_tasks],
      ['총 작업시간(합계)', `${n2(k.sum_total_hours)}h`],
      ['작업시간', `${n2(k.sum_task_hours)}h`],
      ['이동시간', `${n2(k.sum_move_hours)}h`],
      ['평균/건', `${n2(k.avg_task_hours)}h`],
      ['주말 작업', `${k.weekend_tasks ?? 0}건`],
      ['실패/미해결', `${k.failed_tasks ?? 0}건`],
      ['평균/일(건수)', `${k.total_tasks ? n2(k.total_tasks/7,2) : '0.00'}건`],
    ];
    pairs.forEach(([label, val]) => {
      const div = document.createElement('div');
      div.className = 'kpi';
      div.innerHTML = `<div class="lbl">${label}</div><div class="val">${val ?? '-'}</div>`;
      kEl.appendChild(div);
    });
  }

  // 이슈 Top3
  const issues = d?.llm_summary_json?.top_issues || [];
  const iEl = document.getElementById('issues');
  const iEmpty = document.getElementById('issues-empty');
  if (iEl && iEmpty) {
    iEl.innerHTML = '';
    if (!issues.length) {
      iEmpty.style.display = 'block';
    } else {
      iEmpty.style.display = 'none';
      issues.forEach(x => {
        const title = tidy(x?.title) || '-';
        const evidence = tidy(x?.evidence);
        const rec = tidy(x?.recommendation);
        const li = document.createElement('li');
        li.innerHTML = `
          <div><b>${title}</b></div>
          ${evidence ? `<div class="muted" style="margin:2px 0 4px">${evidence}</div>` : ''}
          ${rec ? `<div class="muted"><b>권고</b> ${rec}</div>` : ''}
        `;
        iEl.appendChild(li);
      });
    }
  }

  // KPI 미니 차트
  drawKpiChart({
    total: Number(k.total_tasks || 0),
    task: Number(k.sum_task_hours || 0),
    move: Number(k.sum_move_hours || 0),
    avg: Number(k.avg_task_hours || 0),
    weekend: Number(k.weekend_tasks || 0),
    failed: Number(k.failed_tasks || 0)
  });

  // ----- analytics (있으면 사용 / 없으면 클라 계산 폴백) -----
  updateAnalyticsViews(d.analytics || {});
}

function updateAnalyticsViews(a){
  fillTable('top-equip-table', 'top-equip-empty', a.top_equipment_by_hours, (r) => `
    <tr><td>${r.equipment_name || '-'}</td><td class="num">${n2(r.hours || 0)}</td><td class="num">${r.count ?? '-'}</td></tr>
  `);

  fillTable('top-causes-table', 'top-causes-empty', a.top_causes, (r)=>`
    <tr><td>${r.cause || '-'}</td><td class="num">${r.count ?? '-'}</td><td class="num">${n2(r.hours || 0)}</td></tr>
  `);

  fillTable('top-eng-table', 'top-eng-empty', a.top_engineers_by_hours, (r)=>`
    <tr><td>${r.name || '-'}</td><td class="num">${n2(r.hours || 0)}</td><td class="num">${r.count ?? '-'}</td></tr>
  `);

  fillTable('open-table', 'open-empty', a.open_tasks, (r)=>`
    <tr>
      <td>${r.id}</td>
      <td>${r.task_date || '-'}</td>
      <td>${r.equipment_name || '-'}</td>
      <td>${r.task_name || '-'}</td>
      <td class="num">${n2(r.task_hours || 0)}</td>
      <td>${r.status || '-'}</td>
    </tr>
  `);

  if (Array.isArray(a.by_day) && a.by_day.length === 7) { show('by-day-empty', false); drawByDayChart(a.by_day); }
  else { show('by-day-empty', true); destroyChart('byDayChart'); }

  if (Array.isArray(a.by_hour) && a.by_hour.length === 24) { show('by-hour-empty', false); drawByHourChart(a.by_hour); }
  else { show('by-hour-empty', true); destroyChart('byHourChart'); }

  const sop = a.sop_used, ts = a.tsguide_used;
  if (sop && ts && typeof sop.used === 'number' && typeof sop.total === 'number' && typeof ts.used === 'number' && typeof ts.total === 'number') {
    show('sop-ts-empty', false);
    drawDonut('sop-chart', sop.used, Math.max(0, sop.total - sop.used), (c)=>sopChart=c, 'SOP');
    drawDonut('ts-chart', ts.used, Math.max(0, ts.total - ts.used), (c)=>tsChart=c, 'TS Guide');
  } else {
    show('sop-ts-empty', true);
    destroyChart('sopChart'); destroyChart('tsChart');
  }
}

// === 테이블/차트 유틸 ===
function show(id, isShowEmpty){
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = isShowEmpty ? 'block' : 'none';
}
function destroyChart(handleName){
  try {
    if (handleName==='byDayChart' && byDayChart) { byDayChart.destroy(); byDayChart=null; }
    if (handleName==='byHourChart' && byHourChart) { byHourChart.destroy(); byHourChart=null; }
    if (handleName==='sopChart' && sopChart) { sopChart.destroy(); sopChart=null; }
    if (handleName==='tsChart' && tsChart) { tsChart.destroy(); tsChart=null; }
  } catch (_) { /* noop */ }
}
function fillTable(tableId, emptyId, rows, rowTpl) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  const emptyEl = document.getElementById(emptyId);
  if (!tbody || !emptyEl) return;
  if (!Array.isArray(rows) || rows.length === 0) {
    emptyEl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  emptyEl.style.display = 'none';
  tbody.innerHTML = rows.map(rowTpl).join('');
}

// === 차트 ===
function drawKpiChart({ total, task, move, avg, weekend, failed }) {
  const canvas = document.getElementById('kpi-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;

  if (kpiChart) { try { kpiChart.destroy(); } catch(_){} }
  const plugins = []; if (window.ChartDataLabels) plugins.push(window.ChartDataLabels);

  kpiChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['총 작업수','작업시간(h)','이동시간(h)','평균/건(h)','주말 작업','실패/미해결'],
      datasets: [{
        label: 'KPI',
        data: [total, task, move, avg, weekend, failed],
        backgroundColor: 'rgba(37,99,235,0.18)',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: { color: '#111827', anchor: 'end', align: 'end', formatter: (v)=> isNaN(v)?'-':v },
        tooltip: { enabled: true }
      },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    },
    plugins
  });
}

function drawByDayChart(arr) {
  const canvas = document.getElementById('by-day-chart'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;

  if (byDayChart) { try { byDayChart.destroy(); } catch(_){} }
  const plugins = []; if (window.ChartDataLabels) plugins.push(window.ChartDataLabels);

  byDayChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: ['월','화','수','목','금','토','일'], datasets: [{ data: arr, backgroundColor: 'rgba(99,102,241,0.18)', borderColor:'#6366f1', borderWidth:1 }] },
    options: {
      plugins: { legend: { display:false }, datalabels: { color:'#111827', anchor:'end', align:'end' } },
      scales: { y: { beginAtZero:true, ticks:{ precision:0 } } }
    },
    plugins
  });
}

function drawByHourChart(arr) {
  const canvas = document.getElementById('by-hour-chart'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;

  if (byHourChart) { try { byHourChart.destroy(); } catch(_){} }

  byHourChart = new Chart(ctx, {
    type: 'line',
    data: { labels: Array.from({length:24},(_,i)=>`${i}시`), datasets: [{ data: arr, borderColor:'#0ea5e9', backgroundColor:'rgba(14,165,233,0.15)', fill:true, tension:0.2 }] },
    options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } }
  });
}

function drawDonut(canvasId, used, notUsed, setHandle, title) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;

  try { const old = (canvasId==='sop-chart'?sopChart:tsChart); old?.destroy?.(); } catch(_) {}

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['사용','미사용'], datasets: [{ data: [used, notUsed], backgroundColor: ['rgba(34,197,94,0.6)','rgba(239,68,68,0.2)'], borderColor:['#059669','#ef4444'] }] },
    options: { plugins: { legend: { position: 'bottom' }, title: { display: true, text: title } } }
  });
  setHandle(chart);
}

// === 실행 ===
async function run(force=false) {
  try {
    setStatus('불러오는 중…');
    const group = document.getElementById('group').value;
    const site  = document.getElementById('site').value;
    const weekInput = document.getElementById('week').value;
    const week = ensureMonday(weekInput);
    if (weekInput !== week) document.getElementById('week').value = week;

    // 1) 요약/지표 먼저
    const data = await requestWeekly({ group, site, week, force });
    render(data);

    // 2) analytics가 없거나(혹은 비어있으면) → 클라에서 원시로그로 계산
    const a = data.analytics || {};
    const needCalc =
      !a ||
      !Array.isArray(a.top_equipment_by_hours) ||
      !Array.isArray(a.top_causes) ||
      !Array.isArray(a.by_day) ||
      !Array.isArray(a.by_hour);

    if (needCalc) {
      const weekStart = data.week_start || week;
      const weekEnd = addDays(weekStart, 6);
      const rows = await fetchRawLogs({ group, site, weekStart, weekEnd });
      const computed = computeAnalytics(rows);
      updateAnalyticsViews(computed);
    }

    setStatus('완료');
    setTimeout(()=>setStatus(''), 1200);
  } catch (err) {
    console.error('weekly summary error:', err);
    const status = err?.response?.status;
    const msg = err?.response?.data?.error || err?.message || '요약 조회 실패';
    setStatus(`에러 ${status ?? ''} ${msg}`, true);
    alert(`요약 조회 실패\n${status ? `HTTP ${status}\n` : ''}${msg}`);
  }
}

// UX 도우미들
function copyUrl() {
  const g = document.getElementById('group').value;
  const s = document.getElementById('site').value;
  const w = document.getElementById('week').value || getKstMondayISO();
  const url = `${location.origin}${location.pathname}?group=${encodeURIComponent(g)}&site=${encodeURIComponent(s)}&week=${encodeURIComponent(w)}`;
  navigator.clipboard.writeText(url).then(()=>setStatus('링크 복사 완료')).catch(()=>setStatus('링크 복사 실패', true));
}
function copyOne() {
  const text = document.getElementById('one')?.textContent || '';
  navigator.clipboard.writeText(text).then(()=>setStatus('복사 완료')).catch(()=>setStatus('복사 실패', true));
}
function exportCsv() {
  const rows = [];
  const one = document.getElementById('one')?.textContent || '';
  const meta = document.getElementById('meta')?.textContent || '';
  rows.push(['섹션','항목','값']);
  rows.push(['요약','한 줄', one]);
  rows.push(['요약','메타', meta]);

  document.querySelectorAll('#kpis .kpi').forEach(k=>{
    const lbl=k.querySelector('.lbl')?.textContent?.trim()||'';
    const val=k.querySelector('.val')?.textContent?.trim()||'';
    rows.push(['KPI', lbl, val]);
  });

  const pushTable = (sel, section) => {
    document.querySelectorAll(`${sel} tbody tr`).forEach(tr=>{
      const cells=[...tr.children].map(td=>td.textContent.trim());
      rows.push([section, cells[0], cells.slice(1).join(' / ')]);
    });
  };
  pushTable('#top-equip-table','상위 장비');
  pushTable('#top-causes-table','상위 원인');
  pushTable('#top-eng-table','상위 엔지니어');

  document.querySelectorAll('#open-table tbody tr').forEach(tr=>{
    const c=[...tr.children].map(td=>td.textContent.trim());
    rows.push(['미해결', `#${c[0]} ${c[2]}`, `${c[1]} · ${c[3]} · ${c[4]}h · ${c[5]}`]);
  });

  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'weekly_summary.csv';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
}
function toggleRaw(){
  const el = document.getElementById('raw');
  if (!el) return;
  el.style.display = (el.style.display==='none' || !el.style.display) ? 'block' : 'none';
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('x-access-token');
  if (!token || token.trim()==='') { alert('로그인이 필요합니다.'); window.location.replace('./signin.html'); return; }

  const usp = new URLSearchParams(location.search);
  const g = usp.get('group') || 'PEE1';
  const s = usp.get('site') || 'PT';
  const w = ensureMonday(usp.get('week') || '');

  document.getElementById('group').value = g;
  document.getElementById('site').value = s;
  document.getElementById('week').value = w;

  document.getElementById('run').addEventListener('click', ()=>run(false));
  document.getElementById('force').addEventListener('click', ()=>run(true));
  document.getElementById('copy-one').addEventListener('click', copyOne);
  document.getElementById('copy-url').addEventListener('click', copyUrl);
  document.getElementById('export').addEventListener('click', exportCsv);
  document.getElementById('print').addEventListener('click', ()=>window.print());
  document.getElementById('toggle-raw').addEventListener('click', toggleRaw);

  run(false);
});
