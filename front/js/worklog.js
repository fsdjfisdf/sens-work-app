document.addEventListener('DOMContentLoaded', async () => {
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  document.getElementById('task_date').value = getTodayDate();

  const form = document.getElementById('worklogForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const task_name = document.getElementById('task_name').value;
    const worker = document.getElementById('worker').value;
    const task_result = document.getElementById('task_result').value;
    const task_cause = document.getElementById('task_cause').value;
    const task_description = document.getElementById('task_description').value || '';
    const task_date = document.getElementById('task_date').value;
    const start_time = document.getElementById('start_time').value || '00:00:00';
    const end_time = document.getElementById('end_time').value || '00:00:00';

    // 콘솔에 입력 값 출력
    console.log('전송 데이터:', {
      task_name,
      worker,
      task_result,
      task_cause,
      task_description,
      task_date,
      start_time,
      end_time
    });

    try {
      const response = await axios.post(`http://3.37.165.84:3001/log`, {
        task_name,
        worker,
        task_result,
        task_cause,
        task_description,
        task_date,
        start_time,
        end_time
      });

      if (response.status === 200) {
        alert('작업 로그가 성공적으로 추가되었습니다.');
        loadWorkLogs();
      } else {
        alert('작업 로그 추가 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('작업 로그 추가 중 오류가 발생했습니다.', error);
      alert('작업 로그 추가 중 오류가 발생했습니다.');
    }
  });

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
          <td>${log.task_description}</td>
          <td>${log.task_date}</td>
          <td>${log.start_time}</td>
          <td>${log.end_time}</td>
          <td>${log.task_duration}</td>
          <td>${log.timestamp}</td>
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
