document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const nickname = document.getElementById('nickname').value;

    try {
      const response = await axios.post('/register', {
        username,
        password,
        nickname
      });

      if (response.status === 201) {
        alert('회원가입이 성공적으로 완료되었습니다.');
        window.location.href = './signin.html'; // 로그인 페이지로 리디렉션
      } else {
        alert('회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 중 오류가 발생했습니다.', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  });
});
