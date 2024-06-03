document.addEventListener('DOMContentLoaded', async () => {
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  document.getElementById('task_date').value = getTodayDate();

  document.getElementById('workType').addEventListener('change', function() {
    const workTypeValue = this.value;
    const additionalOptions = document.getElementById('additionalOptions');
    const maintOptions = document.getElementById('maintOptions');
    const transferOptions = document.getElementById('transferOptions');
    if (workTypeValue === 'SET UP' || workTypeValue === 'RELOCATION') {
      additionalOptions.style.display = 'block';
      maintOptions.style.display = 'none';
      transferOptions.style.display = 'none';
    } else if (workTypeValue === 'MAINT') {
      maintOptions.style.display = 'none';
      transferOptions.style.display = 'block';
      additionalOptions.style.display = 'none';
    } else {
      additionalOptions.style.display = 'none';
      maintOptions.style.display = 'none';
      transferOptions.style.display = 'none';
    }
  });

  const form = document.getElementById('worklogForm');
  form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const task_name = document.getElementById('task_name').value;
      const status = document.getElementById('status').value;

      const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(input => input.value).join('<br>');
      const taskCauses = Array.from(document.getElementsByClassName('task-cause-input')).map(input => input.value).join('<br>');
      let taskMans = Array.from(document.querySelectorAll('.task-man-container')).map((container, index) => {
          const input = container.querySelector('.task-man-input').value;
          const role = container.querySelector('.task-man-select').value;
          return `${input}(${role})`;
      });
      taskMans = [...new Set(taskMans)].join(', ');
      const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(input => input.value).join('<br>');

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
      const SOP = document.getElementById('SOP').value;
      const tsguide = document.getElementById('tsguide').value;
      const warranty = document.getElementById('warranty').value;
      const equipment_type = document.getElementById('equipment_type').value;
      const equipment_name = document.getElementById('equipment_name').value;
      const workType = document.getElementById('workType').value;
      const setupItem = (workType === 'SET UP' || workType === 'RELOCATION') ? document.getElementById('additionalWorkType').value : 'SELECT';
      const maintItem = workType === 'MAINT' ? document.getElementById('maintOptionSelect').value : 'SELECT';
      const transferItem = workType === 'MAINT' ? document.getElementById('transferOptionSelect').value : 'SELECT';
      const task_maint = maintItem; // 새로 추가된 필드

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
        SOP,
        tsguide,
        warranty,
        line,
        equipment_type,
        equipment_name,
        workType,
        setupItem,
        maintItem,
        transferItem, // 추가된 필드
        task_maint, // 새로 추가된 필드
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
          SOP,
          tsguide,
          warranty,
          line,
          equipment_type,
          equipment_name,
          workType,
          setupItem,
          maintItem,
          transferItem, // 추가된 필드
          task_maint, // 새로 추가된 필드
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

        const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token"); // JWT 토큰 삭제
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }
});
