const { pool } = require('../../config/database');

// work_log → 임베딩용 텍스트 만들기
function buildText(row) {
  const parts = [
    row.task_name, row.equipment_type, row.site, row.line,
    row.task_description, row.task_cause, row.task_result,
    row.work_type, row.work_type2, row.setup_item, row.maint_item, row.transfer_item
  ].filter(Boolean);
  return parts.join(' | ').slice(0, 4000);
}

// 임베딩 upsert
async function upsertEmbedding(id, embeddingArray) {
  const placeholders = embeddingArray.map(() => '?').join(',');
  const sql = `
    REPLACE INTO work_log_embedding (id, embedding)
    VALUES (?, JSON_ARRAY(${placeholders}))
  `;
  await pool.query(sql, [id, ...embeddingArray]);
}

// 최근 N건 후보(키워드 프리필터) 조회
async function fetchCandidateRows(keyword, days=365, limit=300) {
  const like = `%${keyword}%`;
  const sql = `
    SELECT wl.id, wl.task_date, wl.task_name, wl.task_man, wl.site, wl.\`line\`,
           wl.equipment_type, wl.task_description, JSON_EXTRACT(wle.embedding, '$') AS emb
    FROM work_log wl
    JOIN work_log_embedding wle ON wle.id = wl.id
    WHERE wl.task_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND (wl.task_name LIKE ? OR wl.task_description LIKE ? OR wl.task_cause LIKE ? OR wl.task_result LIKE ?)
    ORDER BY wl.task_date DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [days, like, like, like, like, limit]);
  return rows;
}

// 특정 id 상세 (근거 표시용)
async function readRowsByIds(ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const sql = `
    SELECT id, task_date, task_name, task_man, site, \`line\`, equipment_type,
           task_description, task_cause, task_result
    FROM work_log
    WHERE id IN (${placeholders})
  `;
  const [rows] = await pool.query(sql, ids);
  return rows;
}

module.exports = {
  buildText,
  upsertEmbedding,
  fetchCandidateRows,
  readRowsByIds
};
