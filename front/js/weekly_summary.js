const API_BASE_URL = ""; // 같은 도메인에서 서빙이면 빈 문자열 유지(프록시X). 포트 다르면 "http://<IP>:3001"

function fmtYMD(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
function getKstMondayISO() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9*60*60*1000);
  const dow = kst.getUTCDay(); // 0=일
  const diff = (dow === 0 ? -6 : 1 - dow);
  const mon = new Date(kst);
  mon.setUTCDate(kst.getUTCDate() + diff);
  return fmtYMD(mon);
}

async function run() {
  const group = document.getElementById('group').value;
  const site  = document.getElementById('site').value;
  const week  = document.getElementById('week').value || getKstMondayISO();

  // 토큰을 쓰신다면 헤더에 붙이세요
  const headers = {};
  const token = localStorage.getItem('x-access-token');
  if (token) headers['x-access-token'] = token;

  const url = `${API_BASE_URL}/reports/weekly-summary?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(week)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) { alert('요약 조회 실패'); return; }
  const data = await res.json();
  render(data);
}

function render(d) {
  document.getElementById('one').textContent = d?.llm_summary_json?.one_liner || '-';
  document.getElementById('meta').textContent = `${d.group}-${d.site} / 주 시작: ${d.week_start}`;

  const k = d.kpis_json || {};
  const pairs = [
    ['총 작업수', k.total_tasks],
    ['총 작업시간(합계)', `${k.sum_total_hours}h`],
    ['작업시간', `${k.sum_task_hours}h`],
    ['이동시간', `${k.sum_move_hours}h`],
    ['평균/건', `${k.avg_task_hours}h`],
    ['주말 작업', `${k.weekend_tasks}건`],
    ['실패/미해결', `${k.failed_tasks}건`],
  ];
  const kEl = document.getElementById('kpis'); kEl.innerHTML = '';
  pairs.forEach(([label, val]) => {
    const div = document.createElement('div');
    div.innerHTML = `<div class="muted">${label}</div><div style="font-weight:700">${val ?? '-'}</div>`;
    kEl.appendChild(div);
  });

  const issues = d.llm_summary_json?.top_issues || [];
  const iEl = document.getElementById('issues'); iEl.innerHTML = '';
  issues.forEach(x => {
    const li = document.createElement('li');
    li.innerHTML = `<div><b>${x.title}</b></div><div class="muted">${x.evidence}</div><div>권고: ${x.recommendation}</div>`;
    iEl.appendChild(li);
  });

  const actions = d.llm_summary_json?.next_actions || [];
  const aEl = document.getElementById('actions'); aEl.innerHTML = '';
  actions.forEach(s => { const li = document.createElement('li'); li.textContent = s; aEl.appendChild(li); });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('week').value = getKstMondayISO();
  document.getElementById('run').addEventListener('click', run);
  run(); // 최초 자동
});
