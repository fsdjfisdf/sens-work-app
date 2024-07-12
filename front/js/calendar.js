document.addEventListener('DOMContentLoaded', async () => {
    const calendarElement = document.getElementById('calendar');
    const monthElement = document.getElementById('month');
    const yearElement = document.getElementById('year');

    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    function renderCalendar(month, year) {
        calendarElement.innerHTML = '';
        const firstDay = new Date(year, month).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const monthAndYear = document.getElementById('monthAndYear');
        monthAndYear.innerHTML = `${year}-${String(month + 1).padStart(2, '0')}`;

        // 빈 칸 채우기
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'empty');
            calendarElement.appendChild(emptyCell);
        }

        // 날짜 채우기
        for (let day = 1; day <= lastDate; day++) {
            const dateCell = document.createElement('div');
            dateCell.classList.add('calendar-day');
            const dateText = document.createElement('span');
            dateText.textContent = day;
            dateCell.appendChild(dateText);

            calendarElement.appendChild(dateCell);
        }

        // 작업 시간 표시
        loadWorkTimeData(month, year);
    }

    async function loadWorkTimeData(month, year) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

        try {
            const response = await axios.get('http://localhost:3001/worktime-by-date', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                },
                params: {
                    startDate: startDate,
                    endDate: endDate
                }
            });

            const workTimeData = response.data.result;

            workTimeData.forEach(item => {
                const date = new Date(item.task_date).getDate();
                const cell = document.querySelector(`.calendar-day:nth-child(${date + new Date(year, month).getDay()})`);
                cell.innerHTML += `<br>${item.work_hours.toFixed(2)} hrs`;
            });
        } catch (error) {
            console.error('작업 시간 데이터를 불러오는 중 오류 발생:', error);
        }
    }

    document.getElementById('prev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    document.getElementById('next').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    renderCalendar(currentMonth, currentYear);
});
