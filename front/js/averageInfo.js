document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("x-access-token");

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    loadAverageInfo();

    function loadAverageInfo() {
        axios.get('http://3.37.165.84:3001/average-info', {
            headers: { "x-access-token": token }
        }).then(response => {
            const averageInfo = response.data.result;
            if (averageInfo) {
                document.querySelector("#average-data-display").innerHTML = `
                    <p>Average Level: ${averageInfo.avg_level.toFixed(2)}</p>
                    <p>Total Users: ${averageInfo.total_users}</p>
                `;
                createLevelDistributionChart(averageInfo);
                createAverageCapaCharts(averageInfo);
            } else {
                alert("평균 정보를 가져올 수 없습니다.");
            }
        }).catch(error => {
            console.error("평균 정보를 로드하는 중 오류 발생:", error);
        });
    }

    function createLevelDistributionChart(averageInfo) {
        const levelCtx = document.getElementById('levelDistributionChart').getContext('2d');

        new Chart(levelCtx, {
            type: 'bar',
            data: {
                labels: ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'],
                datasets: [{
                    label: 'Number of Users',
                    data: [averageInfo.level_0, averageInfo.level_1, averageInfo.level_2, averageInfo.level_3, averageInfo.level_4],
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
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw;
                            }
                        }
                    }
                }
            }
        });
    }

    function createAverageCapaCharts(averageInfo) {
        const mainCtx = document.getElementById('averageMainCapaChart').getContext('2d');
        const multiCtx = document.getElementById('averageMultiCapaChart').getContext('2d');
        const totalCtx = document.getElementById('averageTotalCapaChart').getContext('2d');

        new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Main Set Up CAPA', 'Main Maint CAPA', 'Main CAPA'],
                datasets: [{
                    label: 'Average Main CAPA',
                    data: [averageInfo.avg_main_set_up_capa, averageInfo.avg_main_maint_capa, averageInfo.avg_main_capa],
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
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '%';
                            }
                        }
                    }
                }
            }
        });

        new Chart(multiCtx, {
            type: 'bar',
            data: {
                labels: ['Multi Set Up CAPA', 'Multi Maint CAPA', 'Multi CAPA'],
                datasets: [{
                    label: 'Average Multi CAPA',
                    data: [averageInfo.avg_multi_set_up_capa, averageInfo.avg_multi_maint_capa, averageInfo.avg_multi_capa],
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
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '%';
                            }
                        }
                    }
                }
            }
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
});
