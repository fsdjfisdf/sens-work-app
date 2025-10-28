// back/src/dao/ragDao.js
const mysql = require('mysql2/promise');
const secret = require('../../config/secret');

const pool = mysql.createPool({
  host: secret.host,
  user: secret.user,
  password: secret.password,
  database: secret.database,
  port: Number(secret.port || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

async function ensureTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rag_chunks (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        src_table VARCHAR(64) NOT NULL,
        src_id   VARCHAR(64) NOT NULL,
        site VARCHAR(64), line VARCHAR(64), equipment_type VARCHAR(64),
        equipment_name VARCHAR(128),
        work_type VARCHAR(64), work_type2 VARCHAR(64),
        task_warranty VARCHAR(32),
        start_time TIME NULL, end_time TIME NULL,
        task_duration INT NULL,
        content MEDIUMTEXT NOT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_src (src_table, src_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rag_embeddings (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        chunk_id BIGINT NOT NULL,
        dims INT NOT NULL,
        embedding JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chunk_id (chunk_id),
        CONSTRAINT fk_chunk
          FOREIGN KEY (chunk_id) REFERENCES rag_chunks(id)
          ON DELETE CASCADE
      )
    `);
  } finally {
    conn.release();
  }
}

function buildRowToText(row) {
  // HTML <br> 정리 포함
  const lines = [
    `[SITE/LINE] ${row.site || ''} / ${row.line || ''}`,
    `[EQUIP] ${row.equipment_type || ''} - ${row.equipment_name || ''} (Warranty: ${row.task_warranty || ''})`,
    `[STATUS] ${row.status || ''}`,
    `[ACTION] ${row.task_description || row.action || ''}`,
    `[CAUSE] ${row.task_cause || row.cause || ''}`,
    `[RESULT] ${row.task_result || row.result || ''}`,
    `[SOP/TS] SOP=${row.SOP || ''} / TS=${row.tsguide || row.TS_guide || ''}`,
    `[WORK TYPE] ${row.work_type || ''} / ${row.work_type2 || ''}`,
    `[SETUP/TRANS] setup_item=${row.setup_item || ''} / transfer_item=${row.transfer_item || ''}`,
    `[TIME] duration(min)=${row.task_duration ?? row.time ?? ''}, start=${row.start_time || ''}, end=${row.end_time || ''}, none=${row.none_time ?? row.none ?? ''}, move=${row.move_time ?? row.move ?? ''}`,
  ];
  return lines.map(s => String(s).replace(/<br\s*\/?>/gi, '\n')).join('\n').trim();
}

async function fetchWorkLogBatch({ limit = 100, offset = 0, whereSql = '', params = {} } = {}) {
  const conn = await pool.getConnection();
  try {
    const sql = `
      SELECT 
        id,
        site, line, equipment_type, equipment_name,
        task_warranty,
        status,
        task_description, task_cause, task_result,
        SOP, tsguide,
        work_type, work_type2,
        setup_item, transfer_item,
        task_duration, start_time, end_time, none_time, move_time,
        -- 예시 데이터 컬럼 호환
        action, cause, result, time, none, move
      FROM work_log
      ${whereSql ? `WHERE ${whereSql}` : ''}
      ORDER BY id ASC
      LIMIT :limit OFFSET :offset
    `;
    const [rows] = await conn.query(sql, { ...params, limit, offset });
    return rows;
  } finally {
    conn.release();
  }
}

async function upsertChunk({ src_table, src_id, content, rowMeta = {} }) {
  const conn = await pool.getConnection();
  try {
    const [res] = await conn.query(
      `
      INSERT INTO rag_chunks
      (src_table, src_id, site, line, equipment_type, equipment_name, work_type, work_type2, task_warranty,
       start_time, end_time, task_duration, content, metadata)
      VALUES
      (:src_table, :src_id, :site, :line, :equipment_type, :equipment_name, :work_type, :work_type2, :task_warranty,
       :start_time, :end_time, :task_duration, :content, CAST(:metadata AS JSON))
      ON DUPLICATE KEY UPDATE
        site=VALUES(site), line=VALUES(line), equipment_type=VALUES(equipment_type),
        equipment_name=VALUES(equipment_name), work_type=VALUES(work_type), work_type2=VALUES(work_type2),
        task_warranty=VALUES(task_warranty), start_time=VALUES(start_time), end_time=VALUES(end_time),
        task_duration=VALUES(task_duration), content=VALUES(content), metadata=VALUES(metadata)
      `,
      {
        src_table,
        src_id: String(src_id),
        site: rowMeta.site || null,
        line: rowMeta.line || null,
        equipment_type: rowMeta.equipment_type || null,
        equipment_name: rowMeta.equipment_name || null,
        work_type: rowMeta.work_type || null,
        work_type2: rowMeta.work_type2 || null,
        task_warranty: rowMeta.task_warranty || null,
        start_time: rowMeta.start_time || null,
        end_time: rowMeta.end_time || null,
        task_duration: rowMeta.task_duration ?? null,
        content,
        metadata: JSON.stringify(rowMeta || {}),
      }
    );

    if (res.insertId) return res.insertId;

    const [found] = await conn.query(
      `SELECT id FROM rag_chunks WHERE src_table = :src_table AND src_id = :src_id LIMIT 1`,
      { src_table, src_id: String(src_id) }
    );
    return found?.[0]?.id;
  } finally {
    conn.release();
  }
}

async function saveEmbedding(chunk_id, embedding) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO rag_embeddings (chunk_id, dims, embedding) VALUES (:chunk_id, :dims, :embedding)`,
      { chunk_id, dims: embedding.length, embedding: JSON.stringify(embedding) }
    );
  } finally {
    conn.release();
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function fetchAllEmbeddings({ filters = {}, limit = 2000 } = {}) {
  const conn = await pool.getConnection();
  try {
    const where = [];
    const params = { limit };
    if (filters.equipment_type) { where.push('c.equipment_type = :equipment_type'); params.equipment_type = filters.equipment_type; }
    if (filters.site)           { where.push('c.site = :site'); params.site = filters.site; }
    if (filters.line)           { where.push('c.line = :line'); params.line = filters.line; }

    const sql = `
      SELECT e.id as emb_id, e.chunk_id, e.dims, e.embedding,
             c.site, c.line, c.equipment_type, c.equipment_name,
             c.work_type, c.work_type2, c.task_warranty, c.content
      FROM rag_embeddings e
      JOIN rag_chunks c ON c.id = e.chunk_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY e.id DESC
      LIMIT :limit
    `;
    const [rows] = await conn.query(sql, params);
    return rows.map(r => ({ ...r, embedding: JSON.parse(r.embedding) }));
  } finally {
    conn.release();
  }
}

module.exports = {
  pool,
  ensureTables,
  fetchWorkLogBatch,
  upsertChunk,
  saveEmbedding,
  fetchAllEmbeddings,
  buildRowToText,
  cosineSimilarity,
};

// ragDao.js 하단에 추가

// 1) 구이름 → 새이름 별칭
function buildText(row) {
  return buildRowToText(row);
}

// 2) 구버전 시그니처 흉내내기 (가능한 한 보수적으로)
async function upsertEmbedding(id, embedding) {
  // 경고: 청크가 없다면 의미가 없습니다. 최소한 빈 청크를 보장해줍니다.
  const chunkId = await upsertChunk({
    src_table: 'work_log',
    src_id: String(id),
    content: '',        // 내용을 알 수 없어서 비워둠(권장X)
    rowMeta: {},
  });
  await saveEmbedding(chunkId, embedding);
  return chunkId;
}

module.exports = {
  // ...기존 export
  buildText,           // 추가
  upsertEmbedding,     // 추가
};
