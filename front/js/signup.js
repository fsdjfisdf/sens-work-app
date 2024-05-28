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
  const userIDRegExp = /^[0-9]{6}$/; // 6자 숫자자
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[\W_])[0-9a-zA-Z\W_]{8,16}$/;
  const nicknameRegExp = /^[가-힣a-zA-Z]{2,10}$/;

  if (!userIDRegExp.test(userID)) {
    return alert("아이디 형식은 사번 6자리만 사용 가능");
  }
  if (!passwordRegExp.test(password)) {
    return alert("비밀번호 형식은 숫자, 문자, 특수문자가 1개씩 포함된 비밀번호만 사용 가능");
  }
  if (!nicknameRegExp.test(nickname)) {
    return alert("이름 형식은 이름과 영어만 사용 가능");
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

  return location.replace("./index.html");
}
