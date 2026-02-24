/**
 * back/src/services/aiService.js
 *
 * AI 질의응답 서비스 레이어
 * - Phase 1 (현재): 규칙 기반 키워드 추출 + SQL 검색 + GPT 요약 응답
 * - Phase 2 (확장): OpenAI Embedding + 벡터 유사도 검색 (RAG)
 *
 * OpenAI 설정: back/config/openai.js (openai, MODELS)
 * DB 설정:     back/config/database.js (pool)
 */

'use strict';

const aiDao              = require('../dao/aiDao');
const { openai, MODELS } = require('../../config/openai');

// ─────────────────────────────────────────────────────────────
// 유틸: 작업자 파싱
// ─────────────────────────────────────────────────────────────
/**
 * task_man 문자열 파싱
 * 예) "김지훈(main), 정옥석(main)" → [{name:"김지훈", role:"main"}, ...]
 * 예) "이주환(support)"            → [{name:"이주환", role:"support"}]
 * TODO: "정현우/김동한", "정현우·김동한" 등 다른 구분자 포맷 발견 시 정규식 확장
 * @param {string} taskMan
 * @returns {Array<{name:string, role:string}>}
 */
function parseTaskMan(taskMan) {
  if (!taskMan || taskMan.trim() === '' || taskMan === 'SELECT') return [];
  return taskMan
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (m) return { name: m[1].trim(), role: m[2].trim().toLowerCase() };
      return { name: part, role: 'unknown' };
    });
}

// ─────────────────────────────────────────────────────────────
// 유틸: 규칙 기반 키워드 추출
// ─────────────────────────────────────────────────────────────
const STOP_PATTERNS = [
  /어떻게\s*(했나요?|하나요?|합니까?|되나요?|됩니까?)?/g,
  /언제\s*(했나요?|하나요?|합니까?|됩니까?)?/g,
  /누가\s*(했나요?|하나요?|합니까?|됩니까?)?/g,
  /무엇을?\s*(했나요?|하나요?|합니까?|됩니까?)?/g,
  /어떤\s*/g,
  /무슨\s*/g,
  /알려\s*줘?/g,
  /알려\s*주세요\.?/g,
  /알고\s*싶어요?\.?/g,
  /찾아\s*줘?/g,
  /보여\s*줘?/g,
  /검색해\s*줘?/g,
  /있나요?\??/g,
  /있습니까\??/g,
  /인가요?\??/g,
  /인지\s*/g,
  /관련된?\s*/g,
  /에\s*대한\s*/g,
  /에서의?\s*/g,
  /의\s+/g,
  /[?？。]/g,
];

/**
 * 질문 텍스트에서 DB 검색용 키워드 추출 (규칙 기반 MVP)
 * TODO: Phase 2에서 OpenAI chat 호출로 의도 분석 + 키워드 추출 고도화
 * @param {string} question
 * @returns {string}
 */
function extractKeyword(question) {
  if (!question) return '';
  let kw = question.trim();
  for (const p of STOP_PATTERNS) kw = kw.replace(p, ' ');
  kw = kw.replace(/\s{2,}/g, ' ').trim();
  return kw.length > 60 ? kw.substring(0, 60) : kw;
}

// ─────────────────────────────────────────────────────────────
// 유틸: work_type2 코드 → 한국어
// ─────────────────────────────────────────────────────────────
const WT2_LABEL = { REP: '교체', ADJ: '조정', MON: '점검', CLN: '클린' };
const labelWt2 = (code) => WT2_LABEL[code] || code || '-';

// ─────────────────────────────────────────────────────────────
// 유틸: 날짜 포맷
// ─────────────────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────
// DB 행 → UI용 객체 변환
// ─────────────────────────────────────────────────────────────
function formatRow(row) {
  const workers      = parseTaskMan(row.task_man);
  const mainWorkers  = workers.filter((w) => w.role === 'main').map((w) => w.name);
  const subWorkers   = workers.filter((w) => w.role === 'support').map((w) => w.name);
  const etcWorkers   = workers.filter((w) => w.role === 'unknown').map((w) => w.name);

  return {
    id:               row.id,
    task_date:        fmtDate(row.task_date),
    task_name:        row.task_name   || '-',
    equipment_type:   row.equipment_type || '-',
    equipment_name:   row.equipment_name || '-',
    site:             row.site        || '-',
    line:             row.line        || '-',
    group:            row.group       || '-',
    task_man_raw:     row.task_man    || '-',
    task_man_main:    mainWorkers.join(', ')  || '-',
    task_man_support: subWorkers.join(', ')   || '-',
    task_man_etc:     etcWorkers.join(', ')   || '-',
    task_description: row.task_description || '-', // 작업 방법 질의 핵심
    task_cause:       row.task_cause  || '-',
    task_result:      row.task_result || '-',
    work_type:        row.work_type   || '-',
    work_type2_code:  row.work_type2  || '-',
    work_type2:       labelWt2(row.work_type2),
    warranty:         row.warranty    || '-',
    SOP:              (row.SOP    && row.SOP    !== 'SELECT') ? row.SOP    : null,
    tsguide:          (row.tsguide && row.tsguide !== 'SELECT') ? row.tsguide : null,
    task_duration:    row.task_duration || '-',
    start_time:       row.start_time  || '-',
    end_time:         row.end_time    || '-',
  };
}

// ─────────────────────────────────────────────────────────────
// GPT 요약 응답 생성 (gpt-4o-mini)
// ─────────────────────────────────────────────────────────────
/**
 * 검색 결과를 context로 GPT에게 한국어 요약 답변 생성 요청
 * @param {string} question
 * @param {Array}  results  formatRow 처리된 배열
 * @param {Object} filters
 * @returns {Promise<string>}
 */
async function generateGptAnswer(question, results, filters) {
  if (!results || results.length === 0) {
    return `[${filters.equipment_type}] 설비에 대한 조건에 맞는 작업이력이 없습니다. 필터(설비종류, 날짜, 지역)를 조정해 보세요.`;
  }

  // context: 검색 결과 요약 (최대 15건, 각 행의 주요 필드만 포함)
  const contextItems = results.slice(0, 15).map((r, i) => {
    const lines = [
      `[${i + 1}] 날짜:${r.task_date} / 설비:${r.equipment_name}(${r.equipment_type}) / Site:${r.site} / Line:${r.line}`,
      `    작업자(main):${r.task_man_main} / 작업자(support):${r.task_man_support}`,
      `    원인: ${r.task_cause}`,
      `    작업내용(task_description): ${r.task_description}`,  // 핵심 컬럼
      `    결과: ${r.task_result}`,
      `    작업유형: ${r.work_type} / ${r.work_type2}`,
    ];
    if (r.SOP)     lines.push(`    SOP: ${r.SOP}`);
    if (r.tsguide) lines.push(`    TSGuide: ${r.tsguide}`);
    return lines.join('\n');
  });

  const context = contextItems.join('\n\n');

  const systemPrompt = `당신은 반도체 장비 유지보수 작업이력 전문 AI 어시스턴트입니다.
아래 작업이력 데이터(work_log)를 참고하여 사용자 질문에 한국어로 명확하고 실용적인 답변을 제공하세요.

규칙:
1. 데이터에 없는 정보는 지어내지 마세요.
2. task_description 컬럼이 작업 방법의 핵심 정보입니다. 우선 활용하세요.
3. 작업자 정보에서 (main)은 해당 작업의 메인 수행자, (support)는 보조 수행자입니다.
4. 날짜, 설비명, 작업자를 명시하여 구체적으로 답변하세요.
5. 답변은 간결하고 실무에 바로 활용할 수 있는 형태로 작성하세요.`;

  const userPrompt = `## 작업이력 데이터 (총 ${results.length}건 중 최대 15건)
적용된 필터: 설비종류=${filters.equipment_type}, 지역=${filters.site || '전체'}, 라인=${filters.line || '전체'}${filters.date_from ? `, 기간=${filters.date_from}~${filters.date_to}` : ''}

${context}

## 사용자 질문
${question}`;

  try {
    const completion = await openai.chat.completions.create({
      model:       MODELS.chat,    // gpt-4o-mini
      max_tokens:  1200,
      temperature: 0.2,            // 사실 기반 답변을 위해 낮게 설정
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    });

    return completion.choices?.[0]?.message?.content?.trim() || '응답을 생성할 수 없습니다.';
  } catch (err) {
    console.error('[aiService.generateGptAnswer] OpenAI 호출 오류:', err.message);
    // OpenAI 오류 시 SQL 기반 폴백 요약
    return buildFallbackSummary(question, results, filters);
  }
}

// ─────────────────────────────────────────────────────────────
// 폴백 요약 (OpenAI 미설정 or 오류 시)
// ─────────────────────────────────────────────────────────────
function buildFallbackSummary(question, results, filters) {
  if (!results || results.length === 0) {
    return `[${filters.equipment_type}] 조건에 맞는 작업이력이 없습니다.`;
  }
  const count     = results.length;
  const siteStr   = [filters.site, filters.line].filter((v) => v && v !== 'ALL').join(' / ') || '전체';
  const dateStr   = filters.date_from ? ` (${filters.date_from} ~ ${filters.date_to || '현재'})` : '';

  let text = `[${filters.equipment_type}] ${siteStr}${dateStr} 기준, "${question}"에 관련된 작업이력 ${count}건을 찾았습니다.\n\n`;

  results.slice(0, 3).forEach((r, i) => {
    text += `▶ ${i + 1}. [${r.task_date}] ${r.task_name} — ${r.equipment_name}\n`;
    text += `   작업자: ${r.task_man_raw}\n`;
    if (r.task_cause !== '-')       text += `   원인: ${r.task_cause}\n`;
    if (r.task_description !== '-') {
      const desc = r.task_description.length > 120
        ? r.task_description.substring(0, 120) + '...'
        : r.task_description;
      text += `   작업내용: ${desc}\n`;
    }
    if (r.task_result !== '-')      text += `   결과: ${r.task_result}\n`;
    text += '\n';
  });

  if (count > 3) text += `※ 나머지 ${count - 3}건은 아래 목록에서 확인하세요.`;
  return text;
}


// ─────────────────────────────────────────────────────────────
// Phase 2 확장 포인트: OpenAI Embedding 생성
// ─────────────────────────────────────────────────────────────
/**
 * 텍스트 임베딩 생성 (text-embedding-3-small)
 * @param {string} text
 * @returns {Promise<number[]>} 1536차원 float 배열
 */
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: MODELS.embedding,   // text-embedding-3-small
    input: text.substring(0, 8000),  // 토큰 제한
  });
  return response.data[0].embedding;
}

/**
 * 코사인 유사도 계산
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} 0~1
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}


// ─────────────────────────────────────────────────────────────
// 메인: SQL 검색 + GPT 요약 (Phase 1)
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} p
 * @param {string} p.question
 * @param {string} p.equipment_type  필수
 * @param {string} [p.site]
 * @param {string} [p.line]
 * @param {string} [p.date_from]
 * @param {string} [p.date_to]
 * @param {number} [p.top_k=10]
 * @param {string} [p.userAgent]
 * @returns {Promise<{summary:string, results:Array, meta:Object}>}
 */
exports.query = async ({ question, equipment_type, site, line, date_from, date_to, top_k = 10, userAgent }) => {
  const t0 = Date.now();

  // 1. 키워드 추출 (규칙 기반)
let keyword = extractKeyword(question);

// 키워드가 너무 길거나 '작업이력/찾아봐' 같은 일반어 위주면 키워드 검색 생략
const genericWords = ['작업이력', '이력', '찾아봐', '찾아줘', '보여줘', '조회', '내역'];
const normalized = (keyword || '').replace(/\s+/g, '');
const onlyGeneric = genericWords.some(w => normalized.includes(w)) && normalized.length <= 20;

if (!keyword || keyword.length >= 20 || onlyGeneric) {
  keyword = '';
}

const rawRows = await aiDao.searchWorkLogs({
  keyword,
  equipment_type,
  site,
  line,
  date_from,
  date_to,
  top_k
});
  // 3. 포맷팅
  const results = rawRows.map(formatRow);

  // 4. GPT 요약 답변 생성
  const filters = { equipment_type, site, line, date_from, date_to };
  const summary = await generateGptAnswer(question, results, filters);

  const elapsed_ms = Date.now() - t0;

  // 5. 질의 로그 저장 (비동기 - 응답에 영향 없음)
  aiDao.saveQueryLog({
    question, equipment_type, site, line, date_from, date_to, top_k,
    result_count:  results.length,
    response_text: summary,
    used_embedding: 0,
    ai_model:      `sql+${MODELS.chat}`,
    elapsed_ms,
    user_agent:    userAgent,
  }).catch((e) => console.warn('[aiService] 로그 저장 실패:', e.message));

  return {
    summary,
    results,
    meta: {
      question,
      keyword,
      equipment_type,
      site:         site      || null,
      line:         line      || null,
      date_from:    date_from || null,
      date_to:      date_to   || null,
      top_k,
      result_count: results.length,
      elapsed_ms,
      ai_model:     `sql+${MODELS.chat}`,
    },
  };
};


// ─────────────────────────────────────────────────────────────
// 메인: RAG 검색 + GPT 요약 (Phase 2)
// buildEmbeddings.js 실행 후 사용 가능
// ─────────────────────────────────────────────────────────────
/**
 * 벡터 유사도 기반 검색 + GPT 답변
 * @param {Object} p
 * @param {string} p.question
 * @param {string} p.equipment_type  필수
 * @param {string} [p.site]
 * @param {string} [p.line]
 * @param {number} [p.top_k=10]
 * @param {string} [p.userAgent]
 */
exports.ragQuery = async ({ question, equipment_type, site, line, date_from, date_to, top_k = 10, userAgent }) => {
  const t0 = Date.now();

  // 1. 질문 임베딩 생성
  const questionEmbedding = await createEmbedding(question);

  // 2. DB에서 후보 청크 조회 (equipment_type + site로 pre-filter)
  //    후보를 넉넉하게 뽑은 뒤 코사인 유사도로 최종 선별
  const CANDIDATE_LIMIT = Math.max(top_k * 8, 80);
const chunks = await aiDao.getRagChunkCandidates({
  equipment_type,
  site,
  line,
  date_from,
  date_to,
  limit: CANDIDATE_LIMIT,
});

  if (chunks.length === 0) {
    const summary = `[${equipment_type}] 설비에 대한 임베딩 데이터가 없습니다.\n` +
      `buildEmbeddings.js 스크립트를 실행하여 임베딩을 먼저 생성해주세요.`;
    return {
      summary,
      results: [],
      meta: { question, equipment_type, result_count: 0, elapsed_ms: Date.now() - t0, ai_model: `rag+${MODELS.chat}` },
    };
  }

  // 3. 코사인 유사도 계산 + 내림차순 정렬 + top_k 선별
  const scored = chunks
    .filter((c) => c.embedding_json)
    .map((c) => {
      try {
        const vec = JSON.parse(c.embedding_json);
        return { ...c, similarity: cosineSimilarity(questionEmbedding, vec) };
      } catch {
        return { ...c, similarity: 0 };
      }
    })
    .filter((c) => c.similarity > 0.3)   // 유사도 0.3 미만 제거 (노이즈 필터)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, top_k);

  // 4. 선별된 work_log_id로 원본 work_log 행 조회 (formatRow 적용)
  const workLogIds      = [...new Set(scored.map((c) => c.work_log_id))];
  const rawWorkLogRows  = await aiDao.getWorkLogsByIds(workLogIds);

  // work_log_id → row 매핑 (순서 보존을 위해 Map 사용)
  const rowMap = new Map(rawWorkLogRows.map((r) => [r.id, r]));

  // scored 순서(유사도 내림차순) 유지하면서 work_log 원본 데이터 병합
  const results = scored
    .map((chunk) => {
      const wlRow = rowMap.get(chunk.work_log_id);
      if (!wlRow) return null;
      return {
        ...formatRow(wlRow),
        similarity:   chunk.similarity,
        chunk_text:   chunk.chunk_text,  // 검색에 사용된 텍스트
      };
    })
    .filter(Boolean);

  // 5. GPT 답변 생성 (chunk_text를 context로, 원본 데이터를 보조로 사용)
  const filters = { equipment_type, site, line };
  const summary = results.length > 0
    ? await generateRagGptAnswer(question, results, scored, filters)
    : `[${equipment_type}] 유사도 임계값(0.3) 이상의 관련 작업이력이 없습니다. 질문을 더 구체적으로 입력해 보세요.`;

  const elapsed_ms = Date.now() - t0;

  // 6. 로그 저장
  aiDao.saveQueryLog({
    question, equipment_type, site, line,
    date_from: null, date_to: null, top_k,
    result_count: results.length,
    response_text: summary,
    used_embedding: 1,
    ai_model: `rag+${MODELS.chat}`,
    elapsed_ms,
    user_agent: userAgent,
  }).catch(() => {});

  return {
    summary,
    results,
    meta: {
      question,
      equipment_type,
      site:         site || null,
      line:         line || null,
      top_k,
      result_count: results.length,
      elapsed_ms,
      ai_model:     `rag+${MODELS.chat}`,
      candidate_count: chunks.length,  // 후보군 수 (디버깅용)
    },
  };
};

// ─────────────────────────────────────────────────────────────
// RAG 전용 GPT 답변 생성
// chunk_text(임베딩 대상 텍스트)를 context로 활용
// ─────────────────────────────────────────────────────────────
async function generateRagGptAnswer(question, results, scored, filters) {
  // context: 유사도 순서대로, chunk_text 기반 (이미 임베딩에 최적화된 텍스트)
  const contextItems = results.slice(0, 12).map((r, i) => {
    const sim = scored[i]?.similarity?.toFixed(3) || '?';
    return [
      `[${i + 1}] 유사도:${sim} | 날짜:${r.task_date} | 설비:${r.equipment_name}(${r.equipment_type}) | Site:${r.site}`,
      `    작업자(main):${r.task_man_main} / (support):${r.task_man_support}`,
      `    원인: ${r.task_cause}`,
      `    작업내용: ${r.task_description}`,
      `    결과: ${r.task_result}`,
    ].join('\n');
  });

  const systemPrompt = `당신은 반도체 장비 유지보수 작업이력 전문 AI 어시스턴트입니다.
아래 작업이력 데이터(벡터 유사도 검색 결과)를 참고하여 사용자 질문에 한국어로 명확하고 실용적인 답변을 제공하세요.

규칙:
1. 데이터에 없는 정보는 절대 지어내지 마세요.
2. task_description(작업내용)이 작업 방법의 핵심 정보입니다. 우선 활용하세요.
3. 작업자의 (main)은 메인 수행자, (support)는 보조입니다.
4. 유사도가 높은 항목을 우선 참고하세요.
5. 날짜, 설비명, 작업자를 명시하여 구체적으로 답변하세요.
6. 답변은 실무에 바로 활용 가능한 형태로 작성하세요.`;

  const userPrompt = `## 벡터 검색 작업이력 (유사도 내림차순, 총 ${results.length}건)
적용 필터: 설비종류=${filters.equipment_type}, 지역=${filters.site || '전체'}, 라인=${filters.line || '전체'}

${contextItems.join('\n\n')}

## 사용자 질문
${question}`;

  try {
    const completion = await openai.chat.completions.create({
      model:       MODELS.chat,
      max_tokens:  1200,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    });
    return completion.choices?.[0]?.message?.content?.trim() || '응답 생성 실패';
  } catch (err) {
    console.error('[aiService.generateRagGptAnswer] OpenAI 오류:', err.message);
    return buildFallbackSummary(question, results, filters);
  }
}


// ─────────────────────────────────────────────────────────────
// 드롭다운 옵션
// ─────────────────────────────────────────────────────────────
exports.getFilterOptions = async () => {
  const [equipment_types, sites] = await Promise.all([
    aiDao.getEquipmentTypes(),
    aiDao.getSites(),
  ]);
  return { equipment_types, sites };
};


// ─────────────────────────────────────────────────────────────
// 임베딩 일괄 생성 (관리자 작업용 - 향후 사용)
// ─────────────────────────────────────────────────────────────
/**
 * work_log 행의 task_description을 임베딩하여 work_log_rag_chunks에 저장
 * @param {Array} rows  work_log 행 배열
 */
exports.buildEmbeddings = async (rows) => {
  let ok = 0, fail = 0;
  for (const row of rows) {
    try {
      const text = [
        row.task_name        || '',
        row.task_description || '',  // 핵심
        row.task_cause       || '',
        row.task_result      || '',
      ].filter(Boolean).join('\n');

      if (!text.trim()) { fail++; continue; }

      const embedding = await createEmbedding(text);
      await aiDao.saveRagChunk({
        work_log_id:    row.id,
        chunk_index:    0,
        chunk_text:     text,
        embedding,
        embedding_model: MODELS.embedding,
        equipment_type: row.equipment_type,
        site:           row.site,
        line:           row.line,
        task_date:      row.task_date,
      });
      ok++;
      // Rate limit 방지: 100ms 대기
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`[buildEmbeddings] work_log id=${row.id} 실패:`, err.message);
      fail++;
    }
  }
  return { ok, fail, total: rows.length };
};
