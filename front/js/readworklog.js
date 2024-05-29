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
            <td>${log.task_name}</td>
            <td>${log.task_result}</td>
            <td>${log.task_cause}</td>
            <td>${log.task_man}</td>
            <td>${log.task_description}</td>
            <td>${log.task_date}</td>
            <td>${log.start_time}</td>
            <td>${log.end_time}</td>
            <td>${log.group}</td>
            <td>${log.site}</td>
            <td>${log.line}</td>
            <td>${log.warranty}</td>
            <td>${log.equipment_type}</td>
            <td>${log.equipment_name}</td>
            <td>${log.work_type}</td>
            <td>${log.setup_item}</td>
            <td>${log.status}</td>
          `;
          tbody.appendChild(tr);
        });
      } catch (error) {
      }
    }
  
    loadWorkLogs();
  });
  