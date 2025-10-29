// back/scripts/embed-all.js
const minimist = require('minimist');
const { openai, MODELS } = require('../config/openai');
const {
  ensureTables,
  fetchWorkLogBatch,
  upsertChunk,
  saveEmbedding,
  buildRowToText,
} = require('../src/dao/ragDao');

async function embedTexts(texts) {
  const res = await openai.embeddings.create({
    model: MODELS.embedding,
    input: texts,
  });
  return res.data.map(d => d.embedding);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const argv = minimist(process.argv.slice(2));
  const batchSize = Number(argv.batch || 500);   // 한 번에 읽을 DB 로우 수
  const whereSql  = argv.where || '';            // 예: "site='PT'"
  let offset = Number(argv.offset || 0);

  console.log('🔹 Embedding build start');
  await ensureTables();

  let total = 0;
  while (true) {
    const rows = await fetchWorkLogBatch({
      limit: batchSize,
      offset,
      whereSql,
      paramsArr: []
    });

    if (!rows.length) break;

    const texts = rows.map(buildRowToText);
    const vecs  = await embedTexts(texts);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const chunkId = await upsertChunk({
        src_table: 'work_log',
        src_id: String(r.id),
        content: buildRowToText(r),  // 본문 채움(줄바꿈 정리 포함)
        rowMeta: {
          // --- 메타: 쿼리에서 가져온 컬럼들 정확히 매핑 ---
          site: r.site,
          line: r.line,
          equipment_type: r.equipment_type,
          equipment_name: r.equipment_name,
          work_type: r.work_type,
          work_type2: r.work_type2,
          task_warranty: r.task_warranty,      // warranty -> task_warranty alias
          task_date: r.task_date || null,      // 물리 task_date
          task_name: r.task_name || null,
          start_time: r.start_time,
          end_time: r.end_time,
          task_duration: r.duration_min ?? null, // 분 단위
          status: r.status,
          SOP: r.SOP,
          tsguide: r.tsguide,
          action: r.task_description,
          cause: r.task_cause,
          result: r.task_result,
          none_time: r.none_time,
          move_time: r.move_time,
        }
      });

      await saveEmbedding(chunkId, vecs[i]);
      total++;
      if (total % 200 === 0) console.log(`✅ ${total} rows embedded...`);
    }

    offset += rows.length;
    await sleep(200); // API 보호
  }

  console.log(`🎉 done. embedded=${total}`);
}

main().catch(err => {
  console.error('[embed-all] error:', err);
  process.exit(1);
});
