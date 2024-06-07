document.addEventListener("DOMContentLoaded", function() {
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
        const site = document.getElementById('filterSite').value;
        const level = document.getElementById('filterLevel').value;
        const nickname = document.getElementById('filterNickname').value;

        try {
            const response = await axios.get('http://3.37.165.84:3001/average-info', {
                headers: { "x-access-token": token },
                params: { group, site, level, nickname }
            });
            const averageInfo = response.data.result || {};
            if (averageInfo) {
                const avgLevel = (typeof averageInfo.avg_level === 'number') ? averageInfo.avg_level.toFixed(2) : 'N/A';
                const totalUsers = (typeof averageInfo.total_users === 'number') ? averageInfo.total_users : 'N/A';

                document.querySelector("#average-data-display").innerHTML = `
                    <div class="info-box">
                        <p><strong>Average Level:</strong> ${avgLevel}</p>
                    </div>
                    <div class="info-box">
                        <p><strong>Total Users:</strong> ${totalUsers}</p>
                    </div>
                `;
                destroyCharts();
                createLevelDistributionChart(averageInfo);
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
        document.getElementById('filterSite').value = '';
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

    function createLevelDistributionChart(averageInfo) {
        const levelCtx = document.getElementById('levelDistributionChart').getContext('2d');

        levelChart = new Chart(levelCtx, {
            type: 'bar',
            data: {
                labels: ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'],
                datasets: [{
                    label: 'Number of Users',
                    data: [
                        averageInfo.level_0 || 0,
                        averageInfo.level_1 || 0,
                        averageInfo.level_2 || 0,
                        averageInfo.level_3 || 0,
                        averageInfo.level_4 || 0
                    ],
                    backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffcd56', '#4bc0c0'],
                    borderColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffcd56', '#4bc0c0'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
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
                        align: 'top',
                        formatter: function(value) {
                            return value;
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
                    backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe'],
                    borderColor: ['#ff6384', '#36a2eb', '#cc65fe'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
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
                        align: 'top',
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
                    backgroundColor: ['#ff9f40', '#4bc0c0', '#9966ff'],
                    borderColor: ['#ff9f40', '#4bc0c0', '#9966ff'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
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
                        align: 'top',
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
                    backgroundColor: ['#ffcd56'],
                    borderColor: ['#ffcd56'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
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
                        align: 'top',
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

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token"); // JWT 토큰 삭제
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }

    loadAverageInfo(); // 페이지 로드 시 평균 정보 불러오기
});
