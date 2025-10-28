// back/src/services/ragIngestService.js (수정본)
const { openai, MODELS } = require('../../scripts/openai');           // <- 경로는 프로젝트 구조에 맞게 조정
const { pool } = require('../../config/database');                     // 기존 DB 풀 유지
const {
  buildRowToText,
  upsertChunk,
  saveEmbedding,
} = require('../../scripts/Dao');                                      // <- Dao 실제 위치에 맞게 조정

async function embedOneById(id) {
  // 1) 원본 로우 로드
  const [rows] = await pool.query('SELECT * FROM work_log WHERE id = ?', [id]);
  if (!rows.length) return { ok: false, reason: 'not found' };
  const row = rows[0];

  // 2) 텍스트화(최신 함수명)
  const text = buildRowToText(row);

  // 3) OpenAI 임베딩
  const embRes = await openai.embeddings.create({
    model: MODELS.embedding,
    input: text,
  });
  const embedding = embRes.data[0].embedding;

  // 4) 청크 upsert + 임베딩 저장(최신 Dao API)
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
