document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 4;
    const holidays = [
        '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
        '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
        '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
        '2024-10-09', '2024-12-25', '2024-10-01'
    ];

    // 주차별 GROUP과 SITE에 따라 평일 및 주말 엔지니어 수 설정
    const weeklyEngineerCount = {
        '2024-09-02': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-09-09': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-09-16': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-09-23': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-09-30': {
            weekday: { 'PEE1 PT': 15, 'PEE1 HS': 17, 'PEE1 IC': 4, 'PEE1 CJ': 3, 'PEE2 PT': 8, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },

        '2024-10-07': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-10-14': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-10-21': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
        '2024-10-28': {
            weekday: { 'PEE1 PT': 14, 'PEE1 HS': 19, 'PEE1 IC': 4, 'PEE1 CJ': 4, 'PEE2 PT': 7, 'PEE2 HS': 6, 'PSKH PSKH': 7 },
            weekend: { 'PEE1 PT': 3, 'PEE1 HS': 4, 'PEE1 IC': 1, 'PEE1 CJ': 1, 'PEE2 PT': 1, 'PEE2 HS': 1, 'PSKH PSKH': 1 },
        },
    };

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    const today = new Date();
    let weeklyOperatingRateChart;

    let logs = await loadWorkLogs();
    renderCalendar(logs, currentYear, currentMonth);

    document.getElementById('prev-month').addEventListener('click', () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        applyFilters();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        applyFilters();
    });

    document.getElementById('filter-btn').addEventListener('click', applyFilters);

    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            return response.data;
        } catch (error) {
            console.error('작업 일지를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    function applyFilters() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const group = document.getElementById('group-select').value;
        const site = document.getElementById('site-select').value;

        const filteredLogs = logs.filter(log => {
            const logDate = log.task_date;
            const dateMatch = (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);
            const groupMatch = !group || log.group === group;
            const siteMatch = !site || log.site === site;
            return dateMatch && groupMatch && siteMatch;
        });

        renderCalendar(filteredLogs, currentYear, currentMonth);
    }

    function getTotalEngineersByFilter(weekKey, isWeekend, group, site) {
        const engineerCountData = weeklyEngineerCount[weekKey];
        if (!engineerCountData) return 0;
    
        const dayType = isWeekend ? 'weekend' : 'weekday';
        const selectedData = engineerCountData[dayType];
    
        return Object.keys(selectedData).reduce((total, key) => {
            const [grp, st] = key.split(' ');
    
            // 그룹과 사이트가 모두 선택된 경우 정확히 일치하는 항목만 합산
            if (group && site) {
                if (group === grp && site === st) {
                    total += selectedData[key];
                }
            }
            // 그룹만 선택된 경우 해당 그룹의 모든 사이트 합산
            else if (group && !site) {
                if (group === grp) {
                    total += selectedData[key];
                }
            }
            // 사이트만 선택된 경우 해당 사이트의 모든 그룹 합산
            else if (!group && site) {
                if (site === st) {
                    total += selectedData[key];
                }
            }
            // 그룹과 사이트 모두 선택되지 않은 경우 전체 합산
            else {
                total += selectedData[key];
            }
    
            return total;
        }, 0);
    }
    

    function renderCalendar(filteredLogs, year, month) {
        const calendarContainer = document.getElementById('calendar-container');
        calendarContainer.innerHTML = '';
    
        const monthDisplay = document.getElementById('current-month');
        monthDisplay.innerText = `${year}년 ${month + 1}월`;
    
        renderDaysRow();
    
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const adjustedFirstDay = (firstDayOfMonth + 6) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();
    
        const logsByDate = {};
        const weeklyRates = {};  // 주차별 가동율 저장
    
        filteredLogs.forEach(log => {
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
            if (date > today) continue;
    
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
    
            const isWeekend = holidays.includes(dateString) || date.getDay() === 6 || date.getDay() === 0;
            if (isWeekend) dayDiv.classList.add('holiday');
    
            const dateElement = document.createElement('h2');
            dateElement.innerText = dateString;
            dayDiv.appendChild(dateElement);
    
            const dailyLogs = logsByDate[dateString] || [];
    
            const taskCount = dailyLogs.length;
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
            const requiredEngineers = (totalWorkHours / 8).toFixed(1);
    
            const group = document.getElementById('group-select').value;
            const site = document.getElementById('site-select').value;
            const weekKey = getWeekKey(dateString);  // 주차를 구하기 위한 키 생성
            const totalEngineers = getTotalEngineersByFilter(weekKey, isWeekend, group, site);
            const operatingRate = totalEngineers ? ((requiredEngineers / totalEngineers) * 100).toFixed(1) : 0;
    
            console.log(`Date: ${dateString}, Week: ${weekKey}`);
            console.log(`Total work hours: ${totalWorkHours}`);
            console.log(`Required Engineers (totalWorkHours / 8): ${requiredEngineers}`);
            console.log(`Total Engineers available: ${totalEngineers}`);
            console.log(`Operating Rate (requiredEngineers / totalEngineers * 100): ${operatingRate}%`);
    
            // 주차별 가동율 데이터 저장 (월이 넘어가는 날짜 포함)
            if (!weeklyRates[weekKey]) weeklyRates[weekKey] = [];
            weeklyRates[weekKey].push(parseFloat(operatingRate));
    
            if (operatingRate >= 100) {
                dayDiv.classList.add('lack');
            } else if (operatingRate >= 70 && operatingRate < 100) {
                dayDiv.classList.add('optimal');
            } else {
                dayDiv.classList.add('surplus');
            }
    
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
    
            dayDiv.addEventListener('click', () => openModal(dateString, dailyLogs));
            calendarContainer.appendChild(dayDiv);
        }
    
        // 주차별 가동율 평균 계산 (월이 넘어가는 날짜 포함)
        const weeklyAverageRates = Object.keys(weeklyRates)
            .sort((a, b) => new Date(a) - new Date(b)) // 주차 정렬
            .map(weekKey => {
                const rates = weeklyRates[weekKey];
                const averageRate = rates.reduce((a, b) => a + b, 0) / rates.length;
                return { week: formatWeekLabel(weekKey), averageRate: Number(averageRate.toFixed(3)) };
            });
    
        renderWeeklyOperatingRateChart(weeklyAverageRates);
    }
    
    

    function formatWeekLabel(weekKey) {
        const [year, month, day] = weekKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const weekNumber = getWeekNumber(date);
        const monthName = date.toLocaleString('en', { month: 'short' });
        return `${monthName} - ${weekNumber}W`;
    }
    

    function getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = ((date - startOfYear + 86400000) / 86400000);
        return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    }
    

    function renderWeeklyOperatingRateChart(weeklyAverageRates) {
        const ctx = document.getElementById('weeklyOperatingRateChart').getContext('2d');
        const labels = weeklyAverageRates.map(item => item.week);
        const data = weeklyAverageRates.map(item => item.averageRate);

        if (weeklyOperatingRateChart) {
            weeklyOperatingRateChart.destroy();
        }

        weeklyOperatingRateChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: '주차별 평균 가동율 (%)',
                    data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }


    function renderDaysRow() {
        const daysRow = document.getElementById('days-row');
        daysRow.innerHTML = '';
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day-header');
            dayElement.innerText = day;
            daysRow.appendChild(dayElement);
        });
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
        
        const isWeekend = holidays.includes(dateString) || new Date(dateString).getDay() === 6 || new Date(dateString).getDay() === 0;
        const group = document.getElementById('group-select').value;
        const site = document.getElementById('site-select').value;
        const weekKey = getWeekKey(dateString);
        const totalEngineers = getTotalEngineersByFilter(weekKey, isWeekend, group, site);
        const operatingRate = totalEngineers ? ((requiredEngineers / totalEngineers) * 100).toFixed(2) : "N/A";

        // INFO 탭 컨텐츠 설정
        document.getElementById('modal-info').innerHTML = `
            <!-- INFO Tab Content -->
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
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Object.values(workerTasks).filter(cnt => cnt === 1).length}명</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">2건 이상 진행한 인원 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Object.values(workerTasks).filter(cnt => cnt >= 2).length}명</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">근무 시간</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>작업 시간 + (1건 작업 인원 수 x 4시간) + (2건 이상 작업 인원 수 x 4.5시간)</div>
                        <div>
                            <strong>${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분</strong> + 
                            (<strong>${Object.values(workerTasks).filter(cnt => cnt === 1).length}명</strong> x 4시간) + 
                            (<strong>${Object.values(workerTasks).filter(cnt => cnt >= 2).length}명</strong> x 4.5시간)
                            = <strong>${totalWorkHours.toFixed(1)}시간</strong>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">필요 Eng'r 수</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>총 근무 시간 / 8</div>
                        <div><strong>${totalWorkHours.toFixed(1)}</strong> / 8 = <strong>${requiredEngineers}</strong></div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">가동율</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <div>(필요 Eng'r 수 / 주간 가용 Eng'r 수) x 100</div>
                        <div>(${requiredEngineers} / ${totalEngineers}) x 100 = <strong>${operatingRate}%</strong></div>
                    </td>
                </tr>
            </table>
            <div style="margin-top: 20px; font-size: 14px; line-height: 1.5; color: #555;">
                <strong>IT TIME ( 4시간, 4.5시간 ) 에 대한 근거</strong><br>
                -. IT TIME : FAB 내에서 작업하는 시간 및 식사시간을 제외한 시간<br>
                -. 1건 작업 시 IT TIME(4시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2시간)<br>
                -. 2건 작업 시 IT TIME(4.5시간) : TBM(0.5시간) + 작업 분배 및 준비(1시간) + 이력 작성(0.5시간) + 이동시간(2.5시간)<br>
                -. 이동시간에는 Site 이동 및 방진복 착용, Air Shower 등의 시간이 포함됨
            </div>
        `;
        const workTypeSummary = summarizeWorkTypes(dailyLogs);
        document.getElementById('modal-worker').innerHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">작업 유형</th>
                    <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">작업 건수</th>
                    <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">작업 시간</th>
                    <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">비중 (%)</th>
                </tr>
            </thead>
            <tbody>
                ${workTypeSummary.map(item => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.type}</td>
                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.count} 건</td>
                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.hours.toFixed(1)} 시간</td>
                        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.percentage}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
        modal.style.display = "block";
    }

    function summarizeWorkTypes(dailyLogs) {
        const workTypeCounts = { 'SET UP': 0, 'MAINT': 0, 'RELOCATION': 0 };
        const workTypeTimes = { 'SET UP': 0, 'MAINT': 0, 'RELOCATION': 0 };

        dailyLogs.forEach(log => {
            if (workTypeCounts[log.work_type] !== undefined) {
                workTypeCounts[log.work_type]++;
                const [hours, minutes] = log.task_duration.split(':').map(Number);
                workTypeTimes[log.work_type] += hours + minutes / 60;
            }
        });

        const totalTasks = Object.values(workTypeCounts).reduce((a, b) => a + b, 0);
        return Object.keys(workTypeCounts).map(type => ({
            type,
            count: workTypeCounts[type],
            hours: workTypeTimes[type],
            percentage: totalTasks ? ((workTypeCounts[type] / totalTasks) * 100).toFixed(1) : 0
        }));
    }

    // Event listeners for tab switching
    document.getElementById('info-tab').addEventListener('click', () => {
        document.getElementById('modal-info').style.display = 'block';
        document.getElementById('modal-worker').style.display = 'none';
    });
    document.getElementById('worker-tab').addEventListener('click', () => {
        document.getElementById('modal-info').style.display = 'none';
        document.getElementById('modal-worker').style.display = 'block';
    });
    
    

    // 모달 닫기 기능 추가
    const closeModalButton = document.getElementById('close-modal');
    closeModalButton.addEventListener('click', () => {
        const modal = document.getElementById('modal');
        modal.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modal');
        if (event.target === modal) modal.style.display = "none";
    });

    function calculateTotalMinutes(dailyLogs) {
        return dailyLogs.reduce((acc, log) => {
            const workerCount = log.task_man.split(',').length;
            const [hours, minutes] = log.task_duration.split(':').map(Number);
            return acc + (hours * 60 + minutes) * workerCount;
        }, 0);
    }

    function getWeekDates(dateString) {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to get Monday
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
    
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(monday);
            currentDay.setDate(monday.getDate() + i);
            weekDates.push(currentDay.toISOString().split('T')[0]);
        }
        return weekDates;
    }

    function getWeekKey(dateString) {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to get previous Monday
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
    
        // Format as yyyy-mm-dd to match keys in weeklyEngineerCount
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }
    
});