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

    let levelChart, mainCapaChart, multiCapaChart, totalCapaChart;

    async function loadAverageInfo() {
        const group = document.getElementById('filterGroup').value;
        const site = Array.from(document.getElementById('filterSite').selectedOptions).map(option => option.value).join(',');
        const level = document.getElementById('filterLevel').value;
        const nickname = document.getElementById('filterNickname').value;

        try {
            const response = await axios.get('http://3.37.73.151:3001/average-info', {
                headers: { "x-access-token": token },
                params: { group, site, level, nickname }
            });
            const averageInfo = response.data.result || {};
            if (averageInfo) {
                const totalUsers = averageInfo.total_users || 0;

                // 레벨별 사용자 수
                const levelCounts = {
                    0: parseInt(averageInfo.level_0) || 0,
                    1: parseInt(averageInfo.level_1) || 0,
                    2: parseInt(averageInfo.level_2) || 0,
                    3: parseInt(averageInfo.level_3) || 0,
                    4: parseInt(averageInfo.level_4) || 0
                };

                const totalLevels = Object.entries(levelCounts).reduce((sum, [level, count]) => {
                    const levelValue = parseInt(level);
                    const levelContribution = levelValue * count;
                    return sum + levelContribution;
                }, 0);
                const totalLevelUsers = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
                const avgLevel = totalLevelUsers > 0 ? (totalLevels / totalLevelUsers).toFixed(2) : 'N/A';

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
                createAverageCapaCharts(averageInfo);
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
    }

    function createLevelDistributionChart(levelCounts) {
        const levelCtx = document.getElementById('levelDistributionChart').getContext('2d');

        levelChart = new Chart(levelCtx, {
            type: 'doughnut',
            data: {
                labels: ['Lv.0', 'Lv.1', 'Lv.2', 'Lv.3', 'Lv.4'],
                datasets: [{
                    label: 'Number of Users',
                    data: [
                        levelCounts[0],
                        levelCounts[1],
                        levelCounts[2],
                        levelCounts[3],
                        levelCounts[4]
                    ],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(201, 203, 207, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(201, 203, 207, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 2
                }]
            },
            options: {
                aspectRatio: 0.9, // 원하는 비율로 조정
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
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
                        color: '#333', // 라벨 색상을 어두운 회색으로 변경
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        document.getElementById('levelDistributionChart').addEventListener('click', () => {
            showModal(levelChart);
        });
    }

    function createAverageCapaCharts(averageInfo) {
        const mainCtx = document.getElementById('averageMainCapaChart').getContext('2d');
        const multiCtx = document.getElementById('averageMultiCapaChart').getContext('2d');
        const totalCtx = document.getElementById('averageTotalCapaChart').getContext('2d');

        mainCapaChart = new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Set Up', 'Maint', 'CAPA'],
                datasets: [{
                    label: 'Average Main CAPA',
                    data: [
                        (typeof averageInfo.avg_main_set_up_capa === 'number') ? averageInfo.avg_main_set_up_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_main_maint_capa === 'number') ? averageInfo.avg_main_maint_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_main_capa === 'number') ? averageInfo.avg_main_capa.toFixed(2) : 0
                    ],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
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
                        },
                        color: '#333' // 라벨 색상을 어두운 회색으로 변경
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        multiCapaChart = new Chart(multiCtx, {
            type: 'bar',
            data: {
                labels: ['Set Up', 'Maint', 'CAPA'],
                datasets: [{
                    label: 'Average Multi CAPA',
                    data: [
                        (typeof averageInfo.avg_multi_set_up_capa === 'number') ? averageInfo.avg_multi_set_up_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_multi_maint_capa === 'number') ? averageInfo.avg_multi_maint_capa.toFixed(2) : 0,
                        (typeof averageInfo.avg_multi_capa === 'number') ? averageInfo.avg_multi_capa.toFixed(2) : 0
                    ],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
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
                        },
                        color: '#333' // 라벨 색상을 어두운 회색으로 변경
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        totalCapaChart = new Chart(totalCtx, {
            type: 'bar',
            data: {
                labels: ['CAPA'],
                datasets: [{
                    label: 'Average Total CAPA',
                    data: [
                        (typeof averageInfo.avg_total_capa === 'number') ? averageInfo.avg_total_capa.toFixed(2) : 0
                    ],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)'],
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
                        },
                        color: '#333' // 라벨 색상을 어두운 회색으로 변경
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        document.getElementById('averageMainCapaChart').addEventListener('click', () => {
            showModal(mainCapaChart);
        });
        document.getElementById('averageMultiCapaChart').addEventListener('click', () => {
            showModal(multiCapaChart);
        });
        document.getElementById('averageTotalCapaChart').addEventListener('click', () => {
            showModal(totalCapaChart);
        });
    }

    function showModal(chartInstance) {
        const modal = document.getElementById('modal');
        const modalContent = document.querySelector('.modal-content');
        const ctx = document.getElementById('modalChart').getContext('2d');

        modal.style.display = 'flex'; // Display the modal as a flex container

        new Chart(ctx, {
            type: chartInstance.config.type,
            data: chartInstance.data,
            options: chartInstance.options
        });

        modalContent.querySelector('.close').onclick = function() {
            modal.style.display = 'none';
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        };

        // Add an event listener to close the modal when clicking outside the modal content
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        };
    }

    loadAverageInfo(); // 페이지 로드 시 평균 정보 불러오기
});
