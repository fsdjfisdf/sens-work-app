// readworklog.js
document.addEventListener('DOMContentLoaded', async () => {
    async function loadWorkLogs() {
      try {
        const response = await axios.get(`http://3.37.165.84:3001/logs`);
        const logs = response.data;
  
        const tbody = document.querySelector('#worklog-table tbody');
        tbody.innerHTML = '';
        logs.forEach(log => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${log.id}</td>
            <td>${log.task_name}</td>
            <td>${log.worker}</td>
            <td>${log.task_result}</td>
            <td>${log.task_cause}</td>
            <td>${log.task_man}</td>
            <td>${log.task_description}</td>
            <td>${log.task_date}</td>
            <td>${log.start_time}</td>
            <td>${log.end_time}</td>
            <td>${log.none_time}</td>
            <td>${log.move_time}</td>
            <td>${log.group}</td>
            <td>${log.site}</td>
            <td>${log.line}</td>
            <td>${log.equipment_type}</td>
            <td>${log.equipment_name}</td>
            <td>${log.work_type}</td>
            <td>${log.setup_item}</td>
            <td>${log.timestamp}</td>
            <td>${log.status}</td>
          `;
          tbody.appendChild(tr);
        });
      } catch (error) {
        console.error('작업 이력 목록을 가져오는 중 오류가 발생했습니다.', error);
        alert('작업 이력 목록을 가져오는 중 오류가 발생했습니다.');
      }
    }
  
    loadWorkLogs();
  });
  