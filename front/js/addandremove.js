document.addEventListener('DOMContentLoaded', function() {
    const addTaskDescriptionButton = document.getElementById('add-task-description');
    const removeTaskDescriptionButton = document.getElementById('remove-task-description');
    const taskDescriptionsContainer = document.getElementById('task-descriptions-container');
  
    addTaskDescriptionButton.addEventListener('click', function() {
      const newTaskDescription = document.createElement('textarea');
      newTaskDescription.name = 'task_description';
      newTaskDescription.className = 'task-description-input';
      newTaskDescription.required = true;
      taskDescriptionsContainer.appendChild(newTaskDescription);
      
      // - 버튼 활성화
      if (taskDescriptionsContainer.getElementsByClassName('task-description-input').length > 1) {
        removeTaskDescriptionButton.disabled = false;
      }
    });
  
    removeTaskDescriptionButton.addEventListener('click', function() {
      const taskDescriptions = taskDescriptionsContainer.getElementsByClassName('task-description-input');
      if (taskDescriptions.length > 1) {
        taskDescriptionsContainer.removeChild(taskDescriptions[taskDescriptions.length - 1]);
      }
      
      // - 버튼 비활성화
      if (taskDescriptions.length <= 1) {
        removeTaskDescriptionButton.disabled = true;
      }
    });
  });
  