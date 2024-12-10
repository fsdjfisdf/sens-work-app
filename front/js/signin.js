const btnSignIn = document.querySelector("#signin");

btnSignIn.addEventListener("click", signIn);

async function signIn(event) {
    const userID = document.querySelector("#userID").value;
    const password = document.querySelector("#password").value;
  
    if (!userID || !password) {
      return alert("회원 정보를 입력해주세요.");
    }
  
    try {
      const signInReturn = await axios({
        method: "post",
        url: "http://3.37.73.151:3001/sign-in",
        headers: {},
        data: { userID: userID, password: password },
      });
  
      const isValidSignIn = signInReturn.data.code === 200;
  
      if (!isValidSignIn) {
        alert(signInReturn.data.message);
        return;
      }
  
      const jwt = signInReturn.data.result.jwt;
      localStorage.setItem("x-access-token", jwt);
  
      const decodedToken = JSON.parse(atob(jwt.split(".")[1]));
      localStorage.setItem("user-role", decodedToken.role);
  
      alert(signInReturn.data.message);
      window.location.replace("./user_info.html");
    } catch (error) {
      if (error.response && error.response.status === 429) {
        alert(error.response.data.message); // 차단 메시지 출력
      } else if (error.response && error.response.status === 410) {
        alert(error.response.data.message); // 실패 횟수 메시지 출력
      } else {
        console.error("로그인 요청 중 오류 발생:", error);
        alert("로그인 요청 중 오류가 발생했습니다.");
      }
    }
  }
  

document.addEventListener("DOMContentLoaded", function () {
  const findIdModal = document.getElementById("find-id-modal");
  const findPasswordModal = document.getElementById("find-password-modal");
  const newPasswordSection = document.getElementById("new-password-section");
  const findPasswordResult = document.getElementById("find-password-result");

  const findIdBtn = document.getElementById("find-id-btn");
  const findPasswordBtn = document.getElementById("find-password-btn");

  document.getElementById("find-id").onclick = function () {
      findIdModal.style.display = "block";
  };

  document.getElementById("find-password").onclick = function () {
      findPasswordModal.style.display = "block";
  };

  document.querySelectorAll(".close").forEach((closeBtn) => {
      closeBtn.onclick = function () {
          findIdModal.style.display = "none";
          findPasswordModal.style.display = "none";
      };
  });

  window.onclick = function (event) {
      if (event.target == findIdModal) {
          findIdModal.style.display = "none";
      }
      if (event.target == findPasswordModal) {
          findPasswordModal.style.display = "none";
      }
  };

  findIdBtn.addEventListener("click", async function () {
      const name = document.getElementById("find-id-name").value;
      const group = document.getElementById("find-id-group").value;
      const site = document.getElementById("find-id-site").value;
      const hireDate = document.getElementById("find-id-hire-date").value;

      try {
          const response = await axios.post("http://3.37.73.151:3001/find-id", {
              name,
              group,
              site,
              hireDate,
          });

          document.getElementById("find-id-result").innerText = response.data.message;
      } catch (error) {
          console.error("아이디 찾기 오류:", error);
          alert("아이디 찾기 요청 중 오류가 발생했습니다.");
      }
  });

  findPasswordBtn.addEventListener("click", async function () {
      const userID = document.getElementById("find-password-id").value;
      const name = document.getElementById("find-password-name").value;
      const group = document.getElementById("find-password-group").value;
      const site = document.getElementById("find-password-site").value;
      const hireDate = document.getElementById("find-password-hire-date").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmNewPassword = document.getElementById("confirm-new-password").value;

      if (!newPassword || !confirmNewPassword) {
          findPasswordResult.innerText = "새 비밀번호와 확인 비밀번호를 모두 입력해주세요.";
          return;
      }

      if (newPassword !== confirmNewPassword) {
          findPasswordResult.innerText = "비밀번호가 일치하지 않습니다.";
          return;
      }

      try {
          const response = await axios.post("http://3.37.73.151:3001/find-password", {
              userID,
              name,
              group,
              site,
              hireDate,
              newPassword,
          });

          findPasswordResult.innerText = response.data.message;
          if (response.data.isSuccess) {
              alert("비밀번호가 성공적으로 변경되었습니다.");
              findPasswordModal.style.display = "none";
          }
      } catch (error) {
          console.error("비밀번호 재설정 오류:", error);
          alert("비밀번호 재설정 요청 중 오류가 발생했습니다.");
      }
  });

  // 이름, 그룹, 사이트, 입사일이 모두 입력되면 새 비밀번호 입력 섹션 표시 (애니메이션 포함)
  document.querySelectorAll("#find-password-id, #find-password-name, #find-password-group, #find-password-site, #find-password-hire-date")
      .forEach(input => {
          input.addEventListener("input", function () {
              const userID = document.getElementById("find-password-id").value;
              const name = document.getElementById("find-password-name").value;
              const group = document.getElementById("find-password-group").value;
              const site = document.getElementById("find-password-site").value;
              const hireDate = document.getElementById("find-password-hire-date").value;

              if (userID && name && group && site && hireDate) {
                  newPasswordSection.style.display = "block";
                  newPasswordSection.style.opacity = 0;
                  newPasswordSection.style.transition = "opacity 0.2s ease-in-out";
                  setTimeout(() => {
                      newPasswordSection.style.opacity = 1;
                  }, 10);
              } else {
                  newPasswordSection.style.opacity = 0;
                  setTimeout(() => {
                      newPasswordSection.style.display = "none";
                  }, 500);
              }
          });
      });
});