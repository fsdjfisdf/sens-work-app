// loadworklog.js
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('x-access-token');

  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.replace('./signin.html');
    return;
  }

  // ===== DOM =====
  const worklogBody   = document.getElementById('worklog-body');
  const editModal     = document.getElementById('modal');
  const editForm      = document.getElementById('worklog-form');
  const closeModalBtn = document.querySelector('.close');
  const saveBtn       = document.querySelector('#save-btn');
  const deleteBtn     = document.querySelector('#delete-btn');
  const prevPageBtn   = document.getElementById('prev-page');
  const nextPageBtn   = document.getElementById('next-page');
  const pageInfo      = document.getElementById('page-info');

  // (관리자 전용) 엑셀 버튼들
  const allExcelBtn   = document.getElementById('export-excel-btn');
  const paidExcelBtn  = document.getElementById('export-paid-excel-btn');

  // ===== State =====
  let currentPage = 1;
  const logsPerPage = 10;
  let allLogs = [];
  let currentEditingId = null;
  let currentUserNickname = null;
  let userRole = null;

  // ===== Utils =====
  function emsLabel(v) {
    return (v === 1 || v === '1') ? '유상'
         : (v === 0 || v === '0') ? '무상'
         : '—';
  }

  // YYYY-MM-DD from filter inputs
  function getSelectedDateRange() {
    const start = document.getElementById('start-date')?.value || null;
    const end   = document.getElementById('end-date')?.value   || null;
    return { start, end };
  }

  // task_date(ISO or YYYY-MM-DD) within range? (inclusive)
  function inDateRange(taskDateISO, start, end) {
    const d = (taskDateISO || '').split('T')[0]; // normalize YYYY-MM-DD
    if (start && d < start) return false;
    if (end   && d > end)   return false;
    return true;
  }

  function convertToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hh, mm] = String(timeStr).split(':').map(Number);
    return (hh * 60) + (mm || 0);
  }

  function cleanWorkerNames(taskMan) {
    return taskMan
      ? taskMan.split(/,\s*/).map(n => n.replace(/\(.*?\)/g, '').trim()).filter(Boolean)
      : [];
  }

  // ===== API =====
  async function getCurrentUser() {
    try {
      const response = await fetch('http://3.37.73.151:3001/user-info', {
        headers: { 'x-access-token': token }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      console.log("🔍 사용자 정보 응답 데이터:", data);

      if (data && data.result) {
        currentUserNickname = data.result.NAME.replace(/\(.*?\)/g, '').trim();
        userRole = data.result.role || "역할 없음";
        console.log(`✅ 현재 로그인한 사용자: ${currentUserNickname}, 역할: ${userRole}`);
      } else {
        console.warn("⚠️ 사용자 정보 없음.");
      }
    } catch (error) {
      console.error('❌ 현재 사용자 정보를 가져오는 중 오류 발생:', error);
    }
  }

  async function fetchAllWorkLogs() {
    try {
      console.log(`📌 현재 사용자: ${currentUserNickname}, 역할: ${userRole}`);

      const response = await fetch(`http://3.37.73.151:3001/logs`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      allLogs = await response.json();

      console.log("📌 정렬 전 작업 이력:", allLogs);

      if (allLogs.length === 0) {
        worklogBody.innerHTML = '<tr><td colspan="8">작업 이력이 없습니다.</td></tr>';
        return;
      }

      // 최신 날짜 → 종료시간 늦은 순
      allLogs.sort((a, b) => {
        const dateA = new Date(a.task_date).getTime();
        const dateB = new Date(b.task_date).getTime();
        if (dateA !== dateB) return dateB - dateA;

        const timeA = a.end_time ? a.end_time.replace(/:/g, '') : '000000';
        const timeB = b.end_time ? b.end_time.replace(/:/g, '') : '000000';
        return timeB - timeA;
      });

      console.log("📌 정렬 후 작업 이력:", allLogs);

      updatePagination();
      renderPage(currentPage);
    } catch (error) {
      console.error('❌ 작업 이력 불러오기 오류:', error);
    }
  }

  // ===== Filters =====
  function applyFilters() {
    let filteredLogs = allLogs;

    // 기간
    const startDate = document.getElementById('start-date').value;
    const endDate   = document.getElementById('end-date').value;
    if (startDate) filteredLogs = filteredLogs.filter(log => log.task_date >= startDate);
    if (endDate)   filteredLogs = filteredLogs.filter(log => log.task_date <= endDate);

    // GROUP
    const group = document.getElementById('group').value;
    if (group) filteredLogs = filteredLogs.filter(log => log.group === group);

    // SITE
    const site = document.getElementById('site').value;
    if (site) filteredLogs = filteredLogs.filter(log => log.site === site);

    // LINE
    const line = document.getElementById('line').value;
    if (line) filteredLogs = filteredLogs.filter(log => log.line === line);

    // EQ TYPE
    const eqType = document.getElementById('eq-type').value;
    if (eqType) filteredLogs = filteredLogs.filter(log => log.equipment_type === eqType);

    // EQ NAME
    const eqName = document.getElementById('eq-name').value.trim();
    if (eqName) filteredLogs = filteredLogs.filter(log => (log.equipment_name || '').includes(eqName));

    // TITLE
    const title = document.getElementById('title').value.trim();
    if (title) filteredLogs = filteredLogs.filter(log => (log.task_name || '').includes(title));

    // WORKER
    const worker = document.getElementById('worker').value.trim();
    if (worker) filteredLogs = filteredLogs.filter(log => (log.task_man || '').includes(worker));

    // TRANSFER ITEM
    const transferItem = document.getElementById('transfer-item').value.trim();
    if (transferItem) filteredLogs = filteredLogs.filter(log => (log.transfer_item || '').includes(transferItem));

    // SETUP ITEM
    const setupItem = document.getElementById('setup-item').value;
    if (setupItem) filteredLogs = filteredLogs.filter(log => log.setup_item === setupItem);

    // EMS
    const emsFilter = document.getElementById('ems-filter')?.value ?? '';
    if (emsFilter !== '') {
      const want = Number(emsFilter); // 0 or 1
      filteredLogs = filteredLogs.filter(log => {
        const v = (log.ems === 0 || log.ems === 1) ? log.ems
                : (log.ems === '0' || log.ems === '1') ? Number(log.ems)
                : null;
        return v === want;
      });
    }

    // 정렬: 날짜 desc → end_time desc
    filteredLogs.sort((a, b) => {
      const dateA = new Date(a.task_date).getTime();
      const dateB = new Date(b.task_date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (b.end_time || '').localeCompare(a.end_time || '');
    });

    renderFilteredLogs(filteredLogs);
  }

  function renderFilteredLogs(filteredLogs) {
    allLogs = filteredLogs;
    currentPage = 1;
    updatePagination();
    renderPage(currentPage);
  }

  // Search / Reset
  document.getElementById('search-btn').addEventListener('click', applyFilters);

  document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value   = '';
    document.getElementById('group').value      = '';
    document.getElementById('site').value       = '';
    document.getElementById('line').value       = '';
    document.getElementById('eq-type').value    = '';
    document.getElementById('eq-name').value    = '';
    document.getElementById('title').value      = '';
    document.getElementById('worker').value     = '';
    document.getElementById('transfer-item').value = '';
    document.getElementById('setup-item').value = '';
    const emsSelect = document.getElementById('ems-filter');
    if (emsSelect) emsSelect.value = ''; // EMS 초기화(있으면)

    fetchAllWorkLogs();
  });

  // ===== Pagination =====
  function updatePagination() {
    const totalPages = Math.ceil(allLogs.length / logsPerPage);
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  }

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
      updatePagination();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(allLogs.length / logsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
      updatePagination();
    }
  });

  // ===== Table render =====
  function renderPage(page) {
    worklogBody.innerHTML = '';
    const startIndex = (page - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    const logsToShow = allLogs.slice(startIndex, endIndex);

    logsToShow.forEach(log => {
      const formattedDate = log.task_date ? String(log.task_date).split('T')[0] : '';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${log.group || ''}</td>
        <td>${log.site || ''}</td>
        <td>${log.task_name || ''}</td>
        <td>${log.task_result || ''}</td>
        <td>${log.task_man || ''}</td>
        <td>${emsLabel(log.ems)}</td>
        <td>${log.task_duration || ''}</td>
      `;
      worklogBody.appendChild(row);

      // row click -> edit modal
      row.addEventListener('click', async () => {
        currentEditingId = log.id;
        showEditForm(log);
      });
    });
  }

  // ===== Modal =====
  function showEditForm(log) {
    if (!log || !editForm) return;

    function formatText(text) {
      return text ? text.replace(/<br\s*\/?>/gi, '\n') : '';
    }

    const formattedDate = log.task_date ? new Date(log.task_date).toISOString().split('T')[0] : '';
    const formattedStartTime = log.start_time ? log.start_time.substring(0, 5) : '';
    const formattedEndTime   = log.end_time ? log.end_time.substring(0, 5) : '';

    if (editForm.elements['task_name']) editForm.elements['task_name'].value = log.task_name || '';
    if (editForm.elements['task_date']) editForm.elements['task_date'].value = formattedDate;
    if (editForm.elements['task_man'])  editForm.elements['task_man'].value  = log.task_man || '';
    if (editForm.elements['group'])     editForm.elements['group'].value     = log.group || '';
    if (editForm.elements['site'])      editForm.elements['site'].value      = log.site || '';
    if (editForm.elements['line'])      editForm.elements['line'].value      = log.line || '';
    if (editForm.elements['task_result']) editForm.elements['task_result'].value = formatText(log.task_result);
    if (editForm.elements['task_description']) {
      editForm.elements['task_description'].value = formatText(log.task_description);
      editForm.elements['task_description'].style.height = "200px";
    }
    if (editForm.elements['task_cause']) editForm.elements['task_cause'].value = formatText(log.task_cause);
    if (editForm.elements['status'])     editForm.elements['status'].value     = formatText(log.status);
    if (editForm.elements['SOP'])        editForm.elements['SOP'].value        = log.SOP || '';
    if (editForm.elements['tsguide'])    editForm.elements['tsguide'].value    = log.tsguide || '';
    if (editForm.elements['equipment_type']) editForm.elements['equipment_type'].value = log.equipment_type || '';
    if (editForm.elements['equipment_name']) editForm.elements['equipment_name'].value = log.equipment_name || '';
    if (editForm.elements['start_time']) editForm.elements['start_time'].value = formattedStartTime;
    if (editForm.elements['end_time'])   editForm.elements['end_time'].value   = formattedEndTime;
    if (editForm.elements['move_time'])  editForm.elements['move_time'].value  = log.move_time || '0';
    if (editForm.elements['none_time'])  editForm.elements['none_time'].value  = log.none_time || '0';
    if (editForm.elements['setup_item']) editForm.elements['setup_item'].value = log.setup_item || '';
    if (editForm.elements['transfer_item']) editForm.elements['transfer_item'].value = log.transfer_item || '';
    if (editForm.elements['warranty'])   editForm.elements['warranty'].value   = log.warranty || '';
    if (editForm.elements['ems']) {
      editForm.elements['ems'].value =
        (log.ems === 1 || log.ems === '1') ? '1' :
        (log.ems === 0 || log.ems === '0') ? '0' : '';
    }
    if (editForm.elements['work_type'])  editForm.elements['work_type'].value  = log.work_type || '';
    if (editForm.elements['work_type2']) editForm.elements['work_type2'].value = log.work_type2 || 'SELECT';

    editModal.style.display = 'block';
  }

  closeModalBtn.addEventListener('click', () => editModal.style.display = 'none');
  window.onclick = (event) => { if (event.target == editModal) editModal.style.display = 'none'; };

  // ===== Save/Delete =====
  saveBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    if (!currentEditingId) return;

    const log = allLogs.find(l => l.id === currentEditingId);
    const workerNames = cleanWorkerNames(log.task_man);
    const isOwner = workerNames.includes(currentUserNickname);
    const isAdminOrEditor = userRole === 'admin' || userRole === 'editor';

    if (!isOwner && !isAdminOrEditor) {
      alert("이 작업 이력을 수정할 권한이 없습니다.");
      return;
    }

    const emsVal = editForm.elements['ems'] ? editForm.elements['ems'].value : '';
    const updatedLog = {
      task_name: editForm.elements['task_name'].value,
      task_date: editForm.elements['task_date'].value,
      task_man:  editForm.elements['task_man'].value,
      group:     editForm.elements['group'].value,
      site:      editForm.elements['site'].value,
      line:      editForm.elements['line'].value,
      task_result:      editForm.elements['task_result'].value,
      task_description: editForm.elements['task_description'].value,
      task_cause:       editForm.elements['task_cause'].value,
      status:    editForm.elements['status'].value,
      SOP:       editForm.elements['SOP'].value,
      tsguide:   editForm.elements['tsguide'].value,
      equipment_type:  editForm.elements['equipment_type'].value,
      equipment_name:  editForm.elements['equipment_name'].value,
      start_time: editForm.elements['start_time'].value,
      end_time:   editForm.elements['end_time'].value,
      move_time:  editForm.elements['move_time'].value,
      none_time:  editForm.elements['none_time'].value,
      setup_item: editForm.elements['setup_item'].value,
      transfer_item: editForm.elements['transfer_item'].value,
      warranty:  editForm.elements['warranty'].value,
      ems: emsVal === '' ? null : Number(emsVal),
      work_type:  editForm.elements['work_type'].value,
      work_type2: editForm.elements['work_type2'].value,
    };

    try {
      const response = await fetch(`http://3.37.73.151:3001/api/logs/${currentEditingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLog),
      });
      if (!response.ok) throw new Error("수정 실패");

      alert("작업 이력이 수정되었습니다.");
      editModal.style.display = 'none';
      fetchAllWorkLogs();
    } catch (error) {
      console.error('작업 이력 수정 중 오류 발생:', error);
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (!currentEditingId) return;

    const log = allLogs.find(l => l.id === currentEditingId);
    const workerNames = cleanWorkerNames(log.task_man);
    const isOwner = workerNames.includes(currentUserNickname);
    const isAdminOrEditor = userRole === 'admin' || userRole === 'editor';

    if (!isOwner && !isAdminOrEditor) {
      alert("이 작업 이력을 삭제할 권한이 없습니다.");
      return;
    }

    const confirmDelete = confirm("정말 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://3.37.73.151:3001/api/logs/${currentEditingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("삭제 실패");

      alert("작업 이력이 삭제되었습니다.");
      editModal.style.display = 'none';
      fetchAllWorkLogs();
    } catch (error) {
      console.error('작업 이력 삭제 중 오류 발생:', error);
    }
  });

  // ===== Init =====
  await getCurrentUser();
  fetchAllWorkLogs();

  // ===== Export Excel (admin only; 버튼이 존재할 때만 바인딩) =====
  if (allExcelBtn) {
    allExcelBtn.addEventListener('click', async () => {
      try {
        // admin 확인
        const userResponse = await fetch('http://3.37.73.151:3001/user-info', {
          headers: { 'x-access-token': token }
        });
        if (!userResponse.ok) throw new Error('사용자 정보를 가져오지 못했습니다.');
        const userData = await userResponse.json();
        if (userData.result.role !== 'admin') {
          alert('엑셀 다운로드 권한이 없습니다.');
          return;
        }

        // 전체 로그
        const response = await fetch('http://3.37.73.151:3001/logs');
        if (!response.ok) throw new Error('작업 이력을 가져오지 못했습니다.');
        const workLogs = await response.json();
        if (workLogs.length === 0) {
          alert('작업 이력이 없습니다.');
          return;
        }

        const formattedData = workLogs.map(log => ({
          "id": log.id,
          "task_name": log.task_name,
          "task_date": log.task_date ? String(log.task_date).split('T')[0] : '',
          "man": log.task_man,
          "group": log.group,
          "site": log.site,
          "line": log.line,
          "eq type": log.equipment_type,
          "task_warranty": log.warranty,
          "EMS": emsLabel(log.ems),
          "eq name": log.equipment_name,
          "status": log.status,
          "action": log.task_description,
          "cause": log.task_cause,
          "result": log.task_result,
          "SOP": log.SOP,
          "TS guide": log.tsguide,
          "work_type": log.work_type,
          "work_type2": log.work_type2,
          "setup_item": log.setup_item,
          "transfer_item": log.transfer_item,
          "time(min)": convertToMinutes(log.task_duration),
          "start time": log.start_time,
          "end time": log.end_time,
          "none": log.none_time,
          "move": log.move_time,
        }));

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "WorkLogs");
        XLSX.writeFile(wb, `workLogs_${new Date().toISOString().split('T')[0]}.xlsx`);

        alert("엑셀 파일이 다운로드되었습니다.");
      } catch (error) {
        console.error('엑셀 다운로드 오류:', error);
        alert('엑셀 다운로드 중 오류가 발생했습니다.');
      }
    });
  }

  if (paidExcelBtn) {
    paidExcelBtn.addEventListener('click', async () => {
      try {
        // 기간 검증
        let { start, end } = getSelectedDateRange();
        if (start && end && start > end) {
          alert('END DATE가 START DATE보다 이릅니다. 기간을 확인해주세요.');
          return;
        }

        // admin 확인
        const userResponse = await fetch('http://3.37.73.151:3001/user-info', {
          headers: { 'x-access-token': token }
        });
        if (!userResponse.ok) throw new Error('사용자 정보를 가져오지 못했습니다.');
        const userData = await userResponse.json();
        if (userData?.result?.role !== 'admin') {
          alert('엑셀 다운로드 권한이 없습니다.');
          return;
        }

        // 전체 로그
        const response = await fetch('http://3.37.73.151:3001/logs');
        if (!response.ok) throw new Error('작업 이력을 가져오지 못했습니다.');
        const workLogs = await response.json();

        // EMS=1 + 기간 필터
        const paidInRange = workLogs
          .filter(log => (log.ems === 1 || log.ems === '1'))
          .filter(log => inDateRange(log.task_date, start, end));

        if (paidInRange.length === 0) {
          alert('선택한 기간에 유상(EMS=1) 데이터가 없습니다.');
          return;
        }

        const formattedData = paidInRange.map(log => ({
          "id": log.id,
          "task_name": log.task_name,
          "task_date": log.task_date ? String(log.task_date).split('T')[0] : '',
          "man": log.task_man,
          "group": log.group,
          "site": log.site,
          "line": log.line,
          "eq type": log.equipment_type,
          "task_warranty": log.warranty,
          "EMS": emsLabel(log.ems),
          "eq name": log.equipment_name,
          "status": log.status,
          "action": log.task_description,
          "cause": log.task_cause,
          "result": log.task_result,
          "SOP": log.SOP,
          "TS guide": log.tsguide,
          "work_type": log.work_type,
          "work_type2": log.work_type2,
          "setup_item": log.setup_item,
          "transfer_item": log.transfer_item,
          "time(min)": convertToMinutes(log.task_duration),
          "start time": log.start_time,
          "end time": log.end_time,
          "none": log.none_time,
          "move": log.move_time,
        }));

        const today = new Date().toISOString().split('T')[0];
        const rangeSuffix = (start || end) ? `_${start || 'ALL'}~${end || 'ALL'}` : '';
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PaidOnly");
        XLSX.writeFile(wb, `workLogs_paid${rangeSuffix}_${today}.xlsx`);

        alert('유상(EMS=1) 데이터(선택 기간) 엑셀로 다운로드했습니다.');
      } catch (err) {
        console.error('유상만 엑셀 다운로드 오류:', err);
        alert('엑셀 다운로드 중 오류가 발생했습니다.');
      }
    });
  }
});
