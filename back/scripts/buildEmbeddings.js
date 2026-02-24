/**
 * back/scripts/buildEmbeddings.js
 *
 * work_log 테이블 전체(또는 미처리 행)를 임베딩하여
 * work_log_rag_chunks 테이블에 저장하는 일회성 배치 스크립트
 *
 * 실행 방법:
 *   cd back
 *   node scripts/buildEmbeddings.js
 *
 * 옵션:
 *   node scripts/buildEmbeddings.js --force      # 이미 임베딩된 것도 재생성
 *   node scripts/buildEmbeddings.js --id 123     # 특정 work_log id만
 *   node scripts/buildEmbeddings.js --limit 100  # 최대 N건만 처리
 */

'use strict';

// ── 경로 설정 (스크립트 위치: back/scripts/) ─────────────────
const path   = require('path');
const root   = path.join(__dirname, '..'); // back/

const { pool }           = require(path.join(root, 'config/database'));
const { openai, MODELS } = require(path.join(root, 'config/openai'));

// ── CLI 인수 파싱 ─────────────────────────────────────────────
const args    = process.argv.slice(2);
const FORCE   = args.includes('--force');
const LIMIT   = parseInt(args[args.indexOf('--limit')  + 1], 10) || 0;  // 0 = 전체
const ONLY_ID = parseInt(args[args.indexOf('--id')     + 1], 10) || 0;

// ── 설정 ─────────────────────────────────────────────────────
const BATCH_SIZE      = 20;    // OpenAI API를 한 번에 몇 건씩 호출할지
const DELAY_MS        = 200;   // 배치 사이 딜레이 (ms) — Rate limit 방지
const EMBED_MODEL     = MODELS.embedding;  // text-embedding-3-small

// ── 임베딩 대상 텍스트 조합 ──────────────────────────────────
/**
 * work_log 행 → 임베딩할 텍스트 생성
 * task_description을 최우선, 나머지는 보조 컨텍스트로 추가
 */
function buildChunkText(row) {
  const parts = [];

  if (row.equipment_type) parts.push(`설비종류: ${row.equipment_type}`);
  if (row.equipment_name) parts.push(`설비명: ${row.equipment_name}`);
  if (row.task_name)      parts.push(`작업명: ${row.task_name}`);
  if (row.task_cause)     parts.push(`원인: ${row.task_cause}`);
  if (row.task_description && row.task_description.trim()) {
    // HTML 태그 제거 (엑셀에 <br> 포함된 경우 대비)
    const cleanDesc = row.task_description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    parts.push(`작업내용: ${cleanDesc}`);
  }
  if (row.task_result)    parts.push(`결과: ${row.task_result}`);
  if (row.task_man)       parts.push(`작업자: ${row.task_man}`);
  if (row.work_type)      parts.push(`작업유형: ${row.work_type}`);
  if (row.work_type2)     parts.push(`세부유형: ${row.work_type2}`);

  return parts.join('\n');
}

// ── OpenAI 임베딩 배치 호출 ──────────────────────────────────
/**
 * 텍스트 배열을 한 번의 API 호출로 임베딩 (최대 2048건/회 가능, 여기선 BATCH_SIZE 사용)
 * @param {string[]} texts
 * @returns {Promise<number[][]>}  각 텍스트에 대한 1536차원 float 배열
 */
async function embedBatch(texts) {
  const response = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: texts.map(t => t.substring(0, 8000)), // 토큰 제한 (약 8000자)
  });
  // response.data는 [{index, embedding}, ...] 형태, index 순서대로 정렬
  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}

// ── DB 저장 ──────────────────────────────────────────────────
async function saveChunk({ row, chunkText, embedding }) {
  const connection = await pool.getConnection(async c => c);
  try {
    await connection.query(
      `INSERT INTO work_log_rag_chunks
         (work_log_id, chunk_index, chunk_text, embedding_json, embedding_model,
          equipment_type, site, \`line\`, task_date)
       VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         chunk_text      = VALUES(chunk_text),
         embedding_json  = VALUES(embedding_json),
         embedding_model = VALUES(embedding_model),
         updated_at      = NOW()`,
      [
        row.id,
        chunkText,
        JSON.stringify(embedding),
        EMBED_MODEL,
        row.equipment_type || null,
        row.site           || null,
        row.line           || null,
        row.task_date      || null,
      ]
    );
  } finally {
    connection.release();
  }
}

// ── 처리 대상 work_log 조회 ──────────────────────────────────
async function fetchTargetRows() {
  const connection = await pool.getConnection(async c => c);
  try {
    let sql;
    const values = [];

    if (ONLY_ID) {
      // 특정 ID만
      sql = 'SELECT * FROM work_log WHERE id = ?';
      values.push(ONLY_ID);

    } else if (FORCE) {
      // 전체 강제 재처리
      sql = 'SELECT * FROM work_log ORDER BY id ASC';
      if (LIMIT > 0) { sql += ` LIMIT ${LIMIT}`; }

    } else {
      // 아직 임베딩 안 된 것만 (work_log_rag_chunks에 없는 것)
      sql = `
        SELECT w.*
        FROM work_log w
        LEFT JOIN work_log_rag_chunks c ON c.work_log_id = w.id
        WHERE c.work_log_id IS NULL
        ORDER BY w.id ASC
      `;
      if (LIMIT > 0) { sql += ` LIMIT ${LIMIT}`; }
    }

    const [rows] = await connection.query(sql, values);
    return rows;
  } finally {
    connection.release();
  }
}

// ── 진행률 표시 ──────────────────────────────────────────────
function progress(current, total, ok, fail, startTime) {
  const pct     = ((current / total) * 100).toFixed(1);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const eta     = current > 0
    ? (((Date.now() - startTime) / current) * (total - current) / 1000).toFixed(0)
    : '?';

  process.stdout.write(
    `\r진행: ${current}/${total} (${pct}%) | ✅ ${ok} | ❌ ${fail} | ${elapsed}s 경과 | ETA ~${eta}s  `
  );
}

// ── 메인 ─────────────────────────────────────────────────────
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  work_log 임베딩 배치 스크립트');
  console.log(`  모델: ${EMBED_MODEL}`);
  console.log(`  옵션: force=${FORCE}, limit=${LIMIT || '전체'}, id=${ONLY_ID || '전체'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. 대상 조회
  console.log('\n📋 처리 대상 work_log 조회 중...');
  const rows = await fetchTargetRows();

  if (rows.length === 0) {
    console.log('✅ 처리할 항목이 없습니다. (이미 모두 임베딩 완료)');
    console.log('   강제 재처리: node scripts/buildEmbeddings.js --force');
    process.exit(0);
  }

  console.log(`\n📦 총 ${rows.length}건 처리 시작\n`);

  const startTime = Date.now();
  let ok   = 0;
  let fail = 0;
  const failedIds = [];

  // 2. 배치 단위로 처리
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    // 임베딩 대상 텍스트 빌드
    const chunkTexts = batch.map(buildChunkText);

    // 빈 텍스트 체크
    const validBatch = batch.map((row, idx) => ({
      row,
      chunkText: chunkTexts[idx],
      hasContent: chunkTexts[idx].trim().length > 10,
    }));

    // 유효한 것만 OpenAI 호출
    const toEmbed = validBatch.filter(b => b.hasContent);

    let embeddings = [];
    if (toEmbed.length > 0) {
      try {
        embeddings = await embedBatch(toEmbed.map(b => b.chunkText));
      } catch (err) {
        console.error(`\n⚠️  OpenAI API 오류 (배치 ${i}~${i + batch.length - 1}): ${err.message}`);
        // 이 배치 전체 실패 처리
        for (const item of toEmbed) {
          fail++;
          failedIds.push(item.row.id);
        }
        progress(i + batch.length, rows.length, ok, fail, startTime);
        await delay(DELAY_MS * 3); // 오류 시 더 긴 딜레이
        continue;
      }
    }

    // 3. 각 행 저장
    let embedIdx = 0;
    for (const item of validBatch) {
      if (!item.hasContent) {
        console.warn(`\n  ⚠️  id=${item.row.id} 텍스트 없음, 건너뜀`);
        fail++;
        failedIds.push(item.row.id);
        continue;
      }

      const embedding = embeddings[embedIdx++];
      try {
        await saveChunk({ row: item.row, chunkText: item.chunkText, embedding });
        ok++;
      } catch (err) {
        console.error(`\n  ❌ id=${item.row.id} 저장 실패: ${err.message}`);
        fail++;
        failedIds.push(item.row.id);
      }
    }

    progress(Math.min(i + batch.length, rows.length), rows.length, ok, fail, startTime);

    // Rate limit 방지 딜레이
    if (i + BATCH_SIZE < rows.length) {
      await delay(DELAY_MS);
    }
  }

  // 4. 결과 출력
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 완료! 총 ${rows.length}건 처리 (${elapsed}s)`);
  console.log(`   성공: ${ok}건 | 실패: ${fail}건`);
  if (failedIds.length > 0) {
    console.log(`   실패 ID: ${failedIds.join(', ')}`);
    console.log(`   실패건 재시도: node scripts/buildEmbeddings.js --force --id [ID]`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 5. 현재 청크 테이블 통계 출력
  await printStats();

  process.exit(0);
}

// ── 통계 출력 ─────────────────────────────────────────────────
async function printStats() {
  const connection = await pool.getConnection(async c => c);
  try {
    const [[{ total }]] = await connection.query(
      'SELECT COUNT(*) AS total FROM work_log_rag_chunks WHERE embedding_json IS NOT NULL'
    );
    const [byEqType]    = await connection.query(`
      SELECT equipment_type, COUNT(*) AS cnt
      FROM work_log_rag_chunks
      WHERE embedding_json IS NOT NULL
      GROUP BY equipment_type
      ORDER BY cnt DESC
    `);

    console.log('📊 work_log_rag_chunks 현황:');
    console.log(`   총 임베딩 완료: ${total}건`);
    console.log('   설비종류별:');
    byEqType.forEach(r => {
      console.log(`     ${(r.equipment_type || '(없음)').padEnd(20)} ${r.cnt}건`);
    });
  } finally {
    connection.release();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── 실행 ─────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n💥 치명적 오류:', err);
  process.exit(1);
});
