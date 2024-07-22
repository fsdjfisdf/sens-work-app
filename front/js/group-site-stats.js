document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    let logs = [];
    let engineers = [];
    let monthlyWorktimeChartInstance;
    let operationRateChartInstance;
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
            updateLoadingPercentage(50); // 로딩 퍼센티지 업데이트
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
            renderOperationRateChart(logs, engineers, 'PEE1', 'PT', 'PEE1', 'HS');
            renderLineWorkStatsChart(logs); // 새로운 그래프 호출
            updateLoadingPercentage(100); // 로딩 퍼센티지 업데이트
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
        const dataWithReducedAvailability = [];
    
        Object.keys(groupSiteWorktime).forEach(key => {
            const totalMinutes = groupSiteWorktime[key];
            const uniqueDates = groupSiteDates[key].size;
            const totalEngineers = getMonthlyEngineerCount(key.split('-')[0], key.split('-')[1], new Date(), 1); // 100% availability
            const totalEngineersReduced = getMonthlyEngineerCount(key.split('-')[0], key.split('-')[1], new Date(), 0.9); // 90% availability
            const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
            const operationRateReduced = calculateOperationRate(totalMinutes, uniqueDates, totalEngineersReduced);
            labels.push(key);
            data.push(operationRate);
            dataWithReducedAvailability.push(operationRateReduced);
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
                    },
                    {
                        label: 'Operation Rate (90% Availability) (%)',
                        data: dataWithReducedAvailability,
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Group-Site'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Operation Rate (%)'
                        },
                        beginAtZero: true,
                        max: 100
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
            infoModalText.textContent = text;
            infoModal.classList.add('visible');
        }
    
        function hideInfo() {
            infoModal.classList.remove('visible');
        }
    
        closeInfo.addEventListener('click', hideInfo);
    
        document.getElementById("operatingRateInfoBtn").addEventListener("click", () => {
            showInfo("운영율은 선택한 기간 동안의 운영 효율성을 나타냅니다.");
        });
    
        document.getElementById("monthlyWorktimeInfoBtn").addEventListener("click", () => {
            showInfo("월별 작업 시간은 매월 총 작업 시간을 표시합니다.");
        });
    
        document.getElementById("operationRateSiteInfoBtn").addEventListener("click", () => {
            showInfo("사이트별 운영율은 각 사이트의 운영 효율성을 비교합니다.");
        });
    
        document.getElementById("lineWorkStatsInfoBtn").addEventListener("click", () => {
            showInfo("라인별 작업 시간과 작업 건수를 나타냅니다.");
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

