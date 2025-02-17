document.addEventListener('DOMContentLoaded', () => {
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

    // 모든 작업 이력을 불러옴
    async function fetchAllWorkLogs() {
        try {
            const response = await fetch(`http://3.37.73.151:3001/logs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allLogs = await response.json();
            console.log("전체 작업 이력:", allLogs);

            if (allLogs.length === 0) {
                worklogBody.innerHTML = '<tr><td colspan="8">작업 이력이 없습니다.</td></tr>';
                return;
            }

            updatePagination();
            renderPage(currentPage);
        } catch (error) {
            console.error('Error fetching work logs:', error);
        }
    }

    // 페이지네이션 업데이트
    function updatePagination() {
        const totalPages = Math.ceil(allLogs.length / logsPerPage);
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // 현재 페이지의 데이터 렌더링
    function renderPage(page) {
        worklogBody.innerHTML = '';
        const startIndex = (page - 1) * logsPerPage;
        const endIndex = startIndex + logsPerPage;
        const logsToShow = allLogs.slice(startIndex, endIndex);

        logsToShow.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.task_date}</td>
                <td>${log.task_name}</td>
                <td>${log.group}</td>
                <td>${log.site}</td>
                <td>${log.task_man}</td>
                <td>${log.task_duration}</td>
                <td>${log.task_result}</td>
                <td><button class="edit-btn" data-id="${log.id}">수정</button></td>
            `;
            worklogBody.appendChild(row);

            // ✅ 작업 행을 클릭하면 상세 정보 모달 표시
            row.addEventListener('click', async () => {
                currentEditingId = log.id; // 현재 수정할 ID 저장
                showEditForm(log);
            });
        });

        // ✅ 기존의 '수정' 버튼 클릭 이벤트 (유지)
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation(); // ⚠ 이벤트 버블링 방지
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
    
        // 🔥 모든 요소가 존재하는지 확인
        const requiredFields = [
            'task_name', 'task_date', 'task_man', 'group', 'site', 'line',
            'task_result', 'task_description', 'task_cause',
            'status', 'SOP', 'tsguide', 'equipment_type', 'equipment_name',
            'start_time', 'end_time', 'move_time', 'none_time', 'setup_item',
            'maint_item', 'transfer_item', 'warranty', 'work_type', 'work_type2', 'task maint'
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
        if (editForm.elements['line']) editForm.elements['line'].value = log.site || '';
        if (editForm.elements['task_result']) editForm.elements['task_result'].value = log.task_result || '';
        if (editForm.elements['task_description']) editForm.elements['task_description'].value = log.task_description || '';
        if (editForm.elements['task_cause']) editForm.elements['task_cause'].value = log.task_cause || '';
        if (editForm.elements['status']) editForm.elements['status'].value = log.status || '';
        if (editForm.elements['SOP']) editForm.elements['SOP'].value = log.SOP || '';
        if (editForm.elements['tsguide']) editForm.elements['tsguide'].value = log.tsguide || '';
        if (editForm.elements['equipment_type']) editForm.elements['equipment_type'].value = log.equipment_type || '';
        if (editForm.elements['equipment_name']) editForm.elements['equipment_name'].value = log.equipment_name || '';
        if (editForm.elements['start_time']) editForm.elements['start_time'].value = formattedStartTime;
        if (editForm.elements['end_time']) editForm.elements['end_time'].value = formattedEndTime;
        if (editForm.elements['move_time']) editForm.elements['move_time'].value = log.move_time || '';
        if (editForm.elements['none_time']) editForm.elements['none_time'].value = log.none_time || ''; //
        if (editForm.elements['setup_item']) editForm.elements['setup_item'].value = log.setup_item || '';
        if (editForm.elements['maint_item']) editForm.elements['maint_item'].value = log.maint_item || '';
        if (editForm.elements['transfer_item']) editForm.elements['transfer_item'].value = log.transfer_item || '';
        if (editForm.elements['warranty']) editForm.elements['warranty'].value = log.warranty || '';
        if (editForm.elements['work_type']) editForm.elements['work_type'].value = log.work_type || '';
        if (editForm.elements['work_type2']) editForm.elements['work_type2'].value = log.work_type2 || '';
        if (editForm.elements['task_maint']) editForm.elements['task_maint'].value = log.work_type2 || '';
    
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
            maint_item: editForm.elements['maint_item'].value,
            transfer_item: editForm.elements['transfer_item'].value,
            warranty: editForm.elements['warranty'].value,
            work_type: editForm.elements['work_type'].value,
            work_type2: editForm.elements['work_type2'].value,
            task_maint: editForm.elements['task_maint'].value,

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
            fetchAllWorkLogs(); // 최신 작업 이력 목록 다시 불러오기
        } catch (error) {
            console.error('작업 이력 수정 중 오류 발생:', error);
        }
    });

        deleteBtn.addEventListener('click', async () => {
            if (!currentEditingId) return;

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
                fetchAllWorkLogs(); // 최신 작업 이력 목록 다시 불러오기
            } catch (error) {
                console.error('작업 이력 삭제 중 오류 발생:', error);
            }
        });


    fetchAllWorkLogs(); // 최초 데이터 로드
});
