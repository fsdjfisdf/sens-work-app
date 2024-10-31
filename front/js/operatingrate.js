document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 4;
    const holidays = [
        '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
        '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
        '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
        '2024-10-09', '2024-12-25', '2024-10-01'
    ];

    // 주차별 전체 엔지니어 수 설정
    const weeklyEngineerCount = {
        '2024-10-07': 54,
        '2024-10-14': 54,
        '2024-10-21': 54,
        '2024-10-28': 54
    };

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    const today = new Date(); // 오늘 날짜 저장

    const logs = await loadWorkLogs();
    renderCalendar(logs, currentYear, currentMonth);

    document.getElementById('prev-month').addEventListener('click', () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        renderCalendar(logs, currentYear, currentMonth);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        renderCalendar(logs, currentYear, currentMonth);
    });

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            console.log("서버 응답 데이터:", response.data);
            return response.data;
        } catch (error) {
            console.error('작업 일지를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    function renderCalendar(logs, year, month) {
        const calendarContainer = document.getElementById('calendar-container');
        calendarContainer.innerHTML = '';  // 이전 달력 지우기

        // 상단에 월 표시 추가
        const monthDisplay = document.getElementById('current-month');
        monthDisplay.innerText = `${year}년 ${month + 1}월`;

        renderDaysRow();  // 요일 행 재렌더링

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const adjustedFirstDay = (firstDayOfMonth + 6) % 7;  // 월요일 시작으로 조정
        const totalDays = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        const logsByDate = {};
        logs.forEach(log => {
            const logDate = new Date(log.task_date).toISOString().split('T')[0];
            if (!logsByDate[logDate]) logsByDate[logDate] = [];
            logsByDate[logDate].push(log);
        });

        for (let i = 0; i < adjustedFirstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.classList.add('calendar-day', 'empty');
            calendarContainer.appendChild(emptyDiv);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            if (date > today) continue; // 오늘 이후 날짜는 표시하지 않음

            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');

            if (holidays.includes(dateString) || date.getDay() === 6 || date.getDay() === 0) {
                dayDiv.classList.add('holiday');
            }

            const dateElement = document.createElement('h2');
            dateElement.innerText = dateString;
            dayDiv.appendChild(dateElement);

            const dailyLogs = logsByDate[dateString] || [];
            
            // 작업 시간 계산
            const totalMinutes = dailyLogs.reduce((acc, log) => {
                const workerCount = log.task_man.split(',').length;
                const [hours, minutes] = log.task_duration.split(':').map(Number);
                return acc + (hours * 60 + minutes) * workerCount;
            }, 0);

            // 작업 인원 수 계산
            const uniqueWorkers = new Set();
            const workerTasks = {};

            dailyLogs.forEach(log => {
                const workers = log.task_man.split(',').map(worker => worker.trim().split('(')[0].trim());
                workers.forEach(worker => {
                    uniqueWorkers.add(worker);
                    workerTasks[worker] = (workerTasks[worker] || 0) + 1;
                });
            });

            console.log(`날짜: ${dateString}`);
            console.log(`작업 시간 (총 분): ${totalMinutes}`);
            console.log(`고유 작업 인원: ${Array.from(uniqueWorkers)}`);
            console.log(`작업 인원당 작업 수:`, workerTasks);

            const hoursElement = document.createElement('p');
            hoursElement.classList.add('total-hours');
            hoursElement.innerText = totalMinutes
                ? `작업 시간: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min`
                : "작업 없음";
            dayDiv.appendChild(hoursElement);

            const workerCountElement = document.createElement('p');
            workerCountElement.classList.add('worker-count');
            workerCountElement.innerText = `작업 인원 수: ${uniqueWorkers.size}`;
            dayDiv.appendChild(workerCountElement);

            // TOTAL 작업 시간 계산
            const additionalTime = Array.from(uniqueWorkers).reduce((acc, worker) => {
                if (workerTasks[worker] === 1) {
                    return acc + 4; // Add 4 hours for single task workers
                } else if (workerTasks[worker] >= 2) {
                    return acc + 4.5; // Add 4.5 hours for multi-task workers
                }
                return acc;
            }, 0);

            const totalWorkHours = totalMinutes / 60 + additionalTime;
            console.log(`추가 시간: ${additionalTime}`);
            console.log(`TOTAL 작업 시간: ${totalWorkHours.toFixed(1)}h`);
            console.log('---'); // Separator line

            const totalHoursElement = document.createElement('p');
            totalHoursElement.classList.add('total-work-hours');
            totalHoursElement.innerText = `TOTAL 작업 시간: ${totalWorkHours.toFixed(1)}h`;
            dayDiv.appendChild(totalHoursElement);

            // 작업 건 수 출력
            const taskCountElement = document.createElement('p');
            taskCountElement.classList.add('task-count');
            taskCountElement.innerText = `건 수: ${dailyLogs.length}`;
            dayDiv.appendChild(taskCountElement);

            // 필요 Eng'r 수 계산
            const requiredEngineers = (totalWorkHours / 8).toFixed(1);
            const requiredEngineersElement = document.createElement('p');
            requiredEngineersElement.classList.add('required-engineers');
            requiredEngineersElement.innerText = `필요 Eng'r 수: ${requiredEngineers}`;
            dayDiv.appendChild(requiredEngineersElement);

            // 주차별 전체 엔지니어 수 가져오기
            const weekKey = getWeekKey(dateString);
            const totalEngineers = weeklyEngineerCount[weekKey] || 0;

            // 가동율 계산
            const operatingRate = totalEngineers
                ? ((requiredEngineers / totalEngineers) * 100).toFixed(1)
                : 0;
            const operatingRateElement = document.createElement('p');
            operatingRateElement.classList.add('operating-rate');
            operatingRateElement.innerText = `가동율: ${operatingRate}%`;
            dayDiv.appendChild(operatingRateElement);

            calendarContainer.appendChild(dayDiv);
        }
    }

    function renderDaysRow() {
        const daysRow = document.getElementById('days-row');
        daysRow.innerHTML = '';  // 기존 요일 행 초기화
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day-header');
            dayElement.innerText = day;
            daysRow.appendChild(dayElement);
        });
    }

    // 주차별 키를 생성하는 함수
    function getWeekKey(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        
        if (day >= 7 && day <= 13) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-07`;
        if (day >= 14 && day <= 20) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-14`;
        if (day >= 21 && day <= 27) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-21`;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-28`;
    }
});
