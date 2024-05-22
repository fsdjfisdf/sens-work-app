document.addEventListener('DOMContentLoaded', function() {
    // 결과 추가/제거
    document.getElementById('add-task-result').addEventListener('click', function() {
      addField('task_result');
    });
  
    document.getElementById('remove-task-result').addEventListener('click', function() {
      removeField('task_result');
    });
  
    // 원인 추가/제거
    document.getElementById('add-task-cause').addEventListener('click', function() {
      addField('task_cause');
    });
  
    document.getElementById('remove-task-cause').addEventListener('click', function() {
      removeField('task_cause');
    });
  
    // 작업 내용 추가/제거
    document.getElementById('add-task-description').addEventListener('click', function() {
      addField('task_description');
    });
  
    document.getElementById('remove-task-description').addEventListener('click', function() {
      removeField('task_description');
    });
  
    function addField(field) {
      const container = document.getElementById(`${field}Fields`);
      const newField = document.createElement('textarea');
      newField.name = field;
      newField.className = `${field}-input`;
      newField.required = true;
      container.appendChild(newField);
      updateRemoveButtonState(field);
    }
  
    function removeField(field) {
      const container = document.getElementById(`${field}Fields`);
      if (container.children.length > 1) {
        container.removeChild(container.lastChild);
      }
      updateRemoveButtonState(field);
    }
  
    function updateRemoveButtonState(field) {
      const container = document.getElementById(`${field}Fields`);
      const removeButton = document.getElementById(`remove-${field}`);
      removeButton.disabled = container.children.length === 1;
    }
  
    // 초기 상태 업데이트
    updateRemoveButtonState('task_result');
    updateRemoveButtonState('task_cause');
    updateRemoveButtonState('task_description');
  });
  