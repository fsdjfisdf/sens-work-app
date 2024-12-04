document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');
  
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return;
    }
  
    const approvalTableBody = document.querySelector('#approval-table tbody');
    const comparisonSection = document.getElementById('comparison-section');
    const currentDataTable = document.getElementById('current-data-table');
    const requestedDataTable = document.getElementById('requested-data-table');
    let selectedRequestId = null;
    let userNickname = null;
    let userRole = null;
  
    // 로그인한 사용자 정보 가져오기
    async function fetchUserInfo() {
      try {
        const response = await axios.get('http://3.37.73.151:3001/user-info', {
          headers: { 'x-access-token': token }
        });
  
        if (response.status === 200) {
          userNickname = response.data.nickname;
          userRole = response.data.role;
  
          // 권한 확인
          if (
            !['손석현', '한정훈', '강문호'].includes(userNickname) &&
            userRole !== 'admin'
          ) {
            alert('결재 권한이 없습니다.');
            window.location.replace('./unauthorized.html'); // 권한 없음 페이지로 이동
            return;
          }
        } else {
          throw new Error('Failed to fetch user info.');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        alert('사용자 정보를 확인하는 중 오류가 발생했습니다.');
        window.location.replace('./signin.html');
      }
    }
  
    // 결재 요청 리스트 불러오기
    async function loadApprovalRequests() {
      try {
        const response = await axios.get('http://3.37.73.151:3001/supra-maintenance/approvals', {
          headers: { 'x-access-token': token }
        });
  
        if (response.status === 200) {
          const requests = response.data;
          approvalTableBody.innerHTML = ''; // 기존 데이터를 비움
  
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
        } else {
          console.error('Error loading approval requests.');
        }
      } catch (error) {
        console.error('Error loading approval requests:', error);
      }
    }
  
    // 상세 보기 버튼 핸들러 연결
    function attachViewDetailsHandlers() {
      document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', async (event) => {
          const requestId = event.target.dataset.id;
          selectedRequestId = requestId;
  
          try {
            const response = await axios.get(`http://3.37.73.151:3001/supra-maintenance/approvals/${requestId}`, {
              headers: { 'x-access-token': token }
            });
  
            if (response.status === 200) {
              const { currentData, requestedData } = response.data;
  
              populateTable(currentDataTable, currentData);
              populateTable(requestedDataTable, requestedData);
  
              comparisonSection.classList.remove('hidden');
            } else {
              console.error('Error loading details.');
            }
          } catch (error) {
            console.error('Error loading details:', error);
          }
        });
      });
    }
  
    // 테이블 데이터 채우기
    function populateTable(table, data) {
      table.querySelector('tbody').innerHTML = '';
      for (const [key, value] of Object.entries(data)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${key}</td><td>${value}</td>`;
        table.querySelector('tbody').appendChild(row);
      }
    }
  
    // 결재 승인
    document.getElementById('approve-button').addEventListener('click', async () => {
      if (!selectedRequestId) return;
  
      try {
        const response = await axios.post('http://3.37.73.151:3001/supra-maintenance/approve', {
          id: selectedRequestId,
          status: 'approved'
        }, {
          headers: { 'x-access-token': token }
        });
  
        if (response.status === 200) {
          alert('결재가 승인되었습니다.');
          comparisonSection.classList.add('hidden');
          loadApprovalRequests();
        } else {
          console.error('Error approving request.');
        }
      } catch (error) {
        console.error('Error approving request:', error);
      }
    });
  
    // 결재 반려
    document.getElementById('reject-button').addEventListener('click', async () => {
      if (!selectedRequestId) return;
  
      try {
        const response = await axios.post('http://3.37.73.151:3001/supra-maintenance/approve', {
          id: selectedRequestId,
          status: 'rejected'
        }, {
          headers: { 'x-access-token': token }
        });
  
        if (response.status === 200) {
          alert('결재가 반려되었습니다.');
          comparisonSection.classList.add('hidden');
          loadApprovalRequests();
        } else {
          console.error('Error rejecting request.');
        }
      } catch (error) {
        console.error('Error rejecting request:', error);
      }
    });
  
    // 로그아웃
    document.getElementById('logout').addEventListener('click', () => {
      localStorage.removeItem('x-access-token');
      alert('로그아웃 되었습니다.');
      window.location.replace('./signin.html');
    });
  
    // 초기 로딩
    await fetchUserInfo();
    loadApprovalRequests();
  });
  