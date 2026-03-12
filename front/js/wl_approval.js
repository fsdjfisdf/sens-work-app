/* wl_approval.js — 결재/반려 수정(전체 필드)/재제출 */
'use strict';

const API = 'http://3.37.73.151:3001';
const token = localStorage.getItem('x-access-token') || '';
const me = (() => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } })();
axios.defaults.headers.common['x-access-token'] = token;

const APPROVER_MAP = {
  'PEE1:PT':['조지훈','전대영','손석현'],
  'PEE1:HS':['진덕장','한정훈','정대환'],
  'PEE1:IC':['강문호','배한훈','최원준'],
  'PEE1:CJ':['강문호','배한훈','최원준'],
  'PEE2:PT':['이지웅','송왕근','정현우'],
  'PEE2:HS':['안재영','김건희'],
  'PSKH:*':['유정현','문순현']
};
function isApprover(g,s){
  if(!me) return false;
  if(me.role==='admin'||me.role==='editor') return true;
  const k = g==='PSKH' ? 'PSKH:*' : `${g}:${s}`;
  return (APPROVER_MAP[k]||[]).includes(me.nickname);
}

let curId = null;
let curEv = null;
let editMode = false;

/* Helpers */
function fmtDate(r){
  if(!r) return '—';
  const d = new Date(r);
  if(isNaN(d)) return String(r);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDateInput(r){ return r ? fmtDate(r) : ''; }
function fmtTime(r){ return r ? String(r).substring(0,5) : '—'; }
function fmtTimeInput(r){ return r ? String(r).substring(0,5) : ''; }
function renderText(t){ return !t || t==='—' ? '—' : String(t).replace(/<br\s*\/?>/gi,'\n'); }
function escHtml(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function hasText(v){ return v !== null && v !== undefined && String(v).trim() !== ''; }
function toDash(v){ return hasText(v) ? String(v) : '—'; }
function isRework(ev){ return Number(ev?.is_rework) === 1; }
function isHumanError(reason){ return /human\s*error/i.test(String(reason || '')); }
function toast(type,title,msg){
  const r = document.getElementById('toast-root');
  if(!r) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-head"><span class="badge">${type==='error'?'ERR':type==='warn'?'WARN':'OK'}</span>${escHtml(title)}</div><div class="toast-body">${escHtml(msg)}</div>`;
  r.appendChild(el);
  setTimeout(()=>el.remove(), 4500);
}
function setDisplay(id,on){ const el = document.getElementById(id); if(el) el.style.display = on ? '' : 'none'; }
function setText(id,val){ const el = document.getElementById(id); if(el) el.textContent = toDash(val); }

function getReworkHeadline(ev){
  const seqText = Number(ev?.rework_seq) > 0 ? `${ev.rework_seq}차 REWORK` : 'REWORK';
  const reason = toDash(ev?.rework_reason);
  return reason === '—' ? seqText : `${seqText} · ${reason}`;
}

function getReworkRefText(ev){
  const bits = [];
  if(Number(ev?.rework_seq) > 0) bits.push(`${ev.rework_seq}차`);
  if(ev?.rework_ref_id) bits.push(`기준 이력 ID #${ev.rework_ref_id}`);
  return bits.length ? bits.join(' / ') : '기준 이력 없음';
}

function syncEditReworkFields(){
  const sel = document.getElementById('e-rework');
  const on = sel && sel.value === '1';
  setDisplay('e-rework-reason-field', on);
  setDisplay('e-rework-detail-field', on);
  if(!on){
    const r = document.getElementById('e-rework-reason');
    const d = document.getElementById('e-rework-detail');
    if(r) r.value = '';
    if(d) d.value = '';
  }
}

/* Nav */
function initNav(){
  if(me){
    document.querySelectorAll('.sign-container.unsigned').forEach(e=>e.classList.add('hidden'));
    document.querySelectorAll('.sign-container.signed').forEach(e=>e.classList.remove('hidden'));
  }
  document.getElementById('sign-out')?.addEventListener('click',()=>{
    localStorage.removeItem('x-access-token');
    location.href='./signin.html';
  });
  document.querySelector('.menu-btn')?.addEventListener('click',()=>document.querySelector('.menu-bar')?.classList.toggle('open'));
}

/* Tabs */
function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const t = b.dataset.tab;
      document.getElementById('tab-pending').style.display = t==='pending' ? '' : 'none';
      document.getElementById('tab-rejected').style.display = t==='rejected' ? '' : 'none';
      if(t==='rejected') loadRejected();
    });
  });
}
function initFilters(){
  ['filter-group','filter-site','filter-mine'].forEach(id=>document.getElementById(id)?.addEventListener('change', loadPending));
  document.getElementById('btn-refresh')?.addEventListener('click', loadPending);
}

/* Load */
async function loadPending(){
  const l = document.getElementById('approval-list');
  l.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  const g = document.getElementById('filter-group').value;
  const s = document.getElementById('filter-site').value;
  const m = document.getElementById('filter-mine').checked ? '1' : '';
  const p = new URLSearchParams();
  if(g) p.set('group', g);
  if(s) p.set('site', s);
  if(m) p.set('mine', '1');
  try{
    const { data } = await axios.get(`${API}/wl/pending?${p}`);
    renderList(l, data, 'pending');
    document.getElementById('pending-count').textContent = data.length;
  }catch(e){
    l.innerHTML = `<div class="empty-state"><p>조회 실패: ${escHtml(e.response?.data?.error || e.message)}</p></div>`;
  }
}

async function loadRejected(){
  const l = document.getElementById('rejected-list');
  l.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i></div>';
  try{
    const { data } = await axios.get(`${API}/wl/rejected/mine`);
    renderList(l, data, 'rejected');
    document.getElementById('rejected-count').textContent = data.length;
  }catch(e){
    l.innerHTML = '<div class="empty-state"><p>조회 실패</p></div>';
  }
}

/* Card render */
function renderList(c, rows, type){
  if(!rows || !rows.length){
    c.innerHTML = `<div class="empty-state"><i class="fas fa-${type==='pending'?'inbox':'check-double'}"></i><p>${type==='pending'?'대기 항목 없음':'반려 항목 없음'}</p></div>`;
    return;
  }
  c.innerHTML = '';
  const sm = { PENDING:'대기', REJECTED:'반려', APPROVED:'승인' };
  const sc = { PENDING:'badge-pending', REJECTED:'badge-rejected', APPROVED:'badge-approved' };

  rows.forEach(ev => {
    const card = document.createElement('div');
    const rework = isRework(ev);
    card.className = `event-card status-${(ev.approval_status||'').toLowerCase()}${rework?' is-rework-card':''}`;
    const ws = String(ev.workers || '').split(',').map(s=>s.trim()).filter(Boolean);
    const wc = ws.map(w=>`<span class="worker-chip">${escHtml(w)}</span>`).join('');
    const rw = rework ? '<span class="card-status-badge badge-rework">REWORK</span>' : '';
    const reason = toDash(ev.rework_reason);
    const detailPreview = hasText(ev.rework_detail) ? escHtml(String(ev.rework_detail).trim()) : '상세 사유 미입력';
    const reworkBox = rework ? `
      <div class="rework-card-alert ${isHumanError(ev.rework_reason)?'human-error':''}">
        <div class="rework-card-alert-top">
          <span class="rework-inline-badge">${escHtml(reason)}</span>
          <span class="rework-mini-meta">${Number(ev.rework_seq)>0 ? `${ev.rework_seq}차` : 'REWORK'}</span>
        </div>
        <div class="rework-card-detail">${detailPreview}</div>
      </div>` : '';

    card.innerHTML = `
      <div class="card-header">
        <div style="min-width:0">
          <div class="card-code">${escHtml(ev.work_code || '')}</div>
          <div class="card-title">${escHtml(ev.task_name || '')} ${rw}</div>
        </div>
        <span class="card-status-badge ${sc[ev.approval_status]||''}">${sm[ev.approval_status]||ev.approval_status}</span>
      </div>
      <div class="card-meta">
        <span><i class="fas fa-calendar-alt"></i>${fmtDate(ev.task_date)}</span>
        <span><i class="fas fa-map-marker-alt"></i>${escHtml(ev.group||'')} · ${escHtml(ev.site||'')}</span>
        <span><i class="fas fa-microchip"></i>${escHtml(ev.equipment_name||'')}</span>
        <span><i class="fas fa-tools"></i>${escHtml(ev.work_type||'')}${ev.work_type2?' / '+escHtml(ev.work_type2):''}</span>
      </div>
      ${reworkBox}
      <div class="card-workers"><i class="fas fa-users" style="font-size:11px;"></i>${wc || '<span style="color:var(--muted)">작업자 없음</span>'}</div>
      ${ev.reject_comment ? `<div class="reject-comment-box"><strong>반려 사유:</strong> ${escHtml(ev.reject_comment)}</div>` : ''}
    `;
    card.addEventListener('click', ()=>openDetail(ev.id));
    c.appendChild(card);
  });
}

/* Detail */
async function openDetail(id){
  curId = id;
  editMode = false;
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('detail-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.getElementById('m-work-code').textContent = '불러오는 중...';
  try{
    const { data } = await axios.get(`${API}/wl/event/${id}`);
    curEv = data;
    fillModal(data);
    setEditMode(false);
  }catch{
    toast('error','오류','상세 조회 실패');
    closeModal();
  }
}

function fillModal(ev){
  const sm = { PENDING:'대기', REJECTED:'반려', APPROVED:'승인' };
  const sc = { PENDING:'badge-pending', REJECTED:'badge-rejected', APPROVED:'badge-approved' };

  document.getElementById('m-work-code').textContent = ev.work_code || '—';
  document.getElementById('m-title').textContent = ev.task_name || '—';
  const bd = document.getElementById('m-status-badge');
  bd.textContent = sm[ev.approval_status] || ev.approval_status;
  bd.className = `card-status-badge ${sc[ev.approval_status]||''}`;

  setText('m-date', fmtDate(ev.task_date));
  setText('m-ems', ev.ems==1 ? '유상' : '무상');
  setText('m-group-site', `${ev.group||'—'} / ${ev.site||'—'}`);
  setText('m-line', ev.line);
  setText('m-country', ev.country);
  setText('m-eq-name', ev.equipment_name);
  setText('m-eq-type', ev.equipment_type);
  setText('m-warranty', ev.warranty);
  setText('m-work-type', ev.work_type);
  setText('m-work-type2', ev.work_type2);
  setText('m-sop', `${ev.SOP||'—'} / ${ev.tsguide||'—'}`);
  setText('m-status-text', ev.status);

  const rwEl = document.getElementById('m-rework');
  if(isRework(ev)){
    rwEl.innerHTML = `<span class="rework-yes">✅ Rework${Number(ev.rework_seq)>0 ? ` (${ev.rework_seq}차)` : ''}</span><span class="rework-inline-badge">${escHtml(toDash(ev.rework_reason))}</span>`;
  }else{
    rwEl.textContent = 'N';
  }

  const banner = document.getElementById('rework-review-banner');
  const review = document.getElementById('rework-review-section');
  if(isRework(ev)){
    banner.className = `rework-banner${isHumanError(ev.rework_reason)?' human-error':''}`;
    banner.classList.remove('hidden');
    review.classList.remove('hidden');
    document.getElementById('rework-banner-title').textContent = getReworkHeadline(ev);
    document.getElementById('rework-banner-desc').textContent = hasText(ev.rework_detail)
      ? '승인 전 아래 상세 사유를 반드시 확인하세요.'
      : '상세 사유가 비어 있습니다. 승인 전 제출 내용 확인이 필요합니다.';
    setText('m-rework-reason', ev.rework_reason);
    setText('m-rework-ref', getReworkRefText(ev));
    document.getElementById('m-rework-detail').textContent = renderText(ev.rework_detail);
  }else{
    banner.className = 'rework-banner hidden';
    review.classList.add('hidden');
    setText('m-rework-reason', '—');
    setText('m-rework-ref', '—');
    document.getElementById('m-rework-detail').textContent = '—';
  }

  const wiEl = document.getElementById('m-work-items');
  if(ev.workItems?.length){
    wiEl.innerHTML = `<div class="chip-list">${ev.workItems.map(wi=>`<span class="chip-item">${escHtml(wi.master_item_name||wi.item_name_free||'—')}</span>`).join('')}</div>`;
  }else{
    wiEl.textContent = '—';
  }

  const ptEl = document.getElementById('m-parts');
  if(ev.parts?.length){
    ptEl.innerHTML = `<div class="chip-list">${ev.parts.map(p=>`<span class="chip-item">${escHtml(p.master_part_name||p.part_name_free||'—')}${p.qty>1?' ×'+p.qty:''}</span>`).join('')}</div>`;
  }else{
    ptEl.textContent = '—';
  }

  const tb = document.getElementById('m-workers-tbody');
  tb.innerHTML = '';
  (ev.workers||[]).forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escHtml(w.engineer_name)}</td><td><span class="role-badge role-${w.role||'main'}">${w.role||'main'}</span></td><td>${fmtTime(w.start_time)}</td><td>${fmtTime(w.end_time)}</td><td>${w.none_time??0}분</td><td>${w.move_time??0}분</td><td>${w.task_duration??'—'}분</td>`;
    tb.appendChild(tr);
  });

  document.getElementById('m-action').textContent = renderText(ev.task_description);
  document.getElementById('m-cause').textContent = renderText(ev.task_cause);
  document.getElementById('m-result').textContent = renderText(ev.task_result);

  const hEl = document.getElementById('m-history');
  hEl.innerHTML = '';
  if(ev.approvals?.length){
    ev.approvals.forEach(a => {
      const d = document.createElement('div');
      d.className = 'approval-row';
      const dt = a.acted_at ? new Date(a.acted_at).toLocaleString('ko-KR',{ timeZone:'Asia/Seoul', hour12:false }) : '';
      d.innerHTML = `<span class="approval-action-badge action-${escHtml(a.action)}">${escHtml(a.action)}</span><span class="approval-actor">${escHtml(a.actor_name||'—')}</span><span class="approval-time">${escHtml(dt)}</span>${a.comment?`<span class="approval-comment">${escHtml(a.comment)}</span>`:''}`;
      hEl.appendChild(d);
    });
  }else{
    hEl.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0;">이력 없음</div>';
  }

  const canA = isApprover(ev.group, ev.site);
  const isMe = me && me.userIdx === ev.created_by;
  const isP = ev.approval_status === 'PENDING';
  const isR = ev.approval_status === 'REJECTED';
  document.getElementById('action-area').style.display = (canA && isP) ? '' : 'none';
  document.getElementById('edit-section').style.display = (isMe && isR) ? '' : 'none';
  document.getElementById('no-permission-notice').style.display = (!canA && !isMe && isP) ? '' : 'none';
  document.getElementById('action-note').value = '';
}

/* Edit mode toggle */
function setEditMode(on){
  editMode = on;
  document.getElementById('view-mode').style.display = on ? 'none' : '';
  document.getElementById('edit-mode').style.display = on ? '' : 'none';
  document.getElementById('btn-edit-toggle').style.display = on ? 'none' : '';
  document.getElementById('btn-resubmit').style.display = on ? '' : 'none';
  document.getElementById('btn-edit-cancel').style.display = on ? '' : 'none';
  if(on && curEv) fillEditForm(curEv);
}

function fillEditForm(ev){
  document.getElementById('e-date').value = fmtDateInput(ev.task_date);
  document.getElementById('e-group').value = ev.group || 'PEE1';
  document.getElementById('e-site').value = ev.site || 'PT';
  document.getElementById('e-line').value = ev.line || '';
  document.getElementById('e-eq-name').value = ev.equipment_name || '';
  document.getElementById('e-eq-type').value = ev.equipment_type || '';
  document.getElementById('e-warranty').value = ev.warranty || 'WI';
  document.getElementById('e-work-type').value = ev.work_type || 'MAINT';
  document.getElementById('e-work-type2').value = ev.work_type2 || '';
  document.getElementById('e-rework').value = isRework(ev) ? '1' : '0';
  document.getElementById('e-rework-reason').value = ev.rework_reason || '';
  document.getElementById('e-rework-detail').value = renderText(ev.rework_detail)==='—' ? '' : renderText(ev.rework_detail);
  document.getElementById('e-title').value = ev.task_name || '';
  document.getElementById('e-status').value = ev.status || '';
  document.getElementById('e-action').value = renderText(ev.task_description)==='—' ? '' : renderText(ev.task_description);
  document.getElementById('e-cause').value = renderText(ev.task_cause)==='—' ? '' : renderText(ev.task_cause);
  document.getElementById('e-result').value = renderText(ev.task_result)==='—' ? '' : renderText(ev.task_result);
  buildEditWorkers(ev.workers || []);
  syncEditReworkFields();
}

function buildEditWorkers(workers){
  const l = document.getElementById('e-workers-list');
  l.innerHTML = '';
  workers.forEach(w => l.appendChild(mkEWRow(w)));
}

function mkEWRow(w){
  const d = document.createElement('div');
  d.className = 'e-worker-row';
  d.innerHTML = `<input class="ew-name" placeholder="이름" value="${escHtml(w?.engineer_name||'')}"><select class="ew-role"><option value="main"${(w?.role||'main')==='main'?' selected':''}>main</option><option value="support"${w?.role==='support'?' selected':''}>support</option></select><input type="time" class="ew-time" value="${fmtTimeInput(w?.start_time)}" placeholder="시작"><input type="time" class="ew-time" value="${fmtTimeInput(w?.end_time)}" placeholder="종료"><input type="number" class="ew-num" min="0" value="${w?.none_time||0}" placeholder="논"><input type="number" class="ew-num" min="0" value="${w?.move_time||0}" placeholder="무브"><button type="button" class="btn-remove-sm">−</button>`;
  d.querySelector('.btn-remove-sm').addEventListener('click',()=>d.remove());
  return d;
}

function collectEditWorkers(){
  return [...document.querySelectorAll('.e-worker-row')].map(d=>{
    const ins = d.querySelectorAll('input');
    const sel = d.querySelector('select');
    return {
      name: ins[0].value.trim(),
      role: sel.value,
      start_time: ins[1].value ? ins[1].value + ':00' : null,
      end_time: ins[2].value ? ins[2].value + ':00' : null,
      none_time: Number(ins[3].value) || 0,
      move_time: Number(ins[4].value) || 0
    };
  }).filter(w=>w.name);
}

function collectEditPatch(){
  const reworkOn = document.getElementById('e-rework').value === '1';
  return {
    task_name: document.getElementById('e-title').value.trim(),
    task_date: document.getElementById('e-date').value,
    group: document.getElementById('e-group').value,
    site: document.getElementById('e-site').value,
    line: document.getElementById('e-line').value.trim(),
    equipment_name: document.getElementById('e-eq-name').value.trim(),
    equipment_type: document.getElementById('e-eq-type').value.trim(),
    warranty: document.getElementById('e-warranty').value,
    work_type: document.getElementById('e-work-type').value,
    work_type2: document.getElementById('e-work-type2').value || null,
    is_rework: reworkOn ? 1 : 0,
    rework_reason: reworkOn ? (document.getElementById('e-rework-reason').value.trim() || null) : null,
    rework_detail: reworkOn ? (document.getElementById('e-rework-detail').value.trim() || null) : null,
    status: document.getElementById('e-status').value.trim(),
    task_description: document.getElementById('e-action').value.trim(),
    task_cause: document.getElementById('e-cause').value.trim(),
    task_result: document.getElementById('e-result').value.trim()
  };
}

/* Close */
function closeModal(){
  document.getElementById('detail-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
  curId = null;
  curEv = null;
  editMode = false;
}

/* Actions */
async function doApprove(){
  if(!curId) return;
  const n = document.getElementById('action-note').value.trim();
  setBtnLoad(true);
  try{
    await axios.post(`${API}/wl/event/${curId}/approve`, { note:n });
    toast('success','승인 완료','승인되었습니다.');
    closeModal();
    loadPending();
  }catch(e){
    toast('error','실패', e.response?.data?.error || e.message);
  }finally{ setBtnLoad(false); }
}

async function doReject(){
  if(!curId) return;
  const n = document.getElementById('action-note').value.trim();
  if(!n){
    toast('warn','사유 필요','반려 시 사유를 입력해주세요.');
    document.getElementById('action-note').focus();
    return;
  }
  setBtnLoad(true);
  try{
    await axios.post(`${API}/wl/event/${curId}/reject`, { note:n });
    toast('success','반려 완료','반려되었습니다.');
    closeModal();
    loadPending();
  }catch(e){
    toast('error','실패', e.response?.data?.error || e.message);
  }finally{ setBtnLoad(false); }
}

async function doResubmit(){
  if(!curId) return;
  if(!confirm('수정된 내용으로 재제출하시겠습니까?')) return;
  const patch = collectEditPatch();
  const workers = collectEditWorkers();
  if(!workers.length){
    toast('error','오류','작업자를 1명 이상 입력하세요.');
    return;
  }
  try{
    await axios.post(`${API}/wl/event/${curId}/resubmit`, { patch, workers });
    toast('success','재제출 완료','결재 대기 상태로 등록되었습니다.');
    closeModal();
    loadRejected();
    loadPending();
  }catch(e){
    toast('error','실패', e.response?.data?.error || e.message);
  }
}

async function doDelete(){
  if(!curId) return;
  if(!confirm('이 작업이력을 완전히 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;
  try{
    await axios.delete(`${API}/wl/event/${curId}`);
    toast('success','삭제 완료','작업이력이 삭제되었습니다.');
    closeModal();
    loadRejected();
    loadPending();
  }catch(e){
    toast('error','삭제 실패', e.response?.data?.error || e.message);
  }
}

function setBtnLoad(on){
  const a = document.getElementById('btn-approve');
  const r = document.getElementById('btn-reject');
  if(a) a.disabled = on;
  if(r) r.disabled = on;
}

/* Bind */
function bindEvents(){
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', closeModal);
  document.getElementById('btn-approve')?.addEventListener('click', doApprove);
  document.getElementById('btn-reject')?.addEventListener('click', doReject);
  document.getElementById('btn-resubmit')?.addEventListener('click', doResubmit);
  document.getElementById('btn-edit-toggle')?.addEventListener('click', ()=>setEditMode(true));
  document.getElementById('btn-edit-cancel')?.addEventListener('click', ()=>setEditMode(false));
  document.getElementById('e-add-worker')?.addEventListener('click', ()=>document.getElementById('e-workers-list').appendChild(mkEWRow({})));
  document.getElementById('btn-delete')?.addEventListener('click', doDelete);
  document.getElementById('e-rework')?.addEventListener('change', syncEditReworkFields);
}

/* Init */
document.addEventListener('DOMContentLoaded', ()=>{
  initNav();
  initTabs();
  initFilters();
  bindEvents();
  syncEditReworkFields();
  loadPending();
});
