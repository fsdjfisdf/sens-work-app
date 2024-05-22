// JavaScript 파일 (addandremove.js)
document.addEventListener('DOMContentLoaded', function() {
    function setupDynamicFields(containerId, inputClass) {
      const container = document.getElementById(containerId);
      const addButton = container.querySelector(`#add-${inputClass}`);
      const removeButton = container.querySelector(`#remove-${inputClass}`);
  
      addButton.addEventListener('click', function() {
        const newInput = document.createElement('textarea');
        newInput.name = inputClass;
        newInput.className = inputClass + '-input';
        container.insertBefore(newInput, addButton);
  
        if (container.querySelectorAll(`.${inputClass}-input`).length > 1) {
          removeButton.disabled = false;
        }
      });
  
      removeButton.addEventListener('click', function() {
        const inputs = container.querySelectorAll(`.${inputClass}-input`);
        if (inputs.length > 1) {
          container.removeChild(inputs[inputs.length - 1]);
          if (inputs.length === 2) {
            removeButton.disabled = true;
          }
        }
      });
    }
  
    setupDynamicFields('task-results-container', 'task-result');
    setupDynamicFields('task-causes-container', 'task-cause');
    setupDynamicFields('task-descriptions-container', 'task-description');
  });
  