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

document.querySelector("#findPw").addEventListener("click", findPw);

async function findPw() {
    const userID = prompt("아이디를 입력하세요:");
    const name = prompt("본인의 이름을 입력하세요:");
    const group = prompt("본인의 그룹을 입력하세요:");
    const site = prompt("본인의 사이트를 입력하세요:");
    const hireDate = prompt("본인의 입사일을 입력하세요 (YYYY-MM-DD):");

    if (!userID || !name || !group || !site || !hireDate) {
        return alert("모든 정보를 입력해주세요.");
    }

    try {
        const response = await axios.post("http://3.37.165.84:3001/find-pw", { userID, name, group, site, hireDate });
        if (response.data.isSuccess) {
            const newPassword = prompt("새 비밀번호를 입력하세요:");
            if (!newPassword) {
                return alert("새 비밀번호를 입력해주세요.");
            }

            const resetResponse = await axios.post("http://3.37.165.84:3001/reset-pw", { userID, newPassword });
            if (resetResponse.data.isSuccess) {
                alert("비밀번호가 성공적으로 변경되었습니다.");
            } else {
                alert("비밀번호 변경에 실패했습니다.");
            }
        } else {
            alert("입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
        }
    } catch (error) {
        console.error("비밀번호 찾기 요청 중 오류 발생:", error);
        alert("비밀번호 찾기 요청 중 오류가 발생했습니다.");
    }
}

document.querySelector("#findId").addEventListener("click", findId);

async function findId() {
    const name = prompt("본인의 이름을 입력하세요:");
    const group = prompt("본인의 그룹을 입력하세요:");
    const site = prompt("본인의 사이트를 입력하세요:");
    const hireDate = prompt("본인의 입사일을 입력하세요 (YYYY-MM-DD):");

    if (!name || !group || !site || !hireDate) {
        return alert("모든 정보를 입력해주세요.");
    }

    try {
        const response = await axios.post("http://3.37.165.84:3001/find-id", { name, group, site, hireDate });
        if (response.data.isSuccess) {
            alert(`아이디는 ${response.data.result.userID} 입니다.`);
        } else {
            alert("입력하신 정보와 일치하는 아이디가 없습니다.");
        }
    } catch (error) {
        console.error("아이디 찾기 요청 중 오류 발생:", error);
        alert("아이디 찾기 요청 중 오류가 발생했습니다.");
    }
}
