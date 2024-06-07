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
                    <p>Average Main CAPA: ${averageInfo.avg_main_capa.toFixed(2)}%</p>
                    <p>Average Multi CAPA: ${averageInfo.avg_multi_capa.toFixed(2)}%</p>
                    <p>Average Total CAPA: ${averageInfo.avg_total_capa.toFixed(2)}%</p>
                `;
                createAverageCapaCharts(averageInfo);
            } else {
                alert("평균 정보를 가져올 수 없습니다.");
            }
        }).catch(error => {
            console.error("평균 정보를 로드하는 중 오류 발생:", error);
        });
    }

    function createAverageCapaCharts(averageInfo) {
        const mainCtx = document.getElementById('averageMainCapaChart').getContext('2d');
        const multiCtx = document.getElementById('averageMultiCapaChart').getContext('2d');
        const totalCtx = document.getElementById('averageTotalCapaChart').getContext('2d');

        new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Average Main Set Up CAPA', 'Average Main Maint CAPA', 'Average Main CAPA'],
                datasets: [{
                    label: 'Average Main CAPA',
                    data: [averageInfo.avg_main_capa, averageInfo.avg_main_capa, averageInfo.avg_main_capa],
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
                labels: ['Average Multi Set Up CAPA', 'Average Multi Maint CAPA', 'Average Multi CAPA'],
                datasets: [{
                    label: 'Average Multi CAPA',
                    data: [averageInfo.avg_multi_capa, averageInfo.avg_multi_capa, averageInfo.avg_multi_capa],
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

        new Chart(totalCtx, {
            type: 'bar',
            data: {
                labels: ['Average Total CAPA'],
                datasets: [{
                    label: 'Average Total CAPA',
                    data: [averageInfo.avg_total_capa],
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
