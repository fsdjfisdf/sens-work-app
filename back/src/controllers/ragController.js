// back/src/controllers/ragController.js
const { openai, MODELS } = require('../../config/openai');
const {
  ensureTables,
  fetchWorkLogBatch,
  upsertChunk,
  saveEmbedding,
  fetchAllEmbeddings,
  buildRowToText,
  cosineSimilarity,
} = require('../dao/ragDao');

// 서버 시작 후 1회 스키마 보장
ensureTables().catch(err => console.error('[RAG] ensureTables error:', err));

async function embedTexts(texts) {
  const res = await openai.embeddings.create({
    model: MODELS.embedding,
    input: texts,
  });
  return res.data.map(d => d.embedding);
}

/** POST /api/rag/embed-all */
async function embedAll(req, res) {
  try {
    const {
      limit = 200,
      offset = 0,
      whereSql = '',
      params = {},
      srcTable = 'work_log',
    } = req.body || {};

    const rows = await fetchWorkLogBatch({ limit, offset, whereSql, params });
    if (!rows.length) return res.json({ ok: true, message: 'no rows', count: 0 });

    const texts = rows.map(buildRowToText);
    const BATCH = 100;
    let saved = 0;

    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const vecs = await embedTexts(slice);

      for (let j = 0; j < slice.length; j++) {
        const r = rows[i + j];
        const chunkId = await upsertChunk({
          src_table: srcTable,
          src_id: r.id ?? String(offset + i + j),
          content: slice[j],
          rowMeta: {
            site: r.site, line: r.line,
            equipment_type: r.equipment_type, equipment_name: r.equipment_name,
            work_type: r.work_type, work_type2: r.work_type2,
            task_warranty: r.task_warranty,
            start_time: r.start_time, end_time: r.end_time,
            task_duration: r.task_duration ?? r.time,
            status: r.status, SOP: r.SOP, tsguide: r.tsguide,
            action: r.task_description || r.action,
            cause: r.task_cause || r.cause,
            result: r.task_result || r.result,
            none_time: r.none_time ?? r.none,
            move_time: r.move_time ?? r.move,
          },
        });
        await saveEmbedding(chunkId, vecs[j]);
        saved++;
      }
    }

    res.json({ ok: true, count: saved });
  } catch (err) {
    console.error('[RAG] embed-all error:', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

/** POST /api/rag/query */
async function query(req, res) {
  try {
    const { query, topK = 5, filters = {} } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ ok: false, error: 'query is required' });
    }

    const [qVec] = await embedTexts([query]);

    const candidates = await fetchAllEmbeddings({ filters, limit: 3000 });
    const ranked = candidates
      .map(c => ({ ...c, score: cosineSimilarity(qVec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const matches = ranked.map(r => ({
      chunk_id: r.chunk_id,
      score: Number(r.score.toFixed(6)),
      site: r.site, line: r.line,
      equipment_type: r.equipment_type, equipment_name: r.equipment_name,
      work_type: r.work_type, work_type2: r.work_type2,
      task_warranty: r.task_warranty,
      content: r.content,
    }));

    res.json({ ok: true, matches });
  } catch (err) {
    console.error('[RAG] query error:', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

/** POST /api/rag/ask  (프런트 rag.js가 기대하는 응답 형태) */
async function ask(req, res) {
  try {
    const {
      question,
      days = 365,
      prefilterLimit = 300,
      topK = 20,
      filters = {},
    } = {
      question: req.body?.question || req.body?.query,
      days: req.body?.days,
      prefilterLimit: req.body?.prefilterLimit,
      topK: req.body?.topK,
      filters: req.body?.filters || {},
    };

    if (!question || !String(question).trim()) {
      return res.status(400).json({ ok: false, error: 'question is required' });
    }

    // 1) 프리필터로 후보 로딩
    const candidates = await fetchAllEmbeddings({ filters, limit: prefilterLimit });

    // 2) 질문 임베딩
    const [qVec] = await embedTexts([question]);

    // 3) 유사도 TopK 선별
    const ranked = candidates
      .map(c => ({
        ...c,
        score: cosineSimilarity(qVec, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // 4) 프롬프트 구성
    const contextBlocks = ranked.map((r, i) =>
      `#${i + 1} (${(r.score || 0).toFixed(3)}) [${r.site || ''}/${r.line || ''}] ${r.equipment_type || ''} ${r.equipment_name || ''}\n${r.content}`
    ).join('\n\n---\n\n');

    const prompt = [
      '다음은 반도체 현장 작업 로그의 요약 자료입니다.',
      '사용자 질문에 대해 아래 컨텍스트만 근거로 삼아, 한국어로 간결하고 정확히 답하세요.',
      '근거가 부족하면 부족하다고 분명히 말하고, 추가 확인이 필요한 포인트를 제시하세요.',
      '',
      '### 질문',
      question,
      '',
      '### 컨텍스트',
      contextBlocks || '(관련 컨텍스트 없음)',
    ].join('\n');

    // 5) LLM 요약/답변
    const chat = await openai.chat.completions.create({
      model: MODELS.chat,
      messages: [
        { role: 'system', content: '당신은 반도체 장비 현장 로그를 근거로 정확히 답하는 어시스턴트입니다.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const answer = chat.choices?.[0]?.message?.content?.trim() || '';

    // 6) 근거 미리보기 테이블 (프런트 rag.js가 렌더)
    const evidence_preview = ranked.map((r, idx) => ({
      id: r.chunk_id,
      date: '', // 원본에 날짜 컬럼이 없으니 비워둠(원하면 rag_chunks.metadata에 task_date도 저장 가능)
      site: r.site,
      line: r.line,
      eq: [r.equipment_type, r.equipment_name].filter(Boolean).join(' '),
      sim: r.score,
      name: `${r.work_type || ''}/${r.work_type2 || ''} ${r.task_warranty || ''}`.trim(),
      desc: r.content.slice(0, 120).replace(/\n+/g, ' ') + (r.content.length > 120 ? '…' : ''),
    }));

    res.json({
      ok: true,
      answer,
      evidence_preview,
      used: { model: { chat: MODELS.chat, embedding: MODELS.embedding } },
    });
  } catch (err) {
    console.error('[RAG] ask error:', err);
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

module.exports = { embedAll, query, ask };
