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
      url: "http://3.37.165.84:3001/sign-in",
      headers: {},
      data: { userID: userID, password: password },
    });

    const isValidSignIn = signInReturn.data.code == 200;

    if (!isValidSignIn) {
      return alert("아이디 혹은 비밀번호가 틀렸습니다.");
    }

    const jwt = signInReturn.data.result.jwt;
    localStorage.setItem("x-access-token", jwt);

    // JWT 디코딩하여 역할(role)을 로컬 스토리지에 저장
    const decodedToken = JSON.parse(atob(jwt.split('.')[1]));
    localStorage.setItem('user-role', decodedToken.role);

    alert(signInReturn.data.message);

    // 로그인 성공 시 "정보 조회" 페이지로 이동
    window.location.replace("./user_info.html");
  } catch (error) {
    console.error("로그인 요청 중 오류 발생:", error);
    alert("로그인 요청 중 오류가 발생했습니다.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const findIdModal = document.getElementById("find-id-modal");
  const findPasswordModal = document.getElementById("find-password-modal");

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
          const response = await axios.post("http://3.37.165.84:3001/find-id", {
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

      try {
          const response = await axios.post("http://3.37.165.84:3001/find-password", {
              userID,
              name,
              group,
              site,
              hireDate,
              newPassword,
          });

          document.getElementById("find-password-result").innerText = response.data.message;
      } catch (error) {
          console.error("비밀번호 찾기 오류:", error);
          alert("비밀번호 찾기 요청 중 오류가 발생했습니다.");
      }
  });
});
