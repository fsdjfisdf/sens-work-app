// addandremove.js
document.addEventListener('DOMContentLoaded', function() {
    window.addField = function(field, value = '') {
      const container = document.getElementById(`${field}Fields`);
      const newField = document.createElement('textarea');
      newField.name = `${field}[]`; // 배열로 전송하기 위해 name 속성을 배열 형태로 변경
      newField.className = `${field}-input`;
      newField.value = value;
      newField.required = true;
      container.appendChild(newField);
      updateRemoveButtonState(field);
    }
    
    window.removeField = function(field) {
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
    
    document.getElementById('add-task-result').addEventListener('click', function() {
      addField('task_result');
    });
    
    document.getElementById('remove-task-result').addEventListener('click', function() {
      removeField('task_result');
    });
    
    document.getElementById('add-task-cause').addEventListener('click', function() {
      addField('task_cause');
    });
    
    document.getElementById('remove-task-cause').addEventListener('click', function() {
      removeField('task_cause');
    });
    
    document.getElementById('add-task-description').addEventListener('click', function() {
      addField('task_description');
    });
    
    document.getElementById('remove-task-description').addEventListener('click', function() {
      removeField('task_description');
    });
    
    updateRemoveButtonState('task_result');
    updateRemoveButtonState('task_cause');
    updateRemoveButtonState('task_description');
  });
  