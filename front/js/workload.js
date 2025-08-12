// ===============================
// Admin Gate & Bootstrap
// ===============================
let currentUserNickname = '';

document.addEventListener('DOMContentLoaded', async () => {
  const userRole = localStorage.getItem('user-role');
  console.log("User role:", userRole);
  if (userRole !== 'admin') {
    alert("접근 권한이 없습니다.");
    window.location.replace("./index.html");
    return;
  }

  async function getCurrentUser() {
    try {
      const response = await axios.get('http://3.37.73.151:3001/user-info', {
        headers: { 'x-access-token': localStorage.getItem('x-access-token') }
      });
      console.log('response.data:', response.data);
      currentUserNickname = response.data?.result?.NAME || '';
      console.log('현재 로그인한 사용자 이름:', currentUserNickname);
    } catch (error) {
      console.error('현재 사용자 정보를 가져오는 중 오류 발생:', error);
    }
  }
  // 필요시 활성화
  // await getCurrentUser();

  bindTabs();
  bindModal();
  wireStaticUI();

  // ✅ 초기 로딩 기본 선택값 보정: task=true, none=false, move=true
  const chkTask = document.getElementById("includeTask");
  const chkNone = document.getElementById("includeNone");
  const chkMove = document.getElementById("includeMove");
  if (chkTask) chkTask.checked = true;
  if (chkNone) chkNone.checked = false;
  if (chkMove) chkMove.checked = true;

  await run();

  // 상단 버튼/네비 등 이벤트
  document.getElementById("searchBtn")?.addEventListener("click", () => applyAndRender(false));
  document.getElementById("resetBtn")?.addEventListener("click", onReset);
  document.getElementById('prevMonth')?.addEventListener('click', (e)=>{ e.preventDefault(); shiftCalendarMonth(-1); applyAndRender(true); });
  document.getElementById('nextMonth')?.addEventListener('click', (e)=>{ e.preventDefault(); shiftCalendarMonth(1);  applyAndRender(true); });

  // 가동율 기준/분모 변경 즉시 반영
  document.getElementById('utilMode')?.addEventListener('change', ()=>applyAndRender(false));
  document.getElementById('utilBase')?.addEventListener('change', ()=>applyAndRender(false));
});

// ===============================
// Holidays (옵션 목록)
// ===============================
const HOLIDAYS = [
  '2024-01-01','2024-02-09','2024-02-10','2024-02-11','2024-02-12',
  '2024-03-01','2024-05-05','2024-05-06','2024-05-15','2024-06-06',
  '2024-08-15','2024-09-16','2024-09-17','2024-09-18','2024-10-03',
  '2024-10-09','2024-12-25','2024-10-01','2025-01-01','2025-01-27',
  '2025-01-28','2025-01-29','2025-01-30','2025-03-03','2025-05-01',
  '2025-05-06','2025-05-05','2025-06-03','2025-06-06'
];

// ===============================
// Chart.js Plugins
// ===============================
Chart.register(ChartDataLabels);

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart, args, opts) {
    const { ctx, chartArea } = chart;
    if (!opts || !opts.text || !chartArea) return;
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.font = opts.font || '700 20px Inter, Arial';
    ctx.fillStyle = opts.color || '#e9eef5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.text, x, y);
    ctx.restore();
  }
};
Chart.register(centerTextPlugin);

// ===============================
// Date/Format Utils
// ===============================
const pad2 = (n) => String(n).padStart(2, '0');
const toYMDLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

function ymdFromAny(x) {
  if (!x) return null;
  if (typeof x === 'string') {
    const m = x.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(x);
    return isNaN(d) ? null : toYMDLocal(d);
  }
  if (x instanceof Date && !isNaN(x)) return toYMDLocal(x);
  const d = new Date(x);
  return isNaN(d) ? null : toYMDLocal(d);
}
function parseYMDToLocal(ymd) {
  if (!ymd) return null;
  const [y,m,d] = ymd.split('-').map(v=>parseInt(v,10));
  return new Date(y, (m||1)-1, d||1);
}
const fmtHour = (h) => (Math.round(h * 100) / 100).toFixed(2);
const fmtPct  = (v) => (Math.round(v * 100) / 100).toFixed(2);

// ===============================
// Data Utils
// ===============================
function parseDurationToMinutes(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val !== "string") return 0;
  const s = val.trim();
  if (!s) return 0;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((x) => parseInt(x, 10));
  if (parts.length >= 2 && !parts.some(isNaN)) {
    const [h, m, sec] = parts;
    return (h || 0) * 60 + (m || 0) + Math.floor((sec || 0) / 60);
  }
  return 0;
}

function splitWorkers(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;/]+/)
    .map((s) => s.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// 날짜 카테고리 & 포함 여부
function dayCategory(ymd) {
  const d = parseYMDToLocal(ymd);
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const isWeekend = (dow === 0 || dow === 6);
  const isHoliday = HOLIDAYS.includes(ymd);
  return (!isWeekend && !isHoliday) ? 'weekday' : 'holiday';
}
// utilMode: 'weekday' | 'holiday' | 'all'
function includeByMode(ymd, utilMode) {
  if (utilMode === 'all') return true;
  return dayCategory(ymd) === utilMode;
}
// 선택 모드의 일수 카운트
function countDaysByMode(startYMD, endYMD, utilMode) {
  const s = parseYMDToLocal(startYMD);
  const e = parseYMDToLocal(endYMD);
  if (!s || !e) return 0;
  let d = new Date(s), cnt = 0;
  while (d <= e) {
    const ymd = toYMDLocal(d);
    if (includeByMode(ymd, utilMode)) cnt++;
    d.setDate(d.getDate() + 1);
  }
  return cnt;
}

// ===============================
// Aggregations / Metrics
// ===============================
function aggregateWorkerHoursFull(logs, { includeTask, includeNone, includeMove }) {
  const totalsMin = new Map(); // name -> minutes
  for (const row of logs) {
    const workers = splitWorkers(row.task_man);
    if (!workers.length) continue;

    const taskMin = includeTask ? parseDurationToMinutes(row.task_duration) : 0;
    const noneMin = includeNone ? (parseInt(row.none_time, 10) || 0) : 0;
    const moveMin = includeMove ? (parseInt(row.move_time, 10) || 0) : 0;
    const totalMin = taskMin + noneMin + moveMin;
    if (totalMin <= 0) continue;

    for (const w of workers) {
      totalsMin.set(w, (totalsMin.get(w) || 0) + totalMin);
    }
  }
  return Array.from(totalsMin.entries())
    .map(([name, min]) => [name, min / 60])
    .filter(([, h]) => h > 0);
}

function weightedHDay(workerHours, dStd) {
  if (!dStd || dStd <= 0) return 0;
  let num = 0, den = 0;
  for (const [, h] of workerHours) {
    if (h > 0) { num += (h * h) / dStd; den += h; }
  }
  return den > 0 ? num / den : 0;
}

const SITE_KEYS = ['PEE1-PT','PEE1-HS','PEE1-IC','PEE1-CJ','PEE2-PT','PEE2-HS','PSKH-PSKH'];
function computeSiteMetrics(logs, dStd, toggles, baseHours) {
  return SITE_KEYS.map(key => {
    const [group, site] = key.split('-');
    const subset = logs.filter(r => (r.group || '').trim() === group && (r.site || '').trim() === site);
    const workerHours = aggregateWorkerHoursFull(subset, toggles);
    const hday = weightedHDay(workerHours, dStd);
    const util = (dStd > 0 && baseHours > 0) ? (hday / baseHours) * 100 : 0;
    return { key, util, hday };
  });
}

// ISO Week helpers
function getISOWeek(date) {
  const dt = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
  return { year: dt.getUTCFullYear(), week: weekNo };
}
function getISOWeekRange(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(d); monday.setDate(d.getDate() - day);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function computeWeeklyMetrics(logs, toggles, utilMode, baseHours){
  const bucket=new Map();
  for(const r of logs){
    const dStr=ymdFromAny(r.task_date); if(!dStr) continue;
    const d=parseYMDToLocal(dStr); const {year,week}=getISOWeek(d);
    const key=`${year}-W${String(week).padStart(2,'0')}`;
    if(!bucket.has(key)){ const {start,end}=getISOWeekRange(d); bucket.set(key,{logs:[],start,end}); }
    bucket.get(key).logs.push(r);
  }
  let rows=[];
  for(const [key,{logs:wk,start,end}] of bucket.entries()){
    const startY = toYMDLocal(start), endY = toYMDLocal(end);
    const dStd  = countDaysByMode(startY, endY, utilMode);
    const wh    = aggregateWorkerHoursFull(wk, toggles);
    const hday  = weightedHDay(wh, dStd);
    const util  = (dStd>0 && baseHours>0) ? (hday/baseHours)*100 : 0;
    rows.push({key,util,hday});
  }
  rows.sort((a,b)=>a.key.localeCompare(b.key));
  if(rows.length>30) rows=rows.slice(-30);
  return rows;
}

// ===============================
// Calendar State
// ===============================
let calYear, calMonth; // 0-index
function setCalendarToCurrentMonth(){ const now=new Date(); calYear=now.getFullYear(); calMonth=now.getMonth(); }
function setCalendarByEndDate(endDateStr){ const d=endDateStr?parseYMDToLocal(endDateStr):new Date(); calYear=d.getFullYear(); calMonth=d.getMonth(); }
function shiftCalendarMonth(delta){ const d=new Date(calYear,calMonth+delta,1); calYear=d.getFullYear(); calMonth=d.getMonth(); }

// 일자별 원시 합계
function dayCountsAndSums(dayLogs){
  const countPerWorker=new Map();
  let taskMin=0, moveMin=0, noneMin=0;

  for(const r of dayLogs){
    const workers=splitWorkers(r.task_man);
    for(const w of workers){ countPerWorker.set(w,(countPerWorker.get(w)||0)+1); }
    taskMin += parseDurationToMinutes(r.task_duration);
    moveMin += (parseInt(r.move_time,10)||0);
    noneMin += (parseInt(r.none_time,10)||0);
  }
  let single=0, multi=0;
  for(const [,cnt] of countPerWorker){ if(cnt===1) single++; else if(cnt>=2) multi++; }
  return {
    totalWorkers: countPerWorker.size,
    singleWorkers: single,
    multiWorkers: multi,
    taskHours: taskMin/60,
    moveHours: moveMin/60,
    noneHours: noneMin/60
  };
}

// Calendar build (utilMode & baseHours 반영)
function buildCalendar(logs,toggles,utilMode,baseHours){
  const grid=document.getElementById('calendarGrid');
  const title=document.getElementById('calTitle');
  if (!grid) return;
  grid.innerHTML="";

  const first=new Date(calYear,calMonth,1);
  const last =new Date(calYear,calMonth+1,0);
  if (title) title.textContent=`${calYear}-${pad2(calMonth+1)}`;

  const weekdays=['월','화','수','목','금','토','일'];
  weekdays.forEach(w=>{ const h=document.createElement('div'); h.className='cal-head'; h.textContent=w; grid.appendChild(h); });

  const startIdx=(first.getDay()+6)%7; // Mon=0
  for(let i=0;i<startIdx;i++){ const empty=document.createElement('div'); empty.className='cal-cell'; empty.style.visibility='hidden'; grid.appendChild(empty); }

  for(let day=1; day<=last.getDate(); day++){
    const date=new Date(calYear,calMonth,day);
    const ymd = toYMDLocal(date);

    const weekd=date.getDay(); const isWeekend=(weekd===0||weekd===6);
    const isHoliday=HOLIDAYS.includes(ymd);

    const dayLogs = logs.filter(r => ymdFromAny(r.task_date) === ymd);
    const included = includeByMode(ymd, utilMode);

    const workerHours = included ? aggregateWorkerHoursFull(dayLogs, toggles) : [];
    const hday = (included && workerHours.length) ? weightedHDay(workerHours, 1) : 0;
    const util = (included && workerHours.length && baseHours>0) ? (hday/baseHours)*100 : 0;

    const sums = dayCountsAndSums(dayLogs);

    const cell=document.createElement('div');
    cell.className='cal-cell'+((isWeekend||isHoliday)?' holiday':'');

    if (included && workerHours.length) {
      if (util > 100) cell.classList.add('util100');
      else if (util > 70) cell.classList.add('util70');
      else cell.classList.add('util0');
    }

    cell.dataset.date   = ymd;
    cell.dataset.hday   = hday;
    cell.dataset.util   = util;
    cell.dataset.workers= sums.totalWorkers;
    cell.dataset.single = sums.singleWorkers;
    cell.dataset.multi  = sums.multiWorkers;
    cell.dataset.taskh  = sums.taskHours;
    cell.dataset.moveh  = sums.moveHours;
    cell.dataset.noneh  = sums.noneHours;

    const dayEl=document.createElement('div'); dayEl.className='day'; dayEl.textContent=day;
    const utilEl=document.createElement('div'); utilEl.className='util'; utilEl.textContent=(included && workerHours.length)?`${fmtPct(util)}%`:'-';

    cell.appendChild(dayEl); cell.appendChild(utilEl);
    grid.appendChild(cell);
  }
}

// ===============================
// Ranking (색/스크롤/라벨)
// ===============================
const GREY_TASK = 'rgba(156,163,175,0.85)';
const GREY_NONE = 'rgba(107,114,128,0.85)';
const GREY_MOVE = 'rgba(75,85,99,0.85)';
const GREY_COUNT= 'rgba(163,163,163,0.85)';
const HL_TASK   = '#60a5fa';
const HL_NONE   = '#93c5fd';
const HL_MOVE   = '#bfdbfe';
const HL_COUNT  = '#60a5fa';

function buildRankColors(labels, query){
  const q = (query||'').trim().toLowerCase();
  const hit = (name) => q && name.toLowerCase().includes(q);
  return {
    task: labels.map(n=> hit(n)? HL_TASK : GREY_TASK),
    none: labels.map(n=> hit(n)? HL_NONE : GREY_NONE),
    move: labels.map(n=> hit(n)? HL_MOVE : GREY_MOVE),
    cnt:  labels.map(n=> hit(n)? HL_COUNT: GREY_COUNT),
  };
}

function setRankCanvasSizing(canvas, labelCount){
  const parent = canvas.parentElement;
  const useScroll = labelCount >= 25;
  if (useScroll) {
    const width = Math.max(900, labelCount * 36);
    canvas.width = width;
    canvas.height = 400;
    if (parent) parent.style.overflowX = 'auto';
    return { responsive:false, maintainAspectRatio:false };
  } else {
    // 스크롤 없이 꽉 채우기
    if (parent) parent.style.overflowX = 'hidden';
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    return { responsive:true, maintainAspectRatio:false };
  }
}

// 시간 랭킹
let rankTimeChart, rankCountChart;
function upsertRankTime(canvas, allRows, query){
  const labels = allRows.map(r=>r.name);
  const task   = allRows.map(r=>r.taskH);
  const none   = allRows.map(r=>r.noneH);
  const move   = allRows.map(r=>r.moveH);
  const totals = allRows.map(r=>r.totalH);
  const avg    = totals.reduce((a,b)=>a+b,0) / (totals.length||1);
  const colors = buildRankColors(labels, query);

  const sizing = setRankCanvasSizing(canvas, labels.length);

  const cfg = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label:'작업(task)', data: task, stack:'t', backgroundColor: colors.task, barPercentage:0.9, categoryPercentage:0.9 },
        { label:'대기(none)', data: none, stack:'t', backgroundColor: colors.none, barPercentage:0.9, categoryPercentage:0.9 },
        { label:'이동(move)', data: move, stack:'t', backgroundColor: colors.move, barPercentage:0.9, categoryPercentage:0.9 },
        { type:'line', label:`평균 ${fmtHour(avg)}h`, data: labels.map(()=>avg), yAxisID:'y',
          borderDash:[6,4], pointRadius:0, borderWidth:2, borderColor:'#e5e7eb', fill:false, tension:0 }
      ]
    },
    options:{
      ...sizing,
      scales:{
        y:{ beginAtZero:true, title:{display:true, text:'시간(h)'} },
        x:{ ticks:{ autoSkip:false, maxRotation:40, minRotation:0 } }
      },
      plugins:{
        legend:{ display:true },
        datalabels:{
          display:true, anchor:'end', align:'end', offset:2, clamp:true,
          color:'#e5e7eb', font:{ weight:700, size:10 },
          // 스택 최상단에서 총합 라벨만
          formatter:(value, ctx)=>{
            if (ctx.dataset.type === 'line') return null;
            const isTopStack = (ctx.datasetIndex === 2);
            if (!isTopStack) return '';
            const i = ctx.dataIndex;
            const sum = (ctx.chart.data.datasets[0].data[i]||0)
                      + (ctx.chart.data.datasets[1].data[i]||0)
                      + (ctx.chart.data.datasets[2].data[i]||0);
            return `${Math.round(sum)}h`;
          }
        },
        tooltip:{
          callbacks:{
            label:(ctx)=> ctx.dataset.type==='line'
              ? `평균: ${fmtHour(ctx.parsed.y)}h`
              : `${ctx.dataset.label}: ${fmtHour(ctx.parsed.y)}h`
          }
        }
      }
    }
  };
  if (rankTimeChart) rankTimeChart.destroy();
  rankTimeChart = new Chart(canvas.getContext('2d'), cfg);
}

// 건수 랭킹
function upsertRankCount(canvas, allRows, query){
  const labels = allRows.map(r=>r.name);
  const counts = allRows.map(r=>r.count);
  const avg = counts.reduce((a,b)=>a+b,0) / (counts.length||1);
  const colors = buildRankColors(labels, query);

  const sizing = setRankCanvasSizing(canvas, labels.length);

  const cfg = {
    type:'bar',
    data:{
      labels,
      datasets:[
        { label:'작업 건수', data: counts, backgroundColor: colors.cnt, barPercentage:0.9, categoryPercentage:0.9 },
        { type:'line', label:`평균 ${avg.toFixed(2)}건`, data: labels.map(()=>avg), yAxisID:'y',
          borderDash:[6,4], pointRadius:0, borderWidth:2, borderColor:'#e5e7eb', fill:false, tension:0 }
      ]
    },
    options:{
      ...sizing,
      scales:{
        y:{ beginAtZero:true, title:{display:true, text:'건수'} },
        x:{ ticks:{ autoSkip:false, maxRotation:40, minRotation:0 } }
      },
      plugins:{
        legend:{ display:true },
        datalabels:{
          display:true, anchor:'end', align:'end', offset:2, clamp:true,
          color:'#e5e7eb', font:{ weight:700, size:10 },
          formatter:(value, ctx)=> ctx.dataset.type === 'line' ? null : `${value}건`
        },
        tooltip:{
          callbacks:{
            label:(ctx)=> ctx.dataset.type==='line'
              ? `평균: ${ctx.parsed.y.toFixed(2)}건`
              : `${ctx.dataset.label}: ${ctx.parsed.y}건`
          }
        }
      }
    }
  };
  if (rankCountChart) rankCountChart.destroy();
  rankCountChart = new Chart(canvas.getContext('2d'), cfg);
}

// ===============================
// Site / Weekly Combo Charts (스타일 튠)
// ===============================
let siteChart, weeklyChart;

function computeYAxisMax(values){
  const m = Math.max(0, ...values);
  const target = Math.max(100, m * 1.1);
  return Math.ceil(target / 10) * 10;
}

function upsertSiteCombo(canvas, rows) {
  const labels   = SITE_KEYS;
  const utilVals = labels.map(k => rows.find(r=>r.key===k)?.util || 0);
  const hdayVals = labels.map(k => rows.find(r=>r.key===k)?.hday || 0);
  const yMax     = computeYAxisMax(utilVals);

  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0,  'rgba(0, 90, 201, 0.95)');
  grad.addColorStop(1,  'rgba(0, 81, 255, 0.85)');

  const cfg = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: '가동율(%)',
          data: utilVals,
          yAxisID: 'y',
          borderWidth: 0,
          backgroundColor: grad,
          datalabels: {
            anchor: 'end',
            align: 'end',
            offset: 4,
            clip: true,
            color: '#e6f0ff',
            backgroundColor: 'rgba(2,6,23,0.45)',
            borderRadius: 6,
            padding: {top:2,right:6,bottom:2,left:6},
            font: { weight: 700, size: 11 },
            formatter: (v) => `${fmtPct(v)}%`
          }
        },
        {
          type: 'line',
          label: 'H/Day(시간)',
          data: hdayVals,
          yAxisID: 'y1',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 4,
          borderWidth: 2,
          borderColor: 'rgba(34,211,238,0.95)',
          pointBackgroundColor: 'rgba(34,211,238,1)',
          pointBorderColor: 'rgba(11,15,20,1)',
          backgroundColor: 'transparent',
          datalabels: {
            align: 'top',
            anchor: 'end',
            offset: 2,
            color: '#cbd5e1',
            font: { weight: 600, size: 10 },
            backgroundColor: 'rgba(2,6,23,0.35)',
            borderRadius: 6,
            padding: {top:1,right:5,bottom:1,left:5},
            formatter: (v)=> `${fmtHour(v)}h`
          }
        }
      ]
    },
    options: {
      responsive: true,
      aspectRatio: 3.2,
      scales: {
        y:  {
          beginAtZero: true,
          max: yMax,
          grid: { color: 'rgba(148,163,184,0.12)' },
          ticks:{ color:'#9fb2c7', callback: v => `${v}%` },
          title:{ display:true, text:'가동율(%)', color:'#cfe0f5', font:{weight:700} }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks:{ color:'#9fb2c7' },
          title:{ display:true, text:'H/Day(시간)', color:'#cfe0f5', font:{weight:700} }
        }
      },
      plugins: {
        legend: { display: true, labels: { color: '#cfe0f5', boxWidth: 12, boxHeight: 12 } },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.92)',
          titleColor: '#e6f0ff',
          bodyColor: '#d5e2f1',
          borderColor: 'rgba(96,165,250,0.45)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ctx.dataset.yAxisID === 'y'
              ? `가동율: ${fmtPct(ctx.parsed.y)}%`
              : `H/Day: ${fmtHour(ctx.parsed.y)}h`
          }
        }
      }
    }
  };

  if (siteChart) siteChart.destroy();
  siteChart = new Chart(ctx, cfg);
}

function upsertWeeklyCombo(canvas, rows) {
  const labels   = rows.map(r => r.key);
  const utilVals = rows.map(r => r.util);
  const hdayVals = rows.map(r => r.hday);
  const yMax     = computeYAxisMax(utilVals);

  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0,  'rgba(0, 91, 196, 0.95)');
  grad.addColorStop(1,  'rgba(0, 98, 255, 0.85)');

  const cfg = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: '가동율(%)',
          data: utilVals,
          yAxisID: 'y',
          borderWidth: 0,
          backgroundColor: grad,
          datalabels: {
            anchor: 'end',
            align: 'end',
            offset: 4,
            clip: true,
            color: '#eef5ff',
            backgroundColor: 'rgba(2,6,23,0.45)',
            borderRadius: 6,
            padding: {top:2,right:6,bottom:2,left:6},
            font: { weight: 700, size: 11 },
            formatter: (v)=> `${fmtPct(v)}%`
          }
        },
        {
          type: 'line',
          label: 'H/Day(시간)',
          data: hdayVals,
          yAxisID: 'y1',
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 4,
          borderWidth: 2,
          borderColor: 'rgba(125,211,252,0.95)',
          pointBackgroundColor: 'rgba(125,211,252,1)',
          pointBorderColor: 'rgba(11,15,20,1)',
          backgroundColor: 'transparent',
          datalabels: {
            align: 'top',
            anchor: 'end',
            offset: 2,
            color: '#cad6e6',
            font: { weight: 600, size: 10 },
            backgroundColor: 'rgba(2,6,23,0.35)',
            borderRadius: 6,
            padding: {top:1,right:5,bottom:1,left:5},
            formatter: (v)=> `${fmtHour(v)}h`
          }
        }
      ]
    },
    options: {
      responsive: true,
      aspectRatio: 3.2,
      scales: {
        y:  {
          beginAtZero: true,
          max: yMax,
          grid: { color: 'rgba(148,163,184,0.12)' },
          ticks:{ color:'#9fb2c7', callback: v => `${v}%` },
          title:{ display:true, text:'가동율(%)', color:'#cfe0f5', font:{weight:700} }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks:{ color:'#9fb2c7' },
          title:{ display:true, text:'H/Day(시간)', color:'#cfe0f5', font:{weight:700} }
        }
      },
      plugins: {
        legend: { display: true, labels: { color: '#cfe0f5', boxWidth: 12, boxHeight: 12 } },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.92)',
          titleColor: '#e6f0ff',
          bodyColor: '#d5e2f1',
          borderColor: 'rgba(96,165,250,0.45)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ctx.dataset.yAxisID === 'y'
              ? `가동율: ${fmtPct(ctx.parsed.y)}%`
              : `H/Day: ${fmtHour(ctx.parsed.y)}h`
          }
        }
      }
    }
  };

  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(ctx, cfg);
}

// ===============================
// API / Filtering
// ===============================
async function loadWorkLogs() {
  try {
    const response = await axios.get('http://3.37.73.151:3001/logs', {
      headers: { 'x-access-token': localStorage.getItem('x-access-token') }
    });
    return response.data;
  } catch (e) {
    console.error('작업 일지를 불러오는 중 오류 발생:', e);
    return [];
  }
}

function filterLogs(logs, { startDate, endDate, group, site }) {
  const s = startDate || null;
  const e = endDate   || null;
  return logs.filter((row) => {
    const rowYMD = ymdFromAny(row.task_date);
    if (!rowYMD) return false;
    if (s && rowYMD < s) return false;
    if (e && rowYMD > e) return false;
    if (group && String(row.group || "").trim() !== String(group).trim()) return false;
    if (site && String(row.site || "").trim() !== String(site).trim()) return false;
    return true;
  });
}

function inferDateRangeIfEmpty(startDate, endDate, logs) {
  if (startDate && endDate) return { start: startDate, end: endDate };
  let min = null, max = null;
  for (const r of logs) {
    const y = ymdFromAny(r.task_date);
    if (!y) continue;
    if (!min || y < min) min = y;
    if (!max || y > max) max = y;
  }
  return { start: min, end: max };
}

// ===============================
// Views / Modal / UI wiring
// ===============================
let allLogs = [];
let rankAllRows = [];

function bindTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.querySelectorAll('.view').forEach(v=>{
      v.classList.toggle('active', v.id === `view-${view}`);
    });
  }));
}

// ✅ 모달: 해당 날짜의 계산과정까지 표기
function openDayModal(dateYMD){
  // 현재 토글/설정 읽기
  const includeTask = document.getElementById("includeTask")?.checked ?? true;
  const includeNone = document.getElementById("includeNone")?.checked ?? false;
  const includeMove = document.getElementById("includeMove")?.checked ?? true; // 기본값 true
  const toggles = { includeTask, includeNone, includeMove };

  const utilMode = (document.getElementById('utilMode')?.value) || 'weekday';
  let baseHours = parseFloat(document.getElementById('utilBase')?.value);
  if (!isFinite(baseHours) || baseHours <= 0) baseHours = 4;

  // 날짜별 로그 / 포함여부
  const logsForDay = allLogs.filter(r => ymdFromAny(r.task_date) === dateYMD);
  const included   = includeByMode(dateYMD, utilMode);
  const dayTypeLbl = (dayCategory(dateYMD) === 'weekday') ? '평일' : '휴일/주말';
  const modeLbl    = utilMode === 'weekday' ? '평일만'
                    : utilMode === 'holiday' ? '공휴일만' : '전체';

  // 요약(기존 KPI들)
  const sums = dayCountsAndSums(logsForDay);
  const workerHours = included ? aggregateWorkerHoursFull(logsForDay, toggles) : [];
  const sumH  = workerHours.reduce((a,[,h])=>a+h,0);
  const sumH2 = workerHours.reduce((a,[,h])=>a+(h*h),0);
  const hday  = (included && sumH>0) ? (sumH2/sumH) : 0;
  const util  = (included && sumH>0 && baseHours>0) ? (hday/baseHours)*100 : 0;

  // 모달 상단 숫자 채우기
  document.getElementById('modalDate').textContent = dateYMD;
  document.getElementById('mHDay').textContent     = (included && sumH>0) ? fmtHour(hday) : '-';
  document.getElementById('mUtil').textContent     = (included && sumH>0) ? `${fmtPct(util)}%` : '-';

  document.getElementById('mSingle').textContent   = sums.singleWorkers;
  document.getElementById('mMulti').textContent    = sums.multiWorkers;
  document.getElementById('mWorkers').textContent  = sums.totalWorkers;
  document.getElementById('mTaskH').textContent    = fmtHour(Number(sums.taskHours));
  document.getElementById('mMoveH').textContent    = fmtHour(Number(sums.moveHours));
  document.getElementById('mNoneH').textContent    = fmtHour(Number(sums.noneHours));

  // 계산식 영역 HTML
  let html = '';
  if (!included) {
    html = `
      <div class="note excluded">
        이 날짜는 <b>${dayTypeLbl}</b>이며, '가동율 기준'이 <b>${modeLbl}</b>로 설정되어 있어
        <b>계산에서 제외</b>되었습니다.
      </div>
    `;
  } else if (workerHours.length === 0) {
    html = `<div class="note">이 날짜에 계산에 포함된 시간이 없습니다.</div>`;
  } else {
    const items = workerHours
      .sort((a,b)=>b[1]-a[1])
      .map(([n,h])=>`<li><code>${n}</code> : ${fmtHour(h)}h</li>`)
      .join('');
    html = `
      <div class="formula">
        <div><b>공식</b> : H/Day = Σ(hᵢ²) / Σ(hᵢ)  <span class="dim">(하루는 d = 1)</span></div>
        <div><b>Σ(hᵢ)</b> = ${fmtHour(sumH)} h</div>
        <div><b>Σ(hᵢ²)</b> = ${fmtHour(sumH2)} h²</div>
        <div><b>H/Day</b> = ${fmtHour(sumH2)} ÷ ${fmtHour(sumH)} = <b>${fmtHour(hday)} h</b></div>
        <div><b>가동율</b> = H/Day ÷ 기준(${baseHours}h) × 100% = <b>${fmtPct(util)}%</b></div>
        <div class="hint">* 계산에는 현재 선택된 항목만 포함됨: ${
          [includeTask?'작업':'', includeMove?'이동':'', includeNone?'대기':''].filter(Boolean).join(', ') || '없음'
        }</div>
      </div>
      <details class="workers"><summary>작업자별 시간 목록 (${workerHours.length}명)</summary>
        <ol>${items}</ol>
      </details>
    `;
  }
  const calcBox = document.getElementById('mCalc');
  if (calcBox) calcBox.innerHTML = html;

  document.getElementById('dayModal').classList.remove('hidden');
}

function bindModal(){
  document.getElementById('closeModal')?.addEventListener('click',()=>{ document.getElementById('dayModal').classList.add('hidden'); });
  document.getElementById('dayModal')?.addEventListener('click',(e)=>{ if(e.target.id==='dayModal') e.currentTarget.classList.add('hidden'); });
}

function wireStaticUI(){
  // date 아이콘 버튼 → 기본 달력 오픈
  document.querySelectorAll('.cal-btn-input').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.target;
      const input = document.getElementById(id);
      if (input && typeof input.showPicker === 'function') input.showPicker();
      else input?.focus();
    });
  });

  // 최근 3개월 / 30일 상호배타
  const recent3m = document.getElementById('recent3m');
  const recent30 = document.getElementById('recent30');

  recent3m?.addEventListener('change', (e)=>{
    if (e.target.checked){
      if (recent30) recent30.checked = false;
      setRecent3mDates();
    } else clearDateInputs();
  });
  recent30?.addEventListener('change', (e)=>{
    if (e.target.checked){
      if (recent3m) recent3m.checked = false;
      setRecent30Dates();
    } else clearDateInputs();
  });

  // 시작/종료 변경 시 토글 해제
  ['startDate','endDate'].forEach(id=>{
    const el = document.getElementById(id);
    el?.addEventListener('change', ()=>{
      if (recent3m?.checked) recent3m.checked = false;
      if (recent30?.checked) recent30.checked = false;
    });
  });

  // 랭킹 검색
  const rankSearch    = document.getElementById('rankSearch');
  const rankSearchBtn = document.getElementById('rankSearchBtn');
  const rankClear     = document.getElementById('rankClear');
  const doRankSearch  = ()=>{
    const q = rankSearch?.value || '';
    upsertRankTime(document.getElementById('rankTime'), rankAllRows, q);
    upsertRankCount(document.getElementById('rankCount'), rankAllRows, q);
  };
  rankSearch?.addEventListener('input', doRankSearch);
  rankSearch?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doRankSearch(); });
  rankSearchBtn?.addEventListener('click', doRankSearch);
  rankClear?.addEventListener('click', ()=>{ if(rankSearch) rankSearch.value=''; doRankSearch(); });
}

// ===============================
// Main flow
// ===============================
async function run(){
  allLogs = await loadWorkLogs();
  setCalendarToCurrentMonth();
  applyAndRender(false);
}

// ===============================
// Worker ranking aggregation (시간/건수 집계)
// ===============================
function computeWorkerAggRaw(logs) {
  const agg = new Map(); // name -> { task, none, move, count }
  for (const r of logs) {
    const workers = splitWorkers(r.task_man);
    if (!workers.length) continue;

    const taskMin = parseDurationToMinutes(r.task_duration);
    const noneMin = parseInt(r.none_time, 10) || 0;
    const moveMin = parseInt(r.move_time, 10) || 0;

    for (const w of workers) {
      if (!agg.has(w)) agg.set(w, { task: 0, none: 0, move: 0, count: 0 });
      const o = agg.get(w);
      o.task += taskMin;
      o.none += noneMin;
      o.move += moveMin;
      o.count += 1;
    }
  }

  // 배열화 + 총 시간 기준 내림차순 정렬
  return Array.from(agg.entries()).map(([name, v]) => ({
    name,
    taskH:  v.task / 60,
    noneH:  v.none / 60,
    moveH:  v.move / 60,
    totalH: (v.task + v.none + v.move) / 60,
    count:  v.count
  })).sort((a, b) => b.totalH - a.totalH);
}


// keepCalMonth: true면 endDate 기준으로 월 이동하지 않음
function applyAndRender(keepCalMonth=false){
  // 최근 기간 토글 적용
  const use3m   = document.getElementById("recent3m")?.checked;
  const use30   = document.getElementById("recent30")?.checked;
  if (use3m) setRecent3mDates();
  else if (use30) setRecent30Dates();

  // 입력값 수집
  const inputStart = document.getElementById("startDate")?.value || null;
  const inputEnd   = document.getElementById("endDate")?.value   || null;
  const group      = document.getElementById("groupSelect")?.value.trim() || '';
  const site       = document.getElementById("siteSelect")?.value.trim()  || '';

  const includeTask = document.getElementById("includeTask")?.checked ?? true;
  const includeNone = document.getElementById("includeNone")?.checked ?? false;
  const includeMove = document.getElementById("includeMove")?.checked ?? true; // ✅ 기본값 true
  const toggles = { includeTask, includeNone, includeMove };

  const utilMode = (document.getElementById('utilMode')?.value) || 'weekday'; // weekday|holiday|all
  let baseHours = parseFloat(document.getElementById('utilBase')?.value);
  if (!isFinite(baseHours) || baseHours <= 0) baseHours = 4;

  // 1차 필터
  const filteredByInputs = filterLogs(allLogs, {
    startDate: inputStart, endDate: inputEnd,
    group: group || null, site: site || null
  });

  // 날짜 미선택 시 자동 범위
  const baseLogs = filteredByInputs.length ? filteredByInputs : allLogs;
  const { start: inferredStart, end: inferredEnd } = inferDateRangeIfEmpty(inputStart, inputEnd, baseLogs);
  const finalStart = inputStart || inferredStart;
  const finalEnd   = inputEnd   || inferredEnd;

  // 최종 필터
  const filtered = filterLogs(allLogs, {
    startDate: finalStart, endDate: finalEnd,
    group: group || null, site: site || null
  });

  // KPI
  const dStd = (finalStart && finalEnd) ? countDaysByMode(finalStart, finalEnd, utilMode) : 0;
  const workerHours = aggregateWorkerHoursFull(filtered, toggles);
  const hday = weightedHDay(workerHours, dStd);
  const utilPct = (dStd > 0 && baseHours > 0) ? (hday / baseHours) * 100 : NaN;
  

  // KPI 출력
  document.getElementById("kpiHDay").textContent = (dStd > 0 && isFinite(hday)) ? fmtHour(hday) : "-";
  const modeLabel = utilMode === 'weekday' ? '평일 기준'
                  : utilMode === 'holiday' ? '공휴일 기준'
                  : '전체일 기준';
  document.getElementById("kpiHDayDetail").textContent = dStd > 0
    ? `Σ(h²/d)/Σh • ${modeLabel} • 기준 ${baseHours}h`
    : "기간을 선택하거나 자동 범위 사용";
  document.getElementById("kpiUtil").textContent = (dStd > 0 && isFinite(utilPct)) ? `${fmtPct(utilPct)}%` : "-";
  document.getElementById("kpiWorkers").textContent = workerHours.length;
  document.getElementById("kpiTotalHours").textContent = fmtHour(workerHours.reduce((a,[,h])=>a+h,0));
  document.getElementById("kpiDstd").textContent = dStd || "-";

  // 그래프(사이트/주차)
  const siteRows   = computeSiteMetrics(filtered, dStd, toggles, baseHours);
  const weeklyRows = computeWeeklyMetrics(filtered, toggles, utilMode, baseHours);
  upsertSiteCombo(document.getElementById('siteCombo'), siteRows);
  upsertWeeklyCombo(document.getElementById('weeklyCombo'), weeklyRows);

  // 달력
  const endForCalendar = inputEnd || finalEnd;
  if(!keepCalMonth && endForCalendar) setCalendarByEndDate(endForCalendar);
  buildCalendar(filtered, toggles, utilMode, baseHours);

  // 달력 클릭 -> 모달 (날짜만 전달하고 내부에서 재계산)
  document.querySelectorAll('#calendarGrid .cal-cell').forEach(cell=>{
    const ymd = cell.dataset.date;
    if(!ymd) return;
    cell.addEventListener('click', ()=> openDayModal(ymd));
  });

  // 랭킹
  rankAllRows = computeWorkerAggRaw(filtered);
  const q = (document.getElementById('rankSearch')?.value) || '';
  upsertRankTime(document.getElementById('rankTime'),  rankAllRows, q);
  upsertRankCount(document.getElementById('rankCount'), rankAllRows, q);
}

// ===============================
// Range Helpers / Reset
// ===============================
function setRecent30Dates(){
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  document.getElementById("startDate").value = toYMDLocal(start);
  document.getElementById("endDate").value   = toYMDLocal(end);
}
function setRecent3mDates(){
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 89);
  document.getElementById("startDate").value = toYMDLocal(start);
  document.getElementById("endDate").value   = toYMDLocal(end);
}
function clearDateInputs(){
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value   = "";
}

function onReset(){
  document.getElementById("groupSelect").value = "";
  document.getElementById("siteSelect").value  = "";
  document.getElementById("includeTask").checked = true;
  document.getElementById("includeNone").checked = false;
  document.getElementById("includeMove").checked = true; // ✅ 리셋 후에도 move 기본 체크

  document.getElementById("recent3m").checked = false;
  document.getElementById("recent30").checked = false;
  clearDateInputs();
  setCalendarToCurrentMonth();

  // 검색 초기화
  const rs = document.getElementById('rankSearch');
  if (rs) rs.value = '';

  // 가동율 기준/분모 초기화
  const utilModeEl = document.getElementById('utilMode');
  if (utilModeEl) utilModeEl.value = 'weekday';
  const utilBaseEl = document.getElementById('utilBase');
  if (utilBaseEl) utilBaseEl.value = 4;

  applyAndRender(false);
}
