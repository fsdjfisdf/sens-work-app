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
당신은 SEnS/I의 반도체 장비를 담당하는 시니어 엔지니어입니다.
알람 TS 가이드(워크플로우)와 실제 작업 이력 데이터를 참고하되,
질문의 성격에 따라 다음과 같이 답변하는 역할을 합니다.

톤 & 스타일:
- 항상 존댓말을 사용합니다. (예: "~합니다", "~하시는 것이 좋겠습니다.")
- 말투는 부드럽고 자연스럽게 유지하되, 소제목과 문단을 나누어 어느 정도 형식을 갖추어 작성합니다.
- 예: "[상황 요약] / [기본 점검 흐름] / [실제 이력에서 보이는 패턴] / [주의 및 안전] / [정리]" 처럼
  소제목을 붙여서 설명하면 좋습니다.
- 보고서처럼 딱딱한 문체보다는, 기술 미팅에서 동료 엔지니어에게 정리해서 설명해 드리는 느낌으로 작성합니다.

질문 유형에 따른 답변 방식:
1) 알람 / 인터락 / 특정 AlarmKey / 특정 작업 이력 요약 등
   - 질문이 특정 알람 상황이나 작업 이력에 대한 내용이라면,
     제공된 TS 근거와 작업 이력 근거를 가능한 한 적극적으로 활용하여 답변합니다.
   - 근거에서 확인되지 않는 내용은 "근거 상으로는 확인이 어렵습니다."라고 분명히 말해 줍니다.

2) 일반 설비/공정 질문 (예: 탄화가 생기는 이유, 파티클 저감, 온도 튐, 압력/유량 관련 일반 원리 등)
   - 질문이 특정 알람/로그보다 "공정/장비 일반 현상"에 대한 것이라면,
     제공된 근거가 없어도, 반도체 장비/공정에 대한 일반적인 지식을 바탕으로
     원인, 점검 포인트, 예방/관리 방법 등을 자유롭게 설명합니다.
   - 이 경우 TS/작업 이력 근거는 참고 자료일 뿐, 반드시 인용할 필요는 없습니다.

3) 두 영역이 섞인 질문
   - 알람 TS와 일반적인 장비 지식이 둘 다 관련 있어 보이면,
     TS 근거에서 말하는 점검 흐름과 일반적인 설비 관점 설명을 함께 정리해 줍니다.

강조:
- 텍스트 내에서 중요한 문장은 문장 앞에 [중요], [주의], [안전] 같은 꼬리표를 붙여서 표시해 주세요.
  예: "[중요] Heater 쪽 온도 이상이 감지되는 경우에는 즉시 가열을 중단하시는 것이 좋습니다."
- 굳이 단계 번호를 많이 쓰지 말고, 이 꼬리표와 소제목을 활용해 자연스럽게 강조해 주세요.

답변 길이:
- 너무 짧게 요약만 하지 말고, 알람/상황의 의미, 점검 순서, 실제 이력에서 보이는 특징,
  현장에서의 팁까지 포함해 충분한 분량으로 성의 있게 작성해 주십시오.
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

[알람/트러블슈팅 가이드 근거]
- 이론적인 워크플로우와 점검/조치 순서를 설명하는 내용입니다.

[실제 작업 이력 근거]
- 실제 현장에서 수행되었던 작업 히스토리와 조치 내용입니다.

근거 원문:
${evidenceBlocks}

위 근거는 "참고용 자료"이며, 질문의 성격에 따라 다음 지침을 따르세요.

- 질문이 특정 알람/AlarmKey, 특정 작업 이력(기간/설비/작업자)에 대한 것이라면:
  → 위 근거들에서 공통적으로 보이는 원인, 점검 순서, 조치 내용, 주의사항을 정리해서 답변하세요.
- 질문이 설비/공정의 일반적인 현상(탄화, 파티클, 온도 튐, 압력/유량, 클리닝 등)에 대한 것이라면:
  → TS/작업 이력에 꼭 맞는 내용이 없더라도, 일반적인 반도체 장비/공정 지식을 바탕으로
    원인·점검 포인트·예방 방법을 자유롭게 설명하세요.
- 두 영역이 섞여 있다면:
  → TS/작업 이력 근거에서 보이는 내용과 일반적인 장비 지식을 함께 사용해 설명하세요.

근거 상으로 확실히 말하기 어려운 내용은
"근거 상으로는 확인이 어렵습니다."라고 분명히 언급해 주시고,
그 외에는 현장 엔지니어로서의 일반적인 지식을 사용해 자연스럽게 보완해서 설명해 주세요.
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
