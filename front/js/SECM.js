document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }
    
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
    const monthlyCapaChange = document.getElementById('monthlyCapaChange');

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

        return data.filter(row => {
            return (
                (!group || row.GROUP === group) &&
                (!site || row.SITE === site) &&
                (!level || row.LEVEL == level) &&
                (!multiLevel || row['MULTI LEVEL'] == multiLevel) &&
                (!name || row.NAME.toLowerCase().includes(name))
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
    
    function getMonthIndex(date) {
        const startYear = 2023;
        return (date.getFullYear() - startYear) * 12 + date.getMonth();
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
                            size:13
                    
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
                            size:13
                    
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
                            size:13
                    
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
    }

    function updateCharts() {
        const filteredData = filterData(originalData);
        renderCharts(filteredData);
    }

    function updateDatalistOptions(data) {
        const uniqueNames = [...new Set(data.map(row => row.NAME))];
        namesDatalist.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
    }

    searchButton.addEventListener('click', updateCharts);
    resetButton.addEventListener('click', () => {
        searchGroup.value = '';
        searchSite.value = '';
        searchLevel.value = '';
        searchMultiLevel.value = '';
        searchName.value = '';
        updateCharts();
    });

    searchGroup.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchSite.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchLevel.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));
    searchMultiLevel.addEventListener('change', () => updateDatalistOptions(filterData(originalData)));

    const data = await fetchData();
    updateDatalistOptions(data);
    renderCharts(data);
});
