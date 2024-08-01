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
              updateRemoveButtons(container, inputClass); // Update remove button states
          });

          updateRemoveButtons(container, inputClass); // Update remove button states
      });

      // SortableJS 적용
      new Sortable(container, {
          animation: 150,
          ghostClass: 'sortable-ghost',
          handle: `.${inputClass}-container`, // 드래그 할 수 있는 핸들
      });

      updateRemoveButtons(container, inputClass); // Initial state update
  }

  function updateRemoveButtons(container, inputClass) {
      const items = container.querySelectorAll(`.${inputClass}-container`);
      items.forEach(item => {
          const removeButton = item.querySelector('.remove-field');
          removeButton.disabled = items.length === 1; // Disable remove button if only one item
      });
  }

  const taskManTemplate = `
      <div class="task-man-container">
          <textarea name="task_man" class="task-man-input" required></textarea>
          <select name="task_man_role" class="task-man-select" required>
              <option value="main">main</option>
              <option value="support">support</option>
          </select>
          <button type="button" class="remove-field btn-remove">-</button>
      </div>
  `;

  const taskResultTemplate = `
      <div class="task-result-container">
          <textarea name="task_result" class="task-result-input" required></textarea>
          <button type="button" class="remove-field btn-remove">-</button>
      </div>
  `;

  const taskCauseTemplate = `
      <div class="task-cause-container">
          <textarea name="task_cause" class="task-cause-input" required></textarea>
          <button type="button" class="remove-field btn-remove">-</button>
      </div>
  `;

  const taskDescriptionTemplate = `
      <div class="task-description-container">
          <textarea name="task_description" class="task-description-input" required></textarea>
          <button type="button" class="remove-field btn-remove">-</button>
      </div>
  `;

  setupDynamicFields('task-results-container', 'task-result', taskResultTemplate);
  setupDynamicFields('task-causes-container', 'task-cause', taskCauseTemplate);
  setupDynamicFields('task-mans-container', 'task-man', taskManTemplate);
  setupDynamicFields('task-descriptions-container', 'task-description', taskDescriptionTemplate);

  document.querySelectorAll('.next-step').forEach(button => {
      button.addEventListener('click', () => {
          const currentStep = document.querySelector('.form-step.active');
          const nextStep = document.querySelector(`.form-step[data-step="${parseInt(currentStep.dataset.step) + 1}"]`);
          currentStep.classList.add('fade-out');
          setTimeout(() => {
              currentStep.classList.remove('active', 'fade-out');
              nextStep.classList.add('active', 'fade-in');
          }, 150); // 속도 개선
      });
  });

  document.querySelectorAll('.prev-step').forEach(button => {
      button.addEventListener('click', () => {
          const currentStep = document.querySelector('.form-step.active');
          const prevStep = document.querySelector(`.form-step[data-step="${parseInt(currentStep.dataset.step) - 1}"]`);
          currentStep.classList.add('fade-out');
          setTimeout(() => {
              currentStep.classList.remove('active', 'fade-out');
              prevStep.classList.add('active', 'fade-in');
          }, 150); // 속도 개선
      });
  });
});
