document.addEventListener('DOMContentLoaded', function() {
  function setupDynamicFields(containerId, inputClass, template) {
    const container = document.getElementById(containerId);
    const addButton = container.querySelector(`#add-${inputClass}`);
    const removeButton = container.querySelector(`#remove-${inputClass}`);

    addButton.addEventListener('click', function() {
      const newField = document.createElement('div');
      newField.className = 'task-man-container';
      newField.innerHTML = template;
      container.insertBefore(newField, addButton);

      if (container.querySelectorAll(`.${inputClass}-input`).length > 1) {
        removeButton.disabled = false;
      }
    });

    removeButton.addEventListener('click', function() {
      const inputs = container.querySelectorAll(`.${inputClass}-container`);
      if (inputs.length > 1) {
        container.removeChild(inputs[inputs.length - 1]);
        if (inputs.length === 2) {
          removeButton.disabled = true;
        }
      }
    });
  }

  const taskManTemplate = `
    <textarea name="task_man" class="task-man-input" required></textarea>
    <select name="task_man_role" class="task-man-select" required>
      <option value="main">main</option>
      <option value="support">support</option>
    </select>
  `;

  setupDynamicFields('task-results-container', 'task-result', '<textarea name="task_result" class="task-result-input" required></textarea>');
  setupDynamicFields('task-causes-container', 'task-cause', '<textarea name="task_cause" class="task-cause-input" required></textarea>');
  setupDynamicFields('task-mans-container', 'task-man', taskManTemplate);
  setupDynamicFields('task-descriptions-container', 'task-description', '<textarea name="task_description" class="task-description-input" required></textarea>');
});