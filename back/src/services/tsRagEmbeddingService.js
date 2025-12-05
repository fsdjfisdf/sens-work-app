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
      source_type: 'ALARM_STEP', // 🔹 구분용
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
/*  최종 답변 생성 (ALARM / WORK_LOG 동시 활용)                       */
/* ------------------------------------------------------------------ */

async function answerQuestion({
  question,
  equipment_type, // 알람 필터
  alarm_key, // 알람 필터

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

  // 🔹 1) 유사도 기반 모드 판단 (alarm / worklog / mixed)
  const bestAlarmScore = alarmHits[0]?.score ?? 0;
  const bestWorkScore = workHits[0]?.score ?? 0;

  // margin: 어느 정도 차이가 날 때 “이 쪽이 더 가깝다”고 인정할지
  const MARGIN = 0.05;
  const MIN_GOOD_SCORE = 0.3;

  let answerMode = 'mixed'; // 기본값

  if (bestWorkScore >= MIN_GOOD_SCORE && bestWorkScore - bestAlarmScore > MARGIN) {
    answerMode = 'worklog';
  } else if (bestAlarmScore >= MIN_GOOD_SCORE && bestAlarmScore - bestWorkScore > MARGIN) {
    answerMode = 'alarm';
  } else {
    answerMode = 'mixed';
  }

  // 🔹 알람 TS 근거 텍스트
  let alarmEvidence;
  if (!alarmHits.length) {
    alarmEvidence = '- 관련 알람/트러블슈팅 TS 근거를 찾지 못했습니다.';
  } else if (answerMode === 'worklog' && bestAlarmScore < bestWorkScore - MARGIN) {
    // 작업 이력 쪽이 훨씬 강할 때는 알람은 참고용으로만 짧게
    alarmEvidence =
      '- 이번 질문에서는 작업 이력과 직접적으로 연결된 패턴이 더 강하게 나타나며,\n' +
      '  알람 TS 근거는 참고 수준으로만 활용 가능합니다.\n\n' +
      alarmHits
        .slice(0, 2)
        .map((h, idx) =>
          [
            `[#A${idx + 1}] ${h.title || ''}`,
            `- AlarmKey: ${h.alarm_key}`,
            `- CASE / STEP: ${h.case_no} / ${h.step_no}`,
            `- Equipment: ${h.equipment_type}`,
          ].join('\n'),
        )
        .join('\n\n');
  } else {
    // 일반적인 경우: 상세 제공
    alarmEvidence = alarmHits
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
      .join('\n\n----------------------------------------\n\n');
  }

  // 🔹 작업 이력 근거 텍스트
  let workEvidence;
  if (!workHits.length) {
    workEvidence = '- 조건에 맞는 실제 작업 이력 근거를 찾지 못했습니다.';
  } else if (answerMode === 'alarm' && bestAlarmScore > bestWorkScore + MARGIN) {
    // 알람 쪽이 훨씬 강할 때는 작업 이력은 사례 위주로 짧게
    workEvidence =
      '- 이번 질문에서는 TS 워크플로우와 직접 연결되는 알람 근거가 더 강하게 나타나며,\n' +
      '  실제 작업 이력은 참고용 사례로 일부만 활용됩니다.\n\n' +
      workHits
        .slice(0, 2)
        .map((h, idx) =>
          [
            `[#W${idx + 1}] ${h.title || ''}`,
            `- DATE: ${h.task_date || ''}`,
            `- EQUIP: ${h.equipment_type || ''} - ${h.equipment_name || ''}`,
            `- WORK_TYPE: ${h.work_type || ''}`,
          ].join('\n'),
        )
        .join('\n\n');
  } else {
    // 일반적인 경우: 상세 제공
    workEvidence = workHits
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
      .join('\n\n----------------------------------------\n\n');
  }

  // 🔹 evidenceBlocks 순서도 모드에 따라 변경
  let evidenceBlocks;
  if (answerMode === 'worklog') {
    evidenceBlocks = `
[실제 작업 이력 근거(우선)]
${workEvidence}

========================================

[알람/트러블슈팅 가이드 근거(참고)]
${alarmEvidence}
`.trim();
  } else if (answerMode === 'alarm') {
    evidenceBlocks = `
[알람/트러블슈팅 가이드 근거(우선)]
${alarmEvidence}

========================================

[실제 작업 이력 근거(참고)]
${workEvidence}
`.trim();
  } else {
    // mixed
    evidenceBlocks = `
[알람/트러블슈팅 가이드 근거]
${alarmEvidence}

========================================

[실제 작업 이력 근거]
${workEvidence}
`.trim();
  }

  const systemPrompt = `
당신은 SEnS/I의 반도체 장비를 담당하는 시니어 엔지니어입니다.
알람 TS 가이드(워크플로우), 실제 작업 이력, 부품 교체 기록 등을 함께 참고하여,
현장 엔지니어의 "질문 의도"를 우선해서 답변해 주는 역할을 합니다.

가장 중요한 원칙:
- 사용자가 무엇을 묻는지(알람 설명인지, 교체 방법인지, 일반 현상인지)를 먼저 파악합니다.
- 질문이 "GBB 교체 방법", "Manometer 교체 절차", "PDB 점검 순서"처럼
  특정 부품/작업의 방법을 묻는 경우에는,
  **알람 이름을 앞에 내세우지 말고, 부품 기준으로 작업 절차를 중심**으로 설명합니다.
- 알람 정보는 "참고로 이러한 알람에서 자주 언급되는 부품입니다." 정도의
  **보조 설명**으로만 사용합니다.

질문 분류에 대한 가이드:
- 질문 안에 "알람", "Alarm", "TIMEOUT", "COM Error", "Interlock" 등의 단어가 있으면
  → 알람/이상 상황 중심 질문일 가능성이 큽니다.
- 질문 안에 "교체", "교환", "방법", "순서", "절차", "어떻게 해", "어떻게 해야 돼"
  같은 표현이 있고 특정 부품이나 작업 이름이 있다면
  → **부품 교체/작업 방법** 중심 질문으로 간주합니다.
- 이 두 가지가 동시에 섞여 있는 경우에는
  → "질문 의도"를 기준으로, 사용자가 실제로 알고 싶어하는 쪽(예: 교체 작업)을
     먼저 충분히 설명한 뒤, 필요하면 알람과의 연관성을 보충 설명합니다.

톤 & 스타일:
- 항상 존댓말을 사용합니다. (예: "~합니다", "~하시는 것이 좋겠습니다.")
- 말투는 부드럽고 자연스럽게 유지하되, 소제목과 문단을 나누어 어느 정도 형식을 갖추어 작성합니다.
- 예를 들어 상황에 따라 다음과 같이 구성할 수 있습니다.
  - 교체/작업 질문: "[작업 개요] / [교체 전 점검 사항] / [교체 절차] / [주의 및 안전] / [정리]"
  - 알람 질문:     "[상황 요약] / [기본 점검 흐름] / [실제 이력에서 보이는 패턴] / [주의 및 안전] / [정리]"
- 보고서처럼 딱딱한 문체보다는, 기술 미팅에서 동료 엔지니어에게 정리해서 설명해 드리는 느낌으로 작성합니다.
- 불필요하게 긴 단계 번호(1., 2., 3.)를 남발하지 말고,
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

형식에 대한 추가 규칙:
- **첫 문장은 가능하면 특정 알람 이름으로 시작하지 마십시오.**
  - 예: "이번 알람은 Gas Exhaust 알람입니다." (X)
  - 예: "이번 질문은 GBB 모듈 교체 작업에 대한 것입니다." (O)
- 특히 사용자가 "교체 방법"을 물어보는 경우에는,
  알람 이름을 제목처럼 쓰지 말고, 부품/작업 중심으로 설명을 시작해 주십시오.

답변 길이:
- 너무 짧게 요약만 하지 말고, 사용자의 질문 의도를 기준으로
  작업 절차, 점검 순서, 실제 이력에서 보이는 특징, 현장에서의 팁까지 포함해
  충분한 분량으로 성의 있게 작성해 주십시오.
`.trim();

  const userPrompt = `
질문:
${question}

현재 검색 결과 요약(모델 참고용):
- 우선 모드(answerMode): ${answerMode}
- 알람 TS 최고 유사도: ${bestAlarmScore.toFixed(3)}
- 작업 이력 최고 유사도: ${bestWorkScore.toFixed(3)}

질문 해석 가이드(모델이 스스로 참고할 내용):
- 위 "질문" 문자열을 보고, 이것이
  ① 알람 설명 중심인지,
  ② 특정 부품/작업의 교체·점검 방법인지,
  ③ 일반적인 현상/상황 질문인지
  먼저 판단해 주십시오.
- 만약 "교체", "교환", "방법", "절차", "순서", "어떻게 해" 등이 들어 있고
  특정 부품이나 모듈 이름(예: GBB, PDB, Manometer 등)이 있다면,
  **부품 교체/작업 절차**를 중심으로 답변을 구성해 주십시오.
- 이 경우에는 알람 이름을 앞에 내세우지 말고,
  "이번 질문은 ○○ 부품의 교체 작업에 대한 것입니다."처럼 시작해 주십시오.

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

[알람/트러블슈팅 가이드 근거]
- 이론적인 워크플로우와 점검/조치 순서를 설명하는 내용입니다.

[실제 작업 이력 근거]
- 실제 현장에서 수행되었던 작업 히스토리와 조치 내용입니다.

근거 원문:
${evidenceBlocks}

위 근거만을 사용하여, "질문 의도"에 맞게 자연스럽고 형식을 갖춘 설명을 작성해 주십시오.

예시 구성 (질문 유형에 맞게 적절히 선택해서 사용):
1) 부품 교체/작업 방법 질문일 때:
- [작업 개요]: 어떤 부품/모듈에 대한 작업인지, 어떤 상황에서 주로 교체되는지 간단히 설명합니다.
- [교체 전 점검 사항]: 전원 차단, 가스/배기 상태, 인터락, 관련 케이블·커넥터 확인 등
  교체 전에 반드시 확인해야 할 사항을 정리합니다.
- [교체 절차]: 현장에서 따라가기 쉬운 순서로 교체 방법을 설명합니다.
  (필요 시 "먼저 ~을 확인하시는 것이 좋습니다.", "다음으로 ~을 탈착/장착합니다."처럼 서술형으로 적어 주십시오.)
- [주의 및 안전]: 안전과 직결되는 부분이 있다면 문장 앞에 [안전] 또는 [주의] 꼬리표를 붙여 강조해 주십시오.
- [정리]: 현장에서 바로 적용할 수 있도록 핵심 포인트를 짧게 정리합니다.

2) 알람 설명/트러블슈팅 질문일 때:
- [상황 요약]: 이번 알람/상황이 장비·공정 관점에서 어떤 의미를 가지는지 정리합니다.
- [기본 점검 흐름]: 알람 TS 근거를 토대로, 점검·조치 흐름을 서술형으로 정리합니다.
- [실제 이력에서 보이는 패턴]: 작업 이력 근거의 공통 패턴을 설명합니다.
- [주의 및 안전], [정리]: 위와 동일한 방식으로 작성합니다.

중요한 문장은 문장 앞에 [중요], [주의], [안전] 꼬리표를 붙이는 방식으로 강조해 주시고,
근거로 확인되지 않는 내용은 임의로 만들어내지 말고 "근거 상으로는 확인이 어렵습니다."라고 명시해 주십시오.
`.trim();

  const completion = await openai.chat.completions.create({
    model: MODELS.chat,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4, // 🔹 말투/서술 조금 더 자유롭게
  });

  const answer = completion.choices[0]?.message?.content ?? '';

  // 🔹 프론트에서 한 번에 볼 수 있도록 hits 병합 + 유사도 기준 정렬
  const mergedHits = [
    ...alarmHits.map((h) => ({ ...h, source_type: h.source_type || 'ALARM_STEP' })),
    ...workHits.map((h) => ({ ...h, source_type: h.source_type || 'WORK_LOG' })),
  ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

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
