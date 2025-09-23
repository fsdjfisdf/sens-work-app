const workLogDao = require('../dao/work_LogDao');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const workLogPaidController = require('./workLogPaidController');

/** 결재자 매핑 (Users.nickname 과 일치) */
const APPROVER_MAP = {
  'PEE1:PT': ['조지훈', '전대영', '손석현'],
  'PEE1:HS': ['진덕장', '한정훈', '정대환'],
  'PEE1:IC': ['강문호', '배한훈', '최원준'],
  'PEE1:CJ': ['강문호', '배한훈', '최원준'],
  'PEE2:PT': ['이지웅', '송왕근', '정현우'],
  'PEE2:HS': ['안재영', '김건희'],
  'PSKH:*':  ['유정현', '문순현'],
};
const approverKey = (g,s)=> g==='PSKH' ? 'PSKH:*' : `${g}:${s}`;
const getApproverNicknames = (g,s)=> (APPROVER_MAP[approverKey(g,s)]||[]);
const isUserAllowedApprover = (user,g,s)=> {
  // admin/editor는 전역 허용
  if (user?.role === 'admin' || user?.role === 'editor') return true;
  // 그 외에는 그룹/사이트 매핑된 닉네임으로 허용
  return getApproverNicknames(g,s).includes(user?.nickname);
};

/* ────────────────────────────────────────────────
 * 기존 CRUD (그대로 유지)
 * ──────────────────────────────────────────────── */
exports.getWorkLogs = async (req, res) => {
  try {
    const logs = await workLogDao.getWorkLogs();
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addWorkLog = async (req, res) => {
  const {
    task_name, task_result, task_cause, task_man, task_description,
    task_date, start_time, end_time, none_time, move_time,
    group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name,
    workType, workType2, setupItem, maintItem, transferItem, task_maint, status, ems
  } = req.body;

  try {
    await workLogDao.addWorkLog(
      task_name, task_result, task_cause, task_man, task_description,
      task_date, start_time, end_time, none_time, move_time,
      group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name,
      workType, workType2, setupItem, maintItem, transferItem, task_maint, status,
      (ems === 0 || ems === 1) ? ems : null
    );
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    console.error('Error adding work log:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteWorkLog = async (req, res) => {
  const { id } = req.params;
  try {
    await workLogDao.deleteWorkLog(id);
    res.status(200).json({ message: "Work log deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportWorkLogs = async (req, res) => {
  try {
    const logs = await workLogDao.getWorkLogs();
    const worksheet = xlsx.utils.json_to_sheet(logs);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Work Logs');

    const filePath = path.join(__dirname, '../temp', 'work_logs.xlsx');
    xlsx.writeFile(workbook, filePath);

    res.download(filePath, 'work_logs.xlsx', err => {
      if (err) console.error('Error downloading the file:', err);
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error('Error exporting work logs:', err);
    res.status(500).send('Error exporting work logs');
  }
};

exports.updateWorkLog = async (req, res) => {
  const { id } = req.params;
  const {
    task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time,
    group, site, line, warranty, equipment_type, equipment_name, status, ems
  } = req.body;

  try {
    const existingLog = await workLogDao.getWorkLogById(id);
    if (!existingLog) {
      return res.status(404).json({ error: "Log not found" });
    }

    await workLogDao.updateWorkLog(
      id,
      task_name !== undefined ? task_name : existingLog.task_name,
      task_result !== undefined ? task_result : existingLog.task_result,
      task_cause !== undefined ? task_cause : existingLog.task_cause,
      task_man !== undefined ? task_man : existingLog.task_man,
      task_description !== undefined ? task_description : existingLog.task_description,
      task_date !== undefined ? task_date : existingLog.task_date,
      start_time !== undefined ? start_time : existingLog.start_time,
      end_time !== undefined ? end_time : existingLog.end_time,
      group !== undefined ? group : existingLog.group,
      site !== undefined ? site : existingLog.site,
      line !== undefined ? line : existingLog.line,
      warranty !== undefined ? warranty : existingLog.warranty,
      equipment_type !== undefined ? equipment_type : existingLog.equipment_type,
      equipment_name !== undefined ? equipment_name : existingLog.equipment_name,
      status !== undefined ? status : existingLog.status,
      (ems !== undefined) ? ((ems===0||ems===1)?ems:null) : existingLog.ems
    );
    res.status(200).json({ message: "Work log updated" });
  } catch (err) {
    console.error(`Error updating work log with ID: ${id}`, err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateTaskCount = async (req, res) => {
  const { task_man, transfer_item } = req.body;
  try {
    const engineers = task_man.split(',').map(engineer => engineer.trim().split('(')[0].trim());
    for (const engineer of engineers) {
      await workLogDao.incrementTaskCount(engineer, transfer_item);
    }
    res.status(200).json({ message: 'Task count updated successfully' });
  } catch (err) {
    console.error('Error updating task count:', err.message);
    res.status(500).json({ error: 'Error updating task count' });
  }
};

exports.getSupraXPWorkLogs = async (req, res) => {
  try {
    const logs = await workLogDao.getSupraXPWorkLogs('SUPRA XP');
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ────────────────────────────────────────────────
 * 결재자 목록
 * GET /approval/approvers?group=PEE1&site=PT
 * ──────────────────────────────────────────────── */
exports.getApproversForGroupSite = async (req, res) => {
  const g = req.query.group || '';
  const s = req.query.site || '';
  if (!g) return res.status(400).json({ error: 'group is required' });

  const names = getApproverNicknames(g, s);
  if (!names.length) return res.json({ approvers: [] });

  try {
    const users = await workLogDao.getUsersByNicknames(names);
    const order = new Map(names.map((n,i)=>[n,i]));
    users.sort((a,b)=> (order.get(a.nickname) ?? 999) - (order.get(b.nickname) ?? 999));
    res.json({ approvers: users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'approver fetch failed' });
  }
};

/* ────────────────────────────────────────────────
 * 제출: 제출자 닉네임이 task_man 에 반드시 포함
 * POST /approval/work-log/submit
 * ──────────────────────────────────────────────── */
exports.submitWorkLogPending = async (req, res) => {
  try {
    const payload = req.body || {};
    payload.submitted_by = req.user?.nickname || req.body.submitted_by || 'unknown';

    const d = {
      task_result    : payload.task_result    ?? '',
      task_cause     : payload.task_cause     ?? '',
      task_man       : payload.task_man       ?? '',
      task_description: payload.task_description ?? '',
      task_date      : payload.task_date      ?? '1970-01-01',
      start_time     : payload.start_time     ?? '00:00:00',
      end_time       : payload.end_time       ?? '00:00:00',
      none_time      : Number(payload.none_time) || 0,
      move_time      : Number(payload.move_time) || 0,
      group          : payload.group          ?? 'SELECT',
      site           : payload.site           ?? 'SELECT',
      SOP            : payload.SOP            ?? 'SELECT',
      tsguide        : payload.tsguide        ?? 'SELECT',
      line           : payload.line           ?? 'SELECT',
      warranty       : payload.warranty       ?? 'SELECT',
      equipment_type : payload.equipment_type ?? 'SELECT',
      equipment_name : payload.equipment_name ?? '',
      workType       : payload.workType       ?? 'SELECT',
      workType2      : payload.workType2      ?? 'SELECT',
      setupItem      : payload.setupItem      ?? 'SELECT',
      maintItem      : payload.maintItem      ?? 'SELECT',
      transferItem   : payload.transferItem   ?? 'SELECT',
      status         : payload.status         ?? 'active',
      task_maint     : payload.task_maint     ?? 'SELECT',
      task_name      : payload.task_name      ?? '',
      submitted_by   : payload.submitted_by,
      ems            : (payload.ems === 0 || payload.ems === 1) ? payload.ems : null
    };

    const hasMe = String(d.task_man||'').split(',').map(x=>x.trim().split('(')[0].trim()).includes(d.submitted_by);
    if (!hasMe) {
      return res.status(400).json({ error: '제출자는 task_man(작업자)에 본인 이름이 포함되어야 합니다.' });
    }

    const pendingId = await workLogDao.submitPendingWorkLog(d);
    res.status(201).json({ message: '결재 대기 등록 완료', pending_id: pendingId });
  } catch (err) {
    console.error('submit pending error:', err);
    res.status(500).json({ error: '결재 대기 등록 중 오류' });
  }
};

/* ────────────────────────────────────────────────
 * 대기 목록 (group/site 필터)
 * GET /approval/work-log/pending?group=&site=
 * ──────────────────────────────────────────────── */
exports.listPendingWorkLogs = async (req, res) => {
  try {
    const g = req.query.group || '';
    const s = req.query.site || '';
    const mine = String(req.query.mine || '') === '1' || String(req.query.mine || '').toLowerCase() === 'true';
    const me = mine ? (req.user?.nickname || null) : null;
    const rows = await workLogDao.listPendingWorkLogs(g, s, me);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: '대기 목록 조회 오류' });
  }
};

/* 단건 조회 */
exports.getPendingWorkLogOne = async (req, res) => {
  try {
    const row = await workLogDao.getPendingById(req.params.id);
    if (!row) return res.status(404).json({ error: '없음' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: '조회 오류' });
  }
};

/* ────────────────────────────────────────────────
 * 대기/반려건 수정 (결재자 또는 제출자)
 * PATCH /approval/work-log/:id
 * ──────────────────────────────────────────────── */
exports.updatePendingWorkLog = async (req, res) => {
  try {
    const id = req.params.id;
    const patch = { ...(req.body || {}) };

    // ems 값 검증: 0/1만 허용, 그 외는 null(미결정) 처리
    if (patch.hasOwnProperty('ems')) {
      if (patch.ems === 0 || patch.ems === 1) {
        // OK
      } else if (patch.ems === null || patch.ems === 'null') {
        patch.ems = null;
      } else {
        return res.status(400).json({ error: 'ems는 0(무상), 1(유상), null(미결정)만 허용' });
      }
    }
    const row = await workLogDao.getPendingById(id);
    if (!row) return res.status(404).json({ error: '없음' });

    const isApprover = isUserAllowedApprover(req.user, row.group, row.site);
    const isSubmitter = (req.user?.nickname === row.submitted_by);

    const isPending = !row.approval_status || row.approval_status === 'pending';
    if (isPending && !isApprover) {
      return res.status(403).json({ error: '대기 상태 수정 권한 없음(결재자만 가능)' });
    }
    if (row.approval_status === 'rejected' && !isSubmitter && req.user?.role!=='admin') {
      return res.status(403).json({ error: '반려건 수정은 제출자만 가능' });
    }

    await workLogDao.updatePendingWorkLogFields(id, patch);
    res.json({ message: '수정 완료' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '수정 오류' });
  }
};

/* ────────────────────────────────────────────────
 * 내 반려 목록
 * GET /approval/work-log/rejected/mine
 * ──────────────────────────────────────────────── */
exports.listMyRejected = async (req, res) => {
  try {
    const me = req.user?.nickname;
    if (!me) return res.status(401).json({ error: '인증 필요' });
    const rows = await workLogDao.listRejectedByUser(me);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: '조회 오류' });
  }
};

/* ────────────────────────────────────────────────
 * 반려건 재제출
 * POST /approval/work-log/:id/resubmit
 * ──────────────────────────────────────────────── */
exports.resubmitPendingWorkLog = async (req, res) => {
  try {
    const id = req.params.id;
    const patch = req.body?.patch || {};
    const me = req.user?.nickname;
    const row = await workLogDao.getPendingById(id);
    if (!row) return res.status(404).json({ error: '없음' });

    if (row.approval_status !== 'rejected') {
      return res.status(400).json({ error: '반려 상태만 재제출 가능' });
    }
    if (row.submitted_by !== me && req.user?.role!=='admin') {
      return res.status(403).json({ error: '본인 반려건만 재제출 가능' });
    }

    if (Object.keys(patch).length) {
      await workLogDao.updatePendingWorkLogFields(id, patch);
    }

    const after = await workLogDao.getPendingById(id);
    const includeMe = String(after.task_man||'').split(',').map(x=>x.trim().split('(')[0].trim()).includes(me);
    if (!includeMe) {
      return res.status(400).json({ error: '재제출 전 task_man 에 제출자 이름이 포함되어야 합니다.' });
    }

    await workLogDao.resubmitPendingWorkLog(id, me);
    res.json({ message: '재제출 완료' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '재제출 오류' });
  }
};

/* ────────────────────────────────────────────────
 * 승인 (결재자가 patch로 보정 가능)
 * POST /approval/work-log/:id/approve
 * ──────────────────────────────────────────────── */
exports.approvePendingWorkLog = async (req, res) => {
  const { id } = req.params;
  const { note, patch } = req.body || {};
  try {
    const pending = await workLogDao.getPendingById(id);
    if (!pending) return res.status(404).json({ error: '대기 데이터 없음' });

    if (!isUserAllowedApprover(req.user, pending.group, pending.site)) {
      return res.status(403).json({ error: '해당 그룹/사이트의 결재 권한이 없습니다.' });
    }

    // (선택) 결재자가 보정한 patch 반영
    if (patch && Object.keys(patch).length) {
      await workLogDao.updatePendingWorkLogFields(id, patch);
    }

    const approver = req.user?.nickname || 'admin';

    // ✅ 여기서 본 테이블로 이관하고, 새 workLogId를 반드시 돌려받음
    const workLogId = await workLogDao.approvePendingWorkLog(id, approver, note || '');


    // (기존) 승인 시 작업 카운트 증가
    const tr = (patch?.transfer_item ?? pending.transfer_item);
    const taskMan = (patch?.task_man ?? pending.task_man);
    if (tr && tr !== 'SELECT' && taskMan) {
      const engineers = String(taskMan)
        .split(',')
        .map(x => x.trim().split('(')[0].trim())
        .filter(Boolean);
      for (const eng of engineers) {
        try { await workLogDao.incrementTaskCount(eng, tr); } catch (_) {}
      }
    }

    res.status(200).json({ message: '승인 및 저장 완료', work_log_id: workLogId });
  } catch (err) {
    console.error('approve error:', err);
    res.status(500).json({ error: '승인 처리 오류' });
  }
};


/* 반려 */
exports.rejectPendingWorkLog = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};
  try {
    const pending = await workLogDao.getPendingById(id);
    if (!pending) return res.status(404).json({ error: '대기 데이터 없음' });

    if (!isUserAllowedApprover(req.user, pending.group, pending.site)) {
      return res.status(403).json({ error: '해당 그룹/사이트의 결재 권한이 없습니다.' });
    }

    const approver = req.user?.nickname || 'admin';
    await workLogDao.rejectPendingWorkLog(id, approver, note || '');
    res.status(200).json({ message: '반려 처리 완료' });
  } catch (err) {
    res.status(500).json({ error: '반려 처리 오류' });
  }
};
