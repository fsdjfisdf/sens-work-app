/* ==========================================================================
   S-WORKS — index.js (No hover description • Keep 4×3 • Prefetch on hover)
   Version: 2025-08-22
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("x-access-token");
  const userRole = localStorage.getItem("user-role");

  const loginBtn  = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // 로그인/로그아웃 토글 + admin-only 숨김
  if (token) {
    loginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
    if (userRole !== "admin") document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
  } else {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
  }

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("x-access-token");
    localStorage.removeItem("user-role");
    alert("로그아웃 되었습니다.");
    window.location.replace("./signin.html");
  });

  // 런처 열고 닫기 (4×3 유지)
  const title = document.getElementById("title");
  const hint  = document.getElementById("click-hint");
  const box   = document.getElementById("button-container");
  let open = false;

  function openLauncher(){
    title.classList.add("move-up","shrink");
    hint.classList.add("hidden");
    box.classList.remove("hidden");
    box.classList.add("visible");
    document.querySelectorAll(".button").forEach(b => b.classList.remove("disabled"));
    open = true;
  }
  function closeLauncher(){
    box.classList.add("hidden");
    box.classList.remove("visible");
    document.querySelectorAll(".button").forEach(b => b.classList.add("disabled"));
    title.classList.remove("move-up","shrink");
    hint.classList.remove("hidden");
    open = false;
  }

  title.addEventListener("click", () => (open ? closeLauncher() : openLauncher()));
  title.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open ? closeLauncher() : openLauncher(); }
  });

  /* 퍼포먼스: hover시 프리패치만 (설명 없음) */
  const head = document.head || document.getElementsByTagName("head")[0];
  const prefetched = new Set();
  function prefetch(href){
    if (!href || prefetched.has(href)) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "document";
    head.appendChild(link);
    prefetched.add(href);
  }
  box.addEventListener("pointerover", (e) => {
    const a = e.target.closest("a.button");
    if (!a || a.classList.contains("disabled")) return;
    prefetch(a.getAttribute("href"));
  }, { passive: true });

  // 클릭 → 200ms 피드백 후 이동
  box.addEventListener("click", (e) => {
    const a = e.target.closest("a.button");
    if (!a || a.classList.contains("disabled")) return;
    e.preventDefault();
    a.classList.add("clicked");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => { window.location.href = a.getAttribute("href"); }, 200);
      });
    });
  });

  // 첫 방문 힌트(1회)
  if (!sessionStorage.getItem("sworks_hint")){
    setTimeout(() => {
      title.style.filter = "brightness(1.02) saturate(1.04)";
      setTimeout(() => { title.style.filter = ""; }, 600);
    }, 700);
    sessionStorage.setItem("sworks_hint","1");
  }
});
