const btnSignIn = document.querySelector("#signin");

btnSignIn.addEventListener("click", async () => {
  const userID = document.querySelector("#userID").value;
  const password = document.querySelector("#password").value;

  if (!userID || !password) {
    return alert("아이디와 비밀번호를 입력해주세요.");
  }

  try {
    const response = await axios.post("http://3.37.73.151:3001/sign-in", { userID, password });

    if (response.data.code !== 200) {
      return alert(response.data.message);
    }

    // 로그인 성공 시 휴대폰 인증 모달 출력
    document.querySelector("#phoneVerificationModal").style.display = "block";
    document.querySelector("#hiddenUserID").value = userID; // 유저 ID 저장
  } catch (error) {
    console.error("로그인 요청 중 오류 발생:", error);
    alert("로그인 요청 중 오류가 발생했습니다.");
  }
});

// SMS 인증 코드 요청
document.querySelector("#requestSmsCode").addEventListener("click", async () => {
  const phoneNumber = document.querySelector("#phoneNumber").value;
  const userID = document.querySelector("#hiddenUserID").value;

  try {
    const response = await axios.post("http://3.37.73.151:3001/request-sms-code", { userID, phoneNumber });
    alert(response.data.message);
  } catch (error) {
    console.error("SMS 요청 오류:", error);
    alert("SMS 인증 코드 요청 중 오류가 발생했습니다.");
  }
});

// SMS 인증 코드 검증
document.querySelector("#verifySmsCode").addEventListener("click", async () => {
  const phoneNumber = document.querySelector("#phoneNumber").value;
  const verificationCode = document.querySelector("#verificationCode").value;

  try {
    const response = await axios.post("http://3.37.73.151:3001/verify-sms-code", { phoneNumber, verificationCode });

    if (response.data.message === "인증이 완료되었습니다.") {
      alert("로그인이 완료되었습니다.");
      window.location.replace("./user_info.html");
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    console.error("SMS 인증 검증 오류:", error);
    alert("SMS 인증 검증 중 오류가 발생했습니다.");
  }
});
