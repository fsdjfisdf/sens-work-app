document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("x-access-token");
    const userRole = localStorage.getItem("user-role");

    if (document.querySelector(".unsigned") && document.querySelector(".signed")) {
        if (!token) {
            document.querySelector(".unsigned").classList.remove("hidden");
            document.querySelector(".signed").classList.add("hidden");
        } else {
            document.querySelector(".unsigned").classList.add("hidden");
            document.querySelector(".signed").classList.remove("hidden");
        }
    }

    if (!token || userRole !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'none';
        });
    }

        // 자동 로그아웃 유휴 시간 설정
        const LOGOUT_TIME = 60 * 1000; // 1분 (밀리초)
        let logoutTimer;
    
        function resetTimer() {
            console.log("Reset Timer called");
            clearTimeout(logoutTimer);
            logoutTimer = setTimeout(logout, LOGOUT_TIME);
        }
    
        function logout() {
            console.log("Logout Triggered"); // 로그아웃 확인 로그
            localStorage.removeItem("x-access-token");
            localStorage.removeItem("user-role");
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            window.location.replace("./signin.html");
        }
    
        document.addEventListener("mousemove", () => {
            console.log("Mouse moved - Event triggered");
            resetTimer();
        });
        
        document.addEventListener("keypress", () => {
            console.log("Key pressed - Event triggered");
            resetTimer();
        });
        
        document.addEventListener("click", () => {
            console.log("Mouse clicked - Event triggered");
            resetTimer();
        });
        
        document.addEventListener("scroll", () => {
            console.log("Scrolled - Event triggered");
            resetTimer();
        });
    
        resetTimer(); // 초기 타이머 설정
    
        // 토큰 만료 검증 (백엔드 요청)
        async function checkToken() {
            const response = await fetch("/jwt", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            if (response.status === 401) {
                logout();
            }
        }
    
        setInterval(checkToken, 5 * 60 * 1000); // 5분마다 토큰 유효성 확인

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token");
            localStorage.removeItem("user-role");
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html");
        });
    }

    const menuBtn = document.querySelector('.menu-btn');
    const menuContent = document.querySelector('.menu-content');

    menuBtn.addEventListener('click', function() {
        menuContent.classList.toggle('show');
        if (menuContent.classList.contains('show')) {
            animateMenuItems();
        }
    });

    document.addEventListener('click', function(event) {
        if (!menuBtn.contains(event.target) && !menuContent.contains(event.target)) {
            menuContent.classList.remove('show');
        }
    });

    function animateMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            item.style.transform = `translateX(${index % 2 === 0 ? '-' : ''}100px)`;
            item.style.opacity = '0';
            setTimeout(() => {
                item.style.transform = 'translateX(0)';
                item.style.opacity = '1';
            }, index * 100);
        });
    }
});
                                                                                                                                          