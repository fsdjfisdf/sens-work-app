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

// 🔹 OpenAI Chat을 사용해 최종 답변 생성
async function answerQuestion({
  question,
  equipment_type,
  alarm_key,
  topK = 5,
  candidateLimit = 300,
}) {
  const { hits } = await searchSimilarSteps({
    question,
    equipment_type,
    alarm_key,
    topK,
    candidateLimit,
  });

  if (!hits.length) {
    return {
      answer: '관련된 알람/트러블슈팅 Step 데이터를 찾지 못했습니다. 입력하신 AlarmKey 또는 설비 타입을 확인해 주세요.',
      hits: [],
    };
  }

  // 근거 텍스트 블록 만들기
  const evidenceBlocks = hits
    .map((h, idx) => {
      return [
        `[#${idx + 1}] ${h.title || ''}`,
        `- AlarmKey: ${h.alarm_key}`,
        `- CASE / STEP: ${h.case_no} / ${h.step_no}`,
        `- Equipment: ${h.equipment_type}`,
        '',
        h.content || '',
      ].join('\n');
    })
    .join('\n\n----------------------------------------\n\n');

const systemPrompt = `
너는 PSK SUPRA 계열 장비의 알람/트러블슈팅 가이드(워크플로우)를 기반으로 답변하는 엔지니어용 어시스턴트이다.

역할/톤:
- 현장에서 후배 엔지니어에게 설명해주는 "시니어 엔지니어"라고 생각하고, 말투는 자연스럽고 친절한 한국어로 답변한다.
- 문장은 너무 딱딱한 보고서 형식보다는, 이해하기 쉽게 풀어서 설명한다.
- 필요할 때만 번호나 목록, 표를 사용하고, 전체적으로는 읽기 편한 설명 위주로 답변한다.

제한:
- 제공된 근거 텍스트(rag_chunks 내용)만 사용해서 답변한다.
- 근거가 부족하거나 애매하면 "해당 근거로는 판단이 어렵다"라고 솔직하게 말하고, 추측은 최소화한다.
- 지어내지 않는다. 모르면 모른다고 말한다.

내용 구성:
- 가능하면 CASE / STEP 순서를 활용해서 "어떤 순서로 무엇을 확인해야 하는지"를 정리해 준다.
- 현장에서 바로 따라 할 수 있도록, 점검 포인트와 권장 조치 순서를 구체적으로 설명한다.
- 안전 관련 내용(safety)이 있으면 반드시 눈에 띄게 강조해서 알려준다. (예: "⚠️ 안전 주의:" 로 시작)
`;


const userPrompt = `
질문:
${question}

조건:
- 설비 타입(equipment_type): ${equipment_type || '(지정 없음)'}
- 특정 AlarmKey: ${alarm_key || '(지정 없음)'}

아래는 관련 알람/트러블슈팅 Step 근거이다. 이 근거만 사용해서 답변을 구성해라.

${evidenceBlocks}

답변 스타일 지침:
- 실제 현장에서 알람이 발생했을 때, 후배 엔지니어에게 설명하듯이 자연스럽게 설명해라.
- 문장은 부드럽게 이어지도록 쓰고, 불필요하게 딱딱한 형식(1), 2), 3) 보고서 스타일)은 피한다.
- 다만, 점검/조치 순서는 엔지니어가 그대로 따라 할 수 있도록 단계별로 정리해 준다. (예: "먼저 ~", "그 다음 ~", "마지막으로 ~" 등의 표현 사용)
- 필요한 경우에만 불릿/번호 목록을 사용해 가독성을 높인다.

답변에 포함하면 좋은 내용 (권장 사항):
- 지금 알람/상황이 어떤 의미인지 간단한 요약
- 우선 확인해야 할 핵심 포인트 (CASE / STEP 기준으로, 중요도 위주로)
- 근거에 기반한 예상 원인(여러 개일 수 있음)
- 실제로 따라 할 수 있는 권장 조치 순서 (CASE / STEP 기준 단계 설명)
- 안전상 주의사항이 있다면 반드시 따로 강조 (예: "⚠️ 안전 주의:" 로 시작)
- 참고한 근거를 간단히 정리 (예: "#1, #3, #4 근거 참조" 처럼 가볍게 언급)

형식적인 목차를 억지로 맞추기보다는,
"상황 → 우선 확인 → 원인 가설 → 조치 순서 → 안전" 흐름이 자연스럽게 느껴지도록 답변해라.
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

  return {
    answer,
    hits,
  };
}

module.exports = {
  buildMissingEmbeddings,
  searchSimilarSteps,
  answerQuestion,
};
