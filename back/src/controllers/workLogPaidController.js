// src/controllers/workLogPaidController.js
const workLogDao = require('../dao/work_LogDao');
const paidDao    = require('../dao/work_LogPaidDao');
const { pool }   = require('../../config/database');

// util
const _isHms = (s) => /^\d{2}:\d{2}(:\d{2})?$/.test(String(s||''));
const _toSec = (s) => {
  const [hh, mm, ss='00'] = String(s).split(':').map(n => Number(n||0));
  return hh*3600 + mm*60 + Number(ss||0);
};
const _norm = (s) => {
  if (!_isHms(s)) return '00:00:00';
  const [hh,mm,ss='00'] = String(s).split(':');
  return `${hh}:${mm}:${ss||'00'}`;
};
const _validateItems = (items=[]) => {
  if (!Array.isArray(items) || !items.length) return 'items 배열이 비어있습니다.';
  for (const [i, it] of items.entries()) {
    if (!String(it.paid_worker||'').trim()) return `${i+1}번째: 작업자가 비어있습니다.`;
    if (!_isHms(it.line_start_time) || !_isHms(it.line_end_time))
      return `${i+1}번째: 라인 입/퇴실 시간 형식이 잘못되었습니다.(HH:MM 또는 HH:MM:SS)`;
    if (_toSec(_norm(it.line_end_time)) <= _toSec(_norm(it.line_start_time)))
      return `${i+1}번째: 라인 퇴실시간은 입실시간보다 늦어야 합니다.`;
    if (!_isHms(it.inform_start_time) || !_isHms(it.inform_end_time))
      return `${i+1}번째: 작업 시작/완료 시간 형식이 잘못되었습니다.(HH:MM 또는 HH:MM:SS)`;
    if (_toSec(_norm(it.inform_end_time)) <= _toSec(_norm(it.inform_start_time)))
      return `${i+1}번째: 작업 완료시간은 시작시간보다 늦어야 합니다.`;
  }
  return null;
};

/**
 * [PENDING] 유상 상세 저장(교체)
 * POST /approval/work-log/:pendingId/paid
 * body: { items: [{ paid_worker, line_start_time, line_end_time, inform_start_time, inform_end_time }, ...] }
 */
exports.savePendingPaid = async (req, res) => {
  const pendingId = Number(req.params.pendingId);
  const items = req.body?.items || [];
  try {
    const row = await workLogDao.getPendingById(pendingId);
    if (!row) return res.status(404).json({ error: '대기 데이터가 없습니다.' });
    if (row.ems !== 1) return res.status(400).json({ error: 'EMS=1(유상)인 경우만 유상 상세를 저장할 수 있습니다.' });

    const err = _validateItems(items);
    if (err) return res.status(422).json({ error: err });

    const base = {
      task_name: row.task_name,
      task_date: row.task_date,
      group: row.group,
      site: row.site,
      line: row.line,
      warranty: row.warranty,
      equipment_name: row.equipment_name,
      ems: 1
    };
    const saved = await paidDao.replacePendingPaid(pendingId, base, items);
    return res.status(200).json({ message: '유상 상세 저장 완료', saved });
  } catch (e) {
    console.error('savePendingPaid error:', e);
    res.status(500).json({ error: '유상 상세 저장 중 오류' });
  }
};

/** [PENDING] 조회 */
exports.getPendingPaid = async (req, res) => {
  const pendingId = Number(req.params.pendingId);
  try {
    const rows = await paidDao.listPendingPaid(pendingId);
    res.json({ items: rows });
  } catch (e) {
    res.status(500).json({ error: '조회 오류' });
  }
};

/** [PENDING] 삭제(전부) */
exports.clearPendingPaid = async (req, res) => {
  const pendingId = Number(req.params.pendingId);
  try {
    await paidDao.clearPendingPaid(pendingId);
    res.json({ message: '삭제 완료' });
  } catch (e) {
    res.status(500).json({ error: '삭제 오류' });
  }
};

/**
 * [FINAL] 바로 본 테이블 기준으로 유상 상세 추가 (옵션)
 * POST /work-logs/:workLogId/paid
 */
exports.addFinalPaid = async (req, res) => {
  const workLogId = Number(req.params.workLogId);
  const items = req.body?.items || [];
  try {
    const conn = await pool.getConnection(async c => c);
    try {
      const [[wl]] = await conn.query(`SELECT * FROM work_log WHERE id=?`, [workLogId]);
      conn.release();
      if (!wl) return res.status(404).json({ error: 'work_log가 없습니다.' });
      if (wl.ems !== 1) return res.status(400).json({ error: 'EMS=1(유상)인 경우만 저장할 수 있습니다.' });

      const err = _validateItems(items);
      if (err) return res.status(422).json({ error: err });

      const saved = await paidDao.insertForWorkLog(wl, items);
      res.json({ message: '유상 상세 저장 완료', saved });
    } catch (e) {
      conn.release();
      throw e;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '유상 상세 저장 오류' });
  }
};

/**
 * [HOOK] 승인 시 호출: pending → final 이관
 *  - workLogController.approvePendingWorkLog 내에서
 *    새로 생성된 work_log.id 를 얻은 뒤 호출하면 됨
 */
exports.attachPaidRowsOnApprove = async (pendingId, workLogId, extConn=null) => {
  return paidDao.migratePaidOnApprove(pendingId, workLogId, extConn);
};
