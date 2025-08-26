(function () {
  const API = 'http://3.37.73.151:3001'; // 같은 도메인/포트에서 서비스면 빈 문자열
  const token = localStorage.getItem('x-access-token');
  const userRole = localStorage.getItem('user-role') || ''; // 일부 서버에서 참고
  if (!token) {
    alert('로그인이 필요합니다.');
    location.replace('./signin.html');
    return;
  }

  const selGroup = document.getElementById('sel-group');
  const selSite  = document.getElementById('sel-site');
  const areaApprover = document.getElementById('approver-area');
  const tbody = document.querySelector('#tbl-pending tbody');

  function hdr() {
    return {
      'Content-Type': 'application/json',
      'x-access-token': token,
      'user-role': userRole
    };
  }

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

  async function fetchPending() {
    const g = selGroup.value;
    const s = selSite.value;
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    try {
      const { data } = await axios.get(`${API}/approval/work-log/pending`, {
        headers: hdr(),
        params: { group: g || '', site: s || '' }
      });
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="8">대기 건이 없습니다.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(r => {
        const dt = (r.task_date || '') + ' ' + (r.start_time || '') + ' ~ ' + (r.end_time || '');
        const gs = `${r.group || ''} / ${r.site || ''}`;
        const eq = `${r.equipment_name || ''}<br><b>${r.task_name || ''}</b>`;
        const noteId = `note-${r.id}`;
        return `
          <tr data-id="${r.id}">
            <td>${r.id}</td>
            <td>${dt}</td>
            <td>${gs}</td>
            <td>${eq}</td>
            <td>${r.task_man || ''}</td>
            <td>${r.submitted_by || ''}</td>
            <td><input id="${noteId}" class="note-input" placeholder="메모(선택)"/></td>
            <td class="actions">
              <button class="btn btn-primary" data-act="approve" data-note-id="${noteId}">승인</button>
              <button class="btn btn-danger" data-act="reject" data-note-id="${noteId}">반려</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="8">대기 목록 조회 실패</td></tr>';
    }
  }

  async function postAction(id, act, note) {
    const url = act === 'approve'
      ? `${API}/approval/work-log/${id}/approve`
      : `${API}/approval/work-log/${id}/reject`;
    const body = { note: note || '' };
    await axios.post(url, body, { headers: hdr() });
  }

  // 이벤트 바인딩
  selGroup.addEventListener('change', async () => {
    // PSKH는 SITE 무시
    if (selGroup.value === 'PSKH') {
      selSite.value = '';
      selSite.disabled = true;
    } else {
      selSite.disabled = false;
    }
    await fetchApprovers();
    await fetchPending();
  });
  selSite.addEventListener('change', async () => {
    await fetchApprovers();
    await fetchPending();
  });

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset?.id;
    if (!id) return;

    const act = btn.dataset.act;
    const noteInput = document.getElementById(btn.dataset.noteId);
    const note = (noteInput?.value || '').trim();

    try {
      await postAction(id, act, note);
      alert(`${act === 'approve' ? '승인' : '반려'} 완료`);
      await fetchPending();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || '오류';
      alert(`${act === 'approve' ? '승인' : '반려'} 실패: ${msg}`);
    }
  });

  // 초기 로딩
  (async () => {
    await fetchApprovers();
    await fetchPending();
  })();
})();
