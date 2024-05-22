document.addEventListener('DOMContentLoaded', function() {
    function addRemoveFunctionality(addButtonId, removeButtonId, containerId, inputClass) {
      const addButton = document.getElementById(addButtonId);
      const removeButton = document.getElementById(removeButtonId);
      const container = document.getElementById(containerId);
  
      addButton.addEventListener('click', function() {
        const newInput = document.createElement('textarea');
        newInput.name = inputClass;
        newInput.className = inputClass;
        newInput.required = true;
        container.appendChild(newInput);
        
        // - 버튼 활성화
        if (container.getElementsByClassName(inputClass).length > 1) {
          removeButton.disabled = false;
        }
      });
  
      removeButton.addEventListener('click', function() {
        const inputs = container.getElementsByClassName(inputClass);
        if (inputs.length > 1) {
          container.removeChild(inputs[inputs.length - 1]);
        }
        
        // - 버튼 비활성화
        if (inputs.length <= 1) {
          removeButton.disabled = true;
        }
      });
    }
  
    addRemoveFunctionality('add-task-result', 'remove-task-result', 'task-results-container', 'task-result-input');
    addRemoveFunctionality('add-task-cause', 'remove-task-cause', 'task-causes-container', 'task-cause-input');
    addRemoveFunctionality('add-task-description', 'remove-task-description', 'task-descriptions-container', 'task-description-input');
  });
  