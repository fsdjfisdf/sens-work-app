document.getElementById("aiForm").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const question = document.getElementById("question").value;
    const resultElement = document.getElementById("result");
  
    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        resultElement.textContent = `SQL Query: ${data.sqlQuery}\nResult: ${JSON.stringify(data.result, null, 2)}`;
      } else {
        resultElement.textContent = `Error: ${data.error}`;
      }
    } catch (error) {
      console.error("Error:", error);
      resultElement.textContent = "요청 중 오류가 발생했습니다.";
    }
  });
  