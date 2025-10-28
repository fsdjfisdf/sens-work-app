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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const limit = Number(argv.limit || 200);
  const offset = Number(argv.offset || 0);
  const whereSql = argv.where || '';   // 예: "equipment_type='SUPRA N'"

  console.log(`[embed-all] start: limit=${limit}, offset=${offset}, where="${whereSql}"`);

  await ensureTables();

  const rows = await fetchWorkLogBatch({ limit, offset, whereSql, paramsArr: [] });
  if (!rows.length) {
    console.log('[embed-all] no rows.');
    return;
  }

  const texts = rows.map(buildRowToText);

  const BATCH = 100;
  let saved = 0;

  for (let i = 0; i < texts.length; i += BATCH) {
    const sliceTexts = texts.slice(i, i + BATCH);
    const vecs = await embedTexts(sliceTexts);

    for (let j = 0; j < sliceTexts.length; j++) {
      const r = rows[i + j]; // ✅ 올바른 참조
      const chunkId = await upsertChunk({
        src_table: 'work_log',
        src_id: String(r.id),
        content: buildRowToText(r),   // ✅ 항상 본문 채움
        rowMeta: {
          site: r.site,
          line: r.line,
          equipment_type: r.equipment_type,
          equipment_name: r.equipment_name,
          work_type: r.work_type,
          work_type2: r.work_type2,
          task_warranty: r.task_warranty,         // ✅ warranty 매핑
          task_date: r.task_date || null,         // ✅ 물리 컬럼에도 저장
          task_name: r.task_name || null,
          start_time: r.start_time,
          end_time: r.end_time,
          task_duration: r.duration_min ?? null,  // ✅ 분 단위
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

      await saveEmbedding(chunkId, vecs[j]);
      saved++;
      if (saved % 10 === 0) console.log(`✅ ${saved} / ${rows.length}`);
    }

    if (i + BATCH < texts.length) await sleep(300);
  }

  console.log(`[embed-all] done. saved=${saved}`);
}

main().catch(err => {
  console.error('[embed-all] error:', err);
  process.exit(1);
});
