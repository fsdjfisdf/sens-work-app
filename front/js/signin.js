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
      url: url + "/sign-in", // URL이 중복되지 않도록 확인
      data: { userID: parseInt(userID), password: password }, // userID를 정수형으로 변환
    });

    const isValidSignIn = signInReturn.data.code == 200;

    if (!isValidSignIn) {
      return alert(signInReturn.data.message);
    }

    const jwt = signInReturn.data.result.jwt;
    localStorage.setItem("x-access-token", jwt);
    alert(signInReturn.data.message);

    location.replace("./index.html");
  } catch (error) {
    console.error(error);
    alert("로그인 중 오류가 발생했습니다.");
  }
}
