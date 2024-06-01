document.addEventListener('DOMContentLoaded', async () => {
    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            const logs = response.data;

            const tbody = document.querySelector('#worklog-table tbody');
            tbody.innerHTML = '';
            logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="DATE">${log.task_date}</td>
                    <td data-label="TITLE">${log.task_name}</td>
                    <td data-label="RESULT">${log.task_result}</td>
                    <td data-label="WORKER">${log.task_man}</td>
                    <td data-label="ACTIONS">
                        <button class="view-details" data-id="${log.id}">View</button>
                        <button class="delete-log" data-id="${log.id}">X</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // 상세 보기 버튼 이벤트 리스너 추가
            const detailButtons = document.querySelectorAll('.view-details');
            detailButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    const log = logs.find(log => log.id == id);
                    if (log) {
                        const logDetails = `
                            <p><strong>Task Name:</strong> ${log.task_name}</p>
                            <p><strong>Task Result:</strong> ${log.task_result}</p>
                            <p><strong>Task Cause:</strong> ${log.task_cause}</p>
                            <p><strong>Task Man:</strong> ${log.task_man}</p>
                            <p><strong>Task Description:</strong> ${log.task_description}</p>
                            <p><strong>Task Date:</strong> ${log.task_date}</p>
                            <p><strong>Start Time:</strong> ${log.start_time}</p>
                            <p><strong>End Time:</strong> ${log.end_time}</p>
                            <p><strong>Group:</strong> ${log.group}</p>
                            <p><strong>Site:</strong> ${log.site}</p>
                            <p><strong>Line:</strong> ${log.line}</p>
                            <p><strong>SOP:</strong> ${log.SOP}</p>
                            <p><strong>TS Guide:</strong> ${log.tsguide}</p>
                            <p><strong>Warranty:</strong> ${log.warranty}</p>
                            <p><strong>Equipment Type:</strong> ${log.equipment_type}</p>
                            <p><strong>Equipment Name:</strong> ${log.equipment_name}</p>
                            <p><strong>Work Type:</strong> ${log.work_type}</p>
                            <p><strong>Setup Item:</strong> ${log.setup_item}</p>
                            <p><strong>Maint Item:</strong> ${log.maint_item}</p>
                            <p><strong>Transfer Item:</strong> ${log.transfer_item}</p>
                            <p><strong>Status:</strong> ${log.status}</p>
                        `;
                        document.getElementById('logDetails').innerHTML = logDetails;
                        document.getElementById('logModal').style.display = 'block';
                    }
                });
            });

            // 삭제 버튼 이벤트 리스너 추가
            const deleteButtons = document.querySelectorAll('.delete-log');
            deleteButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if (confirm('정말 삭제하시겠습니까?')) {
                        try {
                            await axios.delete(`http://3.37.165.84:3001/logs/${id}`);
                            loadWorkLogs();
                        } catch (err) {
                            console.error('Error deleting log:', err);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error loading work logs:', error);
        }
    }

    loadWorkLogs();

    // 모달 닫기 버튼 이벤트 리스너 추가
    const modalCloseButton = document.querySelector('.close');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', () => {
            document.getElementById('logModal').style.display = 'none';
        });
    }
});
