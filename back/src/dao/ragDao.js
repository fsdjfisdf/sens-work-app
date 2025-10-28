// back/src/dao/ragDao.js
// 공용 DB 풀 사용 (다른 모듈과 일관)
const { pool } = require('../../config/database');

/* ---------- 유틸 ---------- */
function hhmmOrHhmmssToMin(v) {
  if (!v) return null;
  const s = String(v);
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1] || 0);
  const mi = Number(m[2] || 0);
  const sec = Number(m[3] || 0);
  return h * 60 + mi + (sec >= 30 ? 1 : 0);
}

/* ---------- 테이블 보장 ---------- */
async function ensureTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rag_chunks (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        src_table VARCHAR(64) NOT NULL,
        src_id   VARCHAR(64) NOT NULL,
        site VARCHAR(64), 
        line VARCHAR(64), 
        equipment_type VARCHAR(64),
        equipment_name VARCHAR(128),
        work_type VARCHAR(64), 
        work_type2 VARCHAR(64),
        task_warranty VARCHAR(32),
        task_date DATE NULL,                -- 날짜 필터/인덱스
        start_time TIME NULL, 
        end_time TIME NULL,
        task_duration INT NULL,            -- 분(min) 저장
        content MEDIUMTEXT NOT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_src (src_table, src_id),
        KEY idx_task_date (task_date),
        KEY idx_eq_site_line (equipment_type, site, line)
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

/* ---------- work_log 1row → 텍스트 ---------- */
function buildRowToText(row) {
  const durationMin = row.duration_min ?? hhmmOrHhmmssToMin(row.task_duration ?? row.time);
  const actionText = String(row.task_description || row.action || '').replace(/<br\s*\/?>/gi, '\n');

  const lines = [
    `[SITE/LINE] ${row.site || ''} / ${row.line || ''}`,
    `[EQUIP] ${row.equipment_type || ''} - ${row.equipment_name || ''} (Warranty: ${row.warranty || row.task_warranty || ''})`,
    `[STATUS] ${row.status || ''}`,
    `[ACTION] ${actionText}`,
    `[CAUSE] ${row.task_cause || row.cause || ''}`,
    `[RESULT] ${row.task_result || row.result || ''}`,
    `[SOP/TS] SOP=${row.SOP || ''} / TS=${row.tsguide || row.TS_guide || ''}`,
    `[WORK TYPE] ${row.work_type || ''} / ${row.work_type2 || ''}`,
    `[SETUP/TRANS] setup_item=${row.setup_item || ''} / transfer_item=${row.transfer_item || ''}`,
    `[TIME] duration(min)=${durationMin ?? ''}, start=${row.start_time || ''}, end=${row.end_time || ''}, none=${row.none_time ?? row.none ?? ''}, move=${row.move_time ?? row.move ?? ''}`,
  ];
  return lines.join('\n').trim();
}

/* ---------- 배치 로딩(임베딩 전처리 등에서 사용 가능) ---------- */
async function fetchWorkLogBatch({ limit = 100, offset = 0, whereSql = '', paramsArr = [] } = {}) {
  const conn = await pool.getConnection();
  try {
    const sql = `
      SELECT 
        id,
        task_date,
        task_name,
        task_man,
        site, line, equipment_type, equipment_name,
        warranty AS task_warranty,          -- 원본 컬럼 warranty
        status,
        task_description, task_cause, task_result,
        SOP, tsguide,
        work_type, work_type2,
        setup_item, transfer_item,
        task_duration, start_time, end_time, none_time, move_time,
        TIME_TO_SEC(task_duration)/60 AS duration_min
      FROM work_log
      ${whereSql ? `WHERE ${whereSql}` : ''}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await conn.query(sql, [...paramsArr, Number(limit), Number(offset)]);
    return rows;
  } finally {
    conn.release();
  }
}

/* ---------- rag_chunks upsert ---------- */
async function upsertChunk({ src_table, src_id, content, rowMeta = {} }) {
  const conn = await pool.getConnection();
  try {
    const sql = `
      INSERT INTO rag_chunks
      (src_table, src_id, site, line, equipment_type, equipment_name, work_type, work_type2, task_warranty,
       task_date, start_time, end_time, task_duration, content, metadata)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))
      ON DUPLICATE KEY UPDATE
        site=VALUES(site), 
        line=VALUES(line), 
        equipment_type=VALUES(equipment_type),
        equipment_name=VALUES(equipment_name), 
        work_type=VALUES(work_type), 
        work_type2=VALUES(work_type2),
        task_warranty=VALUES(task_warranty), 
        task_date=VALUES(task_date),
        start_time=VALUES(start_time), 
        end_time=VALUES(end_time),
        task_duration=VALUES(task_duration), 
        content=VALUES(content), 
        metadata=VALUES(metadata)
    `;
    const args = [
      src_table,
      String(src_id),
      rowMeta.site || null,
      rowMeta.line || null,
      rowMeta.equipment_type || null,
      rowMeta.equipment_name || null,
      rowMeta.work_type || null,
      rowMeta.work_type2 || null,
      rowMeta.task_warranty || null,
      rowMeta.task_date || null,                    // 물리 컬럼
      rowMeta.start_time || null,
      rowMeta.end_time || null,
      (rowMeta.task_duration ?? null),              // 분(min) 정수
      content,
      JSON.stringify(rowMeta || {}),
    ];

    const [res] = await conn.query(sql, args);
    if (res.insertId) return res.insertId;

    const [found] = await conn.query(
      `SELECT id FROM rag_chunks WHERE src_table = ? AND src_id = ? LIMIT 1`,
      [src_table, String(src_id)]
    );
    return found?.[0]?.id;
  } finally {
    conn.release();
  }
}

/* ---------- rag_embeddings insert ---------- */
async function saveEmbedding(chunk_id, embedding) {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO rag_embeddings (chunk_id, dims, embedding) VALUES (?, ?, ?)`,
      [chunk_id, embedding.length, JSON.stringify(embedding)]
    );
  } finally {
    conn.release();
  }
}

/* ---------- 코사인 유사도 ---------- */
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

/* ---------- 후보 임베딩 로딩 ---------- */
/* filters: {equipment_type, site, line, days} */
async function fetchAllEmbeddings({ filters = {}, limit = 2000 } = {}) {
  const conn = await pool.getConnection();
  try {
    const where = [
      // ⛔ JSON_VALID 제거 (MariaDB/버전 호환 위해)
      'e.embedding IS NOT NULL',
      'c.content IS NOT NULL',
      "c.content <> ''"
    ];
    const args = [];

    if (filters.equipment_type) { where.push('c.equipment_type = ?'); args.push(filters.equipment_type); }
    if (filters.site)           { where.push('c.site = ?');            args.push(filters.site); }
    if (filters.line)           { where.push('c.line = ?');            args.push(filters.line); }

    // ✅ task_date가 NULL인 것도 통과 (구버전/초기 데이터 구제)
    if (filters.days && Number(filters.days) > 0) {
      where.push('(c.task_date IS NULL OR c.task_date >= (CURRENT_DATE - INTERVAL ? DAY))');
      args.push(Number(filters.days));
    }

    const sql = `
      SELECT
        e.id   AS emb_id,
        e.chunk_id,
        e.dims,
        e.embedding,
        c.id   AS chunk_row_id,
        c.site,
        c.line,
        c.equipment_type,
        c.equipment_name,
        c.work_type,
        c.work_type2,
        c.task_warranty,
        c.task_date,
        c.content
      FROM rag_embeddings e
      JOIN rag_chunks c ON c.id = e.chunk_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY e.id DESC
      LIMIT ?
    `;
    args.push(Number(limit));

    const [rows] = await conn.query(sql, args);

    const out = [];
    for (const r of rows) {
      let emb = r.embedding;
      if (typeof emb === 'string') {
        try { emb = JSON.parse(emb); } catch { continue; }
      }
      if (!Array.isArray(emb) || emb.length === 0) continue;

      out.push({
        ...r,
        embedding: emb,
      });
    }
    return out;
  } finally {
    conn.release();
  }
}

/* ---------- 구버전 호환 함수 ---------- */
function buildText(row) {
  return buildRowToText(row);
}

async function upsertEmbedding(id, embedding) {
  const chunkId = await upsertChunk({
    src_table: 'work_log',
    src_id: String(id),
    content: '',
    rowMeta: {},
  });
  await saveEmbedding(chunkId, embedding);
  return chunkId;
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
  // 호환
  buildText,
  upsertEmbedding,
  hhmmOrHhmmssToMin,
};
