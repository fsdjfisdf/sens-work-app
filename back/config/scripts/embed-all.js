require('dotenv').config();
const { pool } = require('../config/database');
const { openai, MODELS } = require('../config/openai');
const { buildText, upsertEmbedding } = require('../src/dao/ragDao');

async function main() {
  // 1) 대상 로우 추출: 최근 1년 + 아직 임베딩 없는 것 우선
  const [rows] = await pool.query(`
    SELECT wl.*
    FROM work_log wl
    LEFT JOIN work_log_embedding we ON we.id = wl.id
    WHERE we.id IS NULL
      AND wl.task_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
    ORDER BY wl.id ASC
    LIMIT 50000
  `);

  console.log('embed target count:', rows.length);
  let ok=0, fail=0;

  for (const row of rows) {
    try {
      const text = buildText(row);
      const embRes = await openai.embeddings.create({
        model: MODELS.embedding,
        input: text
      });
      const emb = embRes.data[0].embedding;
      await upsertEmbedding(row.id, emb);
      ok++;
      if (ok % 100 === 0) console.log('done:', ok);
    } catch (e) {
      fail++;
      console.error('embed fail id=', row.id, e.message);
    }
    // 속도/비용 제어 필요시 setTimeout/배치화 가능
  }

  console.log('done. ok=', ok, 'fail=', fail);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
