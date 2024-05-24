document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('print-inform').addEventListener('click', () => {
      const taskName = document.getElementById('task_name').value;
      const worker = document.getElementById('worker').value;
      const status = document.getElementById('status').value;
      
      // 여러 task_result 값을 줄바꿈으로 결합
      const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(input => input.value).join('\n-. ');
      
      // 여러 task_cause 값을 줄바꿈으로 결합
      const taskCauses = Array.from(document.getElementsByClassName('task-cause-input')).map(input => input.value).join('\n-. ');
  
      // 여러 task_description 값을 줄바꿈으로 결합
      const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(input => input.value).join('\n-. ');
  
      const taskDate = document.getElementById('task_date').value;
      const startTime = document.getElementById('start_time').value;
      const endTime = document.getElementById('end_time').value;
      const noneTime = document.getElementById('noneTime').value;
      const moveTime = document.getElementById('moveTime').value;
  
      const informContent = `
        <strong>${taskName}</strong><br><br>
        1) STATUS<br>
        -. ${status}<br>
        <br>
        2) ACTION<br>
        -. ${taskDescriptions}<br>
        <br>
        3) CAUSE<br>
        -. ${taskCauses}<br>
        <br>
        4) RESULT<br>
        -. ${taskResults}<br>
        <br>
        작업자: ${worker}<br>
        작업시간: ${startTime} - ${endTime}<br>
        (None: ${noneTime}, Move: ${moveTime})<br>
      `;
  
      const printContainer = document.createElement('div');
      printContainer.innerHTML = informContent;
      document.body.appendChild(printContainer);
    });
  
    document.getElementById('copy-inform').addEventListener('click', () => {
      const taskName = document.getElementById('task_name').value;
      const worker = document.getElementById('worker').value;
      const status = document.getElementById('status').value;
      
      // 여러 task_result 값을 줄바꿈으로 결합
      const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(input => input.value).join('\n-. ');
      
      // 여러 task_cause 값을 줄바꿈으로 결합
      const taskCauses = Array.from(document.getElementsByClassName('task-cause-input')).map(input => input.value).join('\n-. ');
  
      // 여러 task_description 값을 줄바꿈으로 결합
      const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(input => input.value).join('\n-. ');
  
      const taskDate = document.getElementById('task_date').value;
      const startTime = document.getElementById('start_time').value;
      const endTime = document.getElementById('end_time').value;
      const noneTime = document.getElementById('noneTime').value;
      const moveTime = document.getElementById('moveTime').value;
  
      const informContent = `
        <strong>${taskName}</strong><br><br>
        1) STATUS<br>
        -. ${status}<br>
        <br>
        2) ACTION<br>
        -. ${taskDescriptions}<br>
        <br>
        3) CAUSE<br>
        -. ${taskCauses}<br>
        <br>
        4) RESULT<br>
        -. ${taskResults}<br>
        <br>
        작업자: ${worker}<br>
        작업시간: ${startTime} - ${endTime}<br>
        (None: ${noneTime}, Move: ${moveTime})<br>
      `;
  
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = informContent.replace(/<br>/g, '\n');
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
  
      alert('작업 이력 정보가 복사되었습니다.');
    });
  });
  