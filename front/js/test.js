let currentQuestionIndex = 0;
let questions = [];
let answers = [];
const API_BASE_URL = "http://3.37.73.151:3001";

document.getElementById("start-test").addEventListener("click", async () => {
  
  const equipment = document.getElementById("equipment").value;
  const level = document.getElementById("level").value;
  const token = localStorage.getItem('x-access-token');
      if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

  try {
    const res = await fetch(`${API_BASE_URL}/api/test/questions?equipment_type=${encodeURIComponent(equipment)}&level=${level}`);
    questions = await res.json();
    if (questions.length === 0) {
      alert("해당 조건의 문제가 없습니다.");
      return;
    }
    document.querySelector(".selector").classList.add("hidden");
    renderAllQuestions();  // ← 여기만 변경
  } catch (err) {
    alert("문제를 불러오는 중 오류가 발생했습니다.");
    console.error(err);
  }
});

function renderAllQuestions() {
  const container = document.getElementById("quiz-container");
  container.innerHTML = '';  // 기존 내용 초기화

  const form = document.createElement("form");
  form.id = "test-form";

  questions.forEach((q, index) => {
    const questionBlock = document.createElement("div");
    questionBlock.className = "question-block";
    questionBlock.style.marginBottom = "40px";
    questionBlock.style.padding = "20px";
    questionBlock.style.border = "1px solid #ccc";
    questionBlock.style.borderRadius = "10px";
    questionBlock.style.backgroundColor = "#fdfdfd";

    const questionTitle = document.createElement("p");
    questionTitle.innerHTML = `<strong>${index + 1}. ${q.question_text}</strong>`;
    questionTitle.style.marginBottom = "10px";
    questionBlock.appendChild(questionTitle);

    for (let i = 1; i <= 4; i++) {
      if (!q[`choice_${i}`]) continue;

      const choiceWrapper = document.createElement("div");
      choiceWrapper.style.marginBottom = "8px";

      const inputId = `q${q.id}_choice${i}`;

      choiceWrapper.innerHTML = `
        <label for="${inputId}">
          <input type="radio" id="${inputId}" name="question_${q.id}" value="${i}">
          ${q[`choice_${i}`]}
        </label>
      `;

      questionBlock.appendChild(choiceWrapper);
    }

    form.appendChild(questionBlock);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.innerText = "제출하기";
  submitBtn.style.padding = "10px 20px";
  submitBtn.style.backgroundColor = "#28a745";
  submitBtn.style.color = "white";
  submitBtn.style.fontWeight = "bold";
  submitBtn.style.border = "none";
  submitBtn.style.borderRadius = "8px";
  submitBtn.style.cursor = "pointer";
  submitBtn.style.marginTop = "20px";

  form.appendChild(submitBtn);

  container.appendChild(form);
  container.classList.remove("hidden");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    answers = [];

    questions.forEach(q => {
      const selected = form.querySelector(`input[name="question_${q.id}"]:checked`);
      if (selected) {
        answers.push({
          question_id: q.id,
          user_answer: parseInt(selected.value)
        });
      }
    });

    if (answers.length !== questions.length) {
      alert("모든 문제에 답을 선택해 주세요.");
      return;
    }

    await submitTest();
  });
}


function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("question-box").innerText = `${currentQuestionIndex + 1}. ${q.question_text}`;

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  for (let i = 1; i <= 4; i++) {
    if (!q[`choice_${i}`]) continue;
    const li = document.createElement("li");
    li.innerHTML = `
      <label>
        <input type="radio" name="choice" value="${i}"> ${q[`choice_${i}`]}
      </label>
    `;
    choices.appendChild(li);
  }
}

document.getElementById("next-btn").addEventListener("click", () => {
  const selected = document.querySelector("input[name='choice']:checked");
  if (!selected) {
    alert("정답을 선택하세요.");
    return;
  }

  answers.push({
    question_id: questions[currentQuestionIndex].id,
    user_answer: parseInt(selected.value)
  });

  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    submitTest();
  }
});

async function submitTest() {
  const token = localStorage.getItem("x-access-token");
  const equipment = document.getElementById("equipment").value;
  const level = parseInt(document.getElementById("level").value);

  try {
    const res = await fetch(`${API_BASE_URL}/api/test/submit-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify({ equipment_type: equipment, level, answers })
    });

    const result = await res.json();

    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    document.getElementById("score").innerText = `총 ${result.total_questions}문제 중 ${result.score}개 맞았습니다.`;

    // 결과 상세 표시
    const resultDetailsBox = document.getElementById("result-details");
    resultDetailsBox.innerHTML = ""; // 초기화

result.details.forEach((item, index) => {
  const choicesHTML = Object.entries(item.choices).map(([num, text]) => {
    const isUserChoice = parseInt(num) === item.user_answer;
    const isCorrect = parseInt(num) === item.correct_answer;

    let choiceLabel = "";
    if (isUserChoice && isCorrect) {
      choiceLabel = "✅ 내 선택 (정답)";
    } else if (isUserChoice) {
      choiceLabel = "❌ 내 선택";
    } else if (isCorrect) {
      choiceLabel = "✅ 정답";
    }

    return `
      <li style="margin-bottom: 5px;">
        <strong>${num}.</strong> ${text}
        ${choiceLabel ? `<span style="margin-left: 10px; color: ${isCorrect ? 'green' : 'red'};">${choiceLabel}</span>` : ""}
      </li>
    `;
  }).join("");

  const detailDiv = document.createElement("div");
  detailDiv.innerHTML = `
    <div class="question-feedback" style="margin-bottom: 25px;">
      <p><strong>${index + 1}. ${item.question_text}</strong></p>
      <ul style="list-style: none; padding-left: 0;">
        ${choicesHTML}
      </ul>
      <p><strong>💬 해설:</strong> ${item.explanation || "해설 없음"}</p>
      <hr>
    </div>
  `;
  resultDetailsBox.appendChild(detailDiv);
});
  } catch (err) {
    alert("시험 결과 제출 중 오류 발생");
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadTestResults(); // 로그인 상태일 때 불러오기
});

async function loadTestResults() {
  const token = localStorage.getItem('x-access-token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/test/test-results`, {
      headers: { 'x-access-token': token }
    });
    const results = await res.json();
    if (results.length === 0) return;

    const table = document.getElementById('test-history-table').querySelector('tbody');
    table.innerHTML = ''; // 초기화

    results.forEach(result => {
      const row = document.createElement('tr');

      const date = new Date(result.test_date).toLocaleString('ko-KR');
      const scoreText = `${result.score} / ${result.total_questions}`;
      const note = result.score >= result.total_questions * 0.8 ? '✅ 우수' : '';

      row.innerHTML = `
        <td>${date}</td>
        <td>${result.equipment_type}</td>
        <td>Level ${result.level}</td>
        <td>${scoreText}</td>
        <td>${note}</td>
      `;
      table.appendChild(row);
    });

    document.getElementById('test-history-container').classList.remove('hidden');
  } catch (err) {
    console.error("시험 이력 불러오기 오류:", err);
  }
}