document.addEventListener('DOMContentLoaded', async () => {
    const calendarElement = document.getElementById('calendar');
    const logsData = JSON.parse(window.opener.logsData);
    const engineersData = JSON.parse(window.opener.engineersData);

    function calculateDailyOperationRate(logs, engineers, date) {
        const logsForTheDay = logs.filter(log => log.task_date === date);
        let totalMinutes = 0;
        let totalEngineers = engineers.length;

        logsForTheDay.forEach(log => {
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            totalMinutes += taskDurationMinutes * numWorkers;
        });

        const uniqueDates = logsForTheDay.length ? 1 : 0;
        if (totalEngineers > 0 && uniqueDates > 0) {
            const operationRate = (totalMinutes / (uniqueDates * ENGINEER_WORK_HOURS_PER_DAY * 60)) / totalEngineers * 100;
            return operationRate;
        }
        return null;
    }

    function generateCalendar(year, month) {
        calendarElement.innerHTML = '';
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayIndex = firstDayOfMonth.getDay();
        const lastDate = lastDayOfMonth.getDate();

        const days = [];

        for (let i = 0; i < firstDayIndex; i++) {
            days.push('<div class="day na"></div>');
        }

        for (let date = 1; date <= lastDate; date++) {
            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const operationRate = calculateDailyOperationRate(logsData, engineersData, fullDate);
            let className = 'day';
            let text = `${date}<br>N/A`;

            if (operationRate !== null) {
                if (operationRate >= 100) {
                    className += ' lack';
                    text = `${date}<br>${operationRate.toFixed(2)}%<br>Lack`;
                } else if (operationRate >= 70) {
                    className += ' optimal';
                    text = `${date}<br>${operationRate.toFixed(2)}%<br>Optimal`;
                } else {
                    className += ' surplus';
                    text = `${date}<br>${operationRate.toFixed(2)}%<br>Surplus`;
                }
            }
            days.push(`<div class="${className}">${text}</div>`);
        }

        calendarElement.innerHTML = days.join('');
    }

    const now = new Date();
    generateCalendar(now.getFullYear(), now.getMonth());
});
