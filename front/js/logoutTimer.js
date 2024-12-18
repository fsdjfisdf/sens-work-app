// logoutTimer.js
document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("x-access-token");
    const userRole = localStorage.getItem("user-role");

    if (!token) {
        document.querySelector(".unsigned")?.classList.remove("hidden");
        document.querySelector(".signed")?.classList.add("hidden");
    } else {
        document.querySelector(".unsigned")?.classList.add("hidden");
        document.querySelector(".signed")?.classList.remove("hidden");
    }

    if (!token || userRole !== "admin") {
        document.querySelectorAll(".admin-only").forEach((element) => {
            element.style.display = "none";
        });
    }

    const LOGOUT_TIME = 60 * 1000; // 1분 (밀리초)
    let logoutTimer;
    let timeLeft = LOGOUT_TIME / 1000;

    const timerDiv = document.createElement("div");
    timerDiv.style.position = "fixed";
    timerDiv.style.bottom = "20px";
    timerDiv.style.right = "20px";
    timerDiv.style.backgroundColor = "#ffcccc";
    timerDiv.style.padding = "10px";
    timerDiv.style.borderRadius = "5px";
    timerDiv.style.fontSize = "14px";
    timerDiv.style.fontWeight = "bold";
    timerDiv.style.color = "#333";
    timerDiv.style.zIndex = "1000";
    document.body.appendChild(timerDiv);

    function updateTimerDisplay() {
        timerDiv.innerText = `자동 로그아웃까지 남은 시간: ${timeLeft}초`;
    }

    function resetTimer() {
        clearTimeout(logoutTimer);
        timeLeft = LOGOUT_TIME / 1000;
        updateTimerDisplay();
        logoutTimer = setInterval(countDown, 1000);
    }

    function countDown() {
        timeLeft -= 1;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(logoutTimer);
            logout();
        }
    }

    function logout() {
        localStorage.removeItem("x-access-token");
        localStorage.removeItem("user-role");
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        window.location.replace("./signin.html");
    }

    document.addEventListener("mousemove", resetTimer);
    document.addEventListener("keypress", resetTimer);
    document.addEventListener("click", resetTimer);
    document.addEventListener("scroll", resetTimer);

    resetTimer();
});
