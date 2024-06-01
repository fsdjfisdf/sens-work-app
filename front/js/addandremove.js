document.addEventListener('DOMContentLoaded', function() {
  function setupDynamicFields(containerId, inputClass, template) {
    const container = document.getElementById(containerId);
    const addButton = container.querySelector(`#add-${inputClass}`);
    
    addButton.addEventListener('click', function() {
      const newField = document.createElement('div');
      newField.className = `${inputClass}-container`;
      newField.innerHTML = template;
      container.appendChild(newField);

      // 새로운 필드에 개별 삭제 버튼 이벤트 리스너 추가
      newField.querySelector('.remove-field').addEventListener('click', function() {
        newField.remove();
      });
    });
  }

  const taskManTemplate = `
    <div class="task-man-container">
      <textarea name="task_man" class="task-man-input" required></textarea>
      <select name="task_man_role" class="task-man-select" required>
        <option value="main">main</option>
        <option value="support">support</option>
      </select>
      <button type="button" class="remove-field">-</button>
    </div>
  `;

  const taskResultTemplate = `
    <div class="task-result-container">
      <textarea name="task_result" class="task-result-input" required></textarea>
      <button type="button" class="remove-field">-</button>
    </div>
  `;

  const taskCauseTemplate = `
    <div class="task-cause-container">
      <textarea name="task_cause" class="task-cause-input" required></textarea>
      <button type="button" class="remove-field">-</button>
    </div>
  `;

  const taskDescriptionTemplate = `
    <div class="task-description-container">
      <textarea name="task_description" class="task-description-input" required></textarea>
      <button type="button" class="remove-field">-</button>
    </div>
  `;

  setupDynamicFields('task-results-container', 'task-result', taskResultTemplate);
  setupDynamicFields('task-causes-container', 'task-cause', taskCauseTemplate);
  setupDynamicFields('task-mans-container', 'task-man', taskManTemplate);
  setupDynamicFields('task-descriptions-container', 'task-description', taskDescriptionTemplate);
});
