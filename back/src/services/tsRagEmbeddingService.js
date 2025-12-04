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


// ... cosineSimilarity, buildMissingEmbeddings 등 기존 코드 유지

// 🔹 작업이력 기반 유사 로그 검색
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

  // 2) 후보 가져오기 (이제 필터 포함)
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


// 🔹 OpenAI Chat을 사용해 최종 답변 생성
async function answerQuestion({
  question,
  equipment_type,  // ALARM용
  alarm_key,       // ALARM용
  // === WORK_LOG용 필터 ===
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
  mode = 'ALARM',  // 기본: 기존처럼 알람 위주
}) {
  if (mode === 'WORK_LOG') {
    // 🔹 작업이력만
    const { hits } = await searchSimilarWorkLogs({
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
    });

    if (!hits.length) {
      // 날짜/필터 명확히 줬는데 아무것도 없으면, 우리가 직접 말해주는 게 안전
      if (task_date || date_from || date_to || equipment_name || worker_name) {
        return {
          answer:
            '요청하신 조건(task_date / 설비 / 작업자 등)에 맞는 작업 이력이 등록되어 있지 않습니다.\n' +
            '필터 조건을 조금 완화해서 다시 조회해 주세요.',
          hits: [],
        };
      }

      return {
        answer: '관련된 작업 이력 데이터를 찾지 못했습니다.',
        hits: [],
      };
    }

    // 🔹 근거 블록 만들기 (작업이력용)
    const evidenceBlocks = hits
      .map((h, idx) => {
        return [
          `[#${idx + 1}] ${h.title || ''}`,
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

    // 🔹 Chat 호출 (작업이력용 프롬프트)
    const systemPrompt = `
너는 PSK 현장 작업 이력을 기반으로 요약/분석해 주는 엔지니어용 어시스턴트이다.
- 후배 엔지니어에게 작업 히스토리를 설명하듯이 자연스럽게 말한다.
- 제공된 근거(작업 이력 텍스트)만 사용해서 답한다.
- 없거나 애매한 내용은 지어내지 말고 "데이터 상에서는 확인되지 않는다"고 말한다.
`.trim();

    const userPrompt = `
질문:
${question}

적용된 필터 (참고용):
- 날짜: ${task_date || `${date_from || ''} ~ ${date_to || ''}`}
- 설비: ${equipment_name || '(지정 없음)'}
- 작업자: ${worker_name || '(지정 없음)'}
- 그룹/사이트: ${group_name || '(지정 없음)'} / ${site || '(지정 없음)'}
- 작업 타입: ${work_type || '(지정 없음)'}
- SETUP_ITEM: ${setup_item || '(없음)'}
- TRANSFER_ITEM: ${transfer_item || '(없음)'}

아래는 조건에 맞는 작업 이력들이다. 이 근거만 사용해서 답변을 구성해라.

${evidenceBlocks}

답변 스타일:
- "어떤 설비에서 어떤 이력이 있었는지"를 먼저 요약한 다음,
- 주요 이슈 / 조치 내용 / 결과를 정리해라.
- 여러 건이 있을 경우, 날짜 순서나 설비/작업자 기준으로 묶어서 설명해도 좋다.
- 필요하면 bullet/list를 쓰되, 전체 흐름은 자연스럽게 읽히도록 작성해라.
`.trim();

    const completion = await openai.chat.completions.create({
      model: MODELS.chat,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices[0]?.message?.content ?? '';

    return { answer, hits };
  }

  // 🔸 그 외는 기존 ALARM 모드 그대로 (너가 이미 쓰고 있는 코드 유지)
  // mode === 'ALARM' or 'BOTH' 처리 부분은 생략(기존 코드 그대로)
}

module.exports = {
  buildMissingEmbeddings,
  searchSimilarSteps,
  searchSimilarWorkLogs,   // 🔸 export
  answerQuestion,
};

