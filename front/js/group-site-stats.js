document.addEventListener('DOMContentLoaded', async () => {
    const ENGINEER_WORK_HOURS_PER_DAY = 3.5;
    let logs = [];
    let engineers = [];

    // 사용자 로그인 상태를 확인하는 함수
    function checkLogin() {
        const token = localStorage.getItem('x-access-token');
        if (!token) {
            alert("로그인이 필요합니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
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
            console.log('Engineers data:', response.data); // 데이터를 확인하기 위해 콘솔에 출력
            engineers = Array.isArray(response.data.result) ? response.data.result : [];
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
            console.log('Logs data:', response.data); // 데이터를 확인하기 위해 콘솔에 출력
            logs = response.data;
            displayOverallStats();
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

    function displayOverallStats() {
        const stats = {};
        const dates = {};

        logs.forEach(log => {
            const key = `${log.group} ${log.site}`;
            if (!stats[key]) {
                stats[key] = 0;
                dates[key] = new Set();
            }
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const totalMinutes = (hours * 60) + minutes;
            stats[key] += totalMinutes;
            dates[key].add(log.task_date);
        });

        const overallStatsContent = document.getElementById('overall-stats-content');
        overallStatsContent.innerHTML = '';

        for (const [key, totalMinutes] of Object.entries(stats)) {
            const uniqueDates = dates[key].size;
            const [group, site] = key.split(' ');
            const totalEngineers = engineers.filter(engineer => engineer.group === group && engineer.site === site).length;

            console.log(`Group: ${group}, Site: ${site}, Total Engineers: ${totalEngineers}`); // 디버그를 위해 출력

            if (totalEngineers > 0) {
                const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const requiredEngineers = (totalMinutes / uniqueDates) / (ENGINEER_WORK_HOURS_PER_DAY * 60);
                const statDiv = document.createElement('div');
                statDiv.innerHTML = `
                    <p><strong>${key}</strong></p>
                    <p>Total Worktime: ${hours}시간 ${minutes}분</p>
                    <p>Required Engineers (Avg/day): ${requiredEngineers.toFixed(2)}명</p>
                    <p>Total Engineers: ${totalEngineers}명</p>
                    <p>Operation Rate: ${operationRate.toFixed(2)}%</p>
                `;
                overallStatsContent.appendChild(statDiv);
            }
        }
    }

    document.getElementById('searchButton').addEventListener('click', () => {
        const searchGroup = document.getElementById('searchGroup').value;
        const searchSite = document.getElementById('searchSite').value;
        const searchStartDate = document.getElementById('searchStartDate').value;
        const searchEndDate = document.getElementById('searchEndDate').value;

        const filteredLogs = logs.filter(log => {
            const logDate = formatDate(log.task_date);
            return (
                (searchGroup === '' || log.group === searchGroup) &&
                (searchSite === '' || log.site === searchSite) &&
                (searchStartDate === '' || logDate >= searchStartDate) &&
                (searchEndDate === '' || logDate <= searchEndDate)
            );
        });

        displayFilteredStats(filteredLogs, searchGroup, searchSite);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('searchGroup').value = '';
        document.getElementById('searchSite').value = '';
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        displayOverallStats();
    });

    function displayFilteredStats(filteredLogs, group, site) {
        const stats = {};
        const dates = {};

        filteredLogs.forEach(log => {
            const key = `${log.group} ${log.site}`;
            if (!stats[key]) {
                stats[key] = 0;
                dates[key] = new Set();
            }
            const durationParts = log.task_duration.split(':');
            const hours = parseInt(durationParts[0], 10);
            const minutes = parseInt(durationParts[1], 10);
            const totalMinutes = (hours * 60) + minutes;
            stats[key] += totalMinutes;
            dates[key].add(log.task_date);
        });

        const overallStatsContent = document.getElementById('overall-stats-content');
        overallStatsContent.innerHTML = '';

        for (const [key, totalMinutes] of Object.entries(stats)) {
            const uniqueDates = dates[key].size;
            const [group, site] = key.split(' ');
            const totalEngineers = engineers.filter(engineer => engineer.group === group && engineer.site === site).length;

            console.log(`Group: ${group}, Site: ${site}, Total Engineers: ${totalEngineers}`); // 디버그를 위해 출력

            if (totalEngineers > 0) {
                const operationRate = calculateOperationRate(totalMinutes, uniqueDates, totalEngineers);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                const requiredEngineers = (totalMinutes / uniqueDates) / (ENGINEER_WORK_HOURS_PER_DAY * 60);
                const statDiv = document.createElement('div');
                statDiv.innerHTML = `
                    <p><strong>${key}</strong></p>
                    <p>Total Worktime: ${hours}시간 ${minutes}분</p>
                    <p>Required Engineers (Avg/day): ${requiredEngineers.toFixed(2)}명</p>
                    <p>Total Engineers: ${totalEngineers}명</p>
                    <p>Operation Rate: ${operationRate.toFixed(2)}%</p>
                `;
                overallStatsContent.appendChild(statDiv);
            }
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 로그인 상태를 확인하고, 로그인되어 있지 않으면 로그인 페이지로 리디렉션
    if (checkLogin()) {
        await loadEngineers();
        await loadWorkLogs();
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
