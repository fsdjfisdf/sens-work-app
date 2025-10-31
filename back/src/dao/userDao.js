// src/dao/userDao.js
const { pool } = require("../../config/database");
const { workerAliases } = require("../pci/supran/pciConfig");

/**
 * 재직자 목록 조회
 * - userDB에 존재하는 사람을 "재직자"로 간주합니다.
 * - 필요하다면 role 컬럼로 '퇴사/Resigned' 등을 제외할 수 있도록 옵션 포함(주석 참고)
 */
exports.fetchActiveUsers = async ({ company, group, site } = {}) => {
  const params = [];
  const where = [
    `NAME IS NOT NULL AND NAME <> ''`,
    // ▼ role 값으로 퇴사자 표기 시, 주석 해제
    // `(role IS NULL OR role NOT IN ('퇴사','퇴사자','Resigned','resigned'))`
  ];

  if (company) { where.push(`COMPANY = ?`); params.push(company); }
  if (group)   { where.push(`\`GROUP\` = ?`); params.push(group); }
  if (site)    { where.push(`SITE = ?`);     params.push(site); }

  const sql = `
    SELECT NAME, COMPANY, \`GROUP\` AS \`GROUP\`, SITE
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
