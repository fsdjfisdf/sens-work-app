// back/src/dao/ragDao.js
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
        task_date DATE NULL,
        start_time TIME NULL,
        end_time TIME NULL,
        task_duration INT NULL,
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
  const durationMin = row.duration_min ?? hhmmOrHhmmssToMin(row.task_duration);
  const actionText = String(row.task_description || '').replace(/<br\s*\/?>/gi, '\n');

  const lines = [
    `[BASIC] id=${row.id ?? ''}`,
    `[TASK] name=${row.task_name || ''}, date=${row.task_date || ''}, man=${row.task_man || ''}`,
    `[ORG] group=${row.grp || row.group || ''}, site=${row.site || ''}, line=${row.line || ''}`,
    `[EQUIP] type=${row.equipment_type || ''}, name=${row.equipment_name || ''}, warranty=${row.warranty || row.task_warranty || ''}`,
    `[STATUS] ${row.status || ''}, EMS=${row.ems ?? ''}`,
    `[ACTION] ${actionText}`,
    `[CAUSE] ${row.task_cause || ''}`,
    `[RESULT] ${row.task_result || ''}`,
    `[DOC] SOP=${row.SOP || ''} / TS=${row.tsguide || ''}`,
    `[WORK TYPE] ${row.work_type || ''} / ${row.work_type2 || ''}`,
    `[ITEMS] setup=${row.setup_item || ''}, maint=${row.maint_item || ''}, transfer=${row.transfer_item || ''}`,
    `[TIME] duration(min)=${durationMin ?? ''}, start=${row.start_time || ''}, end=${row.end_time || ''}, none(min)=${row.none_time ?? ''}, move(min)=${row.move_time ?? ''}`,
  ];
  return lines.join('\n').trim();
}

/* ---------- 배치 로딩 ---------- */
async function fetchWorkLogBatch({ limit = 100, offset = 0, whereSql = '', paramsArr = [] } = {}) {
  const conn = await pool.getConnection();
  try {
    const sql = `
      SELECT 
        id,
        task_date,
        task_name,
        task_man,
        \`group\` AS \`group\`,
        site, line, equipment_type, equipment_name,
        warranty AS warranty,
        warranty AS task_warranty,
        status,
        task_description, task_cause, task_result,
        SOP, tsguide,
        work_type, work_type2,
        setup_item, maint_item, transfer_item,
        task_duration, start_time, end_time, none_time, move_time,
        ems,
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

/* ---------- upsert ---------- */
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
      rowMeta.task_date || null,
      rowMeta.start_time || null,
      rowMeta.end_time || null,
      (rowMeta.task_duration ?? null),
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

/* ---------- 저장 ---------- */
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

/* ---------- 유사도 ---------- */
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

/* ---------- 후보 조회 (프리필터) ---------- */
async function fetchAllEmbeddings({ filters = {}, limit = 2000 } = {}) {
  const conn = await pool.getConnection();
  try {
    const where = [
      'JSON_VALID(e.embedding) = 1',
      'c.content IS NOT NULL',
      "c.content <> ''"
    ];
    const args = [];

    // 메타 JSON 키 접근 헬퍼
    const j = (k) => `JSON_UNQUOTE(JSON_EXTRACT(c.metadata, '$.${k}'))`;

    // 인덱스/물리 + 메타 병합 필터
    if (filters.equipment_type) { where.push(`COALESCE(c.equipment_type, ${j('equipment_type')}) = ?`); args.push(filters.equipment_type); }
    if (filters.site)           { where.push(`COALESCE(c.site, ${j('site')}) = ?`); args.push(filters.site); }
    if (filters.line)           { where.push(`COALESCE(c.line, ${j('line')}) = ?`); args.push(filters.line); }

    if (filters.group)         { where.push(`${j('group')} = ?`); args.push(filters.group); }
    if (filters.task_man)      { where.push(`${j('task_man')} LIKE ?`); args.push(`%${filters.task_man}%`); }
    if (filters.warranty)      { where.push(`COALESCE(c.task_warranty, ${j('warranty')}) = ?`); args.push(filters.warranty); }
    if (filters.ems != null)   { where.push(`${j('ems')} = ?`); args.push(String(filters.ems)); }
    if (filters.task_name)     { where.push(`${j('task_name')} LIKE ?`); args.push(`%${filters.task_name}%`); }
    if (filters.status)        { where.push(`${j('status')} = ?`); args.push(filters.status); }
    if (filters.work_type)     { where.push(`COALESCE(c.work_type, ${j('work_type')}) = ?`); args.push(filters.work_type); }
    if (filters.work_type2)    { where.push(`COALESCE(c.work_type2, ${j('work_type2')}) = ?`); args.push(filters.work_type2); }
    if (filters.setup_item)    { where.push(`${j('setup_item')} = ?`); args.push(filters.setup_item); }
    if (filters.maint_item)    { where.push(`${j('maint_item')} = ?`); args.push(filters.maint_item); }
    if (filters.transfer_item) { where.push(`${j('transfer_item')} = ?`); args.push(filters.transfer_item); }

    if (filters.days && Number(filters.days) > 0) {
      where.push(`
        COALESCE(
          c.task_date,
          CAST(${j('task_date')} AS DATE)
        ) >= (CURRENT_DATE - INTERVAL ? DAY)
      `);
      args.push(Number(filters.days));
    }

    // 이름 질의면 과거 데이터도 잘 끌어오도록 task_date DESC
    const orderSql = filters.task_man
      ? `ORDER BY COALESCE(c.task_date, CAST(${j('task_date')} AS DATE)) DESC`
      : `ORDER BY e.id DESC`;

    const sql = `
      SELECT
        e.id AS emb_id,
        e.chunk_id,
        e.dims,
        e.embedding,

        c.id AS chunk_row_id,
        c.content,

        COALESCE(c.task_date, CAST(${j('task_date')} AS DATE)) AS task_date,
        COALESCE(c.site, ${j('site')}) AS site,
        COALESCE(c.line, ${j('line')}) AS line,
        COALESCE(c.equipment_type, ${j('equipment_type')}) AS equipment_type,
        COALESCE(c.equipment_name, ${j('equipment_name')}) AS equipment_name,
        COALESCE(c.work_type, ${j('work_type')}) AS work_type,
        COALESCE(c.work_type2, ${j('work_type2')}) AS work_type2
      FROM rag_embeddings e
      JOIN rag_chunks c ON c.id = e.chunk_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ${orderSql}
      LIMIT ?
    `;
    args.push(Number(limit));

    const [rows] = await conn.query(sql, args);
    return rows
      .map(r => ({
        ...r,
        embedding: typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding
      }))
      .filter(r => Array.isArray(r.embedding));
  } finally {
    conn.release();
  }
}

/* ---------- 구버전 호환 ---------- */
function buildText(row) { return buildRowToText(row); }

/** 단순 삽입용 (행 내용 없이 벡터만 추가해야 할 때) */
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
  buildText,
  upsertEmbedding,
  hhmmOrHhmmssToMin,
};
