document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("x-access-token");

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    loadUserInfo();

    function loadUserInfo() {
        axios.get('http://3.37.165.84:3001/user-info', {
            headers: { "x-access-token": token }
        }).then(response => {
            const userInfo = response.data.result;
            if (userInfo) {
                const formattedHireDate = formatDate(userInfo.hire_date);
                document.querySelector("#data-display").innerHTML = `
                    <p>Name: ${userInfo.nickname}</p>
                    <p>Group: ${userInfo.group}</p>
                    <p>Site: ${userInfo.site}</p>
                    <p>Level: ${userInfo.level}</p>
                    <p>Hire date: ${formattedHireDate}</p>
                `;
                loadWorkLogs(userInfo.nickname);
                createCapaCharts(userInfo);
                document.querySelector(".nickname").textContent = userInfo.nickname;
                document.querySelector(".unsigned").classList.add("hidden");
                document.querySelector(".signed").classList.remove("hidden");
            } else {
                alert("유저 정보를 가져올 수 없습니다.");
            }
        }).catch(error => {
            console.error("사용자 정보를 로드하는 중 오류 발생:", error);
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function loadWorkLogs(nickname) {
        axios.get(`http://3.37.165.84:3001/worklogs/${nickname}`)
            .then(response => {
                const workLogs = response.data;
                let totalHours = 0;

                workLogs.forEach(log => {
                    const startTime = new Date(`1970-01-01T${log.start_time}`);
                    const endTime = new Date(`1970-01-01T${log.end_time}`);
                    const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
                    totalHours += hoursWorked;
                });

                document.querySelector("#total-hours").textContent = totalHours.toFixed(2);
                document.querySelector("#total-logs").textContent = workLogs.length;
                displayWorkLogs(workLogs);
            })
            .catch(error => {
                console.error("작업 이력을 로드하는 중 오류 발생:", error);
            });
    }

    function displayWorkLogs(workLogs) {
        const workLogTable = document.getElementById('work-log-table');
        workLogTable.innerHTML = '';

        workLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(log.task_date)}</td>
                <td>${log.task_name}</td>
                <td>${log.start_time}</td>
                <td>${log.end_time}</td>
                <td>${log.task_description}</td>
            `;
            workLogTable.appendChild(row);
        });
    }

    function createCapaCharts(userInfo) {
        const mainCtx = document.getElementById('mainCapaChart').getContext('2d');
        const multiCtx = document.getElementById('multiCapaChart').getContext('2d');
        const totalCtx = document.getElementById('totalCapaChart').getContext('2d');

        new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Main Set Up CAPA', 'Main Maint CAPA', 'Main CAPA'],
                datasets: [{
                    label: 'Main CAPA',
                    data: [userInfo.main_set_up_capa, userInfo.main_maint_capa, userInfo.main_capa],
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
                    label: 'Multi CAPA',
                    data: [userInfo.multi_set_up_capa, userInfo.multi_maint_capa, userInfo.multi_capa],
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
                labels: ['Total CAPA'],
                datasets: [{
                    label: 'Total CAPA',
                    data: [userInfo.total_capa],
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
