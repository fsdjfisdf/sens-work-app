// 서버가 다른 호스트/포트면 URL 지정
const API_BASE_URL = "http://3.37.73.151:3001";

/* ======== 날짜/문자 포맷 유틸 ======== */
function fmtYMD(d){ const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,'0'),da=String(d.getUTCDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
const WEEK_KO = ['일','월','화','수','목','금','토'];

function toKst(dateLike){
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike);
  return new Date(d.getTime() + 9*3600*1000);
}
function fmtKstYMDWithWeek(dateLike){
  const k = toKst(dateLike);
  return `${fmtYMD(k)} (${WEEK_KO[k.getUTCDay()]})`;
}
function weekRange(weekStartISO){
  const s = new Date(weekStartISO+'T00:00:00Z');
  const e = new Date(s.getTime() + 6*24*3600*1000);
  const ks = toKst(s), ke = toKst(e);
  const m2 = String(ke.getUTCMonth()+1).padStart(2,'0');
  const d2 = String(ke.getUTCDate()).padStart(2,'0');
  return `${fmtYMD(ks)}~${m2}-${d2}`;
}
function getKstMondayISO(base = new Date()) {
  const kst = toKst(base);
  const dow = kst.getUTCDay(); // 0=일
  const diff = (dow === 0 ? -6 : 1 - dow);
  const mon = new Date(kst);
  mon.setUTCDate(kst.getUTCDate() + diff);
  return fmtYMD(mon);
}
function ensureMonday(dateStr) {
  if (!dateStr) return getKstMondayISO();
  return getKstMondayISO(new Date(dateStr + 'T00:00:00'));
}
function tidyCause(s){ return (s||'').replace(/^[.\-\s]+/, '').trim() || '미기재'; }
function tidyEq(s){ return (s||'').toUpperCase(); }
function fmtH(n){ if(n==null||isNaN(n)) return '-'; return Number(n).toFixed(2)+'h'; }
function esc(s){ return String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* evidence 앞쪽의 긴 Date 문자열을 KST로 축약 */
function normalizeEvidence(evd){
  if(!evd) return '-';
  const m = String(evd).match(/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{4} [\d:]{8} GMT[^\)]*\)/);
  if (m) {
    const d = new Date(m[0]);
    const rest = String(evd).slice(m[0].length).trim();
    return `${fmtKstYMDWithWeek(d)} ${rest}`;
  }
  return evd;
}

/* ======== 상태 라벨 ======== */
function setStatus(msg, isError=false){
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.style.color = isError ? '#b91c1c' : '#6f665d';
}

/* ======== API ======== */
async function requestWeekly({ group, site, week, force=false }) {
  const token = localStorage.getItem('x-access-token');
  const headers = token ? { 'x-access-token': token } : {};
  const url = `${API_BASE_URL}/reports/weekly-summary?group=${encodeURIComponent(group)}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(week)}${force ? '&force=1' : ''}`;
  const res = await axios.get(url, { headers });
  return res.data;
}

/* ======== 렌더 ======== */
function render(d) {
  // 상단 메타
  const grp = (d.group||'').toUpperCase();
  const site = (d.site||'').toUpperCase();
  const wk = d.week_start;

  // 한 줄 요약(그대로 표시) + 필 배지
  document.getElementById('one').textContent = d?.llm_summary_json?.one_liner || '-';
  const pill = document.getElementById('meta-pill');
  pill.style.display = 'inline-block';
  pill.textContent = `${grp}-${site} · ${weekRange(wk)}`;
  document.getElementById('meta').textContent = `${grp}-${site} / 주 시작: ${fmtKstYMDWithWeek(wk)}`;

  // KPI
  const k = d?.kpis_json || {};
  const pairs = [
    ['총 작업수', k.total_tasks ?? '-'],
    ['총 작업시간(합계)', fmtH(k.sum_total_hours)],
    ['작업시간', fmtH(k.sum_task_hours)],
    ['이동시간', fmtH(k.sum_move_hours)],
    ['평균/건', fmtH(k.avg_task_hours)],
    ['주말 작업', (k.weekend_tasks ?? 0)+'건'],
    ['실패/미해결', (k.failed_tasks ?? 0)+'건'],
  ];
  const kEl = document.getElementById('kpis'); kEl.innerHTML = '';
  pairs.forEach(([label, val]) => {
    const div = document.createElement('div');
    div.className = 'kpi-item';
    div.innerHTML = `<div class="label">${esc(label)}</div><div class="value">${esc(val)}</div>`;
    kEl.appendChild(div);
  });

  // 이슈 Top3 (타이틀/근거/권고를 정돈하여 출력)
  const issues = d?.llm_summary_json?.top_issues || [];
  const iEl = document.getElementById('issues'); iEl.innerHTML = '';
  issues.forEach(issue => {
    // 타이틀 보정 (장비/원인 정리)
    let title = String(issue.title || '');
    title = title.replace(/(장비 집중:\s*)(\S+)/, (_, p, eq) => p + tidyEq(eq));
    title = title.replace(/(장시간\/이슈 사례:\s*)(\S+)/, (_, p, eq) => p + tidyEq(eq));
    title = title.replace(/(반복 원인:\s*)(.+)/, (_, p, c) => p + tidyCause(c));

    const evd = normalizeEvidence(issue.evidence || '');
    const rec = tidyCause(issue.recommendation || '-');

    const li = document.createElement('li');
    li.innerHTML = `
      <div class="issue-title">${esc(title)}</div>
      <div class="evd">${esc(evd)}</div>
      <div class="muted">권고: ${esc(rec)}</div>
    `;
    iEl.appendChild(li);
  });

  // 다음 액션
  const actions = d?.llm_summary_json?.next_actions || [];
  const aEl = document.getElementById('actions'); aEl.innerHTML = '';
  actions.forEach(s => { const li = document.createElement('li'); li.textContent = s; aEl.appendChild(li); });
}

/* ======== 실행 ======== */
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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('week').value = getKstMondayISO();
  document.getElementById('run').addEventListener('click', () => run(false));
  document.getElementById('force').addEventListener('click', () => run(true));
  document.getElementById('copy-one').addEventListener('click', async () => {
    const text = document.getElementById('one').textContent || '';
    try { await navigator.clipboard.writeText(text); setStatus('복사 완료'); setTimeout(()=>setStatus(''),1200); }
    catch { setStatus('복사 실패', true); }
  });
  run(false);
});
