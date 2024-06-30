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
    alert(signInReturn.data.message);

    // 로그인 성공 시 "정보 조회" 페이지로 이동
    window.location.replace("./info.html");
  } catch (error) {
    console.error("로그인 요청 중 오류 발생:", error);
    alert("로그인 요청 중 오류가 발생했습니다.");
  }
}
