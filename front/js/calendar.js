document.addEventListener('DOMContentLoaded', () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    async function fetchDailyOperationRates(group, site, startDate, endDate) {
        const response = await fetch(`http://localhost:3001/daily-operation-rates?group=${group}&site=${site}&startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'x-access-token': localStorage.getItem('x-access-token')
            }
        });
        const data = await response.json();
        return data.result;
    }

    function calculateOperationRate(totalMinutes, uniqueDates, totalEngineers) {
        const totalHours = totalMinutes / 60;
        const averageDailyHours = totalHours / uniqueDates;
        const requiredEngineers = averageDailyHours / ENGINEER_WORK_HOURS_PER_DAY;
        return (requiredEngineers / totalEngineers) * 100;
    }

    async function renderCalendar(month, year) {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        const firstDay = new Date(year, month).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const group = 'PEE1';
        const site = 'PT';
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;
        const dailyRates = await fetchDailyOperationRates(group, site, startDate, endDate);

        const operationRates = {};
        dailyRates.forEach(rate => {
            const totalMinutes = rate.total_minutes;
            const uniqueDates = rate.unique_dates;
            const totalEngineers = rate.total_engineers;
            operationRates[rate.task_date] = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
        });

        for (let i = 0; i < firstDay; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            calendar.appendChild(dayElement);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const rate = operationRates[date];

            if (rate !== undefined) {
                dayElement.innerText = `${day}\n${rate.toFixed(2)}%`;
                if (rate >= 100) {
                    dayElement.classList.add('red');
                } else if (rate >= 70) {
                    dayElement.classList.add('green');
                } else {
                    dayElement.classList.add('yellow');
                }
            } else {
                dayElement.innerText = `${day}\nN/A`;
            }

            calendar.appendChild(dayElement);
        }
    }

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    renderCalendar(currentMonth, currentYear);
});
