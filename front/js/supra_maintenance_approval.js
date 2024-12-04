document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');
  
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return;
    }
  
    // 사용자 권한 확인
    try {
      const userResponse = await axios.get('http://3.37.73.151:3001/user-info', {
        headers: { 'x-access-token': token },
      });
  
      // 응답 데이터 확인
      console.log('API Response:', userResponse.data);
  
      if (userResponse.status === 200 && userResponse.data.isSuccess) {
        const { nickname, role } = userResponse.data.result;
  
        if (!nickname || !role) {
          console.error('닉네임 또는 역할 정보가 누락되었습니다.', userResponse.data);
          alert('사용자 정보를 확인할 수 없습니다.');
          window.location.replace('./signin.html');
          return;
        }
  
        console.log('Logged-in User:', { nickname, role });
  
        // 특정 nickname 또는 admin role만 접근 가능
        const authorizedNicknames = ['손석현', '강문호', '한정훈'];
        if (!authorizedNicknames.includes(nickname) && role !== 'admin') {
          alert('접근 권한이 없습니다.');
          window.location.replace('./index.html');
          return;
        }
      } else {
        console.error('사용자 정보를 가져오는 중 오류 발생.');
        alert('사용자 정보를 확인할 수 없습니다.');
        window.location.replace('./signin.html');
        return;
      }
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      alert('사용자 정보를 확인할 수 없습니다.');
      window.location.replace('./signin.html');
      return;
    }

    // 결재 요청 리스트 불러오기 및 로직 실행
    const approvalTableBody = document.querySelector('#approval-table tbody');
    const comparisonSection = document.getElementById('comparison-section');
    const currentDataTable = document.getElementById('current-data-table');
    const requestedDataTable = document.getElementById('requested-data-table');
    let selectedRequestId = null;

    async function loadApprovalRequests() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/supra-maintenance/approvals', {
                headers: { 'x-access-token': token }
            });

            if (response.status === 200) {
                const requests = response.data;
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
            } else {
                console.error('결재 요청 데이터를 불러오는 중 오류 발생.');
            }
        } catch (error) {
            console.error('결재 요청 데이터를 불러오는 중 오류 발생:', error);
        }
    }

    loadApprovalRequests();
});
