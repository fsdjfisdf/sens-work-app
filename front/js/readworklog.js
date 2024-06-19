document.addEventListener('DOMContentLoaded', async () => {
    let logs = [];
    let currentUserNickname = null; // 현재 로그인한 사용자의 닉네임을 저장할 변수

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
                <p><strong>제목:</strong> ${log.task_name}</p>
                <p><strong>날짜:</strong> ${formatDate(log.task_date)}</p>
                <p><strong>작업자:</strong> ${log.task_man}</p>
                <p><strong>그룹:</strong> ${log.group}</p>
                <p><strong>현장:</strong> ${log.site}</p>
                <p><strong>EQ 이름:</strong> ${log.equipment_name}</p>
                <p><strong>전달 항목:</strong> ${log.transfer_item}</p>
                <p><strong>작업 시간:</strong> ${formatDuration(log.task_duration)}</p>
                <div class="actions">
                    ${log.task_man.includes(currentUserNickname) ? `<button class="delete-log" data-id="${log.id}">삭제</button>` : ''}
                </div>
            `;
            worklogCards.appendChild(card);
        });

        // 총 개수 업데이트
        document.getElementById('worklog-count').textContent = `총 작업 로그: ${logs.length}`;

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
            <p><strong>날짜 :</strong> ${formatDate(log.task_date)}</p>
            <p><strong>그룹 :</strong> ${log.group}</p>
            <p><strong>현장 :</strong> ${log.site}</p>
            <p><strong>라인 :</strong> ${log.line}</p>
            <p><strong>보증 :</strong> ${log.warranty}</p>
            <p><strong>EQ 타입 :</strong> ${log.equipment_type}</p>
            <p><strong>EQ 이름 :</strong> ${log.equipment_name}</p>
            <p><strong>제목 :</strong> ${log.task_name}</p>
            <p><strong>상태 :</strong> ${log.status}</p>
            <p><strong>작업 설명 :</strong> ${log.task_description}</p>
            <p><strong>원인 :</strong> ${log.task_cause}</p>
            <p><strong>결과 :</strong> ${log.task_result}</p>
            <p><strong>작업자 :</strong> ${log.task_man}</p>
            <p><strong>SOP :</strong> ${log.SOP}</p>
            <p><strong>TS 가이드 :</strong> ${log.tsguide}</p>
            <p><strong>작업 타입 :</strong> ${log.work_type}</p>
            <p><strong>설치 항목 :</strong> ${log.setup_item}</p>
            <p><strong>유지 항목 :</strong> ${log.maint_item}</p>
            <p><strong>전달 항목 :</strong> ${log.transfer_item}</p>
            <p><strong>작업 시간 :</strong> ${formatDuration(log.task_duration)}</p>
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
