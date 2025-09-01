// src/pci/supraxp_setup/pciConfig.js

/** 인정 장비 타입 (로그 equipment_type 필터) — 필요 시 확장 */
exports.ALLOWED_EQUIP_TYPES = [
  "SUPRA XP", "SUPRA-XP"
];

/** 공통 유틸 */
const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();

/** Canon (카테고리/키 매칭용) */
const canon = (s) =>
  upper(s)
    .replace(/ASS'Y/g, "ASSY")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
exports.canon = canon;

/** 기준 작업 수(카테고리, SUPRA XP 전용) */
exports.BASELINE = {
  "INSTALLATION PREPARATION": 2,
  "FAB IN": 2,
  "DOCKING": 3,
  "CABLE HOOK UP": 3,
  "POWER TURN ON": 3,
  "UTILITY TURN ON": 3,
  "GAS TURN ON": 3,
  "TEACHING": 5,
  "PART INSTALLATION": 2,
  "LEAK CHECK": 2,
  "TTTM": 5,
  "CUSTOMER CERTIFICATION": 3,
  "PROCESS CONFIRM": 2,
};

/** 프리셋/로그/DB 표기 차이 보정 */
const ALIASES = {
  // 카테고리 표기
  "INSTALLATION PREPERATION": "INSTALLATION PREPARATION",
  "FABIN": "FAB IN",
  "CABLE HOOKUP": "CABLE HOOK UP",
  "POWER TURN ON": "POWER TURN ON",
  "UTILITY TURN ON": "UTILITY TURN ON",
  "GAS TURN ON": "GAS TURN ON",
  "PART INSTALLATION": "PART INSTALLATION",
  "LEAK CHECK": "LEAK CHECK",
  "CUSTOMER CERTIFICATION": "CUSTOMER CERTIFICATION",
  "PROCESS CONFIRM": "PROCESS CONFIRM",
};

/** 카테고리(표시명) 정규화: 로그/프론트/DB 혼용 표기 → 정식 표기 */
exports.toDisplayCategory = (raw) => {
  const s = upper(raw).replace(/_/g, " ").trim();
  const via = ALIASES[s] || s;
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find((k) => canon(k) === canon(via));
  return hit || via;
};

/** 항목 키 정규화 (DB 컬럼명 기준으로 매칭 시도) */
exports.normalizeKey = (raw) => {
  if (!raw) return "";
  const s = upper(raw).replace(/\s+/g, " ").trim();
  const via = ALIASES[s] || s;
  return via.replace(/ /g, "_"); // DB 컬럼은 대부분 언더바
};

/** 작업자 별칭(동일인 취급) */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};

/** 카테고리 → (DB) 소항목 배열
 *  - SUPRA_XP_SETUP_SELF 테이블의 실제 컬럼명들만 포함
 */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    "INST_IMPORT_ORDER",
    "INST_PACKING_LIST",
    "INST_OHT_CHECK",
    "INST_SPACING_CHECK",
    "INST_DRAW_SETUP",
    "INST_DRAW_MARKING",
    "INST_UTILITY_SPEC",
  ],
  FAB_IN: [
    "FAB_UNPACK_WARN",
    "FAB_CLEAN_WARN",
    "FAB_MOVE_WARN",
  ],
  DOCKING: [
    "DOCK_TOOL_SIZE",
    "DOCK_LASER_JIG",
    "DOCK_LIFT_CASTER",
    "DOCK_FRAME_HEIGHT",
    "DOCK_MODULE",
    "DOCK_REALIGN",
    "DOCK_LEVELER_POS",
    "DOCK_LEVEL_SPEC",
    "DOCK_ACCESSORY",
    "DOCK_HOOK_UP",
  ],
  CABLE_HOOK_UP: [
    "CABLE_TRAY_CHECK",
    "CABLE_SORTING",
    "CABLE_GRATING",
    "CABLE_LADDER_RULES",
    "CABLE_INSTALL",
    "CABLE_CONNECTION",
    "CABLE_TRAY_ARRANGE",
    "CABLE_CUTTING",
    "CABLE_RACK_CONNECT",
    "CABLE_PUMP_TRAY",
    "CABLE_PUMP_ARRANGE",
    "CABLE_MODULE_PUMP",
  ],
  POWER_TURN_ON: [
    "POWER_GPS_UPS_SPS",
    "POWER_TURN_SEQ",
    "POWER_ALARM_TROUBLE",
    "POWER_CB_UNDERSTAND",
    "POWER_SAFETY_MODULE",
    "POWER_EMO_CHECK",
    "POWER_SYCON_UNDERST",
    "POWER_SYCON_TROUBLE",
  ],
  UTILITY_TURN_ON: [
    "UTIL_TURN_SEQ",
    "UTIL_VACUUM_TURN",
    "UTIL_CDA_TURN",
    "UTIL_PCW_TURN",
  ],
  GAS_TURN_ON: [
    "GAS_TURN_SEQ",
    "GAS_O2_N2_CHECK",
    "GAS_TOXIC_CHECK",
    "GAS_MANOMETER_ADJUST",
  ],
  TEACHING: [
    "TEACH_ROBOT_CONTROL",
    "TEACH_ROBOT_LEVEL",
    "TEACH_ARM_LEVEL",
    "TEACH_LOAD_PORT",
    "TEACH_LOADLOCK",
    "TEACH_SIDE_STORAGE",
    "TEACH_DATA_SAVE",
    "TEACH_TM_CONTROL",
    "TEACH_TM_LOADLOCK",
    "TEACH_TM_PM",
    "TEACH_TM_DATA_SAVE",
    "TEACH_WAFER_JIG",
    "TEACH_FINE",
    "TEACH_MARGIN",
    "TEACH_SEMI_TRANSFER",
  ],
  PART_INSTALLATION: [
    "PART_EXHAUST_PORT",
    "PART_EFF_SANKYO",
    "PART_EFF_ADJUST",
    "PART_EFF_LEVEL",
    "PART_TM_EFF",
    "PART_TM_ADJUST_380",
    "PART_TM_ADJUST_16",
    "PART_TM_LEVEL",
    "PART_PROCESS_KIT",
    "PART_PIO_CABLE",
    "PART_RACK_SIGNAL",
  ],
  LEAK_CHECK: [
    "LEAK_PUMP_TURN",
    "LEAK_PM_CHECK",
    "LEAK_GAS_CHECK",
    "LEAK_TM_LL_CHECK",
  ],
  TTTM: [
    "TTTM_ECID_MATCH",
    "TTTM_PUMP_TIME",
    "TTTM_VENT_TIME",
    "TTTM_EPD_ADJUST",
    "TTTM_TEMP_AUTOTUNE",
    "TTTM_VALVE_CONTROL",
    "TTTM_PENDULUM",
    "TTTM_PIN_ADJUST",
    "TTTM_GAS_PRESSURE",
    "TTTM_MFC_HUNT",
    "TTTM_GAS_LEAK",
    "TTTM_DNET_CAL",
    "TTTM_SHEET",
  ],
  CUSTOMER_CERTIFICATION: [
    "CUST_OHT_CERT",
    "CUST_I_MARKING",
    "CUST_GND_LABEL",
    "CUST_CSF_SEAL",
    "CUST_CERT_RESPONSE",
    "CUST_ENV_QUAL",
    "CUST_OHT_LAYOUT",
  ],
  PROCESS_CONFIRM: [
    "PROCESS_AGING",
    "PROCESS_AR_TEST",
    "PROCESS_SCRATCH",
    "PROCESS_PARTICLE",
    "PROCESS_EES_MATCH",
  ],
};

/** 소항목 → 설명 */
exports.CHECK_TITLES = {
  'INST_IMPORT_ORDER': '설비반입 순서를 숙지하고 있는가?',
  'INST_PACKING_LIST': 'Packing List 확인하여 반입 Part 확인이 가능 한가?',
  'INST_OHT_CHECK': '고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?',
  'INST_SPACING_CHECK': '설비간 유격거리가 충분한지 확인 알고 있는가?',
  'INST_DRAW_SETUP': 'Drawing Template을 기준선에 맞춰 배치 알고 있는가?',
  'INST_DRAW_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?',
  'INST_UTILITY_SPEC': '타공별 Utility Spec을 숙지하고 있는가?',
  'FAB_UNPACK_WARN': 'Module Unpacking시 주의 사항에 대해 숙지하고 있는가?',
  'FAB_CLEAN_WARN': 'Module Clean시 주의 사항에 대해 숙지하고 있는가?',
  'FAB_MOVE_WARN': 'Module 이동시 주의 사항에 대해 숙지하고 있는가?',
  'DOCK_TOOL_SIZE': '장비별 Tool size를 숙지하고 있는가?',
  'DOCK_LASER_JIG': 'Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?',
  'DOCK_LIFT_CASTER': 'Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?',
  'DOCK_FRAME_HEIGHT': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?',
  'DOCK_MODULE': 'Module간 Docking 할 수 있는가?',
  'DOCK_REALIGN': 'Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?',
  'DOCK_LEVELER_POS': '각 Moudule의 Leveler 정위치를 숙지하고 있는가?',
  'DOCK_LEVEL_SPEC': '각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?',
  'DOCK_ACCESSORY': 'Accessory(Baratron, Pirani, EPD)를 정위치에 장착 알고 있는가?',
  'DOCK_HOOK_UP': '내부 Hook Up 알고 있는가?',
  'CABLE_TRAY_CHECK': '설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?',
  'CABLE_SORTING': 'Cable 각 Module별로 분류 알고 있는가?',
  'CABLE_GRATING': 'Grating Open시 주의 사항을 숙지하고 있는가?',
  'CABLE_LADDER_RULES': '사다리 작업시 환경안전수칙을 숙지하고 있는가?',
  'CABLE_INSTALL': '설비에서 Rack까지 포설 알고 있는가?',
  'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결 알고 있는가?',
  'CABLE_TRAY_ARRANGE': 'Cable을 Tray에 규격에 맞게 정리 알고 있는가?',
  'CABLE_CUTTING': '설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?',
  'CABLE_RACK_CONNECT': 'Cable을 Rack에 정확히 연결알고 있는가?',
  'CABLE_PUMP_TRAY': 'Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?',
  'CABLE_PUMP_ARRANGE': 'Pump단에서 Cable 포설 및 정리 알고 있는가?',
  'CABLE_MODULE_PUMP': 'Cable을 구분하여 모듈별로 Pump에 정확히 연결 알고 있는가?',
  'POWER_GPS_UPS_SPS': 'GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?',
  'POWER_TURN_SEQ': 'Power turn on 순서를 숙지하고 있는가?',
  'POWER_ALARM_TROUBLE': 'Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?',
  'POWER_CB_UNDERSTAND': 'Rack의 CB 종류와 기능을 숙지하고 있는가?',
  'POWER_SAFETY_MODULE': 'Safety Module의 위치와 기능을 숙지하고 있는가?',
  'POWER_EMO_CHECK': 'EMO 동작 Check 알고 있는가?',
  'POWER_SYCON_UNDERST': 'Sycon number 별 의미하는 Part를 숙지하고 있는가?',
  'POWER_SYCON_TROUBLE': 'Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?',
  'UTIL_TURN_SEQ': 'Utility turn on 의 순서를 숙지하고 있는가?',
  'UTIL_VACUUM_TURN': 'Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'UTIL_CDA_TURN': 'CDA Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'UTIL_PCW_TURN': 'PCW Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'GAS_TURN_SEQ': 'Gas turn on 의 순서를 숙지하고 있는가?',
  'GAS_O2_N2_CHECK': 'O2, N2 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?',
  'GAS_TOXIC_CHECK': 'Toxic Gas Turn on 및 가스 유입유무를 확인 알고 있는가?',
  'GAS_MANOMETER_ADJUST': 'Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?',
  'TEACH_ROBOT_CONTROL': 'EFEM Robot Pendant 조작 가능한가?',
  'TEACH_ROBOT_LEVEL': 'EFEM Robot Leveling 알고 있는가? ( SANKYO )',
  'TEACH_ARM_LEVEL': 'EFEM Robot Arm Leveling 알고 있는가? ( SANKYO )',
  'TEACH_LOAD_PORT': 'EFEM Robot Load Port Teaching 가능한가? ( SANKYO )',
  'TEACH_LOADLOCK': 'EFEM Robot Loadlock Teaching 가능한가? ( SANKYO )',
  'TEACH_SIDE_STORAGE': 'EFEM Robot Side Storage Teaching 가능한가? ( SANKYO )',
  'TEACH_DATA_SAVE': 'EFEM Teaching Data 저장 가능한가?',
  'TEACH_TM_CONTROL': 'TM Robot Pendant 조작 가능한가?',
  'TEACH_TM_LOADLOCK': 'TM Robot Loadlock Teaching 가능한가? ( PERSIMMON )',
  'TEACH_TM_PM': 'TM Robot PM Teaching 가능한가? ( PERSIMMON )',
  'TEACH_TM_DATA_SAVE': 'TM Robot Teaching Data 저장 가능한가? ( PERSIMMON )',
  'TEACH_WAFER_JIG': 'Teaching Wafer Jig 사용 가능한가?',
  'TEACH_FINE': '미세 Teaching 가능한가?',
  'TEACH_MARGIN': '마진 Check 가능한가?',
  'TEACH_SEMI_TRANSFER': 'Semi Auto Transfer 알고 있는가?',
  'PART_EXHAUST_PORT': 'Exhaust Port 설치 위치와 방법을 알고 있는가?',
  'PART_EFF_SANKYO': 'EFEM Robot End-Effector 장착이 가능한가? ( SANKYO )',
  'PART_EFF_ADJUST': 'EFEM Robot End Effector Omm Adjust 가능한가? ( SANKYO )',
  'PART_EFF_LEVEL': 'EFEM Robot End-Effector Level 조절이 가능한가? ( SANKYO )',
  'PART_TM_EFF': 'TM Robot End Effector 장착이 가능한가? ( PERSIMMON )',
  'PART_TM_ADJUST_380': 'TM Robot End Effector 좌우 380mm Adjust 가능한가? ( PERSIMMON )',
  'PART_TM_ADJUST_16': 'TM Robot End Effector 상하 16mm Adjust 가능한가? ( PERSIMMON )',
  'PART_TM_LEVEL': 'TM Robot End Effector Level 조절이 가능한가? ( PERSIMMON )',
  'PART_PROCESS_KIT': 'Process Kit 장착이 가능한가?',
  'PART_PIO_CABLE': 'PIO Sensor, Cable 장착이 가능한가?',
  'PART_RACK_SIGNAL': 'Rack Signal Tower 설치가 가능한가?',
  'LEAK_PUMP_TURN': 'PUMP Turn On 알고 있는가?',
  'LEAK_PM_CHECK': 'PM Leak Check에 대해 알고 있는가?',
  'LEAK_GAS_CHECK': 'Gas Line Leak Check에 대해 알고 있는가?',
  'LEAK_TM_LL_CHECK': 'TM, LL Leak Check에 대해 알고 있는가?',
  'TTTM_ECID_MATCH': 'ECID Matching할 수 있는가?',
  'TTTM_PUMP_TIME': 'Load Lock Pumping/Purge Time 조절 가능한가?',
  'TTTM_VENT_TIME': 'Puming / Venting Time 조절 가능한가?',
  'TTTM_EPD_ADJUST': 'EPD Peak, Offset 조절 가능한가?',
  'TTTM_TEMP_AUTOTUNE': 'Temp autotune 가능한가?',
  'TTTM_VALVE_CONTROL': 'Slot Valve Open, Close Time 조절 가능한가?',
  'TTTM_PENDULUM': 'Pendulum Autolearn 가능한가?',
  'TTTM_PIN_ADJUST': 'Pin speed, height Adjust 가능한가?',
  'TTTM_GAS_PRESSURE': 'Gas Supply Pressure Check 가능한가?',
  'TTTM_MFC_HUNT': 'MFC Normal 상태 Hunting 유/무 확인 가능한가?',
  'TTTM_GAS_LEAK': 'Gas Line Leak Check 가능한가?',
  'TTTM_DNET_CAL': 'Prism D-Net Cal 가능한가?',
  'TTTM_SHEET': 'TTTM Sheet 작성 가능한가?',
  'CUST_OHT_CERT': 'OHT 인증에 대해 알고 대응 할 수 있는가?',
  'CUST_I_MARKING': '중간인증 전 I-Marking 위치 알고 있는가?',
  'CUST_GND_LABEL': 'GND 저항값, 각 gas 및 PCW 라인에 대해 라벨링 가능한가?',
  'CUST_CSF_SEAL': 'CSF(Rack단) 실리콘 마감 가능한가?',
  'CUST_CERT_RESPONSE': '중간인증에 대해 알고 대응 할 수 있는가?',
  'CUST_ENV_QUAL': '환경Qual에 대해 알고 대응 할 수 있는가?',
  'CUST_OHT_LAYOUT': 'OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?',
  'PROCESS_AGING': 'Aging Test 알고 있는가?',
  'PROCESS_AR_TEST': 'AR Test 알고 있는가?',
  'PROCESS_SCRATCH': 'Scratch Test 알고 있는가?',
  'PROCESS_PARTICLE': 'Paticle Check 알고 있는가?',
  'PROCESS_EES_MATCH': 'EES Tool Matching 알고 있는가?',
};
