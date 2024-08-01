document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    let logs = [];
    let engineers = [];
    let monthlyWorktimeChartInstance;
    let operationRateChartInstance;
    let workTypeStatsChartInstance;
    let equipmentTypeStatsChartInstance;
    let amPmStatsChartInstance;
    let overtimeChartInstance;
    let timeRangeChartInstance;
    let warrantyChartInstance;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // 로딩 애니메이션 시작
    showLoading();

    // Check if user is admin
    const userRole = localStorage.getItem('user-role');
    console.log("User role:", userRole); // role 정보를 콘솔에 출력
    if (userRole !== 'admin') {
        alert("접근 권한이 없습니다.");
        window.location.replace("./index.html");
        return;
    }

    const holidays = [
        '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
        '2024-03-01', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06',
        '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03',
        '2024-10-09', '2024-12-25'
    ];

    const engineerCount = {
        '2024-06': {
            'PEE1-PT': { weekday: 17, weekend: 3 },
            'PEE1-HS': { weekday: 0, weekend: 0 },
            'PEE1-IC': { weekday: 0, weekend: 0 },
            'PEE1-CJ': { weekday: 0, weekend: 0 },
            'PEE2-PT': { weekday: 0, weekend: 0 },
            'PEE2-HS': { weekday: 0, weekend: 0 },
            'PEE3-PSKH': { weekday: 0, weekend: 0 }
        },
        '2024-07': {
            'PEE1-PT': { weekday: 17, weekend: 3 },
            'PEE1-HS': { weekday: 17, weekend: 4 },
            'PEE1-IC': { weekday: 0, weekend: 0 },
            'PEE1-CJ': { weekday: 0, weekend: 0 },
            'PEE2-PT': { weekday: 0, weekend: 0 },
            'PEE2-HS': { weekday: 0, weekend: 0 },
            'PEE3-PSKH': { weekday: 0, weekend: 0 }
        },
        '2024-08': {
            'PEE1-PT': { weekday: 17, weekend: 3 },
            'PEE1-HS': { weekday: 17, weekend: 4 },
            'PEE1-IC': { weekday: 4, weekend: 0.5 },
            'PEE1-CJ': { weekday: 4, weekend: 0.5 },
            'PEE2-PT': { weekday: 8, weekend: 1 },
            'PEE2-HS': { weekday: 6, weekend: 1 },
            'PEE3-PSKH': { weekday: 0, weekend: 0 }
        },
        // 각 월별로 데이터를 추가
    };

    function checkLogin() {
        const token = localStorage.getItem('x-access-token');
        if (!token) {
            alert("로그인이 필요합니다.");
            window.location.replace("./signin.html");
            return false;
        }
        return true;
    }

    async function loadEngineers() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/users', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            console.log('Engineers data:', response.data);
            engineers = Array.isArray(response.data.result) ? response.data.result : [];
            updateLoadingPercentage(67); // 로딩 퍼센티지 업데이트
        } catch (error) {
            console.error('엔지니어 데이터를 불러오는 중 오류 발생:', error);
        }
    }
    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            console.log('Logs data:', response.data);
            logs = response.data;
            localStorage.setItem('logs', JSON.stringify(logs)); // logs 데이터를 localStorage에 저장
            displayOverallStats(logs, engineers);
            renderMonthlyWorktimeChart(logs);
            renderOperationRateChart(logs, engineers, 'PEE1', 'PT', 'PEE1', 'HS', 'PEE1', 'IC');
            renderLineWorkStatsChart(logs); // 새로운 그래프 호출
            renderWorkTypeStatsChart(logs); // 새로운 그래프 호출
            renderEquipmentTypeStatsChart(logs); // 새로운 그래프 호출
            renderAmPmStatsChart(logs); // 새로운 그래프 호출
            renderOvertimeChart(logs);
            renderTimeRangeChart(logs);
            renderWarrantyChart(logs);
            completeLoading(); // 로딩 애니메이션 종료
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
            completeLoading(); // 로딩 애니메이션 종료
        }
    }

    function getMonthlyEngineerCount(group, site, date, availabilityRate = 1) {
        const month = date.toISOString().slice(0, 7);
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        if (engineerCount[month] && engineerCount[month][`${group}-${site}`]) {
            const count = isWeekend ? engineerCount[month][`${group}-${site}`].weekend : engineerCount[month][`${group}-${site}`].weekday;
            return Math.round(count * availabilityRate);
        }
        return 0;
    }

    function calculateTotalEngineersForMonth(date, isWeekend, availabilityRate = 1) {
        const month = date.toISOString().slice(0, 7);
        if (engineerCount[month]) {
            return Object.values(engineerCount[month]).reduce((acc, count) => acc + (isWeekend ? count.weekend : count.weekday) * availabilityRate, 0);
        }
        return 0;
    }

    function calculateOperationRate(totalMinutes, uniqueDates, totalEngineers) {
        if (totalEngineers === 0) return 0; // 엔지니어 수가 0인 경우 가동율을 0으로 설정
        const totalHours = totalMinutes / 60;
        const averageDailyHours = totalHours / uniqueDates;
        const requiredEngineers = averageDailyHours / ENGINEER_WORK_HOURS_PER_DAY;
        return (requiredEngineers / totalEngineers) * 100;
    }

    function renderOperationRateDonutChart(operationRate) {
        const ctx = document.getElementById('operationRateDonutChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#4f8df5');
        gradient.addColorStop(1, '#1f5bb5');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [operationRate, 100 - operationRate],
                    backgroundColor: [gradient, '#e0e0e0'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function displayOverallStats(filteredLogs, filteredEngineers) {
        let totalMinutes = 0;
        const dates = new Set();

        filteredLogs.forEach(log => {
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            totalMinutes += taskDurationMinutes * numWorkers;

            dates.add(log.task_date);
        });

        const uniqueDates = dates.size;

        const availabilityRate = document.getElementById('engineerAvailability').value === '90%' ? 0.9 : 1;
        const totalEngineers = filteredEngineers.length * availabilityRate;

        if (totalEngineers > 0) {
            const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const requiredEngineers = (totalMinutes / uniqueDates) / (ENGINEER_WORK_HOURS_PER_DAY * 60);
            const avgWorkTimePerEngineer = totalMinutes / (uniqueDates * totalEngineers);
            const avgWorkHours = Math.floor(avgWorkTimePerEngineer / 60);
            const avgWorkMinutes = Math.round(avgWorkTimePerEngineer % 60);

            const overallStatsContent = document.getElementById('overall-stats-content');
            overallStatsContent.innerHTML = `
                <div class="donut-chart-container">
                    <canvas id="operationRateDonutChart"></canvas>
                    <div class="donut-chart-text">
                        ${operationRate.toFixed(2)}%
                    </div>
                </div>
                <div class="stat-items-container">
                    <div class="stat-item">
                        <h3>Total Worktime:</h3>
                        <p>${hours}시간 ${minutes}분</p>
                    </div>
                    <div class="stat-item">
                        <h3>Work Days:</h3>
                        <p>${uniqueDates}일</p>
                    </div>
                    <div class="stat-item">
                        <h3>Required Engineers:</h3>
                        <p>${requiredEngineers.toFixed(2)}명</p>
                    </div>
                    <div class="stat-item">
                        <h3>Total Engineers:</h3>
                        <p>${totalEngineers.toFixed(0)}명</p>
                    </div>
                    <div class="stat-item blue-text">
                        <h3>Average Worktime per Eng'r:</h3>
                        <p>${avgWorkHours}시간 ${avgWorkMinutes}분</p>
                    </div>
                </div>
            `;
            renderOperationRateDonutChart(operationRate);
        }
    }

    document.getElementById('engineerAvailability').addEventListener('change', () => {
        const filteredLogs = logs.filter(log => {
            const logDate = formatDate(log.task_date);
            const isWorkday = document.getElementById('searchWorkType').value === 'ALL' || (document.getElementById('searchWorkType').value === 'Workday' && isWorkdayDate(logDate)) || (document.getElementById('searchWorkType').value === 'Holiday' && !isWorkdayDate(logDate));
            return (
                (document.getElementById('searchGroup').value === '' || log.group === document.getElementById('searchGroup').value) &&
                (document.getElementById('searchSite').value === '' || log.site === document.getElementById('searchSite').value) &&
                (document.getElementById('searchStartDate').value === '' || logDate >= document.getElementById('searchStartDate').value) &&
                (document.getElementById('searchEndDate').value === '' || logDate <= document.getElementById('searchEndDate').value) &&
                isWorkday
            );
        });

        const filteredEngineers = engineers.filter(engineer => {
            return (
                (document.getElementById('searchGroup').value === '' || engineer.group === document.getElementById('searchGroup').value) &&
                (document.getElementById('searchSite').value === '' || engineer.site === document.getElementById('searchSite').value)
            );
        });

        displayOverallStats(filteredLogs, filteredEngineers);
    });

    function renderMonthlyWorktimeChart(logs) {
        if (monthlyWorktimeChartInstance) {
            monthlyWorktimeChartInstance.destroy();
        }
        const monthlyWorktime = {};
    
        logs.forEach(log => {
            const date = new Date(log.task_date);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            if (!monthlyWorktime[month]) {
                monthlyWorktime[month] = 0;
            }
            monthlyWorktime[month] += taskDurationMinutes * numWorkers;
        });
    
        const labels = Object.keys(monthlyWorktime).sort();
        const data = labels.map(month => monthlyWorktime[month] / 60);
    
        const ctx = document.getElementById('monthlyWorktimeChart').getContext('2d');
        monthlyWorktimeChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Worktime (hours)',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Worktime (hours)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function renderOperationRateChart(logs, engineers) {
        if (operationRateChartInstance) {
            operationRateChartInstance.destroy();
        }
        const groupSiteWorktime = {};
        const groupSiteDates = {};
    
        logs.forEach(log => {
            const key = `${log.group}-${log.site}`;
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            if (!groupSiteWorktime[key]) {
                groupSiteWorktime[key] = 0;
                groupSiteDates[key] = new Set();
            }
            groupSiteWorktime[key] += taskDurationMinutes * numWorkers;
            groupSiteDates[key].add(log.task_date);
        });
    
        const labels = [];
        const data = [];
    
        Object.keys(groupSiteWorktime).forEach(key => {
            const totalMinutes = groupSiteWorktime[key];
            const uniqueDates = groupSiteDates[key].size;
            const totalEngineers = getMonthlyEngineerCount(key.split('-')[0], key.split('-')[1], new Date(), 1); // 100% availability
            const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
            labels.push(key);
            data.push(operationRate);
        });
    
        const ctx = document.getElementById('operationRateChart').getContext('2d');
        operationRateChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Operation Rate (100% Availability) (%)',
                        data: data,
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                indexAxis: 'y', // 가로 막대형 그래프로 변경
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Operation Rate (%)'
                        },
                        beginAtZero: true,
                        max: 100
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Group-Site'
                        }
                    }
                }
            }
        });
    }

    function applyFilters(logs, engineers) {
        const searchGroup = document.getElementById('searchGroup').value;
        const searchSite = document.getElementById('searchSite').value;
        const searchStartDate = document.getElementById('searchStartDate').value;
        const searchEndDate = document.getElementById('searchEndDate').value;
        const searchWorkType = document.getElementById('searchWorkType').value;
    
        const filteredLogs = logs.filter(log => {
            const logDate = formatDate(log.task_date);
            const isWorkday = searchWorkType === 'ALL' || (searchWorkType === 'Workday' && isWorkdayDate(logDate)) || (searchWorkType === 'Holiday' && !isWorkdayDate(logDate));
            return (
                (searchGroup === '' || log.group === searchGroup) &&
                (searchSite === '' || log.site === searchSite) &&
                (searchStartDate === '' || logDate >= searchStartDate) &&
                (searchEndDate === '' || logDate <= searchEndDate) &&
                isWorkday
            );
        });
    
        const filteredEngineers = engineers.filter(engineer => {
            return (
                (searchGroup === '' || engineer.group === searchGroup) &&
                (searchSite === '' || engineer.site === searchSite)
            );
        });
    
        return { filteredLogs, filteredEngineers };
    }
    


    document.getElementById('searchButton').addEventListener('click', () => {
        const { filteredLogs, filteredEngineers } = applyFilters(logs, engineers);
        displayOverallStats(filteredLogs, filteredEngineers);
        renderMonthlyWorktimeChart(filteredLogs);
        renderOperationRateChart(filteredLogs, filteredEngineers);
        renderLineWorkStatsChart(filteredLogs);
        renderWorkTypeStatsChart(filteredLogs); // 새로운 그래프 호출
        renderEquipmentTypeStatsChart(filteredLogs); // 새로운 그래프 호출
        renderAmPmStatsChart(filteredLogs);// 새로운 그래프 호출
        renderOvertimeChart(filteredLogs);
        renderTimeRangeChart(filteredLogs);// 새로운 그래프 호출
        renderWarrantyChart(filteredLogs);// 새로운 그래프 호출
        renderCalendar(filteredLogs, filteredEngineers, currentYear, currentMonth);
    });

document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('searchGroup').value = '';
    document.getElementById('searchSite').value = '';
    document.getElementById('searchStartDate').value = '';
    document.getElementById('searchEndDate').value = '';
    document.getElementById('searchWorkType').value = 'ALL';
    document.getElementById('engineerAvailability').value = '100%';
    const { filteredLogs, filteredEngineers } = applyFilters(logs, engineers);
    displayOverallStats(filteredLogs, filteredEngineers);
    renderMonthlyWorktimeChart(filteredLogs);
    renderOperationRateChart(filteredLogs, filteredEngineers);
    renderLineWorkStatsChart(filteredLogs);
    renderWorkTypeStatsChart(filteredLogs); // 새로운 그래프 호출
    renderEquipmentTypeStatsChart(filteredLogs); // 새로운 그래프 호출
    renderAmPmStatsChart(filteredLogs); // 새로운 그래프 호출
    renderOvertimeChart(filteredLogs);
    renderTimeRangeChart(filteredLogs);// 새로운 그래프 호출
    renderWarrantyChart(filteredLogs);// 새로운 그래프 호출

    renderCalendar(filteredLogs, filteredEngineers, currentYear, currentMonth);
});

    

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isWorkdayDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDay();
        return day !== 0 && day !== 6;
    }

    function isHoliday(dateString) {
        return holidays.includes(dateString);
    }

    function renderCalendar(logs, engineers, year, month) {
        const calendarContainer = document.getElementById('calendarContainer');
        calendarContainer.innerHTML = '';

        const currentMonthLogs = logs.filter(log => {
            const logDate = new Date(log.task_date);
            return logDate.getFullYear() === year && logDate.getMonth() === month;
        });

        const navigationContainer = document.createElement('div');
        navigationContainer.className = 'calendar-navigation';

        const prevMonthButton = document.createElement('button');
        prevMonthButton.className = 'calendar-nav-button';
        prevMonthButton.textContent = 'Last Month';
        prevMonthButton.onclick = () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(logs, engineers, currentYear, currentMonth);
        };
        navigationContainer.appendChild(prevMonthButton);

        const nextMonthButton = document.createElement('button');
        nextMonthButton.className = 'calendar-nav-button';
        nextMonthButton.textContent = 'Next Month';
        nextMonthButton.onclick = () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(logs, engineers, currentYear, currentMonth);
        };
        navigationContainer.appendChild(nextMonthButton);

        const calendarTitle = document.createElement('span');
        calendarTitle.className = 'calendar-title';
        calendarTitle.textContent = `${year}-${String(month + 1).padStart(2, '0')}`;

        const calendarNavigation = document.createElement('div');
        calendarNavigation.className = 'calendar-navigation';
        calendarNavigation.appendChild(prevMonthButton);
        calendarNavigation.appendChild(calendarTitle);
        calendarNavigation.appendChild(nextMonthButton);

        calendarContainer.appendChild(calendarNavigation);


        const daysInWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); // 월요일 시작

        const calendarHeader = document.createElement('div');
        calendarHeader.className = 'calendar-header';
        daysInWeek.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-header-day';
            dayElement.textContent = day;
            calendarHeader.appendChild(dayElement);
        });
        calendarContainer.appendChild(calendarHeader);

        const calendarRows = [];
        let calendarRow = document.createElement('div');
        calendarRow.className = 'calendar-row';
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarRow.appendChild(emptyDay);
        }

        for (let date = 1; date <= daysInMonth; date++) {
            if ((date + startDay - 1) % 7 === 0) {
                calendarContainer.appendChild(calendarRow);
                calendarRow = document.createElement('div');
                calendarRow.className = 'calendar-row';
            }

            const currentDate = new Date(year, month, date);
            const dateString = formatDate(currentDate.toISOString());
            const isHolidayFlag = isHoliday(dateString);

            const dailyLogs = currentMonthLogs.filter(log => log.task_date.startsWith(dateString));
            const totalMinutes = dailyLogs.reduce((acc, log) => {
                const durationParts = log.task_duration.split(':');
                const hours = parseInt(durationParts[0], 10);
                const minutes = parseInt(durationParts[1], 10);
                const taskDurationMinutes = (hours * 60) + minutes;
                const numWorkers = log.task_man.split(',').length;
                return acc + (taskDurationMinutes * numWorkers);
            }, 0);

            if (totalMinutes === 0) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendarRow.appendChild(emptyDay);
                continue;
            }

            const uniqueDates = 1;
            let totalEngineers = 0;
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

            const searchGroup = document.getElementById('searchGroup').value;
            const searchSite = document.getElementById('searchSite').value;
            const availabilityRate = document.getElementById('engineerAvailability').value === '90%' ? 0.9 : 1;

            if (searchGroup && searchSite) {
                totalEngineers = getMonthlyEngineerCount(searchGroup, searchSite, currentDate, availabilityRate);
            } else if (searchGroup) {
                totalEngineers = Object.keys(engineerCount).reduce((acc, month) => {
                    if (engineerCount[month][`${searchGroup}-${searchSite}`]) {
                        return acc + (isWeekend ? engineerCount[month][`${searchGroup}-${searchSite}`].weekend : engineerCount[month][`${searchGroup}-${searchSite}`].weekday) * availabilityRate;
                    }
                    return acc;
                }, 0);
            } else {
                totalEngineers = calculateTotalEngineersForMonth(currentDate, isWeekend, availabilityRate);
            }

            const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
            const requiredEngineers = (totalMinutes / uniqueDates) / (ENGINEER_WORK_HOURS_PER_DAY * 60);

            const calendarDay = document.createElement('div');
            calendarDay.className = 'calendar-day';
            if (isWeekend || isHolidayFlag) {
                calendarDay.style.color = 'red';
            }

            if (operationRate >= 100) {
                calendarDay.classList.add('lack');
            } else if (operationRate >= 70) {
                calendarDay.classList.add('optimal');
            } else {
                calendarDay.classList.add('surplus');
            }

            calendarDay.innerHTML = `
                <p style="font-weight: bold;">${dateString}</p>
                <p>${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min</p>
                <p>필요 Eng'r: ${requiredEngineers.toFixed(2)}명</p>
                <p style="color: blue;">가동율: ${operationRate.toFixed(2)}%</p>
            `;
            calendarDay.addEventListener('click', () => showDetailedStats(dateString, dailyLogs));
            calendarRow.appendChild(calendarDay);
        }
        calendarContainer.appendChild(calendarRow);

        const calendarLegend = document.createElement('div');
        calendarLegend.className = 'calendar-legend';
        calendarLegend.innerHTML = `
            <div class="legend-item lack">Lack (>= 100%)</div>
            <div class="legend-item optimal">Optimal (70% - 99%)</div>
            <div class="legend-item surplus">Surplus (< 70%)</div>
        `;
        calendarContainer.appendChild(calendarLegend);
    }

    

    function showDetailedStats(date, dailyLogs) {
        localStorage.setItem('selectedDate', date);
        localStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));
        window.open('detailed-stats.html', '_blank');
    }

    let lineWorkStatsChartInstance; // 기존의 차트 인스턴스를 저장하기 위한 변수

    function renderLineWorkStatsChart(logs) {
        if (lineWorkStatsChartInstance) {
            lineWorkStatsChartInstance.destroy();
        }
    
        const siteOrder = {
            "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
            "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
            "IC": ["M14", "M16"],
            "CJ": ["M11", "M12", "M15"],
            "PSKH": ["PSKH"]
        };
    
        const siteColors = {
            "PT": 'rgba(153, 102, 255, 0.2)',
            "HS": 'rgba(255, 99, 132, 0.2)',
            "IC": 'rgba(54, 162, 235, 0.2)',
            "CJ": 'rgba(255, 206, 86, 0.2)',
            "PSKH": 'rgba(153, 102, 255, 0.2)'
        };
    
        const siteBorderColors = {
            "PT": 'rgba(153, 102, 255, 1)',
            "HS": 'rgba(255, 99, 132, 1)',
            "IC": 'rgba(54, 162, 235, 1)',
            "CJ": 'rgba(255, 206, 86, 1)',
            "PSKH": 'rgba(153, 102, 255, 1)'
        };
    
        const siteLineWorkData = {};
    
        logs.forEach(log => {
            const { site, line, task_duration } = log;
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            const totalDuration = taskDurationMinutes * numWorkers;
    
            if (!siteLineWorkData[site]) {
                siteLineWorkData[site] = {};
            }
    
            if (!siteLineWorkData[site][line]) {
                siteLineWorkData[site][line] = {
                    worktime: 0,
                    taskCount: 0
                };
            }
    
            siteLineWorkData[site][line].worktime += totalDuration;
            siteLineWorkData[site][line].taskCount += 1;
        });
    
        const labels = [];
        const worktimeValues = [];
        const taskCountValues = [];
        const backgroundColors = [];
        const borderColors = [];
    
        for (const [site, lines] of Object.entries(siteLineWorkData)) {
            const sortedLines = Object.entries(lines).sort((a, b) => b[1].worktime - a[1].worktime);
    
            sortedLines.forEach(([line, data]) => {
                labels.push(`${site}-${line}`);
                worktimeValues.push(data.worktime / 60); // hours
                taskCountValues.push(data.taskCount);
                backgroundColors.push(siteColors[site]);
                borderColors.push(siteBorderColors[site]);
            });
        }
    
        const ctx = document.getElementById('lineWorkStatsChart').getContext('2d');
        lineWorkStatsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Worktime (hours)',
                        data: worktimeValues,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    },
                    {
                        label: 'Task Count',
                        data: taskCountValues,
                        type: 'line',
                        borderColor: 'rgba(75, 192, 193, 10)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        yAxisID: 'y-axis-taskCount'
                    }
                ]
            },
            options: {
                
                
                
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Line'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total Worktime (hours)'
                        },
                        beginAtZero: true
                    },
                    'y-axis-taskCount': {
                        title: {
                            display: true,
                            text: 'Task Count'
                        },
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    function renderWorkTypeStatsChart(logs) {
        if (workTypeStatsChartInstance) {
            workTypeStatsChartInstance.destroy();
        }
    
        const workTypeData = {
            'SET UP': 0,
            'MAINT': 0,
            'RELOCATION': 0
        };
    
        logs.forEach(log => {
            const { work_type, task_duration } = log;
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            const totalDuration = taskDurationMinutes * numWorkers;
    
            if (workTypeData[work_type] !== undefined) {
                workTypeData[work_type] += totalDuration;
            }
        });
    
        const labels = Object.keys(workTypeData);
        const worktimeValues = labels.map(type => workTypeData[type] / 60); // hours
        const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
        const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));
    
        const ctx = document.getElementById('workTypeStatsChart').getContext('2d');
        workTypeStatsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: worktimeValues,
                    backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(91, 223, 105, 0.61)', 'rgba(255, 206, 86, 0.6)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(91, 223, 105, 1)', 'rgba(255, 206, 86, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5, // 원하는 비율로 조정
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#333',
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value.toFixed(2)} hours (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderEquipmentTypeStatsChart(logs) {
        if (equipmentTypeStatsChartInstance) {
            equipmentTypeStatsChartInstance.destroy();
        }
    
        const equipmentTypeData = {};
    
        logs.forEach(log => {
            const { equipment_type, task_duration } = log;
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            const totalDuration = taskDurationMinutes * numWorkers;
    
            if (!equipmentTypeData[equipment_type]) {
                equipmentTypeData[equipment_type] = 0;
            }
    
            equipmentTypeData[equipment_type] += totalDuration;
        });
    
        const labels = Object.keys(equipmentTypeData);
        const worktimeValues = labels.map(type => equipmentTypeData[type] / 60); // hours
        const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
        const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));
    
        const ctx = document.getElementById('equipmentTypeStatsChart').getContext('2d');
        equipmentTypeStatsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: worktimeValues,
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(181, 86, 235, 0.61)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(181, 86, 235, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5, // 원하는 비율로 조정
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#333',
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value.toFixed(2)} hours (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    function renderAmPmStatsChart(logs) {
        if (amPmStatsChartInstance) {
            amPmStatsChartInstance.destroy();
        }
    
        const amPmData = {
            'AM': 0,
            'PM': 0
        };
    
        logs.forEach(log => {
            const { start_time, task_duration } = log;
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            const totalDuration = taskDurationMinutes * numWorkers;
    
            const startTimeParts = start_time.split(':');
            const startHour = parseInt(startTimeParts[0], 10);
    
            const period = startHour < 12 ? 'AM' : 'PM';
    
            amPmData[period] += totalDuration;
        });
    
        const labels = Object.keys(amPmData);
        const worktimeValues = labels.map(period => amPmData[period] / 60); // hours
        const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
        const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));
    
        const ctx = document.getElementById('amPmStatsChart').getContext('2d');
        amPmStatsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: worktimeValues,
                    backgroundColor: ['rgba(255, 166, 197, 0.61)', 'rgba(3, 14, 33, 0.2)'],
                    borderColor: ['rgba(255, 166, 197, 1)', 'rgba(3, 14, 33, 0.3)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5, // 원하는 비율로 조정
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#333',
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value.toFixed(2)} hours (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    

    function renderOvertimeChart(logs) {
        if (overtimeChartInstance) {
            overtimeChartInstance.destroy();
        }
    
        const overtimeData = {
            'Overtime': 0,
            'Regular': 0
        };
    
        logs.forEach(log => {
            const { end_time, task_duration } = log;
            const endTimeParts = end_time.split(':');
            const endHour = parseInt(endTimeParts[0], 10);
            const endMinutes = parseInt(endTimeParts[1], 10);
    
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            const totalDuration = taskDurationMinutes * numWorkers;
    
            if ((endHour >= 18 || endHour < 8) || (endHour === 8 && endMinutes <= 30)) {
                overtimeData['Overtime'] += totalDuration;
            } else {
                overtimeData['Regular'] += totalDuration;
            }
        });
    
        const labels = Object.keys(overtimeData);
        const worktimeValues = labels.map(type => overtimeData[type] / 60); // hours
        const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
        const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));
    
        const ctx = document.getElementById('overtimeChart').getContext('2d');
        overtimeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: worktimeValues,
                    backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // 수평 막대 그래프
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value.toFixed(2)} hours (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    
    function renderTimeRangeChart(logs) {
        if (timeRangeChartInstance) {
            timeRangeChartInstance.destroy();
        }
    
        const timeRangeData = {
            '0-1 hours': 0,
            '1-2 hours': 0,
            '2-3 hours': 0,
            '3-4 hours': 0,
            '4+ hours': 0
        };
    
        logs.forEach(log => {
            const { task_duration } = log;
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
    
            if (taskDurationMinutes <= 60) {
                timeRangeData['0-1 hours'] += 1; // 작업 건수 증가
            } else if (taskDurationMinutes <= 120) {
                timeRangeData['1-2 hours'] += 1;
            } else if (taskDurationMinutes <= 180) {
                timeRangeData['2-3 hours'] += 1;
            } else if (taskDurationMinutes <= 240) {
                timeRangeData['3-4 hours'] += 1;
            } else {
                timeRangeData['4+ hours'] += 1;
            }
        });
    
        const labels = Object.keys(timeRangeData);
        const worktimeValues = labels.map(type => timeRangeData[type]); // 작업 건수
        const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
        const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));
    
        const ctx = document.getElementById('timeRangeChart').getContext('2d');
        timeRangeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: worktimeValues,
                    backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // 수평 막대 그래프
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value} tasks (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    

    

    function renderWarrantyChart(logs) {
        if (warrantyChartInstance) {
            warrantyChartInstance.destroy();
        }
    
        const warrantyData = {
            'WI': 0,
            'WO': 0
        };
    
        logs.forEach(log => {
            const { warranty, task_duration } = log;
            const durationParts = task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;
            const numWorkers = log.task_man.split(',').length;
            const totalDuration = taskDurationMinutes * numWorkers;
    
            if (warranty === 'WI' || warranty === 'WO') {
                warrantyData[warranty] += totalDuration;
            }
        });
    
        const labels = Object.keys(warrantyData);
        const worktimeValues = labels.map(type => warrantyData[type] / 60); // hours
        const totalWorktime = worktimeValues.reduce((a, b) => a + b, 0);
        const percentages = worktimeValues.map(value => (value / totalWorktime * 100).toFixed(2));
    
        const ctx = document.getElementById('warrantyChart').getContext('2d');
        warrantyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: worktimeValues,
                    backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'],
                    borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y', // 수평 막대 그래프
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value.toFixed(2)} hours (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    
    
    
                       
    
    

    



        // 그래프 클릭 이벤트 추가
        document.getElementById('monthlyWorktimeChart').addEventListener('click', () => {
            showModal('monthlyWorktimeModal', 'monthlyWorktimeChartModal', monthlyWorktimeChartInstance.data);
        });
    
        document.getElementById('operationRateChart').addEventListener('click', () => {
            showModal('operationRateModal', 'operationRateChartModal', operationRateChartInstance.data);
        });
    
        document.getElementById('lineWorkStatsChart').addEventListener('click', () => {
            showModal('lineWorkStatsModal', 'lineWorkStatsChartModal', lineWorkStatsChartInstance.data);
        });


        document.getElementById('workTypeStatsChart').addEventListener('click', () => {
            showModal('workTypeStatsModal', 'workTypeStatsChartModal', workTypeStatsChartInstance.data);
        });
        
        document.getElementById('equipmentTypeStatsChart').addEventListener('click', () => {
            showModal('equipmentTypeStatsModal', 'equipmentTypeStatsChartModal', equipmentTypeStatsChartInstance.data);
        });
        
        document.getElementById('amPmStatsChart').addEventListener('click', () => {
            showModal('amPmStatsModal', 'amPmStatsChartModal', amPmStatsChartInstance.data);
        });


        document.getElementById('overtimeChart').addEventListener('click', () => {
            showModal('overtimeModal', 'overtimeChartModal', overtimeChartInstance.data);
        });
        
        document.getElementById('timeRangeChart').addEventListener('click', () => {
            showModal('timeRangeModal', 'timeRangeChartModal', timeRangeChartInstance.data);
        });
        
        document.getElementById('warrantyChart').addEventListener('click', () => {
            showModal('warrantyModal', 'warrantyChartModal', warrantyChartInstance.data);
        });
               




    
        // 모달 닫기 이벤트
        document.getElementById('closeMonthlyWorktime').addEventListener('click', () => {
            closeModal('monthlyWorktimeModal');
        });
    
        document.getElementById('closeOperationRate').addEventListener('click', () => {
            closeModal('operationRateModal');
        });
    
        document.getElementById('closeLineWorkStats').addEventListener('click', () => {
            closeModal('lineWorkStatsModal');
        });

        document.getElementById('closeWorkTypeStats').addEventListener('click', () => {
            closeModal('workTypeStatsModal');
        });
        
        document.getElementById('closeEquipmentTypeStats').addEventListener('click', () => {
            closeModal('equipmentTypeStatsModal');
        });
        
        document.getElementById('closeAmPmStats').addEventListener('click', () => {
            closeModal('amPmStatsModal');
        });


        document.getElementById('closeOvertime').addEventListener('click', () => {
            closeModal('overtimeModal');
        });
        
        document.getElementById('closeTimeRange').addEventListener('click', () => {
            closeModal('timeRangeModal');
        });
        
        document.getElementById('closeWarranty').addEventListener('click', () => {
            closeModal('warrantyModal');
        });

        
    
        function showModal(modalId, canvasId, chartData) {
            const modal = document.getElementById(modalId);
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
                type: 'bar', // 필요한 차트 타입으로 변경 가능
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            modal.style.display = 'block';
        }
    
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.style.display = 'none';
            const canvas = modal.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const infoModal = document.getElementById('infoModal');
        const infoModalText = document.getElementById('infoModalText');
        const closeInfo = document.getElementById('closeInfo');
    
        function showInfo(text) {
            infoModalText.innerHTML = text; // 변경된 부분
            infoModal.classList.add('visible');
        }
        
        function hideInfo() {
            infoModal.classList.remove('visible');
        }
        
        closeInfo.addEventListener('click', hideInfo);
        
        document.getElementById("operatingRateInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">가동율</strong>은 SEnS가 보유한 Eng'r중 가동된 Eng'r의 비율을 말합니다.<br>
                이 비율은 SEnS의 업무 부하를 판단하는 중요한 지표로 활용됩니다.<br><br>
                <span style="color: black;">** Eng'r 수 산정 근거 : 1인당 하루 평균 FAB IN TIME = 3.5Hrs</span><br>
                <span style="color: black;">** Required Engineers = Total Worktime / Work Days / 3.5Hrs</span><br>
                <span style="color: black;">** Operating Rate(%) = Required Engineers / Total Engineers * 100</span><br>
                <span style="color: black;">** Average Worktime per Eng'r = Total Worktime / Total Engineers</span>
            `);
        });
        
        document.getElementById("monthlyWorktimeInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">월별 작업 시간</strong>은 매월 총 작업 시간을 표시합니다.<br>
                이를 통해 각 월별 작업량의 변동을 파악할 수 있습니다.
            `);
        });
        
        document.getElementById("operationRateSiteInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">사이트별 가동율</strong>은 사이트별로 얼마나 업무 부하를 받고 있는지에 대하여 비교합니다.<br>
                이를 통해 각 사이트의 가동 효율성을 평가하고, 신입 사원 인력 배치를 효율적으로 할 수 있습니다.
            `);
        });
        
        document.getElementById("lineWorkStatsInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">라인별 작업 시간과 작업 건수</strong>를 나타냅니다.<br>
                이를 통해 각 라인의 작업 부하와 작업량을 파악할 수 있습니다.<br>
                <strong style="color: blue;">Total Worktime (hours)</strong>: 작업 시간의 총 합<br>
                <strong style="color: blue;">Task Count</strong>: 수행된 작업의 총 개수
            `);
        });
        
        document.getElementById("workTypeInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">작업 유형별 작업 시간과 작업 건수</strong>를 나타냅니다.<br>
                이를 통해 각 작업 유형별 빈도를 파악할 수 있습니다.
            `);
        });
        
        document.getElementById("equipmentTypeInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">설비 종류별 작업 시간과 작업 건수</strong>를 나타냅니다.<br>
                이를 통해 각 설비의 작업 빈도와 부하를 파악할 수 있습니다.
            `);
        });
        
        document.getElementById("amPmInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">오전과 오후 작업 비율</strong>을 나타냅니다.<br>
                이를 통해 작업 시간의 분포를 파악하고, 작업 스케줄을 최적화할 수 있습니다<br>
                <strong style="color: blue;">AM Work</strong>: 오전 작업 비율<br>
                <strong style="color: blue;">PM Work</strong>: 오후 작업 비율.<br><br>
                **오전 작업과 오후작업의 분류 기준은 작업 시작 시간이 정오 12시 이전인지 이후인지로 판단합니다.
            `);
        });

        document.getElementById("calendarInfoBtn").addEventListener("click", () => {
            showInfo(`<strong style="color:red;"> 가동율 캘린더는 일별 작업 시간과 가동율을 표시합니다.</strong> <br>
            <br>각 날짜에는 총 작업 시간, 필요한 엔지니어 수, 가동율이 표시됩니다.
            <br>또한 날짜를 클릭하여 해당 일의 Work Time, Work Count 등을 확인할 수 있습니다.
            <br><br><strong style>** 색상 설명</strong>
            <br>- <span style="color: green;">초록색</span> : 최적의 가동(70%-99%)
            <br>- <span style="color: orange;">노란색</span> : 잉여 엔지니어 발생(<70%)
            <br>- <span style="color: red;">빨간색</span> : 엔지니어 부족(>=100%)`);
        });

        document.getElementById("overtimeInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">야근과 비야근 그래프</strong>는 초과 근무 비율을 나타냅니다.<br><br>
                <strong style="color: blue;">Overtime</strong>: 야근<br>
                <strong style="color: blue;">Regular</strong>: 비야근.<br><br>
                **Overtime의 기준은 작업 종료 시간이 오후 6시 이후인 경우입니다.
            `);
        });
        
        document.getElementById("timeRangeInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">작업 시간 범위별 그래프</strong>는 시간대별로 분류하여 작업 건 수의 비율을 나타냅니다.<br>
            `);
        });
        
        document.getElementById("warrantyInfoBtn").addEventListener("click", () => {
            showInfo(`
                <strong style="color: red;">워런티 그래프</strong>는 워런티(WI, WO)별 작업 비율을 나타냅니다.<br><br>
                <strong style="color: blue;">WI</strong>: 워런티 내 작업<br>
                <strong style="color: blue;">WO</strong>: 워런티 외 작업.
            `);
        });
        

        
    if (checkLogin()) {
        await loadEngineers();
        await loadWorkLogs();
        renderCalendar(logs, engineers, currentYear, currentMonth);
    }

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token");
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html");
        });
    }
});

