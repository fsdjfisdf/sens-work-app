/**
 * back/src/dao/aiDao.js
 *
 * AI 질의응답용 DAO
 * - DB 연결: back/config/database.js (mysql2/promise pool) — 기존 방식 동일
 * - SQL injection 방지: placeholder(?) 전용
 * - 기존 work_LogDao.js 패턴 (pool.getConnection → query → release) 동일 적용
 */

'use strict';

const { pool } = require('../../config/database');

// ─────────────────────────────────────────────────────────────
// 1. work_log 텍스트 검색
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} p
 * @param {string}  p.keyword        검색 키워드 (서비스 레이어에서 추출)
 * @param {string}  p.equipment_type 필수 필터 (DB 컬럼명: equipment_type / 엑셀: eq type)
 * @param {string} [p.site]          선택 필터
 * @param {string} [p.line]          선택 필터
 * @param {string} [p.date_from]     YYYY-MM-DD
 * @param {string} [p.date_to]       YYYY-MM-DD
 * @param {number} [p.top_k=10]      최대 결과 수 (1~100)
 * @returns {Promise<Array>}
 */
exports.searchWorkLogs = async ({ keyword = '', equipment_type, site, line, date_from, date_to, top_k = 10 }) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const conditions = [];
    const values     = [];

    // ── 필수: equipment_type ──────────────────────────────────
    // 엑셀 컬럼명 "eq type" → DB 컬럼명 equipment_type (매핑 주의)
    conditions.push('equipment_type = ?');
    values.push(equipment_type);

    // ── 선택: site ────────────────────────────────────────────
    if (site && site.trim() !== '' && site !== 'ALL') {
      conditions.push('site = ?');
      values.push(site.trim());
    }

    // ── 선택: line ────────────────────────────────────────────
    if (line && line.trim() !== '' && line !== 'ALL') {
      conditions.push('`line` = ?');
      values.push(line.trim());
    }

    // ── 선택: 날짜 범위 ───────────────────────────────────────
    if (date_from) {
      conditions.push('task_date >= ?');
      values.push(date_from);
    }
    if (date_to) {
      conditions.push('task_date <= ?');
      values.push(date_to);
    }

    // ── 키워드: task_description 최우선, 나머지 컬럼 포함 ─────
    // 엑셀 "action" 컬럼 = DB task_description (작업 방법 질의 핵심)
    // 엑셀 "man"    컬럼 = DB task_man (main/support 파싱은 서비스 레이어)
    if (keyword && keyword.trim() !== '') {
      const kw = `%${keyword.trim()}%`;
      conditions.push(`(
        task_description LIKE ?
        OR task_name     LIKE ?
        OR task_cause    LIKE ?
        OR task_result   LIKE ?
        OR task_man      LIKE ?
        OR equipment_name LIKE ?
        OR SOP           LIKE ?
        OR tsguide       LIKE ?
      )`);
      values.push(kw, kw, kw, kw, kw, kw, kw, kw);
    }

    const where  = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    // top_k: 정수 강제 변환 후 범위 제한 (SQL injection 방지 — LIMIT에 placeholder 미사용)
    const limit  = Math.min(Math.max(parseInt(top_k, 10) || 10, 1), 100);

    const sql = `
      SELECT
        id,
        task_name,
        task_date,
        task_man,
        \`group\`,
        site,
        \`line\`,
        equipment_type,
        equipment_name,
        warranty,
        status,
        task_description,
        task_cause,
        task_result,
        SOP,
        tsguide,
        work_type,
        work_type2,
        setup_item,
        maint_item,
        transfer_item,
        task_duration,
        start_time,
        end_time,
        task_maint
      FROM work_log
      ${where}
      ORDER BY task_date DESC, id DESC
      LIMIT ${limit}
    `;

    const [rows] = await connection.query(sql, values);
    return rows;
  } catch (err) {
    console.error('[aiDao.searchWorkLogs] Error:', err.message);
    throw new Error(`작업이력 검색 중 오류: ${err.message}`);
  } finally {
    connection.release();
  }
};


// ─────────────────────────────────────────────────────────────
// 2. 드롭다운 옵션 조회
// ─────────────────────────────────────────────────────────────
/**
 * equipment_type 목록 (DB에서 실시간 조회 → 드롭다운 동적 구성)
 * @returns {Promise<string[]>}
 */
exports.getEquipmentTypes = async () => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const [rows] = await connection.query(`
      SELECT DISTINCT equipment_type
      FROM work_log
      WHERE equipment_type IS NOT NULL
        AND equipment_type != ''
        AND equipment_type != 'SELECT'
      ORDER BY equipment_type ASC
    `);
    return rows.map((r) => r.equipment_type);
  } catch (err) {
    throw new Error(`equipment_type 목록 조회 오류: ${err.message}`);
  } finally {
    connection.release();
  }
};

/**
 * site 목록
 * @returns {Promise<string[]>}
 */
exports.getSites = async () => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const [rows] = await connection.query(`
      SELECT DISTINCT site
      FROM work_log
      WHERE site IS NOT NULL
        AND site != ''
        AND site != 'SELECT'
      ORDER BY site ASC
    `);
    return rows.map((r) => r.site);
  } catch (err) {
    throw new Error(`site 목록 조회 오류: ${err.message}`);
  } finally {
    connection.release();
  }
};


// ─────────────────────────────────────────────────────────────
// 3. AI 질의 로그 저장
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} p
 */
exports.saveQueryLog = async ({ question, equipment_type, site, line, date_from, date_to, top_k, result_count, response_text, used_embedding, ai_model, elapsed_ms, user_agent }) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    await connection.query(
      `INSERT INTO ai_query_logs
        (question, equipment_type, site, \`line\`, date_from, date_to,
         top_k, result_count, response_text, used_embedding, ai_model, elapsed_ms, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        question,
        equipment_type,
        site        || null,
        line        || null,
        date_from   || null,
        date_to     || null,
        top_k       || 10,
        result_count|| 0,
        response_text ? response_text.substring(0, 2000) : null,
        used_embedding ? 1 : 0,
        ai_model    || 'sql-search-v1',
        elapsed_ms  || null,
        user_agent  || null,
      ]
    );
  } catch (err) {
    // 로그 저장 실패는 메인 응답에 영향 없도록 warn만
    console.warn('[aiDao.saveQueryLog] 로그 저장 실패 (무시):', err.message);
  } finally {
    connection.release();
  }
};


// ─────────────────────────────────────────────────────────────
// 4. RAG 청크 저장 (OpenAI 임베딩 후 저장)
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} p
 * @param {number} p.work_log_id
 * @param {number} p.chunk_index
 * @param {string} p.chunk_text
 * @param {Array}  p.embedding       float 배열
 * @param {string} p.embedding_model
 * @param {string} p.equipment_type
 * @param {string} p.site
 * @param {string} p.line
 * @param {string} p.task_date
 */
exports.saveRagChunk = async ({ work_log_id, chunk_index = 0, chunk_text, embedding, embedding_model = 'text-embedding-3-small', equipment_type, site, line, task_date }) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const embeddingJson = embedding ? JSON.stringify(embedding) : null;
    await connection.query(
      `INSERT INTO work_log_rag_chunks
        (work_log_id, chunk_index, chunk_text, embedding_json, embedding_model,
         equipment_type, site, \`line\`, task_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         chunk_text      = VALUES(chunk_text),
         embedding_json  = VALUES(embedding_json),
         embedding_model = VALUES(embedding_model),
         updated_at      = NOW()`,
      [work_log_id, chunk_index, chunk_text, embeddingJson, embedding_model,
       equipment_type || null, site || null, line || null, task_date || null]
    );
  } catch (err) {
    throw new Error(`RAG 청크 저장 오류: ${err.message}`);
  } finally {
    connection.release();
  }
};


// ─────────────────────────────────────────────────────────────
// 5. RAG 청크 조회 (벡터 검색 전 pre-filter용 후보군 조회)
//    TODO: 실제 벡터 유사도 계산은 외부 벡터DB(Pinecone 등) 또는
//          MySQL에서 embedding_json 파싱 후 코사인 유사도 계산으로 구현
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} p
 * @param {string} p.equipment_type
 * @param {string} [p.site]
 * @param {number} [p.limit=50]   후보 청크 최대 수
 * @returns {Promise<Array<{id, work_log_id, chunk_text, embedding_json, equipment_type, site, line, task_date}>>}
 */
exports.getRagChunkCandidates = async ({ equipment_type, site, limit = 50 }) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const conditions = ['equipment_type = ?', 'embedding_json IS NOT NULL'];
    const values     = [equipment_type];

    if (site && site !== 'ALL') {
      conditions.push('site = ?');
      values.push(site);
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const [rows] = await connection.query(
      `SELECT id, work_log_id, chunk_text, embedding_json, equipment_type, site, \`line\`, task_date
       FROM work_log_rag_chunks
       WHERE ${conditions.join(' AND ')}
       ORDER BY task_date DESC
       LIMIT ${safeLimit}`,
      values
    );
    return rows;
  } catch (err) {
    throw new Error(`RAG 청크 조회 오류: ${err.message}`);
  } finally {
    connection.release();
  }
};
