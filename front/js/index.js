document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("x-access-token");
    const userRole = localStorage.getItem("user-role");

    if (!token) {
        document.querySelector(".unsigned").classList.remove("hidden");
        document.querySelector(".signed").classList.add("hidden");
    } else {
        document.querySelector(".unsigned").classList.add("hidden");
        document.querySelector(".signed").classList.remove("hidden");
    }

    if (!token || userRole !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'none';
        });
    }

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
