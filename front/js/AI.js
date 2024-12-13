document.addEventListener("DOMContentLoaded", () => {
    const aiForm = document.getElementById("aiForm");
    const questionInput = document.getElementById("question");
    const resultContainer = document.getElementById("result");
  
    aiForm.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const question = questionInput.value.trim();
      if (!question) {
        resultContainer.innerHTML = "질문을 입력하세요.";
        return;
      }
  
      try {
        resultContainer.innerHTML = "질문 처리 중...";
        const response = await fetch("http://3.37.73.151:3001/api/ai/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          resultContainer.innerHTML = `오류 발생: ${errorData.error || response.statusText}`;
          return;
        }
  
        const data = await response.json();
  
        // SQL Query와 결과 처리
        const sqlQueryHtml = data.sqlQuery
          ? `<strong>SQL Query:</strong><pre>${data.sqlQuery}</pre>`
          : "";
        const resultHtml = `<strong>결과:</strong><p>${data.result}</p>`;
  
        resultContainer.innerHTML = `${sqlQueryHtml}${resultHtml}`;
      } catch (error) {
        console.error("Error:", error);
        resultContainer.innerHTML = "요청 처리 중 오류가 발생했습니다.";
      }
    });
  });
  