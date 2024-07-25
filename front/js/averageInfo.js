document.addEventListener("DOMContentLoaded", async function() {
    const token = localStorage.getItem("x-access-token");

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    const filterButton = document.getElementById('filterButton');
    const resetButton = document.getElementById('resetButton');
    filterButton.addEventListener('click', loadAverageInfo);
    resetButton.addEventListener('click', resetFilters);

    let levelChart, mainCapaChart, multiCapaChart, totalCapaChart, tenureChart;

    async function loadAverageInfo() {
        const group = document.getElementById('filterGroup').value;
        const site = Array.from(document.getElementById('filterSite').selectedOptions).map(option => option.value).join(',');
        const level = document.getElementById('filterLevel').value;
        const nickname = document.getElementById('filterNickname').value;

        try {
            const response = await axios.get('http://3.37.165.84:3001/average-info', {
                headers: { "x-access-token": token },
                params: { group, site, level, nickname }
            });
            const averageInfo = response.data.result || {};
            if (averageInfo.length > 0) {
                const totalUsers = averageInfo[0].total_users || 0;

                // 레벨별 사용자 수
                const levelCounts = {
                    0: parseInt(averageInfo[0].level_0) || 0,
                    1: parseInt(averageInfo[0].level_1) || 0,
                    2: parseInt(averageInfo[0].level_2) || 0,
                    3: parseInt(averageInfo[0].level_3) || 0,
                    4: parseInt(averageInfo[0].level_4) || 0
                };

                // 평균 레벨 계산
                const totalLevels = Object.entries(levelCounts).reduce((sum, [level, count]) => {
                    const levelValue = parseInt(level);
                    const levelContribution = levelValue * count;
                    return sum + levelContribution;
                }, 0);
                const totalLevelUsers = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
                const avgLevel = totalLevelUsers > 0 ? (totalLevels / totalLevelUsers).toFixed(2) : 'N/A';

                // 근속 기간 계산
                const tenureCounts = {
                    '0-1': 0,
                    '1-2': 0,
                    '2-3': 0,
                    '3-4': 0,
                    '4-5': 0,
                    '5+': 0
                };

                averageInfo.forEach(user => {
                    const tenure = user.tenure;
                    if (tenure < 1) {
                        tenureCounts['0-1']++;
                    } else if (tenure < 2) {
                        tenureCounts['1-2']++;
                    } else if (tenure < 3) {
                        tenureCounts['2-3']++;
                    } else if (tenure < 4) {
                        tenureCounts['3-4']++;
                    } else if (tenure < 5) {
                        tenureCounts['4-5']++;
                    } else {
                        tenureCounts['5+']++;
                    }
                });

                document.querySelector("#average-data-display").innerHTML = `
                    <div class="info-box">
                        <p><strong>Average Level:</strong> ${avgLevel}</p>
                    </div>
                    <div class="info-box">
                        <p><strong>Total Users:</strong> ${totalUsers}</p>
                    </div>
                `;
                destroyCharts();
                createLevelDistributionChart(levelCounts);
                createAverageCapaCharts(averageInfo[0]);
                createTenureChart(tenureCounts);
            } else {
                alert("평균 정보를 가져올 수 없습니다.");
            }
        } catch (error) {
            console.error("평균 정보를 로드하는 중 오류 발생:", error);
        }
    }

    function resetFilters() {
        document.getElementById('filterGroup').value = '';
        document.getElementById('filterSite').selectedIndex = -1; // reset multiple select
        document.getElementById('filterLevel').value = '';
        document.getElementById('filterNickname').value = '';
        loadAverageInfo();
    }

    function destroyCharts() {
        if (levelChart) levelChart.destroy();
        if (mainCapaChart) mainCapaChart.destroy();
        if (multiCapaChart) multiCapaChart.destroy();
        if (totalCapaChart) totalCapaChart.destroy();
        if (tenureChart) tenureChart.destroy();
    }

    function createLevelDistributionChart(levelCounts) {
        const levelCtx = document.getElementById('levelDistributionChart').getContext('2d');

        levelChart = new Chart(levelCtx, {
            type: 'doughnut',
            data: {
                labels: ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'],
                datasets: [{
                    label: 'Number of Users',
                    data: [
                        levelCounts[0],
                        levelCounts[1],
                        levelCounts[2],
                        levelCounts[3],
                        levelCounts[4]
                    ],
                    backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(54, 162, 235, 0.6)'],
                    borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 205, 86, 1)', 'rgba(54, 162, 235, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return tooltipItem.label + ': ' + tooltipItem.raw + ' users';
                            }
                        }
                    },
                    datalabels: {
                        formatter: (value, ctx) => {
                            let sum = 0;
                            const dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.forEach(data => {
                                sum += data;
                            });
                            const percentage = ((value * 100) / sum).toFixed(2) + "%";
                            return percentage;
                        },
                        color: '#fff',
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function createAverageCapaCharts(averageInfo) {
        const mainCtx = document.getElementById('averageMainCapaChart').getContext('2d');
        const multiCtx = document.getElementById('averageMultiCapaChart').getContext('2d');
        const totalCtx = document.getElementById('averageTotalCapaChart').getContext('2d');

        mainCapaChart = new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Main Set Up CAPA', 'Main Maint CAPA', 'Main CAPA'],
                datasets: [{
                    label: 'Average Main CAPA',
                    data: [
                        (typeof averageInfo.avg_main_set_up_capa === 'number') ? averageInfo.avg_main_set_up_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_main_maint_capa === 'number') ? averageInfo.avg_main_maint_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_main_capa === 'number') ? averageInfo.avg_main_capa.toFixed(2) : 0
                    ],
                    backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                    borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'right',
                        formatter: function(value) {
                            return value + '%';
                        },
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        multiCapaChart = new Chart(multiCtx, {
            type: 'bar',
            data: {
                labels: ['Multi Set Up CAPA', 'Multi Maint CAPA', 'Multi CAPA'],
                datasets: [{
                    label: 'Average Multi CAPA',
                    data: [
                        (typeof averageInfo.avg_multi_set_up_capa === 'number') ? averageInfo.avg_multi_set_up_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_multi_maint_capa === 'number') ? averageInfo.avg_multi_maint_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_multi_capa === 'number') ? averageInfo.avg_multi_capa.toFixed(2) : 0
                    ],
                    backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                    borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'right',
                        formatter: function(value) {
                            return value + '%';
                        },
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        totalCapaChart = new Chart(totalCtx, {
            type: 'bar',
            data: {
                labels: ['Total CAPA'],
                datasets: [{
                    label: 'Average Total CAPA',
                    data: [
                        (typeof averageInfo.avg_total_capa === 'number') ? averageInfo.avg_total_capa.toFixed(2) : 0
                    ],
                    backgroundColor: ['rgba(153, 102, 255, 0.6)'],
                    borderColor: ['rgba(153, 102, 255, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'right',
                        formatter: function(value) {
                            return value + '%';
                        },
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    function createTenureChart(tenureCounts) {
        const tenureCtx = document.getElementById('tenureDistributionChart').getContext('2d');

        tenureChart = new Chart(tenureCtx, {
            type: 'bar',
            data: {
                labels: ['0-1 years', '1-2 years', '2-3 years', '3-4 years', '4-5 years', '5+ years'],
                datasets: [{
                    label: 'Number of Users',
                    data: [
                        tenureCounts['0-1'],
                        tenureCounts['1-2'],
                        tenureCounts['2-3'],
                        tenureCounts['3-4'],
                        tenureCounts['4-5'],
                        tenureCounts['5+']
                    ],
                    backgroundColor: ['rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(201, 203, 207, 0.6)'],
                    borderColor: ['rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 205, 86, 1)', 'rgba(54, 162, 235, 1)', 'rgba(201, 203, 207, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'right',
                        formatter: function(value) {
                            return value + ' users';
                        },
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    loadAverageInfo(); // 페이지 로드 시 평균 정보 불러오기
});
