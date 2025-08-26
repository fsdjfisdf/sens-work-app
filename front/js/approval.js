(function () {
  const API = 'http://3.37.73.151:3001';
  const token = localStorage.getItem('x-access-token');
  if (!token) {
    alert('로그인이 필요합니다.');
    location.replace('./signin.html');
    return;
  }

  // NAV: 햄버거 토글
  const menuBtn = document.getElementById('menu-btn');
  const menuBar = document.getElementById('menu-bar');
  menuBtn.addEventListener('click', () => {
    const opened = menuBar.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(opened));
    menuBar.setAttribute('aria-hidden', String(!opened));
  });

  // 현재 사용자 파싱(닉네임/권한)
  const currentUser = parseJwt(token);
  const myNickname = currentUser?.nickname || '';
  const myRole = currentUser?.role || '';

  // --- Elements
  const selGroup = document.getElementById('sel-group');
  const selSite  = document.getElementById('sel-site');
  const areaApprover = document.getElementById('approver-area');
  const tbody = document.querySelector('#tbl-pending tbody');
  const q = document.getElementById('q');
  const qClear = document.getElementById('q-clear');
  const btnReset = document.getElementById('btn-reset');
  const dateFrom = document.getElementById('date-from');
  const dateTo = document.getElementById('date-to');

  // 모드 스위치(대기 / 반려 내 이력)
  const segBtns = document.querySelectorAll('.seg-btn');

  // Modal
  const ovl = document.getElementById('ovl');
  const mdl = document.getElementById('mdl');
  const mdClose = document.getElementById('md-close');
  const mdTitle = document.getElementById('md-title');
  const mdSub   = document.getElementById('md-sub');

  // fields
  const vID = document.getElementById('v-id');
  const vDuration = document.getElementById('v-duration');
  const vSubmitter = document.getElementById('v-submitter');

  const f_task_name = document.getElementById('f-task_name');
  const f_task_date = document.getElementById('f-task_date');
  const f_start_time= document.getElementById('f-start_time');
  const f_end_time  = document.getElementById('f-end_time');
  const f_group = document.getElementById('f-group');
  const f_site  = document.getElementById('f-site');
  const f_line  = document.getElementById('f-line');
  const f_task_man = document.getElementById('f-task_man');

  const f_equipment_type = document.getElementById('f-equipment_type');
  const f_equipment_name = document.getElementById('f-equipment_name');
  const f_warranty = document.getElementById('f-warranty');
  const f_work_type = document.getElementById('f-work_type');
  const f_work_type2= document.getElementById('f-work_type2');
  const f_setup_item= document.getElementById('f-setup_item');
  const f_maint_item= document.getElementById('f-maint_item');
  const f_transfer_item = document.getElementById('f-transfer_item');
  const f_SOP = document.getElementById('f-SOP');
  const f_tsguide = document.getElementById('f-tsguide');
  const f_none_time = document.getElementById('f-none_time');
  const f_move_time = document.getElementById('f-move_time');

  const f_task_description = document.getElementById('f-task_description');
  const f_task_cause = document.getElementById('f-task_cause');
  const f_task_result = document.getElementById('f-task_result');

  const mdNote = document.getElementById('md-note');
  const mdApprove = document.getElementById('md-approve');
  const mdReject  = document.getElementById('md-reject');
  const mdResubmit= document.getElementById('md-resubmit');
  const editHint = document.getElementById('edit-hint');

  // State
  let rowsCache = [];
  let filtered = [];
  let currentRow = null;
  let mode = 'pending';  // 'pending' | 'rejected'

  function hdr() {
    return {
      'Content-Type': 'application/json',
      'x-access-token': token
    };
  }

  // --- Utils
  function parseJwt(t){
    try { return JSON.parse(atob(t.split('.')[1] || '')) } catch(e){ return null; }
  }
  const safe = (s) => (s ?? '');

  function pickTime(rawA, rawB){
    const v = rawA ?? rawB ?? '';
    if (!v) return '';
    const s = String(v);
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
    if (!m) return s;
    const pad = (n)=> String(n).padStart(2,'0');
    return `${pad(m[1])}:${pad(m[2])}:${pad(m[3] ?? '00')}`;
  }
  function fmtISODateOnly(s) {
    if (!s) return '';
    const str = String(s);
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    return isNaN(d) ? str : d.toISOString().slice(0, 10);
  }
  function fmtLocalDateTime(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    const pad = (n)=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  const fmtGS = (r) => `${safe(r.group)} / ${safe(r.site)}${r.line ? ' / ' + r.line : ''}`;
  const fmtDT = (r) => {
    const date = fmtISODateOnly(r.task_date);
    const start = pickTime(r.start_time, r.startTime) || '—';
    const end   = pickTime(r.end_time,   r.endTime)   || '—';
    return `<div class="mono">${date}</div><div class="mono">${start} ~ ${end}</div>`;
  };
  const fmtEQ = (r) => `${safe(r.equipment_type)} / ${safe(r.equipment_name)}`;
  const fmtSubmitted = (r) => `${safe(r.submitted_by)}<br><span class="muted">${fmtLocalDateTime(r.submitted_at)}</span>`;
  const fmtWorkType = (r) => `${safe(r.work_type)} / ${safe(r.work_type2)}`;
  const displayTransfer = (r) => {
    const t = safe(r.transfer_item);
    return (!t || t === 'SELECT') ? '—' : t;
  };
  const pickSubItem = (r) => {
    if (r.work_type === 'SET UP') return safe(r.setup_item);
    if (r.work_type === 'MAINT')  return safe(r.maint_item);
    return '';
  };

  function toSeconds(t){
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(t||''));
    if (!m) return 0;
    const hh = +m[1], mm = +m[2], ss = m[3] ? +m[3] : 0;
    return hh*3600 + mm*60 + ss;
  }
  // 요구: none/move 제외하지 않고 end - start만
  function computeDuration(row) {
    const start = pickTime(row.start_time, row.startTime);
    const end   = pickTime(row.end_time,   row.endTime);
    if (!start || !end) return '00:00:00';
    let s = toSeconds(start), e = toSeconds(end);
    if (e < s) e += 24*3600; // 자정 넘김
    let secs = Math.max(0, e - s);
    const hh = Math.floor(secs/3600); secs -= hh*3600;
    const mm = Math.floor(secs/60);   const ss = secs - mm*60;
    const pad = (n)=> String(n).padStart(2,'0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  // --- Approvers
  async function fetchApprovers() {
    const g = selGroup.value;
    const s = selSite.value;
    if (!g) { areaApprover.innerHTML = ''; return; }
    try {
      const { data } = await axios.get(`${API}/approval/approvers`, {
        headers: hdr(),
        params: { group: g, site: s || '' }
      });
      const approvers = data?.approvers || [];
      areaApprover.innerHTML = approvers.length
        ? approvers.map(a => `<span class="badge">${a.nickname} <span class="pill">${a.role}</span></span>`).join('')
        : '<span class="hint">결재자 미설정</span>';
    } catch (e) {
      console.error(e);
      areaApprover.innerHTML = '<span class="hint">결재자 조회 실패</span>';
    }
  }

  // --- Pending/Rejected fetch
  async function fetchRows() {
    const g = selGroup.value;
    const s = selSite.value;
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    try {
      const url = (mode === 'pending')
        ? `${API}/approval/work-log/pending`
        : `${API}/approval/work-log/rejected?mine=1`; // 내 반려 이력
      const { data } = await axios.get(url, {
        headers: hdr(),
        params: (mode === 'pending') ? { group: g || '', site: s || '' } : {}
      });
      rowsCache = Array.isArray(data) ? data : [];
      redraw();
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="8">목록 조회 실패</td></tr>';
    }
  }

  // --- Filter + render
  function applyFilters() {
    const text = (q.value || '').toLowerCase().trim();
    const from = dateFrom.value ? new Date(dateFrom.value) : null;
    const to   = dateTo.value ? new Date(dateTo.value) : null;

    filtered = rowsCache.filter(r => {
      if (text) {
        const hay = [
          safe(r.equipment_type), safe(r.equipment_name),
          safe(r.task_man), safe(r.work_type), safe(r.work_type2),
          safe(r.transfer_item), safe(r.task_description), safe(r.task_cause), safe(r.task_result),
          safe(r.task_name)
        ].join(' ').toLowerCase();
        if (!hay.includes(text)) return false;
      }
      if (from || to) {
        const d = r.task_date ? new Date(fmtISODateOnly(r.task_date)) : null;
        if (d) {
          if (from && d < from) return false;
          if (to) {
            const toEnd = new Date(to); toEnd.setHours(23,59,59,999);
            if (d > toEnd) return false;
          }
        }
      }
      return true;
    });

    filtered.sort((a,b) => {
      const ad = fmtISODateOnly(a.task_date);
      const bd = fmtISODateOnly(b.task_date);
      if (ad === bd) return (b.id||0) - (a.id||0);
      return ad < bd ? 1 : -1;
    });
  }

  function redraw() {
    applyFilters();
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="8">데이터가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(r => `
      <tr data-id="${r.id}">
        <td class="nowrap center">${r.id}</td>
        <td class="wrap center">${fmtDT(r)}</td>
        <td class="wrap center">${fmtGS(r)}</td>
        <td class="wrap">${fmtEQ(r)}</td>
        <td class="wrap">
          ${fmtWorkType(r)}
          ${pickSubItem(r) ? `<div class="muted">${pickSubItem(r)}</div>` : ''}
        </td>
        <td class="wrap"><b>${displayTransfer(r)}</b></td>
        <td class="wrap">${safe(r.task_man)}</td>
        <td class="wrap">${fmtSubmitted(r)}</td>
      </tr>
    `).join('');
  }

  // --- Modal content binding
  function fillForm(row){
    vID.textContent = row.id;
    mdTitle.textContent = `상세 보기 — #${row.id}`;
    mdSub.innerHTML = `${safe(row.submitted_by)} • <span class="muted">${fmtLocalDateTime(row.submitted_at)}</span>`;
    vSubmitter.textContent = safe(row.submitted_by);

    f_task_name.value = safe(row.task_name);
    f_task_date.value = fmtISODateOnly(row.task_date);
    f_start_time.value= pickTime(row.start_time, row.startTime).slice(0,8);
    f_end_time.value  = pickTime(row.end_time, row.endTime).slice(0,8);

    f_group.value = safe(row.group);
    f_site.value  = safe(row.site);
    f_line.value  = safe(row.line);
    f_task_man.value = safe(row.task_man);

    f_equipment_type.value = safe(row.equipment_type);
    f_equipment_name.value = safe(row.equipment_name);
    f_warranty.value = safe(row.warranty);
    f_work_type.value = safe(row.work_type);
    f_work_type2.value= safe(row.work_type2);
    f_setup_item.value= safe(row.setup_item);
    f_maint_item.value= safe(row.maint_item);
    f_transfer_item.value = safe(row.transfer_item);
    f_SOP.value = safe(row.SOP);
    f_tsguide.value = safe(row.tsguide);
    f_none_time.value = row.none_time ?? 0;
    f_move_time.value = row.move_time ?? 0;

    f_task_description.value = safe(row.task_description).replace(/<br\s*\/?>/gi, '\n');
    f_task_cause.value = safe(row.task_cause).replace(/<br\s*\/?>/gi, '\n');
    f_task_result.value= safe(row.task_result).replace(/<br\s*\/?>/gi, '\n');

    vDuration.textContent = computeDuration(row);

    // 권한에 따른 버튼 표시
    const isApprover = (myRole === 'admin' || myRole === 'approver');
    const isRejected = (row.approval_status === 'rejected');
    const isOwner    = (myNickname && (row.submitted_by === myNickname || String(row.task_man||'').includes(myNickname)));

    mdApprove.classList.toggle('hidden', !isApprover || mode !== 'pending');
    mdReject.classList.toggle('hidden',  !isApprover || mode !== 'pending');

    // 반려건 + 작성자만 재요청 가능
    mdResubmit.classList.toggle('hidden', !(isRejected && isOwner));
    editHint.textContent = mdApprove.classList.contains('hidden')
      ? '반려 상태의 작성자는 수정 후 재요청할 수 있습니다.'
      : '결재자는 필요한 내용을 수정한 뒤 승인/반려할 수 있습니다.';
  }

  function readForm(){
    return {
      task_name: f_task_name.value.trim(),
      task_date: f_task_date.value || null,
      start_time: f_start_time.value || null,
      end_time: f_end_time.value || null,
      group: f_group.value.trim(),
      site:  f_site.value.trim(),
      line:  f_line.value.trim(),
      task_man: f_task_man.value.trim(),

      equipment_type: f_equipment_type.value.trim(),
      equipment_name: f_equipment_name.value.trim(),
      warranty: f_warranty.value.trim(),
      work_type: f_work_type.value.trim(),
      work_type2: f_work_type2.value.trim(),
      setup_item: f_setup_item.value.trim(),
      maint_item: f_maint_item.value.trim(),
      transfer_item: f_transfer_item.value.trim(),
      SOP: f_SOP.value.trim(),
      tsguide: f_tsguide.value.trim(),
      none_time: f_none_time.value ? +f_none_time.value : 0,
      move_time: f_move_time.value ? +f_move_time.value : 0,

      task_description: f_task_description.value.trim(),
      task_cause: f_task_cause.value.trim(),
      task_result: f_task_result.value.trim(),
    };
  }

  function openModal(row) {
    currentRow = row;
    mdNote.value = '';
    fillForm(row);
    ovl.classList.add('show');
    mdl.classList.add('show');
  }
  function closeModal() {
    mdl.classList.remove('show');
    ovl.classList.remove('show');
    currentRow = null;
  }

  async function patchPending(id, patch) {
    await axios.patch(`${API}/approval/work-log/${id}`, patch, { headers: hdr() });
  }
  async function postAction(id, act, note) {
    const url = act === 'approve'
      ? `${API}/approval/work-log/${id}/approve`
      : `${API}/approval/work-log/${id}/reject`;
    await axios.post(url, { note: note || '' }, { headers: hdr() });
  }
  async function resubmit(id, patch){
    await axios.post(`${API}/approval/work-log/${id}/resubmit`, patch, { headers: hdr() });
  }

  // --- Events
  segBtns.forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      segBtns.forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      mode = btn.dataset.mode;
      await fetchApprovers(); // pending 기준으로 표시, rejected에도 유지
      await fetchRows();
    });
  });

  selGroup.addEventListener('change', async () => {
    if (selGroup.value === 'PSKH') {
      selSite.value = '';
      selSite.disabled = true;
    } else {
      selSite.disabled = false;
    }
    if (mode === 'pending') await fetchApprovers();
    await fetchRows();
  });
  selSite.addEventListener('change', fetchRows);

  q.addEventListener('input', redraw);
  qClear.addEventListener('click', () => { q.value=''; redraw(); });
  dateFrom.addEventListener('change', redraw);
  dateTo.addEventListener('change', redraw);

  btnReset.addEventListener('click', async () => {
    selGroup.value = '';
    selSite.value = '';
    selSite.disabled = false;
    q.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    await fetchApprovers();
    await fetchRows();
  });

  // 행 클릭 -> 상세 보기
  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const id = tr.dataset.id;
    const row = filtered.find(r => String(r.id) === String(id));
    if (row) openModal(row);
  });

  ovl.addEventListener('click', closeModal);
  mdClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // 결재자: 수정 반영 + 승인 / 반려
  mdApprove.addEventListener('click', async () => {
    if (!currentRow) return;
    if (!confirm('수정 내용을 반영하고 승인하시겠습니까?')) return;
    try {
      await patchPending(currentRow.id, readForm());
      await postAction(currentRow.id, 'approve', mdNote.value.trim());
      alert('승인 완료');
      closeModal();
      await fetchRows();
    } catch (err) {
      console.error(err);
      alert(`승인 실패: ${err?.response?.data?.error || err?.response?.data?.message || '오류'}`);
    }
  });
  mdReject.addEventListener('click', async () => {
    if (!currentRow) return;
    const note = mdNote.value.trim();
    if (!confirm('반려하시겠습니까?')) return;
    try {
      // 결재자는 필요시 수정 반영 후 반려도 가능
      await patchPending(currentRow.id, readForm());
      await postAction(currentRow.id, 'reject', note);
      alert('반려 완료');
      closeModal();
      await fetchRows();
    } catch (err) {
      console.error(err);
      alert(`반려 실패: ${err?.response?.data?.error || err?.response?.data?.message || '오류'}`);
    }
  });

  // 작성자(반려건): 수정 후 재요청
  mdResubmit.addEventListener('click', async () => {
    if (!currentRow) return;
    if (!confirm('수정 내용을 반영하고 다시 결재 요청하시겠습니까?')) return;
    try {
      await resubmit(currentRow.id, readForm());
      alert('재요청 완료');
      closeModal();
      // 반려 → 재요청하면 대기로 가므로 대기 탭으로 전환
      document.querySelector('.seg-btn[data-mode="pending"]').click();
    } catch (err) {
      console.error(err);
      alert(`재요청 실패: ${err?.response?.data?.error || err?.response?.data?.message || '오류'}`);
    }
  });

  // 초기 로딩
  (async () => {
    await fetchApprovers();
    await fetchRows();
  })();
})();
