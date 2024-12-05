document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'http://3.37.73.151:3001';
    const token = localStorage.getItem('x-access-token');
    console.log('DOM Loaded'); // DOM 로드 확인
    await loadApprovalRequests(); // 초기 로드

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    let selectedRequestId = null;

    // 결재 요청 데이터 로드
    async function loadApprovalRequests() {
        try {
            console.log('Fetching Approval Requests...');
            const response = await axios.get(`${API_URL}/supra-maintenance/approvals`, {
                headers: { 'x-access-token': token },
            });
    
            if (response.status === 200) {
                console.log('Approval Requests:', response.data); // 데이터 로그
                renderApprovalTable(response.data);
            } else {
                alert('결재 요청 데이터를 가져오는 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('결재 요청 데이터를 가져오는 중 오류 발생:', error);
            alert('결재 요청 데이터를 로드할 수 없습니다. 다시 시도해주세요.');
        }
    }
    

    // 테이블 렌더링
    function renderApprovalTable(requests) {
        const approvalTableBody = document.querySelector('#approval-table tbody');
        approvalTableBody.innerHTML = '';

        requests.forEach((request) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.name}</td>
                <td>${request.approval_status}</td>
                <td>${new Date(request.request_date).toLocaleString()}</td>
                <td>
                    <button class="view-details" data-id="${request.id}">DETAIL</button>
                </td>
            `;
            approvalTableBody.appendChild(row);
        });

        attachViewDetailsHandlers();
    }

    // 상세 보기 핸들러 추가
    function attachViewDetailsHandlers() {
        const buttons = document.querySelectorAll('.view-details');
        console.log('DETAIL Buttons Found:', buttons.length); // 버튼 개수 확인
        buttons.forEach((button) => {
            button.addEventListener('click', async (event) => {
                selectedRequestId = event.target.dataset.id;
                console.log('Selected Request ID:', selectedRequestId); // 선택된 ID 로그
                await loadApprovalDetails(selectedRequestId);
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
                populateComparisonTable(currentData, requestedData);
    
                const modal = document.getElementById('approval-modal');
                if (modal) {
                    modal.classList.add('visible'); // 모달 표시
                    console.log('Modal Displayed:', modal); // 모달 표시 확인
                } else {
                    console.error('Modal element not found');
                }
            } else {
                alert('상세 데이터를 가져오는 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('상세 데이터를 가져오는 중 오류 발생:', error);
            alert('상세 데이터를 로드할 수 없습니다. 다시 시도해주세요.');
        }
    }

    // 모달 닫기
document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('approval-modal').classList.remove('visible');
});

// 기존 Close 버튼도 동일 기능 유지
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('approval-modal').classList.remove('visible');
});

    // 비교 테이블 채우기
    function populateComparisonTable(currentData, requestedData) {
        const currentTable = document.querySelector('#modal-current-data-table tbody');
        const requestedTable = document.querySelector('#modal-requested-data-table tbody');
        console.log('Current Data:', currentData);
        console.log('Requested Data:', requestedData);
    
        currentTable.innerHTML = '';
        requestedTable.innerHTML = '';
    
        for (const [key, value] of Object.entries(currentData)) {
            const currentRow = document.createElement('tr');
            const requestedRow = document.createElement('tr');
    
            currentRow.innerHTML = `<td>${key}</td><td>${value}</td>`;
            requestedRow.innerHTML = `<td>${key}</td><td>${requestedData[key] || 0}</td>`;
    
            if (value !== requestedData[key]) {
                currentRow.style.backgroundColor = 'darkred';
                requestedRow.style.backgroundColor = 'darkgreen';
            }
    
            currentTable.appendChild(currentRow);
            requestedTable.appendChild(requestedRow);
        }
    }
    

// 결재 처리
async function handleApproval(action) {
    if (!selectedRequestId) {
        alert('승인할 요청을 선택하세요.');
        return;
    }

    try {
        const response = await axios.post(
            `${API_URL}/supra-maintenance/approve`,
            { id: selectedRequestId, status: action },
            { headers: { 'x-access-token': token } }
        );

        if (response.status === 200) {
            alert(`${action === 'approved' ? '정상적으로 결재되었습니다.' : '반려되었습니다.'}`);
            
            // 선택된 ID 초기화
            selectedRequestId = null;

            // 결재 요청 리스트 다시 로드
            await loadApprovalRequests();

            // 모달 닫기
            closeApprovalModal(); // 모달 닫기 함수 호출
        } else {
            alert(`결재 ${action === 'approved' ? '승인' : '반려'} 중 오류가 발생했습니다.`);
        }
    } catch (error) {
        console.error(`결재 ${action === 'approved' ? '승인' : '반려'} 중 오류 발생:`, error);
        alert('결재 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
}

// 모달 닫기 함수
function closeApprovalModal() {
    const modal = document.getElementById('approval-modal');
    if (modal) {
        modal.classList.add('hidden'); // hidden 클래스 추가
        console.log('Modal closed successfully'); // 디버깅 로그
    } else {
        console.error('Modal element not found'); // 모달 요소를 찾지 못한 경우 로그
    }
}

// 초기화
await loadApprovalRequests();

// 버튼 이벤트 리스너 연결
document.getElementById('approve-button').addEventListener('click', () => handleApproval('approved'));
document.getElementById('reject-button').addEventListener('click', () => handleApproval('rejected'));
document.getElementById('close-modal').addEventListener('click', closeApprovalModal); // Close 버튼 연결

});
