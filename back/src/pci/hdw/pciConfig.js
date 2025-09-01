// src/pci/hdw/pciConfig.js

/** HDW — 항목별 기준 작업수 (Baseline) */
exports.BASELINE = {
  // 전장부
  "OD REP": 3,
  "RELAY REP": 1,
  "FAN REP": 1,
  "NTC / NTU REP": 1,
  "SSR REP": 3,
  "MC REP": 1,
  "FUSE REP": 1,
  "CT REP": 3,
  "HBD REP": 1,
  "SMPS REP": 1,
  "PLC (main unit 제외) REP": 3,
  "ELB REP": 1,

  // 배관부
  "HEATER REP (HALOGEN LAMP)": 3,
  "Q'TZ TANK REP": 3,
  "LEAK TROUBLESHOOTING": 1,
  "FLOW METER REP": 1,
  "AIR VALVE REP": 3,
  "SHUT OFF VALVE REP": 3,
  "SOL VALVE REP": 1,
  "ELBOW FITTING REP (QTZ)": 3,
  "LEAK TRAY": 1,
  "TC SENSOR": 1,

  // SW
  "TOUCH PANEL PATCH": 3,
  "PLC PATCH": 3,
  "TOUCH PANEL REP": 1,
  "PLC REP": 1,
};

/** 인정 장비 타입 */
exports.ALLOWED_EQUIP_TYPES = ["hdw", "HDW"];

/** 공통 유틸 */
const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();

/** Canonicalizer (로그 ↔ 기준명 매칭)
 * - 대소문자/공백/특수기호 차이를 흡수
 * - '_', '&', '/'는 공백 취급, 괄호 등 나머지는 제거
 */
const canon = (s) =>
  upper(s)
    .replace(/ASS'Y/g, "ASSY")
    .replace(/[_/&-]/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")   // 한글/영문/숫자/공백만
    .replace(/\s+/g, " ")
    .trim();
exports.canon = canon;

/** 동의어/오탈자 보정 (로그 다양성 흡수) */
const ALIASES = {
  "HEATER REP (HALOGEN LAMP)": "HEATER REP (HALOGEN LAMP)",
  "HEATER REP": "HEATER REP (HALOGEN LAMP)",
  "Q'TZ TANK REP": "Q'TZ TANK REP",
  "QTZ TANK REP": "Q'TZ TANK REP",
  "QTZ TANK": "Q'TZ TANK REP",
  "ELBOW FITTING REP (QTZ)": "ELBOW FITTING REP (QTZ)",
  "ELBOW FITTING REP": "ELBOW FITTING REP (QTZ)",
  "LEAK TROUBLE SHOOTING": "LEAK TROUBLESHOOTING",
  "SHUTOFF VALVE REP": "SHUT OFF VALVE REP",
  "SOLENOID VALVE REP": "SOL VALVE REP",
  "TOUCH PANEL PATCH": "TOUCH PANEL PATCH",
  "TOUCH PANEL REPAIR": "TOUCH PANEL REP",
  "PLC REPAIR": "PLC REP",
  "PLC MAIN 제외 REP": "PLC (main unit 제외) REP",
};

/** 항목명 정규화 (기준표 키로 귀결) */
exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const first = strip(raw);
  // 1) 우선 별칭 테이블 적용
  const viaAlias = ALIASES[upper(first)] || first;

  // 2) Canon 동치로 기준표 키 탐색
  const keys = Object.keys(exports.BASELINE);
  const viaCanon = canon(viaAlias);
  const hit = keys.find((k) => canon(k) === viaCanon);
  return hit || viaAlias; // 기준표에 없으면 원문 유지(계산 시 스킵)
};

/** Self-check 컬럼 고정 매핑 (DB 스키마와 1:1) */
const SELF_COLS = {
  // 전장부
  "OD REP": "OD_REP",
  "RELAY REP": "Relay_REP",
  "FAN REP": "Fan_REP",
  "NTC / NTU REP": "NTC_NTU_REP",
  "SSR REP": "SSR_REP",
  "MC REP": "MC_REP",
  "FUSE REP": "Fuse_REP",
  "CT REP": "CT_REP",
  "HBD REP": "HBD_REP",
  "SMPS REP": "SMPS_REP",
  "PLC (main unit 제외) REP": "PLC_REP",
  "ELB REP": "ELB_REP",

  // 배관부
  "HEATER REP (HALOGEN LAMP)": "Heater_REP",
  "Q'TZ TANK REP": "Qtz_tank_REP",
  "LEAK TROUBLESHOOTING": "Leak_troubleshooting",
  "FLOW METER REP": "Flow_meter_REP",
  "AIR VALVE REP": "Air_valve_REP",
  "SHUT OFF VALVE REP": "Shut_off_valve_REP",
  "SOL VALVE REP": "Sol_valve_REP",
  "ELBOW FITTING REP (QTZ)": "Elbow_fitting_REP",
  "LEAK TRAY": "Leak_tray",
  "TC SENSOR": "TC_Sensor",

  // SW
  "TOUCH PANEL PATCH": "Touch_panel_patch",
  "PLC PATCH": "PLC_patch",
  "TOUCH PANEL REP": "Touch_panel_REP",
  // ⚠️ SW의 PLC REP은 전장부의 PLC_REP와 다른 컬럼(PLC_REP_SW)
  "PLC REP": "PLC_REP_SW",
};

exports.toSelfCol = (item) => {
  const up = upper(item);
  if (SELF_COL_MAP[up]) return SELF_COL_MAP[up];
  // 기본 규칙
  return up
    .replace(/[^\p{L}\p{N}_ &]/gu, "")   // 한글/영문/숫자/_/&만 유지
    .replace(/\s+/g, "_")
    .trim();
};

/** item → self-check 컬럼명 */
exports.toSelfCol = (item) => {
  const up = upper(item);
  if (SELF_COL_MAP[up]) return SELF_COL_MAP[up];
  // 기본 규칙
  return up
    .replace(/[^\p{L}\p{N}_ &]/gu, "")   // 한글/영문/숫자/_/&만 유지
    .replace(/\s+/g, "_")
    .trim();
};

/** 작업자 별칭(동일인 취급) — (main)/(support), 괄호 표기, 중복 공백 정리 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};
