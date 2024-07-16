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
        let workers = [];
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
                actionSectionEnded = true;
                resultSectionEnded = true;
            } else if (line.startsWith('4) RESULT')) {
                currentSection = 'result';
                actionSectionEnded = true;
                resultSectionEnded = false;
            } else if (line.startsWith('5) SOP 및 T/S guide 활용')) {
                currentSection = 'sopTsGuide';
                resultSectionEnded = true;
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
                    const sopTsMatch = line.replace('-. ', '').trim().split(' / ');
                    if (sopTsMatch.length === 2) {
                        sop = sopTsMatch[0].trim();
                        tsGuide = sopTsMatch[1].trim();
                    }
                }
            }

            // 작업자, 작업 시간, None 시간 및 Move 시간 추출
            const workerMatch = line.match(/작업자\s*[:：]?\s*(.*)/);
            const timeMatch = line.match(/작업\s*시간\s*[:：]?\s*(\d{1,2}:\d{2})\s*[~\-]\s*(\d{1,2}:\d{2})/);
            const noneMatch = line.match(/(?:Non|None|none|논)\s*(\d+)/i);
            const moveMatch = line.match(/(?:move|mov|무브)\s*(\d+)/i);

            if (workerMatch) {
                workers = workerMatch[1].split(/[ ,]/).filter(Boolean);
            }
            if (timeMatch) {
                startTime = timeMatch[1];
                endTime = timeMatch[2];
            }
            if (noneMatch) {
                noneTime = noneMatch[1];
            }
            if (moveMatch) {
                moveTime = moveMatch[1];
            }
        });

        // 필드 채우기
        const titleElement = document.getElementById('task_name');
        if (titleElement) {
            titleElement.value = title;
        } else {
            console.error('Title element not found');
        }

        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.value = status;
        } else {
            console.error('Status element not found');
        }

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

        const causeElement = document.querySelector('.task-cause-input');
        if (causeElement) {
            causeElement.value = cause;
        } else {
            console.error('Cause element not found');
        }

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

        const sopElement = document.getElementById('SOP');
        if (sopElement) {
            const sopOptions = Array.from(sopElement.options);
            const matchingOption = sopOptions.find(option => option.textContent.trim() === sop);
            if (matchingOption) {
                sopElement.value = matchingOption.value;
            } else {
                sopElement.value = sopOptions.find(option => option.textContent.includes('Not Utilized')).value;
            }
        } else {
            console.error('SOP element not found');
        }

        const tsGuideElement = document.getElementById('tsguide');
        if (tsGuideElement) {
            const tsGuideOptions = Array.from(tsGuideElement.options);
            const matchingOption = tsGuideOptions.find(option => option.textContent.trim() === tsGuide);
            if (matchingOption) {
                tsGuideElement.value = matchingOption.value;
            } else {
                tsGuideElement.value = tsGuideOptions.find(option => option.textContent.includes('Not Utilized')).value;
            }
        } else {
            console.error('TS Guide element not found');
        }

        const workersContainer = document.getElementById('task-mans-container');
        if (workersContainer) {
            const workerContainers = workersContainer.querySelectorAll('.task-man-container');
            workerContainers.forEach(container => container.remove());
            workers.forEach((worker, index) => {
                const newField = document.createElement('div');
                newField.className = 'task-man-container';
                newField.innerHTML = `<textarea name="task_man" class="task-man-input" required>${worker}</textarea>
                                      <select name="task_man_role" class="task-man-select" required>
                                          <option value="main">main</option>
                                          <option value="support">support</option>
                                      </select>
                                      <button type="button" class="remove-field">-</button>`;
                workersContainer.appendChild(newField);
            });
        } else {
            console.error('Workers container not found');
        }

        const startTimeElement = document.getElementById('start_time');
        if (startTimeElement) {
            startTimeElement.value = startTime;
        } else {
            console.error('Start time element not found');
        }

        const endTimeElement = document.getElementById('end_time');
        if (endTimeElement) {
            endTimeElement.value = endTime;
        } else {
            console.error('End time element not found');
        }

        const noneTimeElement = document.getElementById('noneTime');
        if (noneTimeElement) {
            noneTimeElement.value = noneTime;
        } else {
            console.error('None time element not found');
        }

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
