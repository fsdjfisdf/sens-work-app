// src/pci/geneva/pciConfig.js

/** GENEVA — 항목별 기준 작업 수 */
exports.BASELINE = {
  // Escort
  "LP ESCORT": 1,
  "ROBOT ESCORT": 1,

  // EFEM Robot
  "SR8240 TEACHING": 3,
  "GENMARK ROBOT TEACHING": 3,
  "SR8240 ROBOT REP": 3,
  "GENMARK ROBOT REP": 3,
  "ROBOT CONTROLLER REP": 3,

  // FFU
  "FFU CONTROLLER": 3,
  "FAN": 3,
  "MOTOR DRIVER": 3,

  // Heater
  "ELBOW HEATER": 3,
  "INSULATION HEATER": 3,
  "CHUCK HEATER": 3,

  // Disc
  "HARMONIC DRIVER": 3,
  "AMPLIFIER": 3,            // (Disc controller)
  "DISC BEARING": 3,

  // PM 후
  "CHUCK LEVELING": 3,
  "WAFER SUPPORT PIN ALIGNMENT": 3,
  "TEMP PROFILE": 3,
  "O2 LEAK TEST": 3,
  "CHUCK UP & DOWN STATUS": 3,

  // Sealing
  "RING SEAL": 3,
  "DOOR SEAL": 3,

  // LL O-ring
  "RING SEAL ORING": 3,
  "DOOR SEAL ORING": 3,

  // Board
  "GAS BOX BOARD": 1,
  "TEMP CONTROLLER BOARD": 1,
  "POWER DISTRIBUTION BOARD": 1,
  "DC POWER SUPPLY": 1,
  "FACILITY BOARD": 1,
  "STATION BOARD": 1,
  "BUBBLER BOARD": 1,
  "D-NET": 1,

  // Gas box
  "MFC": 3,
  "VALVE": 3,

  // O2 analyzer
  "O2 ANALYZER": 3,
  "O2 CONTROLLER": 3,
  "O2 PUMP": 3,
  "O2 CELL": 3,

  // Valve
  "O2 SAMPLE VALVE": 3,
  "FEED & DELIVERY VALVE": 3,
  "FILL & VENT VALVE": 3,
  "DRAIN VALVE": 3,
  "APC VALVE": 3,
  "BYPASS VALVE": 3,
  "SHUTOFF VALVE": 3,
  "VAC SOL VALVE": 3,
  "VAC CDA VALVE": 3,

  // Bubbler
  "BUBBLER LEVEL SENSOR": 1,
  "BUBBLER FLEXIBLE HOSE": 1,

  // ETC
  "BARATRON ASSY": 1,
  "VIEW PORT": 1,
  "FLOW SWITCH": 3,
  "LL DOOR CYLINDER": 3,
  "CHUCK CYLINDER": 3,
  "MONITOR": 1,
  "KEYBOARD": 1,
  "MOUSE": 1,
  "WATER LEAK DETECTOR": 3,
  "FORMIC DETECTOR": 3,
  "EXHAUST GAUGE": 3,

  // CTR
  "CTC": 3,
  "EDA": 1,
  "TEMP LIMIT CONTROLLER": 3,
  "TEMP CONTROLLER": 3,

  // S/W
  "S/W PATCH": 3,
};

/** 인정 장비 타입 */
exports.ALLOWED_EQUIP_TYPES = ["GENEVA"];

/** 캐논 함수(비교용): 대소문자/기호/공백 정규화 */
const strip = s => (s ?? "").toString().trim();
const upper = s => strip(s).toUpperCase();
const canon = s => upper(s)
  .replace(/ASS'Y/g, "ASSY")
  .replace(/-/g, " ")
  .replace(/[^\w ]/g, "")
  .replace(/\s+/g, " ");
exports.canon = canon;

/** DB Self 테이블 컬럼 매핑 (정확 매칭 필요) */
const SELF_COLS = {
  // Escort
  "LP ESCORT": "LP_Escort",
  "ROBOT ESCORT": "Robot_Escort",

  // EFEM Robot
  "SR8240 TEACHING": "SR8240_Teaching",
  "GENMARK ROBOT TEACHING": "GENMARK_Robot_Teaching",
  "SR8240 ROBOT REP": "SR8240_Robot_REP",
  "GENMARK ROBOT REP": "GENMARK_Robot_REP",
  "ROBOT CONTROLLER REP": "Robot_Controller_REP",

  // FFU
  "FFU CONTROLLER": "FFU_Controller",
  "FAN": "Fan",
  "MOTOR DRIVER": "Motor_Driver",

  // Heater
  "ELBOW HEATER": "Elbow_Heater",
  "INSULATION HEATER": "Insulation_Heater",
  "CHUCK HEATER": "Chuck_Heater",

  // Disc
  "HARMONIC DRIVER": "Harmonic_Driver",
  "AMPLIFIER": "Amplifier",
  "DISC BEARING": "Disc_Bearing",

  // PM 후
  "CHUCK LEVELING": "Chuck_Leveling",
  "WAFER SUPPORT PIN ALIGNMENT": "Wafer_Support_Pin_Alignment",
  "TEMP PROFILE": "Temp_Profile",
  "O2 LEAK TEST": "O2_Leak_Test",
  "CHUCK UP & DOWN STATUS": "Chuck_Up_Down_Status",

  // Sealing
  "RING SEAL": "Ring_Seal",
  "DOOR SEAL": "Door_Seal",

  // LL O-ring
  "RING SEAL ORING": "Ring_seal_Oring",
  "DOOR SEAL ORING": "Door_seal_Oring",

  // Board
  "GAS BOX BOARD": "Gas_Box_Board",
  "TEMP CONTROLLER BOARD": "Temp_Controller_Board",
  "POWER DISTRIBUTION BOARD": "Power_Distribution_Board",
  "DC POWER SUPPLY": "DC_Power_Supply",
  "FACILITY BOARD": "Facility_Board",
  "STATION BOARD": "Station_Board",
  "BUBBLER BOARD": "Bubbler_Board",
  "D-NET": "D_NET",

  // Gas box
  "MFC": "MFC",
  "VALVE": "Valve",

  // O2 analyzer
  "O2 ANALYZER": "O2_Analyzer",
  "O2 CONTROLLER": "O2_Controller",
  "O2 PUMP": "O2_Pump",
  "O2 CELL": "O2_Cell",

  // Valve
  "O2 SAMPLE VALVE": "O2_Sample_Valve",
  "FEED & DELIVERY VALVE": "Feed_Delivery_Valve",
  "FILL & VENT VALVE": "Fill_Vent_Valve",
  "DRAIN VALVE": "Drain_Valve",
  "APC VALVE": "APC_Valve",
  "BYPASS VALVE": "Bypass_Valve",
  "SHUTOFF VALVE": "Shutoff_Valve",
  "VAC SOL VALVE": "Vac_Sol_Valve",
  "VAC CDA VALVE": "Vac_CDA_Valve",

  // Bubbler
  "BUBBLER LEVEL SENSOR": "Bubbler_Level_Sensor",
  "BUBBLER FLEXIBLE HOSE": "Bubbler_Flexible_Hose",

  // ETC
  "BARATRON ASSY": "Baratron_Assy",
  "VIEW PORT": "View_Port",
  "FLOW SWITCH": "Flow_Switch",
  "LL DOOR CYLINDER": "LL_Door_Cylinder",
  "CHUCK CYLINDER": "Chuck_Cylinder",
  "MONITOR": "Monitor",
  "KEYBOARD": "Keyboard",
  "MOUSE": "Mouse",
  "WATER LEAK DETECTOR": "Water_Leak_Detector",
  "FORMIC DETECTOR": "Formic_Detector",
  "EXHAUST GAUGE": "Exhaust_Gauge",

  // CTR
  "CTC": "CTC",
  "EDA": "EDA",
  "TEMP LIMIT CONTROLLER": "Temp_Limit_Controller",
  "TEMP CONTROLLER": "Temp_Controller",

  // S/W
  "S/W PATCH": "SW_Patch",
};

/** 동의어/오탈자 보정 */
const ALIASES = {
  "BARATRON ASS'Y": "BARATRON ASSY",
  "D NET": "D-NET",
  "VAC SOL VALVE": "VAC SOL VALVE",
  "VAC CDA VALVE": "VAC CDA VALVE",
};
exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const via = ALIASES[strip(raw)] || raw;
  const baseKeys = Object.keys(exports.BASELINE);
  const hit = baseKeys.find(k => canon(k) === canon(via));
  return hit || strip(raw);
};

/** transfer_item → self-check 컬럼명 */
exports.toSelfCol = (item) => {
  const key = exports.normalizeItem(item);
  return SELF_COLS[key] || null; // null이면 self 20% 미부여
};

/** 작업자 별칭(동일인 취급) — (main)/(support), A/B 표기 제거 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};
