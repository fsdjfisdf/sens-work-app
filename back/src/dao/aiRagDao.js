// back/src/dao/aiRagDao.js
const { pool } = require('../../config/database');

const COLL = 'utf8mb4_unicode_ci';
const asUnicode = (expr) => `CONVERT(${expr} USING utf8mb4) COLLATE ${COLL}`;

/** WHERE 구성 — 절대기간 우선, 없으면 days */
function addFilters(where, params, f = {}) {
  const {
    days, group, site, equipment_type, work_type, work_type2,
    person, date_from, date_to,
  } = f || {};

  // 1) 절대기간 우선
  if (date_from) { where.push('s.task_date >= ?'); params.push(date_from); }
  if (date_to)   { where.push('s.task_date <  ?'); params.push(date_to); }

  // 2) days는 절대기간이 없을 때만
  if (!date_from && !date_to && days && Number(days) > 0) {
    where.push('s.task_date >= (CURRENT_DATE - INTERVAL ? DAY)');
    params.push(Number(days));
  }

  if (group)          { where.push(`${asUnicode('s.`group`')} = ?`); params.push(group); }
  if (site)           { where.push(`${asUnicode('s.`site`')} = ?`);  params.push(site); }
  if (equipment_type) { where.push(`${asUnicode('s.equipment_type_norm')} = ?`); params.push(equipment_type); }
  if (work_type)      { where.push(`${asUnicode('s.work_type')} = ?`); params.push(work_type); }
  if (work_type2)     { where.push(`${asUnicode('s.work_type2')} = ?`); params.push(work_type2); }

  // 3) 사람 필터 — people_norm이 있으면 사용, 없으면 people에서 즉시 정규화
  if (person) {
    where.push(`
      REPLACE(
        REGEXP_REPLACE(
          COALESCE(s.people_norm, s.people, ''),
          '\\\\((main|support)\\\\)',
          ''
        ),
        ' ', ''
      ) LIKE REPLACE(CONCAT('%', ?, '%'), ' ', '')
    `);
    params.push(person);
  }
}

/** 프리필터 — 후보 청크ID 반환 (rag_chunks.id) */
async function prefilterCandidates({ q, limit = 300, filters = {} }) {
  const where = [];
  const params = [];
  addFilters(where, params, filters);

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
    return rows.map(r => r.id);
  } finally {
    conn.release();
  }
}

/** 임베딩 로드 — chunk_id IN (?) */
async function getEmbeddingsByIds(ids = []) {
  if (!ids.length) return [];
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `
      SELECT chunk_id, dim, embedding
      FROM rag_embeddings
      WHERE chunk_id IN (?)
      `,
      [ids]
    );
    return rows.map(r => ({
      id: r.chunk_id,
      dim: r.dim,
      embedding: r.embedding,
    }));
  } finally {
    conn.release();
  }
}

/** 컨텐츠 로드 — rag_chunks.id → v_rag_source 매핑, 입력순서 유지 */
async function getContentsByIds(ids = []) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');

  const sql = `
    SELECT
      c.id,
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

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(sql, args);
    return rows;
  } finally {
    conn.release();
  }
}

module.exports = {
  prefilterCandidates,
  getEmbeddingsByIds,
  getContentsByIds,
};
