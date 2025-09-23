// controllers/workLogPaidController.js
// 유상(EMS) 상세: 대기건(pending) 업로드 + 조회 컨트롤러
// 라우팅 예시:
//   POST /approval/work-log-paid/pending/:id
//   GET  /approval/work-log-paid/pending/:id
//   GET  /approval/work-log-paid/live/:workLogId

const express = require('express');
const router = express.Router();

const { pool } = require('../../config/database'); // ← 경로 확인
const paidDao  = require('../dao/work_LogPaidDao'); // ← 경로 확인

// ----- helpers -----
function isHHMM(v) {
  return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v);
}
function isHHMMSS(v) {
  return typeof v === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(v);
}
function normTime(v) {
  if (v == null || v === '') return null;
  if (isHHMMSS(v)) return v;
  if (isHHMM(v)) return v + ':00';
  throw new Error(`시간 형식 오류: ${v} (HH:MM 또는 HH:MM:SS)`);
}
function toMin(v) {
  const s = isHHMM(v) ? v : isHHMMSS(v) ? v.slice(0,5) : null;
  if (!s) return null;
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
function validateRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    const err = new Error('rows 배열이 비어 있습니다.');
    err.status = 422;
    throw err;
  }
  // 최대 200행 같은 안전장치 (원하면 조정)
  if (rawRows.length > 200) {
    const err = new Error('rows 개수가 너무 큽니다. (최대 200)');
    err.status = 413;
    throw err;
  }

  const rows = rawRows.map((r, i) => {
    const paid_worker = (r.paid_worker || '').trim();
    if (!paid_worker) {
      const err = new Error(`rows[${i}] 작업자(paid_worker)는 필수입니다.`);
      err.status = 422;
      throw err;
    }
    const ls = normTime(r.line_start_time);
    const le = normTime(r.line_end_time);
    const is = normTime(r.inform_start_time);
    const ie = normTime(r.inform_end_time);

    // 순서 제약: line_start < line_end, inform_start < inform_end
    const lsm = toMin(ls);
    const lem = toMin(le);
    const ism = toMin(is);
    const iem = toMin(ie);

    if (lsm == null || lem == null || ism == null || iem == null) {
      const err = new Error(`rows[${i}] 시간 형식이 올바르지 않습니다.`);
      err.status = 422;
      throw err;
    }
    if (!(lsm < lem)) {
      const err = new Error(`rows[${i}] 라인 퇴실은 라인 입실보다 늦어야 합니다.`);
      err.status = 422;
      throw err;
    }
    if (!(ism < iem)) {
      const err = new Error(`rows[${i}] 작업 완료는 작업 시작보다 늦어야 합니다.`);
      err.status = 422;
      throw err;
    }
    // 포함 관계: line_start < inform_start < inform_end < line_end
    if (!(lsm < ism)) {
      const err = new Error(`rows[${i}] 라인 입실은 작업 시작보다 빨라야 합니다.`);
      err.status = 422;
      throw err;
    }
    if (!(iem < lem)) {
      const err = new Error(`rows[${i}] 라인 퇴실은 작업 완료보다 늦어야 합니다.`);
      err.status = 422;
      throw err;
    }

    return {
      paid_worker,
      line_start_time: ls,
      line_end_time: le,
      inform_start_time: is,
      inform_end_time: ie,
    };
  });

  return rows;
}

// pending 스냅샷 조회 (insert 시 메타 복제용)
async function getPendingSnapshot(pendingId) {
  const [rows] = await pool.query(
    `SELECT 
       task_name, task_date, \`group\`, site, \`line\`, warranty,
       equipment_type, equipment_name, ems
     FROM work_log_pending
     WHERE id = ?`,
    [pendingId]
  );
  return rows[0] || null;
}

// ----- Controllers -----

// POST /approval/work-log-paid/pending/:id
// - 같은 pending_id의 기존 상세를 모두 대체(replace)하여 저장합니다.
async function uploadPendingPaidRows(req, res) {
  try {
    const pendingId = Number(req.params.id);
    if (!pendingId) {
      return res.status(400).json({ error: '올바른 pending id가 아닙니다.' });
    }

    const rows = validateRows(req.body?.rows || []);

    // pending 존재/스냅샷 확보
    const snap = await getPendingSnapshot(pendingId);
    if (!snap) {
      return res.status(404).json({ error: '해당 대기 건이 존재하지 않습니다.' });
    }

    // 기존 rows 대체 저장 (중복 방지)
    const inserted = await paidDao.replacePendingPaidRows(pendingId, rows, snap);

    return res.status(201).json({
      pending_id: pendingId,
      inserted,
      message: '유상 상세 저장 완료',
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || '서버 오류' });
    }
}

// GET /approval/work-log-paid/pending/:id
// - 대기 테이블 상세 조회(검증용)
async function listPendingPaidRows(req, res) {
  try {
    const pendingId = Number(req.params.id);
    if (!pendingId) {
      return res.status(400).json({ error: '올바른 pending id가 아닙니다.' });
    }
    const rows = await paidDao.getPendingPaidRows(pendingId);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message || '서버 오류' });
  }
}

// GET /approval/work-log-paid/live/:workLogId
// - 본 테이블 상세 조회(검증용)
async function listLivePaidRows(req, res) {
  try {
    const workLogId = Number(req.params.workLogId);
    if (!workLogId) {
      return res.status(400).json({ error: '올바른 work_log_id가 아닙니다.' });
    }
    const rows = await paidDao.getLivePaidRows(workLogId);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message || '서버 오류' });
  }
}

// ----- Router 바인딩(선택) -----
// (앱에서 app.use(router) 하거나 상위 라우터에 붙이세요)
router.post('/approval/work-log-paid/pending/:id', uploadPendingPaidRows);
router.get('/approval/work-log-paid/pending/:id', listPendingPaidRows);
router.get('/approval/work-log-paid/live/:workLogId', listLivePaidRows);

module.exports = {
  router,
  uploadPendingPaidRows,
  listPendingPaidRows,
  listLivePaidRows,
};
