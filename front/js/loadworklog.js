document.addEventListener('DOMContentLoaded', async () => {

    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }


    const worklogBody = document.getElementById('worklog-body');
    const editModal = document.getElementById('modal');
    const editForm = document.getElementById('worklog-form');
    const closeModalBtn = document.querySelector('.close');
    const saveBtn = document.querySelector('#save-btn'); // 저장 버튼
    const deleteBtn = document.querySelector('#delete-btn'); //삭제 버튼튼
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');


    let currentPage = 1;
    const logsPerPage = 10;
    let allLogs = []; // 전체 작업 이력을 저장할 배열
    let currentEditingId = null; // 현재 수정 중인 작업 이력 ID
    let currentUserNickname = null; // 로그인한 사용자 닉네임
    let userRole = null; // 로그인한 사용자 역할
    

        // 로그인한 사용자 정보 가져오기
        async function getCurrentUser() {
            try {
                const response = await fetch('http://3.37.73.151:3001/user-info', {
                    headers: { 'x-access-token': token }
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const data = await response.json(); // ✅ JSON 변환
        
                console.log("🔍 사용자 정보 응답 데이터:", data); // ✅ 응답 데이터 확인
        
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
        

    // 모든 작업 이력을 불러옴
    async function fetchAllWorkLogs() {
        try {
            console.log(`📌 현재 사용자: ${currentUserNickname}, 역할: ${userRole}`); // ✅ 현재 사용자 정보 출력
    
            const response = await fetch(`http://3.37.73.151:3001/logs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allLogs = await response.json();
    
            console.log("📌 정렬 전 작업 이력:", allLogs); // 디버깅용 로그
    
            if (allLogs.length === 0) {
                worklogBody.innerHTML = '<tr><td colspan="8">작업 이력이 없습니다.</td></tr>';
                return;
            }
    
            // ✅ 작업 이력을 정렬: 날짜 최신순 → 종료시간 늦은순 정렬
            allLogs.sort((a, b) => {
                const dateA = new Date(a.task_date).getTime();
                const dateB = new Date(b.task_date).getTime();
    
                if (dateA !== dateB) {
                    return dateB - dateA;
                }
    
                const timeA = a.end_time ? a.end_time.replace(/:/g, '') : '000000';
                const timeB = b.end_time ? b.end_time.replace(/:/g, '') : '000000';
    
                return timeB - timeA;
            });
    
            console.log("📌 정렬 후 작업 이력:", allLogs); // 정렬된 데이터 확인
    
            updatePagination();
            renderPage(currentPage);
        } catch (error) {
            console.error('❌ 작업 이력 불러오기 오류:', error);
        }
    }

    function applyFilters() {
        let filteredLogs = allLogs;
    
        // ✅ START DATE ~ END DATE 필터링
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        if (startDate) {
            filteredLogs = filteredLogs.filter(log => log.task_date >= startDate);
        }
        if (endDate) {
            filteredLogs = filteredLogs.filter(log => log.task_date <= endDate);
        }
    
        // ✅ GROUP 필터링
        const group = document.getElementById('group').value;
        if (group) {
            filteredLogs = filteredLogs.filter(log => log.group === group);
        }
    
        // ✅ SITE 필터링
        const site = document.getElementById('site').value;
        if (site) {
            filteredLogs = filteredLogs.filter(log => log.site === site);
        }

        const line = document.getElementById('line').value;
        if (line) {
            filteredLogs = filteredLogs.filter(log => log.line === line);
        }

        
    
        // ✅ EQ TYPE 필터링
        const eqType = document.getElementById('eq-type').value;
        if (eqType) {
            filteredLogs = filteredLogs.filter(log => log.equipment_type === eqType);
        }
    
        // ✅ EQ NAME 필터링
        const eqName = document.getElementById('eq-name').value.trim();
        if (eqName) {
            filteredLogs = filteredLogs.filter(log => log.equipment_name.includes(eqName));
        }
    
        // ✅ TITLE 필터링
        const title = document.getElementById('title').value.trim();
        if (title) {
            filteredLogs = filteredLogs.filter(log => log.task_name.includes(title));
        }
    
        // ✅ WORKER 필터링
        const worker = document.getElementById('worker').value.trim();
        if (worker) {
            filteredLogs = filteredLogs.filter(log => log.task_man.includes(worker));
        }
    
        // ✅ TRANSFER ITEM 필터링
        const transferItem = document.getElementById('transfer-item').value.trim();
        if (transferItem) {
            filteredLogs = filteredLogs.filter(log => log.transfer_item.includes(transferItem));
        }
    
        // ✅ SETUP ITEM 필터링
        const setupItem = document.getElementById('setup-item').value;
        if (setupItem) {
            filteredLogs = filteredLogs.filter(log => log.setup_item === setupItem);
        }

        // ✅ EMS 필터링
        const emsFilter = document.getElementById('ems-filter').value;
        if (emsFilter !== '') {
        const want = Number(emsFilter); // 0 or 1
        filteredLogs = filteredLogs.filter(log => {
            const v = (log.ems === 0 || log.ems === 1) ? log.ems
                    : (log.ems === '0' || log.ems === '1') ? Number(log.ems)
                    : null;
            return v === want;
        });
        }

    
        // ✅ 최신 날짜 순 정렬 (task_date 내림차순) → end_time 기준으로 다시 정렬
        filteredLogs.sort((a, b) => {
            const dateA = new Date(a.task_date).getTime();
            const dateB = new Date(b.task_date).getTime();
            if (dateA !== dateB) {
                return dateB - dateA; // 최신 날짜가 앞으로 오게 함
            }
            return (b.end_time || '').localeCompare(a.end_time || ''); // end_time 기준 정렬
        });
    
        // ✅ 필터링된 데이터 렌더링
        renderFilteredLogs(filteredLogs);
    }
    
    // ✅ 필터링된 데이터 화면 출력
    function renderFilteredLogs(filteredLogs) {
        allLogs = filteredLogs;
        currentPage = 1; // 첫 페이지로 이동
        updatePagination();
        renderPage(currentPage);
    }

    document.getElementById('search-btn').addEventListener('click', () => {
        applyFilters();
    });

        // ✅ Reset 버튼 이벤트 리스너 추가
    document.getElementById('reset-btn').addEventListener('click', () => {
        resetFilters();
    });

    // ✅ 필터 초기화 함수
    function resetFilters() {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.getElementById('group').value = '';
        document.getElementById('site').value = '';
        document.getElementById('line').value = '';
        document.getElementById('eq-type').value = '';
        document.getElementById('eq-name').value = '';
        document.getElementById('title').value = '';
        document.getElementById('worker').value = '';
        document.getElementById('transfer-item').value = '';
        document.getElementById('setup-item').value = '';

        fetchAllWorkLogs(); // ✅ 모든 데이터 다시 불러오기
    }


    // 페이지네이션 업데이트
    function updatePagination() {
        const totalPages = Math.ceil(allLogs.length / logsPerPage);
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    function cleanWorkerNames(taskMan) {
        console.log(`🔍 원본 작업자 목록: ${taskMan}`);
    
        const cleanedNames = taskMan
            ? taskMan.split(/,\s*/) // 쉼표와 공백으로 구분
                .map(name => name.replace(/\(.*?\)/g, '').trim()) // 괄호 속 정보 제거 및 정리
                .filter(name => name.length > 0) // 빈 값 제거
            : [];
    
        console.log(`✅ 정리된 작업자 목록: ${cleanedNames}`);
        return cleanedNames;
    }

    function emsLabel(v) {
    return (v === 1 || v === '1') ? '유상'
        : (v === 0 || v === '0') ? '무상'
        : '—';
    }

    

    // 현재 페이지의 데이터 렌더링
    function renderPage(page) {
        worklogBody.innerHTML = '';
        const startIndex = (page - 1) * logsPerPage;
        const endIndex = startIndex + logsPerPage;
        const logsToShow = allLogs.slice(startIndex, endIndex);
    
        logsToShow.forEach(log => {
            const formattedDate = log.task_date ? log.task_date.split('T')[0] : '';
            const row = document.createElement('tr');

    
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${log.group}</td>
                <td>${log.site}</td>
                <td>${log.task_name}</td>
                <td>${log.task_result}</td>
                <td>${log.task_man}</td>
                <td>${emsLabel(log.ems)}</td>
                <td>${log.task_duration}</td>
            `;
            worklogBody.appendChild(row);
    
            // ✅ 작업 행을 클릭하면 상세 정보 모달 표시
            row.addEventListener('click', async () => {
                currentEditingId = log.id;
                showEditForm(log);
            });
        });
    
        // ✅ 기존의 '수정' 버튼 클릭 이벤트 유지
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation();
                const id = event.target.dataset.id;
                currentEditingId = id;
                try {
                    const response = await fetch(`http://3.37.73.151:3001/api/logs/${id}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const log = await response.json();
                    showEditForm(log);
                } catch (error) {
                    console.error('Error fetching work log:', error);
                }
            });
        });
    }

    // 페이지 변경 이벤트
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

    // ✅ 수정 모달 표시 및 기존 데이터 입력
    function showEditForm(log) {
        if (!log) {
            console.error("❌ log 데이터가 없습니다.");
            return;
        }
    
        console.log("✅ log 데이터:", log); // 로그 데이터 확인
    
        // 🔥 editForm이 올바르게 로드되었는지 확인
        if (!editForm) {
            console.error("❌ editForm을 찾을 수 없습니다.");
            return;
        }

        function formatText(text) {
            return text ? text.replace(/<br\s*\/?>/gi, '\n') : ''; 
        }
    
        // 🔥 모든 요소가 존재하는지 확인
        const requiredFields = [
            'task_name', 'task_date', 'task_man', 'group', 'site', 'line',
            'task_result', 'task_description', 'task_cause',
            'status', 'SOP', 'tsguide', 'equipment_type', 'equipment_name',
            'start_time', 'end_time', 'move_time', 'none_time', 'setup_item',
            'transfer_item', 'warranty', 'work_type', 'work_type2'
        ];
    
        for (const field of requiredFields) {
            if (!editForm.elements[field]) {
                console.error(`❌ 입력 필드를 찾을 수 없습니다: ${field}`);
            }
        }
    
        // 날짜 변환 (YYYY-MM-DD)
        const formattedDate = log.task_date ? new Date(log.task_date).toISOString().split('T')[0] : '';
    
        // 시간 변환 (HH:MM)
        const formattedStartTime = log.start_time ? log.start_time.substring(0, 5) : '';
        const formattedEndTime = log.end_time ? log.end_time.substring(0, 5) : '';
    
        // ✅ 값 설정 (필드가 존재하는 경우에만 설정)
        if (editForm.elements['task_name']) editForm.elements['task_name'].value = log.task_name || '';
        if (editForm.elements['task_date']) editForm.elements['task_date'].value = formattedDate;
        if (editForm.elements['task_man']) editForm.elements['task_man'].value = log.task_man || '';
        if (editForm.elements['group']) editForm.elements['group'].value = log.group || '';
        if (editForm.elements['site']) editForm.elements['site'].value = log.site || '';
        if (editForm.elements['line']) editForm.elements['line'].value = log.line || '';
        if (editForm.elements['task_result']) editForm.elements['task_result'].value = formatText(log.task_result);
        if (editForm.elements['task_description']) {
            editForm.elements['task_description'].value = formatText(log.task_description);
            editForm.elements['task_description'].style.height = "200px"; // 크기 조정
        }
        if (editForm.elements['task_cause']) editForm.elements['task_cause'].value = formatText(log.task_cause);
        if (editForm.elements['status']) editForm.elements['status'].value = formatText(log.status);
        if (editForm.elements['SOP']) editForm.elements['SOP'].value = log.SOP || '';
        if (editForm.elements['tsguide']) editForm.elements['tsguide'].value = log.tsguide || '';
        if (editForm.elements['equipment_type']) editForm.elements['equipment_type'].value = log.equipment_type || '';
        if (editForm.elements['equipment_name']) editForm.elements['equipment_name'].value = log.equipment_name || '';
        if (editForm.elements['start_time']) editForm.elements['start_time'].value = formattedStartTime;
        if (editForm.elements['end_time']) editForm.elements['end_time'].value = formattedEndTime;
        if (editForm.elements['move_time']) editForm.elements['move_time'].value = log.move_time || '0';
        if (editForm.elements['none_time']) editForm.elements['none_time'].value = log.none_time || '0'; //
        if (editForm.elements['setup_item']) editForm.elements['setup_item'].value = log.setup_item || '';
        if (editForm.elements['transfer_item']) editForm.elements['transfer_item'].value = log.transfer_item || '';
        if (editForm.elements['warranty']) editForm.elements['warranty'].value = log.warranty || '';
        if (editForm.elements['ems']) {
        editForm.elements['ems'].value =
            (log.ems === 1 || log.ems === '1') ? '1' :
            (log.ems === 0 || log.ems === '0') ? '0' : '';
        }
        if (editForm.elements['work_type']) editForm.elements['work_type'].value = log.work_type || '';
        if (editForm.elements['work_type2']) editForm.elements['work_type2'].value = log.work_type2 || 'SELECT';
    
        editModal.style.display = 'block';
    }
    

    // 모달 닫기
    closeModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };

    // ✅ 작업 이력 수정 요청 (모달 내 "저장" 버튼)
    saveBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!currentEditingId) return;
    
        const log = allLogs.find(log => log.id === currentEditingId);
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
            task_man: editForm.elements['task_man'].value,
            group: editForm.elements['group'].value,
            site: editForm.elements['site'].value,
            line: editForm.elements['line'].value,
            task_result: editForm.elements['task_result'].value,
            task_description: editForm.elements['task_description'].value,
            task_cause: editForm.elements['task_cause'].value,
            status: editForm.elements['status'].value,
            SOP: editForm.elements['SOP'].value,
            tsguide: editForm.elements['tsguide'].value,
            equipment_type: editForm.elements['equipment_type'].value,
            equipment_name: editForm.elements['equipment_name'].value,
            start_time: editForm.elements['start_time'].value,
            end_time: editForm.elements['end_time'].value,
            move_time: editForm.elements['move_time'].value,
            none_time: editForm.elements['none_time'].value,
            setup_item: editForm.elements['setup_item'].value,
            transfer_item: editForm.elements['transfer_item'].value,
            warranty: editForm.elements['warranty'].value,
            ems: emsVal === '' ? null : Number(emsVal), // 0/1/null
            work_type: editForm.elements['work_type'].value,
            work_type2: editForm.elements['work_type2'].value,

        };
        
        try {
            const response = await fetch(`http://3.37.73.151:3001/api/logs/${currentEditingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLog),
            });
    
            if (!response.ok) {
                throw new Error("수정 실패");
            }
    
            alert("작업 이력이 수정되었습니다.");
            editModal.style.display = 'none';
            fetchAllWorkLogs();
        } catch (error) {
            console.error('작업 이력 수정 중 오류 발생:', error);
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (!currentEditingId) return;
    
        const log = allLogs.find(log => log.id === currentEditingId);
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
    
            if (!response.ok) {
                throw new Error("삭제 실패");
            }
    
            alert("작업 이력이 삭제되었습니다.");
            editModal.style.display = 'none';
            fetchAllWorkLogs();
        } catch (error) {
            console.error('작업 이력 삭제 중 오류 발생:', error);
        }
    });

    await getCurrentUser(); // ✅ 사용자의 정보 불러오기 (async/await 추가)
    fetchAllWorkLogs(); // 최초 데이터 로드
});

// 📌 엑셀 다운로드 버튼 이벤트 리스너 추가
document.getElementById('export-excel-btn').addEventListener('click', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        return;
    }

    try {
        // 사용자 역할 확인
        const userResponse = await fetch('http://3.37.73.151:3001/user-info', {
            headers: { 'x-access-token': token }
        });

        if (!userResponse.ok) {
            throw new Error('사용자 정보를 가져오지 못했습니다.');
        }

        const userData = await userResponse.json();
        const userRole = userData.result.role;

        if (userRole !== 'admin') {
            alert('엑셀 다운로드 권한이 없습니다.');
            return;
        }

        // ✅ 서버에서 작업 이력 가져오기
        const response = await fetch('http://3.37.73.151:3001/logs');
        if (!response.ok) {
            throw new Error('작업 이력을 가져오지 못했습니다.');
        }

        const workLogs = await response.json();

        if (workLogs.length === 0) {
            alert('작업 이력이 없습니다.');
            return;
        }

                // ✅ 시간 형식(HH:MM:SS)을 분 단위로 변환하는 함수
                function convertToMinutes(timeStr) {
                    if (!timeStr) return 0; // 값이 없으면 0 반환
                    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                    return (hours * 60) + minutes; // 시간 * 60 + 분
                }

        // ✅ 엑셀 데이터 변환
        const formattedData = workLogs.map(log => ({
            "id": log.id,
            "task_name": log.task_name,
            "task_date": log.task_date ? log.task_date.split('T')[0] : '',
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
            "time": convertToMinutes(log.task_duration),
            "start time": log.start_time,
            "end time": log.end_time,
            "none": log.none_time,
            "move": log.move_time,
        }));

        // ✅ 엑셀 파일 생성
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "WorkLogs");

        // ✅ 엑셀 다운로드
        XLSX.writeFile(wb, `workLogs_${new Date().toISOString().split('T')[0]}.xlsx`);

        alert("엑셀 파일이 다운로드되었습니다.");

    } catch (error) {
        console.error('엑셀 다운로드 오류:', error);
        alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
});