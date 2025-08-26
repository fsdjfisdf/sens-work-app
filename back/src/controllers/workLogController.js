const workLogDao = require('../dao/work_LogDao');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

/* -------------------------------
 * 기본: 조회
 * ------------------------------- */
exports.getWorkLogs = async (req, res) => {
  try {
    const logs = await workLogDao.getWorkLogs();
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------
 * 기본: 직접 저장 (관리자 등 우회 저장)
 *  - task_duration을 계산하여 저장
 * ------------------------------- */
exports.addWorkLog = async (req, res) => {
  const {
    task_name, task_result, task_cause, task_man, task_description,
    task_date, start_time, end_time, none_time, move_time,
    group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name,
    workType, workType2, setupItem, maintItem, transferItem, task_maint, status
  } = req.body;

  try {
    await workLogDao.addWorkLog(
      task_name, task_result, task_cause, task_man, task_description,
      task_date, start_time, end_time, none_time, move_time,
      group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name,
      workType, workType2, setupItem, maintItem, transferItem, task_maint, status
    );
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    console.error('Error adding work log:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------
 * 기본: 삭제
 * ------------------------------- */
exports.deleteWorkLog = async (req, res) => {
  const { id } = req.params;
  try {
    await workLogDao.deleteWorkLog(id);
    res.status(200).json({ message: "Work log deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------
 * 기본: 엑셀 Export
 * ------------------------------- */
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

/* -------------------------------
 * 기본: 수정
 * ------------------------------- */
exports.updateWorkLog = async (req, res) => {
  const { id } = req.params;
  const {
    task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time,
    group, site, line, warranty, equipment_type, equipment_name, status
  } = req.body;

  console.log(`Received update request for ID: ${id}`);
  console.log('Updated log data:', req.body);

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
      status !== undefined ? status : existingLog.status
    );
    res.status(200).json({ message: "Work log updated" });
  } catch (err) {
    console.error(`Error updating work log with ID: ${id}`, err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------
 * 부가: 작업 카운트 증가
 * ------------------------------- */
exports.updateTaskCount = async (req, res) => {
  const { task_man, transfer_item } = req.body;

  console.log('Received task count update request for:', task_man, transfer_item);

  try {
    const engineers = task_man.split(',').map(engineer => engineer.trim().split('(')[0].trim());
    for (const engineer of engineers) {
      console.log(`Updating task count for engineer: ${engineer}, task: ${transfer_item}`);
      await workLogDao.incrementTaskCount(engineer, transfer_item);
    }
    res.status(200).json({ message: 'Task count updated successfully' });
  } catch (err) {
    console.error('Error updating task count:', err.message);
    res.status(500).json({ error: 'Error updating task count' });
  }
};

/* -------------------------------
 * 필터: SUPRA XP 전용
 * ------------------------------- */
exports.getSupraXPWorkLogs = async (req, res) => {
  try {
    const logs = await workLogDao.getSupraXPWorkLogs('SUPRA XP');
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------
 * 결재: 제출(대기 저장)
 * ------------------------------- */
exports.submitWorkLogPending = async (req, res) => {
  try {
    const payload = req.body || {};
    payload.submitted_by = req.user?.nickname || req.body.submitted_by || 'unknown';

    // 기본값 보정
    payload.task_result    = payload.task_result   || '';
    payload.task_cause     = payload.task_cause    || '';
    payload.task_man       = payload.task_man      || '';
    payload.task_description = payload.task_description || '';
    payload.task_date      = payload.task_date     || '1970-01-01';
    payload.start_time     = payload.start_time    || '00:00:00';
    payload.end_time       = payload.end_time      || '00:00:00';
    payload.none_time      = payload.none_time     || 0;
    payload.move_time      = payload.move_time     || 0;
    payload.group          = payload.group         || 'SELECT';
    payload.site           = payload.site          || 'SELECT';
    payload.SOP            = payload.SOP           || 'SELECT';
    payload.tsguide        = payload.tsguide       || 'SELECT';
    payload.line           = payload.line          || 'SELECT';
    payload.warranty       = payload.warranty      || 'SELECT';
    payload.equipment_type = payload.equipment_type|| 'SELECT';
    payload.equipment_name = payload.equipment_name|| '';
    payload.workType       = payload.workType      || 'SELECT';
    payload.workType2      = payload.workType2     || 'SELECT';
    payload.setupItem      = payload.setupItem     || 'SELECT';
    payload.maintItem      = payload.maintItem     || 'SELECT';
    payload.transferItem   = payload.transferItem  || 'SELECT';
    payload.status         = payload.status        || 'active';
    payload.task_maint     = payload.task_maint    || 'SELECT';

    const pendingId = await workLogDao.submitPendingWorkLog(payload);
    res.status(201).json({ message: '결재 대기 등록 완료', pending_id: pendingId });
  } catch (err) {
    console.error('submit pending error:', err);
    res.status(500).json({ error: '결재 대기 등록 중 오류' });
  }
};

/* -------------------------------
 * 결재: 대기 목록
 * ------------------------------- */
exports.listPendingWorkLogs = async (req, res) => {
  try {
    const rows = await workLogDao.listPendingWorkLogs();
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: '대기 목록 조회 오류' });
  }
};

/* -------------------------------
 * 결재: 승인 (본 테이블로 이관 + duration 계산)
 * ------------------------------- */
exports.approvePendingWorkLog = async (req, res) => {
  const { id } = req.params;
  const { note } = (req.body || {});
  try {
    const pending = await workLogDao.getPendingById(id);
    if (!pending) return res.status(404).json({ error: '대기 데이터 없음' });

    const approver = req.user?.nickname || 'admin';
    await workLogDao.approvePendingWorkLog(id, approver, note || '');

    // (선택) 승인 시 작업 카운트 증가
    if (pending.transfer_item && pending.transfer_item !== 'SELECT' && pending.task_man) {
      const engineers = pending.task_man.split(',').map(x => x.trim().split('(')[0].trim()).filter(Boolean);
      for (const eng of engineers) {
        try {
          await workLogDao.incrementTaskCount(eng, pending.transfer_item);
        } catch (e) {
          console.warn('incrementTaskCount fail (ignored):', e.message);
        }
      }
    }

    res.status(200).json({ message: '승인 및 저장 완료' });
  } catch (err) {
    console.error('approve error:', err);
    res.status(500).json({ error: '승인 처리 오류' });
  }
};

/* -------------------------------
 * 결재: 반려
 * ------------------------------- */
exports.rejectPendingWorkLog = async (req, res) => {
  const { id } = req.params;
  const { note } = (req.body || {});
  try {
    const approver = req.user?.nickname || 'admin';
    await workLogDao.rejectPendingWorkLog(id, approver, note || '');
    res.status(200).json({ message: '반려 처리 완료' });
  } catch (err) {
    res.status(500).json({ error: '반려 처리 오류' });
  }
};
