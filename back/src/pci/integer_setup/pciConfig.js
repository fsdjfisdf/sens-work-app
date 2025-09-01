// src/pci/integer_setup/pciConfig.js

/** 인정 장비 타입 (work_log.equipment_type 필터) — 필요 시 추가해도 됨 */
exports.ALLOWED_EQUIP_TYPES = [
  "INTEGER IVr", "INTEGER Ivr", "INTEGER ivr",
  "INTEGER Plus", "INTEGER plus", "INTEGER PLUS",
  "INTEGER XP"
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
  "UTILITY TURN ON": 2.5,
  "GAS TURN ON": 2.5,
  "TEACHING": 30,
  "PART INSTALLATION": 2.5,
  "LEAK CHECK": 2.5,
  "TTTM": 10,
  "CUSTOMER CERTIFICATION": 5,
  "PROCESS CONFIRM": 5,
};

/** 표기 보정 */
const ALIASES = {
  "INSTALLATION PREPERATION": "INSTALLATION PREPARATION",
  "FABIN": "FAB IN",
  "CABLE HOOKUP": "CABLE HOOK UP",
  // 소항목 보정(대표 예)
  "EQUIPMENT CLEARANCE CHECK": "EQUIPMENT_CLEARANCE_CHECK",
  "GRATING OPENING CHECK": "GRATING_OPENING_CHECK",
  "PACKING LIST VERIFICATION": "PACKING_LIST_VERIFICATION",
  "IMPORT COMPANY CAUTION": "IMPORT_COMPANY_CAUTION",
  "IMPORT INSPECTION POINTS": "IMPORT_INSPECTION_POINTS",
  "PROHIBITED ITEMS IMPORT": "PROHIBITED_ITEMS_IMPORT",
  "RACK ELCB MCB UNDERSTANDING": "RACK_ELCB_MCB_UNDERSTANDING",
  "MODULE MCB TURN ON": "MODULE_MCB_TURN_ON",
  "SYCON TROUBLESHOOTING": "SYCON_TROUBLESHOOTING",
  "IP ADDRESS CHANGE": "IP_ADDRESS_CHANGE",
  "SETUP INI MODIFICATION": "SETUP_INI_MODIFICATION",
  "DILLUTION SIGNAL CHECK": "DILLUTION_SIGNAL_CHECK",
  "CHILLER HEAT EXCHANGER TURN ON": "CHILLER_HEAT_EXCHANGER_TURN_ON",
  "CHILLER HEAT EXCHANGER CHECK": "CHILLER_HEAT_EXCHANGER_CHECK",
};

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

/** 카테고리 → 소항목(=INTEGER_SETUP 컬럼들) */
exports.CATEGORY_ITEMS = {
  INSTALLATION_PREPARATION: [
    "CUSTOMER_OHT_LINE_CHECK",
    "EQUIPMENT_CLEARANCE_CHECK",
    "DRAWING_TEMPLATE_SETUP",
    "DRAWING_TEMPLATE_MARKING",
    "UTILITY_SPEC_UNDERSTANDING",
  ],
  FAB_IN: [
    "EQUIPMENT_IMPORT_ORDER",
    "IMPORT_COMPANY_CAUTION",
    "IMPORT_INSPECTION_POINTS",
    "PROHIBITED_ITEMS_IMPORT",
    "GRATING_OPENING_CHECK",
    "PACKING_LIST_VERIFICATION",
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
    "DOCKING_PIN_POSITION",
    "HOOK_UP",
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
    "RACK_ELCB_MCB_UNDERSTANDING",
    "SAFETY_MODULE_UNDERSTANDING",
    "EMO_CHECK",
    "MODULE_MCB_TURN_ON",
    "SYCON_NUMBER_UNDERSTANDING",
    "SYCON_TROUBLESHOOTING",
    "POWER_TURN_ON_ALARM_TROUBLESHOOTING",
    "CHECKLIST_COMPLETION",
    "IP_ADDRESS_CHANGE",
  ],
  UTILITY_TURN_ON: [
    "UTILITY_TURN_ON_PRECHECK",
    "SETUP_INI_MODIFICATION",
    "UTILITY_TURN_ON_SEQUENCE",
    "VACUUM_TURN_ON",
    "CDA_TURN_ON",
    "PCW_TURN_ON",
    "SOLANOID_VALVE_LOCATION",
    "RELIEF_VALVE_LOCATION",
    "MANUAL_VALVE_LOCATION",
    "PUMP_TURN_ON",
    "PURGE_N2_TURN_ON",
    "DILLUTION_SIGNAL_CHECK",
    "CHILLER_HEAT_EXCHANGER_TURN_ON",
    "CHILLER_HEAT_EXCHANGER_CHECK",
    "MANOMETER_LIMIT_ADJUST",
  ],
  GAS_TURN_ON: [
    "GAS_TURN_ON_PRECHECK",
    "NF3_LINE_LEAK_CHECK",
    "H2_LINE_LEAK_CHECK",
    "NF3_TURN_ON",
    "H2_TURN_ON",
    "GAS_TURN_ON_CHECK",
    "GAS_TURN_ON_CAUTION",
    "PM_DILLUTION_TEST",
    "GAS_TURN_ON_CONFIRM",
  ],
  TEACHING: [
    "EFEM_ROBOT_PENDANT_CONTROL",
    "EFEM_ROBOT_XYZ_VALUES",
    "EFEM_ROBOT_PARAMETER_EDIT",
    "EFEM_TEACHING_DATA_SAVE",
    "TM_ROBOT_PENDANT_CONTROL",
    "TM_ROBOT_LEVELING",
    "TM_ROBOT_XYZ_VALUES",
    "TM_ROBOT_PM_TEACHING",
    "TM_ROBOT_AM_TEACHING",
    "TM_TEACHING_DATA_SAVE",
    "WAFER_JIG_USE",
    "LASER_JIG_USE",
    "MARGIN_CHECK",
    "SEMI_AUTO_TRANSFER",
    "AGING_TEST",
  ],
  PART_INSTALLATION: [
    "CERAMIC_PLATE_PIN_INSTALLATION",
    "PIN_HEIGHT_ADJUST",
    "PIO_SENSOR_INSTALLATION",
    "VIEW_PORT_COVER_INSTALLATION",
    "LOAD_LOCK_LEVELING",
    "TM_ROBOT_PICK_INSTALLATION",
    "TM_ROBOT_PICK_LEVELING",
    "GAS_BOX_WINDOW_INSTALLATION",
    "GAS_BOX_DAMPER_INSTALLATION",
  ],
  LEAK_CHECK: [
    "LINE_MANUAL_LEAK_CHECK",
    "MANUAL_LEAK_CHECK_HISTORY",
    "HE_DETECTOR_USE",
    "HE_BOTTLE_ORDER",
    "HE_DETECTOR_HOUSING_LEAK_CHECK",
    "SLOT_VALVE_HE_LEAK_CHECK",
  ],
  TTTM: [
    "VAC_CDA_SPEC_ADJUST",
    "TEMP_PROFILE",
    "PUMP_VENT_TIME_ADJUST",
    "EPD_PEAK_OFFSET_ADJUST",
    "PM_BAFFLE_TEMP_AUTOTUNE",
    "DOOR_VALVE_CONTROL",
    "APC_AUTOLEARN",
    "PIN_HEIGHT_ADJUST_B",
    "GAS_SUPPLY_PRESSURE_CHECK",
    "GAS_EXHAUST_MONAMETER_CONTROL",
    "MFC_HUNTING_CHECK",
    "LP_FLOW_CONTROL",
    "AICP_POWER_CAL",
    "PRODUCT_REPORT_COMPLETION",
    "TTTM_SHEET_COMPLETION",
  ],
  CUSTOMER_CERTIFICATION: [
    "LP_CERTIFICATION",
    "FULL_PUMPING",
    "MID_OPERATION_CERTIFICATION_PREP",
    "LABEL_PLACEMENT",
    "I_MARKING_PROCEDURE",
    "I_MARKING_LOCATION",
    "GAS_BOX_BOARD_LEVELING",
    "ENVIRONMENTAL_QUAL_TEST",
    "OHT_AUTO_TRANSFER_CERTIFICATION",
  ],
  PROCESS_CONFIRM: ["PARTICLE_TEST", "EA_TEST"],
};

/** DAO에서 쓰는: 카테고리로 체크리스트 키 배열 얻기 */
exports.getChecklistKeysForCategory = (catDisplay) => {
  const disp = exports.toDisplayCategory(catDisplay);
  const key = Object.keys(exports.CATEGORY_ITEMS).find(
    (k) => canon(k) === canon(disp)
  );
  return key ? exports.CATEGORY_ITEMS[key] : [];
};

/** 소항목 → 설명(프런트 툴팁/모달에 활용) */
exports.CHECK_TITLES = {
  'CUSTOMER_OHT_LINE_CHECK': '고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?',
  'EQUIPMENT_CLEARANCE_CHECK': '설비간 유격거리가 충분한지 확인 알고 있는가?',
  'DRAWING_TEMPLATE_SETUP': 'Drawing Template을 기준선에 맞춰 배치 알고 있는가?',
  'DRAWING_TEMPLATE_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?',
  'UTILITY_SPEC_UNDERSTANDING': '타공별 Utility Spec을 기입 해야 하는지 알고 있는가?',
  'EQUIPMENT_IMPORT_ORDER': '설비반입 순서를 숙지하고 있는가?',
  'IMPORT_COMPANY_CAUTION': '반입 업체에게 주의점을 설명할 수 있는가?',
  'IMPORT_INSPECTION_POINTS': '설비반입 시 확인해야하는 부분을 숙지하고 있는가?',
  'PROHIBITED_ITEMS_IMPORT': '설비반입 금지 물품에 대해 알고 있는가?',
  'GRATING_OPENING_CHECK': 'Grating 개구부 마감 처리 확인에 대해 알고 있는가?',
  'PACKING_LIST_VERIFICATION': 'Packing List 확인하여 반입 Part 확인이 가능 한가?',
  'TOOL_SIZE_UNDERSTANDING': '장비별 Tool size를 숙지하고 있는가?',
  'LASER_JIG_ALIGNMENT': 'Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?',
  'LIFT_CASTER_REMOVAL': 'Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?',
  'MODULE_HEIGHT_DOCKING': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?',
  'MODULE_DOCKING': 'Module간 Docking 할 수 있는가?',
  'DOCKING_REALIGNMENT': 'Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?',
  'LEVELER_POSITION_UNDERSTANDING': '각 Moudule의 Leveler 정위치를 숙지하고 있는가?',
  'MODULE_LEVELING': '각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?',
  'DOCKING_PIN_POSITION': 'Docking Pin 정위치 판단할 수 있는가?',
  'HOOK_UP': '내부 Hook Up 알고 있는가?',
  'TRAY_CHECK': '설비에서 Rack까지 Tray 확인 및 작업가능여부 판단 알고 있는가?',
  'CABLE_SORTING': 'Cable 각 Module별로 분류 알고 있는가?',
  'GRATING_OPEN_CAUTION': 'Grating Open시 주의 사항을 숙지하고 있는가?',
  'LADDER_SAFETY_RULES': '사다리 작업시 환경안전수칙을 숙지하고 있는가?',
  'CABLE_INSTALLATION': '설비에서 Rack까지 포설 알고 있는가?',
  'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결 알고 있는가?',
  'CABLE_TRAY_ARRANGEMENT': 'Cable을 Tray에 규격에 맞게 정리 알고 있는가?',
  'CABLE_CUTTING': '설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?',
  'CABLE_RACK_CONNECTION': 'Cable을 Rack에 정확히 연결 알고 있는가?',
  'PUMP_CABLE_TRAY': 'Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?',
  'PUMP_CABLE_ARRANGEMENT': 'Pump단에서 Cable 포설 및 정리 알고 있는가?',
  'CABLE_PM_PUMP_CONNECTION': 'Cable을 구분하여 PM별로 Pump에 정확히 연결 알고 있는가?',
  'GPS_UPS_SPS_UNDERSTANDING': 'GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?',
  'POWER_TURN_ON_SEQUENCE': 'Power turn on 순서를 숙지하고 있는가?',
  'RACK_ELCB_MCB_UNDERSTANDING': 'Rack의 ELCB, MCB 종류와 기능을 숙지하고 있는가?',
  'SAFETY_MODULE_UNDERSTANDING': 'Safety Module의 위치와 기능을 숙지하고 있는가?',
  'EMO_CHECK': 'EMO 동작 Check 알고 있는가?',
  'MODULE_MCB_TURN_ON': 'Module별 MCB 위치를 알고 Turn on 알고 있는가?',
  'SYCON_NUMBER_UNDERSTANDING': 'Sycon number 별 의미하는 Part를 숙지하고 있는가?',
  'SYCON_TROUBLESHOOTING': 'Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?',
  'POWER_TURN_ON_ALARM_TROUBLESHOOTING': 'Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?',
  'CHECKLIST_COMPLETION': '구동 Checklist 작성 가능한가?',
  'IP_ADDRESS_CHANGE': 'ip 주소 변경 방법에 대해 알고 있는가?',
  'UTILITY_TURN_ON_PRECHECK': 'Utility Turn on 전 확인사항을 알고 있는가?',
  'SETUP_INI_MODIFICATION': 'SetUp.ini 파일 수정 하는 방법에 대해 알고 있는가?',
  'UTILITY_TURN_ON_SEQUENCE': 'Utility turn on 의 순서를 숙지하고 있는가?',
  'VACUUM_TURN_ON': 'Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'CDA_TURN_ON': 'CDA Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'PCW_TURN_ON': 'PCW Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'SOLANOID_VALVE_LOCATION': 'Solanoid Valve 위치를 전부 숙지하고 있는가?',
  'RELIEF_VALVE_LOCATION': 'Relief Valve 위치를 전부 숙지하고 있는가?',
  'MANUAL_VALVE_LOCATION': 'Manual Valve 위치를 전부 숙지하고 있는가?',
  'PUMP_TURN_ON': 'PUMP Turn On 알고 있는가?',
  'PURGE_N2_TURN_ON': 'Purge N2, N2 Turn on 및 Spec에 맞게 조정 알고 있는가?',
  'DILLUTION_SIGNAL_CHECK': 'Dillution Signal Check 방법을 알고 있는가?',
  'CHILLER_HEAT_EXCHANGER_TURN_ON': 'Chiller 및 Heat Exchanger Turn On 알고 있는가?',
  'CHILLER_HEAT_EXCHANGER_CHECK': 'Chiller 및 Heat Exchanger Turn on 이후 확인사항을 알고 있는가?',
  'MANOMETER_LIMIT_ADJUST': 'Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?',
  'GAS_TURN_ON_PRECHECK': 'Gas Turn on 전 확인사항 알고 있는가?',
  'NF3_LINE_LEAK_CHECK': 'NF3 Line Leak Check 하는 방법 알고 있는가?',
  'H2_LINE_LEAK_CHECK': 'H2 Line Leak Check 하는 방법 알고 있는가?',
  'NF3_TURN_ON': 'NF3 Turn on 하는 방법 알고 있는가?',
  'H2_TURN_ON': 'H2 Turn on 하는 방법 알고 있는가?',
  'GAS_TURN_ON_CHECK': 'Turn on 이후 확인사항에 대해 알고 있는가?',
  'GAS_TURN_ON_CAUTION': 'Gas Turn on 시 주의사항 알고 있는가?',
  'PM_DILLUTION_TEST': 'PM Dillution Test 하는 방법 알고 있는가?',
  'GAS_TURN_ON_CONFIRM': 'Gas Turn on 및 가스 유입유무를 확인 알고 있는가?',
  'EFEM_ROBOT_PENDANT_CONTROL': 'EFEM Robot Pendant 조작 가능한가?',
  'EFEM_ROBOT_XYZ_VALUES': 'EFEM X,Y,Z,TH 값을 알고 있는가? (SANKYO)',
  'EFEM_ROBOT_PARAMETER_EDIT': 'EFEM Robot Parameter 수정 가능한가? (SANKYO)',
  'EFEM_TEACHING_DATA_SAVE': 'EFEM Teaching Data 저장 가능한가? (SANKYO)',
  'TM_ROBOT_PENDANT_CONTROL': 'TM Robot Pendant 조작 가능한가? (JEL)',
  'TM_ROBOT_LEVELING': 'TM Robot Leveling 가능 한가? (JEL)',
  'TM_ROBOT_XYZ_VALUES': 'TM Robot A,B arm X,Y,TH 값을 알고 있는가? (JEL)',
  'TM_ROBOT_PM_TEACHING': 'TM Robot PM Teaching 가능 한가? (JEL)',
  'TM_ROBOT_AM_TEACHING': 'TM Robot AM Teaching 가능 한가? (JEL)',
  'TM_TEACHING_DATA_SAVE': 'TM Robot Teaching Data 저장 가능한가? (JEL)',
  'WAFER_JIG_USE': 'Teaching Wafer Jig 사용 가능한가?',
  'LASER_JIG_USE': 'Laser Teaching Jig 사용 가능한가?',
  'MARGIN_CHECK': '마진 Check 가능한가?',
  'SEMI_AUTO_TRANSFER': 'Semi Auto Transfer 알고 있는가?',
  'AGING_TEST': 'Aging Test 알고 있는가?',
  'CERAMIC_PLATE_PIN_INSTALLATION': 'Ceramic Plate, Guide Ring, Pin 장착 방법 알고 있는가?',
  'PIN_HEIGHT_ADJUST': 'Pin 장착 및 Pin 높이 조절에 대해 알고 있는가?',
  'PIO_SENSOR_INSTALLATION': 'PIO Sensor 장착 방법 알고 있는가?',
  'VIEW_PORT_COVER_INSTALLATION': 'View Port Cover 장착 방법 알고 있는가?',
  'LOAD_LOCK_LEVELING': 'Load Lock Leveling 방법 알고 있는가?',
  'TM_ROBOT_PICK_INSTALLATION': 'TM Robot Pick 장착 방법 알고 있는가?',
  'TM_ROBOT_PICK_LEVELING': 'TM Robot Pick Leveling 방법 알고 있는가?',
  'GAS_BOX_WINDOW_INSTALLATION': 'Gas Box Window 장착 가능한가?',
  'GAS_BOX_DAMPER_INSTALLATION': 'Gas Box Damper 장착 가능한가?',
  'LINE_MANUAL_LEAK_CHECK': 'Line Manual Leak Check 방법 알고 있는가?',
  'MANUAL_LEAK_CHECK_HISTORY': 'Manual Leak Check History를 확인 할 수 있는가?',
  'HE_DETECTOR_USE': 'He Detector 사용 방법 알고 있는가?',
  'HE_BOTTLE_ORDER': 'He Bottle 쏘는 위치와 순서 알고 있는가?',
  'HE_DETECTOR_HOUSING_LEAK_CHECK': 'He Detector 반응을 보고 Housing Leak와 구별할 수 있는가?',
  'SLOT_VALVE_HE_LEAK_CHECK': 'Slot Valve He Leak Check 방법 알고 있는가?',
  'VAC_CDA_SPEC_ADJUST': 'Vac, CDA Spec에 맞게 조절 가능한가?',
  'TEMP_PROFILE': 'Temp Profile 가능한가?',
  'PUMP_VENT_TIME_ADJUST': 'Pumping / Venting Time 조절 가능한가?',
  'EPD_PEAK_OFFSET_ADJUST': 'EPD Peak, Offset 조절 가능한가?',
  'PM_BAFFLE_TEMP_AUTOTUNE': 'PM Baffle Temp autotune 가능 한가?',
  'DOOR_VALVE_CONTROL': 'Door Valve Open,Close Time 조절 가능 한가?',
  'APC_AUTOLEARN': 'APC Autolearn 가능 한가?',
  'PIN_HEIGHT_ADJUST_B': 'Pin height Adjust 가능 한가?',
  'GAS_SUPPLY_PRESSURE_CHECK': 'Gas Supply Pressure Check 가능 한가?',
  'GAS_EXHAUST_MONAMETER_CONTROL': 'Gas Exhaust Monameter 조작 가능한가?',
  'MFC_HUNTING_CHECK': 'MFC Normal 상태 Hunting 유/무 확인 가능 한가?',
  'LP_FLOW_CONTROL': 'LP 유량 조절 가능한가?',
  'AICP_POWER_CAL': 'AICP Power Cal 가능한가?',
  'PRODUCT_REPORT_COMPLETION': 'Product Report 작성 가능한가?',
  'TTTM_SHEET_COMPLETION': 'TTTM Sheet 작성 가능한가?',
  'LP_CERTIFICATION': 'LP 인증 가능한가?',
  'FULL_PUMPING': 'Full Pumping을 걸 수 있는가?',
  'MID_OPERATION_CERTIFICATION_PREP': '중간가동인증 준비 사항 알고 있는가?',
  'LABEL_PLACEMENT': 'Lavel 붙여야 하는 곳이 어디인지 알고 있는가?',
  'I_MARKING_PROCEDURE': 'I-Marking 방법에 대해 알고 있는가?',
  'I_MARKING_LOCATION': 'I-Marking 하는 곳이 어디인지 알고 있는가?',
  'GAS_BOX_BOARD_LEVELING': '도면을 보고 Gas Box Board Leveling을 할 수 있는가?',
  'ENVIRONMENTAL_QUAL_TEST': '환경 Qual Test 가능한가?',
  'OHT_AUTO_TRANSFER_CERTIFICATION': 'OHT 자동반송 인증 Test 가능한가?',
  'PARTICLE_TEST': 'Particle Test 가능한가?',
  'EA_TEST': 'E/A Test 가능한가?',
};
