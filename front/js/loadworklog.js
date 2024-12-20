document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close');
    const worklogBody = document.getElementById('worklog-body');
    const worklogForm = document.getElementById('worklog-form');
    const deleteBtn = document.getElementById('delete-btn');

    // 작업 이력 로드
    async function loadWorkLogs() {
        try {
            const response = await fetch('http://3.37.73.151:3001/logs');
            const worklogs = await response.json();

            worklogBody.innerHTML = ''; // 초기화
            worklogs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${log.task_date}</td>
                    <td>${log.task_name}</td>
                    <td>${log.group}</td>
                    <td>${log.site}</td>
                    <td>${log.task_man}</td>
                    <td>${log.task_duration}</td>
                    <td>${log.task_result}</td>
                    <td><button class="edit-btn" data-id="${log.id}">수정</button></td>
                `;
                worklogBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading work logs:', error);
        }
    }

    // 이벤트 위임으로 수정 버튼 클릭 핸들링
    worklogBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            openModal(e);
        }
    });

    // 모달 열기
    async function openModal(e) {
        const id = e.target.dataset.id;
        console.log(`Selected ID: ${id}`); // 디버깅용 로그
    
        try {
            const response = await fetch(`http://3.37.73.151:3001/work-logs/${log.id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const log = await response.json();
    
            // 모달에 데이터 채우기
            document.getElementById('task_name').value = log.task_name;
            document.getElementById('task_date').value = log.task_date;
            document.getElementById('task_man').value = log.task_man;
            document.getElementById('group').value = log.group;
            document.getElementById('site').value = log.site;
    
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error fetching work log:', error);
            alert('작업 이력을 불러오는 중 문제가 발생했습니다.');
        }
    }
    

    // 모달 닫기
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 초기 작업 로드
    loadWorkLogs();
});
