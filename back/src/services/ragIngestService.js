// back/src/services/ragIngestService.js
const { openai, MODELS } = require('../../config/openai');   // ✅
const { pool } = require('../../config/database');           // ✅
const {
  buildRowToText,
  upsertChunk,
  saveEmbedding,
} = require('../dao/ragDao');                                // ✅

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
      task_warranty: row.task_warranty,
      start_time: row.start_time,
      end_time: row.end_time,
      task_duration: row.task_duration ?? row.time,
      status: row.status,
      SOP: row.SOP,
      tsguide: row.tsguide,
      action: row.task_description || row.action,
      cause: row.task_cause || row.cause,
      result: row.task_result || row.result,
      none_time: row.none_time ?? row.none,
      move_time: row.move_time ?? row.move,
    },
  });

  await saveEmbedding(chunkId, embedding);

  return { ok: true, chunkId };
}

module.exports = { embedOneById };
