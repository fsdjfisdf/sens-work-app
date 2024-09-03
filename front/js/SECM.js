let workLogs = []; // 전역 변수로 선언, fetchWorkLogs로 데이터를 채우게 됩니다.

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // Chart context 초기화
    const levelDistributionChartCtx = document.getElementById('levelDistributionChart').getContext('2d');
    const multiLevelDistributionChartCtx = document.getElementById('multiLevelDistributionChart').getContext('2d');
    const yearsOfServiceChartCtx = document.getElementById('yearsOfServiceChart').getContext('2d');
    const groupSiteDistributionChartCtx = document.getElementById('groupSiteDistributionChart').getContext('2d');
    const averageTimeToAchieveChartCtx = document.getElementById('averageTimeToAchieveChart').getContext('2d');
    const monthlyCapaChartCtx = document.getElementById('monthlyCapaChart').getContext('2d');
    const setupCapaChartCtx = document.getElementById('setupCapaChart').getContext('2d');
    const maintCapaChartCtx = document.getElementById('maintCapaChart').getContext('2d');
    const averageCapaChartCtx = document.getElementById('averageCapaChart').getContext('2d');
    const engineerCountChartCtx = document.getElementById('engineerCountChart').getContext('2d');
    const levelChangesChartCtx = document.getElementById('levelChangesChart').getContext('2d');
    const mpiDistributionChartCtx = document.getElementById('mpiDistributionChart').getContext('2d'); // 추가된 부분
    const monthlyCapaChange = document.getElementById('monthlyCapaChange');
    const workTimeCountTrendChartCtx = document.getElementById('workTimeCountTrendChart').getContext('2d');
    const workTypeRatioChartCtx = document.getElementById('workTypeRatioChart').getContext('2d');
    const itemWorkCountChartCtx = document.getElementById('itemWorkCountChart').getContext('2d');
    const overtimeRegularChartCtx = document.getElementById('overtimeRegularChart').getContext('2d');
    const timeRangeChartCtx = document.getElementById('timeRangeChart').getContext('2d');
    const setupTaskChartCtx = document.getElementById('setupTaskChart').getContext('2d');
    const maintTaskChartCtx = document.getElementById('maintTaskChart').getContext('2d');
    const weekdayWeekendChartCtx = document.getElementById('weekdayWeekendChart').getContext('2d'); // 새로운 차트 컨텍스트




    // 기타 DOM 요소 초기화
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const searchGroup = document.getElementById('searchGroup');
    const searchSite = document.getElementById('searchSite');
    const searchLevel = document.getElementById('searchLevel');
    const searchMultiLevel = document.getElementById('searchMultiLevel');
    const searchName = document.getElementById('searchName');
    const namesDatalist = document.getElementById('names');
    const personInfo = document.getElementById('personInfo');
    const personName = document.getElementById('personName');
    const personHireDate = document.getElementById('personHireDate');
    const personGroup = document.getElementById('personGroup');
    const personSite = document.getElementById('personSite');

    let originalData = [];
    let charts = {};
    
    async function fetchData() {
        try {
            const response = await fetch('http://3.37.165.84:3001/api/secm');
            const data = await response.json();
            originalData = data;
            return data;
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            return [];
        }
    }

    function filterData(data) {
        const group = searchGroup.value;
        const site = searchSite.value;
        const level = searchLevel.value;
        const multiLevel = searchMultiLevel.value;
        const name = searchName.value.toLowerCase();
        const multiEngr = searchMultiEngr.value;
    
        return data.filter(row => {
            const isMultiEngr = multiEngr === 'O' ? row.MPI >= 2 : multiEngr === 'X' ? row.MPI < 2 : true;
            return (
                (!group || row.GROUP === group) &&
                (!site || row.SITE === site) &&
                (!level || row.LEVEL == level) &&
                (!multiLevel || row['MULTI LEVEL'] == multiLevel) &&
                (!name || row.NAME.toLowerCase().includes(name)) &&
                isMultiEngr
            );
        });
    }

    function createChart(ctx, config) {
        if (charts[ctx.canvas.id]) {
            charts[ctx.canvas.id].destroy();
        }
        charts[ctx.canvas.id] = new Chart(ctx, config);
    }

    function calculateQuarterDistribution(data) {
        const startYear = 2022;
        const endYear = 2024;
    
        const quarters = [];
        for (let year = startYear; year <= endYear; year++) {
            for (let quarter = 1; quarter <= 4; quarter++) {
                quarters.push(`${year}Q${quarter}`);
            }
        }
    
        const levelDistribution = quarters.map(() => ({
            level0: 0,
            level1: 0,
            level2: 0,
            level3: 0,
            level4: 0,
        }));
    
        const getQuarterIndex = (date) => {
            const year = date.getFullYear();
            const quarter = Math.floor((date.getMonth() + 3) / 3);
            return (year - startYear) * 4 + (quarter - 1);
        };
    
        data.forEach(row => {
            const hireDate = new Date(row.HIRE);
            const levelDates = [
                hireDate,
                row['Level1 Achieve'] ? new Date(row['Level1 Achieve']) : null,
                row['Level2 Achieve'] ? new Date(row['Level2 Achieve']) : null,
                row['Level3 Achieve'] ? new Date(row['Level3 Achieve']) : null,
                row['Level4 Achieve'] ? new Date(row['Level4 Achieve']) : null,
            ];
    
            let currentLevel = 0;
            let levelIndex = 0;
            quarters.forEach((quarter, index) => {
                const quarterEnd = new Date(startYear + Math.floor(index / 4), (index % 4 + 1) * 3, 0);
    
                while (levelIndex < levelDates.length && levelDates[levelIndex] && levelDates[levelIndex] <= quarterEnd) {
                    currentLevel = levelIndex;
                    levelIndex++;
                }
    
                if (hireDate <= quarterEnd) {
                    levelDistribution[index][`level${currentLevel}`]++;
                }
            });
        });
    
        return { quarters, levelDistribution };
    }

    function calculateMonthlyEngineerCount(data) {
        const startYear = 2023;
        const endYear = new Date().getFullYear();
        const endMonth = new Date().getMonth();
        const months = [];
    
        for (let year = startYear; year <= endYear; year++) {
            for (let month = 0; month < 12; month++) {
                if (year === endYear && month > endMonth) break;
                months.push(`${year}-${String(month + 1).padStart(2, '0')}`);
            }
        }
    
        const engineerCount = months.map(() => 0);
    
        data.forEach(row => {
            const hireDate = new Date(row.HIRE);
            const hireYear = hireDate.getFullYear();
            const hireMonth = hireDate.getMonth();
            
            for (let year = hireYear; year <= endYear; year++) {
                for (let month = year === hireYear ? hireMonth : 0; month < 12; month++) {
                    if (year === endYear && month > endMonth) break;
                    const index = (year - startYear) * 12 + month;
                    if (index >= 0) {
                        engineerCount[index]++;
                    }
                }
            }
        });
    
        return { months, engineerCount };
    }

    const weekendEngineerCountsBySite = {
        "PEE1 Group PT Site": 4,
        "PEE1 Group HS Site": 4,
        "PEE1 Group IC Site": 2,
        "PEE1 Group CJ Site": 2,
        "PEE2 Group PT Site": 2,
        "PEE2 Group HS Site": 2
    };
    
    function getTotalWeekendEngineers(group, site) {
        console.log("Group:", group);
        console.log("Site:", site);
        
        if (site) {
            // 특정 사이트가 선택된 경우
            const key = `${group} Group ${site} Site`;
            console.log("Constructed key:", key);
            return weekendEngineerCountsBySite[key] || 0;
        } else if (group) {
            // 그룹만 선택된 경우
            let totalEngineers = 0;
            for (let key in weekendEngineerCountsBySite) {
                if (key.startsWith(`${group} Group`)) {
                    totalEngineers += weekendEngineerCountsBySite[key];
                }
            }
            console.log("Total engineers for group:", totalEngineers);
            return totalEngineers;
        } else {
            // 그룹과 사이트 모두 선택되지 않은 경우 (전체 합산)
            const totalEngineers = Object.values(weekendEngineerCountsBySite).reduce((sum, count) => sum + count, 0);
            console.log("Total engineers for all:", totalEngineers);
            return totalEngineers;
        }
    }

    function calculateAverageTasksPerDay(data, group, site) {
        let weekdayTaskCount = 0;
        let weekendTaskCount = 0;
        let weekdayEngineersSet = new Set();
        let weekdayDaysSet = new Set();
        let weekendDaysSet = new Set();
    
        data.forEach(log => {
            const taskDate = new Date(log.task_date);
            const dayOfWeek = taskDate.getDay(); // 0: Sunday, 6: Saturday
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
            const engineers = log.task_man.split(',').map(e => e.split('(')[0].trim());
    
            if (isWeekend) {
                weekendTaskCount += 1;
                weekendDaysSet.add(taskDate.toDateString());
            } else {
                engineers.forEach(engineer => weekdayEngineersSet.add(engineer));
                weekdayTaskCount += 1;
                weekdayDaysSet.add(taskDate.toDateString());
            }
        });
    
        const totalWeekdayDays = weekdayDaysSet.size;
        const totalWeekendDays = weekendDaysSet.size;
    
        const totalWeekendEngineers = getTotalWeekendEngineers(group, site);
        const totalWeekdayEngineers = weekdayEngineersSet.size;
    
        console.log("Total Weekend Engineers:", totalWeekendEngineers);
    
        const avgWeekdayTasks = ((weekdayTaskCount / totalWeekdayDays) / totalWeekdayEngineers) * 2;
        const avgWeekendTasks = ((weekendTaskCount / totalWeekendDays) / totalWeekendEngineers) * 2;
    
        console.log(`Total Weekday Tasks: ${weekdayTaskCount}, Total Weekend Tasks: ${weekendTaskCount}`);
        console.log(`Total Weekday Engineers: ${totalWeekdayEngineers}, Total Weekend Engineers: ${totalWeekendEngineers}`);
        console.log(`Total Weekday Days: ${totalWeekdayDays}, Total Weekend Days: ${totalWeekendDays}`);
        console.log(`Average Weekday Tasks per Engineer per Day (after *2): ${avgWeekdayTasks}`);
        console.log(`Average Weekend Tasks per Engineer per Day (after *2): ${avgWeekendTasks}`);
    
        return { avgWeekdayTasks, avgWeekendTasks };
    }
    
    function renderCharts(data) {
        const totalEngineers = data.length;

        if (totalEngineers === 1) {
            const person = data[0];
            personName.textContent = person.NAME;
            personHireDate.textContent = formatDate(person.HIRE);
            personGroup.textContent = person.GROUP;
            personSite.textContent = person.SITE;
            personInfo.classList.remove('hidden');
        } else {
            personInfo.classList.add('hidden');
        }

        // Monthly Engineer Count
        const { months, engineerCount } = calculateMonthlyEngineerCount(data);
        createChart(engineerCountChartCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Number of Engineers',
                    data: engineerCount,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: true
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => value,
                        color: 'white',
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...engineerCount) * 1.2,
                        ticks: {
                            color: 'silver' // y축 레이블 색상
                        }
                    }
                }
            }
        });

        // Level Distribution 데이터 처리
        const levels = data.map(row => row.LEVEL);
        const levelCounts = levels.reduce((acc, level) => {
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        const levelPercentages = Object.values(levelCounts).map(count => ((count / totalEngineers) * 100).toFixed(2));
        const averageLevel = (levels.reduce((sum, level) => sum + level, 0) / totalEngineers).toFixed(2);

        createChart(levelDistributionChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(levelCounts),
                datasets: [{
                    label: 'Number of Employees',
                    data: Object.values(levelCounts),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => `${value} (${levelPercentages[ctx.dataIndex]}%)`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    title: {
                        display: true,
                        text: `Average Level: ${averageLevel}`,
                        font: {
                            size: 13
                        },
                        color: 'Yellow' // 제목 색상
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...Object.values(levelCounts)) * 1.2,
                        ticks: {
                            color: 'silver' // y축 레이블 색상
                        }
                    }
                }
            }
        });

        // Multi Level Distribution 데이터 처리
        const multiLevels = data.map(row => row['MULTI LEVEL']).filter(level => level !== null);
        const multiLevelCounts = multiLevels.reduce((acc, level) => {
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        const multiLevelPercentages = Object.values(multiLevelCounts).map(count => ((count / totalEngineers) * 100).toFixed(2));
        const averageMultiLevel = (multiLevels.reduce((sum, level) => sum + parseInt(level), 0) / multiLevels.length).toFixed(2);

        createChart(multiLevelDistributionChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(multiLevelCounts).map(key => {
                    switch (key) {
                        case '0': return 'Lv.4';
                        case '1': return 'Lv.4-1(B)';
                        case '2': return 'Lv.4-1(A)';
                        default: return key;
                    }
                }),
                datasets: [{
                    label: 'Number of Employees',
                    data: Object.values(multiLevelCounts),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => `${value} (${multiLevelPercentages[ctx.dataIndex]}%)`,
                        color: 'lavender', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    title: {
                        display: true,
                        text: `Average Multi Level: ${averageMultiLevel}`,
                        font: {
                            size: 13
                        },
                        color: 'Yellow' // 제목 색상
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...Object.values(multiLevelCounts)) * 1.2,
                        ticks: {
                            color: 'silver' // y축 레이블 색상
                        }
                    }
                }
            }
        });

        // Level Changes Over Time
        const { quarters, levelDistribution } = calculateQuarterDistribution(data);
        const levelDistributionData = {
            labels: quarters,
            datasets: [
                {
                    label: 'Level 0',
                    data: levelDistribution.map(l => l.level0),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    fill: false,
                },
                {
                    label: 'Level 1',
                    data: levelDistribution.map(l => l.level1),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: false,
                },
                {
                    label: 'Level 2',
                    data: levelDistribution.map(l => l.level2),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false,
                },
                {
                    label: 'Level 3',
                    data: levelDistribution.map(l => l.level3),
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    fill: false,
                },
                {
                    label: 'Level 4',
                    data: levelDistribution.map(l => l.level4),
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    fill: false,
                },
            ],
        };

        createChart(levelChangesChartCtx, {
            type: 'line',
            data: levelDistributionData,
            options: {
                scales: {
                    x: {
                        ticks: {
                            color: 'silver',
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver',
                        },
                    },
                },
            },
        });

        // Years of Service 데이터 처리
        const currentDate = new Date();
        const yearsOfService = data.map(row => (currentDate - new Date(row.HIRE)) / (1000 * 60 * 60 * 24 * 365.25));
        const serviceRanges = { '1년차': 0, '2년차': 0, '3년차': 0, '4년차': 0, '5년차 이상': 0 };
        yearsOfService.forEach(year => {
            if (year <= 1) serviceRanges['1년차']++;
            else if (year <= 2) serviceRanges['2년차']++;
            else if (year <= 3) serviceRanges['3년차']++;
            else if (year <= 4) serviceRanges['4년차']++;
            else serviceRanges['5년차 이상']++;
        });

        const servicePercentages = Object.values(serviceRanges).map(count => ((count / totalEngineers) * 100).toFixed(2));
        const averageServiceYears = (yearsOfService.reduce((sum, year) => sum + year, 0) / totalEngineers).toFixed(2);

        createChart(yearsOfServiceChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(serviceRanges),
                datasets: [{
                    label: 'Number of Employees',
                    data: Object.values(serviceRanges),
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => `${value} (${servicePercentages[ctx.dataIndex]}%)`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    title: {
                        display: true,
                        text: `Average Years of Service: ${averageServiceYears}`,
                        font: {
                            size: 13
                        },
                        color: 'Yellow' // 제목 색상
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...Object.values(serviceRanges)) * 1.2,
                        ticks: {
                            color: 'silver' // y축 레이블 색상
                        }
                    }
                }
            }
        });

        // Group and Site Distribution 데이터 처리
        const groupSiteCombinations = data.map(row => `${row.GROUP}-${row.SITE}`);
        const groupSiteCounts = groupSiteCombinations.reduce((acc, combination) => {
            acc[combination] = (acc[combination] || 0) + 1;
            return acc;
        }, {});

        const sortedGroupSiteCounts = Object.entries(groupSiteCounts).sort(([, a], [, b]) => b - a);
        const groupSitePercentages = sortedGroupSiteCounts.map(([, count]) => ((count / totalEngineers) * 100).toFixed(2));

        const groupColors = {
            PEE1: 'rgba(54, 162, 235, 0.2)',
            PEE2: 'rgba(75, 192, 192, 0.2)',
            PSKH: 'rgba(255, 159, 64, 0.2)'
        };

        const borderColors = {
            PEE1: 'rgba(54, 162, 235, 1)',
            PEE2: 'rgba(75, 192, 192, 1)',
            PSKH: 'rgba(255, 159, 64, 1)'
        };

        createChart(groupSiteDistributionChartCtx, {
            type: 'bar',
            data: {
                labels: sortedGroupSiteCounts.map(([key]) => key),
                datasets: [{
                    label: 'Number of Employees',
                    data: sortedGroupSiteCounts.map(([, count]) => count),
                    backgroundColor: sortedGroupSiteCounts.map(([key]) => groupColors[key.split('-')[0]]),
                    borderColor: sortedGroupSiteCounts.map(([key]) => borderColors[key.split('-')[0]]),
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => `${value} (${groupSitePercentages[ctx.dataIndex]}%)`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...sortedGroupSiteCounts.map(([, count]) => count)) * 1.2,
                        ticks: {
                            color: 'silver' // y축 레이블 색상
                        }
                    }
                }
            }
        });

        // Average Time to Achieve Levels 데이터 처리
        const timeToAchieveLevels = ['Level1 Achieve', 'Level2 Achieve', 'Level3 Achieve', 'Level4 Achieve'].map(level => {
            const times = data.map(row => row[level] ? (new Date(row[level]) - new Date(row.HIRE)) / (1000 * 60 * 60 * 24) : null)
                .filter(time => time !== null);
            const averageTime = times.length ? (times.reduce((sum, time) => sum + time, 0) / times.length / 365.25).toFixed(2) : 0;
            return averageTime;
        });

        const formatTime = time => {
            const years = Math.floor(time);
            const months = Math.round((time - years) * 12);
            return `${years}Y ${months}M`;
        };

        createChart(averageTimeToAchieveChartCtx, {
            type: 'bar',
            data: {
                labels: ['Level1', 'Level2', 'Level3', 'Level4'],
                datasets: [{
                    label: 'Average Time to Achieve (Years)',
                    data: timeToAchieveLevels,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => formatTime(value),
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver', // y축 레이블 색상
                            callback: function (value) {
                                return `${value}Y`;
                            }
                        },
                        suggestedMax: Math.max(...timeToAchieveLevels.map(parseFloat)) * 1.2,
                    }
                }
            }
        });

        // Monthly CAPA Graph 데이터 처리
        const currentMonth = new Date().getMonth();
        const monthlyCapaLabels = ['24YJAN', '24YFEB', '24YMAR', '24YAPR', '24YMAY', '24YJUN', '24YJUL', '24YAUG', '24YSEP', '24YOCT', '24YNOV', '24YDEC'].slice(0, currentMonth);
        const monthlyCapaData = monthlyCapaLabels.map(label => {
            const capaValues = data.map(row => row[label]).filter(value => value !== null);
            return capaValues.reduce((sum, value) => sum + value, 0) / capaValues.length;
        });

        createChart(monthlyCapaChartCtx, {
            type: 'line',
            data: {
                labels: monthlyCapaLabels.map(label => label.replace('24Y', '')),
                datasets: [{
                    label: 'Monthly CAPA',
                    data: monthlyCapaData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => `${(value * 100).toFixed(2)}%`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver', // y축 레이블 색상
                            callback: function (value) {
                                return `${(value * 100).toFixed(2)}%`;
                            }
                        },
                        suggestedMax: Math.max(...monthlyCapaData) * 1.2,
                    }
                }
            }
        });

        // SET UP CAPA Graph 데이터 처리
        const setupCapaLabels = ['SUPRA N SET UP', 'SUPRA XP SET UP', 'INTEGER SET UP', 'PRECIA SET UP', 'ECOLITE SET UP', 'GENEVA SET UP'];
        const setupCapaData = setupCapaLabels.map(label => {
            const setupValues = data.map(row => row[label]).filter(value => value !== null);
            return setupValues.reduce((sum, value) => sum + value, 0) / setupValues.length;
        });

        createChart(setupCapaChartCtx, {
            type: 'bar',
            data: {
                labels: setupCapaLabels,
                datasets: [{
                    label: 'SET UP CAPA',
                    data: setupCapaData,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => `${(value * 100).toFixed(2)}%`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver', // y축 레이블 색상
                            callback: function (value) {
                                return `${(value * 100).toFixed(2)}%`;
                            }
                        },
                        suggestedMax: Math.max(...setupCapaData) * 1.2,
                    }
                }
            }
        });

        // MAINT CAPA Graph 데이터 처리
        const maintCapaLabels = ['SUPRA N MAINT', 'SUPRA XP MAINT', 'INTEGER MAINT', 'PRECIA MAINT', 'ECOLITE MAINT', 'GENEVA MAINT'];
        const maintCapaData = maintCapaLabels.map(label => {
            const maintValues = data.map(row => row[label]).filter(value => value !== null);
            return maintValues.reduce((sum, value) => sum + value, 0) / maintValues.length;
        });

        createChart(maintCapaChartCtx, {
            type: 'bar',
            data: {
                labels: maintCapaLabels,
                datasets: [{
                    label: 'MAINT CAPA',
                    data: maintCapaData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => `${(value * 100).toFixed(2)}%`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver', // y축 레이블 색상
                            callback: function (value) {
                                return `${(value * 100).toFixed(2)}%`;
                            }
                        },
                        suggestedMax: Math.max(...maintCapaData) * 1.2,
                    }
                }
            }
        });

        // Average CAPA 데이터 처리
        const averageCapaData = [
            data.map(row => row['SET UP CAPA']).filter(value => value !== null).reduce((sum, value) => sum + value, 0) / data.length,
            data.map(row => row['MAINT CAPA']).filter(value => value !== null).reduce((sum, value) => sum + value, 0) / data.length,
            data.map(row => row['MULTI CAPA']).filter(value => value !== null).reduce((sum, value) => sum + value, 0) / data.length,
            data.map(row => row.CAPA).filter(value => value !== null).reduce((sum, value) => sum + value, 0) / data.length
        ];

        createChart(averageCapaChartCtx, {
            type: 'bar',
            data: {
                labels: ['SET UP CAPA', 'MAINT CAPA', 'MULTI CAPA', 'CAPA'],
                datasets: [{
                    label: 'Average CAPA',
                    data: averageCapaData,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => `${(value * 100).toFixed(2)}%`,
                        color: 'white', // 데이터 레이블 색상
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    },
                    legend: {
                        display: false // 범례 숨김
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver', // y축 레이블 색상
                            callback: function (value) {
                                return `${(value * 100).toFixed(2)}%`;
                            }
                        },
                        suggestedMax: Math.max(...averageCapaData) * 1.2,
                    }
                }
            }
        });

        // MPI 데이터 처리 및 차트 생성
        processMpiData(data);
    }

    function processMpiData(data) {
        let totalMpi = 0;
        let multiEngineerCount = 0;
        let equipmentStats = {
            'SUPRA N': { count: 0, engineers: [] },
            'SUPRA XP': { count: 0, engineers: [] },
            'INTEGER': { count: 0, engineers: [] },
            'PRECIA': { count: 0, engineers: [] },
            'ECOLITE': { count: 0, engineers: [] },
            'GENEVA': { count: 0, engineers: [] }
        };

        data.forEach(row => {
            totalMpi += row.MPI;

            if (row.MPI >= 2) {
                multiEngineerCount++;
            }

            if (row['SUPRA N MPI'] === 1) {
                equipmentStats['SUPRA N'].count++;
                equipmentStats['SUPRA N'].engineers.push(row.NAME);
            }
            if (row['SUPRA XP MPI'] === 1) {
                equipmentStats['SUPRA XP'].count++;
                equipmentStats['SUPRA XP'].engineers.push(row.NAME);
            }
            if (row['INTEGER MPI'] === 1) {
                equipmentStats['INTEGER'].count++;
                equipmentStats['INTEGER'].engineers.push(row.NAME);
            }
            if (row['PRECIA MPI'] === 1) {
                equipmentStats['PRECIA'].count++;
                equipmentStats['PRECIA'].engineers.push(row.NAME);
            }
            if (row['ECOLITE MPI'] === 1) {
                equipmentStats['ECOLITE'].count++;
                equipmentStats['ECOLITE'].engineers.push(row.NAME);
            }
            if (row['GENEVA MPI'] === 1) {
                equipmentStats['GENEVA'].count++;
                equipmentStats['GENEVA'].engineers.push(row.NAME);
            }
        });

        const averageMpi = (totalMpi / data.length).toFixed(2);
        const multiEngineerPercentage = ((multiEngineerCount / data.length) * 100).toFixed(2);

        // HTML에 값 출력
        document.getElementById('averageMpi').textContent = averageMpi;
        document.getElementById('multiEngineerCount').textContent = `${multiEngineerCount} (${multiEngineerPercentage}%)`;

        // MPI Distribution Chart 생성
        createChart(mpiDistributionChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(equipmentStats),
                datasets: [{
                    label: 'Number of Engineers',
                    data: Object.values(equipmentStats).map(equip => equip.count),
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(201, 203, 207, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(201, 203, 207, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: 'black',
                        font: {
                            size: 12
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'silver'
                        },
                        title: {
                            display: true,
                            text: 'Number of Engineers'
                        }
                    }
                }
            }
        });
    }


      // 기존 toggleButton 함수에 "Work" 탭 추가
      document.getElementById('showWorkGroup').addEventListener('click', () => {
        toggleButton('showWorkGroup', 'workGroup');
    });


    async function fetchWorkLogs() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs');
            workLogs = response.data; // 작업 이력 데이터를 저장
            return workLogs;
        } catch (error) {
            console.error('Error fetching work logs:', error);
            return [];
        }
    }

    function filterWorkLogData(data) {
        const group = searchGroup.value;
        const site = searchSite.value;
        const taskMan = searchName.value.toLowerCase();
    
        return data.filter(log => {
            const matchesGroup = !group || log.group === group;
            const matchesSite = !site || log.site === site;
            const matchesTaskMan = !taskMan || log.task_man.toLowerCase().includes(taskMan);
            
            return matchesGroup && matchesSite && matchesTaskMan;
        });
    }
    

    function renderWorkCharts(data) {
        // 필터링된 데이터 사용
        const filteredData = filterWorkLogData(data);
        // 1. Monthly Work Time & Count Trend
        const monthlyData = {};
        
        data.forEach(log => {
            const date = new Date(log.task_date);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
            if (!monthlyData[month]) {
                monthlyData[month] = { time: 0, count: 0 };
            }
        
            // task_duration을 분 단위로 변환
            const durationParts = log.task_duration.split(':');
            const workTime = (parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]) + parseInt(durationParts[2]) / 60);
        
            // 작업자의 수를 계산 (예: task_man에 있는 콤마로 구분된 이름의 수)
            const workerCount = log.task_man.split(',').length;
        
            // 작업 시간에 작업자 수를 곱해서 합산
            monthlyData[month].time += workTime * workerCount;
            monthlyData[month].count += 1; // 작업 개수 증가
        });
        
        const months = Object.keys(monthlyData);
        const workTimes = months.map(month => (monthlyData[month].time / 60).toFixed(2)); // hours로 변환
        const workCounts = months.map(month => monthlyData[month].count);
        
        // 최대값 계산
        const maxWorkTime = Math.max(...workTimes.map(Number));
        const maxWorkCount = Math.max(...workCounts);
        
        createChart(workTimeCountTrendChartCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Working Time (hours)',
                        data: workTimes,
                        backgroundColor: 'rgba(54, 162, 235, 0)', // 아래 색상 채우기 없음
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y-time'
                    },
                    {
                        label: 'Task Count',
                        data: workCounts,
                        backgroundColor: 'rgba(255, 99, 132, 0)', // 아래 색상 채우기 없음
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        yAxisID: 'y-count'
                    }
                ]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => value,
                        color: 'white', // 데이터 레이블 색상: 흰색
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    }
                },
                scales: {
                    'y-time': {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        suggestedMax: maxWorkTime * 1.2, // 최대값의 1.2배로 설정
                        ticks: {
                            color: 'silver' // y-time 축 레이블 색상: 회색
                        }
                    },
                    'y-count': {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        suggestedMax: maxWorkCount * 1.2, // 최대값의 1.2배로 설정
                        ticks: {
                            color: 'silver' // y-count 축 레이블 색상: 회색
                        }
                    },
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상: 회색
                        }
                    }
                }
            }
        });
    
        // 2. SET UP, MAINT, RELOCATION Work Ratio
        const workTypeCounts = { SETUP: 0, MAINT: 0, RELOCATION: 0 };
    
        data.forEach(log => {
            // work_type을 공백 제거 및 대문자로 변환하여 처리
            const workType = log.work_type.replace(/\s+/g, '').toUpperCase();
            if (workType === 'SETUP' || workType === 'MAINT' || workType === 'RELOCATION') {
                workTypeCounts[workType] += 1;
            }
        });
        
        const workTypes = ['SETUP', 'MAINT', 'RELOCATION'];
        const counts = workTypes.map(type => workTypeCounts[type]);
        
        // 최대값 계산
        const maxCount = Math.max(...counts);
        
        createChart(workTypeRatioChartCtx, {
            type: 'bar',
            data: {
                labels: workTypes,
                datasets: [{
                    label: 'Work Type Count',
                    data: counts,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 205, 86, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 205, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => value,
                        color: 'white', // 데이터 레이블 색상: 흰색
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상: 회색
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: maxCount * 1.2, // 최대값의 1.2배로 설정
                        ticks: {
                            color: 'silver' // y축 레이블 색상: 회색
                        }
                    }
                }
            }
        });
    
        // 3. Work Count by AM vs PM
        const amPmWorkCounts = { AM: 0, PM: 0 };
    
        data.forEach(log => {
            const startTime = new Date(`1970-01-01T${log.start_time}`);
            if (startTime.getHours() < 12) {
                amPmWorkCounts.AM += 1;
            } else {
                amPmWorkCounts.PM += 1;
            }
        });
        
        const amPmLabels = ['AM', 'PM'];
        const amPmValues = amPmLabels.map(time => amPmWorkCounts[time]);
        
        // 최대값 계산
        const maxTimeCount = Math.max(...amPmValues);
        
        createChart(itemWorkCountChartCtx, {
            type: 'bar',
            data: {
                labels: amPmLabels,
                datasets: [{
                    label: 'Work Time Count',
                    data: amPmValues,
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(54, 162, 235, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => value,
                        color: 'white', // 데이터 레이블 색상: 흰색
                        font: {
                            size: 12
                        },
                        anchor: 'end',
                        align: 'end'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'silver' // x축 레이블 색상: 회색
                        }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: maxTimeCount * 1.2, // 최대값의 1.2배로 설정
                        ticks: {
                            color: 'silver' // y축 레이블 색상: 회색
                        }
                    }
                }
            }
        });
    
        // 4. Overtime vs Regular Work Count
        const overtimeRegularCounts = { Regular: 0, Overtime: 0 };
        
        data.forEach(log => {
            const endTime = new Date(`1970-01-01T${log.end_time}`);
            if (endTime.getHours() < 18) {
                overtimeRegularCounts.Regular += 1;
            } else {
                overtimeRegularCounts.Overtime += 1;
            }
        });
        
        const overtimeRegularLabels = ['Regular', 'Overtime'];
        const overtimeRegularValues = [overtimeRegularCounts.Regular, overtimeRegularCounts.Overtime];
        
        createChart(overtimeRegularChartCtx, {
            type: 'bar',
            data: {
                labels: overtimeRegularLabels,
                datasets: [{
                    label: 'Work Count',
                    data: overtimeRegularValues,
                    backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => value,
                        color: 'white',
                        font: { size: 12 },
                        anchor: 'end',
                        align: 'end'
                    }
                },
                scales: {
                    x: { ticks: { color: 'silver' } },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...overtimeRegularValues) * 1.2,
                        ticks: { color: 'silver' }
                    }
                }
            }
        });
    
        // 5. Time Range Work Count
        const timeRanges = { '0-1 hour': 0, '1-2 hours': 0, '2-3 hours': 0, '3-4 hours': 0, '4+ hours': 0 };
        
        data.forEach(log => {
            const [hours, minutes, seconds] = log.task_duration.split(':').map(Number);
            const totalHours = hours + minutes / 60 + seconds / 3600;
        
            if (totalHours <= 1) {
                timeRanges['0-1 hour'] += 1;
            } else if (totalHours <= 2) {
                timeRanges['1-2 hours'] += 1;
            } else if (totalHours <= 3) {
                timeRanges['2-3 hours'] += 1;
            } else if (totalHours <= 4) {
                timeRanges['3-4 hours'] += 1;
            } else {
                timeRanges['4+ hours'] += 1;
            }
        });
        
        const timeRangeLabels = Object.keys(timeRanges);
        const timeRangeValues = Object.values(timeRanges);
        
        createChart(timeRangeChartCtx, {
            type: 'bar',
            data: {
                labels: timeRangeLabels,
                datasets: [{
                    label: 'Work Count',
                    data: timeRangeValues,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.2)', 
                        'rgba(75, 192, 192, 0.2)', 
                        'rgba(255, 205, 86, 0.2)', 
                        'rgba(255, 159, 64, 0.2)', 
                        'rgba(153, 102, 255, 0.2)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)', 
                        'rgba(75, 192, 192, 1)', 
                        'rgba(255, 205, 86, 1)', 
                        'rgba(255, 159, 64, 1)', 
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            plugins: [ChartDataLabels],
            options: {
                plugins: {
                    datalabels: {
                        formatter: value => value,
                        color: 'white',
                        font: { size: 12 },
                        anchor: 'end',
                        align: 'end'
                    }
                },
                scales: {
                    x: { ticks: { color: 'silver' } },
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...timeRangeValues) * 1.2,
                        ticks: { color: 'silver' }
                    }
                }
            }
        });

        function renderCharts() {
            const group = searchGroup.value;
            const site = searchSite.value;
            const filteredWorkLogs = filterWorkLogData(workLogs);
        
            const { avgWeekdayTasks, avgWeekendTasks } = calculateAverageTasksPerDay(filteredWorkLogs, group, site);
        
            createChart(weekdayWeekendChartCtx, {
                type: 'bar',
                data: {
                    labels: ['Weekday', 'Weekend'],
                    datasets: [{
                        label: 'Average Tasks per Engineer per Day',
                        data: [avgWeekdayTasks.toFixed(2), avgWeekendTasks.toFixed(2)],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                        ],
                        borderWidth: 1
                    }]
                },
                plugins: [ChartDataLabels],
                options: {
                    plugins: {
                        datalabels: {
                            formatter: value => {
                                return typeof value === 'number' ? value.toFixed(2) : value;
                            },
                            color: 'white',
                            font: {
                                size: 12
                            },
                            anchor: 'end',
                            align: 'end'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: 'silver'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            suggestedMax: Math.max(avgWeekdayTasks, avgWeekendTasks) * 1.2,
                            ticks: {
                                color: 'silver'
                            }
                        }
                    }
                }
            });
        }
        
        // 함수 호출 확인
        console.log('Render Charts Function Called');
        renderCharts();
        
        

            // 6. SET UP TASK 그래프
            const setupTaskCounts = {};

            data.forEach(log => {
                if (log.work_type.replace(/\s+/g, '').toUpperCase() === 'SETUP') {
                    const setupItem = log.setup_item;
                    if (setupItem && setupItem.toUpperCase() !== 'SELECT') {
                        setupTaskCounts[setupItem] = (setupTaskCounts[setupItem] || 0) + 1;
                    }
                }
            });
        
            const setupLabels = Object.keys(setupTaskCounts);
            const setupValues = Object.values(setupTaskCounts);
        
            createChart(setupTaskChartCtx, { // setupTaskChartCtx를 사용
                type: 'bar',
                data: {
                    labels: setupLabels,
                    datasets: [{
                        label: 'SET UP Task Count',
                        data: setupValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                plugins: [ChartDataLabels],
                options: {
                    plugins: {
                        datalabels: {
                            formatter: value => value,
                            color: 'white',
                            font: { size: 12 },
                            anchor: 'end',
                            align: 'end'
                        }
                    },
                    scales: {
                        x: { ticks: { color: 'silver' } },
                        y: {
                            beginAtZero: true,
                            suggestedMax: Math.max(...setupValues) * 1.2,
                            ticks: { color: 'silver' }
                        }
                    }
                }
            });

    // 7. MAINT TASK 그래프
    const maintTaskCounts = {};

    data.forEach(log => {
        if (log.work_type.replace(/\s+/g, '').toUpperCase() === 'MAINT') {
            const transferItem = log.transfer_item;
            if (transferItem && transferItem !== '이관항목 없음' && transferItem.toUpperCase() !== 'SELECT') {
                maintTaskCounts[transferItem] = (maintTaskCounts[transferItem] || 0) + 1;
            }
        }
    });

    const maintLabels = Object.keys(maintTaskCounts);
    const maintValues = Object.values(maintTaskCounts);

    createChart(maintTaskChartCtx, { // maintTaskChartCtx를 사용
        type: 'bar',
        data: {
            labels: maintLabels,
            datasets: [{
                label: 'MAINT Task Count',
                data: maintValues,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        plugins: [ChartDataLabels],
        options: {
            plugins: {
                datalabels: {
                    formatter: value => value,
                    color: 'white',
                    font: { size: 12 },
                    anchor: 'end',
                    align: 'end'
                }
            },
            scales: {
                x: { ticks: { color: 'silver' } },
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...maintValues) * 1.2,
                    ticks: { color: 'silver' }
                }
            }
        }
    });

    }
    
    


    renderWorkCharts(workLogs);



    function updateAllCharts() {
        const filteredEngineerData = filterData(originalData); // 기존 엔지니어 데이터 필터링
        renderCharts(filteredEngineerData);
    
        // 작업 로그 데이터 필터링
        const filteredWorkLogs = filterWorkLogData(workLogs);
        renderWorkCharts(filteredWorkLogs);
        renderOvertimeRegularChart(filteredWorkLogs);
        renderTimeRangeChart(filteredWorkLogs);
        renderSetupTaskChart(filteredWorkLogs);
        renderMaintTaskChart(filteredWorkLogs);
    }

    function updateDatalistOptions(data) {
        const uniqueNames = [...new Set(data.map(row => row.NAME))];
        namesDatalist.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
    }

    // 기존 이벤트 리스너에 추가된 필터 연결
    searchButton.addEventListener('click', updateAllCharts);
    resetButton.addEventListener('click', () => {
        searchGroup.value = '';
        searchSite.value = '';
        searchLevel.value = '';
        searchMultiLevel.value = '';
        searchMultiEngr.value = ''; // 추가된 필터 초기화
        searchName.value = '';
        updateAllCharts();
    });

    searchGroup.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchSite.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchLevel.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchMultiLevel.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchMultiEngr.addEventListener('change', () => updateDatalistOptions(filterData(originalData))); // Multi Eng'r 필터 추가

// 데이터 로딩 및 차트 렌더링
const data = await fetchData();
await fetchWorkLogs(); // 작업 이력 데이터 로드
updateDatalistOptions(data);
renderCharts(data);
renderWorkCharts(workLogs); // 작업 이력 데이터 렌더링
});

document.getElementById('exportButton').addEventListener('click', () => {
    window.location.href = 'http://3.37.165.84:3001/api/export-to-excel';
});

  
