// back/src/dao/aiRagDao.js
const { pool } = require('../../config/database');

/**
 * 컬레이션 충돌 방지:
 * - content, group, site, equipment_type_norm, work_type, work_type2 등 텍스트 컬럼은
 *   비교 시에 명시적으로 utf8mb4_unicode_ci 로 맞춘다.
 * - LIKE / = 둘 다 동일 원칙 적용.
 */
const COLL = "utf8mb4_unicode_ci";
const asUnicode = (expr) => `CONVERT(${expr} USING utf8mb4) COLLATE ${COLL}`;

/**
 * 메타 필터 WHERE 생성
 */
function addFilters(where, params, f = {}) {
  const { days, group, site, equipment_type, work_type, work_type2 } = f;

  if (days && Number(days) > 0) {
    where.push('s.task_date >= (CURRENT_DATE - INTERVAL ? DAY)');
    params.push(Number(days));
  }
  if (group) {
    where.push(`${asUnicode('s.`group`')} = ?`);
    params.push(group);
  }
  if (site) {
    where.push(`${asUnicode('s.`site`')} = ?`);
    params.push(site);
  }
  if (equipment_type) {
    // v_rag_source에 equipment_type_norm 이 있다면 여기에도 동일 적용
    where.push(`${asUnicode('s.equipment_type_norm')} = ?`);
    params.push(equipment_type);
  }
  if (work_type) {
    where.push(`${asUnicode('s.work_type')} = ?`);
    params.push(work_type);
  }
  if (work_type2) {
    where.push(`${asUnicode('s.work_type2')} = ?`);
    params.push(work_type2);
  }
  if (person) {
    where.push(`REPLACE(s.people_norm,' ','') LIKE REPLACE(CONCAT('%', ? , '%'),' ','')`);
    params.push(person);
  }
}

/**
 * 프리필터 후보 id 가져오기
 * - 텍스트 키워드는 content LIKE 에 적용
 * - 모든 바인딩은 파라미터로 처리(문자열 결합 금지)
 */
async function prefilterCandidates({ q, limit = 300, filters = {} }) {
  const where = [];
  const params = [];
  const { days, group, site, equipment_type, work_type, work_type2 } = filters || {};

  // v_rag_source s (정규화/날짜/메타), rag_chunks c (청크ID), 매핑: c.src_id = s.id
  if (days && Number(days) > 0) {
    where.push('s.task_date >= (CURRENT_DATE - INTERVAL ? DAY)');
    params.push(Number(days));
  }
  if (group)           { where.push(`CONVERT(s.\`group\` USING utf8mb4) COLLATE utf8mb4_unicode_ci = ?`); params.push(group); }
  if (site)            { where.push(`CONVERT(s.site USING utf8mb4) COLLATE utf8mb4_unicode_ci = ?`); params.push(site); }
  if (equipment_type)  { where.push(`CONVERT(s.equipment_type_norm USING utf8mb4) COLLATE utf8mb4_unicode_ci = ?`); params.push(equipment_type); }
  if (work_type)       { where.push(`CONVERT(s.work_type USING utf8mb4) COLLATE utf8mb4_unicode_ci = ?`); params.push(work_type); }
  if (work_type2)      { where.push(`CONVERT(s.work_type2 USING utf8mb4) COLLATE utf8mb4_unicode_ci = ?`); params.push(work_type2); }

  // ✅ 프리필터에서는 LIKE 금지(후보 말림 방지). 오직 메타/기간만.
  const sql = `
    SELECT c.id
    FROM rag_chunks c
    JOIN v_rag_source s ON s.id = c.src_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY s.task_date DESC, c.id DESC
    LIMIT ?
  `;
  params.push(Number(limit));

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(sql, params);
    return rows.map(r => r.id); // ← 이제 항상 청크ID
  } finally {
    conn.release();
  }
}


/**
 * 임베딩 로드
 * - IN (?) 사용
 * - rank 단계에서 id를 참조하므로 필드명을 id로 통일해서 반환
 */
async function getEmbeddingsByIds(ids = []) {
  if (!ids.length) return [];
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT chunk_id, dim, embedding
         FROM rag_embeddings
        WHERE chunk_id IN (?)`,
      [ids]
    );
    // 서비스에서 r.id 로 읽을 수 있게 매핑
    return rows.map(r => ({
      id: r.chunk_id,
      dim: r.dim,
      embedding: r.embedding,
    }));
  } finally {
    conn.release();
  }
}

/**
 * 컨텐츠 로드
 * - 결과 순서를 입력 ids 순서대로 유지하려고 ORDER BY FIELD 사용
 */
async function getContentsByIds(ids = []) {
  if (!ids.length) return [];
  const conn = await pool.getConnection();
  try {
    const placeholders = ids.map(() => '?').join(',');
    const sql = `
      SELECT
        c.id,                     -- 청크ID
        s.content,
        s.task_date,
        s.equipment_type_norm,
        s.\`group\`,
        s.site,
        s.work_type,
        s.work_type2
      FROM rag_chunks c
      JOIN v_rag_source s ON s.id = c.src_id
      WHERE c.id IN (${placeholders})
      ORDER BY FIELD(c.id, ${placeholders})
    `;
    const args = [...ids, ...ids];
    const [rows] = await conn.query(sql, args);
    return rows; // controller에서 p.id 등 그대로 사용 가능
  } finally {
    conn.release();
  }
}




module.exports = {
  prefilterCandidates,
  getEmbeddingsByIds,
  getContentsByIds,
};
