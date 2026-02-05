// back/src/controllers/setupBoardController.js
'use strict';

const dao = require('../dao/setupBoardDao');
const svc = require('../services/setupBoardService');

function safeInt(v, def = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

exports.listBoard = async (req, res) => {
  try {
    const {
      customer = '',
      site = '',
      line = '',
      status = '', // board_status
      q = '',
      sort = 'updated_desc',
      limit = '50',
      offset = '0'
    } = req.query;

    const data = await dao.listBoard({
      customer,
      site,
      line,
      status,
      q,
      sort,
      limit: safeInt(limit, 50),
      offset: safeInt(offset, 0)
    });

    res.json({ ok: true, data });
  } catch (err) {
    console.error('[setupBoardController.listBoard] error:', err);
    res.status(500).json({ ok: false, error: err.message || 'list board failed' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const actor = req.user?.nickname || req.user?.userID || 'unknown';

    const payload = {
      equipment_name: req.body.equipment_name,
      equipment_type: req.body.equipment_type || null,
      customer: req.body.customer || null,
      site: req.body.site,
      line: req.body.line,
      location: req.body.location || null,
      start_date: req.body.start_date || null,
      target_date: req.body.target_date || null,
      owner_main: req.body.owner_main || null,
      owner_support: req.body.owner_support || null,
      last_note: req.body.last_note || null
    };

    const result = await svc.createProjectWithSteps({ payload, actor });
    res.status(201).json({ ok: true, setup_id: result.setup_id });
  } catch (err) {
    console.error('[setupBoardController.createProject] error:', err);
    res.status(400).json({ ok: false, error: err.message || 'create failed' });
  }
};

exports.getProjectDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const detail = await dao.getProjectDetail(id);
    if (!detail) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, data: detail });
  } catch (err) {
    console.error('[setupBoardController.getProjectDetail] error:', err);
    res.status(500).json({ ok: false, error: err.message || 'detail failed' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const actor = req.user?.nickname || req.user?.userID || 'unknown';
    const id = req.params.id;

    const patch = {
      equipment_name: req.body.equipment_name,
      equipment_type: req.body.equipment_type,
      customer: req.body.customer,
      site: req.body.site,
      line: req.body.line,
      location: req.body.location,
      board_status: req.body.board_status,
      start_date: req.body.start_date,
      target_date: req.body.target_date,
      owner_main: req.body.owner_main,
      owner_support: req.body.owner_support,
      last_note: req.body.last_note
    };

    const updated = await svc.updateProject({ id, patch, actor });
    res.json({ ok: true, updated });
  } catch (err) {
    console.error('[setupBoardController.updateProject] error:', err);
    res.status(400).json({ ok: false, error: err.message || 'update project failed' });
  }
};

exports.updateStep = async (req, res) => {
  try {
    const actor = req.user?.nickname || req.user?.userID || 'unknown';
    const setupId = req.params.id;
    const stepNo = safeInt(req.params.stepNo, 0);
    if (!stepNo || stepNo < 1 || stepNo > 17) {
      return res.status(400).json({ ok: false, error: 'stepNo must be 1~17' });
    }

    const patch = {
      status: req.body.status,
      plan_start: req.body.plan_start,
      plan_end: req.body.plan_end,
      actual_start: req.body.actual_start,
      actual_end: req.body.actual_end,
      workers: req.body.workers, // "정현우,김동한"
      note: req.body.note
    };

    const updated = await svc.updateStep({ setupId, stepNo, patch, actor });
    res.json({ ok: true, updated });
  } catch (err) {
    console.error('[setupBoardController.updateStep] error:', err);
    res.status(400).json({ ok: false, error: err.message || 'update step failed' });
  }
};

exports.createIssue = async (req, res) => {
  try {
    const actor = req.user?.nickname || req.user?.userID || 'unknown';
    const setupId = req.params.id;

    const payload = {
      step_no: req.body.step_no || null,
      severity: req.body.severity || 'MAJOR',
      category: req.body.category || 'ETC',
      title: req.body.title,
      content: req.body.content || null,
      owner: req.body.owner || null
    };

    const created = await svc.createIssue({ setupId, payload, actor });
    res.status(201).json({ ok: true, issue_id: created.issue_id });
  } catch (err) {
    console.error('[setupBoardController.createIssue] error:', err);
    res.status(400).json({ ok: false, error: err.message || 'create issue failed' });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    const actor = req.user?.nickname || req.user?.userID || 'unknown';
    const issueId = req.params.issueId;

    const patch = {
      step_no: req.body.step_no,
      severity: req.body.severity,
      category: req.body.category,
      title: req.body.title,
      content: req.body.content,
      state: req.body.state,
      owner: req.body.owner,
      resolved_at: req.body.resolved_at
    };

    const updated = await svc.updateIssue({ issueId, patch, actor });
    res.json({ ok: true, updated });
  } catch (err) {
    console.error('[setupBoardController.updateIssue] error:', err);
    res.status(400).json({ ok: false, error: err.message || 'update issue failed' });
  }
};

exports.listAudit = async (req, res) => {
  try {
    const { entity_type, entity_id, limit='100', offset='0' } = req.query;
    const data = await dao.listAudit({
      entity_type,
      entity_id,
      limit: safeInt(limit, 100),
      offset: safeInt(offset, 0)
    });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('[setupBoardController.listAudit] error:', err);
    res.status(500).json({ ok: false, error: err.message || 'audit failed' });
  }
};

exports.listProjectAudit = async (req, res) => {
  try {
    const setupId = req.params.id;
    const { limit='200', offset='0' } = req.query;
    const data = await dao.listProjectAudit({
      setupId,
      limit: safeInt(limit, 200),
      offset: safeInt(offset, 0)
    });
    res.json({ ok: true, data });
  } catch (err) {
    console.error('[setupBoardController.listProjectAudit] error:', err);
    res.status(500).json({ ok: false, error: err.message || 'project audit failed' });
  }
};

exports.updatePrereq = async (req, res) => {
  try {
    const actor = req.user?.nickname || req.user?.userID || 'unknown';
    const setupId = req.params.id;
    const key = req.params.key;

    const patch = {
      is_done: req.body.is_done ? 1 : 0,
      note: req.body.note
    };

    const updated = await svc.updatePrereq({ setupId, key, patch, actor });
    res.json({ ok:true, updated });
  } catch (err) {
    res.status(400).json({ ok:false, error: err.message || 'update prereq failed' });
  }
};
