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
  task_date,      // '2025-10-30' (하루)
  date_from,      // 기간 시작
  date_to,        // 기간 끝
  equipment_name,
  worker_name,    // workers_clean LIKE %...%
  group_name,     // PEE1 / PEE2 / PSKH
  site,           // PT / HS / IC / CJ / PSKH
  work_type,      // SET UP / MAINT / RELOCATION
  setup_item,
  transfer_item,
  limit = 500,
}) {
  const where = ['c.source_type = "WORK_LOG"'];
  const params = [];

  // 🔸 날짜 (하루 지정)
  if (task_date) {
    where.push('c.task_date = ?');
    params.push(task_date);
  }

  // 🔸 기간 지정
  if (date_from) {
    where.push('c.task_date >= ?');
    params.push(date_from);
  }
  if (date_to) {
    where.push('c.task_date <= ?');
    params.push(date_to);
  }

  // 🔸 설비명
  if (equipment_name) {
    where.push('c.equipment_name = ?');
    params.push(equipment_name);
  }

  // 🔸 작업자 이름 (쉼표 포함 문자열에서 LIKE 검색)
  if (worker_name) {
    where.push('c.workers_clean LIKE ?');
    params.push(`%${worker_name}%`);
  }

  // 🔸 그룹
  if (group_name) {
    where.push('c.group_name = ?');
    params.push(group_name);
  }

  // 🔸 사이트
  if (site) {
    where.push('c.site = ?');
    params.push(site);
  }

  // 🔸 작업 타입
  if (work_type) {
    where.push('c.work_type = ?');
    params.push(work_type);
  }

  // 🔸 SET UP/RELOCATION일 때만 프론트에서 넘어오겠지만,
  //     백엔드는 그냥 값이 있으면 필터만 건다.
  if (setup_item) {
    where.push('c.setup_item = ?');
    params.push(setup_item);
  }

  // 🔸 MAINT일 때 프론트에서 넘어옴
  if (transfer_item) {
    where.push('c.transfer_item = ?');
    params.push(transfer_item);
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
      c.equipment_name,
      c.workers_clean,
      c.group_name,
      c.site,
      c.line,
      c.task_date,
      c.setup_item,
      c.transfer_item,
      c.work_type,
      c.status_short,
      c.duration_min,
      c.title,
      c.content
    FROM rag_embeddings e
    JOIN rag_chunks c
      ON c.id = e.chunk_id
    WHERE e.model = ?
      AND ${where.join(' AND ')}
    ORDER BY c.task_date DESC, c.id DESC
    LIMIT ?
  `;

  params.unshift(MODELS.embedding);   // 맨 앞: 모델명
  params.push(Number(limit));         // 맨 끝: limit

  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  findChunksWithoutEmbedding,
  insertEmbedding,
  fetchEmbeddingsWithMeta,       // ALARM용
  fetchWorkLogEmbeddingsWithMeta, // 🔸 새로 추가
  getChunksByIds,
};