// back/src/services/ragIngestService.js
const { openai, MODELS } = require('../../config/openai'); // 경로 수정
const {
  pool,                // 기존 DB pool: ragDao에서 export
  buildRowToText,
  upsertChunk,
  saveEmbedding,
} = require('../dao/ragDao'); // 경로 수정

async function embedOneById(id) {
  // 1) 원본 로우 로드
  const [rows] = await pool.query('SELECT * FROM work_log WHERE id = ?', [id]);
  if (!rows.length) return { ok: false, reason: 'not found' };
  const row = rows[0];

  // 2) 텍스트화
  const text = buildRowToText(row);

  // 3) OpenAI 임베딩
  const embRes = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text,
  });
  const embedding = embRes.data[0].embedding;

  // 4) 청크 upsert + 임베딩 저장
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
