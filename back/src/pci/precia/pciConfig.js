// src/pci/precia/pciConfig.js

/** PRECIA — 항목별 기준 작업수 (Baseline) */
exports.BASELINE = {
  // PM
  "PM CENTERING": 2,
  "PM CLN": 1,
  "PM SLOT VALVE REP": 1,
  "PM PEEK PLATE REP": 3,
  "PM RF MATCHER REP": 1,
  "PM PIN HOLDER REP": 3,
  "PM GAP SENSOR ADJUST": 3,
  "PM PROCESS KIT REP": 3,

  // TEACHING
  "EFEM ROBOT TEACHING": 5,
  "TM ROBOT TEACHING": 5,

  // ETC
  "LOT 조사": 1,
  "LP_ESCORT": 1,
};

/** 인정 장비 타입 */
exports.ALLOWED_EQUIP_TYPES = ["PRECIA", "Precia", "precia"];

/** 공통 유틸 */
const strip = (s) => (s ?? "").toString().trim();
const upper = (s) => strip(s).toUpperCase();

/** 항목명 Canon (로그 ↔ 기준명 매칭용)
 * - 대소문자/공백/특수기호 차이를 흡수
 * - 한글/영문/숫자는 유지
 * - '_', '&'는 공백으로 취급(또는 유지), 괄호 등 나머지는 제거
 */
const canon = (s) =>
  upper(s)
    .replace(/ASS'Y/g, "ASSY")
    .replace(/_/g, " ")
    .replace(/&/g, " AND ")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "") // 한글/영문/숫자/공백만 유지
    .replace(/\s+/g, " ")
    .trim();
exports.canon = canon;

/** self-check 컬럼명 규칙
 * - 한글/영문/숫자/언더바/앰퍼샌드만 허용
 * - 공백은 언더바로
 * - 예: "PM CLN" -> "PM_CLN", "GAS LINE & GAS FILTER" -> "GAS_LINE_&_GAS_FILTER"
 */
exports.toSelfCol = (item) =>
  upper(item)
    .replace(/[^\p{L}\p{N}_ &]/gu, "") // 한글/영문/숫자/_/& 유지
    .replace(/\s+/g, "_")
    .trim();

/** 동의어/오탈자 보정 */
const ALIASES = {
  "LP ESCORT": "LP_ESCORT",
  "LOT_조사": "LOT 조사",
  "PM CLEAN": "PM CLN",
};
exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const first = strip(raw);
  const viaAlias = ALIASES[first] || first;

  // 기준 테이블에서 Canon 매칭
  const keys = Object.keys(exports.BASELINE);
  const viaCanon = canon(viaAlias);
  const hit = keys.find((k) => canon(k) === viaCanon);
  return hit || viaAlias; // 기준에 없으면 원문 유지(계산 시 스킵)
};

/** 작업자 별칭(동일인 취급) — (main)/(support), A/B, 괄호 표기 제거 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};
