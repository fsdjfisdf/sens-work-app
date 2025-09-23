// paid-report.js
(function(){
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  // 맨 위에 추가
const API_BASE = 'http://3.37.73.151:3001';

// 기존 fetch 부분을 이렇게
async function fetchData(filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  const token = localStorage.getItem('x-access-token') || '';
  const res = await fetch(`${API_BASE}/api/work-log-paid/search?${qs}`, {
    headers: { 'x-access-token': token }
  });
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

  const PAGE = { all: [], page: 1, size: 50 };

  // 날짜 기본: 최근 30일
  function setDefaultDates(){
    const to   = new Date();
    const from = new Date(); from.setDate(to.getDate()-30);
    $('#f-date-to').value   = to.toISOString().slice(0,10);
    $('#f-date-from').value = from.toISOString().slice(0,10);
  }

  function toMin(hhmmOrHHMMSS){
    if(!hhmmOrHHMMSS) return 0;
    const s = hhmmOrHHMMSS.length===5 ? hhmmOrHHMMSS+':00' : hhmmOrHHMMSS;
    const [h,m] = s.split(':').map(Number);
    return (h*60 + m) | 0;
  }
  const fmtHour = (min)=> (min/60).toFixed(1)+'h';

  // 필터 -> 쿼리스트링
  function buildQuery(){
    const p = new URLSearchParams();
    const v = (id)=>$('#'+id).value.trim();
    const add = (k, val)=>{ if(val!=='' && val!=null) p.set(k, val); };

    add('date_from', v('f-date-from'));
    add('date_to',   v('f-date-to'));
    add('group',     v('f-group'));
    add('site',      v('f-site'));
    add('worker',    v('f-worker'));
    add('line',      v('f-line'));
    add('equipment_type', v('f-eq-type'));
    add('equipment_name', v('f-eq-name'));
    add('ems',       v('f-ems'));
    p.set('limit', '5000'); // 안전장치
    return p.toString();
  }

  async function fetchData(){
    const qs = buildQuery();
    const token = localStorage.getItem('x-access-token') || '';
    const res = await fetch(`${API}?${qs}`, {
      headers:{ 'x-access-token': token }
    });
    if(!res.ok) throw new Error('검색 실패');
    const rows = await res.json();

    // 가공 필드(분/시간) 계산
    rows.forEach(r=>{
      r._inform_min = Math.max(0, toMin(r.inform_end_time)-toMin(r.inform_start_time));
      r._line_min   = Math.max(0, toMin(r.line_end_time)-toMin(r.line_start_time));
    });
    return rows;
  }

  function renderSummary(rows){
    $('#sum-count').textContent  = rows.length.toLocaleString();
    $('#sum-people').textContent = new Set(rows.map(r=>r.paid_worker)).size.toLocaleString();
    const inf = rows.reduce((a,b)=>a+b._inform_min, 0);
    const lin = rows.reduce((a,b)=>a+b._line_min,   0);
    $('#sum-inform').textContent = fmtHour(inf);
    $('#sum-line').textContent   = fmtHour(lin);
  }

  function renderTablePage(){
    const tbody = $('#paid-table tbody');
    tbody.innerHTML = '';
    const start = (PAGE.page-1) * PAGE.size;
    const pageRows = PAGE.all.slice(start, start+PAGE.size);

    const tr = (r)=>`
      <tr>
        <td>${r.task_date||''}</td>
        <td>${r.group||''}</td>
        <td>${r.site||''}</td>
        <td>${r.line||''}</td>
        <td>${r.equipment_type||''}</td>
        <td>${r.equipment_name||''}</td>
        <td>${r.paid_worker||''}</td>
        <td>${r.line_start_time||''}</td>
        <td>${r.line_end_time||''}</td>
        <td>${r.inform_start_time||''}</td>
        <td>${r.inform_end_time||''}</td>
        <td style="text-align:right">${r._inform_min||0}</td>
        <td style="text-align:right">${r._line_min||0}</td>
        <td>${r.task_name||''}</td>
        <td>${r.work_log_id||''}</td>
      </tr>`;
    tbody.innerHTML = pageRows.map(tr).join('');

    const totalPages = Math.max(1, Math.ceil(PAGE.all.length / PAGE.size));
    $('#pg-info').textContent = `${PAGE.page} / ${totalPages}`;
  }

  function populateSelectOptions(rows){
    function fill(id, key){
      const sel = $('#'+id);
      const cur = sel.value;
      const uniq = Array.from(new Set(rows.map(r=>r[key]).filter(Boolean))).sort();
      sel.innerHTML = `<option value="">ALL</option>` + uniq.map(v=>`<option>${v}</option>`).join('');
      if (uniq.includes(cur)) sel.value = cur; // 유지
    }
    fill('f-group', 'group');
    fill('f-site',  'site');
  }

  async function onSearch(){
    try{
      document.body.style.cursor='progress';
      const rows = await fetchData();
      PAGE.all = rows;
      PAGE.page = 1;
      renderSummary(rows);
      renderTablePage();
      // 그룹/사이트 옵션 자동 구축(초기/조회마다 갱신)
      populateSelectOptions(rows);
    }catch(e){
      toast('오류', e.message||'검색 실패');
    }finally{
      document.body.style.cursor='auto';
    }
  }

  function onReset(){
    $('#f-group').value='';
    $('#f-site').value='';
    $('#f-worker').value='';
    $('#f-line').value='';
    $('#f-eq-type').value='';
    $('#f-eq-name').value='';
    $('#f-ems').value='';
    setDefaultDates();
  }

  // CSV 내보내기(현재 필터 결과 그대로)
  function exportCSV(){
    const rows = PAGE.all;
    if(!rows.length){ toast('안내', '내보낼 데이터가 없습니다.'); return; }

    const header = [
      'task_date','group','site','line','equipment_type','equipment_name','paid_worker',
      'line_start_time','line_end_time','inform_start_time','inform_end_time',
      'inform_minutes','line_minutes','task_name','work_log_id'
    ];

    const esc = (v)=>{
      const s = (v==null?'':String(v));
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const lines = [];
    lines.push(header.join(','));
    for(const r of rows){
      lines.push([
        r.task_date, r.group, r.site, r.line, r.equipment_type, r.equipment_name, r.paid_worker,
        r.line_start_time, r.line_end_time, r.inform_start_time, r.inform_end_time,
        r._inform_min, r._line_min, r.task_name, r.work_log_id
      ].map(esc).join(','));
    }
    const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    const from = $('#f-date-from').value || 'all';
    const to   = $('#f-date-to').value   || 'all';
    a.download = `work_log_paid_${from}_${to}.csv`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // 토스트 간단 버전(기존 톤 차용)
  function toast(title, msg){
    const root = document.getElementById('toast-root') || (()=> {
      const d=document.createElement('div'); d.id='toast-root'; document.body.appendChild(d); return d;
    })();
    const box = document.createElement('div');
    box.className = 'toast';
    box.innerHTML = `<div class="toast-head"><strong>${title||'알림'}</strong></div><div class="toast-body">${msg||''}</div>`;
    root.appendChild(box);
    setTimeout(()=> box.remove(), 3800);
  }

  // 이벤트
  document.addEventListener('DOMContentLoaded', ()=>{
    setDefaultDates();
    $('#btn-search').addEventListener('click', onSearch);
    $('#btn-reset').addEventListener('click', ()=>{ onReset(); onSearch(); });
    $('#btn-export').addEventListener('click', exportCSV);

    // 엔터로 바로 조회
    $$('.filter-grid input, .filter-grid select').forEach(el=>{
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter') onSearch(); });
    });

    // 페이지/사이즈
    $('#pg-size').addEventListener('change', ()=>{
      PAGE.size = Number($('#pg-size').value||50) || 50;
      PAGE.page = 1;
      renderTablePage();
    });
    $('#pg-prev').addEventListener('click', ()=>{
      if(PAGE.page>1){ PAGE.page--; renderTablePage(); }
    });
    $('#pg-next').addEventListener('click', ()=>{
      const max = Math.max(1, Math.ceil(PAGE.all.length/PAGE.size));
      if(PAGE.page<max){ PAGE.page++; renderTablePage(); }
    });

    // 첫 로드 자동 조회
    onSearch();
  });
})();
