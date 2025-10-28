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
  const srcTable = argv.src || 'work_log';

  console.log(`[embed-all] start: limit=${limit}, offset=${offset}, where="${whereSql}"`);

  await ensureTables();

  const rows = await fetchWorkLogBatch({ limit, offset, whereSql, params: {} });
  if (!rows.length) {
    console.log('[embed-all] no rows.');
    return;
  }

  const texts = rows.map(buildRowToText);

  const BATCH = 100;
  let saved = 0;

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const vecs = await embedTexts(slice);

    for (let j = 0; j < slice.length; j++) {
      const r = rows[i + j];
      const chunkId = await upsertChunk({
  src_table: 'work_log',
  src_id: String(row.id),
  content: buildRowToText(row), // 줄바꿈/요약 포함된 본문
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
    task_duration: row.task_duration ?? row.time ?? null,
    task_date: row.task_date || null,          // ✅ 날짜를 metadata로 저장!
    task_name: row.task_name || null           // (있으면 같이 저장)
  }
});

      await saveEmbedding(chunkId, vecs[j]);
      saved++;
    }

    if (i + BATCH < texts.length) await sleep(500);
  }

  console.log(`[embed-all] done. saved=${saved}`);
}

main().catch(err => {
  console.error('[embed-all] error:', err);
  process.exit(1);
});
