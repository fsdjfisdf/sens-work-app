// back/src/dao/aiRagDao.js
const { pool } = require('../../config/database');

function addFilters(where, params, f = {}) {
  const { days, group, site, equipment_type, work_type, work_type2 } = f;
  if (days && Number(days) > 0) {
    where.push('s.task_date >= (CURRENT_DATE - INTERVAL ? DAY)');
    params.push(Number(days));
  }
  if (group)          { where.push('s.`group` = ?'); params.push(group); }
  if (site)           { where.push('s.`site` = ?'); params.push(site); }
  if (equipment_type) { where.push('s.equipment_type_norm = ?'); params.push(equipment_type); }
  if (work_type)      { where.push('s.work_type = ?'); params.push(work_type); }
  if (work_type2)     { where.push('s.work_type2 = ?'); params.push(work_type2); }
}

async function prefilterCandidates({ q, limit = 300, filters = {} }) {
  const where = [];
  const params = [];
  addFilters(where, params, filters);

  if (q) { // 간단 키워드 프리필터(필요시 Meilisearch로 대체)
    where.push('s.content LIKE ?');
    params.push(`%${q}%`);
  }

  const sql = `
    SELECT s.id
    FROM v_rag_source s
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY s.task_date DESC
    LIMIT ?
  `;
  params.push(Number(limit));

  const conn = await pool.getConnection();
  try{
    const [rows] = await conn.query(sql, params);
    return rows.map(r => r.id);
  } finally { conn.release(); }
}

async function getEmbeddingsByIds(ids = []) {
  if (!ids.length) return [];
  const conn = await pool.getConnection();
  try{
    const [rows] = await conn.query(
      `SELECT chunk_id, dim, embedding FROM rag_embeddings WHERE chunk_id IN (?)`,
      [ids]
    );
    return rows;
  } finally { conn.release(); }
}

async function getContentsByIds(ids = []) {
  if (!ids.length) return [];
  const conn = await pool.getConnection();
  try{
    const [rows] = await conn.query(
      `
      SELECT s.id,
             s.content,
             s.task_date,
             s.equipment_type_norm,
             s.\`group\`,
             s.site,
             s.work_type,
             s.work_type2
      FROM v_rag_source s
      WHERE s.id IN (?)
      `,
      [ids]
    );
    return rows;
  } finally { conn.release(); }
}

module.exports = {
  prefilterCandidates,
  getEmbeddingsByIds,
  getContentsByIds,
};
