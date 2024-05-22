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
    const task_description = document.getElementById('task_description').value || ''; // 빈 문자열로 기본값 설정
    
    // 날짜와 시간 값 형식화
    let task_date = document.getElementById('task_date').value;
    let start_time = document.getElementById('start_time').value;
    let end_time = document.getElementById('end_time').value;

    // 사파리 대응: 날짜와 시간 값 형식화 확인
    if (!task_date) {
      task_date = getTodayDate();
    }
    if (!start_time) {
      start_time = '00:00:00';
    } else {
      start_time = `${start_time}:00`; // 시간 값에 초 추가
    }
    if (!end_time) {
      end_time = '00:00:00';
    } else {
      end_time = `${end_time}:00`; // 시간 값에 초 추가
    }

    // GROUP과 SITE 값 추가
    const group = document.getElementById('group').value;
    const site = document.getElementById('site').value;

    // 콘솔에 입력 값 출력
    console.log('전송 데이터:', {
      task_name,
      worker,
      task_result,
      task_cause,
      task_description,
      task_date,
      start_time,
      end_time,
      group,
      site
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
        end_time,
        group,
        site
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
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
          <td>${log.group}</td>
          <td>${log.site}</td>
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
