const btnSignUp = document.querySelector("#signup");

btnSignUp.addEventListener("click", signup);

async function signup(event) {
  const userID = document.querySelector("#userID").value;
  const password = document.querySelector("#password").value;
  const nickname = document.querySelector("#nickname").value;
  const group = document.querySelector("#group").value;
  const site = document.querySelector("#site").value;
  const level = document.querySelector("#level").value;

  const userIDRegExp = /^[a-z]+[a-z0-9]{5,19}$/; // 아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/; // 비밀번호 정규식 8-16 문자, 숫자 조합
  const nicknameRegExp = /^[가-힣|a-z|A-Z|0-9|]{2,10}$/; // 닉네임 정규식 2-10 한글, 숫자 또는 영문
  const groupRegExp = /^(PEE1|PEE2|PEE3)$/; // 그룹 정규식 PEE1, PEE2, PEE3 중 하나
  const siteRegExp = /^(PT|HS|IC|CJ|PSKH)$/; // 사이트 정규식 PT, HS, IC, CJ, PSKH 중 하나
  const levelRegExp = /^[0-4]$/; // 레벨 정규식 0-4

  if (!userIDRegExp.test(userID)) {
    return alert("아이디 형식: 영문자로 시작하는 영문자 또는 숫자 6-20");
  }
  if (!passwordRegExp.test(password)) {
    return alert("비밀번호 형식: 8-16 문자, 숫자 조합");
  }
  if (!nicknameRegExp.test(nickname)) {
    return alert("닉네임 형식 2-10 한글, 숫자 또는 영문");
  }
  if (!groupRegExp.test(group)) {
    return alert("그룹 형식: PEE1, PEE2, PEE3 중 하나");
  }
  if (!siteRegExp.test(site)) {
    return alert("사이트 형식: PT, HS, IC, CJ, PSKH 중 하나");
  }
  if (!levelRegExp.test(level)) {
    return alert("레벨 형식: 0-4");
  }

  const signUpReturn = await axios({
    method: "post", // http method
    url: "http://3.37.165.84:3001/sign-up",
    headers: {}, // packet header
    data: { userID, password, nickname, group, site, level }, // packet body
  });

  const isValidSignUp = signUpReturn.data.code == 200;

  if (!isValidSignUp) {
    return alert(signUpReturn.data.message);
  }

  const jwt = signUpReturn.data.result.jwt;
  localStorage.setItem("x-access-token", jwt);
  alert(signUpReturn.data.message);

  return location.replace("./index.html");
}
