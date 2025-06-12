document.getElementById("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  data.level = parseInt(data.level);
  data.correct_answer = parseInt(data.correct_answer);

  const token = localStorage.getItem("x-access-token");

  try {
    const res = await fetch("http://3.37.73.151:3001/api/test/add-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    document.getElementById("response-message").innerText = result.message;
    e.target.reset();
  } catch (err) {
    document.getElementById("response-message").innerText = "문제 추가 실패";
    console.error("🔥 문제 추가 실패:", err);
  }
});
