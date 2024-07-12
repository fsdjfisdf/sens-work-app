document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    let logs = [];
    let engineers = [];
    let monthlyWorktimeChartInstance;
    let operationRateChartInstance;

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
            window.engineersData = JSON.stringify(engineers);
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
            window.logsData = JSON.stringify(logs);
            displayOverallStats(logs, engineers);
            renderMonthlyWorktimeChart(logs);
            renderOperationRateChart(logs, engineers, 'PEE1', 'PT', 'PEE1', 'HS');
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
        }
    }

    function calculateOperationRate(totalMinutes, uniqueDates, totalEngineers) {
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

        console.log(`Total Engineers: ${totalEngineers}`);
        console.log(`Unique Work Days: ${Array.from(dates).join(', ')}`);

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
                <div class="stat-item" title="총 작업 시간">
                    <p>Total Worktime: ${hours}시간 ${minutes}분</p>
                </div>
                <div class="stat-item" title="작업 날짜 수">
                    <p>Unique Work Days: ${uniqueDates}일</p>
                </div>
                <div class="stat-item" title="필요 엔지니어 수 (총 작업 시간 / 작업 날짜 수 / 3.5 시간)">
                    <p>Required Engineers (Avg/day): ${requiredEngineers.toFixed(2)}명</p>
                </div>
                <div class="stat-item" title="총 엔지니어 수 (선택된 조건에 따라 필터링된 엔지니어 수)">
                    <p>Total Engineers: ${totalEngineers}명</p>
                </div>
                <div class="stat-item blue-text" title="가동율 (필요 엔지니어 수 / 총 엔지니어 수 * 100)">
                    <p>Operation Rate: ${operationRate.toFixed(2)}%</p>
                </div>
                <div class="stat-item blue-text" title="엔지니어 한명당 하루 평균 근무 시간 (총 작업 시간 / 총 엔지니어 수 / 작업 날짜 수)">
                    <p>Average Worktime per Engineer: ${avgWorkHours}시간 ${avgWorkMinutes}분</p>
                </div>
            `;

            updateTrafficLight(operationRate);
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

        const groupSiteEngineers = {};

        engineers.forEach(engineer => {
            const key = `${engineer.group}-${engineer.site}`;
            if (!groupSiteEngineers[key]) {
                groupSiteEngineers[key] = 0;
            }
            groupSiteEngineers[key] += 1;
        });

        const labels = [];
        const data = [];

        const groupSiteKeys = Object.keys(groupSiteWorktime);

        if (defaultGroup1 && defaultSite1) {
            const key1 = `${defaultGroup1}-${defaultSite1}`;
            if (groupSiteKeys.includes(key1)) {
                const totalMinutes = groupSiteWorktime[key1];
                const uniqueDates = groupSiteDates[key1].size;
                const totalEngineers = groupSiteEngineers[key1];
                const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
                labels.push(key1);
                data.push(operationRate);
            }
        }

        if (defaultGroup2 && defaultSite2) {
            const key2 = `${defaultGroup2}-${defaultSite2}`;
            if (groupSiteKeys.includes(key2)) {
                const totalMinutes = groupSiteWorktime[key2];
                const uniqueDates = groupSiteDates[key2].size;
                const totalEngineers = groupSiteEngineers[key2];
                const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
                labels.push(key2);
                data.push(operationRate);
            }
        }

        const ctx = document.getElementById('operationRateChart').getContext('2d');
        operationRateChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Operation Rate (%)',
                    data: data,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
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

    function updateTrafficLight(operationRate) {
        const lightRed = document.getElementById('light-red');
        const lightGreen = document.getElementById('light-green');
        const lightYellow = document.getElementById('light-yellow');

        lightRed.classList.remove('red');
        lightGreen.classList.remove('green');
        lightYellow.classList.remove('yellow');

        if (operationRate >= 100) {
            lightRed.classList.add('red');
        } else if (operationRate >= 70) {
            lightGreen.classList.add('green');
        } else {
            lightYellow.classList.add('yellow');
        }
    }

    document.getElementById('searchButton').addEventListener('click', () => {
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

        displayOverallStats(filteredLogs, filteredEngineers);
        renderMonthlyWorktimeChart(filteredLogs);
        renderOperationRateChart(filteredLogs, filteredEngineers);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        document.getElementById('searchWorkType').value = 'ALL';
        displayOverallStats(logs, engineers);
        renderMonthlyWorktimeChart(logs);
        renderOperationRateChart(logs, engineers, 'PEE1', 'PT', 'PEE1', 'HS');
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

    document.getElementById('showCalendarButton').addEventListener('click', openCalendarPopup);

    function openCalendarPopup() {
        window.open('calendar.html', 'calendar', 'width=800,height=600');
    }

    if (checkLogin()) {
        await loadEngineers();
        await loadWorkLogs();
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
