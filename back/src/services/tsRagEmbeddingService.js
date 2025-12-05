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
/*  ALARM_STEP 기반 검색 (알람 TS 근거)                                */
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
/*  WORK_LOG 기반 검색 (실제 작업 이력 근거)                          */
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
/*  최종 답변 생성                                                     */
/*  - 전략: "가능하면 항상 WORK_LOG 우선, ALARM은 보조"              */
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

  // 🔹 항상 알람 + 작업 이력 둘 다 검색 (하지만 "설명은 작업 이력 우선")
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

  // 🔹 기본 전략:
  //   - workHits가 하나라도 있으면 → 무조건 "worklog_primary"
  //   - workHits가 전혀 없을 때만 "alarm_primary"
  const bestAlarmScore = alarmHits[0]?.score ?? 0;
  const bestWorkScore  = workHits[0]?.score ?? 0;

  let answerMode = 'worklog_primary';
  if (!workHits.length && alarmHits.length) {
    answerMode = 'alarm_primary';
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

  // 🔹 evidenceBlocks 순서도 "모드"에 따라 바꾼다
  //   - worklog_primary: 작업 이력 → 알람 (작업 이력 먼저 읽게)
  //   - alarm_primary  : 알람 → 작업 이력
  let evidenceBlocks;
  if (answerMode === 'worklog_primary') {
    evidenceBlocks = `
[실제 작업 이력 근거]
${workEvidence}

========================================

[알람/트러블슈팅 가이드 근거]
${alarmEvidence}
`.trim();
  } else {
    evidenceBlocks = `
[알람/트러블슈팅 가이드 근거]
${alarmEvidence}

========================================

[실제 작업 이력 근거]
${workEvidence}
`.trim();
  }

  // 🔹 모드에 따라 모델에게 주는 "힌트"
  const modeHint =
    answerMode === 'worklog_primary'
      ? `
이번 질문에 대해서는 가능한 한 "실제 작업 이력 근거"를 주된 기준으로 답변해 주십시오.
알람/트러블슈팅 TS 근거는 보조적인 참고용으로만 사용하고,
특정 알람 이름이나 코드에 억지로 끼워 맞추지 말아 주십시오.
`.trim()
      : `
이번 질문은 알람/트러블슈팅 TS 근거의 비중이 상대적으로 더 큽니다.
그래도 가능하다면 실제 작업 이력 근거도 함께 참고하여,
현장에서 실제로 어떻게 조치되었는지 관점까지 포함해 정리해 주십시오.
`.trim();

  const systemPrompt = `
당신은 SEnS/I의 반도체 장비를 담당하는 시니어 엔지니어입니다.
알람 TS 가이드(워크플로우)와 실제 작업 이력 데이터를 함께 참고하여,
현장 엔지니어에게 이해하기 쉽게 정리해 주는 역할을 합니다.

${modeHint}

톤 & 스타일:
- 항상 존댓말을 사용합니다. (예: "~합니다", "~하시는 것이 좋겠습니다.")
- 말투는 부드럽고 자연스럽게 유지하되, 소제목과 문단을 나누어 어느 정도 형식을 갖추어 작성합니다.
- 예를 들어 "[상황 요약] / [기본 점검 흐름] / [실제 이력에서 보이는 패턴] / [주의 및 안전] / [정리]"처럼
  소제목을 붙여서 설명해 주시면 좋습니다.
- 보고서처럼 딱딱한 문체보다는, 기술 미팅에서 동료 엔지니어에게 정리해서 설명해 드리는 느낌으로 작성합니다.
- 불필요하게 긴 번호 목록(1., 2., 3. 단계 나열)을 남발하지 말고,
  필요한 경우에만 짧은 단계 설명이나 한두 줄짜리 목록을 사용합니다.

제한:
- 제공된 TS 근거와 작업 이력 근거 안에서만 답변합니다.
- 문서에 없는 내용을 추측으로 만들어내지 말고,
  근거로 확인되지 않는 부분은 "근거 상으로는 확인이 어렵습니다"라고 분명하게 말해 주십시오.
- TS와 실제 이력의 내용이 서로 다르게 보이는 부분이 있다면,
  각각이 어떤 내용을 말하고 있는지 구분해서 설명하고,
  어느 상황에서 어떤 접근을 우선 고려하면 좋을지 조심스럽게 정리해 주십시오.

강조:
- 텍스트 내에서 중요한 문장은 문장 앞에 [중요], [주의], [안전] 같은 꼬리표를 붙여서 표시해 주십시오.
  예: "[중요] Heater 쪽 온도 이상이 감지되는 경우에는 즉시 가열을 중단하시는 것이 좋습니다."
- 굳이 단계 번호를 붙이지 않고, 이 꼬리표와 소제목을 활용해 자연스럽게 강조해 주시면 됩니다.

답변 길이:
- 너무 짧게 요약만 하지 말고, 알람/상황의 의미, 점검 순서, 실제 이력에서 보이는 특징, 현장에서의 팁까지 포함해
  충분한 분량으로 성의 있게 작성해 주십시오.

추가 규칙:
- 어떤 경우에도 답변의 첫 문장을 "이번 알람은 ~ 알람입니다."처럼 특정 알람 이름으로 시작하지 마십시오.
- 질문에 '교체', '교환', '방법', '순서' 등이 포함되어 있으면,
  첫 문장을 "이번 질문은 ○○ 부품(또는 작업)에 대한 것입니다."처럼
  "작업/부품 관점"으로 시작해 주십시오.
`.trim();

  const userPrompt = `
질문:
${question}

답변 모드:
- answerMode: ${answerMode}
- bestAlarmScore: ${bestAlarmScore.toFixed(3)}
- bestWorkScore: ${bestWorkScore.toFixed(3)}

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
- "실제 작업 이력 근거"는 실제 현장에서 수행되었던 작업 히스토리와 조치 내용입니다.
- "알람/트러블슈팅 가이드 근거"는 이론적인 워크플로우와 점검/조치 순서를 설명하는 내용입니다.

근거 원문:
${evidenceBlocks}

위 근거만을 사용하여, 아래와 같은 흐름으로 자연스럽고 형식을 갖춘 설명을 작성해 주십시오.
(소제목 이름은 상황에 맞게 약간 바꾸셔도 괜찮습니다.)

- [상황 요약]: 이번 질문/상황이 장비·공정 관점에서 어떤 의미를 가지는지 간단히 정리합니다.
- [기본 점검 흐름]: 근거들을 토대로, 현장에서 따라가기 쉬운 점검·조치 흐름을
  "먼저 ~을 확인하시는 것이 좋습니다.", "다음으로 ~을 보시면 됩니다."처럼 존댓말로 풀어서 설명합니다.
- [실제 이력에서 보이는 패턴]: 실제 작업 이력 근거에서 공통적으로 보이는 원인·조치 경향이 있다면,
  "실제 이력에서는 주로 ~ 문제가 원인이었고, ~ 방식으로 해결된 사례가 많았습니다."처럼 정리합니다.
- [주의 및 안전]: 안전과 직결되는 부분이 있다면 문장 앞에 [안전] 또는 [주의] 꼬리표를 붙여 강조해 주십시오.
- [정리]: 현장에서 바로 적용할 수 있도록,
  "정리하면, 현장에서는 대략 이런 순서로 확인해 보시면 좋겠습니다."처럼 부드럽게 마무리해 주십시오.

중요한 문장은 문장 앞에 [중요], [주의], [안전] 꼬리표를 붙이는 방식으로 강조해 주시고,
근거로 확인되지 않는 내용은 임의로 만들어내지 말고 "근거 상으로는 확인이 어렵습니다."라고 명시해 주십시오.
`.trim();

  const completion = await openai.chat.completions.create({
    model: MODELS.chat,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
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
