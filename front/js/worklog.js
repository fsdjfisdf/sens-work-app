document.addEventListener('DOMContentLoaded', async () => {
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  document.getElementById('task_date').value = getTodayDate();

  // WORK TYPE 변경 시 SET UP ITEM 선택 필드 표시/숨기기
  document.getElementById('workType').addEventListener('change', function() {
    const workTypeValue = this.value;
    const additionalOptions = document.getElementById('additionalOptions');
    const maintOptionContainer = document.getElementById('maintOption');
    
    if (workTypeValue === 'SET UP' || workTypeValue === 'RELOCATION') {
      additionalOptions.style.display = 'block';
    } else {
      additionalOptions.style.display = 'none';
    }

    if (workTypeValue === 'MAINT') {
      maintOptionContainer.style.display = 'block';
    } else {
      maintOptionContainer.style.display = 'none';
    }
  });

  const form = document.getElementById('worklogForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const task_name = document.getElementById('task_name').value;
    const status = document.getElementById('status').value;

    // 여러 task_result 값을 줄바꿈으로 결합
    const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(input => input.value).join('\n');
    
    // 여러 task_cause 값을 줄바꿈으로 결합
    const taskCauses = Array.from(document.getElementsByClassName('task-cause-input')).map(input => input.value).join('\n');

    // 여러 task_man 값을 역할과 함께 결합
    let taskMans = Array.from(document.querySelectorAll('.task-man-container')).map((container, index) => {
      const input = container.querySelector('.task-man-input').value;
      const role = container.querySelector('.task-man-select').value;
      return `${input}(${role})`;
    });

    // 중복 제거 로직
    taskMans = [...new Set(taskMans)].join(' ');

    // 여러 task_description 값을 줄바꿈으로 결합
    const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(input => input.value).join('\n');

    let task_date = document.getElementById('task_date').value;
    let start_time = document.getElementById('start_time').value;
    let end_time = document.getElementById('end_time').value;
    const noneTime = document.getElementById('noneTime').value;
    const moveTime = document.getElementById('moveTime').value;

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

    const group = document.getElementById('group').value;
    const site = document.getElementById('site').value;
    const line = document.getElementById('line').value;
    const warranty = document.getElementById('warranty').value;
    const equipment_type = document.getElementById('equipment_type').value;
    const equipment_name = document.getElementById('equipment_name').value;
    const workType = document.getElementById('workType').value;
    const setupItem = (workType === 'SET UP' || workType === 'RELOCATION') ? document.getElementById('additionalWorkType').value : 'SELECT';
    const maint_item = (workType === 'MAINT') ? document.getElementById('maintOptionSelect').value : 'SELECT';

    // 콘솔에 입력 값 출력
    console.log('전송 데이터:', {
      task_name,
      task_result: taskResults,
      task_cause: taskCauses,
      task_man: taskMans,
      task_description: taskDescriptions,
      task_date,
      start_time,
      end_time,
      noneTime,
      moveTime,
      group,
      site,
      warranty,
      line,
      equipment_type,
      equipment_name,
      workType,
      setupItem,
      maint_item,
      status
    });

    try {
      const response = await axios.post(`http://3.37.165.84:3001/log`, {
        task_name,
        task_result: taskResults,
        task_cause: taskCauses,
        task_man: taskMans,
        task_description: taskDescriptions,
        task_date,
        start_time,
        end_time,
        none_time: noneTime,
        move_time: moveTime,
        group,
        site,
        warranty,
        line,
        equipment_type,
        equipment_name,
        workType,
        setupItem,
        maint_item,
        status
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
      console.error(error);
      alert('작업 로그 추가 중 오류가 발생했습니다.');
    }
  });
});
