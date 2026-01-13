// src/pci/integer/pciConfig.js

/** INTEGER — 항목별 기준 작업 수 */
exports.BASELINE = {
  // Swap Kit
  "SWAP KIT": 2,
  "GAS LINE & GAS FILTER": 1,
  "TOP FEED THROUGH": 1,
  "GAS FEED THROUGH": 1,
  "CERAMIC PARTS": 1,
  "MATCHER": 1,
  "PM BAFFLE": 2,
  "AM BAFFLE": 1,
  "FLANGE ADAPTOR": 1,

  // Slot Valve
  "SLOT VALVE ASSY(HOUSING)": 1,
  "SLOT VALVE": 1,
  "DOOR VALVE": 1,

  // Pendulum Valve
  "PENDULUM VALVE": 2,

  // Pin Motor & CTR
  "PIN ASSY MODIFY": 2,
  "MOTOR & CONTROLLER": 2,
  "PIN 구동부 ASSY": 2,
  "PIN BELLOWS": 2,
  "SENSOR": 2,

  // Step Motor & CTR
  "STEP MOTOR & CONTROLLER": 3,
  "CASSETTE & HOLDER PAD": 1,
  "BALL SCREW ASSY": 3,
  "BUSH": 3,
  "MAIN SHAFT": 3,
  "BELLOWS": 3,

  // Robot
  "EFEM ROBOT REP": 5,
  "TM ROBOT REP": 5,
  "EFEM ROBOT TEACHING": 5,
  "TM ROBOT TEACHING": 5,
  "TM ROBOT SERVO PACK": 2,

  // Vac. Line
  "UNDER COVER": 2,
  "VAC. LINE": 2,
  "BARATRON GAUGE": 2,
  "PIRANI GAUGE": 2,
  "CONVACTRON GAUGE": 2,
  "MANUAL VALVE": 2,
  "PNEUMATIC VALVE": 2,
  "ISOLATION VALVE": 2,
  "VACUUM BLOCK": 2,
  "CHECK VALVE": 2,
  "EPC": 2,
  "PURGE LINE REGULATOR": 1,

  // Chuck
  "COOLING CHUCK": 2,
  "HEATER CHUCK": 2,

  // Rack
  "GENERATOR": 2,

  // Board
  "D-NET BOARD": 2,
  "SOURCE BOX BOARD": 2,
  "INTERFACE BOARD": 2,
  "SENSOR BOARD": 2,
  "PIO SENSOR BOARD": 2,
  "AIO CALIBRATION[PSK BOARD]": 2,
  "AIO CALIBRATION[TOS BOARD]": 2,

  // Sensor
  "CODED SENSOR": 2,
  "GAS BOX DOOR SENSOR": 2,
  "LASER SENSOR AMP": 2,

  // ETC
  "HE LEAK CHECK": 2,
  "DIFFUSER": 2,
  "LOT 조사": 2,
  "GAS SPRING": 1,
  "LP ESCORT": 1
};

/** 인정 설비 타입 (INTEGER 계열) */
exports.ALLOWED_EQUIP_TYPES = [
  "INTEGER IVr", "INTEGER Ivr", "INTEGER ivr",
  "INTEGER Plus", "INTEGER plus", "INTEGER PLUS",
  "INTEGER XP"
];

/** 소문자/공백/기호 차이 흡수용 캐논 */
const strip = s => (s ?? "").toString().trim();
const upper = s => strip(s).toUpperCase();
/** 비교/매칭용 표준화(특수문자 제거, 공백 1칸) */
const canon = s => upper(s)
  .replace(/ASS'Y/g, "ASSY")
  .replace(/-/g, " ")
  .replace(/[^\w ]/g, "")        // 영숫자/언더스코어 제외 제거
  .replace(/\s+/g, " ");
exports.canon = canon;

/** 동의어/오탈자 보정 맵 (로그 → BASELINE 키로 보정) */
const ALIASES = {
  "VAC LINE": "VAC. LINE",
  "VAC_LINE": "VAC. LINE",
  "VAC.  LINE": "VAC. LINE",
  "D NET BOARD": "D-NET BOARD",
  "D-NET_BOARD": "D-NET BOARD",
  "PIN 구동부 ASSY": "PIN 구동부 ASSY", // 안전
  "AIO CALIBRATION PSK BOARD": "AIO CALIBRATION[PSK BOARD]",
  "AIO CALIBRATION TOS BOARD": "AIO CALIBRATION[TOS BOARD]",
  "PIO SENSOR  BOARD": "PIO SENSOR BOARD",
};

/** 작업 항목 표준화 (BASELINE 키로 귀속) */
exports.normalizeItem = (raw) => {
  if (!raw) return "";
  const viaAlias = ALIASES[strip(raw)] || raw;
  const keys = Object.keys(exports.BASELINE);
  const hit = keys.find(k => canon(k) === canon(viaAlias));
  return hit || strip(raw); // 기준에 없으면 원문 유지(계산 시 스킵)
};

/** Self 테이블의 정확한 컬럼명 매핑 (특수문자/한글 포함) */
const SELF_COL_MAP = {
  // Swap Kit
  "SWAP KIT": "SWAP_KIT",
  "GAS LINE & GAS FILTER": "GAS_LINE_&_GAS_FILTER",
  "TOP FEED THROUGH": "TOP_FEED_THROUGH",
  "GAS FEED THROUGH": "GAS_FEED_THROUGH",
  "CERAMIC PARTS": "CERAMIC_PARTS",
  "MATCHER": "MATCHER",
  "PM BAFFLE": "PM_BAFFLE",
  "AM BAFFLE": "AM_BAFFLE",
  "FLANGE ADAPTOR": "FLANGE_ADAPTOR",

  // Slot Valve
  "SLOT VALVE ASSY(HOUSING)": "SLOT_VALVE_ASSY(HOUSING)",
  "SLOT VALVE": "SLOT_VALVE",
  "DOOR VALVE": "DOOR_VALVE",

  // Pendulum Valve
  "PENDULUM VALVE": "PENDULUM_VALVE",

  // Pin Motor & CTR
  "PIN ASSY MODIFY": "PIN_ASSY_MODIFY",
  "MOTOR & CONTROLLER": "MOTOR_&_CONTROLLER",
  "PIN 구동부 ASSY": "PIN_구동부_ASSY",
  "PIN BELLOWS": "PIN_BELLOWS",
  "SENSOR": "SENSOR",

  // Step Motor & CTR
  "STEP MOTOR & CONTROLLER": "STEP_MOTOR_&_CONTROLLER",
  "CASSETTE & HOLDER PAD": "CASSETTE_&_HOLDER_PAD",
  "BALL SCREW ASSY": "BALL_SCREW_ASSY",
  "BUSH": "BUSH",
  "MAIN SHAFT": "MAIN_SHAFT",
  "BELLOWS": "BELLOWS",

  // Robot
  "EFEM ROBOT REP": "EFEM_ROBOT_REP",
  "TM ROBOT REP": "TM_ROBOT_REP",
  "EFEM ROBOT TEACHING": "EFEM_ROBOT_TEACHING",
  "TM ROBOT TEACHING": "TM_ROBOT_TEACHING",
  "TM ROBOT SERVO PACK": "TM_ROBOT_SERVO_PACK",

  // Vac. Line
  "UNDER COVER": "UNDER_COVER",
  "VAC. LINE": "VAC._LINE",
  "BARATRON GAUGE": "BARATRON_GAUGE",
  "PIRANI GAUGE": "PIRANI_GAUGE",
  "CONVACTRON GAUGE": "CONVACTRON_GAUGE",
  "MANUAL VALVE": "MANUAL_VALVE",
  "PNEUMATIC VALVE": "PNEUMATIC_VALVE",
  "ISOLATION VALVE": "ISOLATION_VALVE",
  "VACUUM BLOCK": "VACUUM_BLOCK",
  "CHECK VALVE": "CHECK_VALVE",
  "EPC": "EPC",
  "PURGE LINE REGULATOR": "PURGE_LINE_REGULATOR",

  // Chuck
  "COOLING CHUCK": "COOLING_CHUCK",
  "HEATER CHUCK": "HEATER_CHUCK",

  // Rack
  "GENERATOR": "GENERATOR",

  // Board
  "D-NET BOARD": "D-NET_BOARD",
  "SOURCE BOX BOARD": "SOURCE_BOX_BOARD",
  "INTERFACE BOARD": "INTERFACE_BOARD",
  "SENSOR BOARD": "SENSOR_BOARD",
  "PIO SENSOR BOARD": "PIO_SENSOR_BOARD",
  "AIO CALIBRATION[PSK BOARD]": "AIO_CALIBRATION[PSK_BOARD]",
  "AIO CALIBRATION[TOS BOARD]": "AIO_CALIBRATION[TOS_BOARD]",

  // Sensor
  "CODED SENSOR": "CODED_SENSOR",
  "GAS BOX DOOR SENSOR": "GAS_BOX_DOOR_SENSOR",
  "LASER SENSOR AMP": "LASER_SENSOR_AMP",

  // ETC
  "HE LEAK CHECK": "HE_LEAK_CHECK",
  "DIFFUSER": "DIFFUSER",
  "LOT 조사": "LOT_조사",
  "GAS SPRING": "GAS_SPRING",
  "LP ESCORT": "LP_ESCORT"
};

/** transfer_item → self-check 정확 컬럼명 */
exports.toSelfCol = (item) => {
  const key = exports.normalizeItem(item);
  return SELF_COL_MAP[key] || null;
};

/** 작업자 별칭(동일인 취급) — (main)/(support), A/B 표기 통합 */
exports.workerAliases = (name) => {
  if (!name) return "";
  return name.replace(/\(.*?\)/g, "").trim().replace(/\s+/g, " ");
};

/** transfer_item 확장 (특정 값은 여러 항목으로 분해) */
exports.expandItems = (raw) => {
  const v = strip(raw);
  if (!v) return [];

  // ✅ 특수 규칙: 통다발(교체) → 4개 항목 각각 1회 인정
  if (v === "통다발(교체)") {
    return ["BUSH", "BALL SCREW ASSY", "MAIN SHAFT", "BELLOWS"];
  }

  // (옵션) 여러 항목 입력 대비: "A, B" / "A / B" 등
  const parts = v.split(/[,/]|(?:\r?\n)+/).map(s => strip(s)).filter(Boolean);
  const list = (parts.length ? parts : [v]);

  // normalize 적용 + baseline에 없는 건 나중에 controller에서 걸러짐
  return [...new Set(list.map(exports.normalizeItem))];
};
