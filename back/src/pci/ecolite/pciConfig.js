// src/pci/ecolite/pciConfig.js

/** ECOLITE — 항목별 기준 작업 수 */
exports.BASELINE = {
  // Escort
  "LP ESCORT": 1,
  "ROBOT ESCORT": 1,

  // EFEM Robot
  "SR8240 TEACHING": 5,
  "M124V TEACHING": 5,
  "M124C TEACHING": 5,
  "EFEM ROBOT REP": 5,
  "EFEM ROBOT CONTROLLER REP": 5,

  // TM Robot
  "SR8250 TEACHING": 5,
  "SR8232 TEACHING": 5,
  "TM ROBOT REP": 5,
  "TM ROBOT CONTROLLER REP": 5,

  // BM Module
  "PIN CYLINDER": 5,
  "PUSHER CYLINDER": 5,
  "DRT": 5,

  // FFU (EFEM, TM)
  "FFU CONTROLLER": 3,
  "FAN": 3,
  "MOTOR DRIVER": 3,

  // Microwave
  "MICROWAVE": 1,
  "APPLICATOR": 3,
  "APPLICATOR TUBE": 3,
  "MICROWAVE GENERATOR": 3,

  // RF bias
  "MATCHER": 3,
  "RF GENERATOR": 3,

  // Chuck
  "CHUCK": 3,

  // Process Kit
  "TOPLID PROCESS KIT": 1,
  "CHAMBER PROCESS KIT": 5,

  // Leak
  "HELIUM DETECTOR": 5,

  // Pin
  "HOOK LIFT PIN": 3,
  "BELLOWS": 3,
  "PIN SENSOR": 3,
  "LM GUIDE": 3,
  "HOOK LIFTER SERVO MOTOR": 3,
  "PIN MOTOR CONTROLLER": 3,

  // EPD
  "SINGLE": 1,

  // Board
  "GAS BOX BOARD": 1,
  "POWER DISTRIBUTION BOARD": 1,
  "DC POWER SUPPLY": 1,
  "BM SENSOR": 1,
  "PIO SENSOR": 1,
  "SAFETY MODULE": 1,
  "IO BOX": 5,
  "RACK BOARD": 1,
  "D-NET": 1,

  // IGS Block
  "MFC": 1,
  "VALVE": 1,

  // Valve
  "SOLENOID": 1,
  "FAST VAC VALVE": 1,
  "SLOW VAC VALVE": 1,
  "SLIT DOOR": 1,
  "APC VALVE": 1,
  "SHUTOFF VALVE": 1,

  // ETC
  "BARATRON ASS'Y": 1,
  "PIRANI ASS'Y": 1,
  "VIEW PORT QUARTZ": 1,
  "FLOW SWITCH": 1,
  "MONITOR": 1,
  "KEYBOARD": 1,
  "MOUSE": 1,
  "WATER LEAK DETECTOR": 1,
  "MANOMETER": 1,
  "LIGHT CURTAIN": 1,
  "GAS SPRING": 1,

  // CTR
  "CTC": 3,
  "PMC": 3,
  "EDA": 3,
  "EFEM CONTROLLER": 3,

  // S/W
  "S/W PATCH": 1,
};

/** 인정 설비 타입 */
exports.ALLOWED_EQUIP_TYPES = [
  "ECOLITE 300", "ECOLITE 400", "ECOLITE 3000", "ECOLITE XP"
];

/** 공백/기호/대소문자 흡수용 */
const strip = s => (s ?? "").toString().trim();
const upper = s => strip(s).toUpperCase();
const canon = s => upper(s)
  .replace(/ASS'Y/g, "ASSY")
  .replace(/-/g, " ")
  .replace(/[^\w ]/g, "")
  .replace(/\s+/g, " ");
exports.canon = canon;

/** 동의어/표기 보정 */
const ALIASES = {
  "LP ESCORT": "LP ESCORT",
  "ROBOT ESCORT": "ROBOT ESCORT",

  "SR8240 TEACHING": "SR8240 TEACHING",
  "M124V TEACHING": "M124V TEACHING",
  "M124C TEACHING": "M124C TEACHING",

  "EFEM ROBOT REP": "EFEM ROBOT REP",
  "EFEM ROBOT CONTROLLER REP": "EFEM ROBOT CONTROLLER REP",
  "TM ROBOT REP": "TM ROBOT REP",
  "TM ROBOT CONTROLLER REP": "TM ROBOT CONTROLLER REP",

  "MICROWAVE GENERATOR": "MICROWAVE GENERATOR",
  "RF GENERATOR": "RF GENERATOR",

  "TOPLID PROCESS KIT": "TOPLID PROCESS KIT",
  "CHAMBER PROCESS KIT": "CHAMBER PROCESS KIT",

  "BARATRON ASSY": "BARATRON ASS'Y",
  "PIRANI ASSY": "PIRANI ASS'Y",
  "D NET": "D-NET",
};

exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const viaAlias = ALIASES[upper(strip(raw))] || raw;
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find(k => canon(k) === canon(viaAlias));
  return hit || strip(raw); // 기준에 없으면 원문 유지(계산 시 스킵)
};

/** 자가체크 컬럼 매핑(정확 매칭을 위해 명시 사전 사용) */
const SELF_COL_MAP_RAW = {
  // Escort
  "LP ESCORT": "LP_Escort",
  "ROBOT ESCORT": "Robot_Escort",

  // EFEM Robot
  "SR8240 TEACHING": "SR8240_Teaching",
  "M124V TEACHING": "M124V_Teaching",
  "M124C TEACHING": "M124C_Teaching",
  "EFEM ROBOT REP": "EFEM_Robot_REP",
  "EFEM ROBOT CONTROLLER REP": "EFEM_Robot_Controller_REP",

  // TM Robot
  "SR8250 TEACHING": "SR8250_Teaching",
  "SR8232 TEACHING": "SR8232_Teaching",
  "TM ROBOT REP": "TM_Robot_REP",
  "TM ROBOT CONTROLLER REP": "TM_Robot_Controller_REP",

  // BM Module
  "PIN CYLINDER": "Pin_Cylinder",
  "PUSHER CYLINDER": "Pusher_Cylinder",
  "DRT": "DRT",

  // FFU
  "FFU CONTROLLER": "FFU_Controller",
  "FAN": "FFU_Fan",
  "MOTOR DRIVER": "FFU_Motor_Driver",

  // Microwave
  "MICROWAVE": "Microwave",
  "APPLICATOR": "Applicator",
  "APPLICATOR TUBE": "Applicator_Tube",
  "MICROWAVE GENERATOR": "Microwave_Generator",

  // RF bias
  "MATCHER": "RF_Matcher",
  "RF GENERATOR": "RF_Generator",

  // Chuck
  "CHUCK": "Chuck",

  // Process Kit
  "TOPLID PROCESS KIT": "Toplid_Process_Kit",
  "CHAMBER PROCESS KIT": "Chamber_Process_Kit",

  // Leak
  "HELIUM DETECTOR": "Helium_Detector",

  // Pin
  "HOOK LIFT PIN": "Hook_Lift_Pin",
  "BELLOWS": "Pin_Bellows",
  "PIN SENSOR": "Pin_Sensor",
  "LM GUIDE": "LM_Guide",
  "HOOK LIFTER SERVO MOTOR": "HOOK_LIFTER_SERVO_MOTOR",
  "PIN MOTOR CONTROLLER": "Pin_Motor_Controller",

  // EPD
  "SINGLE": "EPD_Single",

  // Board
  "GAS BOX BOARD": "Gas_Box_Board",
  "POWER DISTRIBUTION BOARD": "Power_Distribution_Board",
  "DC POWER SUPPLY": "DC_Power_Supply",
  "BM SENSOR": "BM_Sensor",
  "PIO SENSOR": "PIO_Sensor",
  "SAFETY MODULE": "Safety_Module",
  "IO BOX": "IO_BOX",
  "RACK BOARD": "Rack_Board",
  "D-NET": "D_NET",

  // IGS Block
  "MFC": "IGS_MFC",
  "VALVE": "IGS_Valve",

  // Valve
  "SOLENOID": "Solenoid",
  "FAST VAC VALVE": "Fast_Vac_Valve",
  "SLOW VAC VALVE": "Slow_Vac_Valve",
  "SLIT DOOR": "Slit_Door",
  "APC VALVE": "APC_Valve",
  "SHUTOFF VALVE": "Shutoff_Valve",

  // ETC
  "BARATRON ASS'Y": "Baratron_ASSY",
  "PIRANI ASS'Y": "Pirani_ASSY",
  "VIEW PORT QUARTZ": "View_Port_Quartz",
  "FLOW SWITCH": "Flow_Switch",
  "MONITOR": "Monitor",
  "KEYBOARD": "Keyboard",
  "MOUSE": "Mouse",
  "WATER LEAK DETECTOR": "Water_Leak_Detector",
  "MANOMETER": "Manometer",
  "LIGHT CURTAIN": "LIGHT_CURTAIN",
  "GAS SPRING": "GAS_SPRING",

  // CTR
  "CTC": "CTC",
  "PMC": "PMC",
  "EDA": "EDA",
  "EFEM CONTROLLER": "EFEM_CONTROLLER",

  // S/W
  "S/W PATCH": "SW_Patch",
};

// canon 키로 바꿔 lookup 안전성 확보
const SELF_COL_MAP = {};
for (const k of Object.keys(SELF_COL_MAP_RAW)) {
  SELF_COL_MAP[canon(k)] = SELF_COL_MAP_RAW[k];
}
exports.toSelfCol = (item) => SELF_COL_MAP[canon(item)] || null;

/** 작업자 별칭(동일인 취급) — (main)/(support) 등 제거 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};
