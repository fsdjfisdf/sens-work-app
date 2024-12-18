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

    const LOGOUT_TIME = 60 * 1000 * 10; // 10분 (밀리초)
    let logoutTimer;

    function resetTimer() {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(logout, LOGOUT_TIME);
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
