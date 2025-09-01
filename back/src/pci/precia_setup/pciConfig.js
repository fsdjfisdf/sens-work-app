// src/pci/precia_setup/pciConfig.js

/** 인정 장비 타입 */
exports.ALLOWED_EQUIP_TYPES = ["PRECIA", "Precia", "precia"];

/** 공통 유틸 */
const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();

/** Canon (로그 ↔ 기준명 매칭용) */
const canon = (s) =>
  upper(s)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
exports.canon = canon;

/** 동의어/오탈자 */
const ALIASES = {
  "INSTALLATION PREPERATION": "INSTALLATION PREPARATION", // DB 오탈자 보정
};
exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const via = canon(raw);
  const m = ALIASES[via] || via;
  // 기준 테이블에서 Canon 매칭
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find((k) => canon(k) === m);
  return hit || via;
};

/** 작업자 별칭(동일인 취급) */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};

/** 기준 작업 수 (카테고리) */
exports.BASELINE = {
  "INSTALLATION PREPARATION": 5,
  "FAB IN": 5,
  "DOCKING": 10,
  "CABLE HOOK UP": 10,
  "POWER TURN ON": 10,
  "UTILITY TURN ON": 2.5,
  "GAS TURN ON": 2.5,
  "TEACHING": 30,
  "PART INSTALLATION": 2.5,
  "LEAK CHECK": 2.5,
  "TTTM": 10,
  "CUSTOMER CERTIFICATION": 5,
  "PROCESS CONFIRM": 5,
};

/** 카테고리 → 소항목 배열 */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    'INST_OHT_CHECK','INST_SPACING_CHECK','INST_DRAW_SETUP','INST_DRAW_MARKING','INST_UTILITY_SPEC'
  ],
  FAB_IN: [
    'FAB_IMPORT_ORDER','FAB_WARN_ISSUE','FAB_INSPECT','FAB_FORBIDDEN','FAB_GRATING','FAB_PACKING_LIST'
  ],
  DOCKING: [
    'DOCK_TOOL_SIZE','DOCK_LASER_JIG','DOCK_CASTER','DOCK_HEIGHT','DOCK_MODULE',
    'DOCK_REALIGN','DOCK_LEVEL_POS','DOCK_LEVEL_SPEC','DOCK_ACCESSORY','DOCK_HOOK_UP'
  ],
  CABLE_HOOK_UP: [
    'CABLE_TRAY_CHECK','CABLE_SORTING','CABLE_GRATING','CABLE_LADDER_RULES','CABLE_INSTALL',
    'CABLE_CONNECTION','CABLE_TRAY_ARRANGE','CABLE_CUTTING','CABLE_RACK_CONNECT',
    'CABLE_PUMP_TRAY','CABLE_PUMP_ARRANGE','CABLE_MODULE_PUMP'
  ],
  POWER_TURN_ON: [
    'POWER_GPS_UPS_SPS','POWER_TURN_SEQ','POWER_CB_UNDERSTAND','POWER_SAFETY_MODULE','POWER_EMO_CHECK',
    'POWER_MODULE_MCB','POWER_SYCON_UNDERST','POWER_SYCON_TROUBLE','POWER_NAVIGATOR','POWER_SERVO_CHECK',
    'POWER_ALARM_TROUBLE','POWER_CHECKLIST','POWER_VISION_CONNECT','POWER_IP_CHANGE'
  ],
  UTILITY_TURN_ON: [
    'UTIL_CDA_TURN','UTIL_PRE_CHECK','UTIL_SETUP_MOD','UTIL_TURN_SEQ','UTIL_VACUUM_TURN',
    'UTIL_SOLENOID','UTIL_RELIEF_VALVE','UTIL_MANUAL_VALVE','UTIL_PUMP_TURN','UTIL_SIGNAL_CHECK',
    'UTIL_CHILLER_TURN','UTIL_CHILLER_CHECK','UTIL_MANOMETER_ADJUST'
  ],
  GAS_TURN_ON: [
    'GAS_TURN_SEQ','GAS_O2_LEAK','GAS_N2_LEAK','GAS_AR_TURN','GAS_CF4_TURN','GAS_SF6_TURN',
    'GAS_TURN_WARN','GAS_DILLUTION_TEST','GAS_FLOW_CHECK'
  ],
  TEACHING: [
    'TEACH_ROBOT_CONTROL','TEACH_ROBOT_XYZ','TEACH_ROBOT_PARAM','TEACH_DATA_SAVE','TEACH_AWC_CAL',
    'TEACH_TM_CONTROL','TEACH_TM_LEVELING','TEACH_TM_VALUES','TEACH_TM_PM','TEACH_TM_AWC','TEACH_TM_LL',
    'TEACH_TM_LL_AWC','TEACH_TM_DATA_SAVE','TEACH_TM_MACRO','TEACH_TM_AXIS','TEACH_SEMI_TRANSFER',
    'TEACH_AGING','TEACH_PIN','TEACH_CHUCK','TEACH_GAP','TEACH_SENSOR','TEACH_CAL','TEACH_CENTERING'
  ],
  PART_INSTALLATION: [
    'PART_PROCESS_KIT','PART_PIN_HEIGHT','PART_PIO_SENSOR','PART_EARTHQUAKE',
    'PART_EFEM_PICK','PART_EFEM_PICK_LEVEL','PART_EFEM_PICK_ADJUST',
    'PART_TM_PICK','PART_TM_PICK_LEVEL','PART_TM_PICK_ADJUST'
  ],
  LEAK_CHECK: [
    'LEAK_CHAMBER','LEAK_LINE','LEAK_HISTORY'
  ],
  TTTM: [
    'TTTM_MANOMETER_DNET','TTTM_PIRANI_DNET','TTTM_VALVE_TIME','TTTM_APC_AUTOTUNE',
    'TTTM_PIN_HEIGHT','TTTM_GAS_PRESSURE','TTTM_MFC_CAL','TTTM_LP_FLOW','TTTM_REPORT','TTTM_SHEET'
  ],
  CUSTOMER_CERTIFICATION: [
    'CUST_LP_CERT','CUST_RUN_CERT','CUST_LABEL','CUST_I_MARK','CUST_I_MARK_LOC','CUST_ENV_QUAL',
    'CUST_OHT_CERT','CUST_RUN_CERTIFY'
  ],
  PROCESS_CONFIRM: [
    'PROC_PARTICLE','PROC_EA_TEST'
  ],
};

/** 소항목 → 설명 (프런트 상세에 노출) */
exports.CHECK_TITLES = {
  'INST_OHT_CHECK': '고객사에서 그린 기준선과 OHT라인이 일치하는지 확인하고 있는가?',
  'INST_SPACING_CHECK': '설비 간 유격 거리가 충분한지 확인하고 있는가?',
  'INST_DRAW_SETUP': 'Drawing Template을 기준선에 맞춰 배치하고 있는가?',
  'INST_DRAW_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust를 마킹하고 있는가?',
  'INST_UTILITY_SPEC': '타공별 Utility Spec을 숙지하고 있는가?',
  'FAB_IMPORT_ORDER': '설비 반입 순서를 숙지하고 있는가?',
  'FAB_WARN_ISSUE': '반입 업체에게 주의 사항을 설명할 수 있는가?',
  'FAB_INSPECT': '설비 반입 시 확인해야 할 부분을 숙지하고 있는가?',
  'FAB_FORBIDDEN': '설비 반입 금지 물품에 대해 알고 있는가?',
  'FAB_GRATING': 'Grating 개구부 마감 처리 확인을 하고 있는가?',
  'FAB_PACKING_LIST': 'Packing List를 확인하여 반입 Part를 확인할 수 있는가?',
  'DOCK_TOOL_SIZE': '장비별 Tool size를 숙지하고 있는가?',
  'DOCK_LASER_JIG': 'Laser Jig를 이용하여 OHT Line과 설비를 정렬하고 있는가?',
  'DOCK_CASTER': 'Lift를 활용하여 EFEM의 Caster를 제거하고 있는가?',
  'DOCK_HEIGHT': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking하고 있는가?',
  'DOCK_MODULE': 'Module 간 Docking을 할 수 있는가?',
  'DOCK_REALIGN': 'Docking 작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬하고 있는가?',
  'DOCK_LEVEL_POS': '각 Module의 Leveler 정위치를 숙지하고 있는가?',
  'DOCK_LEVEL_SPEC': '각 Module의 Leveling Spec을 알고 Adjust를 이용하여 Leveling을 하고 있는가?',
  'DOCK_ACCESSORY': 'Accessory를 정위치에 장착하고 있는가?',
  'DOCK_HOOK_UP': '내부 Hook Up을 알고 있는가?',
  'CABLE_TRAY_CHECK': '설비에서 Rack까지 Tray 확인 및 작업 가능 여부를 판단할 수 있는가?',
  'CABLE_SORTING': 'Cable을 각 Module별로 분류할 수 있는가?',
  'CABLE_GRATING': 'Grating Open 시 주의 사항을 숙지하고 있는가?',
  'CABLE_LADDER_RULES': '사다리 작업 시 환경 안전 수칙을 숙지하고 있는가?',
  'CABLE_INSTALL': '설비에서 Rack까지 포설을 알고 있는가?',
  'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결하고 있는가?',
  'CABLE_TRAY_ARRANGE': 'Cable을 Tray에 규격에 맞게 정리하고 있는가?',
  'CABLE_CUTTING': '설비와 Rack 간의 거리를 고려해 Cable을 재단할 수 있는가?',
  'CABLE_RACK_CONNECT': 'Cable을 Rack에 정확히 연결하고 있는가?',
  'CABLE_PUMP_TRAY': 'Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?',
  'CABLE_PUMP_ARRANGE': 'Pump 단에서 Cable 포설 및 정리를 하고 있는가?',
  'CABLE_MODULE_PUMP': 'Cable을 구분하여 Module별로 Pump에 정확히 연결하고 있는가?',
  'POWER_GPS_UPS_SPS': 'GPS, UPS, SPS의 역할과 원리를 숙지하고 있는가?',
  'POWER_TURN_SEQ': 'Power turn on 순서를 숙지하고 있는가?',
  'POWER_CB_UNDERSTAND': 'Rack의 ELCB, MCB 종류와 기능을 숙지하고 있는가?',
  'POWER_SAFETY_MODULE': 'Safety Module의 위치와 기능을 숙지하고 있는가?',
  'POWER_EMO_CHECK': 'EMO 동작을 확인할 수 있는가?',
  'POWER_MODULE_MCB': 'Module별 MCB 위치를 알고 Turn on을 할 수 있는가?',
  'POWER_SYCON_UNDERST': 'Sycon number별 의미하는 Part를 숙지하고 있는가?',
  'POWER_SYCON_TROUBLE': 'Sycon 실행 시 통신되지 않는 Part에 대해 Trouble Shooting을 할 수 있는가?',
  'POWER_NAVIGATOR': 'LS-Navigator 실행 및 설정에 대해 알고 있는가?',
  'POWER_SERVO_CHECK': 'Chuck Motor Servo On Check 및 실행을 할 수 있는가?',
  'POWER_ALARM_TROUBLE': 'Power turn on 후 발생하는 Alarm에 대해 Trouble Shooting을 할 수 있는가?',
  'POWER_CHECKLIST': '구동 Checklist를 작성할 수 있는가?',
  'POWER_VISION_CONNECT': 'Vision CTR 접속 및 Vision Program 실행에 대해 알고 있는가?',
  'POWER_IP_CHANGE': 'IP 주소 변경 방법에 대해 알고 있는가?',
  'UTIL_CDA_TURN': 'CDA Turn On을 할 수 있는가?',
  'UTIL_PRE_CHECK': 'Utility Turn on 전 확인 사항을 알고 있는가?',
  'UTIL_SETUP_MOD': 'SetUp.ini 파일을 수정하는 방법에 대해 알고 있는가?',
  'UTIL_TURN_SEQ': 'Utility Turn on의 순서를 숙지하고 있는가?',
  'UTIL_VACUUM_TURN': 'Vacuum Turn on 및 Spec에 맞게 조정할 수 있는가?',
  'UTIL_SOLENOID': 'Solenoid Valve 위치를 전부 숙지하고 있는가?',
  'UTIL_RELIEF_VALVE': 'Relief Valve 위치를 전부 숙지하고 있는가?',
  'UTIL_MANUAL_VALVE': 'Manual Valve 위치를 전부 숙지하고 있는가?',
  'UTIL_PUMP_TURN': 'PUMP Turn On을 알고 있는가?',
  'UTIL_SIGNAL_CHECK': 'Dillution Signal Check 방법을 알고 있는가?',
  'UTIL_CHILLER_TURN': 'Chiller Turn On을 알고 있는가?',
  'UTIL_CHILLER_CHECK': 'Chiller Turn On 이후 확인 사항을 알고 있는가?',
  'UTIL_MANOMETER_ADJUST': 'Manometer의 Low, High Limit 값을 Spec에 맞게 조정할 수 있는가?',
  'GAS_TURN_SEQ': 'Gas Turn on 전 확인 사항을 알고 있는가?',
  'GAS_O2_LEAK': 'O2 Line Leak Check 하는 방법을 알고 있는가?',
  'GAS_N2_LEAK': 'N2 Line Leak Check 하는 방법을 알고 있는가?',
  'GAS_AR_TURN': 'Ar Turn on 하는 방법을 알고 있는가?',
  'GAS_CF4_TURN': 'CF4 Turn on 하는 방법을 알고 있는가?',
  'GAS_SF6_TURN': 'SF6 Turn on 이후 확인 사항을 알고 있는가?',
  'GAS_TURN_WARN': 'Gas Turn on 시 주의 사항을 알고 있는가?',
  'GAS_DILLUTION_TEST': 'PM Dillution Test 하는 방법을 알고 있는가?',
  'GAS_FLOW_CHECK': 'Gas Turn on 후 가스 유입 여부를 확인할 수 있는가?',
  'TEACH_ROBOT_CONTROL': 'EFEM Robot Pendant를 조작할 수 있는가?',
  'TEACH_ROBOT_XYZ': 'EFEM X, Y, Z, S1, S2 값을 알고 있는가? (SANKYO)',
  'TEACH_ROBOT_PARAM': 'EFEM Robot Parameter를 수정할 수 있는가? (SANKYO)',
  'TEACH_DATA_SAVE': 'EFEM Teaching Data를 저장할 수 있는가? (SANKYO)',
  'TEACH_AWC_CAL': 'EFEM AWC Cal을 진행할 수 있는가? (SANKYO)',
  'TEACH_TM_CONTROL': 'TM Robot Pendant를 조작할 수 있는가? (PERSIMMON)',
  'TEACH_TM_LEVELING': 'TM Robot Leveling을 할 수 있는가? (PERSIMMON)',
  'TEACH_TM_VALUES': 'TM Robot A, B arm Ra, Rb, Z, T 값을 알고 있는가? (PERSIMMON)',
  'TEACH_TM_PM': 'TM Robot PM Teaching을 할 수 있는가? (PERSIMMON)',
  'TEACH_TM_AWC': 'TM Robot PM Teaching 후 AWC Cal을 할 수 있는가? (PERSIMMON)',
  'TEACH_TM_LL': 'TM Robot LL Teaching을 할 수 있는가? (PERSIMMON)',
  'TEACH_TM_LL_AWC': 'TM Robot LL Teaching 후 AWC Cal을 할 수 있는가? (PERSIMMON)',
  'TEACH_TM_DATA_SAVE': 'TM Robot Teaching Data를 저장할 수 있는가? (PERSIMMON)',
  'TEACH_TM_MACRO': 'TM Robot PM Macro Test로 AWC를 검증할 수 있는가?',
  'TEACH_TM_AXIS': 'TM Robot Axis를 정렬할 수 있는가?',
  'TEACH_SEMI_TRANSFER': 'Semi Auto Transfer를 알고 있는가?',
  'TEACH_AGING': 'Aging Test를 알고 있는가?',
  'TEACH_PIN': 'Pin Teaching을 할 수 있는가?',
  'TEACH_CHUCK': 'Chuck Teaching을 할 수 있는가?',
  'TEACH_GAP': 'Gap Teaching을 할 수 있는가?',
  'TEACH_SENSOR': 'Gap Sensor를 Adjust할 수 있는가?',
  'TEACH_CAL': '2 Point Calibration을 할 수 있는가?',
  'TEACH_CENTERING': 'Wafer Centering을 할 수 있는가?',
  'PART_PROCESS_KIT': '상부 및 하부 Process Kit 장착 방법을 알고 있는가?',
  'PART_PIN_HEIGHT': 'Pin 장착 및 Pin 높이 조절에 대해 알고 있는가?',
  'PART_PIO_SENSOR': 'PIO Sensor 장착 방법을 알고 있는가?',
  'PART_EARTHQUAKE': '지진 방지 BKT의 정위치 및 설비 쪽 체결을 할 수 있는가?',
  'PART_EFEM_PICK': 'EFEM Robot Pick 장착 방법을 알고 있는가?',
  'PART_EFEM_PICK_LEVEL': 'EFEM Robot Pick Leveling 방법을 알고 있는가?',
  'PART_EFEM_PICK_ADJUST': 'EFEM Robot Pick 간격을 Adjust할 수 있는가?',
  'PART_TM_PICK': 'TM Robot Pick 장착 방법을 알고 있는가?',
  'PART_TM_PICK_LEVEL': 'TM Robot Pick Leveling 방법을 알고 있는가?',
  'PART_TM_PICK_ADJUST': 'TM Robot Pick 간격을 Adjust할 수 있는가? (상하, 좌우)',
  'LEAK_CHAMBER': 'Chamber Manual Leak Check 방법을 알고 있는가?',
  'LEAK_LINE': 'Line Manual Leak Check 방법을 알고 있는가?',
  'LEAK_HISTORY': 'Manual Leak Check History를 확인할 수 있는가?',
  'TTTM_MANOMETER_DNET': 'Manometer D-NET Calibration을 할 수 있는가?',
  'TTTM_PIRANI_DNET': 'TM, LL Pirani Gauge D-NET Calibration을 할 수 있는가?',
  'TTTM_VALVE_TIME': 'Door Valve, Slot Valve Open, Close 시간을 조절할 수 있는가?',
  'TTTM_APC_AUTOTUNE': 'APC Autolearn을 할 수 있는가?',
  'TTTM_PIN_HEIGHT': 'Pin Height를 Adjust할 수 있는가?',
  'TTTM_GAS_PRESSURE': 'Gas Supply Pressure를 확인할 수 있는가?',
  'TTTM_MFC_CAL': 'MFC Zero Calibration을 할 수 있는가?',
  'TTTM_LP_FLOW': 'LP 유량을 조절할 수 있는가?',
  'TTTM_REPORT': 'Product Report를 작성할 수 있는가?',
  'TTTM_SHEET': 'TTTM Sheet를 작성할 수 있는가?',
  'CUST_LP_CERT': 'LP 인증을 할 수 있는가?',
  'CUST_RUN_CERT': '중간 가동 인증 준비 사항을 알고 있는가?',
  'CUST_LABEL': 'Label을 붙여야 할 곳이 어디인지 알고 있는가?',
  'CUST_I_MARK': 'I-Marking 방법에 대해 알고 있는가?',
  'CUST_I_MARK_LOC': 'I-Marking을 해야 하는 곳이 어디인지 알고 있는가?',
  'CUST_ENV_QUAL': '환경 Qual Test를 할 수 있는가?',
  'CUST_OHT_CERT': 'OHT 자동 반송 인증 Test를 할 수 있는가?',
  'CUST_RUN_CERTIFY': '중간 가동 인증을 할 수 있는가?',
  'PROC_PARTICLE': 'Particle Test를 할 수 있는가?',
  'PROC_EA_TEST': 'E/A Test를 할 수 있는가?',
};

/** 카테고리 표준화 (DB/로그 → 표시명) */
exports.toDisplayCategory = (raw) => {
  const s = upper(raw).replace(/_/g, " ").trim();
  const via = ALIASES[s] || s;
  // 정식표기 매칭
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find((k) => canon(k) === canon(via));
  return hit || via;
};

/** 카테고리 → 소항목 키 배열 (표시명 입력도 허용) */
exports.getChecklistKeysForCategory = (catDisplay) => {
  // CATEGORY_ITEMS 키는 언더바 표기, 표시명도 허용
  const key = Object.keys(exports.CATEGORY_ITEMS).find(
    (k) => canon(k.replace(/_/g, " ")) === canon(catDisplay)
  );
  return key ? exports.CATEGORY_ITEMS[key] : [];
};
