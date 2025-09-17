// back/src/controllers/skillController.js
const dao = require('../dao/skillDao');

/** ---------- 설비별 임계값(소수) ---------- */
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

/** MAIN EQ용 평균(SET UP & MAINT) */
function mainAvg(user, eq) {
  if (!eq || !THRESHOLDS[eq]) return 0;
  const su = num(user[colName(eq, ' SET UP')]);
  const mt = num(user[colName(eq, ' MAINT')]);
  return (su + mt) / 2;
}

/** MULTI EQ용 SET UP 단독 */
function multiSetup(user, eq) {
  if (!eq || !THRESHOLDS[eq]) return 0;
  return num(user[colName(eq, ' SET UP')]);
}

/**
 * MAIN 역량 레벨 산정
 * - reportLevel: '0' | '1' | '2' | '2-2'
 * - avg: MAIN(SETUP+MAINT)/2
 * 규칙:
 *  - '0'이면 '0'
 *  - '1'이면 avg 기준으로 1-1/1-2/1-3/0 중 최고치
 *  - '2'이면 avg 기준으로 2/1-3/1-2/1-1/0 중 최고치
 *  - '2-2'이면 MAIN 산정 대상 아님 -> null
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
  if (reportLevel === '2') {
    if (avg >= t['2'])   return '2';
    if (avg >= t['1-3']) return '1-3';
    if (avg >= t['1-2']) return '1-2';
    if (avg >= t['1-1']) return '1-1';
    return '0';
  }
  if (reportLevel === '2-2') {
    // Report가 MULTI 검증 트랙이므로 MAIN은 계산 제외
    return null;
  }
  // 예외 입력 방어
  return null;
}

/**
 * MULTI 역량 레벨 산정
 * - reportLevel이 '2-2'일 때만 산정
 * - 기준: MULTI EQ의 SET UP 단독 비교 (>= Lv.2-2 → '2-2', else '0')
 */
function computeMultiCapabilityLevel(reportLevel, eq, setupOnly) {
  if (reportLevel !== '2-2') return null;
  if (!eq || !THRESHOLDS[eq]) return null;
  const t = THRESHOLDS[eq];
  return setupOnly >= t['2-2'] ? '2-2' : '0';
}

/** 문자열 정규화 (DB의 LEVEL(report) 값이 숫자/문자 혼재될 가능성 대비) */
function normalizeReportLevel(v) {
  if (v === null || v === undefined) return '0';
  const s = String(v).trim();
  if (s === '0' || s === '1' || s === '2' || s === '2-2') return s;
  // 숫자 0/1/2로 저장된 경우
  if (s === '0') return '0';
  if (s === '1') return '1';
  if (s === '2') return '2';
  return '0';
}

/** 사용자 1명에 대한 계산 */
function buildUserCapability(user) {
  const name = user.NAME;
  const mainEq = user['MAIN EQ'];
  const multiEq = user['MULTI EQ'];
  const reportLevel = normalizeReportLevel(user['LEVEL(report)']);

  const mainAverage = mainAvg(user, mainEq);
  const multiSuOnly = multiSetup(user, multiEq);

  const mainCapLevel  = computeMainCapabilityLevel(reportLevel, mainEq, mainAverage);
  const multiCapLevel = computeMultiCapabilityLevel(reportLevel, multiEq, multiSuOnly);

  return {
    ID: user.ID,
    NAME: name,
    COMPANY: user.COMPANY,
    EMPLOYEE_ID: user.EMPLOYEE_ID,
    GROUP: user.GROUP,
    SITE: user.SITE,
    'LEVEL(report)': reportLevel,
    'MAIN EQ': mainEq || null,
    'MULTI EQ': multiEq || null,

    // 소수(0~1) 값 그대로 제공 + % 보기 위한 파생값도 같이 제공
    metrics: {
      main: {
        setup: num(user[colName(mainEq || '', ' SET UP')]),
        maint: num(user[colName(mainEq || '', ' MAINT')]),
        average: mainAverage,
      },
      multi: {
        setupOnly: multiSuOnly,
        maint: num(user[colName(multiEq || '', ' MAINT')]) || 0, // 참고용
      },
    },

    capability: {
      main_level: mainCapLevel,   // '0' | '1-1' | '1-2' | '1-3' | '2' | null
      multi_level: multiCapLevel, // '0' | '2-2' | null
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
  };
}

/** 목록(요약) */
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
    }));
    res.json({ isSuccess: true, count: result.length, result });
  } catch (err) {
    console.error('[getAllCapabilities] error:', err);
    res.status(500).json({ isSuccess: false, message: 'Internal Server Error' });
  }
};

/** 단일 상세 (id 또는 name 쿼리) */
exports.getCapabilityByIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.query;

    let user = null;

    if (id) {
      user = await dao.fetchUserById(id);
      if (!user) return res.status(404).json({ isSuccess: false, message: 'User not found' });
      const result = buildUserCapability(user);
      return res.json({ isSuccess: true, result });
    }

    if (name) {
      const users = await dao.fetchUsersByNameLike(name);
      if (!users || users.length === 0) {
        return res.status(404).json({ isSuccess: false, message: 'No matched user' });
      }
      // 이름이 정확히 같은 것이 있으면 우선 반환, 아니면 첫 건
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
