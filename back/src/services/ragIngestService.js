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
      task_name: row.task_name || null,
      task_date: row.task_date || null,
      task_man: row.task_man || null,
      group: row.group || null, // 예약어 주의
      site: row.site || null,
      line: row.line || null,
      equipment_type: row.equipment_type || null,
      equipment_name: row.equipment_name || null,
      warranty: row.warranty || null,
      task_warranty: row.warranty || null,
      status: row.status || null,
      task_description: row.task_description || null,
      task_cause: row.task_cause || null,
      task_result: row.task_result || null,
      SOP: row.SOP || null,
      tsguide: row.tsguide || null,
      work_type: row.work_type || null,
      work_type2: row.work_type2 || null,
      setup_item: row.setup_item || null,
      maint_item: row.maint_item || null,
      transfer_item: row.transfer_item || null,
      task_duration_hms: row.task_duration || null,
      task_duration: hhmmOrHhmmssToMin(row.task_duration) ?? null, // 분 단위
      start_time: row.start_time || null,
      end_time: row.end_time || null,
      none_time: row.none_time ?? null,
      move_time: row.move_time ?? null,
      ems: row.ems ?? null,
     },
  });

  await saveEmbedding(chunkId, embedding);

  return { ok: true, chunkId };
}

module.exports = { embedOneById };
