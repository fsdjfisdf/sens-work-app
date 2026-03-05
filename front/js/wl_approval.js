/* ================================================================
   wl_approval.js  —  Worklog Approval Page
   ================================================================ */
'use strict';

const API = 'http://3.37.73.151:3001';

/* ── 인증 토큰 파싱
     worklog_new.js와 동일하게 'x-access-token' 키 사용 ── */
const token = localStorage.getItem('x-access-token') || sessionStorage.getItem('x-access-token') || '';
const me = (() => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload; // { userIdx, nickname, role }
  } catch { return null; }
})();

/* ── Axios 기본 헤더 (jwtMiddleware는 x-access-token 헤더를 읽음) ── */
axios.defaults.headers.common['x-access-token'] = token || '';

/* ── 결재자 MAP (wlController.js와 동일하게 유지) ── */
const APPROVER_MAP = {
  'PEE1:PT': ['조지훈', '전대영', '손석현'],
  'PEE1:HS': ['진덕장', '한정훈', '정대환'],
  'PEE1:IC': ['강문호', '배한훈', '최원준'],
  'PEE1:CJ': ['강문호', '배한훈', '최원준'],
  'PEE2:PT': ['이지웅', '송왕근', '정현우'],
  'PEE2:HS': ['안재영', '김건희'],
  'PSKH:*':  ['유정현', '문순현'],
};

function isApprover(group, site) {
  if (!me) return false;
  if (me.role === 'admin' || me.role === 'editor') return true;
  const key = group === 'PSKH' ? 'PSKH:*' : `${group}:${site}`;
  return (APPROVER_MAP[key] || []).includes(me.nickname);
}

/* ── 상태 ── */
let currentEventId = null;
let currentEvent   = null;

/* ================================================================
   NAV 초기화
   ================================================================ */
function initNav() {
  if (me) {
    document.querySelectorAll('.sign-container.unsigned').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sign-container.signed').forEach(el => el.classList.remove('hidden'));
  }
  document.getElementById('sign-out')?.addEventListener('click', () => {
    localStorage.removeItem('x-access-token');
    sessionStorage.removeItem('x-access-token');
    location.href = './signin.html';
  });
}

/* ================================================================
   탭 전환
   ================================================================ */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab-pending').style.display  = tab === 'pending'  ? '' : 'none';
      document.getElementById('tab-rejected').style.display = tab === 'rejected' ? '' : 'none';
      if (tab === 'rejected') loadRejected();
    });
  });
}

/* ================================================================
   필터 이벤트
   ================================================================ */
function initFilters() {
  ['filter-group', 'filter-site', 'filter-mine'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', loadPending);
  });
  document.getElementById('btn-refresh')?.addEventListener('click', loadPending);
}

/* ================================================================
   결재 대기 목록 로드
   ================================================================ */
async function loadPending() {
  const list = document.getElementById('approval-list');
  list.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> 불러오는 중...</div>';

  const group = document.getElementById('filter-group').value;
  const site  = document.getElementById('filter-site').value;
  const mine  = document.getElementById('filter-mine').checked ? '1' : '';

  const params = new URLSearchParams();
  if (group) params.set('group', group);
  if (site)  params.set('site', site);
  if (mine)  params.set('mine', '1');

  try {
    const { data } = await axios.get(`${API}/wl/pending?${params}`);
    renderList(list, data, 'pending');
    document.getElementById('pending-count').textContent = data.length;
  } catch (e) {
    const msg = e.response?.data?.error || e.message;
    list.innerHTML = `<div class="empty-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>목록 조회 실패: ${escHtml(msg)}</p>
    </div>`;
  }
}

/* ================================================================
   반려 목록 로드 (내 반려건)
   ================================================================ */
async function loadRejected() {
  const list = document.getElementById('rejected-list');
  list.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> 불러오는 중...</div>';
  try {
    const { data } = await axios.get(`${API}/wl/rejected/mine`);
    renderList(list, data, 'rejected');
    document.getElementById('rejected-count').textContent = data.length;
  } catch (e) {
    const msg = e.response?.data?.error || e.message;
    list.innerHTML = `<div class="empty-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>조회 실패: ${escHtml(msg)}</p>
    </div>`;
  }
}

/* ================================================================
   카드 렌더링
   ================================================================ */
function renderList(container, rows, type) {
  if (!rows || !rows.length) {
    container.innerHTML = `<div class="empty-state">
      <i class="fas fa-${type === 'pending' ? 'inbox' : 'check-double'}"></i>
      <p>${type === 'pending' ? '결재 대기 중인 항목이 없습니다.' : '반려된 항목이 없습니다.'}</p>
    </div>`;
    return;
  }

  container.innerHTML = '';

  const statusMap   = { PENDING: '대기', REJECTED: '반려', APPROVED: '승인' };
  const statusClass = { PENDING: 'badge-pending', REJECTED: 'badge-rejected', APPROVED: 'badge-approved' };

  rows.forEach(ev => {
    const card = document.createElement('div');
    card.className = `event-card status-${(ev.approval_status || '').toLowerCase()}`;
    card.dataset.id = ev.id;

    const workers = (ev.workers || '').split(',').map(s => s.trim()).filter(Boolean);
    const workerChips = workers.map(w => `<span class="worker-chip">${escHtml(w)}</span>`).join('');
    const reworkBadge = ev.is_rework ? '<span class="card-status-badge badge-rework">REWORK</span>' : '';
    const emsText = ev.ems == 1 ? '유상' : '무상';

    card.innerHTML = `
      <div class="card-header">
        <div style="min-width:0;">
          <div class="card-code">${escHtml(ev.work_code || '코드 없음')}</div>
          <div class="card-title">${escHtml(ev.task_name || '')} ${reworkBadge}</div>
        </div>
        <span class="card-status-badge ${statusClass[ev.approval_status] || ''}">${statusMap[ev.approval_status] || ev.approval_status}</span>
      </div>
      <div class="card-meta">
        <span><i class="fas fa-calendar-alt"></i>${escHtml(ev.task_date || '')}</span>
        <span><i class="fas fa-map-marker-alt"></i>${escHtml(ev.group || '')} · ${escHtml(ev.site || '')}</span>
        <span><i class="fas fa-microchip"></i>${escHtml(ev.equipment_name || '')}</span>
        <span><i class="fas fa-tools"></i>${escHtml(ev.work_type || '')}${ev.work_type2 ? ' / ' + escHtml(ev.work_type2) : ''}</span>
        <span><i class="fas fa-dollar-sign"></i>${emsText}</span>
      </div>
      <div class="card-workers">
        <i class="fas fa-users" style="font-size:11px;flex-shrink:0;"></i>
        ${workerChips || '<span style="color:#4A5878;">작업자 없음</span>'}
      </div>
      ${ev.reject_comment ? `<div class="reject-comment-box"><strong>반려 사유:</strong>${escHtml(ev.reject_comment)}</div>` : ''}
    `;

    card.addEventListener('click', () => openDetail(ev.id));
    container.appendChild(card);
  });
}

/* ================================================================
   상세 모달 열기
   ================================================================ */
async function openDetail(id) {
  currentEventId = id;

  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('detail-modal').style.display  = 'block';
  document.body.style.overflow = 'hidden';

  // 헤더 초기화
  document.getElementById('m-work-code').textContent = '불러오는 중...';
  document.getElementById('m-title').textContent     = '';

  try {
    const { data } = await axios.get(`${API}/wl/event/${id}`);
    currentEvent = data;
    fillModal(data);
  } catch (e) {
    toast('error', '오류', '상세 정보를 불러오지 못했습니다.');
    closeModal();
  }
}

/* ================================================================
   모달 채우기
   ================================================================ */
function fillModal(ev) {
  const statusMap   = { PENDING: '대기', REJECTED: '반려', APPROVED: '승인' };
  const statusClass = { PENDING: 'badge-pending', REJECTED: 'badge-rejected', APPROVED: 'badge-approved' };

  // 헤더
  document.getElementById('m-work-code').textContent = ev.work_code || '코드 없음';
  document.getElementById('m-title').textContent     = ev.task_name || '';
  const badge = document.getElementById('m-status-badge');
  badge.textContent = statusMap[ev.approval_status] || ev.approval_status;
  badge.className   = `card-status-badge ${statusClass[ev.approval_status] || ''}`;

  // 기본 정보
  document.getElementById('m-date').textContent      = ev.task_date || '—';

  let timeStr = '—';
  if (ev.start_time && ev.end_time) {
    timeStr = `${ev.start_time.substring(0,5)} ~ ${ev.end_time.substring(0,5)}`;
    if (ev.none_time  > 0) timeStr += ` (논${ev.none_time}분)`;
    if (ev.move_time  > 0) timeStr += ` (무브${ev.move_time}분)`;
  }
  document.getElementById('m-time').textContent      = timeStr;
  document.getElementById('m-ems').textContent       = ev.ems == 1 ? '유상 (EMS)' : '무상 (WI)';
  document.getElementById('m-group-site').textContent= `${ev.group || '—'} / ${ev.site || '—'}`;
  document.getElementById('m-line').textContent      = ev.line || '—';
  document.getElementById('m-country').textContent   = ev.country || '—';
  document.getElementById('m-eq-name').textContent   = ev.equipment_name || '—';
  document.getElementById('m-eq-type').textContent   = ev.equipment_type || '—';
  document.getElementById('m-warranty').textContent  = ev.warranty || '—';
  document.getElementById('m-work-type').textContent = ev.work_type || '—';
  document.getElementById('m-work-type2').textContent= ev.work_type2 || '—';
  document.getElementById('m-sop').textContent       = `${ev.SOP || '—'} / ${ev.tsguide || '—'}`;
  document.getElementById('m-status-text').textContent = ev.status || '—';

  // Work Items
  const wiEl = document.getElementById('m-work-items');
  if (ev.workItems?.length) {
    wiEl.innerHTML = `<div class="chip-list">${
      ev.workItems.map(wi =>
        `<span class="chip-item">${escHtml(wi.master_item_name || wi.item_name_free || '—')}</span>`
      ).join('')
    }</div>`;
  } else { wiEl.textContent = '—'; }

  // Parts
  const partsEl = document.getElementById('m-parts');
  if (ev.parts?.length) {
    partsEl.innerHTML = `<div class="chip-list">${
      ev.parts.map(p =>
        `<span class="chip-item">${escHtml(p.master_part_name || p.part_name_free || '—')}${p.qty > 1 ? ` ×${p.qty}` : ''}</span>`
      ).join('')
    }</div>`;
  } else { partsEl.textContent = '—'; }

  // 작업자 테이블
  const tbody = document.getElementById('m-workers-tbody');
  tbody.innerHTML = '';
  (ev.workers || []).forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(w.engineer_name || '')}</td>
      <td><span class="role-badge role-${escHtml(w.role || 'main')}">${escHtml(w.role || 'main')}</span></td>
      <td>${w.task_duration ?? '—'} 분</td>
    `;
    tbody.appendChild(tr);
  });

  // 내용
  document.getElementById('m-action').textContent = ev.task_description || '—';
  document.getElementById('m-cause').textContent  = ev.task_cause       || '—';
  document.getElementById('m-result').textContent = ev.task_result      || '—';

  // 결재 이력
  const histEl = document.getElementById('m-history');
  histEl.innerHTML = '';
  if (ev.approvals?.length) {
    ev.approvals.forEach(a => {
      const div = document.createElement('div');
      div.className = 'approval-row';
      const dt = a.acted_at
        ? new Date(a.acted_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })
        : '';
      div.innerHTML = `
        <span class="approval-action-badge action-${escHtml(a.action)}">${escHtml(a.action)}</span>
        <span class="approval-actor">${escHtml(a.actor_name || '—')}</span>
        <span class="approval-time">${escHtml(dt)}</span>
        ${a.comment ? `<span class="approval-comment">${escHtml(a.comment)}</span>` : ''}
      `;
      histEl.appendChild(div);
    });
  } else {
    histEl.innerHTML = '<div style="font-size:12px;color:#4A5878;padding:8px 0;">이력 없음</div>';
  }

  // ── 권한에 따른 액션 영역 표시 ──
  const canApprove = isApprover(ev.group, ev.site);
  const isMyEvent  = me && me.userIdx === ev.created_by;
  const isPending  = ev.approval_status === 'PENDING';
  const isRejected = ev.approval_status === 'REJECTED';

  document.getElementById('action-area').style.display          = (canApprove && isPending)  ? '' : 'none';
  document.getElementById('resubmit-wrapper').style.display     = (isMyEvent  && isRejected) ? 'flex' : 'none';
  document.getElementById('no-permission-notice').style.display =
    (!canApprove && !isMyEvent && isPending) ? '' : 'none';

  // 코멘트 초기화
  document.getElementById('action-note').value = '';
}

/* ================================================================
   모달 닫기
   ================================================================ */
function closeModal() {
  document.getElementById('detail-modal').style.display  = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
  currentEventId = null;
  currentEvent   = null;
}

/* ================================================================
   승인
   ================================================================ */
async function doApprove() {
  if (!currentEventId) return;
  const note = document.getElementById('action-note').value.trim();
  setActionLoading(true);
  try {
    await axios.post(`${API}/wl/event/${currentEventId}/approve`, { note });
    toast('success', '승인 완료', '작업 이력이 승인되었습니다.');
    closeModal();
    loadPending();
  } catch (e) {
    toast('error', '승인 실패', e.response?.data?.error || e.message);
  } finally { setActionLoading(false); }
}

/* ================================================================
   반려
   ================================================================ */
async function doReject() {
  if (!currentEventId) return;
  const note = document.getElementById('action-note').value.trim();
  if (!note) {
    toast('warn', '반려 사유 필요', '반려 시 반드시 사유를 입력해주세요.');
    document.getElementById('action-note').focus();
    return;
  }
  setActionLoading(true);
  try {
    await axios.post(`${API}/wl/event/${currentEventId}/reject`, { note });
    toast('success', '반려 완료', '작업 이력이 반려되었습니다.');
    closeModal();
    loadPending();
  } catch (e) {
    toast('error', '반려 실패', e.response?.data?.error || e.message);
  } finally { setActionLoading(false); }
}

/* ================================================================
   재제출
   ================================================================ */
async function doResubmit() {
  if (!currentEventId) return;
  if (!confirm('이 작업 이력을 재제출하시겠습니까?')) return;
  try {
    await axios.post(`${API}/wl/event/${currentEventId}/resubmit`, {});
    toast('success', '재제출 완료', '다시 결재 대기 상태로 등록되었습니다.');
    closeModal();
    loadRejected();
    // 대기 탭 카운트도 갱신
    loadPending();
  } catch (e) {
    toast('error', '재제출 실패', e.response?.data?.error || e.message);
  }
}

/* ================================================================
   버튼 로딩 토글
   ================================================================ */
function setActionLoading(on) {
  const btnA = document.getElementById('btn-approve');
  const btnR = document.getElementById('btn-reject');
  if (btnA) btnA.disabled = on;
  if (btnR) btnR.disabled = on;
}

/* ================================================================
   토스트
   ================================================================ */
function toast(type, title, msg) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toast-head">
      <span class="badge">${type === 'error' ? 'ERR' : type === 'warn' ? 'WARN' : 'OK'}</span>
      ${escHtml(title)}
    </div>
    <div class="toast-body">${escHtml(msg)}</div>
  `;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

/* ================================================================
   HTML 이스케이프
   ================================================================ */
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ================================================================
   이벤트 바인딩
   ================================================================ */
function bindEvents() {
  // 모달 닫기
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', closeModal);

  // 승인 / 반려 / 재제출
  document.getElementById('btn-approve')?.addEventListener('click', doApprove);
  document.getElementById('btn-reject')?.addEventListener('click', doReject);
  document.getElementById('btn-resubmit')?.addEventListener('click', doResubmit);
}

/* ================================================================
   초기화
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTabs();
  initFilters();
  bindEvents();
  loadPending();
});
