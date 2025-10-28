// back/src/services/ragIngestService.js
const { openai, MODELS } = require('../../config/openai');
const { pool } = require('../../config/database');
const { buildRowToText, upsertChunk, saveEmbedding, hhmmOrHhmmssToMin } = require('../dao/ragDao');

async function embedOneById(id) {
  const [rows] = await pool.query('SELECT * FROM work_log WHERE id = ?', [id]);
  if (!rows.length) return { ok: false, reason: 'not found' };
  const row = rows[0];

  const text = buildRowToText(row);

  const embRes = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text,
  });
  const embedding = embRes.data[0].embedding;

  const chunkId = await upsertChunk({
    src_table: 'work_log',
    src_id: String(id),
    content: text,
    rowMeta: {
      site: row.site,
      line: row.line,
      equipment_type: row.equipment_type,
      equipment_name: row.equipment_name,
      work_type: row.work_type,
      work_type2: row.work_type2,
      task_warranty: row.warranty,               // ✅ 정확 매핑
      task_date: row.task_date || null,          // ✅ 물리 컬럼에도 저장
      task_name: row.task_name || null,
      start_time: row.start_time,
      end_time: row.end_time,
      task_duration: hhmmOrHhmmssToMin(row.task_duration) ?? null, // ✅ 분 단위
      status: row.status,
      SOP: row.SOP,
      tsguide: row.tsguide,
      action: row.task_description,
      cause: row.task_cause,
      result: row.task_result,
      none_time: row.none_time,
      move_time: row.move_time,
    },
  });

  await saveEmbedding(chunkId, embedding);

  return { ok: true, chunkId };
}

module.exports = { embedOneById };
