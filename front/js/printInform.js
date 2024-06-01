document.addEventListener('DOMContentLoaded', () => {
    const printContainer = document.createElement('div');
    printContainer.classList.add('print-container');
    document.body.appendChild(printContainer);

    const formatText = (text) => {
        return text.split('\n').map(line => {
            if (line.startsWith('->')) {
                return line;
            } else if (line.startsWith('-.')) {
                return line;
            } else {
                return `-. ${line}`;
            }
        }).join('\n');
    };

    const updateInformContent = () => {
        const taskName = document.getElementById('task_name').value;
        const status = document.getElementById('status').value;
        const taskResults = Array.from(document.getElementsByClassName('task-result-input'))
            .map(input => formatText(input.value))
            .join('\n');

        const taskCauses = Array.from(document.getElementsByClassName('task-cause-input'))
            .map(input => formatText(input.value))
            .join('\n');

        const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input'))
            .map(input => formatText(input.value))
            .join('\n');

        const taskDate = document.getElementById('task_date').value;
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;
        const noneTime = document.getElementById('noneTime').value;
        const moveTime = document.getElementById('moveTime').value;
        const taskSOP = document.getElementById('SOP').value;
        const taskTSGuide = document.getElementById('tsguide').value;
        const warranty = document.getElementById('warranty').value;

        const taskMans = Array.from(document.querySelectorAll('.task-man-container .task-man-input'))
            .map(input => input.value)
            .join(', ');

        let workTimeText = `작업시간: ${startTime} - ${endTime}<br>(None ${noneTime}, Move ${moveTime})<br>`;
        if (warranty === 'WO') {
            workTimeText = `작업시간: ${startTime} - ${endTime}(ems)<br>(None ${noneTime}, Move ${moveTime})<br>`;
        }

        const informContent = `
            <strong>${taskName}</strong><br><br>
            1) STATUS<br>
            ${formatText(status).replace(/\n/g, '<br>')}<br><br>
            2) ACTION<br>
            ${formatText(taskDescriptions).replace(/\n/g, '<br>')}<br><br>
            3) CAUSE<br>
            ${formatText(taskCauses).replace(/\n/g, '<br>')}<br><br>
            4) RESULT<br>
            ${formatText(taskResults).replace(/\n/g, '<br>')}<br><br>
            5) SOP 및 T/S Guide 활용<br>
            ${taskSOP} / ${taskTSGuide}<br><br>
            작업자: ${taskMans}<br><br>
            ${workTimeText}
        `;

        printContainer.innerHTML = informContent;
    };

    document.getElementById('print-inform').addEventListener('click', (event) => {
        event.preventDefault(); // 폼 제출 방지
        updateInformContent();
        printContainer.classList.add('visible');
    });

    document.addEventListener('click', (event) => {
        if (!printContainer.contains(event.target) && !event.target.matches('#print-inform')) {
            printContainer.classList.remove('visible');
        }
    });

    // Hide the container when clicking on it
    printContainer.addEventListener('click', () => {
        printContainer.classList.remove('visible');
    });

    document.getElementById('copy-inform').addEventListener('click', (event) => {
        event.preventDefault(); // 폼 제출 방지
        const taskName = document.getElementById('task_name').value;
        const status = document.getElementById('status').value;
        const taskResults = Array.from(document.getElementsByClassName('task-result-input'))
            .map(input => formatText(input.value))
            .join('\n');

        const taskCauses = Array.from(document.getElementsByClassName('task-cause-input'))
            .map(input => formatText(input.value))
            .join('\n');

        const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input'))
            .map(input => formatText(input.value))
            .join('\n');

        const taskDate = document.getElementById('task_date').value;
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;
        const noneTime = document.getElementById('noneTime').value;
        const moveTime = document.getElementById('moveTime').value;
        const taskSOP = document.getElementById('SOP').value;
        const taskTSGuide = document.getElementById('tsguide').value;
        const warranty = document.getElementById('warranty').value;

        const taskMans = Array.from(document.querySelectorAll('.task-man-container .task-man-input'))
            .map(input => input.value)
            .join(', ');

        let workTimeText = `작업시간: ${startTime} - ${endTime}\n(None ${noneTime}, Move ${moveTime})`;
        if (warranty === 'WO') {
            workTimeText = `작업시간: ${startTime} - ${endTime}(ems)\n(None ${noneTime}, Move ${moveTime})`;
        }

        const informContent = `
${taskName}

1) STATUS
${formatText(status).split('\n').join('\n')}

2) ACTION
${formatText(taskDescriptions).split('\n').join('\n')}

3) CAUSE
${formatText(taskCauses).split('\n').join('\n')}

4) RESULT
${formatText(taskResults).split('\n').join('\n')}

5) SOP 및 T/S Guide 활용
${taskSOP} / ${taskTSGuide}

작업자: ${taskMans}
${workTimeText}
        `;

        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = informContent.trim();
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);

        alert('작업 이력 정보가 복사되었습니다.');
    });
});
