// src/pci/supraxp/pciConfig.js

/** SUPRA XP — 항목별 기준 작업 수 (요청 사양 반영) */
exports.BASELINE = {
  // Escort
  "LP ESCORT": 3,
  "ROBOT ESCORT": 3,

  // EFEM Robot
  "SR8241 TEACHING": 15,
  "ROBOT REP": 15,
  "ROBOT CONTROLLER REP": 15,
  "END EFFECTOR REP": 10,

  // TM Robot
  "PERSIMMON TEACHING": 15,
  "END EFFECTOR PAD REP": 10,

  // L/L
  "L L PIN": 5,
  "L L SENSOR": 5,
  "L L DSA": 5,
  "GAS LINE": 5,
  "L L ISOLATION VV": 5,

  // EFEM FFU
  "FFU CONTROLLER": 3,
  "FAN": 3,
  "MOTOR DRIVER": 1,

  // SOURCE
  "MATCHER": 5,
  "3000QC": 5,
  "3100QC": 5,

  // Chuck
  "CHUCK": 5,

  // Preventive Maintenance
  "PROCESS KIT": 5,
  "SLOT VALVE BLADE": 3,
  "TEFLON ALIGN PIN": 3,
  "O RING": 3,

  // Leak
  "HELIUM DETECTOR": 3,

  // Pin
  "HOOK LIFT PIN": 3,
  "BELLOWS": 1,
  "PIN BOARD": 1,
  "LM GUIDE": 1,
  "PIN MOTOR CONTROLLER": 3,
  "LASER PIN SENSOR": 1,

  // EPD
  "DUAL": 1,

  // Board
  "DC POWER SUPPLY": 2,
  "PIO SENSOR": 1,
  "D NET": 2,
  "SIM BOARD": 2,

  // IGS Block
  "MFC": 2,
  "VALVE": 2,

  // Valve
  "SOLENOID": 2,
  "PENDULUM VALVE": 2,
  "SLOT VALVE DOOR VALVE": 3,
  "SHUTOFF VALVE": 3,

  // Rack
  "RF GENERATOR": 3,

  // ETC
  "BARATRON ASSY": 1,
  "PIRANI ASSY": 1,
  "VIEW PORT QUARTZ": 1,
  "FLOW SWITCH": 1,
  "CERAMIC PLATE": 3,
  "MONITOR": 1,
  "KEYBOARD": 1,
  "SIDE STORAGE": 5,
  "MULTI PORT 32": 3,
  "MINI8": 3,
  "TM EPC MFC": 3,

  // CTR
  "CTC": 2,
  "EFEM CONTROLLER": 2,

  // S/W
  "SW PATCH": 2,
};

/** 인정 장비 타입 (SUPRA XP 계열) */
exports.ALLOWED_EQUIP_TYPES = ["SUPRA XP", "SUPRA XQ"];

/** 문자열 정규화 유틸 */
const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();
const canon = (s) =>
  upper(s)
    .replace(/ASS'Y/g, "ASSY")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\./g, "")
    .replace(/[^\w ㄱ-힣\[\]]/g, "") // 한글/대괄호 유지
    .replace(/\s+/g, " ");
exports.canon = canon;

/** Self 테이블 컬럼 매핑(SUPRA_XP_MAINT_SELF): 표시명 → 실제 컬럼명 */
const SELF_COL_MAP = {
  "LP ESCORT": "LP_ESCORT",
  "ROBOT ESCORT": "ROBOT_ESCORT",

  "SR8241 TEACHING": "SR8241_TEACHING",
  "ROBOT REP": "ROBOT_REP",
  "ROBOT CONTROLLER REP": "ROBOT_CONTROLLER_REP",
  "END EFFECTOR REP": "END_EFFECTOR_REP",

  "PERSIMMON TEACHING": "PERSIMMON_TEACHING",
  "END EFFECTOR PAD REP": "END_EFFECTOR_PAD_REP",

  "L L PIN": "L_L_PIN",
  "L L SENSOR": "L_L_SENSOR",
  "L L DSA": "L_L_DSA",
  "GAS LINE": "GAS_LINE",
  "L L ISOLATION VV": "L_L_ISOLATION_VV",

  "FFU CONTROLLER": "FFU_CONTROLLER",
  "FAN": "FAN",
  "MOTOR DRIVER": "MOTOR_DRIVER",

  "MATCHER": "MATCHER",
  "3000QC": "3000QC",
  "3100QC": "3100QC",

  "CHUCK": "CHUCK",

  "PROCESS KIT": "PROCESS_KIT",
  "SLOT VALVE BLADE": "SLOT_VALVE_BLADE",
  "TEFLON ALIGN PIN": "TEFLON_ALIGN_PIN",
  "O RING": "O_RING",

  "HELIUM DETECTOR": "HELIUM_DETECTOR",

  "HOOK LIFT PIN": "HOOK_LIFT_PIN",
  "BELLOWS": "BELLOWS",
  "PIN BOARD": "PIN_BOARD",
  "LM GUIDE": "LM_GUIDE",
  "PIN MOTOR CONTROLLER": "PIN_MOTOR_CONTROLLER",
  "LASER PIN SENSOR": "LASER_PIN_SENSOR",

  "DUAL": "DUAL",

  "DC POWER SUPPLY": "DC_POWER_SUPPLY",
  "PIO SENSOR": "PIO_SENSOR",
  "D NET": "D_NET",
  "SIM BOARD": "SIM_BOARD",

  "MFC": "MFC",
  "VALVE": "VALVE",

  "SOLENOID": "SOLENOID",
  "PENDULUM VALVE": "PENDULUM_VALVE",
  "SLOT VALVE DOOR VALVE": "SLOT_VALVE_DOOR_VALVE",
  "SHUTOFF VALVE": "SHUTOFF_VALVE",

  "RF GENERATOR": "RF_GENERATOR",

  "BARATRON ASSY": "BARATRON_ASSY",
  "PIRANI ASSY": "PIRANI_ASSY",
  "VIEW PORT QUARTZ": "VIEW_PORT_QUARTZ",
  "FLOW SWITCH": "FLOW_SWITCH",
  "CERAMIC PLATE": "CERAMIC_PLATE",
  "MONITOR": "MONITOR",
  "KEYBOARD": "KEYBOARD",
  "SIDE STORAGE": "SIDE_STORAGE",
  "MULTI PORT 32": "MULTI_PORT_32",
  "MINI8": "MINI8",
  "TM EPC MFC": "TM_EPC_MFC",

  "CTC": "CTC",
  "EFEM CONTROLLER": "EFEM_CONTROLLER",

  "SW PATCH": "SW_PATCH",
};

/** 로그/표기 동의어 보정 */
const ALIASES = {
  "D-NET": "D NET",
  "D_NET": "D NET",
  "BARATRON ASS'Y": "BARATRON ASSY",
  "PIRANI ASS'Y": "PIRANI ASSY",
  "L/L PIN": "L L PIN",
  "L/L SENSOR": "L L SENSOR",
  "L/L DSA": "L L DSA",
  "ISOLATION VV": "L L ISOLATION VV",
  "VAC LINE": "GAS LINE",
  "VACUUM LINE": "GAS LINE",
  "RF GEN": "RF GENERATOR",
  "SW PATCH": "SW PATCH",
  "MULTI PORT32": "MULTI PORT 32",
  "MULTIPORT 32": "MULTI PORT 32",
  "SR 8241 TEACHING": "SR8241 TEACHING",
};

exports.toSelfCol = (item) => SELF_COL_MAP[item] || null;

exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const s = strip(raw);
  const viaAlias = ALIASES[s] || s;
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find((k) => canon(k) === canon(viaAlias));
  return hit || strip(raw); // 기준에 없으면 스킵 대상(원문 유지)
};

/** 작업자 별칭(동일인 취급) — 괄호표기 제거 등 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};
