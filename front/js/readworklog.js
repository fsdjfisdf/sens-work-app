document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];
    let currentUserNickname = null; // 현재 로그인한 사용자의 nickname을 저장할 변수

    // 현재 로그인한 사용자 정보를 받아오는 함수
    async function getCurrentUser() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/user-info', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            currentUserNickname = response.data.result.nickname; // 현재 사용자의 nickname 저장
        } catch (error) {
            console.error('Error getting current user info:', error);
        }
    }

    async function loadWorkLogs() {
        try {
            await getCurrentUser(); // 현재 사용자 정보 불러오기
            const response = await axios.get('http://3.37.165.84:3001/logs');
            logs = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
            displayLogs(logs);
        } catch (error) {
            console.error('Error loading work logs:', error);
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
                    ${log.task_man.includes(currentUserNickname) ? `<button class="delete-log" data-id="${log.id}">X</button>` : ''}
                </div>
            `;
            worklogCards.appendChild(card);
        });

        // 총 개수 업데이트
        document.getElementById('worklog-count').textContent = `Total Worklogs: ${logs.length}`;

        document.querySelectorAll('.worklog-card').forEach(card => {
            card.addEventListener('click', event => {
                if (!event.target.classList.contains('delete-log')) {
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
            console.error('Error deleting log:', error);
        }
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

        displayLogs(filteredLogs);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchWorker').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        document.getElementById('searchEqName').value = '';
        document.getElementById('searchTitle').value = '';
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        displayLogs(logs);
    });

    loadWorkLogs();

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token"); // JWT 토큰 삭제
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }
});
