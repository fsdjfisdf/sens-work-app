document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    try {
        const response = await axios.get('http://3.37.73.151:3001/supra-setup/approvals/pending', {
            headers: {
                'x-access-token': token
            }
        });

        if (response.status === 200) {
            const pendingApprovals = response.data;
            const approvalList = document.getElementById('approvalList');

            // 결재 대기 목록 추가
            pendingApprovals.forEach(item => {
                console.log('Pending Approval Item:', item); // 확인용 로그
                const listItem = document.createElement('li');
                listItem.textContent = `${item.name}님이 요청 - ${new Date(item.updated_at).toLocaleString()}`;
            
                const approveButton = document.createElement('button');
                approveButton.textContent = '승인';
                approveButton.classList.add('approve');
                approveButton.addEventListener('click', () => handleApproval(item.name, 'Approved')); // name 사용
            
                const rejectButton = document.createElement('button');
                rejectButton.textContent = '반려';
                rejectButton.classList.add('reject');
                rejectButton.addEventListener('click', () => handleApproval(item.name, 'Rejected')); // name 사용
            
                listItem.appendChild(approveButton);
                listItem.appendChild(rejectButton);
                approvalList.appendChild(listItem);
            });            
        } else {
            console.error('결재 대기 항목을 불러오는 중 오류 발생.');
        }
    } catch (error) {
        console.error('결재 대기 항목을 불러오는 중 오류 발생:', error);
        alert('결재 대기 항목을 불러오는 중 오류가 발생했습니다.');
    }
});

// 결재 승인/반려 처리
async function handleApproval(name, status) {
    const token = localStorage.getItem('x-access-token');

    try {
        const response = await axios.post(
            `http://3.37.73.151:3001/supra-setup/approve/${name}`, // name 사용
            { status },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token,
                },
            }
        );

        if (response.status === 200) {
            alert(`결재가 ${status === 'Approved' ? '승인' : '반려'}되었습니다.`);
            console.log('Updated Data:', response.data.updatedData); // 업데이트된 데이터 확인
            window.location.reload();
            console.log('Approval Name:', name); // name 로그 출력
            console.log('Approval Status:', status); // status 로그 출력
        } else {
            alert('결재 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('결재 처리 중 오류 발생:', error);
        alert('결재 처리 중 오류가 발생했습니다.');
    }
}


// 로그아웃 처리
document.getElementById('sign-out').addEventListener('click', () => {
    localStorage.removeItem('x-access-token');
    alert('로그아웃되었습니다.');
    window.location.replace('./signin.html');
});
