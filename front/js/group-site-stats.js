document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    let logs = [];
    let engineers = [];
    let monthlyWorktimeChartInstance;
    let operationRateChartInstance;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

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
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
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
        const totalEngineers = filteredEngineers.length;

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
                <div class="stats-container">
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
                        <p>${totalEngineers}명</p>
                    </div>
                    <div class="stat-item">
                        <h3 class="blue-text">Operating Rate:</h3>
                        <p class="blue-text">${operationRate.toFixed(2)}%</p>
                    </div>
                    <div class="stat-item">
                        <h3 class="blue-text">Average Worktime per Engineer:</h3>
                        <p class="blue-text">${avgWorkHours}시간 ${avgWorkMinutes}분</p>
                    </div>
                </div>
            `;
        }
    }

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
                    fill: false
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

    function renderOperationRateChart(logs, engineers, defaultGroup1 = '', defaultSite1 = '', defaultGroup2 = '', defaultSite2 = '') {
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

        const groupSiteKeys = Object.keys(groupSiteWorktime);

        if (defaultGroup1 && defaultSite1) {
            const key1 = `${defaultGroup1}-${defaultSite1}`;
            if (groupSiteKeys.includes(key1)) {
                const totalMinutes = groupSiteWorktime[key1];
                const uniqueDates = groupSiteDates[key1].size;
                const totalEngineers = getMonthlyEngineerCount(defaultGroup1, defaultSite1, new Date(), 1); // 100% availability
                const totalEngineersReduced = getMonthlyEngineerCount(defaultGroup1, defaultSite1, new Date(), 0.9); // 90% availability
                const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
                const operationRateReduced = calculateOperationRate(totalMinutes, uniqueDates, totalEngineersReduced);
                labels.push(key1);
                data.push(operationRate);
                dataWithReducedAvailability.push(operationRateReduced);
            }
        }

        if (defaultGroup2 && defaultSite2) {
            const key2 = `${defaultGroup2}-${defaultSite2}`;
            if (groupSiteKeys.includes(key2)) {
                const totalMinutes = groupSiteWorktime[key2];
                const uniqueDates = groupSiteDates[key2].size;
                const totalEngineers = getMonthlyEngineerCount(defaultGroup2, defaultSite2, new Date(), 1); // 100% availability
                const totalEngineersReduced = getMonthlyEngineerCount(defaultGroup2, defaultSite2, new Date(), 0.9); // 90% availability
                const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
                const operationRateReduced = calculateOperationRate(totalMinutes, uniqueDates, totalEngineersReduced);
                labels.push(key2);
                data.push(operationRate);
                dataWithReducedAvailability.push(operationRateReduced);
            }
        }

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

    document.getElementById('searchButton').addEventListener('click', () => {
        const searchGroup = document.getElementById('searchGroup').value;
        const searchSite = document.getElementById('searchSite').value;
        const searchStartDate = document.getElementById('searchStartDate').value;
        const searchEndDate = document.getElementById('searchEndDate').value;
        const searchWorkType = document.getElementById('searchWorkType').value;
        const engineerAvailability = document.getElementById('engineerAvailability').value;

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

        displayOverallStats(filteredLogs, filteredEngineers);
        renderMonthlyWorktimeChart(filteredLogs);
        renderOperationRateChart(filteredLogs, filteredEngineers);
        renderCalendar(filteredLogs, filteredEngineers, currentYear, currentMonth);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        document.getElementById('searchWorkType').value = 'ALL';
        document.getElementById('engineerAvailability').value = '100%';
        displayOverallStats(logs, engineers);
        renderMonthlyWorktimeChart(logs);
        renderOperationRateChart(logs, engineers, 'PEE1', 'PT', 'PEE1', 'HS');
        renderCalendar(logs, engineers, currentYear, currentMonth);
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
        calendarContainer.appendChild(prevMonthButton);

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
        calendarContainer.appendChild(nextMonthButton);

        const calendarLegend = document.createElement('div');
        calendarLegend.className = 'calendar-legend';
        calendarLegend.innerHTML = `
            <div class="legend-item lack">Lack (>= 100%)</div>
            <div class="legend-item optimal">Optimal (70% - 99%)</div>
            <div class="legend-item surplus">Surplus (< 70%)</div>
        `;
        calendarContainer.appendChild(calendarLegend);

        const calendarTitle = document.createElement('div');
        calendarTitle.className = 'calendar-title';
        calendarTitle.textContent = `${year}-${String(month + 1).padStart(2, '0')}`;
        calendarContainer.appendChild(calendarTitle);

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
    }

    function showDetailedStats(date, dailyLogs) {
        localStorage.setItem('selectedDate', date);
        localStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));
        window.open('detailed-stats.html', '_blank');
    }

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

