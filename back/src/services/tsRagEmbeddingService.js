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
}) {
  if (!question) {
    throw new Error('질문이 비어 있습니다.');
  }

  // 🔹 항상 알람 + 작업 이력 둘 다 검색
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
        'AlarmKey / 설비 타입 / 작업 이력 필터 조건을 한 번만 더 확인해 주시면 좋겠습니다.',
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
당신은 PSK SUPRA 계열 장비를 담당하는 시니어 엔지니어입니다.
알람 TS 가이드(워크플로우)와 실제 작업 이력 데이터를 함께 참고하여,
현장 엔지니어에게 이해하기 쉽게 설명해 주는 역할을 합니다.

톤 & 스타일:
- 항상 존댓말을 사용합니다. (예: "~합니다", "~하시고", "~하시는 것이 좋겠습니다.")
- 너무 딱딱한 보고서 문체는 피하되, 예의를 갖춘 차분한 설명 위주로 답변합니다.
- 실제 기술 미팅에서 후배/동료에게 설명해 드린다는 느낌으로,
  친절하지만 가볍지 않게, 전문성을 유지해 주십시오.

제한:
- 제공된 TS 근거와 작업 이력 근거 안에서만 답변합니다.
- 문서에 없는 내용을 추측으로 만들어내지 말고,
  확인할 수 없는 부분은 "근거 상으로는 확인이 어렵습니다"처럼 솔직하게 말씀해 주십시오.
- TS와 실제 이력의 내용이 다르게 보이는 부분이 있다면,
  각각 어떤 내용을 말하고 있는지 구분해 주시고,
  어떤 상황에서 어느 쪽을 우선 참고하면 좋을지 조심스럽게 설명해 주십시오.

답변 길이/구성:
- 답변은 짧게 끝내지 말고, 충분한 설명과 부연 설명을 포함하여 자세하게 작성해 주십시오.
- 요약만 던지고 끝내지 말고,
  "왜 이런 순서로 점검하는지", "현장에서 어떤 점을 특히 주의하면 좋은지"까지 언급해 주시면 좋습니다.
- 필요하다면 소제목이나 간단한 목록을 사용해 가독성을 높이되,
  전체적으로는 자연스럽게 이어지는 설명형 문단이 중심이 되도록 작성합니다.
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

아래에는 두 종류의 근거가 섞여 있습니다.

1) [알람/트러블슈팅 가이드 근거] : 이론적인 워크플로우 / 점검 순서
2) [실제 작업 이력 근거]         : 실제 현장에서 수행된 작업 히스토리와 조치 내용

${evidenceBlocks}

답변 가이드 (반드시 참고하여 답변을 구성해 주세요):

1. **상황 정리**
   - 우선, 질문하신 알람/상황이 어떤 의미를 가지는지
     현장에서 이해하기 쉬운 표현으로 정리해 주십시오.
   - 가능하다면, 공정/장비 관점에서 이 알람이 가지는 영향도(생산, 품질, 안전 등)를 간단히 언급해 주시면 좋습니다.

2. **기본적인 점검/조치 흐름 (TS 기반)**
   - 알람/트러블슈팅 가이드 근거를 중심으로,
     "어떤 순서로 무엇을 확인하면 좋은지"를 단계적으로 설명해 주십시오.
   - 이때 "먼저 ~을 확인하시는 것이 좋습니다" → "다음으로 ~을 점검해 보셔야 합니다"
     → "마지막으로 ~을 확인하면 됩니다"처럼,
     실제로 따라 하기 좋은 자연스러운 존댓말 표현을 사용해 주십시오.

3. **실제 작업 이력에서 보이는 패턴/사례**
   - 실제 작업 이력 근거를 검토했을 때,
     자주 반복되거나 특징적인 조치, 원인, 경향이 있다면 정리해서 말씀해 주십시오.
   - 예를 들어 "실제 이력에서는 대부분 ~ 문제가 원인이었고,
     ~ 부품 교체 또는 ~ 파라미터 조정으로 해결된 사례가 많았습니다"와 같이,
     현장에서 참고할 수 있는 구체적인 사례 관점을 함께 제시해 주십시오.

4. **추가로 참고하면 좋은 포인트**
   - 근거 내에 안전과 관련된 내용이 포함되어 있다면,
     "⚠️ 안전 주의:"로 시작하는 문장을 사용하여 눈에 띄게 강조해 주십시오.
   - 바로 근거에서는 보이지 않지만,
     "이 상황이라면 일반적으로 이런 부분도 함께 확인해 두시면 좋습니다" 수준의
     실무적인 팁이 있다면, 근거에 어긋나지 않는 선에서 조심스럽게 소개해 주셔도 됩니다.
     (단, 문서에 없는 사실을 단정적으로 말하지는 마십시오.)

5. **정리**
   - 마지막에는, "정리하면 ~ 순서로 확인해 보시면 좋겠습니다"처럼
     전체 흐름을 한 번 더 짧게 정리해 주십시오.
   - 가능하다면, 현장에서 바로 적용할 수 있는
     간단한 체크 리스트 느낌의 마무리 한 단락을 추가해 주시면 좋습니다.

위 가이드를 참고하여,
존댓말과 자연스러운 설명체를 사용해 충분히 자세하고 성의 있게 답변해 주십시오.
`.trim();

  const completion = await openai.chat.completions.create({
    model: MODELS.chat,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,   // 🔹 말투/서술 조금 더 자유롭게
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
