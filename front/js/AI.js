document.addEventListener("DOMContentLoaded", () => {
    const aiForm = document.getElementById("aiForm");
    const questionInput = document.getElementById("question");
    const resultContainer = document.querySelector(".result-container");
    const resultOutput = document.getElementById("result");

    aiForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = questionInput.value.trim();
        if (!question) {
            resultOutput.textContent = "질문을 입력하세요.";
            resultContainer.classList.remove("hidden");
            return;
        }

        try {
            resultOutput.textContent = "질문 처리 중...";
            resultContainer.classList.remove("hidden"); // 결과 컨테이너 표시

            const response = await fetch("http://3.37.73.151:3001/api/ai/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                resultOutput.textContent = `오류 발생: ${errorData.error || response.statusText}`;
                return;
            }

            const data = await response.json();
            resultOutput.innerHTML = `
                <strong>SQL Query:</strong><br>
                ${data.sqlQuery}<br><br>
                <strong>결과:</strong><br>
                ${data.result}
            `;
        } catch (error) {
            console.error("Error:", error);
            resultOutput.textContent = "요청 처리 중 오류가 발생했습니다.";
        }
    });
});
