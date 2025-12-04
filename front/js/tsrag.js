// tsrag.js

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

// Work Log 필터
const filterDateFrom = $("filterDateFrom");
const filterDateTo = $("filterDateTo");
const filterEqName = $("filterEqName");
const filterWorker = $("filterWorker");
const filterGroup = $("filterGroup");
const filterSite = $("filterSite");
const filterWorkType = $("filterWorkType");
const filterSetupItem = $("filterSetupItem");
const filterTransferItem = $("filterTransferItem");

let isSending = false;

// ─────────────────────────────────────────────
// TRANSFER ITEM 옵션 (equipment_type 별)
// ─────────────────────────────────────────────
const transferOptions = {
  "SUPRA N": [
    "SELECT", "LP ESCORT", "ROBOT ESCORT", "SR8241 TEACHING", "SR8240 TEACHING",
    "M124 TEACHING", "EFEM FIXTURE", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER",
    "SR8250 TEACHING", "SR8232 TEACHING", "TM FIXTURE", "TM ROBOT REP",
    "TM ROBOT CONTROLLER", "PASSIVE PAD REP", "PIN CYLINDER", "PUSHER CYLINDER",
    "IB FLOW", "DRT", "FFU CONTROLLER", "FAN", "MOTOR DRIVER",
    "R1", "R3", "R5", "R3 TO R5", "PRISM", "MICROWAVE", "APPLICATOR",
    "GENERATOR", "CHUCK", "PROCESS KIT", "HELIUM DETECTOR", "HOOK LIFT PIN",
    "BELLOWS", "PIN SENSOR", "LM GUIDE", "PIN MOTOR CONTROLLER", "SINGLE EPD",
    "DUAL EPD", "GAS BOX BOARD", "TEMP CONTROLLER BOARD",
    "POWER DISTRIBUTiON BOARD", "DC POWER SUPPLY", "BM SENSOR", "PIO SENSOR",
    "SAFETY MODULE", "IO BOX", "FPS BOARD", "D-NET", "MFC", "VALVE", "SOLENOID",
    "FAST VAC VALVE", "SLOW VAC VALVE", "SLIT DOOR", "APC VALVE",
    "SHUTOFF VALVE", "BARATRON ASS'Y", "PIRANI ASS'Y", "VIEW PORT QUARTZ",
    "FLOW SWITCH", "CERAMIC PLATE", "MONITOR", "KEYBOARD", "HEATING JACKET",
    "WATER LEAK DETECTOR", "MANOMETER", "MOUSE", "CTC", "PMC", "EDA",
    "TEMP LIMIT CONTROLLER", "TEMP CONTROLLER", "EFEM CONTROLLER", "S/W PATCH"
  ],
  "SUPRA XP": [
    "SELECT", "LP ESCORT", "ROBOT ESCORT", "SR8241 TEACHING", "ROBOT REP",
    "ROBOT CONTROLLER REP", "END EFFECTOR REP", "PERSIMMON TEACHING",
    "END EFFECTORPAD REP", "LL PIN", "LL SENSOR", "LL DSA", "GAS LINE",
    "LL ISOLATION VV", "FFU CONTROLLER", "FAN", "MOTOR DRIVER", "MATCHER",
    "3000QC", "3100QC", "CHUCK", "PROCESS KIT", "SLOT VALVE BLADE",
    "TEFLON ALIGN PIN", "O-RING", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
    "PIN BOARD", "LM GUIDE", "PIN MOTOR CONTROLLER", "LASER PIN SENSOR",
    "DUAL", "DC POWER SUPPLY", "PIO SENSOR", "D-NET", "SIM BOARD", "MFC",
    "VALVE", "SOLENOID", "PENDULUM VALVE", "SLOT VALVE DOOR VALVE",
    "SHUTOFF VALVE", "RF GENERATOR", "BARATRON ASSY", "PIRANI ASSY",
    "VIEW PORT QUARTZ", "FLOW SWITCH", "CERAMIC PLATE", "MONITOR", "KEYBOARD",
    "SIDE STORAGE", "32 MULTI PORT", "MINI8", "TM EPC (MFC)", "CTC",
    "EFEM CONTROLLER", "SW PATCH"
  ],
  "INTEGER Plus": [
    "SELECT", "SWAP KIT", "GAS LINE & GAS FILTER", "TOP FEED THROUGH",
    "GAS GEED THROUGH", "CERAMIC PARTS", "MATCHER", "PM BAFFLE", "AM BAFFLE",
    "FLANGE ADAPTOR", "SLOT VALVE ASSY(HOUSING)", "SLOT VALVE", "DOOR VALVE",
    "PENDULUM VALVE", "PIN ASSY MODIFY", "MOTOR & CONTROLLER",
    "PIN 구동부 ASSY", "PIN BELLOWS", "SENSOR", "STEP MOTOR & CONTROLLER",
    "CASSETTE & HOLDER PAD", "BALL SCREW ASSY", "BUSH", "MAIN SHAFT",
    "BELLOWS", "EFEM ROBOT REP", "TM ROBOT REP", "EFEM ROBOT TEACHING",
    "TM ROBOT TEACHING", "TM ROBOT SERVO PACK", "UNDER COVER", "VAC LINE",
    "BARATRON GAUGE", "PIRANI GAUGE", "CONVACTION GAUGE", "MANUAL VALVE",
    "PNEUMATIC VALVE", "ISOLATION VALVE", "VACUUM BLOCK", "CHECK VALVE",
    "EPC", "PURGE LINE REGULATOR", "COOLING CHUCK", "HEATER CHUCK",
    "GENERATOR", "D-NET BOARD", "SOURCE BOX BOARD", "INTERFACE BOARD",
    "SENSOR BOARD", "PIO SENSOR BOARD", "AIO CALIBRATION(PSK BOARD)",
    "AIO CALIBRATION(TOS BOARD)", "CODED SENSOR", "GAS BOX DOOR SENSOR",
    "LASER SENSOR AMP", "HE LEAK CHECK", "DIFFUSER", "LOT 조사", "GAS SPRING",
    "LP ESCORT"
  ],
  PRECIA: [
    "SELECT", "PM CENTERING", "PM CLN", "EFEM ROBOT TEACHING",
    "TM ROBOT TEACHING", "PM SLOT VALVE REP", "PM PEEK PLATE REP",
    "PM RF MATCHER REP", "PM PIN HOLDER REP", "PM GAP SENSOR ADJUST",
    "PM PROCESS KIT REP", "LOT 조사", "LP ESCORT"
  ],
  "ECOLITE 300": [
    "SELECT", "LP Escort", "Robot Escort", "SR8240 Teaching", "M124V Teaching",
    "M124C Teaching", "Robot REP", "Robot Controller REP", "SR8250 Teaching",
    "SR8232 Teaching", "Pin Cylinder", "Pusher Cylinder", "DRT",
    "FFU Controller", "Fan", "Motor Driver", "Microwave", "Applicator",
    "Applicator Tube", "Generator", "Matcher", "Chuck", "Toplid Process Kit",
    "Chamber Process Kit", "Helium Detector", "Hook Lift Pin", "Bellows",
    "Pin Sensor", "LM Guide", "HOOK LIFTER SERVO MOTOR", "Pin Motor Controller",
    "Single", "Gas Box Board", "Power Distribution Board", "DC Power Supply",
    "BM Sensor", "PIO Sensor", "Safety Module", "IO BOX", "Rack Board",
    "D-NET", "MFC", "Valve", "Solenoid", "Fast Vac Valve", "Slow Vac Valve",
    "Slit Door", "APC Valve", "Shutoff Valve", "Baratron Ass'y", "Pirani Ass'y",
    "View Port Quartz", "Flow Switch", "Monitor", "Keyboard", "Mouse",
    "Water Leak Detector", "Manometer", "LIGHT CURTAIN", "GAS SPRING", "CTC",
    "PMC", "EDA", "Temp Limit Controller", "Temp Controller", "EFEM CONTROLLER",
    "S/W Patch"
  ],
  GENEVA: [
    "SELECT", "LP Escort", "Robot Escort", "SR8240 Teaching",
    "GENMARK robot teaching", "SR8240 Robot REP", "GENMARK Robot REP",
    "Robot Controller REP", "FFU Controller", "Fan", "Motor Driver",
    "Elbow heater", "Insulation heater", "Chuck heater", "Harmonic driver",
    "Amplifier (Disc controller)", "Disc bearing", "Chuck leveling",
    "Wafer support pin alignment", "Temp profile", "O2 leak test", "Chuck up & down status",
    "Ring seal", "Ring seal O-ring", "Door seal", "Door seal O-ring",
    "Gas Box Board", "Temp Controller Board", "Power Distribution Board",
    "DC Power Supply", "Facility Board", "Station Board", "Bubbler Board",
    "D-NET", "MFC", "Valve", "O2 analyzer 교체", "O2 controller 교체",
    "O2 pump 교체", "O2 cell 교체", "O2 Sample valve", "Feed & Delivery valve",
    "Fill & Vent valve", "Drain valve", "APC valve", "Bypass valve",
    "Shutoff valve", "Vac sol valve", "Vac CDA valve", "Bubbler level sensor",
    "Bubbler flexible hose", "Baratron Ass'y", "View Port", "Flow Switch",
    "LL Door cylinder", "Chuck cylinder", "Monitor", "Keyboard", "Mouse",
    "Water Leak Detector", "Formic Detector", "Exhaust gauge", "CTC", "EDA",
    "Temp Limit Controller", "Temp Controller", "S/W Patch"
  ],
  HDW: [
    "SELECT", "OD REP", "Relay REP", "Fan REP", "NTC / NTU REP", "SSR REP",
    "MC REP", "Fuse REP", "CT REP", "HBD REP", "SMPS REP",
    "PLC (main unit 제외) REP", "ELB REP", "Heater (Halogen lamp) REP",
    "Q'tz tank REP", "Leak troubleshooting", "Flow meter REP",
    "Air valve REP", "Shut off valve REP", "Sol valve REP",
    "Elbow fitting (Q'tz) REP", "Leak tray", "TC Sensor", "Touch panel patch",
    "PLC patch", "Touch panel REP", "PLC REP"
  ]
};

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
// 메시지 렌더링
// ─────────────────────────────────────────────
function createMessageBubble({ role, content, hits, loading }) {
  const row = document.createElement("div");
  row.className = `ts-msg-row ts-msg-${role}`;

  const bubble = document.createElement("div");
  bubble.className = "ts-msg-bubble";

  const avatar = document.createElement("div");
  avatar.className = "ts-msg-avatar";
  avatar.textContent = role === "user" ? "나" : "TS";

  const inner = document.createElement("div");
  inner.className = "ts-msg-inner";

  const meta = document.createElement("div");
  meta.className = "ts-msg-meta";
  meta.textContent = role === "user" ? "You" : "TS RAG · Alarm + Work Log";

  const body = document.createElement("div");
  body.className = "ts-msg-body";

  if (loading) {
    body.innerHTML = `
      <span class="ts-loader">
        <span class="ts-loader-dots">
          <span></span><span></span><span></span>
        </span>
        <span>관련 알람·작업 이력을 찾는 중입니다...</span>
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

  // 근거 hits
  if (hits && hits.length && !loading) {
    const anyWorkLog = hits.some(
      (h) =>
        h.source_type === "WORK_LOG" ||
        h.src_table === "work_log" ||
        h.task_date
    );

    const details = document.createElement("details");
    details.className = "ts-evidence-details";
    details.open = false;

    const summary = document.createElement("summary");
    summary.textContent = anyWorkLog
      ? `참조 알람 / 작업 이력 (${hits.length}개)`
      : `참조 CASE/STEP (${hits.length}개)`;
    details.appendChild(summary);

    hits.forEach((hit) => {
      const card = document.createElement("div");
      card.className = "ts-evidence-card";

      const title = document.createElement("div");
      title.className = "ts-evidence-title";

      if (hit.source_type === "WORK_LOG" || hit.task_date) {
        title.textContent =
          hit.title ||
          `[WORK_LOG] ${hit.task_date || ""} ${hit.equipment_name || ""}`;
      } else {
        title.textContent =
          hit.title ||
          `[${hit.equipment_type || "-"}] ${hit.alarm_key || ""} · CASE ${
            hit.case_no ?? "-"
          } · STEP ${hit.step_no ?? "-"}`;
      }

      const metaRow = document.createElement("div");
      metaRow.className = "ts-evidence-meta";

      if (hit.source_type === "WORK_LOG" || hit.task_date) {
        metaRow.innerHTML = `
          <span>${hit.task_date || "-"}</span>
          <span>${hit.equipment_type || "-"} - ${hit.equipment_name || "-"}</span>
          <span>${hit.group_name || "-"} / ${hit.site || "-"} / ${hit.line || "-"}</span>
          <span>${hit.work_type || "-"}</span>
          <span>score: ${(hit.score ?? 0).toFixed(3)}</span>
        `;
      } else {
        metaRow.innerHTML = `
          <span>${hit.equipment_type || "-"}</span>
          <span>${hit.alarm_key || "-"}</span>
          <span>CASE ${hit.case_no ?? "-"}</span>
          <span>STEP ${hit.step_no ?? "-"}</span>
          <span>score: ${(hit.score ?? 0).toFixed(3)}</span>
        `;
      }

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
      "안녕하세요. SEnS/I AI입니다.\n\n" +
      "이 화면 하나에서 Alarm TS + 실제 작업 이력을 동시에 참고해서 답변합니다.\n" +
      "- 상단: 설비 타입 / AlarmKey\n" +
      "- 아래: 작업 이력 필터(기간, 설비명, 작업자, 그룹/사이트, 작업 타입, SETUP/TRANSFER 항목)\n\n" +
      "예시)\n" +
      "- \"SUPRA N에서 Pin Move Timeout이 날 때, 비슷한 CASE랑 실제 작업 이력까지 같이 정리해줘\"\n" +
      "- \"2025-10-30에 EPAB301에서 어떤 작업들이 있었는지 정리해줘\"\n" +
      "- \"정현우 엔지니어의 최근 한 달간 PRECIA Lot 조사 관련 작업이력만 모아서 요약해줘\"",
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
// 임베딩 생성
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
// Work Log 필터 상태 제어
// ─────────────────────────────────────────────
function refreshSetupTransferEnabled() {
  const workType = filterWorkType?.value || "";
  // SETUP_ITEM: SET UP, RELOCATION 에서만
  if (filterSetupItem) {
    if (workType === "SET UP" || workType === "RELOCATION") {
      filterSetupItem.disabled = false;
    } else {
      filterSetupItem.disabled = true;
      filterSetupItem.value = "";
    }
  }

  // TRANSFER_ITEM: MAINT 에서만
  if (filterTransferItem) {
    if (workType === "MAINT") {
      filterTransferItem.disabled = false;
      populateTransferOptions();
    } else {
      filterTransferItem.disabled = true;
      filterTransferItem.value = "";
    }
  }
}

function populateTransferOptions() {
  if (!filterTransferItem) return;
  const eqType = equipmentTypeSelect?.value || "";
  const opts = transferOptions[eqType] || [];

  const current = filterTransferItem.value;
  filterTransferItem.innerHTML = `<option value="">선택</option>`;
  opts.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    filterTransferItem.appendChild(opt);
  });

  if (opts.includes(current)) {
    filterTransferItem.value = current;
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

  const userBubble = createMessageBubble({ role: "user", content: question });
  chatMessages.appendChild(userBubble);

  const loadingBubble = createMessageBubble({
    role: "assistant",
    content: "",
    loading: true,
  });
  chatMessages.appendChild(loadingBubble);
  scrollToBottom();

  setLoading(true);

  try {
    const body = {
      question,
      topK,
      equipment_type,
      alarm_key,
    };

    // Work Log 필터 값 추가
    const dateFrom = filterDateFrom?.value || "";
    const dateTo = filterDateTo?.value || "";
    const eqName = (filterEqName?.value || "").trim();
    const workerName = (filterWorker?.value || "").trim();
    const group = filterGroup?.value || "";
    const site = filterSite?.value || "";
    const workType = filterWorkType?.value || "";
    const setupItem = filterSetupItem?.value || "";
    const transferItem = filterTransferItem?.value || "";

    if (dateFrom) body.date_from = dateFrom;
    if (dateTo) body.date_to = dateTo;
    if (eqName) body.equipment_name = eqName;
    if (workerName) body.workers_clean = workerName;
    if (group) body.group_name = group;
    if (site) body.group_site = site;
    if (workType) body.work_type = workType;
    if (setupItem) body.setup_item = setupItem;
    if (transferItem) body.transfer_item = transferItem;

    const resp = await fetch(`${API_BASE}/api/ts-rag/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
        "임베딩이 충분히 생성되지 않았거나 서버 설정 문제일 수 있습니다.\n" +
        "상단의 [⚙️ Embedding] 버튼으로 먼저 동기화를 진행한 뒤 다시 시도해 주세요.",
    });
    chatMessages.replaceChild(errorBubble, loadingBubble);
    scrollToBottom();

    setStatus(`오류: ${err.message}`, "error");
  } finally {
    setLoading(false);
  }
}

// ─────────────────────────────────────────────
// 샘플 질문 / 새 대화
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

  if (filterWorkType) {
    filterWorkType.addEventListener("change", refreshSetupTransferEnabled);
  }

  if (equipmentTypeSelect) {
    equipmentTypeSelect.addEventListener("change", () => {
      if (filterWorkType?.value === "MAINT") {
        populateTransferOptions();
      }
    });
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
  refreshSetupTransferEnabled();
}

document.addEventListener("DOMContentLoaded", init);
