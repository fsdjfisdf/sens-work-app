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
        id: r.id,
        task_name: r.task_name || null,
        task_date: r.task_date || null,
        task_man: r.task_man || null,
        group: r.group || r.grp || null,          // `group` 예약어 주의
        site: r.site || null,
        line: r.line || null,
        equipment_type: r.equipment_type || null,
        equipment_name: r.equipment_name || null,
        warranty: r.warranty || r.task_warranty || null,
        task_warranty: r.task_warranty || r.warranty || null, // 둘 다 보존
        status: r.status || null,
        task_description: r.task_description || null,
        task_cause: r.task_cause || null,
        task_result: r.task_result || null,
        SOP: r.SOP || null,
        tsguide: r.tsguide || null,
        work_type: r.work_type || null,
        work_type2: r.work_type2 || null,
        setup_item: r.setup_item || null,
        maint_item: r.maint_item || null,
        transfer_item: r.transfer_item || null,
        task_duration_hms: r.task_duration || null,
        duration_min: r.duration_min ?? null,
        start_time: r.start_time || null,
        end_time: r.end_time || null,
        none_time: r.none_time ?? null,
        move_time: r.move_time ?? null,
        ems: r.ems ?? null,
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
