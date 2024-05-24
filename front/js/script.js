document.addEventListener("DOMContentLoaded", function() {
    loadUserInfo();
  
    document.getElementById("sign-out").addEventListener("click", function() {
      localStorage.removeItem("x-access-token");
      window.location.replace("./signin.html");
    });
  });
  
  function loadUserInfo() {
    const token = localStorage.getItem("x-access-token");
    if (!token) {
      document.querySelector(".unsigned").classList.remove("hidden");
      document.querySelector(".signed").classList.add("hidden");
      return;
    }
  
    axios.get('http://3.37.165.84:3001/jwt', {
      headers: { "x-access-token": token }
    }).then(response => {
      const userInfo = response.data.result;
      if (userInfo) {
        document.querySelector(".unsigned").classList.add("hidden");
        document.querySelector(".signed").classList.remove("hidden");
        document.querySelector(".nickname").innerText = userInfo.nickname;
      } else {
        document.querySelector(".unsigned").classList.remove("hidden");
        document.querySelector(".signed").classList.add("hidden");
      }
    }).catch(error => {
      console.error("사용자 정보를 로드하는 중 오류 발생:", error);
    });
  }
  
  function loadUserProfile() {
    const token = localStorage.getItem("x-access-token");
    axios.get('http://3.37.165.84:3001/user-info', {
      headers: { "x-access-token": token }
    }).then(response => {
      const userInfo = response.data.result;
      if (userInfo) {
        document.getElementById("user-info").innerHTML = `
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
        document.getElementById("user-info").innerText = "유저 정보를 가져올 수 없습니다.";
      }
    }).catch(error => {
      console.error("사용자 정보를 로드하는 중 오류 발생:", error);
    });
  }
  