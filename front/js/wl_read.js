/* ================================================================
   wl_read.js — Worklog 조회 / 수정 / 엑셀 추출
   ================================================================ */
'use strict';

const API = 'http://3.37.73.151:3001';

const token = localStorage.getItem('x-access-token') || '';
const me = (() => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
})();
axios.defaults.headers.common['x-access-token'] = token || '';

/* ── 결재자 맵 ── */
const APPROVER_MAP = {
  'PEE1:PT': ['조지훈','전대영','손석현'],
  'PEE1:HS': ['진덕장','한정훈','정대환'],
  'PEE1:IC': ['강문호','배한훈','최원준'],
  'PEE1:CJ': ['강문호','배한훈','최원준'],
  'PEE2:PT': ['이지웅','송왕근','정현우'],
  'PEE2:HS': ['안재영','김건희'],
  'PSKH:*':  ['유정현','문순현'],
};
function canEdit(group, site) {
  if (!me) return false;
  if (me.role === 'admin' || me.role === 'editor') return true;
  const key = group === 'PSKH' ? 'PSKH:*' : `${group}:${site}`;
  return (APPROVER_MAP[key] || []).includes(me.nickname);
}

/* ── 헬퍼 ── */
function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtTime(raw) { return raw ? String(raw).substring(0,5) : '—'; }
function renderText(t) {
  if (!t) return '—';
  return String(t).replace(/<br\s*\/?>/gi, '\n');
}
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toast(type, title, msg) {
  const root = document.getElementById('toast-root'); if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-head"><span class="badge">${type==='error'?'ERR':'OK'}</span>${escHtml(title)}</div><div class="toast-body">${escHtml(msg)}</div>`;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

let currentEvent = null;
let isEditMode   = false;


/* ================================================================
   NAV
   ================================================================ */
function initNav() {
  if (me) {
    document.querySelectorAll('.sign-container.unsigned').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sign-container.signed').forEach(el => el.classList.remove('hidden'));
    if (me.role !== 'admin') document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
  document.getElementById('sign-out')?.addEventListener('click', () => {
    localStorage.removeItem('x-access-token');
    location.href = './signin.html';
  });
  document.querySelector('.menu-btn')?.addEventListener('click', () => {
    document.querySelector('.menu-bar')?.classList.toggle('open');
  });
}


/* ================================================================
   기본 날짜 설정 (최근 1달)
   ================================================================ */
function initDates() {
  const today = new Date();
  const from  = new Date(today);
  from.setMonth(from.getMonth() - 1);
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  document.getElementById('f-date-from').value = fmt(from);
  document.getElementById('f-date-to').value   = fmt(today);
}


/* ================================================================
   필터 수집
   ================================================================ */
function getFilters() {
  return {
    date_from:      document.getElementById('f-date-from').value,
    date_to:        document.getElementById('f-date-to').value,
    group:          document.getElementById('f-group').value,
    site:           document.getElementById('f-site').value,
    work_type:      document.getElementById('f-work-type').value,
    equipment_name: document.getElementById('f-eq-name').value.trim(),
    worker_name:    document.getElementById('f-worker').value.trim(),
    task_name:      document.getElementById('f-title').value.trim(),
  };
}


/* ================================================================
   검색
   ================================================================ */
async function doSearch() {
  const wrapper = document.getElementById('table-wrapper');
  wrapper.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> 조회 중...</div>';

  const filters = getFilters();
  const params = new URLSearchParams();
  for (const [k,v] of Object.entries(filters)) { if (v) params.set(k, v); }

  try {
    const { data } = await axios.get(`${API}/wl/events?${params}`);
    const { rows, total } = data;
    document.getElementById('result-summary').style.display = '';
    document.getElementById('result-count').textContent = rows.length;
    document.getElementById('result-total').textContent = total > rows.length ? `(전체 ${total}건)` : '';

    if (!rows.length) {
      wrapper.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>조회 결과가 없습니다.</p></div>';
      return;
    }
    renderTable(wrapper, rows);
  } catch (e) {
    wrapper.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>조회 실패: ${escHtml(e.response?.data?.error || e.message)}</p></div>`;
  }
}


/* ================================================================
   테이블 렌더링
   ================================================================ */
function renderTable(container, rows) {
  const html = `
    <div class="table-scroll">
      <table class="wl-table">
        <thead>
          <tr>
            <th>Date</th><th>Work Code</th><th>Title</th><th>EQ Name</th>
            <th>Group</th><th>Site</th><th>Work Type</th><th>EMS</th>
            <th>Workers</th><th>Rework</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr data-id="${r.id}" class="clickable-row">
              <td>${fmtDate(r.task_date)}</td>
              <td class="code-cell">${escHtml(r.work_code || '')}</td>
              <td>${escHtml(r.task_name || '')}</td>
              <td>${escHtml(r.equipment_name || '')}</td>
              <td>${escHtml(r.group || '')}</td>
              <td>${escHtml(r.site || '')}</td>
              <td>${escHtml(r.work_type || '')}${r.work_type2 ? '/'+escHtml(r.work_type2) : ''}</td>
              <td>${r.ems == 1 ? '유상' : '무상'}</td>
              <td>${escHtml(r.workers_str || '')}</td>
              <td>${r.is_rework ? '<span class="rework-badge">RW</span>' : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;

  container.querySelectorAll('.clickable-row').forEach(tr => {
    tr.addEventListener('click', () => openDetail(Number(tr.dataset.id)));
  });
}


/* ================================================================
   상세 모달
   ================================================================ */
async function openDetail(id) {
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('detail-modal').style.display  = 'block';
  document.body.style.overflow = 'hidden';
  document.getElementById('m-work-code').textContent = '불러오는 중...';

  try {
    const { data } = await axios.get(`${API}/wl/event/${id}`);
    currentEvent = data;
    fillModal(data);
    setEditMode(false);
  } catch {
    toast('error', '오류', '상세 조회 실패');
    closeModal();
  }
}

function fillModal(ev) {
  document.getElementById('m-work-code').textContent = ev.work_code || '—';
  document.getElementById('m-title').textContent     = ev.task_name || '';
  document.getElementById('m-date').textContent      = fmtDate(ev.task_date);
  document.getElementById('m-ems').textContent       = ev.ems == 1 ? '유상' : '무상';
  document.getElementById('m-group-site').textContent= `${ev.group||'—'} / ${ev.site||'—'}`;
  document.getElementById('m-line').textContent      = ev.line || '—';
  document.getElementById('m-eq-name').textContent   = ev.equipment_name || '—';
  document.getElementById('m-eq-type').textContent   = ev.equipment_type || '—';
  document.getElementById('m-warranty').textContent  = ev.warranty || '—';
  document.getElementById('m-work-type').textContent = ev.work_type || '—';
  document.getElementById('m-work-type2').textContent= ev.work_type2 || '—';
  document.getElementById('m-sop').textContent       = `${ev.SOP||'—'} / ${ev.tsguide||'—'}`;
  document.getElementById('m-status-text').textContent = ev.status || '—';

  const rw = document.getElementById('m-rework');
  rw.innerHTML = ev.is_rework ? `<span class="rework-yes">✅ Rework${ev.rework_seq>0?' ('+ev.rework_seq+'차)':''}</span>` : 'N';

  // 작업자
  const tbody = document.getElementById('m-workers-tbody');
  tbody.innerHTML = '';
  (ev.workers || []).forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(w.engineer_name)}</td>
      <td><span class="role-badge role-${w.role||'main'}">${w.role||'main'}</span></td>
      <td>${fmtTime(w.start_time)}</td><td>${fmtTime(w.end_time)}</td>
      <td>${w.none_time??0}분</td><td>${w.move_time??0}분</td>
      <td>${w.task_duration??'—'}분</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('m-action').textContent = renderText(ev.task_description);
  document.getElementById('m-cause').textContent  = renderText(ev.task_cause);
  document.getElementById('m-result').textContent = renderText(ev.task_result);

  // 결재 이력
  const hist = document.getElementById('m-history');
  hist.innerHTML = '';
  (ev.approvals || []).forEach(a => {
    const d = document.createElement('div'); d.className = 'approval-row';
    const dt = a.acted_at ? new Date(a.acted_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false}) : '';
    d.innerHTML = `<span class="approval-action-badge action-${escHtml(a.action)}">${escHtml(a.action)}</span>
      <span class="approval-actor">${escHtml(a.actor_name||'—')}</span>
      <span class="approval-time">${escHtml(dt)}</span>
      ${a.comment?`<span class="approval-comment">${escHtml(a.comment)}</span>`:''}`;
    hist.appendChild(d);
  });

  // 수정 버튼 표시 여부
  const editBtn = document.getElementById('btn-edit-toggle');
  editBtn.style.display = canEdit(ev.group, ev.site) ? '' : 'none';
}

function closeModal() {
  document.getElementById('detail-modal').style.display  = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
  currentEvent = null;
  isEditMode = false;
}


/* ================================================================
   수정 모드 전환
   ================================================================ */
function setEditMode(on) {
  isEditMode = on;
  document.getElementById('view-mode').style.display = on ? 'none' : '';
  document.getElementById('edit-mode').style.display = on ? '' : 'none';
  document.getElementById('btn-edit-toggle').textContent = on ? '보기' : '수정';

  if (on && currentEvent) {
    const ev = currentEvent;
    document.getElementById('e-title').value  = ev.task_name || '';
    document.getElementById('e-status').value = ev.status || '';
    document.getElementById('e-action').value = renderText(ev.task_description);
    document.getElementById('e-cause').value  = renderText(ev.task_cause);
    document.getElementById('e-result').value = renderText(ev.task_result);
    buildEditWorkers(ev.workers || []);
  }
}

function buildEditWorkers(workers) {
  const list = document.getElementById('e-workers-list');
  list.innerHTML = '';
  workers.forEach((w, i) => list.appendChild(createEditWorkerRow(w, i)));
}

function createEditWorkerRow(w, idx) {
  const div = document.createElement('div');
  div.className = 'edit-worker-row';
  div.innerHTML = `
    <input type="text" class="ew-name" value="${escHtml(w.engineer_name||'')}" placeholder="이름">
    <select class="ew-role">
      <option value="main" ${w.role==='main'?'selected':''}>main</option>
      <option value="support" ${w.role==='support'?'selected':''}>support</option>
    </select>
    <input type="time" class="ew-start" value="${fmtTime(w.start_time)||''}">
    <input type="time" class="ew-end" value="${fmtTime(w.end_time)||''}">
    <input type="number" class="ew-none" min="0" value="${w.none_time||0}" style="width:60px;" placeholder="논">
    <input type="number" class="ew-move" min="0" value="${w.move_time||0}" style="width:60px;" placeholder="무브">
    <button type="button" class="btn-remove ew-remove">−</button>
  `;
  div.querySelector('.ew-remove').addEventListener('click', () => div.remove());
  return div;
}

function collectEditWorkers() {
  return [...document.querySelectorAll('.edit-worker-row')].map(div => ({
    name:       div.querySelector('.ew-name').value.trim(),
    role:       div.querySelector('.ew-role').value,
    start_time: div.querySelector('.ew-start').value ? div.querySelector('.ew-start').value + ':00' : null,
    end_time:   div.querySelector('.ew-end').value   ? div.querySelector('.ew-end').value   + ':00' : null,
    none_time:  Number(div.querySelector('.ew-none').value) || 0,
    move_time:  Number(div.querySelector('.ew-move').value) || 0,
  })).filter(w => w.name);
}


/* ================================================================
   저장 (수정)
   ================================================================ */
async function doSave() {
  if (!currentEvent) return;
  const patch = {
    task_name:        document.getElementById('e-title').value.trim(),
    status:           document.getElementById('e-status').value.trim(),
    task_description: document.getElementById('e-action').value.trim(),
    task_cause:       document.getElementById('e-cause').value.trim(),
    task_result:      document.getElementById('e-result').value.trim(),
  };
  const workers = collectEditWorkers();
  if (!workers.length) { toast('error','오류','작업자를 1명 이상 입력하세요.'); return; }

  try {
    await axios.put(`${API}/wl/event/${currentEvent.id}`, { patch, workers });
    toast('success', '수정 완료', '작업 이력이 수정되었습니다.');
    // 모달 갱신
    const { data } = await axios.get(`${API}/wl/event/${currentEvent.id}`);
    currentEvent = data;
    fillModal(data);
    setEditMode(false);
    doSearch(); // 목록 갱신
  } catch (e) {
    toast('error', '수정 실패', e.response?.data?.error || e.message);
  }
}


/* ================================================================
   엑셀 다운로드 (요청 7)
   ================================================================ */
async function doExcel() {
  const filters = getFilters();
  const params = new URLSearchParams();
  for (const [k,v] of Object.entries(filters)) { if (v) params.set(k, v); }

  try {
    toast('success', '준비 중', '엑셀 데이터를 준비하고 있습니다...');
    const { data } = await axios.get(`${API}/wl/export/excel?${params}`);
    if (!data.length) { toast('error', '데이터 없음', '조회 조건에 해당하는 데이터가 없습니다.'); return; }

    const headers = [
      'Work Code', 'Title', 'Date', 'Country', 'Group', 'Site', 'Line',
      'EQ Type', 'EQ Name', 'Warranty', 'EMS',
      'Work Type', 'Work Sort', 'Setup Item',
      'Status', 'Action', 'Cause', 'Result',
      'SOP', 'TS Guide', 'Rework', 'Rework Seq',
      'Worker', 'Role', 'Level', 'Start', 'End', 'None(분)', 'Move(분)', 'Duration(분)',
      'Approval'
    ];
    const rows = data.map(r => [
      r.work_code, r.task_name, r.task_date, r.country, r.group, r.site, r.line,
      r.equipment_type, r.equipment_name, r.warranty, r.ems_text,
      r.work_type, r.work_type2, r.setup_item,
      r.status, r.task_description, r.task_cause, r.task_result,
      r.SOP, r.tsguide, r.is_rework, r.rework_seq,
      r.engineer_name, r.role, r.eng_level,
      r.w_start_time ? String(r.w_start_time).substring(0,5) : '',
      r.w_end_time   ? String(r.w_end_time).substring(0,5)   : '',
      r.w_none_time, r.w_move_time, r.task_duration,
      r.approval_status
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // 열 너비 자동 조절
    ws['!cols'] = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
      return { wch: Math.min(maxLen + 2, 40) };
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Worklog');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `worklog_${dateStr}.xlsx`);
    toast('success', '완료', '엑셀 파일이 다운로드되었습니다.');
  } catch (e) {
    toast('error', '엑셀 실패', e.response?.data?.error || e.message);
  }
}


/* ================================================================
   초기화
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initDates();

  document.getElementById('btn-search')?.addEventListener('click', doSearch);
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    ['f-date-from','f-date-to','f-eq-name','f-worker','f-title'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    ['f-group','f-site','f-work-type'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    initDates();
  });
  document.getElementById('btn-excel')?.addEventListener('click', doExcel);

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', closeModal);
  document.getElementById('btn-edit-toggle')?.addEventListener('click', () => setEditMode(!isEditMode));
  document.getElementById('btn-edit-cancel')?.addEventListener('click', () => setEditMode(false));
  document.getElementById('btn-edit-save')?.addEventListener('click', doSave);
  document.getElementById('e-add-worker')?.addEventListener('click', () => {
    document.getElementById('e-workers-list').appendChild(createEditWorkerRow({}, 0));
  });
});
