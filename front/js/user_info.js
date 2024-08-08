// user_info.js
document.addEventListener('DOMContentLoaded', async () => {
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('userName');
    const userHireDate = document.getElementById('userHireDate');
    const userGroup = document.getElementById('userGroup');
    const userSite = document.getElementById('userSite');

    try {
        const token = localStorage.getItem('x-access-token');
        const response = await fetch('http://3.37.165.84:3001/user-info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const user = await response.json();

        userName.textContent = user.result.NAME;
        userHireDate.textContent = new Date(user.result.HIRE_DATE).toISOString().split('T')[0];
        userGroup.textContent = user.result.GROUP;
        userSite.textContent = user.result.SITE;

        userInfo.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
});
