// back/src/services/tsRagEmbeddingService.js
const { openai, MODELS } = require('../../config/openai');
const dao = require('../dao/tsRagDao');

// 🔧 코사인 유사도 계산
function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// 🔹 아직 임베딩 없는 rag_chunks에 대해 임베딩 생성
//    (ALARM_STEP, WORK_LOG 구분 없이 모든 chunk 대상으로 생성)
async function buildMissingEmbeddings({ batchSize = 50 } = {}) {
  const chunks = await dao.findChunksWithoutEmbedding(batchSize);
  if (!chunks.length) {
    return { created: 0, message: '생성할 임베딩이 없습니다.' };
  }

  const inputs = chunks.map((c) => c.content || '');

  const resp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: inputs,
  });

  const dim = resp.data[0]?.embedding?.length || 0;

  for (let i = 0; i < resp.data.length; i++) {
    const emb = resp.data[i].embedding;
    const chunk = chunks[i];
    await dao.insertEmbedding({
      chunkId: chunk.id,
      model: MODELS.embedding,
      dim,
      vector: emb,
    });
  }

  return {
    created: chunks.length,
    model: MODELS.embedding,
    dim,
  };
}

/* ------------------------------------------------------------------ */
/*  ALARM_STEP 기반 검색 (기존 알람 RAG)                              */
/* ------------------------------------------------------------------ */

async function searchSimilarSteps({
  question,
  equipment_type,
  alarm_key,
  topK = 5,
  candidateLimit = 300,
}) {
  if (!question) {
    throw new Error('질문이 비어 있습니다.');
  }

  const embResp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: [question],
  });
  const qVec = embResp.data[0].embedding;

  const candidates = await dao.fetchEmbeddingsWithMeta({
    equipment_type,
    alarm_key,
    limit: candidateLimit,
  });

  if (!candidates.length) {
    return { hits: [], questionEmbeddingDim: qVec.length };
  }

  const scored = candidates.map((row) => {
    let vec;
    if (Buffer.isBuffer(row.embedding)) {
      vec = JSON.parse(row.embedding.toString('utf8'));
    } else if (typeof row.embedding === 'string') {
      vec = JSON.parse(row.embedding);
    } else {
      vec = row.embedding;
    }

    const score = cosineSimilarity(qVec, vec);

    return {
      score,
      source_type: 'ALARM_STEP',  // 🔹 구분용
      chunk_id: row.chunk_id,
      alarm_key: row.alarm_key,
      case_no: row.case_no,
      step_no: row.step_no,
      equipment_type: row.equipment_type,
      alarm_group: row.alarm_group,
      module_main: row.module_main,
      title: row.title,
      content: row.content,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topHits = scored.slice(0, topK);

  return {
    hits: topHits,
    questionEmbeddingDim: qVec.length,
  };
}

/* ------------------------------------------------------------------ */
/*  WORK_LOG 기반 검색                                                */
/* ------------------------------------------------------------------ */

async function searchSimilarWorkLogs({
  question,
  task_date,
  date_from,
  date_to,
  equipment_name,
  worker_name,
  group_name,
  site,
  work_type,
  setup_item,
  transfer_item,
  topK = 5,
  candidateLimit = 300,
}) {
  if (!question) {
    throw new Error('질문이 비어 있습니다.');
  }

  // 1) 질문 임베딩
  const embResp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: [question],
  });
  const qVec = embResp.data[0].embedding;

  // 2) 후보 가져오기 (필터 포함)
  const candidates = await dao.fetchWorkLogEmbeddingsWithMeta({
    task_date,
    date_from,
    date_to,
    equipment_name,
    worker_name,
    group_name,
    site,
    work_type,
    setup_item,
    transfer_item,
    limit: candidateLimit,
  });

  if (!candidates.length) {
    return { hits: [], questionEmbeddingDim: qVec.length };
  }

  // 3) 코사인 유사도 계산
  const scored = candidates.map((row) => {
    let vec;
    if (Buffer.isBuffer(row.embedding)) {
      vec = JSON.parse(row.embedding.toString('utf8'));
    } else if (typeof row.embedding === 'string') {
      vec = JSON.parse(row.embedding);
    } else {
      vec = row.embedding;
    }

    const score = cosineSimilarity(qVec, vec);

    return {
      score,
      chunk_id: row.chunk_id,
      source_type: row.source_type,
      src_table: row.src_table,
      src_id: row.src_id,
      equipment_type: row.equipment_type,
      equipment_name: row.equipment_name,
      workers_clean: row.workers_clean,
      group_name: row.group_name,
      site: row.site,
      line: row.line,
      task_date: row.task_date,
      setup_item: row.setup_item,
      transfer_item: row.transfer_item,
      work_type: row.work_type,
      status_short: row.status_short,
      duration_min: row.duration_min,
      title: row.title,
      content: row.content,
    };
  });

  // 4) 상위 K개
  scored.sort((a, b) => b.score - a.score);
  const topHits = scored.slice(0, topK);

  return {
    hits: topHits,
    questionEmbeddingDim: qVec.length,
  };
}

/* ------------------------------------------------------------------ */
/*  최종 답변 생성 (ALARM / WORK_LOG 모드)                             */
/* ------------------------------------------------------------------ */

async function answerQuestion({
  question,
  equipment_type,  // 알람 필터
  alarm_key,       // 알람 필터

  // WORK_LOG 필터
  task_date,
  date_from,
  date_to,
  equipment_name,
  worker_name,
  group_name,
  site,
  work_type,
  setup_item,
  transfer_item,

  // 공통
  topK = 5,
  candidateLimit = 300,
  // 🔹 mode 제거
}) {
  if (!question) {
    throw new Error('질문이 비어 있습니다.');
  }

  // 🔹 항상 알람 + 작업이력 둘 다 검색
  const [stepResult, logResult] = await Promise.all([
    searchSimilarSteps({
      question,
      equipment_type,
      alarm_key,
      topK,
      candidateLimit,
    }),
    searchSimilarWorkLogs({
      question,
      task_date,
      date_from,
      date_to,
      equipment_name,
      worker_name,
      group_name,
      site,
      work_type,
      setup_item,
      transfer_item,
      topK,
      candidateLimit,
    }),
  ]);

  const alarmHits = stepResult.hits || [];
  const workHits = logResult.hits || [];

  if (!alarmHits.length && !workHits.length) {
    return {
      answer:
        '알람 TS 가이드와 작업 이력 모두에서 관련된 데이터를 찾지 못했습니다.\n' +
        'AlarmKey / 설비 타입 / 작업 이력 필터 조건을 한 번만 더 확인해 주세요.',
      hits: [],
    };
  }

  // 🔹 알람 TS 근거 텍스트
  const alarmEvidence = alarmHits.length
    ? alarmHits
        .map((h, idx) => {
          return [
            `[#A${idx + 1}] ${h.title || ''}`,
            `- AlarmKey: ${h.alarm_key}`,
            `- CASE / STEP: ${h.case_no} / ${h.step_no}`,
            `- Equipment: ${h.equipment_type}`,
            '',
            h.content || '',
          ].join('\n');
        })
        .join('\n\n----------------------------------------\n\n')
    : '- 관련 알람/트러블슈팅 TS 근거를 찾지 못했습니다.';

  // 🔹 작업 이력 근거 텍스트
  const workEvidence = workHits.length
    ? workHits
        .map((h, idx) => {
          return [
            `[#W${idx + 1}] ${h.title || ''}`,
            `- DATE: ${h.task_date || ''}`,
            `- EQUIP: ${h.equipment_type || ''} - ${h.equipment_name || ''}`,
            `- GROUP/SITE/LINE: ${h.group_name || ''} / ${h.site || ''} / ${h.line || ''}`,
            `- WORK_TYPE: ${h.work_type || ''}`,
            `- SETUP_ITEM: ${h.setup_item || ''}`,
            `- TRANSFER_ITEM: ${h.transfer_item || ''}`,
            '',
            h.content || '',
          ].join('\n');
        })
        .join('\n\n----------------------------------------\n\n')
    : '- 조건에 맞는 실제 작업 이력 근거를 찾지 못했습니다.';

  const evidenceBlocks = `
[알람/트러블슈팅 가이드 근거]
${alarmEvidence}

========================================

[실제 작업 이력 근거]
${workEvidence}
`.trim();

  const systemPrompt = `
너는 PSK SUPRA 계열 장비를 담당하는 시니어 엔지니어이고,
알람 TS 가이드와 실제 작업 이력을 모두 참고해서 후배에게 설명해 주는 역할이다.

톤 & 스타일:
- 실제 현장에서 후배랑 같이 설비 앞에 서서 얘기하듯이, 자연스럽고 편한 한국어로 설명한다.
- 꼭 보고서 형식으로 1), 2) 이런 목차를 맞출 필요는 없고,
  문단 위주로 설명하되, 필요한 부분만 간단히 bullet을 섞는다.
- "먼저 ~", "그 다음에는 ~", "실제 사례를 보면 ~" 같은 표현을 적절히 사용해서 흐름을 만들어 준다.

제한:
- 제공된 TS 근거와 작업 이력 근거 안에서만 답한다.
- 근거가 없는 내용은 지어내지 말고, "근거 상으로는 확인되지 않는다"라고 말한다.
- TS와 실제 이력이 조금 다르게 말하는 부분이 있으면,
  두 내용을 함께 소개하고 어떤 상황에 어떤 접근이 더 맞을지 조심스럽게 설명한다.
`.trim();

  const userPrompt = `
질문:
${question}

조건(참고용):
- 설비 타입(equipment_type): ${equipment_type || '(지정 없음)'}
- AlarmKey: ${alarm_key || '(지정 없음)'}
- 작업 이력 필터: 
  - 날짜: ${task_date || `${date_from || ''} ~ ${date_to || ''}`}
  - 설비 이름: ${equipment_name || '(지정 없음)'}
  - 작업자: ${worker_name || '(지정 없음)'}
  - 그룹/사이트: ${group_name || '(지정 없음)'} / ${site || '(지정 없음)'}
  - 작업 타입: ${work_type || '(지정 없음)'}
  - SETUP_ITEM: ${setup_item || '(없음)'}
  - TRANSFER_ITEM: ${transfer_item || '(없음)'}

아래에는 두 종류의 근거가 섞여 있다.

1) [알람/트러블슈팅 가이드 근거] : 이론적인 워크플로우 / 점검 순서
2) [실제 작업 이력 근거]         : 실제 현장에서 있었던 작업 히스토리/조치 내용

${evidenceBlocks}

답변 가이드:
- 먼저 이번 알람/상황이 어떤 의미인지 간단히 정리해 주고,
- 알람 TS 근거를 기반으로 "기본적인 점검/조치 순서"를 정리해 준다.
- 이어서, 실제 작업 이력에서 보이는 패턴이나 팁이 있으면
  "실제 현장 사례" 형식으로 자연스럽게 덧붙인다.
- 안전 관련 내용이 보이면 "⚠️ 안전 주의:"로 시작해서 눈에 띄게 따로 강조한다.
- 전체적으로 후배 엔지니어에게 조언하듯이, 너무 딱딱하지 않게 작성해라.
`.trim();

  const completion = await openai.chat.completions.create({
    model: MODELS.chat,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.35,   // 말투 조금 자유롭게
  });

  const answer = completion.choices[0]?.message?.content ?? '';

  // 🔹 프론트에서 한 번에 볼 수 있도록 hits 병합
  const mergedHits = [
    ...alarmHits.map((h) => ({ ...h, source_type: h.source_type || 'ALARM_STEP' })),
    ...workHits.map((h) => ({ ...h, source_type: h.source_type || 'WORK_LOG' })),
  ];

  return {
    answer,
    hits: mergedHits,
  };
}

module.exports = {
  buildMissingEmbeddings,
  searchSimilarSteps,
  searchSimilarWorkLogs,
  answerQuestion,
};
