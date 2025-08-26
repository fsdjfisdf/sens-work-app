// 같은 호스트/포트에서 서빙 중이 아니면 서버 URL을 기입
const API_BASE_URL = "http://3.37.73.151:3001";

/** KST 기준 이번 주 월요일(YYYY-MM-DD) */
function fmtYMD(d){ const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
function getKstMondayISO(base = new Date()) {
  const kst = new Date(base.getTime() + 9*60*60*1000);
  const dow = kst.getUTCDay(); // 0=일
  const diff = (dow === 0 ? -6 : 1 - dow);
  const mon = new Date(kst);
  mon.setUTCDate(kst.getUTCDate() + diff);
  return fmtYMD(mon);
}
/** 입력이 월요일이 아니면 해당 주 '월요일'로 보정(KST) */
function ensureMonday(dateStr) {
  if (!dateStr) return getKstMondayISO();
  const base = new Date(dateStr + 'T00:00:00');
  return getKstMondayISO(base);
}

function setStatus(msg, isError=false){
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.style.color = isError ? '#b91c1c' : '#6f665d';
}

async function requestWeekly({ group, site, week, force=false }) {
  const token = localStorage.getItem('x-access-token');
  const headers = token ? { 'x-access-token': token } : {};

  // 1순위: /reports/weekly-summary
  const url1 = `${API_BASE_URL}/reports/weekly-summary?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(week)}${force ? '&force=1' : ''}`;

  try {
    const res = await axios.get(url1, { headers });
    return res.data;
  } catch (e) {
    if (e?.response?.status === 401) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      throw e;
    }
    // 폴백: /api/reports/weekly 형태를 쓰는 서버일 때
    if (e?.response?.status === 404) {
      const url2 = `${API_BASE_URL}/api/reports/weekly?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(week)}${force ? '&force=1' : ''}`;
      const res2 = await axios.get(url2, { headers });
      return res2.data;
    }
    throw e;
  }
}

async function run(force=false) {
  try {
    setStatus('불러오는 중…');
    const group = document.getElementById('group').value;
    const site  = document.getElementById('site').value;
    const weekInput = document.getElementById('week').value;
    const week = ensureMonday(weekInput);

    if (weekInput !== week) document.getElementById('week').value = week;

    const data = await requestWeekly({ group, site, week, force });
    render(data);
    setStatus('완료');
    setTimeout(() => setStatus(''), 1500);
  } catch (err) {
    console.error('weekly summary error:', err);
    const status = err?.response?.status;
    const msg = err?.response?.data?.error || err?.message || '요약 조회 실패';
    setStatus(`에러 ${status ?? ''} ${msg}`, true);
    alert(`요약 조회 실패\n${status ? `HTTP ${status}\n` : ''}${msg}`);
  }
}

function render(d) {
  document.getElementById('one').textContent = d?.llm_summary_json?.one_liner || '-';
  document.getElementById('meta').textContent = `${d.group}-${d.site} / 주 시작: ${d.week_start}`;

  const k = d?.kpis_json || {};
  const pairs = [
    ['총 작업수', k.total_tasks],
    ['총 작업시간(합계)', `${k.sum_total_hours ?? 0}h`],
    ['작업시간', `${k.sum_task_hours ?? 0}h`],
    ['이동시간', `${k.sum_move_hours ?? 0}h`],
    ['평균/건', `${k.avg_task_hours ?? 0}h`],
    ['주말 작업', `${k.weekend_tasks ?? 0}건`],
    ['실패/미해결', `${k.failed_tasks ?? 0}건`],
  ];
  const kEl = document.getElementById('kpis'); kEl.innerHTML = '';
  pairs.forEach(([label, val]) => {
    const div = document.createElement('div');
    div.innerHTML = `<div class="muted">${label}</div><div style="font-weight:700">${val ?? '-'}</div>`;
    kEl.appendChild(div);
  });

  const issues = d?.llm_summary_json?.top_issues || [];
  const iEl = document.getElementById('issues'); iEl.innerHTML = '';
  issues.forEach(x => {
    const li = document.createElement('li');
    li.innerHTML = `<div><b>${x.title}</b></div><div class="muted">${x.evidence}</div><div>권고: ${x.recommendation}</div>`;
    iEl.appendChild(li);
  });

  const actions = d?.llm_summary_json?.next_actions || [];
  const aEl = document.getElementById('actions'); aEl.innerHTML = '';
  actions.forEach(s => { const li = document.createElement('li'); li.textContent = s; aEl.appendChild(li); });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('week').value = getKstMondayISO();
  document.getElementById('run').addEventListener('click', () => run(false));
  document.getElementById('force').addEventListener('click', () => run(true));
  document.getElementById('copy-one').addEventListener('click', async () => {
    const text = document.getElementById('one').textContent || '';
    try { await navigator.clipboard.writeText(text); setStatus('복사 완료'); setTimeout(()=>setStatus(''),1200); }
    catch { setStatus('복사 실패', true); }
  });

  run(false); // 최초 자동 호출
});
