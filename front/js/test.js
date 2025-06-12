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
