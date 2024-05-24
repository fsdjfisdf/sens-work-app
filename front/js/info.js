document.addEventListener("DOMContentLoaded", function() {
    loadUserInfo();
  
    function loadUserInfo() {
      const token = localStorage.getItem("x-access-token");
      if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
      }
  
      axios.get('http://3.37.165.84:3001/user-info', {
        headers: { "x-access-token": token }
      }).then(response => {
        const userInfo = response.data.result;
        if (userInfo) {
          document.querySelector(".inner").innerHTML = `
            <h2>정보 조회</h2>
            <p>아이디: ${userInfo.userID}</p>
            <p>닉네임: ${userInfo.nickname}</p>
            <p>그룹: ${userInfo.group}</p>
            <p>사이트: ${userInfo.site}</p>
            <p>레벨: ${userInfo.level}</p>
            <p>입사일: ${userInfo.hire_date}</p>
            <p>Main Set Up CAPA: ${userInfo.main_set_up_capa}</p>
            <p>Main Maint CAPA: ${userInfo.main_maint_capa}</p>
            <p>Main CAPA: ${userInfo.main_capa}</p>
            <p>Multi Set Up CAPA: ${userInfo.multi_set_up_capa}</p>
            <p>Multi Maint CAPA: ${userInfo.multi_maint_capa}</p>
            <p>Multi CAPA: ${userInfo.multi_capa}</p>
            <p>Total CAPA: ${userInfo.total_capa}</p>
          `;
        } else {
          alert("유저 정보를 가져올 수 없습니다.");
        }
      }).catch(error => {
        console.error("사용자 정보를 로드하는 중 오류 발생:", error);
        alert("사용자 정보를 로드하는 중 오류가 발생했습니다.");
      });
    }
  });
  