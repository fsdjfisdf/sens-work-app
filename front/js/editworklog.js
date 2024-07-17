document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editWorklogForm');

    window.showEditForm = function (log) {
        // 기존 로그 데이터를 폼에 채우기
        editForm.elements['group'].value = log.group;
        editForm.elements['site'].value = log.site;
        editForm.elements['line'].value = log.line;
        editForm.elements['equipment_type'].value = log.equipment_type;
        editForm.elements['warranty'].value = log.warranty;
        editForm.elements['work_type'].value = log.work_type;
        editForm.elements['transfer_item'].value = log.transfer_item;
        editForm.elements['setup_item'].value = log.setup_item;
        editForm.elements['equipment_name'].value = log.equipment_name;
        editForm.elements['task_man'].value = log.task_man;
        editForm.elements['task_date'].value = log.task_date;
        editForm.elements['start_time'].value = log.start_time;
        editForm.elements['end_time'].value = log.end_time;
        editForm.elements['task_name'].value = log.task_name;
        editForm.elements['status'].value = log.status;
        editForm.elements['task_description'].value = log.task_description;
        editForm.elements['task_cause'].value = log.task_cause;
        editForm.elements['task_result'].value = log.task_result;

        editModal.style.display = 'block';

        editForm.onsubmit = async (event) => {
            event.preventDefault();

            const updatedLog = {
                group: editForm.elements['group'].value,
                site: editForm.elements['site'].value,
                line: editForm.elements['line'].value,
                equipment_type: editForm.elements['equipment_type'].value,
                warranty: editForm.elements['warranty'].value,
                work_type: editForm.elements['work_type'].value,
                transfer_item: editForm.elements['transfer_item'].value,
                setup_item: editForm.elements['setup_item'].value,
                equipment_name: editForm.elements['equipment_name'].value,
                task_man: editForm.elements['task_man'].value,
                task_date: editForm.elements['task_date'].value,
                start_time: editForm.elements['start_time'].value,
                end_time: editForm.elements['end_time'].value,
                task_name: editForm.elements['task_name'].value,
                status: editForm.elements['status'].value,
                task_description: editForm.elements['task_description'].value,
                task_cause: editForm.elements['task_cause'].value,
                task_result: editForm.elements['task_result'].value,
            };

            try {
                await axios.put(`http://3.37.165.84:3001/logs/${log.id}`, updatedLog);
                editModal.style.display = 'none';
                loadWorkLogs(); // 작업 로그 다시 불러오기
            } catch (error) {
                console.error('작업 로그 수정 중 오류 발생:', error);
            }
        };
    };

    // 팝업 창 닫기 기능 추가
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    });

    window.onclick = event => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };

    async function showEditForm(log) {
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editWorklogForm');
    
        // 기존 로그 데이터를 폼에 채우기
        editForm.elements['group'].value = log.group || '';
        editForm.elements['site'].value = log.site || '';
        editForm.elements['line'].value = log.line || '';
        editForm.elements['equipment_type'].value = log.equipment_type || '';
        editForm.elements['warranty'].value = log.warranty || '';
        editForm.elements['work_type'].value = log.work_type || '';
        editForm.elements['transfer_item'].value = log.transfer_item || '';
        editForm.elements['setup_item'].value = log.setup_item || '';
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
    
        editForm.onsubmit = async (event) => {
            event.preventDefault();
    
            const updatedLog = {
                group: editForm.elements['group'].value,
                site: editForm.elements['site'].value,
                line: editForm.elements['line'].value,
                equipment_type: editForm.elements['equipment_type'].value,
                warranty: editForm.elements['warranty'].value,
                work_type: editForm.elements['work_type'].value,
                transfer_item: editForm.elements['transfer_item'].value,
                setup_item: editForm.elements['setup_item'].value,
                equipment_name: editForm.elements['equipment_name'].value,
                task_man: editForm.elements['task_man'].value,
                task_date: editForm.elements['task_date'].value,
                start_time: editForm.elements['start_time'].value,
                end_time: editForm.elements['end_time'].value,
                task_name: editForm.elements['task_name'].value,
                status: editForm.elements['status'].value,
                task_description: editForm.elements['task_description'].value,
                task_cause: editForm.elements['task_cause'].value,
                task_result: editForm.elements['task_result'].value,
            };
    
            try {
                await axios.put(`http://3.37.165.84:3001/logs/${log.id}`, updatedLog);
                editModal.style.display = 'none';
                loadWorkLogs(); // 작업 로그 다시 불러오기
            } catch (error) {
                console.error('작업 로그 수정 중 오류 발생:', error);
            }
        };
    }
    
    // 팝업 창 닫기 기능 추가
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.getElementById('editModal').style.display = 'none';
        });
    });
    
    window.onclick = event => {
        if (event.target == document.getElementById('editModal')) {
            document.getElementById('editModal').style.display = 'none';
        }
    };
    
    // 로그인 상태를 확인하고, 로그인되어 있지 않으면 로그인 페이지로 리디렉션
    if (checkLogin()) {
        loadWorkLogs();
    }
    
    const signOutButton = document.querySelector("#sign-out");
    
    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token"); // JWT 토큰 삭제
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }
    
    