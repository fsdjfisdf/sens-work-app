// tsrag.js

// 백엔드 API 베이스 URL
// - 프론트와 백이 같은 도메인/포트면 "" 그대로 사용
// - 프론트: 80포트, 백: 3001이면 예: "http://3.37.xx.xx:3001"
const API_BASE = "http://3.37.73.151:3001";

// DOM helper
const $ = (id) => document.getElementById(id);

// 엘리먼트 참조
const chatMessages = $("chatMessages");
const questionInput = $("questionInput");
const btnAsk = $("btnAsk");
const btnBuildEmbeddings = $("btnBuildEmbeddings");
const statusBox = $("statusBox");
const equipmentTypeSelect = $("equipmentTypeSelect");
const alarmKeySelect = $("alarmKeySelect");
const topKInput = $("topKInput");
const btnNewChat = $("btnNewChat");

let isSending = false;

// ─────────────────────────────────────────────
// 공통 UI 함수
// ─────────────────────────────────────────────
function setStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.classList.remove(
    "ts-status-hidden",
    "ts-status-info",
    "ts-status-error",
    "ts-status-success"
  );

  if (type === "error") statusBox.classList.add("ts-status-error");
  else if (type === "success") statusBox.classList.add("ts-status-success");
  else statusBox.classList.add("ts-status-info");
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.classList.add("ts-status-hidden");
  statusBox.classList.remove("ts-status-info", "ts-status-error", "ts-status-success");
}

function setLoading(loading) {
  isSending = loading;
  btnAsk.disabled = loading;
  btnBuildEmbeddings.disabled = loading;
  if (btnNewChat) btnNewChat.disabled = loading;

  if (loading) btnAsk.classList.add("ts-btn-loading");
  else btnAsk.classList.remove("ts-btn-loading");
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ─────────────────────────────────────────────
// 메시지 렌더링 (ChatGPT 느낌 말풍선)
// ─────────────────────────────────────────────
function createMessageBubble({ role, content, hits, loading }) {
  const row = document.createElement("div");
  row.className = `ts-msg-row ts-msg-${role}`;

  const bubble = document.createElement("div");
  bubble.className = "ts-msg-bubble";

  // 아바타
  const avatar = document.createElement("div");
  avatar.className = "ts-msg-avatar";
  avatar.textContent = role === "user" ? "나" : "TS";

  const inner = document.createElement("div");
  inner.className = "ts-msg-inner";

  const meta = document.createElement("div");
  meta.className = "ts-msg-meta";
  meta.textContent = role === "user" ? "You" : "TS RAG";

  const body = document.createElement("div");
  body.className = "ts-msg-body";

  if (loading) {
    body.innerHTML = `
      <span class="ts-loader">
        <span class="ts-loader-dots">
          <span></span><span></span><span></span>
        </span>
        <span>관련 알람·CASE·STEP을 찾는 중입니다...</span>
      </span>
    `;
  } else {
    const safe = (content || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    body.innerHTML = safe || "(내용 없음)";
  }

  inner.appendChild(meta);
  inner.appendChild(body);
  bubble.appendChild(avatar);
  bubble.appendChild(inner);

  // 근거 hits가 있을 경우 details로 접어서 보여주기
  if (hits && hits.length && !loading) {
    const details = document.createElement("details");
    details.className = "ts-evidence-details";
    details.open = false;

    const summary = document.createElement("summary");
    summary.textContent = `참조 CASE/STEP 근거 (${hits.length}개)`;
    details.appendChild(summary);

    hits.forEach((hit) => {
      const card = document.createElement("div");
      card.className = "ts-evidence-card";

      const title = document.createElement("div");
      title.className = "ts-evidence-title";
      title.textContent =
        hit.title ||
        `[${hit.equipment_type}] ${hit.alarm_key} · CASE ${hit.case_no} · STEP ${hit.step_no}`;

      const metaRow = document.createElement("div");
      metaRow.className = "ts-evidence-meta";
      metaRow.innerHTML = `
        <span>${hit.equipment_type || "-"}</span>
        <span>${hit.alarm_key || "-"}</span>
        <span>CASE ${hit.case_no ?? "-"}</span>
        <span>STEP ${hit.step_no ?? "-"}</span>
        <span>score: ${(hit.score ?? 0).toFixed(3)}</span>
      `;

      const preview = document.createElement("div");
      preview.className = "ts-evidence-body";
      const snippet = (hit.content || "").split("\n").slice(0, 8).join("\n");
      const safeSnippet = snippet
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      preview.innerHTML = safeSnippet;

      card.appendChild(title);
      card.appendChild(metaRow);
      card.appendChild(preview);
      details.appendChild(card);
    });

    inner.appendChild(details);
  }

  row.appendChild(bubble);
  return row;
}

// 초기 안내 메시지
function addIntro() {
  const intro = createMessageBubble({
    role: "assistant",
    content:
      "안녕하세요. SEnS/I AI입니다.\n" +
      "상단에서 설비 / AlarmKey를 선택하고, 실제 발생한 알람 상황과 증상을 구체적으로 입력해 주세요.\n\n" +
      "예시)\n" +
      "- \"SUPRA N에서 Pin Move Timeout이 반복 발생할 때 어떤 순서로 CASE를 따라가야 하나요?\"\n" +
      "- \"Diff Temp Interlock 발생 후 Heater Chuck 온도는 정상이지만 Pin 쪽 온도가 낮을 때 우선 확인 항목이 뭐예요?\"",
  });
  chatMessages.appendChild(intro);
  scrollToBottom();
}

function addIntroIfNeeded() {
  if (chatMessages.dataset.initialized === "1") return;
  chatMessages.dataset.initialized = "1";
  addIntro();
}

// ─────────────────────────────────────────────
// 임베딩 생성 (지식 동기화)
// ─────────────────────────────────────────────
async function handleBuildEmbeddings() {
  clearStatus();
  setLoading(true);
  setStatus("rag_chunks → rag_embeddings 임베딩 생성/갱신 중입니다...", "info");

  try {
    const resp = await fetch(`${API_BASE}/api/ts-rag/build-embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchSize: 200 }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || "서버 오류가 발생했습니다.");
    }

    const data = await resp.json();
    if (!data.ok) throw new Error(data.message || "임베딩 생성 실패");

    const created = data.result?.created ?? 0;
    setStatus(`임베딩 생성 완료: ${created}개 처리되었습니다.`, "success");
  } catch (err) {
    console.error("[buildEmbeddings] error:", err);
    setStatus(`임베딩 생성 중 오류: ${err.message}`, "error");
  } finally {
    setLoading(false);
  }
}

// ─────────────────────────────────────────────
// 질문 전송
// ─────────────────────────────────────────────
async function handleAsk() {
  if (isSending) return;

  const question = questionInput.value.trim();
  const equipment_type = equipmentTypeSelect.value || "";
  const alarm_key = alarmKeySelect.value || "";
  const topK = Number(topKInput.value) || 5;

  if (!question) {
    setStatus("질문을 입력해 주세요.", "error");
    questionInput.focus();
    return;
  }

  clearStatus();
  addIntroIfNeeded();

  // 사용자 메시지 표시
  const userBubble = createMessageBubble({ role: "user", content: question });
  chatMessages.appendChild(userBubble);

  // 로딩 말풍선 표시
  const loadingBubble = createMessageBubble({
    role: "assistant",
    content: "",
    loading: true,
  });
  chatMessages.appendChild(loadingBubble);
  scrollToBottom();

  setLoading(true);

  try {
    const resp = await fetch(`${API_BASE}/api/ts-rag/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        equipment_type,
        alarm_key,
        topK,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.message || "서버 오류가 발생했습니다.");
    }

    const data = await resp.json();
    if (!data.ok) {
      throw new Error(data.message || "AI 응답 처리 중 오류가 발생했습니다.");
    }

    const answer = data.answer || "응답이 비어 있습니다.";
    const hits = data.hits || [];

    const answerBubble = createMessageBubble({
      role: "assistant",
      content: answer,
      hits,
    });

    chatMessages.replaceChild(answerBubble, loadingBubble);
    scrollToBottom();
    questionInput.value = "";
  } catch (err) {
    console.error("[ask] error:", err);

    const errorBubble = createMessageBubble({
      role: "assistant",
      content:
        "❌ 질문 처리 중 오류가 발생했습니다.\n" +
        "지식 동기화(임베딩 생성)가 되지 않았거나 서버 설정 문제일 수 있습니다.\n" +
        "상단의 [⚙️ 지식 동기화] 버튼을 먼저 실행한 뒤 다시 시도해 주세요.",
    });
    chatMessages.replaceChild(errorBubble, loadingBubble);
    scrollToBottom();

    setStatus(`오류: ${err.message}`, "error");
  } finally {
    setLoading(false);
  }
}

// ─────────────────────────────────────────────
// 샘플 질문 바인딩
// ─────────────────────────────────────────────
function bindSampleQuestions() {
  const samples = document.querySelectorAll(".ts-sample");
  samples.forEach((el) => {
    el.addEventListener("click", () => {
      const q = el.getAttribute("data-q") || "";
      questionInput.value = q;
      questionInput.focus();
    });
  });
}

// 새 알람 대화 (리셋)
function handleNewChat() {
  chatMessages.innerHTML = "";
  delete chatMessages.dataset.initialized;
  clearStatus();
  addIntroIfNeeded();
  questionInput.value = "";
  questionInput.focus();
}

// ─────────────────────────────────────────────
// 이벤트 바인딩 / 초기화
// ─────────────────────────────────────────────
function bindEvents() {
  btnBuildEmbeddings.addEventListener("click", handleBuildEmbeddings);
  btnAsk.addEventListener("click", handleAsk);

  if (btnNewChat) {
    btnNewChat.addEventListener("click", handleNewChat);
  }

  questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAsk();
    }
  });
}

function init() {
  addIntroIfNeeded();
  bindSampleQuestions();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);
