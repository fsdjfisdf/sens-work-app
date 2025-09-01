// src/pci/ecolite_setup/pciConfig.js

/** 인정 장비 타입 (work_log.equipment_type 필터) — 필요 시 추가해도 됨 */
exports.ALLOWED_EQUIP_TYPES = [
  "ECOLITE 300", "ECOLITE 400", "ECOLITE 3000", "ECOLITE XP"
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
  "INSTALLATION PREPERATION": "INSTALLATION PREPARATION",
  "FABIN": "FAB IN",
  "CABLE HOOKUP": "CABLE HOOK UP",
  "POWER TURNON": "POWER TURN ON",
  "UTILITY TURNON": "UTILITY TURN ON",
  "GAS TURNON": "GAS TURN ON",

  // 소항목 대표 오탈자/공백 보정 예시
  "RACK CB UNDERSTANDING": "RACK_CB_UNDERSTANDING",
  "SYCON INITIAL SETUP": "SYCON_INITIAL_SETUP",
  "APC AUTOLEARN": "APC_AUTOLEARN",
  "PIN ADJUST": "PIN_ADJUST",
  "MANOMETER ADJUST": "MANOMETER_ADJUST",
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

/** 카테고리 → 소항목(=ECOLITE_SETUP 컬럼들) */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    "EQ_IMPORT_ORDER",
    "PACK_LIST_CHECK",
    "OHT_LINE_CHECK_300",
    "OHT_LINE_CHECK_400",
    "EQ_SPACING_CHECK",
    "DRAWING_TEMPLATE_SETUP",
    "DRAWING_TEMPLATE_MARKING",
    "UTILITY_SPEC_UNDERSTANDING",
  ],
  FAB_IN: ["MODULE_UNPACKING_CAUTION", "MODULE_CLEAN_CAUTION", "MODULE_MOVEMENT_CAUTION"],
  DOCKING: [
    "TOOL_SIZE_UNDERSTANDING",
    "LASER_JIG_ALIGNMENT_300",
    "LASER_JIG_ALIGNMENT_400",
    "JACK_USAGE_UNDERSTANDING",
    "MODULE_HEIGHT_DOCKING",
    "MODULE_DOCKING",
    "DOCKING_REALIGNMENT",
    "LEVELER_POSITION_UNDERSTANDING",
    "MODULE_LEVELING",
    "ACCESSORY_INSTALLATION",
    "HOOK_UP_UNDERSTANDING",
  ],
  CABLE_HOOK_UP: [
    "TRAY_CHECK",
    "CABLE_SORTING",
    "GRATING_OPEN_CAUTION",
    "LADDER_SAFETY_RULES",
    "CABLE_INSTALLATION",
    "CABLE_CONNECTION",
    "CABLE_TRAY_ARRANGEMENT",
    "CABLE_CUTTING",
    "CABLE_RACK_CONNECTION",
    "PUMP_CABLE_TRAY",
    "PUMP_CABLE_ARRANGEMENT",
    "CABLE_PM_PUMP_CONNECTION",
  ],
  POWER_TURN_ON: [
    "GPS_UPS_SPS_UNDERSTANDING",
    "POWER_TURN_ON_SEQUENCE",
    "ALARM_TROUBLESHOOTING",
    "RACK_CB_UNDERSTANDING",
    "SAFETY_MODULE_UNDERSTANDING",
    "EMO_CHECK",
    "SYCON_NUMBER_UNDERSTANDING",
    "SYCON_INITIAL_SETUP",
    "SYCON_TROUBLESHOOTING",
  ],
  UTILITY_TURN_ON: [
    "UTILITY_TURN_ON_SEQUENCE",
    "VACUUM_TURN_ON",
    "CDA_TURN_ON",
    "PCW_TURN_ON",
    "CHILLER_TEMP_ADJUST",
    "IONIZER_TURN_ON",
  ],
  GAS_TURN_ON: [
    "GAS_TURN_ON_SEQUENCE",
    "O2_N2_GAS_TURN_ON",
    "CF4_GAS_TURN_ON",
    "CF4_H2N2_PRESSURE_TEST",
    "MANOMETER_ADJUST",
  ],
  TEACHING: [
    "EFEM_LEVELING_SANKYO",
    "EFEM_ARM_LEVEL_SANKYO",
    "EFEM_LOAD_PORT_SANKYO",
    "EFEM_LOADLOCK_SANKYO",
    "EFEM_BM_MODULE_SANKYO",
    "EFEM_TEACH_SAVE_SANKYO",
    "EFEM_LEVELING_YASKAWA",
    "EFEM_ARM_LEVEL_YASKAWA",
    "EFEM_LOAD_PORT_YASKAWA",
    "EFEM_LOADLOCK_YASKAWA",
    "EFEM_BM_MODULE_YASKAWA",
    "EFEM_TEACH_SAVE_YASKAWA",
    "ABS_HOME_SETTING",
    "TM_ROBOT_PENDANT_CONTROL",
    "TM_BM_TEACHING",
    "TM_PM_TEACHING",
    "TM_TEACH_SAVE",
    "FINE_TEACHING",
    "MARGIN_CHECK",
    "SEMI_AUTO_TRANSFER",
  ],
  PART_INSTALLATION: [
    "EXHAUST_PORT_INSTALLATION",
    "ENDEFFECTOR_INSTALL_SANKYO",
    "ENDEFFECTOR_ADJUST_SANKYO",
    "ENDEFFECTOR_LEVEL_SANKYO",
    "TM_ENDEFFECTOR_INSTALL",
    "TM_ENDEFFECTOR_ADJUST_38X",
    "TM_ENDEFFECTOR_ADJUST_16",
    "TM_ENDEFFECTOR_LEVEL",
    "PROCESS_KIT_INSTALL",
    "PIO_SENSOR_INSTALL",
    "SIGNAL_TOWER_INSTALL",
    "WALL_LINEAR_INSTALL",
  ],
  LEAK_CHECK: ["PUMP_TURN_ON", "PM_LEAK_CHECK", "GAS_LINE_LEAK_CHECK", "TM_LEAK_CHECK"],
  TTTM: [
    "ECID_MATCHING",
    "PUMP_PURGE_TIME",
    "VENTING_TIME_ADJUST",
    "EPD_PEAK_OFFSET_ADJUST",
    "TEMP_AUTOTUNE",
    "SLIT_DOOR_CONTROL",
    "APC_AUTOLEARN",
    "PART_LIST_SHEET",
    "PIN_ADJUST",
    "GAS_PRESSURE_CHECK",
    "MFC_HUNTING_CHECK",
    "GAS_LEAK_CHECK",
    "DNET_CAL",
    "TTTM_SHEET",
  ],
  CUSTOMER_CERTIFICATION: [
    "OHT_CERTIFICATION",
    "IMARKING_POSITION",
    "GND_LABELING",
    "CSF_SILICONE_FINISH",
    "MID_CERT_RESPONSE",
    "ENV_QUAL_RESPONSE",
    "MFC_CERT_RESPONSE",
    "OHT_LAYOUT_CERTIFICATION",
  ],
  PROCESS_CONFIRM: ["AGING_TEST", "AR_TEST", "SCRATCH_TEST", "PARTICLE_CHECK", "EC_TOOL_MATCH"],
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
  OHT_LINE_CHECK_300: "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가? (300mm)",
  OHT_LINE_CHECK_400: "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가? (400mm Mac Type, Casette Type)",
  EQ_SPACING_CHECK: "설비간 유격거리가 충분한지 확인 알고 있는가?",
  DRAWING_TEMPLATE_SETUP: "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
  DRAWING_TEMPLATE_MARKING: "Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?",
  UTILITY_SPEC_UNDERSTANDING: "타공별 Utility Spec을 숙지하고 있는가?",
  MODULE_UNPACKING_CAUTION: "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
  MODULE_CLEAN_CAUTION: "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
  MODULE_MOVEMENT_CAUTION: "Module 이동시 주의 사항에 대해 숙지하고 있는가?",
  TOOL_SIZE_UNDERSTANDING: "장비별 Tool size를 숙지하고 있는가?",
  LASER_JIG_ALIGNMENT_300: "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가? (300mm)",
  LASER_JIG_ALIGNMENT_400: "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가? (400mm Mac Type, Casette Type)",
  JACK_USAGE_UNDERSTANDING: "Jack 위치 및 사용방법을 알고 있는가?",
  MODULE_HEIGHT_DOCKING: "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
  MODULE_DOCKING: "Module간 Docking 할 수 있는가?",
  DOCKING_REALIGNMENT: "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
  LEVELER_POSITION_UNDERSTANDING: "각 Moudule의 Leveler 정위치를 숙지하고 있는가?",
  MODULE_LEVELING: "각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
  ACCESSORY_INSTALLATION: "Accessory(Baratron, Pirani, EPD)를 정위치에 장착 알고 있는가?",
  HOOK_UP_UNDERSTANDING: "내부 Hook Up 알고 있는가?",
  TRAY_CHECK: "설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?",
  CABLE_SORTING: "Cable 각 Module별로 분류 알고 있는가?",
  GRATING_OPEN_CAUTION: "Grating Open시 주의 사항을 숙지하고 있는가?",
  LADDER_SAFETY_RULES: "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
  CABLE_INSTALLATION: "설비에서 Rack까지 포설 알고 있는가?",
  CABLE_CONNECTION: "Cable을 설비에 정확히 연결 알고 있는가?",
  CABLE_TRAY_ARRANGEMENT: "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
  CABLE_CUTTING: "설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?",
  CABLE_RACK_CONNECTION: "Cable을 Rack에 정확히 연결알고 있는가?",
  PUMP_CABLE_TRAY: "Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?",
  PUMP_CABLE_ARRANGEMENT: "Pump단에서 Cable 포설 및 정리 알고 있는가?",
  CABLE_PM_PUMP_CONNECTION: "Cable을 구분하여 모듈별로 Pump에 정확히 연결 알고 있는가?",
  GPS_UPS_SPS_UNDERSTANDING: "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
  POWER_TURN_ON_SEQUENCE: "Power turn on 순서를 숙지하고 있는가?",
  ALARM_TROUBLESHOOTING: "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
  RACK_CB_UNDERSTANDING: "Rack의 CB 종류와 기능을 숙지하고 있는가?",
  SAFETY_MODULE_UNDERSTANDING: "Safety Module의 위치와 기능을 숙지하고 있는가?",
  EMO_CHECK: "EMO 동작 Check 알고 있는가?",
  SYCON_NUMBER_UNDERSTANDING: "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
  SYCON_INITIAL_SETUP: "Sycon 접속 및 초기 Setting을 할 수 있는가?",
  SYCON_TROUBLESHOOTING: "Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?",
  UTILITY_TURN_ON_SEQUENCE: "Utility turn on 의 순서를 숙지하고 있는가?",
  VACUUM_TURN_ON: "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
  CDA_TURN_ON: "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
  PCW_TURN_ON: "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
  CHILLER_TEMP_ADJUST: "Chiller Turn On 및 Spec에 맞게 TEMP 조정 알고 있는가?",
  IONIZER_TURN_ON: "IONIZER Turn On 및 Spec에 맞게 조정 알고 있는가?",
  GAS_TURN_ON_SEQUENCE: "Gas turn on 의 순서를 숙지하고 있는가?",
  O2_N2_GAS_TURN_ON: "O2, N2 Gas Turn on 및  가스 유입유무를 확인 알고 있는가?",
  CF4_GAS_TURN_ON: "CF4 Gas Turn on 및  가스 유입유무를 확인 알고 있는가?",
  CF4_H2N2_PRESSURE_TEST: "CF4,H2N2 가압,감압 TEST를 할 수 있는가?",
  MANOMETER_ADJUST: "Manometer의  Low, High Limit 값 Spec에 맞게 조정 알고 있는가?",
  EFEM_LEVELING_SANKYO: "EFEM Robot Leveling 알고 있는가? (SANKYO)",
  EFEM_ARM_LEVEL_SANKYO: "EFEM Robot Arm Leveling 알고 있는가? (SANKYO)",
  EFEM_LOAD_PORT_SANKYO: "EFEM Robot Load Port Teaching 가능한가? (SANKYO)",
  EFEM_LOADLOCK_SANKYO: "EFEM Robot Loadlock Teaching 가능한가? (SANKYO)",
  EFEM_BM_MODULE_SANKYO: "EFEM Robot BM Module Teaching 가능한가? (SANKYO)",
  EFEM_TEACH_SAVE_SANKYO: "EFEM Teaching Data 저장 가능한가? (SANKYO)",
  EFEM_LEVELING_YASKAWA: "EFEM Robot Leveling 알고 있는가? (YASKAWA)",
  EFEM_ARM_LEVEL_YASKAWA: "EFEM Robot Arm Leveling 알고 있는가? (YASKAWA)",
  EFEM_LOAD_PORT_YASKAWA: "EFEM Robot Load Port Teaching 가능한가? (YASKAWA)",
  EFEM_LOADLOCK_YASKAWA: "EFEM Robot Loadlock Teaching 가능한가? (YASKAWA)",
  EFEM_BM_MODULE_YASKAWA: "EFEM Robot BM Module Teaching 가능한가? (YASKAWA)",
  EFEM_TEACH_SAVE_YASKAWA: "EFEM Teaching Data 저장 가능한가 ? (YASKAWA)",
  ABS_HOME_SETTING: "EFEM, TM Robot ABS Home을 잡을 수 있는가?",
  TM_ROBOT_PENDANT_CONTROL: "TM Robot Pendant 조작 가능한가?",
  TM_BM_TEACHING: "TM Robot BM Module Teaching 가능 한가?",
  TM_PM_TEACHING: "TM Robot PM Teaching 가능 한가?",
  TM_TEACH_SAVE: "TM Robot Teaching Data 저장 가능한가?",
  FINE_TEACHING: "미세 Teaching 가능한가?",
  MARGIN_CHECK: "마진 Check 가능한가?",
  SEMI_AUTO_TRANSFER: "Semi Auto Transfer 알고 있는가?",
  EXHAUST_PORT_INSTALLATION: "Exhaust Port 설치 위치와 방법을 알고 있는가?",
  ENDEFFECTOR_INSTALL_SANKYO: "EFEM Robot EndEffector 장착이 가능한가? ( SANKYO )",
  ENDEFFECTOR_ADJUST_SANKYO: "EFEM Robot End Effector Omm Adjust 가능 한가? ( SANKYO )",
  ENDEFFECTOR_LEVEL_SANKYO: "EFEM Robot EndEffector Level 조절이 가능한가?( SANKYO )",
  TM_ENDEFFECTOR_INSTALL: "TM Robot End Effector 장착이 가능한가?",
  TM_ENDEFFECTOR_ADJUST_38X: "TM Robot End Effector 좌우 38Xmm Adjust 가능 한가?",
  TM_ENDEFFECTOR_ADJUST_16: "TM Robot End Effector 상하 16mm Adjust 가능 한가?",
  TM_ENDEFFECTOR_LEVEL: "TM Robot End Effector Level 조절이 가능한가?",
  PROCESS_KIT_INSTALL: "Process Kit 장착이 가능한가?",
  PIO_SENSOR_INSTALL: "PIO Sensor, Cable 장착이 가능한가?",
  SIGNAL_TOWER_INSTALL: "Rack Signal Tower 설치가 가능한가?",
  WALL_LINEAR_INSTALL: "Wall Linear 좌,우 구분하여 장착이 가능한가?",
  PUMP_TURN_ON: "PUMP Turn On 알고 있는가?",
  PM_LEAK_CHECK: "PM Leak Check에 대해 알고 있는가?",
  GAS_LINE_LEAK_CHECK: "Gas Line Leak Check에 대해 알고 있는가?",
  TM_LEAK_CHECK: "TM Leak Check 에 대해 알고 있는가?",
  ECID_MATCHING: "ECID Matching할 수 있는가?",
  PUMP_PURGE_TIME: "Chamber Pumping/Purge Time 조절 가능한가?",
  VENTING_TIME_ADJUST: "Puming / Venting Time 조절 가능한가?",
  EPD_PEAK_OFFSET_ADJUST: "EPD Peak, Offset 조절 가능한가?",
  TEMP_AUTOTUNE: "Temp autotune 가능 한가?",
  SLIT_DOOR_CONTROL: "Slit Door Open, Close Time 조절 가능 한가?",
  APC_AUTOLEARN: "APC V/V Autolearn 가능 한가? (Cal Program 포함)",
  PART_LIST_SHEET: "고객사 필수 Part List Sheet 작성이 가능한가?",
  PIN_ADJUST: "Pin speed, height Adjust 가능 한가?",
  GAS_PRESSURE_CHECK: "Gas Supply Pressure Check 가능 한가?",
  MFC_HUNTING_CHECK: "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
  GAS_LEAK_CHECK: "Gas Line Leak Check 가능 한가?",
  DNET_CAL: "DNet Cal 가능한가?",
  TTTM_SHEET: "TTTM Sheet 작성 가능한가?",
  OHT_CERTIFICATION: "OHT 인증에 대해 알고 대응 할 수 있는가?",
  IMARKING_POSITION: "중간인증 전 IMarking 위치 알고 있는가?",
  GND_LABELING: "GND 저항값, 각 Gas 및 PCW 라인에 대해 라벨링 가능한가?",
  CSF_SILICONE_FINISH: "CSF(Rack단) 실리콘 마감 가능한가?",
  MID_CERT_RESPONSE: "중간인증에 대해 알고 대응 할 수 있는가?",
  ENV_QUAL_RESPONSE: "환경Qual에 대해 알고 대응 할 수 있는가?",
  MFC_CERT_RESPONSE: "MFC인증에 대해 알고 대응 할 수 있는가?",
  OHT_LAYOUT_CERTIFICATION: "OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?",
  AGING_TEST: "Aging Test 알고 있는가?",
  AR_TEST: "AR Test 알고 있는가?",
  SCRATCH_TEST: "Scratch Test 알고 있는가?",
  PARTICLE_CHECK: "Paticle Check 알고 있는가?",
  EC_TOOL_MATCH: "EC Tool Matching 알고 있는가?",
};

// 안전장치: normalizeItem 미정의 시 보정
if (typeof exports.normalizeItem !== "function") {
  exports.normalizeItem = (raw) => exports.toDisplayCategory(raw);
}
