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
        let sopTsGuide = '';

        let currentSection = '';
        
        if (lines.length > 0) {
            title = lines[0].trim();
        }

        lines.forEach(line => {
            if (line.startsWith('1) STATUS')) {
                currentSection = 'status';
            } else if (line.startsWith('2) ACTION')) {
                currentSection = 'action';
            } else if (line.startsWith('3) CAUSE')) {
                currentSection = 'cause';
            } else if (line.startsWith('4) RESULT')) {
                currentSection = 'result';
            } else if (line.startsWith('5) SOP 및 T/S Guide 활용')) {
                currentSection = 'sopTsGuide';
            } else {
                if (currentSection === 'status' && line.startsWith('-. ')) {
                    status = line.replace('-. ', '').trim();
                } else if (currentSection === 'action' && line.startsWith('-. ')) {
                    actions.push(line.replace('-. ', '').trim());
                } else if (currentSection === 'action' && actions.length > 0) {
                    actions[actions.length - 1] += '\n' + line.trim();
                } else if (currentSection === 'cause' && line.startsWith('-. ')) {
                    cause = line.replace('-. ', '').trim();
                } else if (currentSection === 'result' && line.startsWith('-. ')) {
                    results.push(line.replace('-. ', '').trim());
                } else if (currentSection === 'result' && results.length > 0) {
                    results[results.length - 1] += '\n' + line.trim();
                } else if (currentSection === 'sopTsGuide' && line.startsWith('-. ')) {
                    sopTsGuide = line.replace('-. ', '').trim();
                }
            }
        });

        // Helper function to add new fields with remove button
        function addField(container, value, className) {
            const newFieldContainer = document.createElement('div');
            newFieldContainer.className = className;
            newFieldContainer.innerHTML = `
                <textarea class="${className}-input" required>${value}</textarea>
                <button type="button" class="remove-field">-</button>
            `;
            container.appendChild(newFieldContainer);
            newFieldContainer.querySelector('.remove-field').addEventListener('click', function () {
                newFieldContainer.remove();
            });
        }

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
            actions.forEach(action => {
                addField(actionContainer, action, 'task-description-container');
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
            results.forEach(result => {
                addField(resultContainer, result, 'task-result-container');
            });
        } else {
            console.error('Result container not found');
        }

        // SOP 및 T/S Guide 필드 채우기
        const sopElement = document.getElementById('SOP');
        if (sopElement) {
            sopElement.value = sopTsGuide;
        } else {
            console.error('SOP element not found');
        }
        const tsGuideElement = document.getElementById('tsguide');
        if (tsGuideElement) {
            tsGuideElement.value = sopTsGuide;
        } else {
            console.error('TS Guide element not found');
        }

        overlay.style.display = 'none';
        popup.style.display = 'none';
        pasteTextarea.value = '';
    });
});
