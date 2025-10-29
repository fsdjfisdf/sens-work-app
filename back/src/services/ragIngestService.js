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
      id: row.id,
      task_name: row.task_name,
      task_date: row.task_date || null,
      task_man: row.task_man,                   // ← 추가
      group: row.group,
      site: row.site,
      line: row.line,
      equipment_type: row.equipment_type,
      equipment_name: row.equipment_name,
      task_warranty: row.warranty,
      status: row.status,
      SOP: row.SOP,
      tsguide: row.tsguide,
      work_type: row.work_type,
      work_type2: row.work_type2,
      setup_item: row.setup_item,
      maint_item: row.maint_item,
      transfer_item: row.transfer_item,
      task_duration: hhmmOrHhmmssToMin(row.task_duration) ?? null,
      start_time: row.start_time,
      end_time: row.end_time,
      none_time: row.none_time,
      move_time: row.move_time,
      ems: row.ems
    },
  });

  await saveEmbedding(chunkId, embedding);
  return { ok: true, chunkId };
}

module.exports = { embedOneById };
