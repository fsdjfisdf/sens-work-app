// src/pci/geneva_setup/pciConfig.js

/** 인정 장비 타입 (work_log.equipment_type 필터) — 필요 시 추가/수정 */
exports.ALLOWED_EQUIP_TYPES = [
  "GENEVA", "GENEVA 300", "GENEVA 400", "GENEVA XP", "GENEVA Plus", "GENEVA plus", "GENEVA PLUS"
];

const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();
const canon = (s) =>
  upper(s)
    .replace(/ASS'Y/g, "ASSY")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
exports.canon = canon;

/** 기준 작업 수 */
exports.BASELINE = {
  "INSTALLATION PREPARATION": 5,
  "FAB IN": 5,
  "DOCKING": 10,
  "CABLE HOOK UP": 10,
  "POWER TURN ON": 10,
  "UTILITY TURN ON": 5,
  "GAS TURN ON": 5,
  "TEACHING": 15,
  "PART INSTALLATION": 5,
  "LEAK CHECK": 5,
  "TTTM": 15,
  "CUSTOMER CERTIFICATION": 10,
  "PROCESS CONFIRM": 3,
};

/** 표기 보정(카테고리 및 대표 소항목 일부) */
const ALIASES = {
  // 카테고리 오탈자/붙임표 등
  "INSTALLATION PREPERATION": "INSTALLATION PREPARATION",
  "FABIN": "FAB IN",
  "CABLE HOOKUP": "CABLE HOOK UP",
  "POWER TURNON": "POWER TURN ON",
  "UTILITY TURNON": "UTILITY TURN ON",
  "GAS TURNON": "GAS TURN ON",

  // 소항목(띄어쓰기 → 언더스코어 통일)
  "INST IMPORT ORDER": "INST_IMPORT_ORDER",
  "INST PACKING LIST": "INST_PACKING_LIST",
  "INST OHT LINE CHECK": "INST_OHT_LINE_CHECK",
  "INST SPACING CHECK": "INST_SPACING_CHECK",
  "INST DRAW SETUP": "INST_DRAW_SETUP",
  "INST DRAW MARKING": "INST_DRAW_MARKING",
  "INST UTILITY SPEC": "INST_UTILITY_SPEC",

  "FAB MODULE UNPACK": "FAB_MODULE_UNPACK",
  "FAB MODULE CLEAN": "FAB_MODULE_CLEAN",
  "FAB MODULE MOVE": "FAB_MODULE_MOVE",

  "DOCK TOOL SIZE": "DOCK_TOOL_SIZE",
  "DOCK LASER JIG": "DOCK_LASER_JIG",
  "DOCK JACK USE": "DOCK_JACK_USE",
  "DOCK HEIGHT CHECK": "DOCK_HEIGHT_CHECK",
  "DOCK MODULE CONNECT": "DOCK_MODULE_CONNECT",
  "DOCK REALIGN": "DOCK_REALIGN",
  "DOCK LEVEL POS": "DOCK_LEVEL_POS",
  "DOCK LEVEL SPEC": "DOCK_LEVEL_SPEC",
  "DOCK HOOK UP": "DOCK_HOOK_UP",

  "CABLE TRAY ARRANGE": "CABLE_TRAY_ARRANGE",
  "CABLE REAR MONITOR": "CABLE_REAR_MONITOR",
  "CABLE EFEM PM SIGNAL": "CABLE_EFEM_PM_SIGNAL",
  "CABLE BUBBLER PM CONNECT": "CABLE_BUBBLER_PM_CONNECT",
  "CABLE FORMIC PM CONNECT": "CABLE_FORMIC_PM_CONNECT",

  "POWER GPS UPS SPS": "POWER_GPS_UPS_SPS",
  "POWER TURN SEQ": "POWER_TURN_SEQ",
  "POWER ALARM TROUBLE": "POWER_ALARM_TROUBLE",
  "POWER CB UNDERSTAND": "POWER_CB_UNDERSTAND",
  "POWER SAFETY MODULE": "POWER_SAFETY_MODULE",
  "POWER EMO CHECK": "POWER_EMO_CHECK",
  "POWER SYCON NUMBER": "POWER_SYCON_NUMBER",
  "POWER SYCON SETUP": "POWER_SYCON_SETUP",
  "POWER SYCON TROUBLE": "POWER_SYCON_TROUBLE",

  "UTIL TURN SEQ": "UTIL_TURN_SEQ",
  "UTIL VACUUM TURN": "UTIL_VACUUM_TURN",
  "UTIL CDA TURN": "UTIL_CDA_TURN",
  "UTIL PCW TURN": "UTIL_PCW_TURN",
  "UTIL EXHAUST TURN": "UTIL_EXHAUST_TURN",

  "GAS TURN SEQ": "GAS_TURN_SEQ",
  "GAS N2 CHECK": "GAS_N2_CHECK",
  "GAS FORMIC CHECK": "GAS_FORMIC_CHECK",

  "TEACH ROBOT CONTROL": "TEACH_ROBOT_CONTROL",
  "TEACH ROBOT LEVELING": "TEACH_ROBOT_LEVELING",
  "TEACH ARM LEVELING": "TEACH_ARM_LEVELING",
  "TEACH LOAD PORT": "TEACH_LOAD_PORT",
  "TEACH ALIGNER": "TEACH_ALIGNER",
  "TEACH LOADLOCK": "TEACH_LOADLOCK",
  "TEACH DATA SAVE": "TEACH_DATA_SAVE",
  "TEACH MICRO ADJUST": "TEACH_MICRO_ADJUST",
  "TEACH MARGIN CHECK": "TEACH_MARGIN_CHECK",
  "TEACH SEMI TRANSFER": "TEACH_SEMI_TRANSFER",

  "PART EXHAUST PORT": "PART_EXHAUST_PORT",
  "PART END EFFECTOR": "PART_END_EFFECTOR",
  "PART END EFFECTOR LEVEL": "PART_END_EFFECTOR_LEVEL",
  "PART APC SETUP": "PART_APC_SETUP",
  "PART PROCESS KIT": "PART_PROCESS_KIT",
  "PART PIO SENSOR": "PART_PIO_SENSOR",
  "PART CCTV SETUP": "PART_CCTV_SETUP",

  "LEAK PM": "LEAK_PM",
  "LEAK GAS LINE": "LEAK_GAS_LINE",
  "LEAK LL": "LEAK_LL",
  "LEAK BUBBLER": "LEAK_BUBBLER",
  "LEAK SOLENOID": "LEAK_SOLENOID",
  "LEAK FORMIC ON": "LEAK_FORMIC_ON",
  "LEAK FORMIC GAS": "LEAK_FORMIC_GAS",

  "TTTM CHUCK LEVEL": "TTTM_CHUCK_LEVEL",
  "TTTM CHUCK SPEED": "TTTM_CHUCK_SPEED",
  "TTTM TEMP CALIBRATION": "TTTM_TEMP_CALIBRATION",
  "TTTM TEMP PROFILE": "TTTM_TEMP_PROFILE",
  "TTTM SEASONING TEST": "TTTM_SEASONING_TEST",
  "TTTM APC AUTO LEARN": "TTTM_APC_AUTO_LEARN",
  "TTTM REGULATOR": "TTTM_REGULATOR",
  "TTTM MFC ZERO CAL": "TTTM_MFC_ZERO_CAL",
  "TTTM HW SETUP": "TTTM_HW_SETUP",
  "TTTM MFC HUNTING": "TTTM_MFC_HUNTING",
  "TTTM GAS LEAK CHECK": "TTTM_GAS_LEAK_CHECK",
  "TTTM DNET CAL": "TTTM_DNET_CAL",
  "TTTM SHEET WRITE": "TTTM_SHEET_WRITE",

  "CUST OHT CERT": "CUST_OHT_CERT",
  "CUST IMARK LOC": "CUST_IMARK_LOC",
  "CUST LABELING": "CUST_LABELING",
  "CUST MID CERT": "CUST_MID_CERT",
  "CUST ENV QUAL": "CUST_ENV_QUAL",
  "CUST OHT LAYOUT": "CUST_OHT_LAYOUT",

  "PROC AGING TEST": "PROC_AGING_TEST",
  "PROC AR TEST": "PROC_AR_TEST",
  "PROC SCRATCH TEST": "PROC_SCRATCH_TEST",
  "PROC PARTICLE CHECK": "PROC_PARTICLE_CHECK",
  "PROC EES TOOL": "PROC_EES_TOOL",
};

/** 표시용 카테고리 정규화 */
exports.toDisplayCategory = (raw) => {
  const s = upper(raw).replace(/_/g, " ").trim();
  const via = ALIASES[s] || s;
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find((k) => canon(k) === canon(via));
  return hit || via;
};

/** 컨트롤러 호환용: 카테고리 정규화 */
exports.normalizeItem = (raw) => exports.toDisplayCategory(raw);

/** 컬럼 키 정규화(소항목) */
exports.normalizeKey = (raw) => {
  if (!raw) return "";
  const s = upper(raw).replace(/\s+/g, " ").trim();
  const via = ALIASES[s] || s;
  return via.replace(/ /g, "_");
};

exports.workerAliases = (name) =>
  (name || "").replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");

/** 카테고리 → 소항목(=GENEVA_SETUP 컬럼들) */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    "INST_IMPORT_ORDER",
    "INST_PACKING_LIST",
    "INST_OHT_LINE_CHECK",
    "INST_SPACING_CHECK",
    "INST_DRAW_SETUP",
    "INST_DRAW_MARKING",
    "INST_UTILITY_SPEC",
  ],
  FAB_IN: ["FAB_MODULE_UNPACK", "FAB_MODULE_CLEAN", "FAB_MODULE_MOVE"],
  DOCKING: [
    "DOCK_TOOL_SIZE",
    "DOCK_LASER_JIG",
    "DOCK_JACK_USE",
    "DOCK_HEIGHT_CHECK",
    "DOCK_MODULE_CONNECT",
    "DOCK_REALIGN",
    "DOCK_LEVEL_POS",
    "DOCK_LEVEL_SPEC",
    "DOCK_HOOK_UP",
  ],
  CABLE_HOOK_UP: [
    "CABLE_SORTING",
    "CABLE_GRATING",
    "CABLE_LADDER_RULES",
    "CABLE_CONNECTION",
    "CABLE_TRAY_ARRANGE",
    "CABLE_REAR_MONITOR",
    "CABLE_EFEM_PM_SIGNAL",
    "CABLE_BUBBLER_PM_CONNECT",
    "CABLE_FORMIC_PM_CONNECT",
  ],
  POWER_TURN_ON: [
    "POWER_GPS_UPS_SPS",
    "POWER_TURN_SEQ",
    "POWER_ALARM_TROUBLE",
    "POWER_CB_UNDERSTAND",
    "POWER_SAFETY_MODULE",
    "POWER_EMO_CHECK",
    "POWER_SYCON_NUMBER",
    "POWER_SYCON_SETUP",
    "POWER_SYCON_TROUBLE",
  ],
  UTILITY_TURN_ON: [
    "UTIL_TURN_SEQ",
    "UTIL_VACUUM_TURN",
    "UTIL_CDA_TURN",
    "UTIL_PCW_TURN",
    "UTIL_EXHAUST_TURN",
  ],
  GAS_TURN_ON: ["GAS_TURN_SEQ", "GAS_N2_CHECK", "GAS_FORMIC_CHECK"],
  TEACHING: [
    "TEACH_ROBOT_CONTROL",
    "TEACH_ROBOT_LEVELING",
    "TEACH_ARM_LEVELING",
    "TEACH_LOAD_PORT",
    "TEACH_ALIGNER",
    "TEACH_LOADLOCK",
    "TEACH_DATA_SAVE",
    "TEACH_MICRO_ADJUST",
    "TEACH_MARGIN_CHECK",
    "TEACH_SEMI_TRANSFER",
  ],
  PART_INSTALLATION: [
    "PART_EXHAUST_PORT",
    "PART_END_EFFECTOR",
    "PART_END_EFFECTOR_LEVEL",
    "PART_APC_SETUP",
    "PART_PROCESS_KIT",
    "PART_PIO_SENSOR",
    "PART_CCTV_SETUP",
  ],
  LEAK_CHECK: [
    "LEAK_PM",
    "LEAK_GAS_LINE",
    "LEAK_LL",
    "LEAK_BUBBLER",
    "LEAK_SOLENOID",
    "LEAK_FORMIC_ON",
    "LEAK_FORMIC_GAS",
  ],
  TTTM: [
    "TTTM_CHUCK_LEVEL",
    "TTTM_CHUCK_SPEED",
    "TTTM_TEMP_CALIBRATION",
    "TTTM_TEMP_PROFILE",
    "TTTM_SEASONING_TEST",
    "TTTM_APC_AUTO_LEARN",
    "TTTM_REGULATOR",
    "TTTM_MFC_ZERO_CAL",
    "TTTM_HW_SETUP",
    "TTTM_MFC_HUNTING",
    "TTTM_GAS_LEAK_CHECK",
    "TTTM_DNET_CAL",
    "TTTM_SHEET_WRITE",
  ],
  CUSTOMER_CERTIFICATION: [
    "CUST_OHT_CERT",
    "CUST_IMARK_LOC",
    "CUST_LABELING",
    "CUST_MID_CERT",
    "CUST_ENV_QUAL",
    "CUST_OHT_LAYOUT",
  ],
  PROCESS_CONFIRM: [
    "PROC_AGING_TEST",
    "PROC_AR_TEST",
    "PROC_SCRATCH_TEST",
    "PROC_PARTICLE_CHECK",
    "PROC_EES_TOOL",
  ],
};

/** DAO에서 쓰는: 카테고리로 체크리스트 키 배열 얻기 */
exports.getChecklistKeysForCategory = (catDisplay) => {
  const disp = exports.toDisplayCategory(catDisplay);
  const key = Object.keys(exports.CATEGORY_ITEMS).find((k) => canon(k) === canon(disp));
  return key ? exports.CATEGORY_ITEMS[key] : [];
};

/** 소항목 → 설명(프런트 툴팁/모달) */
exports.CHECK_TITLES = {
  INST_IMPORT_ORDER: "설비반입 순서를 숙지하고 있는가?",
  INST_PACKING_LIST: "Packing List 확인하여 반입 Part 확인이 가능 한가?",
  INST_OHT_LINE_CHECK: "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?",
  INST_SPACING_CHECK: "설비간 유격거리가 충분한지 확인 알고 있는가?",
  INST_DRAW_SETUP: "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
  INST_DRAW_MARKING: "Drawing Template를 펼쳐 타공, H빔 및 Adjust를 Marking 알고 있는가?",
  INST_UTILITY_SPEC: "타공별 Utility Spec을 숙지하고 있는가?",
  FAB_MODULE_UNPACK: "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
  FAB_MODULE_CLEAN: "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
  FAB_MODULE_MOVE: "Module 이동시 주의 사항에 대해 숙지하고 있는가?",
  DOCK_TOOL_SIZE: "장비별 Tool size를 숙지하고 있는가?",
  DOCK_LASER_JIG: "Laser Jig를 이용하여 OHT Line과 설비를 정렬 알고 있는가?",
  DOCK_JACK_USE: "Jack 위치 및 사용방법을 알고 있는가?",
  DOCK_HEIGHT_CHECK: "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
  DOCK_MODULE_CONNECT: "Module간 Docking 할 수 있는가?",
  DOCK_REALIGN: "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
  DOCK_LEVEL_POS: "각 Module의 Leveler 정위치를 숙지하고 있는가?",
  DOCK_LEVEL_SPEC: "각 Module의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
  DOCK_HOOK_UP: "내부 Hook Up 알고 있는가?",
  CABLE_SORTING: "Cable 각 Module별로 분류 알고 있는가?",
  CABLE_GRATING: "Grating Open시 주의 사항을 숙지하고 있는가?",
  CABLE_LADDER_RULES: "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
  CABLE_CONNECTION: "Cable을 설비에 정확히 연결 알고 있는가?",
  CABLE_TRAY_ARRANGE: "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
  CABLE_REAR_MONITOR: "Rear monitor를 장착할 수 있는가?",
  CABLE_EFEM_PM_SIGNAL: "EFEM to PM의 Signal Cable 연결을 할 수 있는가?",
  CABLE_BUBBLER_PM_CONNECT: "Bubbler to PM cable 연결 할 수 있는가?",
  CABLE_FORMIC_PM_CONNECT: "Formic supply unit to PM Signal cable 연결 할 수 있는가?",
  POWER_GPS_UPS_SPS: "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
  POWER_TURN_SEQ: "Power turn on 순서를 숙지하고 있는가?",
  POWER_ALARM_TROUBLE: "Power turn on 후 발생하는 Alram Trouble Shooting 알고 있는가?",
  POWER_CB_UNDERSTAND: "CB 종류와 기능을 숙지하고 있는가?",
  POWER_SAFETY_MODULE: "Safety Module의 위치와 기능을 숙지하고 있는가?",
  POWER_EMO_CHECK: "EMO 동작 Check 알고 있는가?",
  POWER_SYCON_NUMBER: "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
  POWER_SYCON_SETUP: "Sycon 접속 및 초기 Setting을 할 수 있는가?",
  POWER_SYCON_TROUBLE: "Sycon 실행시 통신되지않는 Part에 대해 Trouble Shooting 알고 있는가?",
  UTIL_TURN_SEQ: "Utility turn on 의 순서를 숙지하고 있는가?",
  UTIL_VACUUM_TURN: "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
  UTIL_CDA_TURN: "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
  UTIL_PCW_TURN: "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
  UTIL_EXHAUST_TURN: "각 Exhaust 위치를 알고 Turn on 할 수 있는가?",
  GAS_TURN_SEQ: "Gas turn on 의 순서를 숙지하고 있는가?",
  GAS_N2_CHECK: "N2 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
  GAS_FORMIC_CHECK: "Formic Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
  TEACH_ROBOT_CONTROL: "EFEM Robot Pendant 조작 가능한가?",
  TEACH_ROBOT_LEVELING: "EFEM Robot Leveling 알고 있는가? (SANKYO)",
  TEACH_ARM_LEVELING: "EFEM Robot Arm Leveling 알고 있는가? (SANKYO)",
  TEACH_LOAD_PORT: "EFEM Robot Load Port Teaching 가능한가? (SANKYO)",
  TEACH_ALIGNER: "EFEM Robot Aligner Teaching 가능한가? (SANKYO)",
  TEACH_LOADLOCK: "EFEM Robot Loadlock Teaching 가능한가? (SANKYO)",
  TEACH_DATA_SAVE: "EFEM Teaching Data 저장 가능한가?",
  TEACH_MICRO_ADJUST: "미세 Teaching 가능한가?",
  TEACH_MARGIN_CHECK: "마진 Check 가능한가?",
  TEACH_SEMI_TRANSFER: "Semi Auto Transfer 알고 있는가?",
  PART_EXHAUST_PORT: "Exhaust Port 설치 위치와 방법을 알고 있는가?",
  PART_END_EFFECTOR: "EFEM Robot End-Effector 장착이 가능한가? (SANKYO)",
  PART_END_EFFECTOR_LEVEL: "EFEM Robot End-Effector Level 조절이 가능한가? (SANKYO)",
  PART_APC_SETUP: "APC 를 장착할 수 있는가?",
  PART_PROCESS_KIT: "Process Kit 장착이 가능한가?",
  PART_PIO_SENSOR: "PIO Sensor, Cable 장착이 가능한가?",
  PART_CCTV_SETUP: "CCTV 장착 위치와 장착 할 수 있는가?",
  LEAK_PM: "PM Leak Check에 대해 알고 있는가?",
  LEAK_GAS_LINE: "Gas Line Leak Check에 대해 알고 있는가?",
  LEAK_LL: "LL Leak Check 에 대해 알고 있는가?",
  LEAK_BUBBLER: "Bubbler Leak Check에 대해 알고 있는가?",
  LEAK_SOLENOID: "Solenoid Valve leak check 방법에 대해 알고 있는가?",
  LEAK_FORMIC_ON: "Formic turn on 후 leak check 방법에 대해 알고 있는가?",
  LEAK_FORMIC_GAS: "Formic gas leak check 방법을 알고 있는가?",
  TTTM_CHUCK_LEVEL: "Chuck level과 pin alignment 조정을 할 수 있는가?",
  TTTM_CHUCK_SPEED: "Chuck up/down speed 를 조절 할 수 있는가?",
  TTTM_TEMP_CALIBRATION: "Temp calibration 을 수행 할 수 있는가?",
  TTTM_TEMP_PROFILE: "Temp profile 동작을 수행 할 수 있는가?",
  TTTM_SEASONING_TEST: "Seasoning Test 진행 시 Loop 설정과 Recipe 생성을 할 수 있는가?",
  TTTM_APC_AUTO_LEARN: "APC Auto Learn 방법을 알고 있는가?",
  TTTM_REGULATOR: "Regulator를 조작하여 원하는 Gas Pressure로 설정할 수 있는가?",
  TTTM_MFC_ZERO_CAL: "MFC Zero Cal을 실시할 수 있는가?",
  TTTM_HW_SETUP: "H/W setup 내용을 바탕으로 작성 할 수 있는가?",
  TTTM_MFC_HUNTING: "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
  TTTM_GAS_LEAK_CHECK: "Gas Line Leak Check 가능 한가?",
  TTTM_DNET_CAL: "D-Net Cal 가능한가?",
  TTTM_SHEET_WRITE: "TTTM Sheet 작성 가능한가?",
  CUST_OHT_CERT: "OHT 인증에 대해 알고 대응 할 수 있는가?",
  CUST_IMARK_LOC: "중간인증 전 I-Marking 위치 알고 있는가?",
  CUST_LABELING: "GND 저항값, 각 Gas 및 PCW 라인에 대해 라벨링 가능한가?",
  CUST_MID_CERT: "중간인증에 대해 알고 대응 할 수 있는가?",
  CUST_ENV_QUAL: "환경Qual에 대해 알고 대응 할 수 있는가?",
  CUST_OHT_LAYOUT: "OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?",
  PROC_AGING_TEST: "Aging Test 알고 있는가?",
  PROC_AR_TEST: "AR Test 알고 있는가?",
  PROC_SCRATCH_TEST: "Scratch Test 알고 있는가?",
  PROC_PARTICLE_CHECK: "Paticle Check 알고 있는가?",
  PROC_EES_TOOL: "EES Tool Matching 알고 있는가?",
};

// 안전장치: 혹 normalizeItem가 덮어씌워지지 않았다면 보정
if (typeof exports.normalizeItem !== "function") {
  exports.normalizeItem = (raw) => exports.toDisplayCategory(raw);
}
