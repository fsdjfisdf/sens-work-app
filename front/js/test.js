let currentQuestionIndex = 0;
let questions = [];
let answers = [];
const API_BASE_URL = "http://3.37.73.151:3001";

document.getElementById("start-test").addEventListener("click", async () => {
  const equipment = document.getElementById("equipment").value;
  const level = document.getElementById("level").value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/test/questions?equipment_type=${encodeURIComponent(equipment)}&level=${level}`);
    questions = await res.json();
    if (questions.length === 0) {
      alert("해당 조건의 문제가 없습니다.");
      return;
    }
    document.querySelector(".selector").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");
    showQuestion();
  } catch (err) {
    alert("문제를 불러오는 중 오류가 발생했습니다.");
    console.error(err);
  }
});

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
  } catch (err) {
    alert("시험 결과 제출 중 오류 발생");
    console.error(err);
  }
}
