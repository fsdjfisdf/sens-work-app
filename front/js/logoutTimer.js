document.addEventListener("DOMContentLoaded", function () {
  // ===== 설정 =====
  const IDLE_MS = 30 * 60 * 1000; // 30분
  const LOGOUT_URL = "http://3.37.73.151:3001/logout"; // 있으면 호출, 없으면 에러 무시

  let logoutTO = null;
  const bc = "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;

  // ===== 유틸 =====
  const now = () => Date.now();
  const getToken = () => localStorage.getItem("x-access-token");
  const getRole = () => localStorage.getItem("user-role");
  const getLastActivity = () => +(localStorage.getItem("last-activity") || 0);
  const setLastActivity = (t) => localStorage.setItem("last-activity", String(t));

  function isIdle(last) {
    return now() - last >= IDLE_MS;
  }

  function toggleUI() {
    const token = getToken();
    const role = getRole();

    if (!token) {
      document.querySelector(".unsigned")?.classList.remove("hidden");
      document.querySelector(".signed")?.classList.add("hidden");
    } else {
      document.querySelector(".unsigned")?.classList.add("hidden");
      document.querySelector(".signed")?.classList.remove("hidden");
    }

    if (!token || role !== "admin") {
      document.querySelectorAll(".admin-only").forEach((el) => (el.style.display = "none"));
    }
  }

  async function doLogout(reason = "manual", opt = { broadcast: true }) {
    try {
      const t = getToken();
      if (t) {
        // 서버가 있으면 세션/리프레시 정리 (없어도 에러 무시)
        await fetch(LOGOUT_URL, { method: "POST", headers: { "x-access-token": t }, credentials: "include" });
      }
    } catch (_) {}

    localStorage.removeItem("x-access-token");
    localStorage.removeItem("user-role");
    localStorage.removeItem("last-activity");

    // 멀티탭 동기화
    if (opt.broadcast) {
      localStorage.setItem("last-logout", String(now()));
      if (bc) bc.postMessage({ type: "logout", reason });
    }

    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    window.location.replace("./signin.html");
  }

  function schedule(fromLast) {
    clearTimeout(logoutTO);
    const left = IDLE_MS - (now() - fromLast);
    if (left <= 0) return doLogout("inactivity");
    logoutTO = setTimeout(() => doLogout("inactivity"), left);
  }

  function touch() {
    const t = now();
    setLastActivity(t);
    schedule(t);
  }

  // ===== 멀티탭 동기화 =====
  window.addEventListener("storage", (e) => {
    if (e.key === "last-activity" && e.newValue) {
      schedule(+e.newValue);
    }
    if (e.key === "last-logout") {
      doLogout("sync", { broadcast: false });
    }
  });
  if (bc) {
    bc.onmessage = (e) => {
      if (e.data?.type === "logout") doLogout("sync", { broadcast: false });
    };
  }

  // ===== 초기 가드: 페이지 로드시 바로 만료 여부 판정 =====
  const token = getToken();
  const last = getLastActivity();

  // 로그인 상태인데 last-activity가 없으면 "지금"으로 초기화
  if (token && !last) setLastActivity(now());

  // 첫 화면 그리기 전에 만료 체크 → 만료면 즉시 로그아웃
  if (token) {
    if (isIdle(getLastActivity())) {
      return doLogout("stale-on-open");
    }
  }

  // UI 토글(유효한 경우만 로그인 UI 보이게)
  toggleUI();

  // ===== 사용자 활동 감지 =====
  ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((ev) =>
    document.addEventListener(ev, touch, { passive: true })
  );

  // 탭이 다시 활성화될 때도 체크 (절전/슬립 복귀 등)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      if (token && isIdle(getLastActivity())) {
        doLogout("stale-on-return");
      } else {
        touch();
      }
    }
  });

  // 첫 스케줄
  if (token) schedule(getLastActivity());
});
