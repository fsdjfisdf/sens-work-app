// src/pci/hdw_setup/pciConfig.js

/** 인정 장비 타입 (work_log.equipment_type 필터) — 실제 값에 맞게 필요시 보강 */
exports.ALLOWED_EQUIP_TYPES = [
  "HDW", "hdw", "HDW 300", "HDW 400", "HDW XP", "HDW PLUS", "HDW Plus", "HDW plus"
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

/** 기준 작업 수(=columns 기준작업수) */
exports.BASELINE = {
  "INSTALLATION PREPARATION": 5,
  "FAB IN": 5,
  "DOCKING": 10,
  "CABLE HOOK UP": 10,
  "POWER TURN ON": 10,
  "GAS TURN ON": 5,
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
  "GAS TURNON": "GAS TURN ON",

  // 소항목(띄어쓰기 → 언더스코어 통일: 대표적인 것들)
  "EQ IMPORT ORDER": "EQ_IMPORT_ORDER",
  "PACK LIST CHECK": "PACK_LIST_CHECK",
  "OHT LINE CHECK GENERAL": "OHT_LINE_CHECK_GENERAL",
  "EQ SPACING CHECK": "EQ_SPACING_CHECK",
  "DRAWING TEMPLATE SETUP": "DRAWING_TEMPLATE_SETUP",
  "DRAWING TEMPLATE MARKING": "DRAWING_TEMPLATE_MARKING",
  "POKE POSITION UNDERSTANDING": "POKE_POSITION_UNDERSTANDING",
  "UTILITY SPEC UNDERSTANDING": "UTILITY_SPEC_UNDERSTANDING",

  "MODULE UNPACKING CAUTION": "MODULE_UNPACKING_CAUTION",
  "MODULE CLEAN CAUTION": "MODULE_CLEAN_CAUTION",
  "MODULE MOVEMENT CAUTION": "MODULE_MOVEMENT_CAUTION",

  "TOOL REQUIREMENT UNDERSTANDING": "TOOL_REQUIREMENT_UNDERSTANDING",
  "TOOL SIZE UNDERSTANDING": "TOOL_SIZE_UNDERSTANDING",
  "MODULE HEIGHT DOCKING": "MODULE_HEIGHT_DOCKING",
  "CASTER JIG SEPARATION": "CASTER_JIG_SEPARATION",
  "MODULE DOCKING": "MODULE_DOCKING",
  "DOCKING PIPE REALIGNMENT": "DOCKING_PIPE_REALIGNMENT",
  "CUSTOM PIPE REALIGNMENT": "CUSTOM_PIPE_REALIGNMENT",
  "LEVEL CONSIDERATION POSITION": "LEVEL_CONSIDERATION_POSITION",

  "GRATING OPEN CAUTION": "GRATING_OPEN_CAUTION",
  "CABLE CONNECTION": "CABLE_CONNECTION",
  "CABLE NO INTERFERENCE": "CABLE_NO_INTERFERENCE",
  "CN1 POSITION UNDERSTANDING": "CN1_POSITION_UNDERSTANDING",
  "SIGNAL CABLE PINMAP": "SIGNAL_CABLE_PINMAP",
  "SIGNAL CABLE FUNCTION EXPLANATION": "SIGNAL_CABLE_FUNCTION_EXPLANATION",

  "GPS UPS UNDERSTANDING": "GPS_UPS_UNDERSTANDING",
  "POWER TURN ON SEQUENCE": "POWER_TURN_ON_SEQUENCE",
  "ALARM TROUBLESHOOTING": "ALARM_TROUBLESHOOTING",
  "RACK CB UNDERSTANDING": "RACK_CB_UNDERSTANDING",
  "EMO CHECK": "EMO_CHECK",

  "UTILITY TURN ON SEQUENCE": "UTILITY_TURN_ON_SEQUENCE",
  "CDA TURN ON": "CDA_TURN_ON",
  "UPW TURN ON": "UPW_TURN_ON",
  "INLET VALVE OPERATION": "INLET_VALVE_OPERATION",
  "OUTLET VALVE OPERATION": "OUTLET_VALVE_OPERATION",
  "BYPASS VALVE OPERATION": "BYPASS_VALVE_OPERATION",
  "DRAIN VALVE OPERATION": "DRAIN_VALVE_OPERATION",

  "GAS TURN ON SEQUENCE": "GAS_TURN_ON_SEQUENCE",
  "CDA GAS CHECK": "CDA_GAS_CHECK",

  "VALVE INSTALLATION": "VALVE_INSTALLATION",
  "LEAK SENSOR INSTALLATION": "LEAK_SENSOR_INSTALLATION",
  "SIGNAL TOWER INSTALLATION": "SIGNAL_TOWER_INSTALLATION",

  "HDW LEAK CHECK": "HDW_LEAK_CHECK",
  "GAS LINE LEAK CHECK": "GAS_LINE_LEAK_CHECK",
  "PIPE LEAK CHECK": "PIPE_LEAK_CHECK",
  "UPW LEAK CHECK METHOD": "UPW_LEAK_CHECK_METHOD",
  "LEAK RESPONSE ACTION": "LEAK_RESPONSE_ACTION",

  "FLOW OFF ADJUST": "FLOW_OFF_ADJUST",
  "FLOW ON ADJUST": "FLOW_ON_ADJUST",
  "TEMP SETTING": "TEMP_SETTING",
  "PARAMETER SETTING": "PARAMETER_SETTING",
  "TC ADJUST": "TC_ADJUST",
  "OD ADJUST": "OD_ADJUST",
  "PIPE DI LEAK CHECK": "PIPE_DI_LEAK_CHECK",

  "IMARKING POSITION": "IMARKING_POSITION",
  "GND LABELING": "GND_LABELING",
  "MID CERT RESPONSE": "MID_CERT_RESPONSE",
  "AIR CAP REMOVAL": "AIR_CAP_REMOVAL",

  "HDW REMOTE TEST": "HDW_REMOTE_TEST",
  "HDW LOCAL TEST": "HDW_LOCAL_TEST",
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

/** 카테고리 → 소항목(=HDW_SETUP 컬럼들) */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    "EQ_IMPORT_ORDER",
    "PACK_LIST_CHECK",
    "OHT_LINE_CHECK_GENERAL",
    "EQ_SPACING_CHECK",
    "DRAWING_TEMPLATE_SETUP",
    "DRAWING_TEMPLATE_MARKING",
    "POKE_POSITION_UNDERSTANDING",
    "UTILITY_SPEC_UNDERSTANDING",
  ],
  FAB_IN: [
    "MODULE_UNPACKING_CAUTION",
    "MODULE_CLEAN_CAUTION",
    "MODULE_MOVEMENT_CAUTION",
  ],
  DOCKING: [
    "TOOL_REQUIREMENT_UNDERSTANDING",
    "TOOL_SIZE_UNDERSTANDING",
    "MODULE_HEIGHT_DOCKING",
    "CASTER_JIG_SEPARATION",
    "MODULE_DOCKING",
    "DOCKING_PIPE_REALIGNMENT",
    "CUSTOM_PIPE_REALIGNMENT",
    "LEVEL_CONSIDERATION_POSITION",
  ],
  CABLE_HOOK_UP: [
    "GRATING_OPEN_CAUTION",
    "CABLE_CONNECTION",
    "CABLE_NO_INTERFERENCE",
    "CN1_POSITION_UNDERSTANDING",
    "SIGNAL_CABLE_PINMAP",
    "SIGNAL_CABLE_FUNCTION_EXPLANATION",
  ],
  POWER_TURN_ON: [
    "GPS_UPS_UNDERSTANDING",
    "POWER_TURN_ON_SEQUENCE",
    "ALARM_TROUBLESHOOTING",
    "RACK_CB_UNDERSTANDING",
    "EMO_CHECK",
    "UTILITY_TURN_ON_SEQUENCE",
    "CDA_TURN_ON",
    "UPW_TURN_ON",
    "INLET_VALVE_OPERATION",
    "OUTLET_VALVE_OPERATION",
    "BYPASS_VALVE_OPERATION",
    "DRAIN_VALVE_OPERATION",
  ],
  GAS_TURN_ON: ["GAS_TURN_ON_SEQUENCE", "CDA_GAS_CHECK"],
  PART_INSTALLATION: [
    "VALVE_INSTALLATION",
    "LEAK_SENSOR_INSTALLATION",
    "SIGNAL_TOWER_INSTALLATION",
  ],
  LEAK_CHECK: [
    "HDW_LEAK_CHECK",
    "GAS_LINE_LEAK_CHECK",
    "PIPE_LEAK_CHECK",
    "UPW_LEAK_CHECK_METHOD",
    "LEAK_RESPONSE_ACTION",
  ],
  TTTM: [
    "FLOW_OFF_ADJUST",
    "FLOW_ON_ADJUST",
    "TEMP_SETTING",
    "PARAMETER_SETTING",
    "TC_ADJUST",
    "OD_ADJUST",
    "PIPE_DI_LEAK_CHECK",
  ],
  CUSTOMER_CERTIFICATION: [
    "IMARKING_POSITION",
    "GND_LABELING",
    "MID_CERT_RESPONSE",
    "AIR_CAP_REMOVAL",
  ],
  PROCESS_CONFIRM: ["HDW_REMOTE_TEST", "HDW_LOCAL_TEST"],
};

/** DAO에서 쓰는: 카테고리로 체크리스트 키 배열 얻기 */
exports.getChecklistKeysForCategory = (catDisplay) => {
  const disp = exports.toDisplayCategory(catDisplay);
  const key = Object.keys(exports.CATEGORY_ITEMS).find((k) => canon(k) === canon(disp));
  return key ? exports.CATEGORY_ITEMS[key] : [];
};

/** 소항목 → 설명(프런트 툴팁/모달) */
exports.CHECK_TITLES = {
  EQ_IMPORT_ORDER: "설비반입 순서를 숙지하고 있는가?",
  PACK_LIST_CHECK: "Packing List 확인하여 반입 Part 확인이 가능 한가?",
  OHT_LINE_CHECK_GENERAL: "고객사에서 그린 기준선 일치하는지 확인 알고 있는가?",
  EQ_SPACING_CHECK: "설비간 유격거리가 충분한지 확인 알고 있는가?",
  DRAWING_TEMPLATE_SETUP: "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
  DRAWING_TEMPLATE_MARKING: "Drawing Template를 펼쳐 타공, H빔 및 Adjust를 Marking 알고 있는가?",
  POKE_POSITION_UNDERSTANDING: "Wood Packaging 에서 내릴 때 장비의 Poke 위치를 알고 있는가?",
  UTILITY_SPEC_UNDERSTANDING: "타공별 Utility Spec을 숙지하고 있는가?",

  MODULE_UNPACKING_CAUTION: "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
  MODULE_CLEAN_CAUTION: "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
  MODULE_MOVEMENT_CAUTION: "Module 이동시 주의 사항에 대해 숙지하고 있는가?",

  TOOL_REQUIREMENT_UNDERSTANDING: "장비별 필요 Tool를 숙지하고 있는가?",
  TOOL_SIZE_UNDERSTANDING: "장비별 Tool size를 숙지하고 있는가?",
  MODULE_HEIGHT_DOCKING: "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
  CASTER_JIG_SEPARATION: "Caster 랑 moving jig 분리가 하는 법을 알고 있는가?",
  MODULE_DOCKING: "Module Docking 할 수 있는가?",
  DOCKING_PIPE_REALIGNMENT: "Docking작업 중 설비와 배관 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
  CUSTOM_PIPE_REALIGNMENT: "Docking작업 후 설비와 (고객요청)배관 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
  LEVEL_CONSIDERATION_POSITION: "장비의 Level 고려해야하는 위치를 숙지하고 있는가?",

  GRATING_OPEN_CAUTION: "Grating Open시 주의 사항을 숙지하고 있는가?",
  CABLE_CONNECTION: "Cable을 설비에 정확히 연결 알고 있는가?",
  CABLE_NO_INTERFERENCE: "Cable 정리를 간섭 없게 할 수 있는가?",
  CN1_POSITION_UNDERSTANDING: "CN1 의 위치를 알고 있는가?",
  SIGNAL_CABLE_PINMAP: "Signal Cable의 Pin map을 알고 있는가?",
  SIGNAL_CABLE_FUNCTION_EXPLANATION: "Signal Cable이 무슨 역할을 하는지 설명 할 수 있는가?",

  GPS_UPS_UNDERSTANDING: "GPS, UPS 의 역할과 원리에 대해 숙지하고 있는가?",
  POWER_TURN_ON_SEQUENCE: "Power turn on 순서를 숙지하고 있는가?",
  ALARM_TROUBLESHOOTING: "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
  RACK_CB_UNDERSTANDING: "CB 종류와 기능을 숙지하고 있는가?",
  EMO_CHECK: "EMO 동작 Check 알고 있는가?",
  UTILITY_TURN_ON_SEQUENCE: "Utility turn on 의 순서를 숙지하고 있는가?",
  CDA_TURN_ON: "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
  UPW_TURN_ON: "UPW Turn on 및 Spec에 맞게 조정 알고 있는가?",
  INLET_VALVE_OPERATION: "Inlet v/v를 상황에 맞게 동작 할 수 있는가?",
  OUTLET_VALVE_OPERATION: "Outlet v/v를 상황에 맞게 동작 할 수 있는가?",
  BYPASS_VALVE_OPERATION: "Bypass v/v를 상황에 맞게 동작 할 수 있는가?",
  DRAIN_VALVE_OPERATION: "Drain v/v를 상황에 맞게 동작 할 수 있는가?",

  GAS_TURN_ON_SEQUENCE: "Gas turn on 의 순서(경로)를 숙지하고 있는가?",
  CDA_GAS_CHECK: "CDA Turn on 및 가스 유입유무를 확인 알고 있는가?",

  VALVE_INSTALLATION: "Valve 설치 위치와 방법을 알고 있는가?",
  LEAK_SENSOR_INSTALLATION: "Leak Sensor 설치 위치와 방법을 알고 있는가?",
  SIGNAL_TOWER_INSTALLATION: "Signal Tower 설치 위치와 방법을 알고 있는가?",

  HDW_LEAK_CHECK: "HDW Leak Check에 대해 알고 있는가?",
  GAS_LINE_LEAK_CHECK: "Gas Line Leak Check에 대해 알고 있는가?",
  PIPE_LEAK_CHECK: "배관부 Leak Check 에 대해 알고 있는가?",
  UPW_LEAK_CHECK_METHOD: "UPW turn on 후 leak check 방법에 대해 알고 있는가?",
  LEAK_RESPONSE_ACTION: "Leak 발생 시 조치 방법에 대해 알고 있는가?",

  FLOW_OFF_ADJUST: "Flow Off 유량을 조정 할 수 있는가?",
  FLOW_ON_ADJUST: "Flow On 유량을 조정 할 수 있는가?",
  TEMP_SETTING: "Setting Temp를 설정 할 수 있는가?",
  PARAMETER_SETTING: "Parameter 설정을 할 수 있는가?",
  TC_ADJUST: "TC 설정을 조정 할 수 있는가?",
  OD_ADJUST: "OD 조정 할 수 있는가?",
  PIPE_DI_LEAK_CHECK: "배관부 배관 DI Leak Check 가능 한가?",

  IMARKING_POSITION: "중간인증 전 I-Marking 위치 알고 있는가?",
  GND_LABELING: "GND 저항값, CDA 및 UPW 라인에 대해 라벨링 가능한가?",
  MID_CERT_RESPONSE: "중간인증에 대해 알고 대응 할 수 있는가?",
  AIR_CAP_REMOVAL: "Air cap의 위치 및 제거를 할 수 있는가?",

  HDW_REMOTE_TEST: "HDW Remote Test 알고 있는가?",
  HDW_LOCAL_TEST: "HDW Local mode Test 알고 있는가?",
};

// 안전장치: normalizeItem 미정의 시 보정
if (typeof exports.normalizeItem !== "function") {
  exports.normalizeItem = (raw) => exports.toDisplayCategory(raw);
}
