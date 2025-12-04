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
async function buildMissingEmbeddings({ batchSize = 50 } = {}) {
  const chunks = await dao.findChunksWithoutEmbedding(batchSize);
  if (!chunks.length) {
    return { created: 0, message: '생성할 임베딩이 없습니다.' };
  }

  const inputs = chunks.map((c) => c.content);

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

// 🔹 질문에 대한 유사 Step 검색
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

  // 1) 질문 임베딩 생성
  const embResp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: [question],
  });
  const qVec = embResp.data[0].embedding;

  // 2) 후보 임베딩 + 메타 가져오기
  const candidates = await dao.fetchEmbeddingsWithMeta({
    equipment_type,
    alarm_key,
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

  // 4) 상위 K개 선택
  scored.sort((a, b) => b.score - a.score);
  const topHits = scored.slice(0, topK);

  return {
    hits: topHits,
    questionEmbeddingDim: qVec.length,
  };
}

async function searchSimilarWorkLogs({
  question,
  equipment_type,
  equipment_name,
  worker_name,
  topK = 5,
  candidateLimit = 300,
}) {
  if (!question) {
    throw new Error('질문이 비어 있습니다.');
  }

  // 1) 질문 임베딩 생성
  const embResp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: [question],
  });
  const qVec = embResp.data[0].embedding;

  // 2) 후보 임베딩 + 메타 가져오기 (WORK_LOG 전용)
  const candidates = await dao.fetchWorkLogEmbeddingsWithMeta({
    equipment_type,
    equipment_name,
    worker_name,
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

// 🔹 OpenAI Chat을 사용해 최종 답변 생성
async function answerQuestion({
  question,
  equipment_type,
  alarm_key,
  topK = 5,
  candidateLimit = 300,
  mode, // 'ALARM_ONLY' | 'WORK_LOG_ONLY' | 'MIXED'
}) {
  // 기본 모드 자동 추론
  let effectiveMode = mode;
  if (!effectiveMode) {
    const q = question || '';
    const hasAlarmKey = !!alarm_key;
    const looksLikeAlarm = /알람|alarm/i.test(q);
    const looksLikeHistory = /작업이력|history|로그|log|EPAB\d{3}/i.test(q);
    const looksLikePerson = /정현우|엔지니어|engineer/i.test(q);

    if (hasAlarmKey || looksLikeAlarm) {
      effectiveMode = 'ALARM_ONLY';
    } else if (looksLikeHistory || looksLikePerson) {
      effectiveMode = 'WORK_LOG_ONLY';
    } else {
      effectiveMode = 'MIXED';
    }
  }

  const useAlarm = effectiveMode !== 'WORK_LOG_ONLY';
  const useWorkLog = effectiveMode !== 'ALARM_ONLY';

  let alarmHits = [];
  let workLogHits = [];

  if (useAlarm) {
    ({ hits: alarmHits } = await searchSimilarSteps({
      question,
      equipment_type,
      alarm_key,
      topK,
      candidateLimit,
    }));
  }

  if (useWorkLog) {
    ({ hits: workLogHits } = await searchSimilarWorkLogs({
      question,
      equipment_type,
      topK: 5,
      candidateLimit: 300,
    }));
  }

  if (!alarmHits.length && !workLogHits.length) {
    return {
      answer:
        '관련된 알람/트러블슈팅 Step 또는 작업 이력 데이터를 찾지 못했습니다. 입력하신 조건(equipment_type, AlarmKey 등)을 확인해 주세요.',
      hits: [],
    };
  }

  // 근거 텍스트 블록 만들기
  const alarmEvidenceBlock = alarmHits.length
    ? alarmHits
        .map((h, idx) => {
          return [
            `[#ALARM_${idx + 1}] ${h.title || ''}`,
            `- AlarmKey: ${h.alarm_key || ''}`,
            `- CASE / STEP: ${h.case_no ?? ''} / ${h.step_no ?? ''}`,
            `- Equipment: ${h.equipment_type || ''}`,
            '',
            h.content || '',
          ].join('\n');
        })
        .join('\n\n----------------------------------------\n\n')
    : '(관련 알람 TS 근거 없음)';

  // 🔹 작업이력 근거 블록
  const workLogEvidenceBlock = workLogHits.length
    ? workLogHits
        .map((h, idx) => {
          return [
            `[#LOG_${idx + 1}] ${h.title || ''}`,
            `- Source: ${h.source_type || ''} / ${h.src_table || ''} / ID=${h.src_id ?? ''}`,
            `- Equipment: ${h.equipment_type || ''}`,
            '',
            h.content || '',
          ].join('\n');
        })
        .join('\n\n----------------------------------------\n\n')
    : '(관련 작업 이력 근거 없음)';

  const systemPrompt = `
너는 PSK SUPRA 계열 장비의 알람/트러블슈팅 가이드와 실제 작업 이력을 함께 참고하여 답변하는 엔지니어용 어시스턴트이다.

역할/톤:
- 현장에서 후배 엔지니어에게 설명해주는 "시니어 엔지니어"라고 생각하고, 말투는 자연스럽고 친절한 한국어로 답변한다.
- 문장은 너무 딱딱한 보고서 형식보다는, 이해하기 쉽게 풀어서 설명한다.

제한:
- 제공된 근거 텍스트(rag_chunks 내용)만 사용해서 답변한다.
- 근거가 부족하거나 애매하면 "해당 근거로는 판단이 어렵다"라고 솔직하게 말하고, 추측은 최소화한다.
- 지어내지 않는다.

내용 구성:
- 먼저 알람 TS(워크플로우) 근거를 기반으로 "정석적인 점검/조치 순서"를 설명한다.
- 이어서 WORK LOG 근거를 참고하여, 실제 현장에서 자주 발생했던 원인/조치/주의사항을 보완 설명한다.
- 안전 관련 내용(safety)이 있으면 반드시 눈에 띄게 강조해서 알려준다. (예: "⚠️ 안전 주의:" 로 시작)
`;

  const userPrompt = `
질문:
${question}

설비 조건:
- equipment_type: ${equipment_type || '(지정 없음)'}
- AlarmKey: ${alarm_key || '(지정 없음)'}

[알람/트러블슈팅 가이드 근거]
${alarmEvidenceBlock}

[작업 이력 근거]
${workLogEvidenceBlock}

답변 지침:
- "정석 TS 절차"와 "실제 작업 이력에서 보이는 패턴"을 잘 섞어서 설명하되, 서로 헷갈리지 않게 구분해서 말해라.
- 예를 들어,
  1) 먼저 알람의 의미와 기본 점검 순서를 TS 근거 기준으로 정리하고,
  2) 그 다음, 비슷한 상황에서 실제로 어떤 조치를 했는지(Work Log 근거 기준) 요약해 주면 좋다.
- 실제로 따라 할 수 있도록 점검/조치 순서를 단계별로 정리하되, 너무 딱딱한 보고서 스타일은 피하고 자연스럽게 설명해라.
- 안전 관련 사항은 "⚠️ 안전 주의:" 형태로 따로 강조해라.
`;

  const completion = await openai.chat.completions.create({
    model: MODELS.chat,
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: userPrompt.trim() },
    ],
    temperature: 0.2,
  });

  const answer = completion.choices[0]?.message?.content ?? '';

  // hits에는 두 소스 모두 반환 (프론트에서 필요하면 구분해서 사용)
  const mergedHits = [
    ...alarmHits.map((h) => ({ ...h, source_type: 'ALARM_STEP' })),
    ...workLogHits.map((h) => ({ ...h, source_type: 'WORK_LOG' })),
  ];

  return {
    answer,
    hits: mergedHits,
  };
}

module.exports = {
  buildMissingEmbeddings,
  searchSimilarSteps,
  answerQuestion,
};

