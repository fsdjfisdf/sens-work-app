/**
 * back/src/controllers/aiController.js
 *
 * AI 질의응답 컨트롤러
 * - body 파싱 및 유효성 검사
 * - aiService 호출
 * - 에러 처리 (기존 workLogController.js 패턴 동일 적용)
 */

'use strict';

const aiService = require('../services/aiService');

// ─────────────────────────────────────────────────────────────
// POST /api/ai/worklog/query
// Body: { question, equipment_type, site?, line?, date_from?, date_to?, top_k? }
// ─────────────────────────────────────────────────────────────
exports.worklogQuery = async (req, res) => {
  try {
    const { question, equipment_type, site, line, date_from, date_to, top_k } = req.body;

    // ── 필수값 검증 ─────────────────────────────────────────
    if (!question || !question.trim()) {
      return res.status(400).json({ ok: false, error: '질문(question)을 입력해주세요.' });
    }
    if (!equipment_type || !equipment_type.trim() || equipment_type === 'SELECT') {
      return res.status(400).json({ ok: false, error: '설비 종류(equipment_type)는 필수 선택 항목입니다.' });
    }

    // ── 날짜 유효성 (입력 시) ─────────────────────────────────
    if (date_from && date_to && date_from > date_to) {
      return res.status(400).json({ ok: false, error: '시작일이 종료일보다 늦습니다.' });
    }

    // ── top_k 정규화 ─────────────────────────────────────────
    const parsedTopK = Math.min(Math.max(parseInt(top_k, 10) || 10, 1), 100);

    // ── 서비스 호출 ──────────────────────────────────────────
    const result = await aiService.query({
      question:       question.trim(),
      equipment_type: equipment_type.trim(),
      site:           (site  && site.trim()  !== '' && site  !== 'ALL') ? site.trim()  : null,
      line:           (line  && line.trim()  !== '' && line  !== 'ALL') ? line.trim()  : null,
      date_from:      date_from || null,
      date_to:        date_to   || null,
      top_k:          parsedTopK,
      userAgent:      req.headers['user-agent'],
    });

    return res.status(200).json({ ok: true, ...result });

  } catch (err) {
    console.error('[aiController.worklogQuery] 오류:', err.message);
    return res.status(500).json({ ok: false, error: err.message || '서버 내부 오류가 발생했습니다.' });
  }
};


// ─────────────────────────────────────────────────────────────
// GET /api/ai/filter-options
// 드롭다운 초기 데이터 (equipment_type, site 목록)
// ─────────────────────────────────────────────────────────────
exports.getFilterOptions = async (req, res) => {
  try {
    const options = await aiService.getFilterOptions();
    return res.status(200).json({ ok: true, ...options });
  } catch (err) {
    console.error('[aiController.getFilterOptions] 오류:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
};


// ─────────────────────────────────────────────────────────────
// POST /api/ai/worklog/rag-query  (Phase 2 - 임베딩 준비 후 활성화)
// ─────────────────────────────────────────────────────────────
exports.ragQuery = async (req, res) => {
  try {
    const { question, equipment_type, site, line, date_from, date_to, top_k } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ ok: false, error: '질문을 입력해주세요.' });
    }
    if (!equipment_type || equipment_type === 'SELECT') {
      return res.status(400).json({ ok: false, error: '설비 종류는 필수입니다.' });
    }

    const result = await aiService.ragQuery({
      question:       question.trim(),
      equipment_type: equipment_type.trim(),
      site:           site      || null,
      line:           line      || null,
      date_from:      date_from || null,
      date_to:        date_to   || null,
      top_k:          Math.min(Math.max(parseInt(top_k, 10) || 10, 1), 50),
      userAgent:      req.headers['user-agent'],
    });

    return res.status(200).json({ ok: true, ...result });

  } catch (err) {
    console.error('[aiController.ragQuery] 오류:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
