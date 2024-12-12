document.addEventListener("DOMContentLoaded", () => {
    const aiForm = document.getElementById("aiForm");
    const questionInput = document.getElementById("question");
    const resultContainer = document.getElementById("result");

    aiForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = questionInput.value.trim();
        if (!question) {
            resultContainer.textContent = "질문을 입력하세요.";
            return;
        }

        try {
            resultContainer.textContent = "질문 처리 중...";
            const response = await fetch("http://3.37.73.151:3001/api/ai/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ question })
            });

            if (!response.ok) {
                const errorData = await response.json();
                resultContainer.textContent = `오류 발생: ${errorData.error || response.statusText}`;
                return;
            }

            const data = await response.json();
            resultContainer.textContent = `SQL Query:\n${data.sqlQuery}\n\n결과:\n${JSON.stringify(data.result, null, 2)}`;
        } catch (error) {
            console.error("Error:", error);
            resultContainer.textContent = "요청 처리 중 오류가 발생했습니다.";
        }
    });
});
