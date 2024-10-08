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
  const userIDRegExp = /^[a-z]+[a-z0-9]{5,19}$/; // 아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/; // 비밀번호 정규식 8-16 문자, 숫자 조합
  const nicknameRegExp = /^[가-힣|a-z|A-Z|0-9|]{2,10}$/; // 닉네임 정규식 2-10 한글, 숫자 또는 영문

  if (!userIDRegExp.test(userID)) {
    return alert("아이디 형식: 영문자로 시작하는 영문자 또는 숫자 6-20");
  }
  if (!passwordRegExp.test(password)) {
    return alert("비밀번호 형식: 8-16 문자, 숫자 조합");
  }
  if (!nicknameRegExp.test(nickname)) {
    return alert("이름 형식 2-10 한글, 숫자 또는 영문");
  }

  // 3. 회원가입 API 요청
  const signUpReturn = await axios({
    method: "post", // http method
    url: "http://3.37.73.151:3001/sign-up",
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

  return location.replace("./index.html");
}
