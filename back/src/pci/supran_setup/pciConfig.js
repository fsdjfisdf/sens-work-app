// src/pci/supran_setup/pciConfig.js

/** 인정 장비 타입 (로그 equipment_type 필터) */
exports.ALLOWED_EQUIP_TYPES = [
  "SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM", "SUPRA Q"
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

/** 기준 작업 수(카테고리) */
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

/** 프리셋/로그/DB 표기 차이 보정 */
const ALIASES = {
  // 카테고리 표기
  "INSTALLATION PREPERATION": "INSTALLATION PREPARATION",
  "CABLE HOOKUP": "CABLE HOOK UP",
  "FABIN": "FAB IN",
  // FAB IN 세부 키 보정(프리셋 ↔ DB)
  "IMPORT COMPANY CAUTION": "EQUIPMENT_IMPORT_CAUTION",
  "IMPORT INSPECTION POINTS": "EQUIPMENT_IMPORT_CAUTION", // 유사 항목 통합
  "PROHIBITED ITEMS IMPORT": "EQUIPMENT_IMPORT_CAUTION",   // 유사 항목 통합
  "GRATING OPENING CHECK": "GRATING_OPEN_CAUTION",
  "PACKING LIST VERIFICATION": "PACKING_LIST_CHECK",
  "EQUIPMENT CLEARANCE CHECK": "EQUIPMENT_SPACING_CHECK",
  // POWER
  "RACK ELCB MCB UNDERSTANDING": "RACK_CB_UNDERSTANDING",
  "MODULE MCB TURN ON": "MODULE_CB_TURN_ON",
  "IP ADDRESS CHANGE": "IP_ADDRESS_CHANGE", // DB에 없으면 매칭 실패 → 무시됨
  // GAS
  "PM DILLUTION TEST": "PM_DILLUTION_TEST", // DB에 없으면 무시
  // 자잘한 표기
  "SYCON TROUBLESHOOTING": "SYCON_TROUBLESHOOTING",
  "CHECKLIST COMPLETION": "CHECKLIST_COMPLETION",
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
  // 1차: 별칭 치환
  const via = ALIASES[s] || s;
  return via.replace(/ /g, "_"); // DB 컬럼은 대부분 언더바
};

/** 작업자 별칭(동일인 취급) */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};

/** 카테고리 → (DB) 소항목 배열
 *  - SUPRA_SETUP 테이블의 실제 컬럼명들만 포함
 *  - 제공된 사양 중 DB에 없는 키는 제외(또는 유사 항목으로 통합)
 */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    "DRAWING_TEMPLATE_SETUP",
    "DRAWING_TEMPLATE_MARKING",
    "CUSTOMER_OHT_LINE_CHECK",
    "UTILITY_SPEC_UNDERSTANDING",
    "EQUIPMENT_SPACING_CHECK",
  ],
  FAB_IN: [
    "EQUIPMENT_IMPORT_ORDER",
    "EQUIPMENT_IMPORT_CAUTION",
    "GRATING_OPEN_CAUTION",
    "PACKING_LIST_CHECK",
  ],
  DOCKING: [
    "TOOL_SIZE_UNDERSTANDING",
    "LASER_JIG_ALIGNMENT",
    "LIFT_CASTER_REMOVAL",
    "MODULE_HEIGHT_DOCKING",
    "MODULE_DOCKING",
    "DOCKING_REALIGNMENT",
    "LEVELER_POSITION_UNDERSTANDING",
    "MODULE_LEVELING",
    "HOOK_UP", // (DOCKING_PIN_POSITION는 DB에 없음)
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
    "PUMP_CABLE_TRAY",
    "PUMP_CABLE_ARRANGEMENT",
    "CABLE_PM_PUMP_CONNECTION",
  ],
  POWER_TURN_ON: [
    "GPS_UPS_SPS_UNDERSTANDING",
    "POWER_TURN_ON_SEQUENCE",
    "RACK_CB_UNDERSTANDING",
    "SYCON_NUMBER_UNDERSTANDING",
    "MODULE_CB_TURN_ON",
    "SAFETY_MODULE_UNDERSTANDING",
    "EMO_CHECK",
    "POWER_TURN_ON_ALARM_TROUBLESHOOTING",
    // "CHECKLIST_COMPLETION", "IP_ADDRESS_CHANGE" // DB에 없으면 제외
  ],
  UTILITY_TURN_ON: [
    "UTILITY_TURN_ON_SEQUENCE",
    "VACUUM_TURN_ON",
    "CDA_TURN_ON",
    "PCW_TURN_ON",
    "PUMP_TURN_ON",
    "MANOMETER_LIMIT_ADJUST",
  ],
  GAS_TURN_ON: [
    "GAS_TURN_ON",
    "GAS_TURN_ON_CHECK",
    "OX_NX_GAS_TURN_ON",
  ],
  TEACHING: [
    "EFEM_ROBOT_PENDANT_CONTROL",
    "EFEM_ROBOT_LEVELING",
    "EFEM_ROBOT_ARM_LEVELING",
    "EFEM_TEACHING_DATA_SAVE",
    "TM_ROBOT_PENDANT_CONTROL",
    "TM_ROBOT_PICK_ADJUST",
    "TM_ROBOT_BM_TEACHING",
    "TM_ROBOT_PM_TEACHING",
    "TM_TEACHING_DATA_SAVE",
    "WAFER_JIG_USE",
    "LASER_JIG_USE",
    "FINE_TEACHING",
    "MARGIN_CHECK",
    "SEMI_AUTO_TRANSFER",
    "AGING_TEST",
  ],
  PART_INSTALLATION: [
    "BARATRON_PIRANI_GAUGE_INSTALLATION",
    "EPD_INSTALLATION",
    "PIO_SENSOR_CABLE_INSTALLATION",
    "RACK_SIGNAL_TOWER_INSTALLATION",
    "CTC_INSTALLATION",
    "PORTABLE_RACK_INSTALLATION",
    "PM_SAFETY_COVER_INSTALLATION",
    "PROCESS_KIT_INSTALLATION",
  ],
  LEAK_CHECK: [
    "PM_LEAK_CHECK",
    "GAS_LINE_LEAK_CHECK",
    "HELIUM_DETECTOR_USE",
  ],
  TTTM: [
    "COOLING_STAGE_PIN_CONTROL",
    "PUMP_VENT_TIME_ADJUST",
    "EPD_PEAK_OFFSET_ADJUST",
    "TEMP_AUTOTUNE",
    "DOOR_VALVE_CONTROL",
    "APC_AUTOLEARN",
    "PIN_SPEED_HEIGHT_ADJUST",
    "GAS_SUPPLY_PRESSURE_CHECK",
    "MFC_HUNTING_CHECK",
    "FCIP_CAL",
    "TTTM_SHEET_COMPLETION",
  ],
  CUSTOMER_CERTIFICATION: [
    "OHT_LAY_OUT_CERTIFICATION",
    "OHT_CERTIFICATION",
    "TOOL_PREP_CERTIFICATION",
    "EFEM_CERTIFICATION_PREP",
    "TM_CERTIFICATION_PREP",
    "PM_CERTIFICATION_PREP",
    "SUB_UNIT_CERTIFICATION_PREP",
    "RACK_CERTIFICATION_PREP",
    "CERTIFICATION_RESPONSE",
    "ENVIRONMENTAL_QUAL_RESPONSE",
  ],
  PROCESS_CONFIRM: [
    "AGING_TEST_PROCESS_CONFIRM",
    "EES_REPORT_PROCEDURE",
  ],
};

/** 소항목 → 설명(있으면 표시). 없는 건 빈 문자열 */
exports.CHECK_TITLES = {
  // ===== INSTALLATION_PREPARATION =====
  "CUSTOMER_OHT_LINE_CHECK": "고객사 기준선과 OHT 라인이 일치하는지 확인할 수 있는가?",
  "EQUIPMENT_SPACING_CHECK": "설비 간 유격 거리가 충분한지 확인할 수 있는가?",
  "DRAWING_TEMPLATE_SETUP": "Drawing Template을 기준선에 맞춰 정확히 배치할 수 있는가?",
  "DRAWING_TEMPLATE_MARKING": "타공/H빔/Adjust 위치를 도면 기준으로 정확히 마킹할 수 있는가?",
  "UTILITY_SPEC_UNDERSTANDING": "타공별 Utility Spec을 숙지하고 설명할 수 있는가?",

  // ===== FAB_IN =====
  "EQUIPMENT_IMPORT_ORDER": "설비 반입 순서를 숙지하고 절차대로 수행할 수 있는가?",
  "EQUIPMENT_IMPORT_CAUTION": "반입 시 주의/확인 사항을 파악하고 안내할 수 있는가?",
  "GRATING_OPEN_CAUTION": "Grating 개구부 작업 시 안전·품질상 주의 사항을 숙지했는가?",
  "PACKING_LIST_CHECK": "Packing List로 반입 Part를 누락 없이 확인할 수 있는가?",

  // ===== DOCKING =====
  "TOOL_SIZE_UNDERSTANDING": "장비별 Tool Size 사양을 이해하고 적용할 수 있는가?",
  "LASER_JIG_ALIGNMENT": "Laser Jig로 OHT Line과 설비의 정렬을 수행할 수 있는가?",
  "LIFT_CASTER_REMOVAL": "Lift를 사용해 EFEM Caster를 안전하게 제거할 수 있는가?",
  "MODULE_HEIGHT_DOCKING": "각 모듈의 바닥-프레임 높이를 Spec에 맞춰 Docking할 수 있는가?",
  "MODULE_DOCKING": "모듈 간 Docking 작업을 정확히 수행할 수 있는가?",
  "DOCKING_REALIGNMENT": "Docking 중 정렬이 틀어지면 재정렬(Realign)할 수 있는가?",
  "LEVELER_POSITION_UNDERSTANDING": "모듈 Leveler의 정위치를 숙지하고 있는가?",
  "MODULE_LEVELING": "모듈 Leveling Spec을 이해하고 Adjust로 Leveling할 수 있는가?",
  "HOOK_UP": "내부 Hook Up 구성과 절차를 이해하고 수행할 수 있는가?",

  // ===== CABLE_HOOK_UP =====
  "TRAY_CHECK": "설비→Rack Tray 경로와 작업 가능 여부를 판단할 수 있는가?",
  "CABLE_SORTING": "케이블을 모듈별로 분류하고 관리할 수 있는가?",
  "LADDER_SAFETY_RULES": "사다리 작업 시 환경·안전 수칙을 준수할 수 있는가?",
  "CABLE_INSTALLATION": "설비에서 Rack까지 케이블 포설(E-Routing)을 수행할 수 있는가?",
  "CABLE_CONNECTION": "케이블을 설비에 규격대로 정확히 연결할 수 있는가?",
  "CABLE_TRAY_ARRANGEMENT": "Tray 내 케이블을 규격에 맞게 정리할 수 있는가?",
  "CABLE_CUTTING": "설비-랙 간 거리 고려하여 케이블 재단을 정확히 수행하는가?",
  "PUMP_CABLE_TRAY": "Pump 케이블 종류를 구분하고 적절한 Tray로 분기할 수 있는가?",
  "PUMP_CABLE_ARRANGEMENT": "Pump 단 포설 및 정리를 규격대로 할 수 있는가?",
  "CABLE_PM_PUMP_CONNECTION": "케이블을 PM별로 구분해 Pump에 정확히 연결할 수 있는가?",
  // (CABLE에서 GRATING_OPEN_CAUTION는 FAB_IN과 동일 설명을 재사용)
  "GRATING_OPEN_CAUTION": "Grating 개구부 작업 시 안전·품질상 주의 사항을 숙지했는가?",

  // ===== POWER_TURN_ON =====
  "GPS_UPS_SPS_UNDERSTANDING": "GPS/UPS/SPS의 역할과 원리를 이해하고 있는가?",
  "POWER_TURN_ON_SEQUENCE": "Power Turn On 시퀀스를 정확히 숙지하고 있는가?",
  "RACK_CB_UNDERSTANDING": "Rack의 차단기(ELCB/MCB) 종류/기능을 이해하고 있는가?",
  "SYCON_NUMBER_UNDERSTANDING": "Sycon 넘버와 각 Part의 의미를 이해하고 있는가?",
  "MODULE_CB_TURN_ON": "모듈별 MCB 위치를 알고 정상적으로 On/Off 할 수 있는가?",
  "SAFETY_MODULE_UNDERSTANDING": "Safety Module의 위치/기능을 이해하고 점검할 수 있는가?",
  "EMO_CHECK": "EMO 동작을 정확히 확인/검증할 수 있는가?",
  "POWER_TURN_ON_ALARM_TROUBLESHOOTING": "Power On 후 발생 알람을 트러블슈팅 할 수 있는가?",

  // ===== UTILITY_TURN_ON =====
  "UTILITY_TURN_ON_SEQUENCE": "Utility Turn On의 순서를 숙지하고 준수하는가?",
  "VACUUM_TURN_ON": "Vacuum Turn On 및 Spec 조정을 수행할 수 있는가?",
  "CDA_TURN_ON": "CDA Turn On 및 Spec 조정을 수행할 수 있는가?",
  "PCW_TURN_ON": "PCW Turn On 및 Spec 조정을 수행할 수 있는가?",
  "PUMP_TURN_ON": "Pump Turn On을 절차대로 수행할 수 있는가?",
  "MANOMETER_LIMIT_ADJUST": "Manometer High/Low Limit 값을 Spec에 맞게 조정할 수 있는가?",

  // ===== GAS_TURN_ON =====
  "GAS_TURN_ON": "해당 장비의 Gas Turn On 절차를 숙지하고 수행할 수 있는가?",
  "GAS_TURN_ON_CHECK": "Turn On 이후 확인/검증 항목을 수행할 수 있는가?",
  "OX_NX_GAS_TURN_ON": "O2/N2 등 Ox/Nx 가스 Turn On을 안전하게 수행할 수 있는가?",

  // ===== TEACHING =====
  "EFEM_ROBOT_PENDANT_CONTROL": "EFEM Robot Pendant를 안전하게 조작할 수 있는가?",
  "EFEM_ROBOT_LEVELING": "EFEM 로봇 Leveling 절차를 수행할 수 있는가?",
  "EFEM_ROBOT_ARM_LEVELING": "EFEM 로봇 Arm Leveling을 규격에 맞게 수행할 수 있는가?",
  "EFEM_TEACHING_DATA_SAVE": "EFEM Teaching Data를 저장/복원할 수 있는가?",
  "TM_ROBOT_PENDANT_CONTROL": "TM Robot Pendant를 안전하게 조작할 수 있는가?",
  "TM_ROBOT_PICK_ADJUST": "TM Robot Pick 간격/위치를 규격에 맞게 조정할 수 있는가?",
  "TM_ROBOT_BM_TEACHING": "TM Robot BM Teaching을 수행할 수 있는가?",
  "TM_ROBOT_PM_TEACHING": "TM Robot PM Teaching을 수행할 수 있는가?",
  "TM_TEACHING_DATA_SAVE": "TM Teaching Data를 저장/복원할 수 있는가?",
  "WAFER_JIG_USE": "Teaching Wafer Jig를 올바르게 사용할 수 있는가?",
  "LASER_JIG_USE": "Laser Teaching Jig를 올바르게 사용할 수 있는가?",
  "FINE_TEACHING": "Fine Teaching(미세 보정)을 적절히 수행할 수 있는가?",
  "MARGIN_CHECK": "마진 체크(간섭/여유)를 정확히 수행할 수 있는가?",
  "SEMI_AUTO_TRANSFER": "Semi Auto Transfer 절차를 이해하고 수행할 수 있는가?",
  "AGING_TEST": "Aging Test를 이해하고 수행할 수 있는가?",

  // ===== PART_INSTALLATION =====
  "BARATRON_PIRANI_GAUGE_INSTALLATION": "Baratron/Pirani Gauge를 규격에 맞게 장착할 수 있는가?",
  "EPD_INSTALLATION": "EPD를 규격에 맞게 장착하고 점검할 수 있는가?",
  "PIO_SENSOR_CABLE_INSTALLATION": "PIO Sensor 및 케이블을 정확히 장착/연결할 수 있는가?",
  "RACK_SIGNAL_TOWER_INSTALLATION": "Rack Signal Tower를 규격대로 장착할 수 있는가?",
  "CTC_INSTALLATION": "CTC를 규정에 따라 설치/연결할 수 있는가?",
  "PORTABLE_RACK_INSTALLATION": "Portable Rack을 규정대로 설치할 수 있는가?",
  "PM_SAFETY_COVER_INSTALLATION": "PM Safety Cover를 안전하게 장착할 수 있는가?",
  "PROCESS_KIT_INSTALLATION": "Process Kit(상/하부)를 규격대로 장착할 수 있는가?",

  // ===== LEAK_CHECK =====
  "PM_LEAK_CHECK": "Chamber/PM 관련 구간 Leak Check를 수행할 수 있는가?",
  "GAS_LINE_LEAK_CHECK": "가스 라인 Leak Check를 절차대로 수행할 수 있는가?",
  "HELIUM_DETECTOR_USE": "He Detector를 사용하여 누설 여부를 판별할 수 있는가?",

  // ===== TTTM =====
  "COOLING_STAGE_PIN_CONTROL": "Cooling Stage/PIN 관련 제어를 수행할 수 있는가?",
  "PUMP_VENT_TIME_ADJUST": "Pumping/Venting Time을 적절히 조정할 수 있는가?",
  "EPD_PEAK_OFFSET_ADJUST": "EPD Peak/Offset을 규정에 맞게 조정할 수 있는가?",
  "TEMP_AUTOTUNE": "온도 Autotune을 절차에 맞게 수행할 수 있는가?",
  "DOOR_VALVE_CONTROL": "Door Valve Open/Close 시간을 조절할 수 있는가?",
  "APC_AUTOLEARN": "APC Autolearn을 수행하고 결과를 해석할 수 있는가?",
  "PIN_SPEED_HEIGHT_ADJUST": "Pin 속도/높이를 규정에 맞게 조정할 수 있는가?",
  "GAS_SUPPLY_PRESSURE_CHECK": "Gas Supply Pressure를 확인/기록할 수 있는가?",
  "MFC_HUNTING_CHECK": "MFC 정상 상태의 Hunting 유/무를 판별할 수 있는가?",
  "FCIP_CAL": "FCIP Cal을 절차에 맞게 수행할 수 있는가?",
  "TTTM_SHEET_COMPLETION": "TTTM Sheet를 누락 없이 작성할 수 있는가?",

  // ===== CUSTOMER_CERTIFICATION =====
  "OHT_LAY_OUT_CERTIFICATION": "OHT Lay-out 인증을 준비/수행할 수 있는가?",
  "OHT_CERTIFICATION": "OHT 자동 반송 인증 테스트를 수행할 수 있는가?",
  "TOOL_PREP_CERTIFICATION": "Tool 준비 관련 인증 대응을 수행할 수 있는가?",
  "EFEM_CERTIFICATION_PREP": "EFEM 인증 준비를 절차대로 수행할 수 있는가?",
  "TM_CERTIFICATION_PREP": "TM 인증 준비를 절차대로 수행할 수 있는가?",
  "PM_CERTIFICATION_PREP": "PM 인증 준비를 절차대로 수행할 수 있는가?",
  "SUB_UNIT_CERTIFICATION_PREP": "Sub-Unit 인증 준비를 수행할 수 있는가?",
  "RACK_CERTIFICATION_PREP": "Rack 인증 준비를 절차대로 수행할 수 있는가?",
  "CERTIFICATION_RESPONSE": "인증 요구사항에 대응/보고할 수 있는가?",
  "ENVIRONMENTAL_QUAL_RESPONSE": "환경 QUAL 요구사항에 대응할 수 있는가?",

  // ===== PROCESS_CONFIRM =====
  "AGING_TEST_PROCESS_CONFIRM": "Aging Test 결과를 기반으로 공정 확인을 수행할 수 있는가?",
  "EES_REPORT_PROCEDURE": "EES Report 작성/절차를 이해하고 수행할 수 있는가?",
};

