document.addEventListener('DOMContentLoaded', () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    const DAYS_PER_WEEK = 5;  // 일주일의 평일 수

    let setupRelocationChart = null;
    let maintChart = null;
    let weeklyTaskPredictionChart = null;

    async function fetchLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs', {
                headers: {
                    'x-access-token': localStorage.getItem('x-access-token')
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
    }

    function filterDataByWorkType(logs, workTypes, groupFilter, siteFilter) {
        return logs.filter(log => {
            const matchesWorkType = workTypes.includes(log.work_type);
            const matchesGroup = !groupFilter || log.group === groupFilter;
            const matchesSite = !siteFilter || log.site === siteFilter;
            return matchesWorkType && matchesGroup && matchesSite;
        });
    }

    function isWeekday(dateString) {
        const date = new Date(dateString);
        const day = date.getUTCDay();
        return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
    }

    function groupByWeek(logs) {
        const weekData = {};

        logs.forEach(log => {
            const logDate = new Date(log.task_date);
            const currentWeek = getWeekNumber(new Date());
            const logWeek = getWeekNumber(logDate);

            if (logWeek === currentWeek) return; // 이번 주 데이터는 제외

            const week = `${logDate.getFullYear()}-W${logWeek}`;
            if (!isWeekday(log.task_date)) return;

            if (!weekData[week]) {
                weekData[week] = { setupRelocation: 0, maint: 0 };
            }

            if (log.work_type === 'SET UP' || log.work_type === 'RELOCATION') {
                weekData[week].setupRelocation += 1;
            } else if (log.work_type === 'MAINT') {
                weekData[week].maint += 1;
            }
        });

        return weekData;
    }

    function getWeekNumber(d) {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const millisecsInDay = 86400000;
        return Math.ceil(((d - onejan) / millisecsInDay + onejan.getDay() + 1) / 7);
    }

    function calculateTaskCountAndEngineers(logs) {
        const taskData = {};

        logs.forEach(log => {
            const logDate = log.task_date.split('T')[0];
            if (!isWeekday(logDate)) return;

            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const taskDurationMinutes = (hours * 60) + minutes;

            if (!taskData[logDate]) {
                taskData[logDate] = { taskCount: 0, totalMinutes: 0 };
            }

            taskData[logDate].taskCount += 1;
            taskData[logDate].totalMinutes += taskDurationMinutes;
        });

        return Object.entries(taskData).map(([date, data]) => ({
            date,
            taskCount: data.taskCount,
            requiredEngineers: data.totalMinutes / (ENGINEER_WORK_HOURS_PER_DAY * 60)
        }));
    }

    function performLinearRegression(data) {
        const taskCounts = data.map(item => item.taskCount);
        const requiredEngineers = data.map(item => item.requiredEngineers);

        const n = taskCounts.length;
        const sumX = taskCounts.reduce((a, b) => a + b, 0);
        const sumY = requiredEngineers.reduce((a, b) => a + b, 0);
        const sumXY = taskCounts.reduce((sum, x, i) => sum + x * requiredEngineers[i], 0);
        const sumXX = taskCounts.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const rSquared = 1 - (taskCounts.reduce((sum, x, i) => {
            const predictedY = slope * x + intercept;
            const actualY = requiredEngineers[i];
            return sum + Math.pow(predictedY - actualY, 2);
        }, 0) / requiredEngineers.reduce((sum, y) => sum + Math.pow(y - sumY / n, 2), 0));

        return { slope, intercept, rSquared };
    }

    function renderRegressionCharts(ctx1, ctx2, data1, data2, chartInstance1, chartInstance2, equationElementId1, rSquaredElementId1, equationElementId2, rSquaredElementId2) {
        // 기존 차트를 삭제합니다.
        if (setupRelocationChart) {
            setupRelocationChart.destroy();
        }
        if (maintChart) {
            maintChart.destroy();
        }

        const { slope: slope1, intercept: intercept1, rSquared: rSquared1 } = performLinearRegression(data1);
        const { slope: slope2, intercept: intercept2, rSquared: rSquared2 } = performLinearRegression(data2);

        document.getElementById(equationElementId1).textContent = `y = ${slope1.toFixed(2)}x + ${intercept1.toFixed(2)}`;
        document.getElementById(rSquaredElementId1).textContent = `R² = ${rSquared1.toFixed(2)}`;
        document.getElementById(equationElementId2).textContent = `y = ${slope2.toFixed(2)}x + ${intercept2.toFixed(2)}`;
        document.getElementById(rSquaredElementId2).textContent = `R² = ${rSquared2.toFixed(2)}`;

        setupRelocationChart = new Chart(ctx1, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'SET UP & RELOCATION vs Required Engineers',
                        data: data1.map(item => ({ x: item.taskCount, y: item.requiredEngineers })),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        pointRadius: 5
                    },
                    {
                        label: 'Regression Line (SET UP & RELOCATION)',
                        type: 'line',
                        data: data1.map(item => ({ x: item.taskCount, y: slope1 * item.taskCount + intercept1 })),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Task Count'
                        },
                        beginAtZero: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Required Engineers'
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        maintChart = new Chart(ctx2, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'MAINT vs Required Engineers',
                        data: data2.map(item => ({ x: item.taskCount, y: item.requiredEngineers })),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        pointRadius: 5
                    },
                    {
                        label: 'Regression Line (MAINT)',
                        type: 'line',
                        data: data2.map(item => ({ x: item.taskCount, y: slope2 * item.taskCount + intercept2 })),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Task Count'
                        },
                        beginAtZero: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Required Engineers'
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        return { slope1, intercept1, slope2, intercept2 };
    }

    function calculateWeeklyAverage(data) {
        const weeks = {};
        data.forEach(item => {
            const week = `${item.date.slice(0, 4)}-W${getWeekNumber(new Date(item.date))}`;
            if (!weeks[week]) {
                weeks[week] = { taskCount: 0, totalMinutes: 0 };
            }
            weeks[week].taskCount += item.taskCount;
            weeks[week].totalMinutes += item.requiredEngineers * (ENGINEER_WORK_HOURS_PER_DAY * 60);
        });

        return Object.entries(weeks).map(([week, data]) => ({
            week,
            taskCount: data.taskCount,
            requiredEngineers: data.totalMinutes / (ENGINEER_WORK_HOURS_PER_DAY * 60)
        }));
    }

    function getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    function renderWeeklyTaskCountChart(ctx, data1, data2) {
        if (weeklyTaskPredictionChart) {
            weeklyTaskPredictionChart.destroy();
        }

        const labels = data1.map(item => item.week);
        weeklyTaskPredictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'SET UP & RELOCATION',
                        data: data1.map(item => item.taskCount),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'MAINT',
                        data: data2.map(item => item.taskCount),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
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
                            text: 'Week'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Task Count'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function calculateWeeklyPrediction(data) {
        const totalTasks = data.reduce((sum, item) => sum + item.taskCount, 0);
        const weeks = data.length;
        return (totalTasks / weeks) / DAYS_PER_WEEK; // 주당 평균을 일당 평균으로 변환
    }

    function calculateRequiredEngineers(slope, intercept, predictedTasks) {
        return slope * predictedTasks + intercept;
    }

    function displayPrediction(pred1, pred2, requiredEngineersSetupRelocation, requiredEngineersMaint) {
        const predictionElement = document.getElementById('predictionText');
        if (predictionElement) {  // 요소가 존재하는지 확인
            predictionElement.innerHTML = `
            <strong>예상 하루 평균 작업 건수:</strong>
            <br>SET UP & RELOCATION = ${pred1.toFixed(2)}, MAINT = ${pred2.toFixed(2)}
            <br><strong>계산 방법:</strong>
            <br>과거 데이터를 기반으로 각 카테고리(SET UP & RELOCATION, MAINT)의 작업 건수를 주 단위로 합산한 후, 주당 평균을 계산하여 일일 평균 작업 건수로 변환하였습니다.
            <br><br>
            <strong>예상 필요한 엔지니어 수:</strong>
            <br>SET UP & RELOCATION: ${requiredEngineersSetupRelocation.toFixed(2)}명
            <br>MAINT: ${requiredEngineersMaint.toFixed(2)}명
        `;
        } else {
            console.error('Prediction element not found!');
        }
    }

    async function applyFilters() {
        const groupFilter = document.getElementById('groupFilter').value;
        const siteFilter = document.getElementById('siteFilter').value;
    
        const logs = await fetchLogs();
    
        const setupRelocationLogs = filterDataByWorkType(logs, ['SET UP', 'RELOCATION'], groupFilter, siteFilter);
        const maintLogs = filterDataByWorkType(logs, ['MAINT'], groupFilter, siteFilter);
    
        const setupRelocationData = calculateTaskCountAndEngineers(setupRelocationLogs);
        const maintData = calculateTaskCountAndEngineers(maintLogs);
    
        const setupRelocationWeekly = calculateWeeklyAverage(setupRelocationData);
        const maintWeekly = calculateWeeklyAverage(maintData);
    
        const setupRelocationCtx = document.getElementById('setupRelocationChart').getContext('2d');
        const maintCtx = document.getElementById('maintChart').getContext('2d');
        const taskPredictionCtx = document.getElementById('taskPredictionChart').getContext('2d');
    
        // Ensure context elements exist
        if (!setupRelocationCtx || !maintCtx || !taskPredictionCtx) {
            console.error('Canvas elements not found or have incorrect IDs.');
            return;
        }
    
        const { slope1, intercept1, slope2, intercept2 } = renderRegressionCharts(
            setupRelocationCtx,
            maintCtx,
            setupRelocationData,
            maintData,
            setupRelocationChart,
            maintChart,
            'setupRelocationEquation',
            'setupRelocationRSquared',
            'maintEquation',
            'maintRSquared'
        );
    
        renderWeeklyTaskCountChart(taskPredictionCtx, setupRelocationWeekly, maintWeekly);
    
        const setupRelocationPrediction = calculateWeeklyPrediction(setupRelocationWeekly);
        const maintPrediction = calculateWeeklyPrediction(maintWeekly);
    
        const requiredEngineersSetupRelocation = calculateRequiredEngineers(slope1, intercept1, setupRelocationPrediction);
        const requiredEngineersMaint = calculateRequiredEngineers(slope2, intercept2, maintPrediction);
    
        displayPrediction(setupRelocationPrediction, maintPrediction, requiredEngineersSetupRelocation, requiredEngineersMaint);
    }

    document.getElementById('filterButton').addEventListener('click', applyFilters);
    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('groupFilter').value = '';
        document.getElementById('siteFilter').value = '';
        applyFilters();
    });

    applyFilters();
});
