/* ============================================================================
 * S-WORKS — weekly_summary.js (전체 교체본)
 * - 주간 요약 API 호출 (/reports/weekly-summary)
 * - KST 기준 주간(월~일) 계산, NaN 범위 버그 픽스
 * - 한 줄 요약/이슈 포맷 정리, 출처 배지(AI/룰) 표시
 * - axios 사용 (HTML에서 CDN 로드 가정)
 * ========================================================================== */

/** 같은 호스트/포트에서 서빙이면 빈 문자열 유지, 다르면 "http://<HOST>:3001" 지정 */
const API_BASE_URL = "http://3.37.73.151:3001";

/* ======== 날짜/문자 유틸 ======== */
function fmtYMD(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];

function toKst(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return new Date(d.getTime() + 9 * 3600 * 1000);
}
function parseDateLoose(x) {
  if (x instanceof Date) return x;
  if (!x) return new Date(NaN);
  let d = new Date(x); // '2025-08-25' | '2025-08-25T00:00:00Z' | Date string
  if (!isNaN(d)) return d;
  // 최후 보정: 'YYYY-MM-DD'만 남겨 Z 붙이기
  d = new Date(String(x).split("T")[0] + "T00:00:00Z");
  return d;
}
function fmtKstYMDWithWeek(dateLike) {
  const k = toKst(parseDateLoose(dateLike));
  if (isNaN(k)) return "-";
  return `${fmtYMD(k)} (${WEEK_KO[k.getUTCDay()]})`;
}
function weekRange(weekStartISO) {
  const s = parseDateLoose(weekStartISO);
  if (isNaN(s)) return "";
  const e = new Date(s.getTime() + 6 * 24 * 3600 * 1000);
  const ks = toKst(s),
    ke = toKst(e);
  const start = fmtYMD(ks);
  const end = `${String(ke.getUTCMonth() + 1).padStart(2, "0")}-${String(
    ke.getUTCDate()
  ).padStart(2, "0")}`;
  return `${start}~${end}`;
}
function getKstMondayISO(base = new Date()) {
  const kst = toKst(base);
  const dow = kst.getUTCDay(); // 0=일
  const diff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(kst);
  mon.setUTCDate(kst.getUTCDate() + diff);
  return fmtYMD(mon);
}
/** 입력이 월요일이 아니면 해당 주 월요일(KST)로 보정 */
function ensureMonday(dateStr) {
  if (!dateStr) return getKstMondayISO();
  return getKstMondayISO(new Date(dateStr + "T00:00:00"));
}

function tidyCause(s) {
  return (s || "").replace(/^[.\-\s]+/, "").trim() || "미기재";
}
function tidyEq(s) {
  return (s || "").toUpperCase();
}
function fmtH(n) {
  if (n == null || isNaN(n)) return "-";
  return Number(n).toFixed(2) + "h";
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
/** evidence 앞에 붙은 긴 GMT Date를 KST로 축약 */
function normalizeEvidence(evd) {
  if (!evd) return "-";
  const m = String(evd).match(
    /^[A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{4} [\d:]{8} GMT[^\)]*\)/
  );
  if (m) {
    const d = new Date(m[0]);
    const rest = String(evd).slice(m[0].length).trim();
    return `${fmtKstYMDWithWeek(d)} ${rest}`;
  }
  return evd;
}

/* ======== 상태 라벨 ======== */
function setStatus(msg, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#b91c1c" : "#6f665d";
}

/* ======== API 호출 ======== */
async function requestWeekly({ group, site, week, force = false }) {
  const token = localStorage.getItem("x-access-token");
  const headers = token ? { "x-access-token": token } : {};
  const url1 = `${API_BASE_URL}/reports/weekly-summary?group=${encodeURIComponent(
    group
  )}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(
    week
  )}${force ? "&force=1" : ""}`;
  try {
    const res = await axios.get(url1, { headers });
    return res.data;
  } catch (e) {
    // 401 → 로그인 페이지로
    if (e?.response?.status === 401) {
      alert("로그인이 필요합니다.");
      window.location.replace("./signin.html");
      throw e;
    }
    // 과거 엔드포인트 폴백 (미사용이면 제거 가능)
    if (e?.response?.status === 404) {
      const url2 = `${API_BASE_URL}/api/reports/weekly?group=${encodeURIComponent(
        group
      )}&site=${encodeURIComponent(site)}&week=${encodeURIComponent(
        week
      )}${force ? "&force=1" : ""}`;
      const res2 = await axios.get(url2, { headers });
      return res2.data;
    }
    throw e;
  }
}

/* ======== 렌더 ======== */
function render(d) {
  // 한 줄 요약 (장비명 대문자 보정)
  let one = d?.llm_summary_json?.one_liner || "-";
  one = one.replace(/(이슈 집중 장비:\s*)(\S+)/, (_, p, eq) => p + eq.toUpperCase());
  document.getElementById("one").textContent = one;

  // 그룹/사이트/주간 범위 배지
  const grp = (d.group || "").toUpperCase();
  const site = (d.site || "").toUpperCase();
  const wk = d.week_start;
  const pill = document.getElementById("meta-pill");
  const rangeText = weekRange(wk);
  if (rangeText) {
    pill.style.display = "inline-block";
    pill.textContent = `${grp}-${site} · ${rangeText}`;
  } else {
    pill.style.display = "none";
  }

  // 출처 배지 (AI/룰)
  const metaObj = d?.llm_summary_json?.__meta || {};
  const srcEl = document.getElementById("src-pill");
  if (metaObj.source) {
    srcEl.style.display = "inline-block";
    srcEl.textContent =
      metaObj.source === "ai"
        ? `AI 요약${metaObj.model ? " · " + metaObj.model : ""}`
        : "룰 요약";
  } else {
    srcEl.style.display = "none";
  }

  // 하단 메타 텍스트
  document.getElementById("meta").textContent = `${grp}-${site} / 주 시작: ${fmtKstYMDWithWeek(
    wk
  )}`;

  // KPI
  const k = d?.kpis_json || {};
  const pairs = [
    ["총 작업수", k.total_tasks ?? "-"],
    ["총 작업시간(합계)", fmtH(k.sum_total_hours)],
    ["작업시간", fmtH(k.sum_task_hours)],
    ["이동시간", fmtH(k.sum_move_hours)],
    ["평균/건", fmtH(k.avg_task_hours)],
    ["주말 작업", (k.weekend_tasks ?? 0) + "건"],
    ["실패/미해결", (k.failed_tasks ?? 0) + "건"],
  ];
  const kEl = document.getElementById("kpis");
  kEl.innerHTML = "";
  pairs.forEach(([label, val]) => {
    const div = document.createElement("div");
    div.className = "kpi-item";
    div.innerHTML = `<div class="label">${esc(label)}</div><div class="value">${esc(
      val
    )}</div>`;
    kEl.appendChild(div);
  });

  // 이슈 Top3
  const issues = d?.llm_summary_json?.top_issues || [];
  const iEl = document.getElementById("issues");
  iEl.innerHTML = "";
  issues.forEach((issue) => {
    // 타이틀 보정 (장비/원인 표기 정리)
    let title = String(issue.title || "");
    title = title.replace(/(장비 집중:\s*)(\S+)/, (_, p, eq) => p + tidyEq(eq));
    title = title.replace(/(장시간\/이슈 사례:\s*)(\S+)/, (_, p, eq) => p + tidyEq(eq));
    title = title.replace(/(반복 원인:\s*)(.+)/, (_, p, c) => p + tidyCause(c));

    const evd = normalizeEvidence(issue.evidence || "");
    const rec = tidyCause(issue.recommendation || "-");

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="issue-title">${esc(title)}</div>
      <div class="evd">${esc(evd)}</div>
      <div class="muted">권고: ${esc(rec)}</div>
    `;
    iEl.appendChild(li);
  });

  // 다음 액션
  const actions = d?.llm_summary_json?.next_actions || [];
  const aEl = document.getElementById("actions");
  aEl.innerHTML = "";
  actions.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    aEl.appendChild(li);
  });
}

/* ======== 실행 ======== */
async function run(force = false) {
  try {
    setStatus("불러오는 중…");
    const group = document.getElementById("group").value;
    const site = document.getElementById("site").value;
    const weekInput = document.getElementById("week").value;
    const week = ensureMonday(weekInput);
    if (weekInput !== week) document.getElementById("week").value = week;

    const data = await requestWeekly({ group, site, week, force });
    render(data);
    setStatus("완료");
    setTimeout(() => setStatus(""), 1200);
  } catch (err) {
    console.error("weekly summary error:", err);
    const status = err?.response?.status;
    const msg = err?.response?.data?.error || err?.message || "요약 조회 실패";
    setStatus(`에러 ${status ?? ""} ${msg}`, true);
    alert(`요약 조회 실패\n${status ? `HTTP ${status}\n` : ""}${msg}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 초기값: 이번 주 월요일(KST)
  const weekEl = document.getElementById("week");
  if (weekEl) weekEl.value = getKstMondayISO();

  // 이벤트 바인딩
  const runBtn = document.getElementById("run");
  const forceBtn = document.getElementById("force");
  const copyBtn = document.getElementById("copy-one");

  if (runBtn) runBtn.addEventListener("click", () => run(false));
  if (forceBtn) forceBtn.addEventListener("click", () => run(true));
  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      const text = document.getElementById("one").textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        setStatus("복사 완료");
        setTimeout(() => setStatus(""), 1200);
      } catch {
        setStatus("복사 실패", true);
      }
    });

  // 자동 1회 조회
  run(false);
});
