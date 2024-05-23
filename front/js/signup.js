document.getElementById('signup-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const nickname = document.getElementById('nickname').value;

  const response = await fetch('http://3.37.165.84:3001/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password, nickname })
  });

  const result = await response.json();
  
  const messageElement = document.getElementById('message');
  if (response.ok) {
    messageElement.textContent = 'User registered successfully!';
    messageElement.style.color = 'green';
  } else {
    messageElement.textContent = result.message || 'Registration failed!';
    messageElement.style.color = 'red';
  }
});
