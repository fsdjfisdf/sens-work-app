// src/pci/precia_setup/pciConfig.js

/** ====== 카테고리 기준 작업수 (work 80%의 분모) ====== */
exports.CATEGORY_BASELINE = {
  INSTALLATION_PREPARATION: 5,
  FAB_IN: 5,
  DOCKING: 10,
  CABLE_HOOK_UP: 10,
  POWER_TURN_ON: 10,
  UTILITY_TURN_ON: 2.5,
  GAS_TURN_ON: 2.5,
  TEACHING: 30,
  PART_INSTALLATION: 2.5,
  LEAK_CHECK: 2.5,
  TTTM: 10,
  CUSTOMER_CERTIFICATION: 5,
  PROCESS_CONFIRM: 5,
};

/** ====== 셀프 체크 세부 항목(카테고리 → 세부키 배열) ====== */
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

/** ====== 자가 20% 분배 가중치(합 100) ====== */
exports.CATEGORY_WEIGHTS = {
  'INSTALLATION PREPARATION': 5,
  'FAB IN': 5,
  'DOCKING': 10,
  'CABLE HOOK UP': 10,
  'POWER TURN ON': 10,
  'UTILITY TURN ON': 2.5,
  'GAS TURN ON': 2.5,
  'TEACHING': 30,
  'PART INSTALLATION': 2.5,
  'LEAK CHECK': 2.5,
  'TTTM': 10,
  'CUSTOMER CERTIFICATION': 5,
  'PROCESS CONFIRM': 5,
};

exports.ALLOWED_EQUIP_TYPES = ["PRECIA", "Precia", "precia"];

/* ====== 유틸 ====== */
const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();
const canon = (s) =>
  upper(s)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

exports.strip = strip;
exports.upper = upper;
exports.canon = canon;

/** 카테고리 표기 정규화 (공백/언더바/철자 오탈자 보정) */
const CAT_ALIASES = {
  "INSTALLATION PREPERATION": "INSTALLATION_PREPARATION", // COUNT 테이블 오탈자 보정
  "INSTALLATION PREPARATION": "INSTALLATION_PREPARATION",
  "CABLE HOOK UP": "CABLE_HOOK_UP",
  "POWER TURN ON": "POWER_TURN_ON",
  "UTILITY TURN ON": "UTILITY_TURN_ON",
  "GAS TURN ON": "GAS_TURN_ON",
  "PART INSTALLATION": "PART_INSTALLATION",
  "LEAK CHECK": "LEAK_CHECK",
  "CUSTOMER CERTIFICATION": "CUSTOMER_CERTIFICATION",
  "PROCESS CONFIRM": "PROCESS_CONFIRM",
  "FAB IN": "FAB_IN",
};
exports.normalizeCategory = (raw) => {
  if (!raw) return "";
  const u = upper(raw).replace(/\s+/g, " ").trim();
  const viaAlias = CAT_ALIASES[u] || u.replace(/ /g, "_");
  const keys = Object.keys(exports.CATEGORY_BASELINE);
  // 최종 Canon 매칭
  const hit = keys.find((k) => canon(k) === canon(viaAlias));
  return hit || viaAlias;
};

/** 셀프체크 컬럼명 그대로 사용(이미 DB가 대문자+언더바) — 방어용 클리너만 */
exports.toSelfCol = (s) => upper(s).replace(/[^\p{L}\p{N}_]/gu, "");

/** 작업자 별칭: (main)/(support) 등 괄호 제거 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};

/** 세부 항목 → 카테고리 역매핑 */
const ITEM_TO_CATEGORY = (() => {
  const map = {};
  for (const [cat, items] of Object.entries(exports.CATEGORY_ITEMS)) {
    for (const it of items) map[upper(it)] = cat;
  }
  return map;
})();
exports.itemToCategory = (raw) => {
  if (!raw) return "";
  const u = upper(raw);
  if (ITEM_TO_CATEGORY[u]) return ITEM_TO_CATEGORY[u];
  // 혹시 카테고리 명이 바로 들어온 경우
  return exports.normalizeCategory(u);
};

/** 카테고리 표시용(언더바 → 공백) */
exports.prettyCat = (cat) => upper(cat).replace(/_/g, " ");
