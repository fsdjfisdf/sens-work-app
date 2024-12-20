document.addEventListener('DOMContentLoaded', () => {
    const worklogBody = document.getElementById('worklog-body');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editWorklogForm');

    // 작업 이력 로드
    async function loadWorkLogs() {
        try {
            const response = await fetch('http://3.37.73.151:3001/logs'); // 작업 이력 조회 경로
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const worklogs = await response.json();

            worklogBody.innerHTML = ''; // 초기화
            worklogs.forEach(log => {
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

            // 수정 버튼 클릭 이벤트 바인딩
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const id = event.target.dataset.id;
                    try {
                        const response = await fetch(`http://3.37.73.151:3001/work-logs/${id}`); // 작업 상세 조회 경로
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const log = await response.json();
                        showEditForm(log);
                    } catch (error) {
                        console.error('Error fetching work log:', error);
                        alert('작업 이력을 불러오는 중 문제가 발생했습니다.');
                    }
                });
            });
        } catch (error) {
            console.error('Error loading work logs:', error);
        }
    }

    // 수정 모달 표시
    function showEditForm(log) {
        editForm.elements['group'].value = log.group || '';
        editForm.elements['site'].value = log.site || '';
        editForm.elements['line'].value = log.line || '';
        editForm.elements['equipment_type'].value = log.equipment_type || '';
        editForm.elements['warranty'].value = log.warranty || '';
        editForm.elements['equipment_name'].value = log.equipment_name || '';
        editForm.elements['task_man'].value = log.task_man || '';
        editForm.elements['task_date'].value = log.task_date || '';
        editForm.elements['start_time'].value = log.start_time || '';
        editForm.elements['end_time'].value = log.end_time || '';
        editForm.elements['task_name'].value = log.task_name || '';
        editForm.elements['status'].value = log.status || '';
        editForm.elements['task_description'].value = log.task_description || '';
        editForm.elements['task_cause'].value = log.task_cause || '';
        editForm.elements['task_result'].value = log.task_result || '';

        editModal.style.display = 'block';

        // 폼 제출 처리
        editForm.onsubmit = async (event) => {
            event.preventDefault();

            const updatedLog = {
                group: editForm.elements['group'].value || null,
                site: editForm.elements['site'].value || null,
                line: editForm.elements['line'].value || null,
                equipment_type: editForm.elements['equipment_type'].value || null,
                warranty: editForm.elements['warranty'].value || null,
                equipment_name: editForm.elements['equipment_name'].value || null,
                task_man: editForm.elements['task_man'].value || null,
                task_date: editForm.elements['task_date'].value || null,
                start_time: editForm.elements['start_time'].value || null,
                end_time: editForm.elements['end_time'].value || null,
                task_name: editForm.elements['task_name'].value || null,
                status: editForm.elements['status'].value || null,
                task_description: editForm.elements['task_description'].value || null,
                task_cause: editForm.elements['task_cause'].value || null,
                task_result: editForm.elements['task_result'].value || null,
            };

            try {
                const response = await fetch(`http://3.37.73.151:3001/work-logs/${log.id}`, { // 작업 수정 경로
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedLog),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                alert('작업 이력이 수정되었습니다.');
                editModal.style.display = 'none';
                loadWorkLogs(); // 작업 로그 다시 불러오기
            } catch (error) {
                console.error('작업 로그 수정 중 오류 발생:', error);
            }
        };
    }

    // 모달 닫기
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    });

    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };

    // 초기 작업 로드
    loadWorkLogs();
});
