document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('print-inform').addEventListener('click', () => {
      const taskName = document.getElementById('task_name').value;
      const taskWorkers = Array.from(document.getElementsByClassName('task-worker'))
      const status = document.getElementById('status').value;
  
      const taskResults = Array.from(document.getElementsByClassName('task-result-input'))
        .map(input => input.value.split('\n').map(line => `-. ${line}`).join('\n'))
        .join('\n');
      
      const taskCauses = Array.from(document.getElementsByClassName('task-cause-input'))
        .map(input => input.value.split('\n').map(line => `-. ${line}`).join('\n'))
        .join('\n');
  
      const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input'))
        .map(input => input.value.split('\n').map(line => `-. ${line}`).join('\n'))
        .join('\n');
  
      const taskDate = document.getElementById('task_date').value;
      const startTime = document.getElementById('start_time').value;
      const endTime = document.getElementById('end_time').value;
      const noneTime = document.getElementById('noneTime').value;
      const moveTime = document.getElementById('moveTime').value;
  
      const informContent = `
        <strong>${taskName}</strong><br><br>
        1) STATUS<br>
        -. ${status}<br><br>
        2) ACTION<br>
        ${taskDescriptions.split('\n').join('<br>')}<br><br>
        3) CAUSE<br>
        ${taskCauses.split('\n').join('<br>')}<br><br>
        4) RESULT<br>
        ${taskResults.split('\n').join('<br>')}<br><br>
        작업자: ${taskWorkers}<br>
        작업시간: ${startTime} - ${endTime}<br>
        (None: ${noneTime}, Move: ${moveTime})<br>
      `;
  
      const printContainer = document.getElementById('print-container');
      printContainer.innerHTML = informContent;
    });
  
    document.getElementById('copy-inform').addEventListener('click', () => {
      const taskName = document.getElementById('task_name').value;
      const taskWorkers = Array.from(document.getElementsByClassName('task-worker'))
      const status = document.getElementById('status').value;
  
      const taskResults = Array.from(document.getElementsByClassName('task-result-input'))
        .map(input => input.value.split('\n').map(line => `-. ${line}`).join('\n'))
        .join('\n');
      
      const taskCauses = Array.from(document.getElementsByClassName('task-cause-input'))
        .map(input => input.value.split('\n').map(line => `-. ${line}`).join('\n'))
        .join('\n');
  
      const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input'))
        .map(input => input.value.split('\n').map(line => `-. ${line}`).join('\n'))
        .join('\n');
  
      const taskDate = document.getElementById('task_date').value;
      const startTime = document.getElementById('start_time').value;
      const endTime = document.getElementById('end_time').value;
      const noneTime = document.getElementById('noneTime').value;
      const moveTime = document.getElementById('moveTime').value;
  
      const informContent = `
  ${taskName}
  
  1) STATUS
  -. ${status}
  
  2) ACTION
  ${taskDescriptions.split('\n').join('\n')}
  
  3) CAUSE
  ${taskCauses.split('\n').join('\n')}
  
  4) RESULT
  ${taskResults.split('\n').join('\n')}
  
  작업자: ${taskWorkers}
  작업시간: ${startTime} - ${endTime}
  (None: ${noneTime}, Move: ${moveTime})
      `;
  
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = informContent.trim();
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
  
      alert('작업 이력 정보가 복사되었습니다.');
    });
  });
  