document.addEventListener('DOMContentLoaded', async () => {
    const userName = document.getElementById('userName');
    const userGroup = document.getElementById('userGroup');
    const userSite = document.getElementById('userSite');
    const userHireDate = document.getElementById('userHireDate');
    const userLevel = document.getElementById('userLevel');
    const userMultiLevel = document.getElementById('userMultiLevel');
    const personInfo = document.getElementById('user-info');
  
    const token = localStorage.getItem('x-access-token');
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return;
    }
  
    try {
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
  
      const data = await response.json();
      if (data.isSuccess) {
        const userInfo = data.result;
        userName.textContent = `Name: ${userInfo.NAME}`;
        userGroup.textContent = `Group: ${userInfo.GROUP}`;
        userSite.textContent = `Site: ${userInfo.SITE}`;
        userHireDate.textContent = `Hire Date: ${new Date(userInfo.HIRE).toLocaleDateString()}`;
        userLevel.textContent = `Level: ${userInfo.LEVEL}`;
        userMultiLevel.textContent = `Multi Level: ${userInfo['MULTI LEVEL']}`;
        // 다른 필요한 정보들도 추가
      } else {
        alert('사용자 정보를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      alert('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    }
  });
  