// back/src/dao/tsRagDao.js
const { pool } = require('../../config/database');
const MODELS = require('../../config/openai').MODELS;

// 🔹 아직 임베딩이 안 만들어진 rag_chunks (ALARM_STEP 전용) 조회
async function findChunksWithoutEmbedding(limit = 100) {
  const sql = `
    SELECT
      c.id,
      c.title,
      c.content,
      c.alarm_key,
      c.case_no,
      c.step_no,
      c.equipment_type,
      c.alarm_group,
      c.module_main,
      c.source_type,
      c.src_table,
      c.src_id
    FROM rag_chunks c
    LEFT JOIN rag_embeddings e
      ON e.chunk_id = c.id
     AND e.model = ?
    WHERE e.id IS NULL
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

// back/src/dao/tsRagDao.js

// ... 기존 코드 그대로 두고 아래에 추가 ...

// 🔹 작업이력(WORK_LOG)용 임베딩 + 메타 조회
//    - equipment_type 기준으로 필터 (필요하면 group/site 등 나중에 확장)
// tsRagDao.js

async function fetchWorkLogEmbeddingsWithMeta({
  equipment_type,
  equipment_name,   // EPAB301 같은 거
  worker_name,      // 정현우 같은 거
  limit = 500,
}) {
  const where = ['c.source_type = "WORK_LOG"'];
  const params = [];

  if (equipment_type) {
    where.push('w.equipment_type = ?');
    params.push(equipment_type);
  }
  if (equipment_name) {
    where.push('w.equipment_name = ?');        // 정확히 일치
    // 또는 LIKE '%EPAB301%' 로 바꿀 수도 있음
    params.push(equipment_name);
  }
  if (worker_name) {
    // (main)/(support) 제거된 형태로 LIKE 검색
    where.push(
      "REPLACE(REPLACE(w.task_man, '(main)',''), '(support)','') LIKE ?"
    );
    params.push(`%${worker_name}%`);
  }

  const sql = `
    SELECT
      e.id         AS embedding_id,
      e.chunk_id,
      e.model,
      e.dim,
      e.embedding,
      c.source_type,
      c.src_table,
      c.src_id,
      c.equipment_type,
      c.title,
      c.content,
      w.equipment_name,
      w.task_man,
      w.task_date
    FROM rag_embeddings e
    JOIN rag_chunks c
      ON c.id = e.chunk_id
    JOIN work_log w
      ON c.source_type = 'WORK_LOG'
     AND c.src_table = 'work_log'
     AND c.src_id = w.id
    WHERE e.model = ?
      AND ${where.join(' AND ')}
    ORDER BY w.task_date DESC
    LIMIT ?
  `;

  params.unshift(MODELS.embedding);
  params.push(Number(limit));

  const [rows] = await pool.query(sql, params);
  return rows;
}


module.exports = {
  findChunksWithoutEmbedding,
  insertEmbedding,
  fetchEmbeddingsWithMeta,
  getChunksByIds,
  fetchWorkLogEmbeddingsWithMeta,   // ⬅️ 이 줄 추가
};
