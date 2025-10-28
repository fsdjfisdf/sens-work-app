// Controller.js
const express = require('express');
const router = express.Router();
const { openai, MODELS } = require('./openai');
const {
  ensureTables,
  fetchWorkLogBatch,
  upsertChunk,
  saveEmbedding,
  fetchAllEmbeddings,
  buildRowToText,
  cosineSimilarity,
} = require('./Dao');

// 테이블 보장 미들웨어 (서버 시작 시 한 번 실행)
ensureTables().catch(err => {
  console.error('[RAG] ensureTables error:', err);
});

// 유틸: OpenAI 임베딩
async function embedTexts(texts) {
  const res = await openai.embeddings.create({
    model: MODELS.embedding,
    input: texts,
  });
  return res.data.map(d => d.embedding);
}

// [POST] /rag/embed-all
// body: { limit?, offset?, whereSql?, params? }
router.post('/rag/embed-all', async (req, res) => {
  try {
    const {
      limit = 200,
      offset = 0,
      whereSql = '',
      params = {},
      srcTable = 'work_log',
    } = req.body || {};

    const rows = await fetchWorkLogBatch({ limit, offset, whereSql, params });

    if (!rows.length) {
      return res.json({ ok: true, message: 'no rows', count: 0 });
    }

    // 텍스트화
    const texts = rows.map(r => buildRowToText(r));

    // 임베딩
    const vectors = await embedTexts(texts);

    // 저장
    let saved = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const chunkId = await upsertChunk({
        src_table: srcTable,
        src_id: r.id ?? String(i + offset),
        content: texts[i],
        rowMeta: {
          site: r.site,
          line: r.line,
          equipment_type: r.equipment_type,
          equipment_name: r.equipment_name,
          work_type: r.work_type,
          work_type2: r.work_type2,
          task_warranty: r.task_warranty,
          start_time: r.start_time,
          end_time: r.end_time,
          task_duration: r.task_duration ?? r.time,
          // 원본 일부 메타도 남김
          status: r.status,
          SOP: r.SOP,
          tsguide: r.tsguide,
          action: r.task_description || r.action,
          cause: r.task_cause || r.cause,
          result: r.task_result || r.result,
          none_time: r.none_time ?? r.none,
          move_time: r.move_time ?? r.move,
        },
      });
      await saveEmbedding(chunkId, vectors[i]);
      saved++;
    }

    res.json({ ok: true, count: saved });
  } catch (err) {
    console.error('[RAG] embed-all error:', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// [POST] /rag/query
// body: { query: string, topK?: number, filters?: { equipment_type?, site?, line? } }
router.post('/rag/query', async (req, res) => {
  try {
    const { query, topK = 5, filters = {} } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    // 쿼리 임베딩
    const [qVec] = await embedTexts([query]);

    // 후보 로딩
    const candidates = await fetchAllEmbeddings({ filters, limit: 3000 });
    if (!candidates.length) {
      return res.json({ ok: true, matches: [] });
    }

    // 유사도 계산 & 정렬
    const ranked = candidates
      .map(c => ({
        ...c,
        score: cosineSimilarity(qVec, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // 응답 정제
    const matches = ranked.map(r => ({
      chunk_id: r.chunk_id,
      score: Number(r.score.toFixed(6)),
      site: r.site, line: r.line,
      equipment_type: r.equipment_type,
      equipment_name: r.equipment_name,
      work_type: r.work_type, work_type2: r.work_type2,
      task_warranty: r.task_warranty,
      content: r.content,
    }));

    res.json({ ok: true, matches });
  } catch (err) {
    console.error('[RAG] query error:', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

module.exports = router;
