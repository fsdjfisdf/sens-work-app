// src/dao/userDao.js
const { pool } = require("../../config/database");
const { workerAliases } = require("../pci/supran/pciConfig");

/**
 * 재직자(또는 전체) 목록 조회
 * - activeOnly=true 이면 role로 퇴사자(퇴사/Resigned 등) 제외
 * - company / group / site 는 대소문자·공백 무시 정합 비교
 */
exports.fetchActiveUsers = async ({ company, group, site, activeOnly = true } = {}) => {
  const params = [];
  const where = [
    `NAME IS NOT NULL AND NAME <> ''`
  ];

  // 대소문자/공백 무시를 위해 UPPER(TRIM()) 비교
  if (company) { where.push(`UPPER(TRIM(COMPANY)) = UPPER(TRIM(?))`); params.push(company); }
  if (group)   { where.push(`UPPER(TRIM(\`GROUP\`)) = UPPER(TRIM(?))`); params.push(group); }
  if (site)    { where.push(`UPPER(TRIM(SITE))    = UPPER(TRIM(?))`);   params.push(site); }

  if (activeOnly) {
    // role 컬럼이 존재한다면 퇴사 플래그로 제외
    // - role이 없거나 다른 스키마여도 쿼리 실패하지 않도록 동적 컬럼 체크
    //   (information_schema 조회 대신, 안전한 조건식 사용)
    //   -> COALESCE(role,'') 비교: role이 없으면 무시되도록 TRY CATCH 실시
    try {
      // role 컬럼 존재 여부 간단 확인 (실패해도 앱 영향 X)
      await pool.query(`SELECT role FROM userDB LIMIT 0`);
      where.push(`(role IS NULL OR UPPER(TRIM(role)) NOT IN ('퇴사','퇴사자','RESIGNED','LEAVED','LEAVE'))`);
    } catch (_) {
      // role 컬럼이 없으면 아무 것도 하지 않음
    }

    // 흔히 쓰는 종료일 컬럼이 있다면 자동 제외 (있을 수도/없을 수도)
    try {
      await pool.query(`SELECT RESIGN_DATE FROM userDB LIMIT 0`);
      where.push(`(RESIGN_DATE IS NULL OR RESIGN_DATE = '' OR RESIGN_DATE = '0000-00-00')`);
    } catch (_) {}
    try {
      await pool.query(`SELECT END_DATE FROM userDB LIMIT 0`);
      where.push(`(END_DATE IS NULL OR END_DATE = '' OR END_DATE = '0000-00-00')`);
    } catch (_) {}
  }

  const sql = `
    SELECT 
      NAME,
      COMPANY,
      \`GROUP\` AS \`GROUP\`,
      SITE
    FROM userDB
    WHERE ${where.join(" AND ")}
  `;
  const [rows] = await pool.query(sql, params);

  // 별칭 정규화된 이름 Set & 원본 row 동시 반환
  const nameSet = new Set(rows.map(r => workerAliases(r.NAME)));
  return { rows, nameSet };
};

/** 필터 옵션(중복 제거) */
exports.fetchUserFilterOptions = async () => {
  const [rows] = await pool.query(`
    SELECT 
      IFNULL(COMPANY,'') AS COMPANY,
      IFNULL(\`GROUP\`,'') AS \`GROUP\`,
      IFNULL(SITE,'')    AS SITE
    FROM userDB
    WHERE NAME IS NOT NULL AND NAME <> ''
  `);
  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  return {
    company: uniq(rows.map(r => r.COMPANY)),
    group:   uniq(rows.map(r => r.GROUP)),
    site:    uniq(rows.map(r => r.SITE)),
  };
};
