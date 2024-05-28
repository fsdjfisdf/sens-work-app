const btnSignUp = document.querySelector("#signup");

// 1. #signup 클릭
btnSignUp.addEventListener("click", signup);

async function signup(event) {
  const userID = document.querySelector("#userID").value;
  const password = document.querySelector("#password").value;
  const nickname = document.querySelector("#nickname").value;
  const group = document.querySelector("#group").value;
  const site = document.querySelector("#site").value;
  const level = document.querySelector("#level").value;
  const hireDate = document.querySelector("#hireDate").value;
  const mainSetUpCapa = parseFloat(document.querySelector("#mainSetUpCapa").value) || 0;
  const mainMaintCapa = parseFloat(document.querySelector("#mainMaintCapa").value) || 0;
  const multiSetUpCapa = parseFloat(document.querySelector("#multiSetUpCapa").value) || 0;
  const multiMaintCapa = parseFloat(document.querySelector("#multiMaintCapa").value) || 0;
  const mainCapa = (mainSetUpCapa + mainMaintCapa) / 2;
  const multiCapa = (multiSetUpCapa + multiMaintCapa) / 2;
  const totalCapa = (mainSetUpCapa + mainMaintCapa + multiCapa) / 3;

  // 2. #email, #password, nickname 값 확인 (정규표현식 확인)
  const userIDRegExp = /^\d{6}$/; // 숫자 6자리
  const passwordRegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/; // 숫자, 영어, 특수문자 포함 8-16자리
  const nicknameRegExp = /^[가-힣a-zA-Z]+$/; // 한글과 영어 조합

  if (!userIDRegExp.test(userID)) {
      return alert("아이디 형식: 숫자 6자리");
  }
  if (!passwordRegExp.test(password)) {
      return alert("비밀번호 형식: 숫자, 영어, 특수문자 포함 8-16자리");
  }
  if (!nicknameRegExp.test(nickname)) {
      return alert("닉네임 형식: 한글과 영어를 조합하여 사용 (한글만 사용 가능)");
  }

  // 3. 회원가입 API 요청
  const signUpReturn = await axios({
    method: "post", // http method
    url: "http://3.37.165.84:3001/sign-up",
    headers: {}, // packet header
    data: { userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa }, // packet body
  });

  // 4. 요청이 성공적이지 않다면, alert message
  const isValidSignUp = signUpReturn.data.code == 200;

  if (!isValidSignUp) {
    return alert("요청에 문제가 생겼습니다.");
  }

  // 5. 요청이 성공하면, jwt를 localstorage에 저장하고 main page 이동
  const jwt = signUpReturn.data.result.jwt;
  localStorage.setItem("x-access-token", jwt);
  alert(signUpReturn.data.message);

  return location.replace("./signin.html");
}
