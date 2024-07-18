document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];
    let currentUserNickname = null; // 현재 로그인한 사용자의 닉네임을 저장할 변수
    let currentWorker = null; // 현재 검색된 작업자의 이름 저장
    const userRole = localStorage.getItem("user-role"); // 현재 사용자의 역할을 저장할 변수

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
            calculateWorkerStats(logs); // 작업자 통계 계산 함수 호출
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDuration(duration) {
        const parts = duration.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (hours < 0 || minutes < 0) {
            return '<span class="error-text">수정 필요</span>';
        }

        let formattedDuration = '';
        if (hours > 0) {
            formattedDuration += `${hours}시간 `;
        }
        if (minutes > 0) {
            formattedDuration += `${minutes}분`;
        }
        return formattedDuration.trim() || '0분';
    }

    function displayLogs(logs) {
        const worklogCards = document.getElementById('worklog-cards');
        worklogCards.innerHTML = '';

        let totalWorktimeMinutes = 0; // 총 작업 시간을 저장할 변수

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
                    ${log.task_man.includes(currentUserNickname) || userRole === 'admin' ? `
                    <button class="delete-log" data-id="${log.id}">X</button>
                    <button class="edit-log" data-id="${log.id}">Edit</button>` : ''}
                </div>
            `;
            worklogCards.appendChild(card);

            // 작업 시간 합산
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            totalWorktimeMinutes += (hours * 60) + minutes;
        });

        // 총 개수 업데이트
        document.getElementById('worklog-count').textContent = `Total Worklogs: ${logs.length}`;

        // 총 작업 시간 업데이트
        const totalWorkHours = Math.floor(totalWorktimeMinutes / 60);
        const totalWorkMinutes = totalWorktimeMinutes % 60;
        const totalWorkTimeText = `${totalWorkHours}시간 ${totalWorkMinutes}분`;
        document.getElementById('total-worktime').textContent = `Total Worktime: ${totalWorkTimeText}`;

        document.querySelectorAll('.worklog-card').forEach(card => {
            card.addEventListener('click', event => {
                if (!event.target.classList.contains('delete-log') && !event.target.classList.contains('edit-log')) {
                    const id = card.dataset.id;
                    const log = logs.find(log => log.id == id);
                    showLogDetails(log);
                }
            });
        });

        document.querySelectorAll('.delete-log').forEach(button => {
            button.addEventListener('click', async event => {
                event.stopPropagation();
                const id = button.dataset.id;
                if (confirm('정말 삭제하시겠습니까?')) {
                    await deleteLog(id);
                    loadWorkLogs();
                }
            });
        });

        document.querySelectorAll('.edit-log').forEach(button => {
            button.addEventListener('click', event => {
                event.stopPropagation();
                const id = button.dataset.id;
                const log = logs.find(log => log.id == id);
                showEditForm(log);
            });
        });
    }

    function showLogDetails(log) {
        const logModal = document.getElementById('logModal');
        const logDetails = document.getElementById('logDetails');
        logDetails.innerHTML = `
            <p><strong>Date :</strong> ${formatDate(log.task_date)}</p>
            <p><strong>Group :</strong> ${log.group}</p>
            <p><strong>Site :</strong> ${log.site}</p>
            <p><strong>Line :</strong> ${log.line}</p>
            <p><strong>Warranty :</strong> ${log.warranty}</p>
            <p><strong>EQ Type :</strong> ${log.equipment_type}</p>
            <p><strong>EQ Name :</strong> ${log.equipment_name}</p>
            <p><strong>Title :</strong> ${log.task_name}</p>
            <p><strong>Status :</strong> ${log.status}</p>
            <p><strong>Action :</strong> ${log.task_description}</p>
            <p><strong>Cause :</strong> ${log.task_cause}</p>
            <p><strong>Result :</strong> ${log.task_result}</p>
            <p><strong>Worker :</strong> ${log.task_man}</p>
            <p><strong>SOP :</strong> ${log.SOP}</p>
            <p><strong>TS Guide :</strong> ${log.tsguide}</p>
            <p><strong>Work Type :</strong> ${log.work_type}</p>
            <p><strong>Setup Item :</strong> ${log.setup_item}</p>
            <p><strong>Maint Item :</strong> ${log.maint_item}</p>
            <p><strong>Transfer Item :</strong> ${log.transfer_item}</p>
            <p><strong>Task Duration :</strong> ${formatDuration(log.task_duration)}</p>
        `;
        logModal.style.display = 'block';
    }

    // 팝업 창 닫기 기능 추가
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('logModal').style.display = 'none';
    });

    window.onclick = event => {
        if (event.target == document.getElementById('logModal')) {
            document.getElementById('logModal').style.display = 'none';
        }
    };

    async function deleteLog(id) {
        try {
            await axios.delete(`http://3.37.165.84:3001/logs/${id}`);
        } catch (error) {
            console.error('작업 로그 삭제 중 오류 발생:', error);
        }
    }

    function calculateWorkerStats(logs) {
        const workerStats = {};
        const workerTaskCount = {};

        logs.forEach(log => {
            const workers = log.task_man.split(',').map(worker => worker.split('(')[0].trim());
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const totalMinutes = (hours * 60) + minutes;

            workers.forEach(worker => {
                if (!workerStats[worker]) {
                    workerStats[worker] = 0;
                    workerTaskCount[worker] = 0;
                }
                workerStats[worker] += totalMinutes;
                workerTaskCount[worker] += 1;
            });
        });

        const sortedWorkerStats = Object.entries(workerStats).sort((a, b) => b[1] - a[1]);
        const sortedWorkerTaskCount = Object.entries(workerTaskCount).sort((a, b) => b[1] - a[1]);

        displayWorkerStats(sortedWorkerStats, 'top5-worktime-stats', 'Worktime');
        displayWorkerStats(sortedWorkerTaskCount, 'top5-taskcount-stats', 'Task Count');
    }

    function displayWorkerStats(sortedWorkerStats, containerId, title) {
        const workerStatsContainer = document.getElementById(containerId);
        workerStatsContainer.className = 'worker-stats';
        workerStatsContainer.innerHTML = `<h2>Top ${currentWorker ? 1 : sortedWorkerStats.length} Eng'r by ${title}</h2>`;

        sortedWorkerStats.forEach(([worker, value], index) => {
            const workerStat = document.createElement('div');
            workerStat.className = 'worker-stat';
            if (index === 0 && !currentWorker) {
                workerStat.classList.add('top-1');
            }
            if (title === 'Worktime') {
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                workerStat.innerHTML = `
                    <p class="name" data-worker="${worker}">${index + 1}위 ${worker}</p>
                    <p>${hours}시간 ${minutes}분</p>
                `;
            } else {
                workerStat.innerHTML = `
                    <p class="name" data-worker="${worker}">${index + 1}위 ${worker}</p>
                    <p>${value} 개</p>
                `;
            }
            workerStatsContainer.appendChild(workerStat);
        });

        // 작업자 이름 클릭 이벤트 추가
        document.querySelectorAll('.worker-stat .name').forEach(nameElement => {
            nameElement.addEventListener('click', event => {
                const workerName = event.target.dataset.worker;
                window.location.href = `worker-details.html?worker=${workerName}`;
            });
        });
    }

    document.getElementById('searchButton').addEventListener('click', () => {
        const searchWorker = document.getElementById('searchWorker').value.toLowerCase();
        const searchStartDate = document.getElementById('searchStartDate').value;
        const searchEndDate = document.getElementById('searchEndDate').value;
        const searchEqName = document.getElementById('searchEqName').value.toLowerCase();
        const searchGroup = document.getElementById('searchGroup').value.toLowerCase();
        const searchSite = document.getElementById('searchSite').value.toLowerCase();
        const searchTitle = document.getElementById('searchTitle').value.toLowerCase();

        const filteredLogs = logs.filter(log => {
            const logDate = formatDate(log.task_date);
            return (
                (searchWorker === '' || log.task_man.toLowerCase().includes(searchWorker)) &&
                (searchStartDate === '' || logDate >= searchStartDate) &&
                (searchEndDate === '' || logDate <= searchEndDate) &&
                (searchEqName === '' || log.equipment_name.toLowerCase().includes(searchEqName)) &&
                (searchTitle === '' || log.task_name.toLowerCase().includes(searchTitle)) &&
                (searchGroup === '' || log.group.toLowerCase().includes(searchGroup)) &&
                (searchSite === '' || log.site.toLowerCase().includes(searchSite))
            );
        });

        currentWorker = searchWorker ? searchWorker : null;
        displayLogs(filteredLogs);
        calculateWorkerStats(filteredLogs); // 필터링된 로그로 작업자 통계 계산 함수 호출
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchWorker').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        document.getElementById('searchEqName').value = '';
        document.getElementById('searchTitle').value = '';
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        currentWorker = null;
        displayLogs(logs);
        calculateWorkerStats(logs); // 전체 로그로 작업자 통계 계산 함수 호출
    });

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
});

function showEditForm(log) {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editWorklogForm');

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
            group: editForm.elements['group'].value || null,
            site: editForm.elements['site'].value || null,
            line: editForm.elements['line'].value || null,
            equipment_type: editForm.elements['equipment_type'].value || null,
            warranty: editForm.elements['warranty'].value || null,
            work_type: editForm.elements['work_type'].value || null,
            transfer_item: editForm.elements['transfer_item'].value || null,
            setup_item: editForm.elements['setup_item'].value || null,
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
            console.log(`Updating log with ID: ${log.id}`);
            console.log('Updated log data:', updatedLog);
            const response = await axios.put(`http://3.37.165.84:3001/work-logs/${log.id}`, updatedLog);
            console.log('Response from server:', response);
            editModal.style.display = 'none';
            loadWorkLogs(); // 작업 로그 다시 불러오기
        } catch (error) {
            console.error('작업 로그 수정 중 오류 발생:', error);
            console.error('Error request:', error.request);
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

