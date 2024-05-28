document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("x-access-token");

    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    loadUserInfo();

    function loadUserInfo() {
        axios.get('http://3.37.165.84:3001/user-info', {
            headers: { "x-access-token": token }
        }).then(response => {
            const userInfo = response.data.result;
            if (userInfo) {
                document.querySelector("#data-display").innerHTML = `
                    <p>아이디: ${userInfo.userID}</p>
                    <p>닉네임: ${userInfo.nickname}</p>
                    <p>그룹: ${userInfo.group}</p>
                    <p>사이트: ${userInfo.site}</p>
                    <p>레벨: ${userInfo.level}</p>
                    <p>입사일: ${userInfo.hire_date}</p>
                    <p>Main Set Up CAPA: ${userInfo.main_set_up_capa}</p>
                    <p>Main Maint CAPA: ${userInfo.main_maint_capa}</p>
                    <p>Main CAPA: ${userInfo.main_capa}</p>
                    <p>Multi Set Up CAPA: ${userInfo.multi_set_up_capa}</p>
                    <p>Multi Maint CAPA: ${userInfo.multi_maint_capa}</p>
                    <p>Multi CAPA: ${userInfo.multi_capa}</p>
                    <p>Total CAPA: ${userInfo.total_capa}</p>
                `;
                document.querySelector(".nickname").textContent = userInfo.nickname;
                document.querySelector(".unsigned").classList.add("hidden");
                document.querySelector(".signed").classList.remove("hidden");
            } else {
                alert("유저 정보를 가져올 수 없습니다.");
            }
        }).catch(error => {
            console.error("사용자 정보를 로드하는 중 오류 발생:", error);
        });
    }

    const signOutButton = document.querySelector("#sign-out");

    if (signOutButton) {
        signOutButton.addEventListener("click", function() {
            localStorage.removeItem("x-access-token"); // JWT 토큰 삭제
            alert("로그아웃 되었습니다.");
            window.location.replace("./signin.html"); // 로그인 페이지로 리디렉션
        });
    }
});
