document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];
    let currentUserNickname = null; // 현재 로그인한 사용자의 닉네임을 저장할 변수
    const userRole = localStorage.getItem('user-role');

    // 사용자 로그인 상태를 확인하는 함수
    function checkLogin() {
        const token = localStorage.getItem('x-access-token');
        if (!token) {
            alert("로그인이 필요합니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
            return false;
        }
        return true;
    }

    // 현재 로그인한 사용자 정보를 받아오는 함수
    async function getCurrentUser() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/user-info', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            currentUserNickname = response.data.result.nickname; // 현재 사용자의 닉네임 저장
        } catch (error) {
            console.error('현재 사용자 정보를 가져오는 중 오류 발생:', error);
        }
    }

    async function loadWorkLogs() {
        try {
            await getCurrentUser(); // 현재 사용자 정보 불러오기
            const response = await axios.get('http://3.37.165.84:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
            displayLogs(logs);
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
        }
    }

    function displayLogs(logs) {
        const worklogCards = document.getElementById('worklog-cards');
        worklogCards.innerHTML = '';

        logs.forEach(log => {
            const card = document.createElement('div');
            card.className = 'worklog-card';
            card.dataset.id = log.id;
            card.innerHTML = `
                <p><strong>Title:</strong> ${log.task_name}</p>
                <p><strong>Date:</strong> ${formatDate(log.task_date)}</p>
                <p><strong>Worker:</strong> ${log.task_man}</p>
                <p><strong>Group:</strong> ${log.group}</p>
                <p><strong>Site:</strong> ${log.site}</p>
                <p><strong>EQ Name:</strong> ${log.equipment_name}</p>
                <p><strong>Transfer Item:</strong> ${log.transfer_item}</p>
                <p><strong>Task Duration:</strong> ${formatDuration(log.task_duration)}</p>
                <div class="actions">
                    ${(log.task_man.includes(currentUserNickname) || userRole === 'admin') ? `<button class="edit-log" data-id="${log.id}">Edit</button>` : ''}
                </div>
            `;
            worklogCards.appendChild(card);
        });

        document.querySelectorAll('.edit-log').forEach(button => {
            button.addEventListener('click', event => {
                const id = button.dataset.id;
                const log = logs.find(log => log.id == id);
                showEditForm(log);
            });
        });
    }

    function showEditForm(log) {
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editWorklogForm');

        editForm.elements['editGroup'].value = log.group;
        editForm.elements['editSite'].value = log.site;
        editForm.elements['editLine'].value = log.line;
        editForm.elements['editEquipmentType'].value = log.equipment_type;
        editForm.elements['editWarranty'].value = log.warranty;
        editForm.elements['editWorkType'].value = log.work_type;
        editForm.elements['editTransferItem'].value = log.transfer_item;
        editForm.elements['editSetupItem'].value = log.setup_item;
        editForm.elements['editEquipmentName'].value = log.equipment_name;
        editForm.elements['editTaskMan'].value = log.task_man;
        editForm.elements['editTaskDate'].value = log.task_date;
        editForm.elements['editStartTime'].value = log.start_time;
        editForm.elements['editEndTime'].value = log.end_time;
        editForm.elements['editTaskName'].value = log.task_name;
        editForm.elements['editStatus'].value = log.status;
        editForm.elements['editTaskDescription'].value = log.task_description;
        editForm.elements['editTaskCause'].value = log.task_cause;
        editForm.elements['editTaskResult'].value = log.task_result;

        editForm.onsubmit = async function(event) {
            event.preventDefault();
            try {
                await axios.put(`http://3.37.165.84:3001/logs/${log.id}`, {
                    group: editForm.elements['editGroup'].value,
                    site: editForm.elements['editSite'].value,
                    line: editForm.elements['editLine'].value,
                    equipment_type: editForm.elements['editEquipmentType'].value,
                    warranty: editForm.elements['editWarranty'].value,
                    work_type: editForm.elements['editWorkType'].value,
                    transfer_item: editForm.elements['editTransferItem'].value,
                    setup_item: editForm.elements['editSetupItem'].value,
                    equipment_name: editForm.elements['editEquipmentName'].value,
                    task_man: editForm.elements['editTaskMan'].value,
                    task_date: editForm.elements['editTaskDate'].value,
                    start_time: editForm.elements['editStartTime'].value,
                    end_time: editForm.elements['editEndTime'].value,
                    task_name: editForm.elements['editTaskName'].value,
                    status: editForm.elements['editStatus'].value,
                    task_description: editForm.elements['editTaskDescription'].value,
                    task_cause: editForm.elements['editTaskCause'].value,
                    task_result: editForm.elements['editTaskResult'].value
                });
                alert('작업 로그가 수정되었습니다.');
                editModal.style.display = 'none';
                loadWorkLogs();
            } catch (error) {
                console.error('작업 로그 수정 중 오류 발생:', error);
                alert('작업 로그 수정 중 오류가 발생했습니다.');
            }
        };

        editModal.style.display = 'block';
    }

    document.querySelectorAll('.close').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            document.getElementById('logModal').style.display = 'none';
            document.getElementById('editModal').style.display = 'none';
        });
    });

    window.onclick = event => {
        if (event.target == document.getElementById('logModal')) {
            document.getElementById('logModal').style.display = 'none';
        }
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
            localStorage.removeItem("user-role");
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }
});
