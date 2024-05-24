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

    const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(input => input.value).join('\n');
    const taskCauses = Array.from(document.getElementsByClassName('task-cause-input')).map(input => input.value).join('\n');
    const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(input => input.value).join('\n');

    let task_date = document.getElementById('task_date').value;
    let start_time = document.getElementById('start_time').value;
    let end_time = document.getElementById('end_time').value;
    const noneTime = document.getElementById('noneTime').value;
    const moveTime = document.getElementById('moveTime').value;

    if (!task_date) {
      task_date = getTodayDate();
    }
    if (!start_time) {
      start_time = '00:00:00';
    } else {
      start_time = `${start_time}:00`;
    }
    if (!end_time) {
      end_time = '00:00:00';
    } else {
      end_time = `${end_time}:00`;
    }

    const group = document.getElementById('group').value;
    const site = document.getElementById('site').value;
    const line = document.getElementById('line').value;
    const equipment_type = document.getElementById('equipment_type').value;
    const equipment_name = document.getElementById('equipment_name').value;
    const workType = document.getElementById('workType').value;
    const setupItem = workType === 'SET UP' ? document.getElementById('additionalWorkType').value : 'SELECT';

    console.log('전송 데이터:', {
      task_name,
      worker,
      task_result: taskResults,
      task_cause: taskCauses,
      task_description: taskDescriptions,
      task_date,
      start_time,
      end_time,
      noneTime,
      moveTime,
      group,
      site,
      line,
      equipment_type,
      equipment_name,
      workType,
      setupItem
    });

    try {
      const response = await axios.post('http://3.37.165.84:3001/logs', {
        task_name,
        worker,
        task_result: taskResults,
        task_cause: taskCauses,
        task_description: taskDescriptions,
        task_date,
        start_time,
        end_time,
        none_time: noneTime,
        move_time: MoveTime,
        group,
        site,
        line,
        equipment_type,
        equipment_name,
        workType,
        setupItem
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
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
      const response = await axios.get('http://3.37.165.84:3001/logs');
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
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error('작업 이력 목록을 가져오는 중 오류가 발생했습니다.', error);
      alert('작업 이력 목록을 가져오는 중 오류가 발생했습니다.');
    }
  }

  loadWorkLogs();

  document.getElementById('workType').addEventListener('change', function() {
    const additionalOptions = document.getElementById('additionalOptions');
    if (this.value === 'SET UP') {
      additionalOptions.style.display = 'block';
    } else {
      additionalOptions.style.display = 'none';
      document.getElementById('additionalWorkType').value = 'SELECT';
    }
  });
});
