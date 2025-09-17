// back/src/controllers/skillController.js
const dao = require('../dao/skillDao');
const XLSX = require('xlsx');

/** ---------- 설비별 기준 역량(소수) ---------- */
const THRESHOLDS = {
  'SUPRA N':   { '1-1': 0.10, '1-2': 0.25, '1-3': 0.46, '2': 0.61, '2-2': 0.70 },
  'SUPRA XP':  { '1-1': 0.10, '1-2': 0.25, '1-3': 0.46, '2': 0.61, '2-2': 0.70 },
  'INTEGER':   { '1-1': 0.12, '1-2': 0.31, '1-3': 0.52, '2': 0.63, '2-2': 0.70 },
  'PRECIA':    { '1-1': 0.12, '1-2': 0.31, '1-3': 0.52, '2': 0.63, '2-2': 0.70 },
  'ECOLITE':   { '1-1': 0.06, '1-2': 0.23, '1-3': 0.43, '2': 0.59, '2-2': 0.70 },
  'GENEVA':    { '1-1': 0.06, '1-2': 0.23, '1-3': 0.43, '2': 0.59, '2-2': 0.70 },
  'HDW':       { '1-1': 0.06, '1-2': 0.23, '1-3': 0.43, '2': 0.59, '2-2': 0.70 },
};

/** 안전 접근: undefined/null -> 0 */
const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

/** DB 컬럼 이름 빌더 (예: "SUPRA N" + " SET UP" -> "SUPRA N SET UP") */
function colName(eq, kind /* ' SET UP' | ' MAINT' */) {
  return `${eq}${kind}`;
}

/** MAIN EQ 평균(SET UP & MAINT) */
function mainAvg(user, eq) {
  if (!eq || !THRESHOLDS[eq]) return 0;
  const su = num(user[colName(eq, ' SET UP')]);
  const mt = num(user[colName(eq, ' MAINT')]);
  return (su + mt) / 2;
}

/** MULTI EQ SET UP 단독 */
function multiSetup(user, eq) {
  if (!eq || !THRESHOLDS[eq]) return 0;
  return num(user[colName(eq, ' SET UP')]);
}

/** 문자열 정규화 (LEVEL(report): '0' | '1' | '2' | '2-2') */
function normalizeReportLevel(v) {
  if (v === null || v === undefined) return '0';
  const s = String(v).trim();
  if (s === '0' || s === '1' || s === '2' || s === '2-2') return s;
  // 혹시 숫자형으로 들어오는 경우 처리
  if (s === '0') return '0';
  if (s === '1') return '1';
  if (s === '2') return '2';
  return '0';
}

/** MAIN 역량 레벨 산정
 * 규칙:
 *  - '0'이면 '0'
 *  - '1'이면 avg 기준으로 1-1/1-2/1-3/0 중 최대
 *  - '2' 또는 '2-2'이면 avg 기준으로 2/1-3/1-2/1-1/0 중 최대
 *    (⚠️ report=2-2라도 MAIN은 평균으로 산정해서 보여준다)
 */
function computeMainCapabilityLevel(reportLevel, eq, avg) {
  if (!eq || !THRESHOLDS[eq]) return null;
  const t = THRESHOLDS[eq];

  if (reportLevel === '0') return '0';

  if (reportLevel === '1') {
    if (avg >= t['1-3']) return '1-3';
    if (avg >= t['1-2']) return '1-2';
    if (avg >= t['1-1']) return '1-1';
    return '0';
  }

  if (reportLevel === '2' || reportLevel === '2-2') {
    if (avg >= t['2'])   return '2';
    if (avg >= t['1-3']) return '1-3';
    if (avg >= t['1-2']) return '1-2';
    if (avg >= t['1-1']) return '1-1';
    return '0';
  }

  return null;
}

/** MULTI 역량 레벨 산정 (reportLevel이 '2-2'일 때만 유효)
 * 기준: MULTI EQ의 SET UP 단독 (>= Lv.2-2 → '2-2', else '0')
 */
function computeMultiCapabilityLevel(reportLevel, eq, setupOnly) {
  if (reportLevel !== '2-2') return null;
  if (!eq || !THRESHOLDS[eq]) return null;
  return setupOnly >= THRESHOLDS[eq]['2-2'] ? '2-2' : '0';
}

/** 정수형 MAIN 저장(1~4) ↔ 문자열 레벨 매핑 */
function mainIntToStr(n) {
  switch (Number(n) || 0) {
    case 1: return '1-1';
    case 2: return '1-2';
    case 3: return '1-3';
    case 4: return '2';
    default: return '0';
  }
}
function mainStrToInt(s) {
  switch (String(s || '')) {
    case '1-1': return 1;
    case '1-2': return 2;
    case '1-3': return 3;
    case '2':   return 4;
    default:    return 0;
  }
}

/** 사용자 1명에 대한 계산 결과 구성 */
function buildUserCapability(user) {
  const mainEq = user['MAIN EQ'];
  const multiEq = user['MULTI EQ'];
  const reportLevel = normalizeReportLevel(user['LEVEL(report)']);

  const mainAverage = mainAvg(user, mainEq);
  const multiSuOnly = multiSetup(user, multiEq);

  const mainCapLevel  = computeMainCapabilityLevel(reportLevel, mainEq, mainAverage);
  const multiCapLevel = computeMultiCapabilityLevel(reportLevel, multiEq, multiSuOnly);

  // DB 저장값(있으면 비교용으로 같이 제공) — (스키마: LEVEL, MULTI LEVEL)
  const dbMainInt  = Number.isFinite(Number(user['LEVEL'])) ? Number(user['LEVEL']) : null;
  const dbMultiInt = Number.isFinite(Number(user['MULTI LEVEL'])) ? Number(user['MULTI LEVEL']) : null;

  return {
    ID: user.ID,
    NAME: user.NAME,
    COMPANY: user.COMPANY,
    EMPLOYEE_ID: user.EMPLOYEE_ID,
    GROUP: user.GROUP,
    SITE: user.SITE,
    'LEVEL(report)': reportLevel,
    'MAIN EQ': mainEq || null,
    'MULTI EQ': multiEq || null,

    // 계산에 쓰인 원시 지표
    metrics: {
      main: {
        setup: num(user[colName(mainEq || '', ' SET UP')]),
        maint: num(user[colName(mainEq || '', ' MAINT')]),
        average: mainAverage,
      },
      multi: {
        setupOnly: multiSuOnly,
        maint: num(user[colName(multiEq || '', ' MAINT')]) || 0, // 참고
      },
    },

    capability: {
      main_level: mainCapLevel,   // '0'|'1-1'|'1-2'|'1-3'|'2'|null
      multi_level: multiCapLevel, // '0'|'2-2'|null
    },

    thresholds: mainEq && THRESHOLDS[mainEq] ? {
      main: {
        '1-1': THRESHOLDS[mainEq]['1-1'],
        '1-2': THRESHOLDS[mainEq]['1-2'],
        '1-3': THRESHOLDS[mainEq]['1-3'],
        '2':   THRESHOLDS[mainEq]['2'],
      }
    } : null,

    thresholds_multi: multiEq && THRESHOLDS[multiEq] ? {
      multi: { '2-2': THRESHOLDS[multiEq]['2-2'] }
    } : null,

    // DB 원본 저장 레벨(승급 비교용으로 같이 내려줌)
    level_int: dbMainInt,          // 1..4 (표시는 1-1/1-2/1-3/2로 변환)
    multi_level_int: dbMultiInt,   // 0/1 (표시는 '-' 또는 2-2)
  };
}

/** -------------------- 목록 -------------------- */
exports.getAllCapabilities = async (req, res) => {
  try {
    const rows = await dao.fetchAllUsers();
    const result = rows.map(buildUserCapability).map(r => ({
      ID: r.ID,
      NAME: r.NAME,
      GROUP: r.GROUP,
      SITE: r.SITE,
      'LEVEL(report)': r['LEVEL(report)'],
      'MAIN EQ': r['MAIN EQ'],
      'MULTI EQ': r['MULTI EQ'],
      main_level: r.capability.main_level,
      multi_level: r.capability.multi_level,
      main_avg: r.metrics.main.average,
      multi_setup: r.metrics.multi.setupOnly,
      // 승급 비교용(프론트에서 필요 시 사용)
      level_int: r.level_int,
      multi_level_int: r.multi_level_int,
    }));
    res.json({ isSuccess: true, count: result.length, result });
  } catch (err) {
    console.error('[getAllCapabilities] error:', err);
    res.status(500).json({ isSuccess: false, message: 'Internal Server Error' });
  }
};

/** -------------------- 단건(상세) -------------------- */
exports.getCapabilityByIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.query;

    if (id) {
      const user = await dao.fetchUserById(id);
      if (!user) return res.status(404).json({ isSuccess: false, message: 'User not found' });
      const result = buildUserCapability(user);
      return res.json({ isSuccess: true, result });
    }

    if (name) {
      const users = await dao.fetchUsersByNameLike(name);
      if (!users || users.length === 0) {
        return res.status(404).json({ isSuccess: false, message: 'No matched user' });
      }
      const exact = users.find(u => String(u.NAME).trim() === String(name).trim()) || users[0];
      const result = buildUserCapability(exact);
      return res.json({ isSuccess: true, multiMatched: users.length, result });
    }

    return res.status(400).json({ isSuccess: false, message: 'Require id param or name query' });
  } catch (err) {
    console.error('[getCapabilityByIdentity] error:', err);
    res.status(500).json({ isSuccess: false, message: 'Internal Server Error' });
  }
};

/** -------------------- 엑셀 내보내기 --------------------
 * 프런트에서 필터 파라미터(name, group, site, eq, report)를 넘겨주면
 * 동일 로직으로 산정한 값을 엑셀로 만들어 반환
 */
exports.exportExcel = async (req, res) => {
  try {
    const { name, group, site, eq, report } = req.query;

    const rows = await dao.fetchAllUsers();
    const computed = rows.map(buildUserCapability);

    // 서버에서도 한 번 더 필터 적용
    const filtered = computed.filter(r => {
      if (name && !String(r.NAME || '').includes(name)) return false;
      if (group && r.GROUP !== group) return false;
      if (site && r.SITE !== site) return false;
      if (report && String(r['LEVEL(report)']) !== report) return false;
      if (eq) {
        const inMain  = r['MAIN EQ'] === eq;
        const inMulti = r['MULTI EQ'] === eq;
        if (!inMain && !inMulti) return false;
      }
      return true;
    });

    // 승급 비교 (DB 저장값 vs 산정값)
    const data = filtered.map(r => {
      const calcMainInt  = mainStrToInt(r.capability.main_level);
      const calcMultiInt = (r.capability.multi_level === '2-2') ? 1 : 0;

      const mainUp  = (r.level_int  != null) ? (calcMainInt  > r.level_int ) : false;
      const multiUp = (r.multi_level_int != null) ? (calcMultiInt > r.multi_level_int) : false;

      const promos = [];
      if (mainUp)  promos.push(`MAIN: ${mainIntToStr(r.level_int)} → ${r.capability.main_level}`);
      if (multiUp) promos.push(`MULTI: ${r.multi_level_int === 0 ? '0' : '2-2'} → 2-2`);

      return {
        'Name': r.NAME ?? '',
        'Group': r.GROUP ?? '',
        'Site': r.SITE ?? '',
        '필기 LEVEL': r['LEVEL(report)'] ?? '',
        'MAIN EQ': r['MAIN EQ'] ?? '',
        'MAIN Avg': toPct(r.metrics.main.average),
        'MAIN Level': r.capability.main_level ?? '',
        'MULTI EQ': r['MULTI EQ'] ?? '',
        'MULTI SET UP': toPct(r.metrics.multi.setupOnly),
        'MULTI Level': r.capability.multi_level ?? '',
        '승급': promos.join(' / ') || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Skill Levels');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename=skill_levels.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (err) {
    console.error('[exportExcel] error:', err);
    res.status(500).json({ isSuccess: false, message: 'Excel export failed' });
  }
};

function toPct(x) {
  const v = Number(x);
  return Number.isFinite(v) ? (v * 100).toFixed(1) + '%' : '';
}
