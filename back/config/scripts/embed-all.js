// back/scripts/embed-all.js  (자동 페이징 + days 필터)
const minimist = require('minimist');
const { openai, MODELS } = require('../config/openai');
const {
  ensureTables,
  fetchWorkLogBatch,
  upsertChunk,
  saveEmbedding,
  buildRowToText,
} = require('../src/dao/ragDao');

async function embedBatch(texts){
  const res = await openai.embeddings.create({ model: MODELS.embedding, input: texts });
  return res.data.map(d => d.embedding);
}

async function main(){
  const argv = minimist(process.argv.slice(2));
  const pageSize = Number(argv.pageSize || 500);
  const whereSql = argv.where || '';                     // ex) "task_date >= (CURRENT_DATE - INTERVAL 365 DAY)"
  let offset = Number(argv.offset || 0);

  console.log(`[embed-all] start where="${whereSql}" pageSize=${pageSize}`);

  await ensureTables();

  let totalSaved = 0;
  while(true){
    const rows = await fetchWorkLogBatch({ limit: pageSize, offset, whereSql, paramsArr: [] });
    if(!rows.length){
      console.log(`[embed-all] done. saved=${totalSaved}`);
      break;
    }

    const texts = rows.map(buildRowToText);
    const vecs  = await embedBatch(texts);

    for(let i=0;i<rows.length;i++){
      const r = rows[i];
      const chunkId = await upsertChunk({
        src_table: 'work_log',
        src_id: String(r.id),
        content: texts[i],
        rowMeta: {
          site: r.site,
          line: r.line,
          equipment_type: r.equipment_type,
          equipment_name: r.equipment_name,
          work_type: r.work_type,
          work_type2: r.work_type2,
          task_warranty: r.task_warranty ?? r.warranty ?? null,
          task_date: r.task_date || null,
          task_name: r.task_name || null,
          start_time: r.start_time,
          end_time: r.end_time,
          task_duration: r.duration_min ?? null,
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
      totalSaved++;
      if(totalSaved % 50 === 0) console.log(`✅ saved ${totalSaved} (offset=${offset})`);
    }

    offset += rows.length;
    await new Promise(r=>setTimeout(r, 250)); // API rate cushion
  }
}

main().catch(e=>{ console.error('[embed-all] error:', e); process.exit(1); });
