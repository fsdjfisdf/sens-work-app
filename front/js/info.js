document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("x-access-token");
    if (!token) {
      alert("로그인이 필요합니다.");
      window.location.replace("./signin.html");
      return;
    }
  
    loadUserInfo();
    loadUserWorkLogs();
  
    function loadUserInfo() {
      axios.get('http://3.37.165.84:3001/user-info', {
        headers: { "x-access-token": token }
      }).then(response => {
        const userInfo = response.data.result;
        if (userInfo) {
          document.querySelector("#user-info").innerHTML = `
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
  
    function loadUserWorkLogs() {
      axios.get('http://3.37.165.84:3001/user-work-logs', {
        headers: { "x-access-token": token }
      }).then(response => {
        const workLogInfo = response.data.result;
        if (workLogInfo) {
          document.querySelector("#user-work-logs").innerHTML = `
            <h2>작업 내역</h2>
            <p>총 작업 건수: ${workLogInfo.workCount}</p>
            <p>총 작업 시간: ${workLogInfo.totalDuration}</p>
          `;
        } else {
          alert("작업 내역을 가져올 수 없습니다.");
        }
      }).catch(error => {
        console.error("작업 내역을 로드하는 중 오류 발생:", error);
        alert("작업 내역을 로드하는 중 오류가 발생했습니다.");
      });
    }
  });
  