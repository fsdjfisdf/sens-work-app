document.addEventListener('DOMContentLoaded', function() {
  function setupDynamicFields(containerId, inputClass) {
    const container = document.getElementById(containerId);
    const addButton = container.querySelector(`#add-${inputClass}`);
    const removeButton = container.querySelector(`#remove-${inputClass}`);

    addButton.addEventListener('click', function() {
      const inputGroup = document.createElement('div');
      inputGroup.className = inputClass + '-input-group';

      const newInput = document.createElement('textarea');
      newInput.name = inputClass;
      newInput.className = inputClass + '-input';
      inputGroup.appendChild(newInput);

      if (inputClass === 'task-man') {
        const newSelect = document.createElement('select');
        newSelect.name = inputClass + '_type';
        newSelect.className = inputClass + '-type-input';
        newSelect.innerHTML = `
          <option value="main">main</option>
          <option value="support">support</option>
        `;
        inputGroup.appendChild(newSelect);
      }

      container.insertBefore(inputGroup, addButton);

      if (container.querySelectorAll(`.${inputClass}-input-group`).length > 1) {
        removeButton.disabled = false;
      }
    });

    removeButton.addEventListener('click', function() {
      const inputGroups = container.querySelectorAll(`.${inputClass}-input-group`);
      if (inputGroups.length > 1) {
        container.removeChild(inputGroups[inputGroups.length - 1]);
        if (inputGroups.length === 2) {
          removeButton.disabled = true;
        }
      }
    });
  }

  setupDynamicFields('task-results-container', 'task-result');
  setupDynamicFields('task-causes-container', 'task-cause');
  setupDynamicFields('task-mans-container', 'task-man');
  setupDynamicFields('task-descriptions-container', 'task-description');
});
