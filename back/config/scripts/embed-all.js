// embed-all.js
const minimist = require('minimist');
const { openai, MODELS } = require('./openai');
const {
  ensureTables,
  fetchWorkLogBatch,
  upsertChunk,
  saveEmbedding,
  buildRowToText,
} = require('./Dao');

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
  const whereSql = argv.where || '';       // e.g. "equipment_type='SUPRA N'"
  const srcTable = argv.src || 'work_log';

  console.log(`[embed-all] start: limit=${limit}, offset=${offset}, where="${whereSql}"`);

  await ensureTables();

  const rows = await fetchWorkLogBatch({
    limit,
    offset,
    whereSql,
    params: {}, // 필요하면 바인딩 변수 추가해서 쓰기
  });

  if (!rows.length) {
    console.log('[embed-all] no rows.');
    return;
  }

  const texts = rows.map(r => buildRowToText(r));

  // 대량 호출 시 100개 이하로 분할 권장
  const BATCH = 100;
  let saved = 0;
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const vecs = await embedTexts(slice);

    for (let j = 0; j < slice.length; j++) {
      const row = rows[i + j];
      const chunkId = await upsertChunk({
        src_table: srcTable,
        src_id: row.id ?? String(offset + i + j),
        content: slice[j],
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
      await saveEmbedding(chunkId, vecs[j]);
      saved++;
    }

    // OpenAI rate-limit 여유
    if (i + BATCH < texts.length) {
      await sleep(500);
    }
  }

  console.log(`[embed-all] done. saved=${saved}`);
}

main().catch(err => {
  console.error('[embed-all] error:', err);
  process.exit(1);
});
