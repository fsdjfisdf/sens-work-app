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

// 모바일 필터 토글
const filterToggle = $("filterToggle");
const sidebarBackdrop = $("sidebarBackdrop");

let isSending = false;
// 근거 상세 모달 요소
const evidenceModal = $("evidenceModal");
const evidenceModalTitle = $("evidenceModalTitle");
const evidenceModalTag = $("evidenceModalTag");
const evidenceModalMeta = $("evidenceModalMeta");
const evidenceModalBody = $("evidenceModalBody");
const evidenceModalClose = $("evidenceModalClose");
const evidenceModalClose2 = $("evidenceModalClose2");
const evidenceModalCopy = $("evidenceModalCopy");
const evidenceModalBackdrop = evidenceModal
  ? evidenceModal.querySelector(".ts-modal-backdrop")
  : null;


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
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  });
}

// HTML 이스케이프
function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─────────────────────────────────────────────
// 메시지 렌더링 (Q: 오른쪽, A: 왼쪽)
// ─────────────────────────────────────────────
function createMessageBubble({ role, content, hits, loading }) {
  // role: "user" | "assistant" | "system"
  let roleClass = "assistant";
  if (role === "user") roleClass = "user";
  else if (role === "system") roleClass = "system";

  const row = document.createElement("div");
  row.className = `ts-msg ts-msg-${roleClass}`;

  const inner = document.createElement("div");
  inner.className = "ts-msg-inner";

  if (loading) {
    // 로딩 애니메이션 제거 → 간단한 안내 텍스트만
    inner.innerHTML = `
      <div style="font-size:12px; color:#9ca3af;">
        관련 알람·작업 이력을 조회하는 중입니다. 잠시만 기다려 주세요.
      </div>
    `;
  } else {
    // 본문
    const body = document.createElement("div");
    body.className = "ts-msg-body";

    let safe = escapeHtml(content || "").replace(/\n/g, "<br/>");
    // [중요], [주의], [안전] 태그 하이라이트
    safe = safe
      .replace(/\[중요\]/g, '<span class="ts-tag ts-tag-important">중요</span>')
      .replace(/\[주의\]/g, '<span class="ts-tag ts-tag-warning">주의</span>')
      .replace(/\[안전\]/g, '<span class="ts-tag ts-tag-safety">안전</span>');

    body.innerHTML = safe || "(내용 없음)";
    inner.appendChild(body);

    // 근거 hits 정리된 블록 (알람 / 작업 이력 구분)
    if (hits && hits.length) {
      const worklogHits = hits.filter(
        (h) => h.source_type === "WORK_LOG" || h.src_table === "work_log" || h.task_date
      );
      const alarmHits = hits.filter((h) => !worklogHits.includes(h));

      if (alarmHits.length) {
        const sec = buildRefSection("alarm", alarmHits);
        inner.appendChild(sec);
      }
      if (worklogHits.length) {
        const sec = buildRefSection("worklog", worklogHits);
        inner.appendChild(sec);
      }
    }
  }

  row.appendChild(inner);
  return row;
}

// ─────────────────────────────────────────────
// Evidence Modal (근거 상세 보기)
// ─────────────────────────────────────────────
function openEvidenceModal(hit) {
  if (!evidenceModal) return;

  // WORK LOG 인지 TS 인지 판별
  const isWorkLog =
    hit.source_type === "WORK_LOG" ||
    hit.src_table === "work_log" ||
    !!hit.task_date;

  // 태그(초록/파랑 라벨)
  evidenceModalTag.textContent = isWorkLog ? "WORK LOG" : "TS GUIDE";
  evidenceModalTag.classList.remove("ts-modal-tag-log", "ts-modal-tag-ts");
  evidenceModalTag.classList.add(isWorkLog ? "ts-modal-tag-log" : "ts-modal-tag-ts");

  // 제목
  if (isWorkLog) {
    const titleText =
      hit.title ||
      `${hit.task_date || ""} · ${hit.equipment_type || ""} · ${hit.equipment_name || ""}`.trim();
    evidenceModalTitle.textContent = titleText || "작업 이력 근거";
  } else {
    const titleText =
      hit.title ||
      `[${hit.equipment_type || "-"} · ${hit.alarm_key || "-"}] CASE ${
        hit.case_no ?? "-"
      } · STEP ${hit.step_no ?? "-"}`;
    evidenceModalTitle.textContent = titleText || "알람 TS 근거";
  }

  // 메타 정보 (칩 형태)
  const metaBits = [];
  if (isWorkLog) {
    if (hit.task_date) metaBits.push(`날짜 · ${hit.task_date}`);
    if (hit.equipment_type || hit.equipment_name) {
      metaBits.push(
        `설비 · ${hit.equipment_type || "-"} / ${hit.equipment_name || "-"}`
      );
    }
    if (hit.group_name || hit.site || hit.line) {
      metaBits.push(
        `그룹/사이트/라인 · ${hit.group_name || "-"} / ${
          hit.site || "-"
        } / ${hit.line || "-"}`
      );
    }
    if (hit.work_type) metaBits.push(`작업타입 · ${hit.work_type}`);
    if (hit.setup_item) metaBits.push(`SETUP_ITEM · ${hit.setup_item}`);
    if (hit.transfer_item) metaBits.push(`TRANSFER_ITEM · ${hit.transfer_item}`);
  } else {
    if (hit.equipment_type) metaBits.push(`설비 · ${hit.equipment_type}`);
    if (hit.alarm_key) metaBits.push(`AlarmKey · ${hit.alarm_key}`);
    if (hit.case_no != null) metaBits.push(`CASE · ${hit.case_no}`);
    if (hit.step_no != null) metaBits.push(`STEP · ${hit.step_no}`);
  }
  if (hit.score != null) {
    metaBits.push(`유사도 score · ${(hit.score ?? 0).toFixed(3)}`);
  }

  evidenceModalMeta.innerHTML = "";
  metaBits.forEach((m) => {
    const span = document.createElement("span");
    span.textContent = m;
    evidenceModalMeta.appendChild(span);
  });

  // 본문: content 전체 (없으면 task_description)
  const raw = hit.content || hit.task_description || "";
  const safe = escapeHtml(raw).replace(/\n/g, "<br/>");
  evidenceModalBody.innerHTML = safe || "(내용 없음)";

  evidenceModal.classList.remove("ts-modal-hidden");
}

function closeEvidenceModal() {
  if (!evidenceModal) return;
  evidenceModal.classList.add("ts-modal-hidden");
}

function copyEvidenceText() {
  if (!evidenceModalBody) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = evidenceModalBody.innerHTML;
  const text = tmp.textContent || tmp.innerText || "";
  navigator.clipboard.writeText(text.trim()).catch(() => {});
}


// 참조 알람 / 작업 이력 섹션 생성
function buildRefSection(kind, hits) {
  const section = document.createElement("div");
  section.className =
    "ts-ref-section " + (kind === "alarm" ? "ts-ref-alarm" : "ts-ref-worklog");

  const title = document.createElement("div");
  title.className = "ts-ref-title";

  const badge = document.createElement("span");
  badge.className = "ts-ref-title-badge";

  if (kind === "alarm") {
    badge.textContent = "알람 TS 근거";
  } else {
    badge.textContent = "작업 이력 근거";
  }

  const titleText = document.createElement("span");
  titleText.textContent = `${hits.length}개 참조`;

  title.appendChild(badge);
  title.appendChild(titleText);

  const body = document.createElement("div");
  body.className = "ts-ref-body";

  // 너무 길어지지 않게 상위 3개만 상세 노출
  hits.slice(0, 3).forEach((hit) => {
    const line = document.createElement("button");
    line.type = "button";
    line.className = "ts-ref-row";

    let text;
    if (kind === "worklog") {
      const meta = [
        hit.task_date || "",
        hit.equipment_type || "",
        hit.equipment_name || "",
        hit.work_type || ""
      ]
        .filter(Boolean)
        .join(" · ");

      const snippet = (hit.content || hit.task_description || "")
        .split("\n")
        .slice(0, 2)
        .join(" / ");

      text = `[${meta || "WORK_LOG"}] ${snippet}`;
    } else {
      const meta = [
        hit.equipment_type || "",
        hit.alarm_key || "",
        hit.case_no != null ? `CASE ${hit.case_no}` : "",
        hit.step_no != null ? `STEP ${hit.step_no}` : ""
      ]
        .filter(Boolean)
        .join(" · ");

      const snippet = (hit.content || "")
        .split("\n")
        .slice(0, 2)
        .join(" / ");

      text = `[${meta || "ALARM"}] ${snippet}`;
    }

    line.textContent = text;

    // ★ 여기에서 클릭 시 모달 오픈 ★
    line.addEventListener("click", () => openEvidenceModal(hit));

    body.appendChild(line);
  });


  if (hits.length > 3) {
    const more = document.createElement("div");
    more.style.fontSize = "11px";
    more.style.color = "#9ca3af";
    more.textContent = `+ ${hits.length - 3}개 더 참조됨`;
    body.appendChild(more);
  }

  section.appendChild(title);
  section.appendChild(body);
  return section;
}

// 초기 안내 메시지
function addIntro() {
  const intro = createMessageBubble({
    role: "assistant",
    content:
      "안녕하세요, SEnS/I AI입니다.\n\n" +
      "기본적으로 설비 종류만 선택하면 바로 답변을 드립니다.\n" +
      "더 자세한 내용이 필요하면 좌측의 작업 이력 필터를 사용해 주세요."
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
      body: JSON.stringify({ batchSize: 200 })
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

  // 사용자 메시지 (오른쪽)
  const userBubble = createMessageBubble({ role: "user", content: question });
  chatMessages.appendChild(userBubble);

  // 로딩 버블 (왼쪽, 단순 텍스트)
  const loadingBubble = createMessageBubble({
    role: "assistant",
    content: "",
    loading: true
  });
  chatMessages.appendChild(loadingBubble);
  scrollToBottom();

  setLoading(true);

  try {
    const body = {
      question,
      topK,
      equipment_type,
      alarm_key
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
      body: JSON.stringify(body)
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
      hits
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
        "상단의 [⚙️ Embedding] 버튼으로 먼저 동기화를 진행한 뒤 다시 시도해 주세요."
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
// 모바일 사이드바(필터) 토글
// ─────────────────────────────────────────────
function bindSidebarToggle() {
  if (filterToggle) {
    filterToggle.addEventListener("click", () => {
      document.body.classList.toggle("ts-sidebar-open");
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => {
      document.body.classList.remove("ts-sidebar-open");
    });
  }
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

  // Ctrl+Enter / Cmd+Enter 로 전송
  questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAsk();
    }
  });

  if (evidenceModalClose) {
    evidenceModalClose.addEventListener("click", closeEvidenceModal);
  }
  if (evidenceModalClose2) {
    evidenceModalClose2.addEventListener("click", closeEvidenceModal);
  }
  if (evidenceModalBackdrop) {
    evidenceModalBackdrop.addEventListener("click", closeEvidenceModal);
  }
  if (evidenceModalCopy) {
    evidenceModalCopy.addEventListener("click", copyEvidenceText);
  }

  bindSidebarToggle();
}

function init() {
  addIntroIfNeeded();
  bindSampleQuestions();
  bindEvents();
  refreshSetupTransferEnabled();
}

document.addEventListener("DOMContentLoaded", init);
