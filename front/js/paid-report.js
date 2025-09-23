// paid-report.js
(function () {
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // API 베이스 (html에서 window.API_BASE 주입됨)
  const API_BASE =
    (typeof API !== 'undefined' ? API : null) ||
    (window.API_BASE || 'http://3.37.73.151:3001');

  // ---------- 날짜 유틸 (로컬 기준 YYYY-MM-DD) ----------
  const toLocalISODate = (d)=> {
    const z = new Date(d.getTime() - d.getTimezoneOffset()*60000);
    return z.toISOString().slice(0,10);
  };
  const fmtDate = (v) => {
    if (!v) return '';
    // 이미 YYYY-MM-DD면 그대로
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // Date 또는 ISO 문자열 -> YYYY-MM-DD
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return toLocalISODate(d);
  };

  // ---------- 시간 계산 ----------
  function toMin(hhmmOrHHMMSS){
    if(!hhmmOrHHMMSS) return 0;
    const s = hhmmOrHHMMSS.length===5 ? hhmmOrHHMMSS+':00' : hhmmOrHHMMSS; // HH:MM -> HH:MM:SS
    const [h,m] = s.split(':').map(Number);
    return (h*60 + m) | 0;
  }
  const fmtHour = (min)=> (min/60).toFixed(1)+'h';

  // 날짜 기본: 최근 30일
  function setDefaultDates(){
    const to   = new Date();
    const from = new Date(); from.setDate(to.getDate()-30);
    $('#f-date-to').value   = toLocalISODate(to);
    $('#f-date-from').value = toLocalISODate(from);
  }

  // ---------- 쿼리스트링 구성 ----------
  function buildQuery(){
    const p = new URLSearchParams();
    const v = (id)=>($('#'+id)?.value || '').trim();
    const add = (k, val)=>{ if(val!=='' && val!=null) p.set(k, val); };

    add('date_from', v('f-date-from'));
    add('date_to',   v('f-date-to'));
    add('group',     v('f-group'));        // ALL("")이면 안보냄
    add('site',      v('f-site'));         // ALL("")이면 안보냄
    add('worker',    v('f-worker'));
    add('equipment_type', v('f-eq-type'));
    add('equipment_name', v('f-eq-name'));
    p.set('limit', '5000'); // 안전장치
    return p.toString();
  }

  // ---------- 데이터 조회 ----------
  async function fetchData(){
    const qs = buildQuery();
    const token = localStorage.getItem('x-access-token') || '';
    const res = await fetch(`${API_BASE}/api/work-log-paid/search?${qs}`, {
      headers:{ 'x-access-token': token }
    });
    if(!res.ok) throw new Error('검색 실패');
    const rows = await res.json();

    // 가공 필드(분) + 날짜 포맷
    rows.forEach(r=>{
      r._task_date = fmtDate(r.task_date);
      r._inform_min = Math.max(0, toMin(r.inform_end_time)-toMin(r.inform_start_time));
      r._line_min   = Math.max(0, toMin(r.line_end_time)-toMin(r.line_start_time));
    });
    return rows;
  }

  // ---------- 상단 요약 ----------
  function renderSummary(rows){
    $('#sum-count').textContent  = rows.length.toLocaleString();
    const inf = rows.reduce((a,b)=>a+(b._inform_min||0), 0);
    const lin = rows.reduce((a,b)=>a+(b._line_min||0),   0);
    $('#sum-inform').textContent = fmtHour(inf);
    $('#sum-line').textContent   = fmtHour(lin);
  }

  // ---------- 상세 모달 ----------
  function ensureViewer(){
    if ($('#viewer-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'viewer-overlay';
    ov.className = 'viewer-overlay';
    ov.innerHTML = `
      <div class="viewer-card" role="dialog" aria-modal="true" aria-label="작업이력 상세">
        <div class="viewer-head">
          <strong>작업이력 상세</strong>
          <button type="button" id="viewer-close" class="btn-close">닫기</button>
        </div>
        <div class="viewer-body" id="viewer-body"></div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e)=>{ if(e.target===ov) closeViewer(); });
    $('#viewer-close', ov).addEventListener('click', closeViewer);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeViewer(); });
  }
  function openViewer(){ ensureViewer(); $('#viewer-overlay').classList.add('show'); }
  function closeViewer(){ const ov = $('#viewer-overlay'); if(ov) ov.classList.remove('show'); }
  function kv(label, value){
    const v = (value==null || value==='') ? '—' : String(value);
    return `<p><strong>${label}</strong><span>${v}</span></p>`;
  }

  // work_log 단건 조회(백엔드 지원 우선 → 없으면 /logs에서 찾아보기)
  async function fetchWorkLogById(id){
    const token = localStorage.getItem('x-access-token') || '';
    // 1) 권장: /api/work-log/:id (있다면)
    try{
      const r1 = await fetch(`${API_BASE}/api/work-log/${id}`, { headers:{ 'x-access-token': token } });
      if (r1.ok) return await r1.json();
    }catch(_) {}
    // 2) fallback: /logs 전체에서 찾기 (비권장, 데이터 많을 경우 느릴 수 있음)
    const r2 = await fetch(`${API_BASE}/logs`, { headers:{ 'x-access-token': token } });
    if (!r2.ok) throw new Error('작업이력 로드 실패');
    const all = await r2.json();
    const one = all.find(x => String(x.id)===String(id));
    if (!one) throw new Error('해당 작업이력을 찾을 수 없습니다.');
    return one;
  }

  async function onRowClick(e){
    const tr = e.target.closest('tr[data-worklogid]');
    if(!tr) return;
    const id = tr.getAttribute('data-worklogid');
    if(!id) return;
    try{
      document.body.style.cursor='progress';
      const w = await fetchWorkLogById(id);
      ensureViewer();
      const body = $('#viewer-body');
      body.innerHTML = [
        kv('ID', w.id),
        kv('작업명', w.task_name),
        kv('작업일', fmtDate(w.task_date)),
        kv('그룹', w.group),
        kv('사이트', w.site),
        kv('라인', w.line),
        kv('장비타입', w.equipment_type),
        kv('장비명', w.equipment_name),
        kv('작업자', w.task_man),
        kv('작업결과', w.task_result),
        kv('작업원인', w.task_cause),
        kv('작업설명', w.task_description),
        kv('시작시각', w.start_time),
        kv('종료시각', w.end_time),
        kv('이동시간', w.move_time),
        kv('비가동시간', w.none_time),
        kv('보증/EMS', w.warranty + (typeof w.ems==='number' ? ` / ${w.ems===1?'유상':'무상'}` : '')),
        kv('상태', w.status)
      ].join('');
      openViewer();
    }catch(err){
      toast('오류', err.message||'작업이력을 불러오지 못했습니다.');
    }finally{
      document.body.style.cursor='auto';
    }
  }

  // ---------- 테이블 ----------
  function renderTable(rows){
    const tbody = $('#paid-table tbody');
    tbody.innerHTML = '';

    const tr = (r)=>`
      <tr data-worklogid="${r.work_log_id||''}" class="${r.work_log_id ? 'clickable' : ''}">
        <td>${r._task_date||''}</td>
        <td>${r.group||''}</td>
        <td>${r.site||''}</td>
        <td>${r.task_name||''}</td>
        <td>${r.line||''}</td>
        <td>${r.equipment_type||''}</td>
        <td>${r.equipment_name||''}</td>
        <td>${r.paid_worker||''}</td>
        <td>${r.line_start_time||''}</td>
        <td>${r.line_end_time||''}</td>
        <td style="text-align:right">${r._line_min||0}</td>
        <td>${r.inform_start_time||''}</td>
        <td>${r.inform_end_time||''}</td>
        <td style="text-align:right">${r._inform_min||0}</td>
      </tr>`;
    tbody.innerHTML = rows.map(tr).join('');
  }

  // ---------- 엑셀(.xls) 내보내기 ----------
  function exportExcel(){
    const rows = window.__PAID_ROWS__ || [];
    if(!rows.length){ toast('안내', '내보낼 데이터가 없습니다.'); return; }

    const header = [
      '날짜','그룹','사이트','작업명','라인','장비타입','장비명','작업자',
      '라인입실','라인퇴실','Line 체류 시간(분)','작업시작','작업완료','작업소요시간(분)'
    ];

    const esc = (v)=> {
      const s = (v==null?'':String(v));
      // HTML 이스케이프
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    };

    const headHtml = `<tr>${header.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>`;
    const bodyHtml = rows.map(r => `
      <tr>
        <td>${esc(r._task_date||'')}</td>
        <td>${esc(r.group||'')}</td>
        <td>${esc(r.site||'')}</td>
        <td>${esc(r.task_name||'')}</td>
        <td>${esc(r.line||'')}</td>
        <td>${esc(r.equipment_type||'')}</td>
        <td>${esc(r.equipment_name||'')}</td>
        <td>${esc(r.paid_worker||'')}</td>
        <td>${esc(r.line_start_time||'')}</td>
        <td>${esc(r.line_end_time||'')}</td>
        <td style="mso-number-format:'0';">${esc(r._line_min||0)}</td>
        <td>${esc(r.inform_start_time||'')}</td>
        <td>${esc(r.inform_end_time||'')}</td>
        <td style="mso-number-format:'0';">${esc(r._inform_min||0)}</td>
      </tr>
    `).join('');

    // Excel이 잘 여는 HTML 테이블(.xls)
    const html =
      '\ufeff' + // BOM (한글 보장)
      `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
       <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
       <style>
         table{border-collapse:collapse}
         td,th{border:1px solid #ddd; padding:6px 8px; white-space:nowrap}
         th{background:#eef3ff}
       </style>
       </head><body>
       <table>${headHtml}${bodyHtml}</table>
       </body></html>`;

    const blob = new Blob([html], { type:'application/vnd.ms-excel;charset=utf-8;' });
    const a = document.createElement('a');
    const from = $('#f-date-from').value || 'all';
    const to   = $('#f-date-to').value   || 'all';
    a.download = `work_log_paid_${from}_${to}.xls`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------- 토스트 ----------
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

  // ---------- 핸들러 ----------
  async function onSearch(){
    try{
      document.body.style.cursor='progress';
      const rows = await fetchData();
      // 전역 저장(엑셀 내보내기용)
      window.__PAID_ROWS__ = rows.slice();
      renderSummary(rows);
      renderTable(rows);
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
    $('#f-eq-type').value='';
    $('#f-eq-name').value='';
    setDefaultDates();
  }

  // ---------- 이벤트 바인딩 ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    setDefaultDates();

    $('#btn-search').addEventListener('click', onSearch);
    $('#btn-reset').addEventListener('click', ()=>{ onReset(); onSearch(); });
    $('#btn-export').addEventListener('click', exportExcel);

    // 엔터로 바로 조회
    $$('.filter-grid input, .filter-grid select').forEach(el=>{
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter') onSearch(); });
    });

    // 행 클릭 → 상세
    $('#paid-table').addEventListener('click', onRowClick);

    // 첫 로드 자동 조회
    onSearch();
  });
})();
