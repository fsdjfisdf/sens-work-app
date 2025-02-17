document.addEventListener('DOMContentLoaded', () => {
    const worklogBody = document.getElementById('worklog-body');
    const editModal = document.getElementById('modal');
    const editForm = document.getElementById('worklog-form');
    const closeModalBtn = document.querySelector('.close');
    const saveBtn = document.querySelector('#save-btn'); // 저장 버튼
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
        });

        // 수정 버튼 이벤트 바인딩
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                currentEditingId = id; // 현재 수정할 ID 저장
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

    // 수정 모달 표시 및 기존 데이터 입력
    function showEditForm(log) {
        editForm.elements['task_name'].value = log.task_name || '';
        editForm.elements['task_date'].value = log.task_date || '';
        editForm.elements['task_man'].value = log.task_man || '';
        editForm.elements['group'].value = log.group || '';
        editForm.elements['site'].value = log.site || '';
        editForm.elements['task_duration'].value = log.task_duration || '';
        editForm.elements['task_result'].value = log.task_result || '';
        editForm.elements['task_description'].value = log.task_description || '';
        editForm.elements['task_cause'].value = log.task_cause || '';
        editForm.elements['status'].value = log.status || '';
        editForm.elements['SOP'].value = log.SOP || '';
        editForm.elements['tsguide'].value = log.tsguide || '';
        editForm.elements['equipment_type'].value = log.equipment_type || '';
        editForm.elements['equipment_name'].value = log.equipment_name || '';
        editForm.elements['start_time'].value = log.start_time || '';
        editForm.elements['end_time'].value = log.end_time || '';
        editForm.elements['move_time'].value = log.move_time || '';
        editForm.elements['none_time'].value = log.none_time || '';

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

    // 작업 이력 수정 요청 (모달 내 "저장" 버튼)
    saveBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!currentEditingId) return;

        const updatedLog = {
            task_name: editForm.elements['task_name'].value,
            task_date: editForm.elements['task_date'].value,
            task_man: editForm.elements['task_man'].value,
            group: editForm.elements['group'].value,
            site: editForm.elements['site'].value,
            task_duration: editForm.elements['task_duration'].value,
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

    fetchAllWorkLogs(); // 최초 데이터 로드
});
