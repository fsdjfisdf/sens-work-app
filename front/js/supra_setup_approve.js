document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    try {
        const response = await axios.get('http://3.37.73.151:3001/supra-setup/approvals/pending', {
            headers: { 'x-access-token': token }
        });

        if (response.status === 200) {
            const pendingApprovals = response.data;
            const approvalList = document.getElementById('approvalList');

            // 결재 대기 목록 추가
            pendingApprovals.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = `${item.name}님이 요청 - ${new Date(item.updated_at).toLocaleString()}`;
                listItem.setAttribute('data-name', item.name); // 데이터 속성 추가
            
                const approveButton = document.createElement('button');
                approveButton.textContent = '승인';
                approveButton.classList.add('approve');
                approveButton.addEventListener('click', (event) => {
                    const name = event.target.closest('li').getAttribute('data-name');
                    handleApproval(name, 'Approved');
                });
            
                const rejectButton = document.createElement('button');
                rejectButton.textContent = '반려';
                rejectButton.classList.add('reject');
                rejectButton.addEventListener('click', (event) => {
                    const name = event.target.closest('li').getAttribute('data-name');
                    handleApproval(name, 'Rejected');
                });
            
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
            `http://3.37.73.151:3001/supra-setup/approve`, // name을 본문에 포함
            { name, status },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token,
                },
            }
        );

        if (response.status === 200) {
            alert(`결재가 ${status === 'Approved' ? '승인' : '반려'}되었습니다.`);
            
            // UI 업데이트
            const listItem = document.querySelector(`li[data-name="${name}"]`);
            if (listItem) listItem.remove();
        } else {
            alert('결재 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('결재 처리 중 오류 발생:', error);
        alert('결재 처리 중 오류가 발생했습니다.');
    }
}
