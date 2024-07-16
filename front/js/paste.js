document.addEventListener('DOMContentLoaded', function() {
    const pasteButton = document.getElementById('paste-button');
    const pasteSubmit = document.getElementById('paste-submit');
    const pasteCancel = document.getElementById('paste-cancel');
    const overlay = document.querySelector('.overlay');
    const popup = document.getElementById('popup');
    const pasteTextarea = document.getElementById('paste-textarea');

    pasteButton.addEventListener('click', function() {
        overlay.style.display = 'block';
        popup.style.display = 'block';
    });

    pasteCancel.addEventListener('click', function() {
        overlay.style.display = 'none';
        popup.style.display = 'none';
        pasteTextarea.value = '';
    });

    pasteSubmit.addEventListener('click', function() {
        const text = pasteTextarea.value;
        const lines = text.split('\n');

        let title = '';
        let status = '';
        let actions = [];
        let cause = '';
        let results = [];
        let sop = '';
        let tsGuide = '';
        let workers = '';
        let startTime = '';
        let endTime = '';
        let noneTime = '';
        let moveTime = '';

        let currentSection = '';
        let actionSectionEnded = false;
        let resultSectionEnded = false;

        if (lines.length > 0) {
            title = lines[0].trim();
        }

        lines.forEach(line => {
            if (line.startsWith('1) STATUS')) {
                currentSection = 'status';
                actionSectionEnded = false;
                resultSectionEnded = false;
            } else if (line.startsWith('2) ACTION')) {
                currentSection = 'action';
                actionSectionEnded = false;
            } else if (line.startsWith('3) CAUSE')) {
                currentSection = 'cause';
                actionSectionEnded = true;  // End of action section
                resultSectionEnded = true;  // End of result section
            } else if (line.startsWith('4) RESULT')) {
                currentSection = 'result';
                actionSectionEnded = true;  // End of action section
                resultSectionEnded = false;
            } else if (line.startsWith('5) SOP 및 T/S guide 활용')) {
                currentSection = 'sopTsGuide';
                resultSectionEnded = true;  // End of result section
            } else if (line.startsWith('작업자 :')) {
                workers = line.replace('작업자 :', '').trim();
            } else if (line.startsWith('작업 시간 :')) {
                const times = line.replace('작업 시간 :', '').trim();
                if (times.includes('~')) {
                    [startTime, endTime] = times.split('~').map(t => t.trim());
                } else if (times.includes('-')) {
                    [startTime, endTime] = times.split('-').map(t => t.trim());
                }
            } else if (line.match(/(None|none|논|Non)\s*\d+/i)) {
                noneTime = line.match(/\d+/)[0];
            } else if (line.match(/(Move|move|Mov|무브)\s*\d+/i)) {
                moveTime = line.match(/(Move|move|Mov|무브)\s*(\d+)/i)[2];
            } else {
                if (currentSection === 'status' && line.startsWith('-. ')) {
                    status = line.replace('-. ', '').trim();
                } else if (currentSection === 'action' && !actionSectionEnded) {
                    if (line.trim() === '') {
                        actionSectionEnded = true;
                    } else if (line.startsWith('-. ')) {
                        actions.push(line.replace('-. ', '').trim());
                    } else if (actions.length > 0) {
                        actions[actions.length - 1] += '\n' + line.trim();
                    }
                } else if (currentSection === 'cause' && line.startsWith('-. ')) {
                    cause = line.replace('-. ', '').trim();
                } else if (currentSection === 'result' && !resultSectionEnded) {
                    if (line.trim() === '') {
                        resultSectionEnded = true;
                    } else if (line.startsWith('-. ')) {
                        results.push(line.replace('-. ', '').trim());
                    } else if (results.length > 0) {
                        results[results.length - 1] += '\n' + line.trim();
                    }
                } else if (currentSection === 'sopTsGuide' && line.startsWith('-. ')) {
                    const parts = line.replace('-. ', '').trim().split('/');
                    if (parts.length === 2) {
                        sop = parts[0].trim();
                        tsGuide = parts[1].trim();
                    } else {
                        sop = line.replace('-. ', '').trim();
                    }
                }
            }
        });

        // Title 필드 채우기
        const titleElement = document.getElementById('task_name');
        if (titleElement) {
            titleElement.value = title;
        } else {
            console.error('Title element not found');
        }

        // Status 필드 채우기
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.value = status;
        } else {
            console.error('Status element not found');
        }

        // Action 필드 채우기
        const actionContainer = document.getElementById('task-descriptions-container');
        if (actionContainer) {
            const actionContainers = actionContainer.querySelectorAll('.task-description-container');
            actionContainers.forEach(container => container.remove());
            actions.forEach((action, index) => {
                const newField = document.createElement('div');
                newField.className = 'task-description-container';
                newField.innerHTML = `<textarea name="task_description" class="task-description-input" required>${action}</textarea>
                                      <button type="button" class="remove-field">-</button>`;
                actionContainer.appendChild(newField);
            });
        } else {
            console.error('Action container not found');
        }

        // Cause 필드 채우기
        const causeElement = document.querySelector('.task-cause-input');
        if (causeElement) {
            causeElement.value = cause;
        } else {
            console.error('Cause element not found');
        }

        // Result 필드 채우기
        const resultContainer = document.getElementById('task-results-container');
        if (resultContainer) {
            const resultContainers = resultContainer.querySelectorAll('.task-result-container');
            resultContainers.forEach(container => container.remove());
            results.forEach((result, index) => {
                const newField = document.createElement('div');
                newField.className = 'task-result-container';
                newField.innerHTML = `<textarea name="task_result" class="task-result-input" required>${result}</textarea>
                                      <button type="button" class="remove-field">-</button>`;
                resultContainer.appendChild(newField);
            });
        } else {
            console.error('Result container not found');
        }

        // SOP 및 T/S Guide 필드 채우기
        const sopElement = document.getElementById('SOP');
        if (sopElement) {
            const sopOptions = Array.from(sopElement.options);
            const sopOption = sopOptions.find(option => option.textContent === sop);
            if (sopOption) {
                sopElement.value = sopOption.value;
            } else {
                console.error('SOP option not found');
            }
        } else {
            console.error('SOP element not found');
        }

        const tsGuideElement = document.getElementById('tsguide');
        if (tsGuideElement) {
            const tsGuideOptions = Array.from(tsGuideElement.options);
            const tsGuideOption = tsGuideOptions.find(option => option.textContent === tsGuide);
            if (tsGuideOption) {
                tsGuideElement.value = tsGuideOption.value;
            } else {
                console.error('TS Guide option not found');
            }
        } else {
            console.error('TS Guide element not found');
        }

        // Worker 필드 채우기
        const workerContainer = document.getElementById('task-mans-container');
        if (workerContainer) {
            const workerContainers = workerContainer.querySelectorAll('.task-man-container');
            workerContainers.forEach(container => container.remove());
            workers.split(',').forEach(worker => {
                const workerField = document.createElement('div');
                workerField.className = 'task-man-container';
                workerField.innerHTML = `<textarea name="task_man" class="task-man-input" required>${worker.trim()}</textarea>
                                         <select name="task_man_role" class="task-man-select" required>
                                             <option value="main">main</option>
                                             <option value="support">support</option>
                                         </select>`;
                workerContainer.appendChild(workerField);
            });
        } else {
            console.error('Worker container not found');
        }

        // Start Time 필드 채우기
        const startTimeElement = document.getElementById('start_time');
        if (startTimeElement) {
            startTimeElement.value = startTime;
        } else {
            console.error('Start time element not found');
        }

        // End Time 필드 채우기
        const endTimeElement = document.getElementById('end_time');
        if (endTimeElement) {
            endTimeElement.value = endTime;
        } else {
            console.error('End time element not found');
        }

        // None Time 필드 채우기
        const noneTimeElement = document.getElementById('noneTime');
        if (noneTimeElement) {
            noneTimeElement.value = noneTime;
        } else {
            console.error('None time element not found');
        }

        // Move Time 필드 채우기
        const moveTimeElement = document.getElementById('moveTime');
        if (moveTimeElement) {
            moveTimeElement.value = moveTime;
        } else {
            console.error('Move time element not found');
        }

        // 'remove-field' 버튼에 이벤트 리스너 추가
        document.querySelectorAll('.remove-field').forEach(button => {
            button.addEventListener('click', function() {
                this.parentElement.remove();
            });
        });

        overlay.style.display = 'none';
        popup.style.display = 'none';
        pasteTextarea.value = '';
    });
});
