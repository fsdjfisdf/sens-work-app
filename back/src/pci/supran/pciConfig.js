// src/pci/supran/pciConfig.js

/** SUPRA N — Transfer 항목별 기준 작업 수 */
exports.BASELINE = {
  // ESCORT
  "LP ESCORT": 3,
  "ROBOT ESCORT": 3,

  // EFEM ROBOT
  "SR8241 TEACHING": 5,
  "SR8240 TEACHING": 5,
  "M124 TEACHING": 5,
  "EFEM FIXTURE": 5,
  "EFEM ROBOT REP": 5,
  "EFEM ROBOT CONTROLLER REP": 5,

  // TM ROBOT
  "SR8250 TEACHING": 5,
  "SR8232 TEACHING": 5,
  "TM FIXTURE": 5,
  "TM ROBOT REP": 5,
  "TM ROBOT CONTROLLER REP": 5,
  "PASSIVE PAD REP": 3,

  // BM MODULE
  "PIN CYLINDER": 3,
  "PUSHER CYLINDER": 1,
  "IB FLOW": 1,
  "DRT": 1,

  // FFU (EFEM, TM)
  "FFU CONTROLLER": 3,
  "FAN": 3,
  "MOTOR DRIVER": 1,

  // FCIP
  "R1": 5, "R3": 5, "R5": 5, "R3 TO R5": 5, "PRISM": 3,

  // MICROWAVE
  "MICROWAVE": 3, "APPLICATOR": 2, "GENERATOR": 2,

  // CHUCK
  "CHUCK": 5,

  // PROCESS KIT
  "PROCESS KIT": 5,

  // LEAK
  "HELIUM DETECTOR": 3,

  // PIN
  "HOOK LIFT PIN": 3, "BELLOWS": 1, "PIN SENSOR": 1, "LM GUIDE": 1, "PIN MOTOR CONTROLLER": 3,

  // EPD
  "SINGLE EPD": 3, "DUAL EPD": 1,

  // BOARD
  "GAS BOX BOARD": 2, "TEMP CONTROLLER BOARD": 2, "POWER DISTRIBUTION BOARD": 2, "DC POWER SUPPLY": 2,
  "BM SENSOR": 1, "PIO SENSOR": 1, "SAFETY MODULE": 1, "IO BOX": 3, "FPS BOARD": 1, "D-NET": 2,

  // IGS BLOCK
  "MFC": 2, "VALVE": 2,

  // VALVE
  "SOLENOID": 2, "FAST VAC VALVE": 2, "SLOW VAC VALVE": 2,
  "SLIT DOOR": 3, "APC VALVE": 3, "SHUTOFF VALVE": 3,

  // ETC
  "BARATRON ASS'Y": 1, "PIRANI ASS'Y": 1, "VIEW PORT QUARTZ": 1, "FLOW SWITCH": 1,
  "CERAMIC PLATE": 3, "MONITOR": 1, "KEYBOARD": 1, "MOUSE": 1,
  "HEATING JACKET": 1, "WATER LEAK DETECTOR": 1, "MANOMETER": 1,

  // CTR
  "CTC": 2, "PMC": 2, "EDA": 2, "EFEM CONTROLLER": 2, "TEMP LIMIT CONTROLLER": 3, "TEMP CONTROLLER": 3,

  // S/W
  "S/W PATCH": 2,
};

/** 인정 장비 타입 (현장 카운트 포함 기준) */
exports.ALLOWED_EQUIP_TYPES = [
  "SUPRA N", "SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM", "SUPRA Q"
];

/** 소문자/공백/기호 차이 흡수용 캐논 */
const strip = s => (s ?? "").toString().trim();
const upper = s => strip(s).toUpperCase();
const canon = s => upper(s)
  .replace(/ASS'Y/g, "ASSY")
  .replace(/-/g, " ")
  .replace(/[^\w ]/g, "")
  .replace(/\s+/g, " ");

exports.canon = canon;

/** transfer_item → self-check 컬럼명 규칙 */
exports.toSelfCol = item =>
  upper(item)
    .replace(/ASS'Y/g, "ASSY")
    .replace(/-/g, " ")
    .replace(/[^\w ]/g, "")
    .replace(/\s+/g, "_");

/** 동의어/오탈자 보정 맵 */
const ALIASES = {
  "EFEM ROBOT CONTROLLER": "EFEM ROBOT CONTROLLER REP", // 로그 ↔ Self 불일치 보정
  "D NET": "D-NET",
  "POWER DISTRIBUTION BOARD": "POWER DISTRIBUTION BOARD", // 안전 유지
};

exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const viaAlias = ALIASES[strip(raw)] || raw;
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find(k => canon(k) === canon(viaAlias));
  return hit || strip(raw); // 기준에 없으면 원문 유지 (계산 시 스킵)
};

/** 작업자 별칭(동일인 취급) — (main)/(support), A/B 표기 통합 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};
