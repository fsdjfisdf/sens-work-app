document.getElementById('start-test').addEventListener('click', async () => {
    const equipment = document.getElementById('equipment-select').value;
    const level = document.getElementById('level-select').value;
  
    const res = await fetch(`http://3.37.73.151:3001/api/test/questions?equipment=${equipment}&level=${level}`);
    const questions = await res.json();
  
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.innerHTML = `
        <p><strong>${idx + 1}. ${q.question}</strong></p>
        ${[1,2,3,4].map(n => `
          <label>
            <input type="radio" name="q${q.id}" value="${n}" required>
            ${q[`option${n}`]}
          </label><br>
        `).join('')}
      `;
      container.appendChild(qDiv);
    });
  
    document.getElementById('test-form').style.display = 'block';
  });
  
  document.getElementById('test-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const userId = 1; // 예시 ID. 로그인된 사용자 ID로 교체하세요.
    const equipment = document.getElementById('equipment-select').value;
    const level = document.getElementById('level-select').value;
  
    const formData = new FormData(e.target);
    const answers = [];
  
    formData.forEach((value, key) => {
      if (key.startsWith('q')) {
        const questionId = parseInt(key.slice(1));
        answers.push({ questionId, selectedOption: parseInt(value) });
      }
    });
  
    const res = await fetch('http://3.37.73.151:3001/api/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, equipment, level, answers })
      });
  
    const result = await res.json();
    document.getElementById('result').innerText = result.message;
    document.getElementById('test-form').style.display = 'none';
  });
  