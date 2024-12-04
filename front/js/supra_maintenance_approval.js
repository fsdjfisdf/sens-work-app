document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://3.37.73.151:3001'; // API 기본 URL
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        redirectToSignin('로그인이 필요합니다.');
        return;
    }

    const userRole = localStorage.getItem('user-role');
    console.log("User role:", userRole); // role 정보를 콘솔에 출력
    if (userRole !== 'admin') {
        alert("접근 권한이 없습니다.");
        window.location.replace("./index.html");
        return;
    }

    // 결재 요청 데이터 로드
    async function loadApprovalRequests() {
        try {
            const response = await axios.get(`${API_URL}/supra-maintenance/approvals`, {
                headers: { 'x-access-token': token },
            });

            if (response.status === 200) {
                renderApprovalTable(response.data);
            } else {
                throw new Error('결재 요청 데이터를 가져오는 중 오류 발생.');
            }
        } catch (error) {
            console.error('결재 요청 데이터를 가져오는 중 오류 발생:', error);
        }
    }

    // 테이블 렌더링
    function renderApprovalTable(requests) {
        const approvalTableBody = document.querySelector('#approval-table tbody');
        approvalTableBody.innerHTML = '';

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.name}</td>
                <td>${request.approval_status}</td>
                <td>${new Date(request.request_date).toLocaleString()}</td>
                <td>
                    <button class="view-details" data-id="${request.id}">상세 보기</button>
                </td>
            `;
            approvalTableBody.appendChild(row);
        });

        attachViewDetailsHandlers();
    }

    // 상세 보기 핸들러 추가
    function attachViewDetailsHandlers() {
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', async (event) => {
                const requestId = event.target.dataset.id;
                await loadApprovalDetails(requestId);
            });
        });
    }

    // 상세 데이터 로드
    async function loadApprovalDetails(requestId) {
        try {
            const response = await axios.get(`${API_URL}/supra-maintenance/approvals/${requestId}`, {
                headers: { 'x-access-token': token },
            });

            if (response.status === 200) {
                const { currentData, requestedData } = response.data;
                populateTable('#current-data-table', currentData);
                populateTable('#requested-data-table', requestedData);
                document.getElementById('comparison-section').classList.remove('hidden');
            } else {
                throw new Error('상세 데이터를 가져오는 중 오류 발생.');
            }
        } catch (error) {
            console.error('상세 데이터를 가져오는 중 오류 발생:', error);
        }
    }

    // 테이블 채우기
    function populateTable(selector, data) {
        const table = document.querySelector(selector);
        table.querySelector('tbody').innerHTML = '';
        for (const [key, value] of Object.entries(data)) {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${key}</td><td>${value}</td>`;
            table.querySelector('tbody').appendChild(row);
        }
    }

    // 결재 처리
    async function handleApproval(action) {
        if (!selectedRequestId) return;

        try {
            const response = await axios.post(`${API_URL}/supra-maintenance/approve`, {
                id: selectedRequestId,
                status: action,
            }, {
                headers: { 'x-access-token': token },
            });

            if (response.status === 200) {
                alert(`결재가 ${action === 'approved' ? '승인' : '반려'}되었습니다.`);
                document.getElementById('comparison-section').classList.add('hidden');
                await loadApprovalRequests();
            } else {
                throw new Error(`결재 ${action === 'approved' ? '승인' : '반려'} 중 오류 발생.`);
            }
        } catch (error) {
            console.error(`결재 ${action === 'approved' ? '승인' : '반려'} 중 오류 발생:`, error);
        }
    }

    // 로그아웃
    function logout() {
        localStorage.removeItem('x-access-token');
        alert('로그아웃 되었습니다.');
        window.location.replace('./signin.html');
    }

    // 이벤트 리스너 등록
    document.getElementById('approve-button').addEventListener('click', () => handleApproval('approved'));
    document.getElementById('reject-button').addEventListener('click', () => handleApproval('rejected'));
    document.getElementById('logout').addEventListener('click', logout);

    // 초기화
    await loadApprovalRequests();
});
