document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const searchGroup = document.getElementById('searchGroup');
    const searchSite = document.getElementById('searchSite');
    const searchLevel = document.getElementById('searchLevel');
    const searchNickname = document.getElementById('searchNickname');
    const searchResults = document.getElementById('search-results');
    const averageStats = document.getElementById('average-stats');
    const token = localStorage.getItem("x-access-token");

    searchButton.addEventListener('click', async () => {
        const group = searchGroup.value;
        const site = searchSite.value;
        const level = searchLevel.value;
        const nickname = searchNickname.value;

        try {
            const response = await axios.get('http://3.37.165.84:3001/search-users', {
                headers: { "x-access-token": token },
                params: { group, site, level, nickname }
            });

            if (response.data.isSuccess) {
                const users = response.data.result.users;
                const avgStats = response.data.result.averageStats;

                displaySearchResults(users);
                displayAverageStats(avgStats);
            } else {
                alert("검색 결과를 가져오는 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("검색 중 오류 발생:", error);
        }
    });

    resetButton.addEventListener('click', () => {
        searchGroup.value = '';
        searchSite.value = '';
        searchLevel.value = '';
        searchNickname.value = '';
        searchResults.innerHTML = '';
        averageStats.innerHTML = '';
    });

    function displaySearchResults(users) {
        searchResults.innerHTML = users.map(user => `
            <div class="user-card">
                <p>ID: ${user.userID}</p>
                <p>Nickname: ${user.nickname}</p>
                <p>Group: ${user.group}</p>
                <p>Site: ${user.site}</p>
                <p>Level: ${user.level}</p>
                <p>Hire Date: ${formatDate(user.hire_date)}</p>
                <p>Main Set Up CAPA: ${user.main_set_up_capa}</p>
                <p>Main Maint CAPA: ${user.main_maint_capa}</p>
                <p>Main CAPA: ${user.main_capa}</p>
                <p>Multi Set Up CAPA: ${user.multi_set_up_capa}</p>
                <p>Multi Maint CAPA: ${user.multi_maint_capa}</p>
                <p>Multi CAPA: ${user.multi_capa}</p>
                <p>Total CAPA: ${user.total_capa}</p>
            </div>
        `).join('');
    }

    function displayAverageStats(stats) {
        averageStats.innerHTML = `
            <h3>Average Stats</h3>
            <p>Average Tenure: ${stats.average_tenure} days</p>
            <p>Average Level: ${stats.average_level}</p>
            <p>Average Main Set Up CAPA: ${stats.average_main_set_up_capa}</p>
            <p>Average Main Maint CAPA: ${stats.average_main_maint_capa}</p>
            <p>Average Main CAPA: ${stats.average_main_capa}</p>
            <p>Average Multi Set Up CAPA: ${stats.average_multi_set_up_capa}</p>
            <p>Average Multi Maint CAPA: ${stats.average_multi_maint_capa}</p>
            <p>Average Multi CAPA: ${stats.average_multi_capa}</p>
            <p>Average Total CAPA: ${stats.average_total_capa}</p>
        `;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});
