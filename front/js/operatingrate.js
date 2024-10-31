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
            
            // 작업 건 수 계산
            const taskCount = dailyLogs.length;
    
            // TOTAL 작업 시간 계산 (간단화)
            const totalMinutes = dailyLogs.reduce((acc, log) => {
                const workerCount = log.task_man.split(',').length;
                const [hours, minutes] = log.task_duration.split(':').map(Number);
                return acc + (hours * 60 + minutes) * workerCount;
            }, 0);
            const additionalTime = Array.from(new Set(dailyLogs.flatMap(log => log.task_man.split(',').map(worker => worker.trim().split('(')[0].trim())))).reduce((acc, worker) => {
                const workerTaskCount = dailyLogs.filter(log => log.task_man.includes(worker)).length;
                return acc + (workerTaskCount === 1 ? 4 : 4.5);
            }, 0);
            const totalWorkHours = totalMinutes / 60 + additionalTime;
            
            // 필요 Eng'r 수 계산
            const requiredEngineers = (totalWorkHours / 8).toFixed(1);
            
            // 주차별 전체 엔지니어 수 가져오기
            const weekKey = getWeekKey(dateString);
            const totalEngineers = weeklyEngineerCount[weekKey] || 0;
    
            // 가동율 계산
            const operatingRate = totalEngineers
                ? ((requiredEngineers / totalEngineers) * 100).toFixed(1)
                : 0;
    
            // 필요한 요소들만 표시
            const taskCountElement = document.createElement('p');
            taskCountElement.classList.add('task-count');
            taskCountElement.innerText = `건 수: ${taskCount}`;
            dayDiv.appendChild(taskCountElement);
    
            const requiredEngineersElement = document.createElement('p');
            requiredEngineersElement.classList.add('required-engineers');
            requiredEngineersElement.innerText = `필요 Eng'r 수: ${requiredEngineers}`;
            dayDiv.appendChild(requiredEngineersElement);
    
            const operatingRateElement = document.createElement('p');
            operatingRateElement.classList.add('operating-rate');
            operatingRateElement.innerText = `가동율: ${operatingRate}%`;
            dayDiv.appendChild(operatingRateElement);
    
            // 날짜 클릭 이벤트 추가 - 모달 열기
            dayDiv.addEventListener('click', () => {
                openModal(dateString, dailyLogs);
            });
    
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

    function calculateTotalMinutes(dailyLogs) {
        return dailyLogs.reduce((acc, log) => {
            const workerCount = log.task_man.split(',').length;
            const [hours, minutes] = log.task_duration.split(':').map(Number);
            return acc + (hours * 60 + minutes) * workerCount;
        }, 0);
    }

    function openModal(dateString, dailyLogs) {
        const modal = document.getElementById('modal');
        const uniqueWorkers = new Set();
        const workerTasks = {};
    
        dailyLogs.forEach(log => {
            const workers = log.task_man.split(',').map(worker => worker.trim().split('(')[0].trim());
            workers.forEach(worker => {
                uniqueWorkers.add(worker);
                workerTasks[worker] = (workerTasks[worker] || 0) + 1;
            });
        });
    
        const totalMinutes = calculateTotalMinutes(dailyLogs);
        const additionalTime = Array.from(uniqueWorkers).reduce((acc, worker) => {
            const taskCount = workerTasks[worker];
            return acc + (taskCount === 1 ? 4 : 4.5);
        }, 0);
    
        const totalWorkHours = (totalMinutes / 60) + additionalTime;
        const requiredEngineers = (totalWorkHours / 8).toFixed(1);
        const weekKey = getWeekKey(dateString);
        const totalEngineers = weeklyEngineerCount[weekKey] || 0;
        const operatingRate = totalEngineers ? ((requiredEngineers / totalEngineers) * 100).toFixed(2) : "N/A";
    
        // 각 작업 횟수별 인원 수 계산
        const oneTaskCount = Object.values(workerTasks).filter(count => count === 1).length;
        const multiTaskCount = Object.values(workerTasks).filter(count => count >= 2).length;
    
        // 모달 내 정보 설정
        document.getElementById('modal-date').innerText = `날짜: ${dateString}`;
        document.getElementById('modal-task-count').innerText = `건 수: ${dailyLogs.length}`;
        document.getElementById('modal-required-engineers').innerText = `필요 Eng'r 수: ${requiredEngineers}`;
        document.getElementById('modal-operating-rate').innerText = `가동율: ${operatingRate}%`;
    
        // 가독성을 위한 계산 정보 표시 개선
        document.getElementById('modal-console-info').innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">항목</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">내용</th>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">작업 시간</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">1건 진행한 인원 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${oneTaskCount}명</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">2건 이상 진행한 인원 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${multiTaskCount}명</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">TOTAL 작업 시간</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        ${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분 + ( ${oneTaskCount} x 4시간 + ${multiTaskCount} x 4.5시간 ) = ${totalWorkHours.toFixed(1)}시간
                    </td>
                </tr>
            </table>
    
            <div style="margin-top: 20px; font-size: 14px; line-height: 1.5; color: #555;">
                <strong>IT TIME ( 4시간, 4.5시간 ) 에 대한 근거</strong><br>
                -. IT TIME : FAB 내에서 작업하는 시간을 제외한 시간<br>
                -. 1건 IT TIME(4시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2시간)<br>
                -. 2건 IT TIME(4.5시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2.5시간)<br>
                -. 이동시간에는 Site 이동 및 방진복 착용, Air Shower 등의 시간이 포함됨
            </div>
        `;
    
        modal.style.display = "block";
    }
    
    
    // 모달 닫기 이벤트 추가
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('modal').style.display = "none";
    });
    
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

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
