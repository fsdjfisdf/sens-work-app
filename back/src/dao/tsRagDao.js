// back/src/dao/tsRagDao.js
const { pool } = require('../../config/database');
const MODELS = require('../../config/openai').MODELS;

// 🔹 아직 임베딩이 안 만들어진 rag_chunks (ALARM_STEP 전용) 조회
async function findChunksWithoutEmbedding(limit = 100) {
  const sql = `
    SELECT c.id, c.title, c.content, c.alarm_key, c.case_no, c.step_no,
           c.equipment_type, c.alarm_group, c.module_main
    FROM rag_chunks c
    LEFT JOIN rag_embeddings e
      ON e.chunk_id = c.id
     AND e.model = ?
    WHERE e.id IS NULL
      AND c.source_type = 'ALARM_STEP'
    ORDER BY c.id
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [MODELS.embedding, Number(limit)]);
  return rows;
}

// 🔹 rag_embeddings에 임베딩 저장
async function insertEmbedding({ chunkId, model, dim, vector }) {
  const embeddingJson = JSON.stringify(vector); // MEDIUMBLOB에 JSON 문자열로 저장

  const sql = `
    INSERT INTO rag_embeddings (chunk_id, model, dim, embedding)
    VALUES (?, ?, ?, ?)
  `;
  await pool.query(sql, [chunkId, model, dim, embeddingJson]);
}

// 🔹 검색용 후보 임베딩 + 메타 조회
//    - equipment_type / alarm_key로 필터링 가능
async function fetchEmbeddingsWithMeta({ equipment_type, alarm_key, limit = 500 }) {
  const where = ['c.source_type = "ALARM_STEP"'];
  const params = [];

  if (equipment_type) {
    where.push('c.equipment_type = ?');
    params.push(equipment_type);
  }
  if (alarm_key) {
    where.push('c.alarm_key = ?');
    params.push(alarm_key);
  }

  const sql = `
    SELECT
      e.id         AS embedding_id,
      e.chunk_id,
      e.model,
      e.dim,
      e.embedding,
      c.alarm_key,
      c.case_no,
      c.step_no,
      c.equipment_type,
      c.alarm_group,
      c.module_main,
      c.title,
      c.content
    FROM rag_embeddings e
    JOIN rag_chunks c
      ON c.id = e.chunk_id
    WHERE e.model = ?
      AND ${where.join(' AND ')}
    ORDER BY c.alarm_key, c.case_no, c.step_no
    LIMIT ?
  `;
  params.unshift(MODELS.embedding); // 맨 앞에 embedding 모델
  params.push(Number(limit));

  const [rows] = await pool.query(sql, params);
  return rows;
}

// 🔹 chunk_id 목록으로 rag_chunks 가져오기 (필요 시 사용)
async function getChunksByIds(ids = []) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const sql = `
    SELECT *
    FROM rag_chunks
    WHERE id IN (${placeholders})
  `;
  const [rows] = await pool.query(sql, ids);
  return rows;
}

module.exports = {
  findChunksWithoutEmbedding,
  insertEmbedding,
  fetchEmbeddingsWithMeta,
  getChunksByIds,
};
