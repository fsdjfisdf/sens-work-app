document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const nickname = document.getElementById('nickname').value;

  const response = await fetch('http://3.37.165.84:3001/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password, nickname })
  });

  const messageDiv = document.getElementById('message');
  
  if (response.ok) {
    messageDiv.textContent = '회원가입이 성공적으로 완료되었습니다.';
    messageDiv.style.color = 'green';
  } else {
    const errorText = await response.text();
    messageDiv.textContent = `회원가입 중 오류가 발생했습니다: ${errorText}`;
    messageDiv.style.color = 'red';
  }
});
