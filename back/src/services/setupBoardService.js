'use strict';

const { pool } = require('../../config/database');
const dao = require('../dao/setupBoardDao');

/**
 * 프로젝트 생성 + 템플릿 step 생성 (트랜잭션)
 */
exports.createProjectWithSteps = async ({ payload, actor }) => {
  if (!payload?.equipment_name) throw new Error('equipment_name is required');
  if (!payload?.site) throw new Error('site is required');
  if (!payload?.line) throw new Error('line is required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const setupId = await dao.insertProject(conn, {
      ...payload,
      created_by: actor
    });

    await dao.insertStepsFromTemplate(conn, { setupId, actor });

    await dao.insertAudit(conn, {
      entity_type: 'PROJECT',
      entity_id: setupId,
      action: 'CREATE',
      before: null,
      after: { id: setupId, ...payload },
      actor
    });

    await conn.commit();
    return { setup_id: setupId };
  } catch (e) {
    try { await conn.rollback(); } catch (_e) {}
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * 프로젝트 수정 (트랜잭션)
 */
exports.updateProject = async ({ id, patch, actor }) => {
  const setupId = Number(id);
  if (!setupId) throw new Error('invalid setup id');

  const cleanPatch = {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (typeof v !== 'undefined') cleanPatch[k] = v;
  }
  if (!Object.keys(cleanPatch).length) {
    return { setup_id: setupId, changed: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const before = await dao.getProjectOne(conn, setupId);
    if (!before) throw new Error('project not found');

    await dao.updateProject(conn, setupId, cleanPatch);
    const after = await dao.getProjectOne(conn, setupId);

    await dao.insertAudit(conn, {
      entity_type: 'PROJECT',
      entity_id: setupId,
      action: 'UPDATE',
      before,
      after,
      actor
    });

    await conn.commit();
    return { setup_id: setupId, changed: 1 };
  } catch (e) {
    try { await conn.rollback(); } catch (_e) {}
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Step 업데이트 (트랜잭션)
 */
exports.updateStep = async ({ setupId, stepNo, patch, actor }) => {
  const sid = Number(setupId);
  const sn = Number(stepNo);
  if (!sid) throw new Error('invalid setup id');
  if (!sn || sn < 1 || sn > 17) throw new Error('stepNo must be 1~17');

  const cleanPatch = {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (typeof v !== 'undefined') cleanPatch[k] = v;
  }
  if (!Object.keys(cleanPatch).length) {
    return { setup_id: sid, step_no: sn, changed: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const before = await dao.getStepOne(conn, { setupId: sid, stepNo: sn });
    if (!before) throw new Error('step not found');

    // 같은 설비에서 다른 IN_PROGRESS는 HOLD로 내림
    if (cleanPatch.status === 'IN_PROGRESS') {
      await dao.clearOtherInProgress(conn, { setupId: sid, stepNo: sn, actor });
      await dao.updateProject(conn, sid, { board_status: 'IN_PROGRESS' });
    }

    await dao.updateStep(conn, { setupId: sid, stepNo: sn, patch: cleanPatch, actor });

    const after = await dao.getStepOne(conn, { setupId: sid, stepNo: sn });

    await dao.insertAudit(conn, {
      entity_type: 'STEP',
      entity_id: after.id || 0,
      action: 'UPDATE',
      before,
      after,
      actor
    });

    await conn.commit();
    return { setup_id: sid, step_no: sn, changed: 1 };
  } catch (e) {
    try { await conn.rollback(); } catch (_e) {}
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Issue 생성 (트랜잭션)
 */
exports.createIssue = async ({ setupId, payload, actor }) => {
  const sid = Number(setupId);
  if (!sid) throw new Error('invalid setup id');
  if (!payload?.title) throw new Error('title is required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const issueId = await dao.insertIssue(conn, { setupId: sid, payload, actor });
    const created = await dao.getIssueOne(conn, issueId);

    await dao.insertAudit(conn, {
      entity_type: 'ISSUE',
      entity_id: issueId,
      action: 'CREATE',
      before: null,
      after: created,
      actor
    });

    await conn.commit();
    return { issue_id: issueId };
  } catch (e) {
    try { await conn.rollback(); } catch (_e) {}
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Issue 수정 (트랜잭션)
 */
exports.updateIssue = async ({ issueId, patch, actor }) => {
  const iid = Number(issueId);
  if (!iid) throw new Error('invalid issue id');

  const cleanPatch = {};
  for (const [k, v] of Object.entries(patch || {})) {
    if (typeof v !== 'undefined') cleanPatch[k] = v;
  }
  if (!Object.keys(cleanPatch).length) {
    return { issue_id: iid, changed: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const before = await dao.getIssueOne(conn, iid);
    if (!before) throw new Error('issue not found');

    await dao.updateIssue(conn, iid, cleanPatch, actor);
    const after = await dao.getIssueOne(conn, iid);

    await dao.insertAudit(conn, {
      entity_type: 'ISSUE',
      entity_id: iid,
      action: 'UPDATE',
      before,
      after,
      actor
    });

    await conn.commit();
    return { issue_id: iid, changed: 1 };
  } catch (e) {
    try { await conn.rollback(); } catch (_e) {}
    throw e;
  } finally {
    conn.release();
  }
};

exports.updatePrereq = async ({ setupId, key, patch, actor }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [exist] = await conn.execute(
      `SELECT * FROM setup_project_prereqs WHERE setup_id=? AND prereq_key=? LIMIT 1`,
      [setupId, key]
    );

    const isDone = patch.is_done ? 1 : 0;
    const doneAt = isDone ? new Date() : null;
    const doneBy = isDone ? actor : null;

    if (!exist.length) {
      await conn.execute(
        `INSERT INTO setup_project_prereqs
           (setup_id, prereq_key, is_done, done_at, done_by, note, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [setupId, key, isDone, doneAt, doneBy, patch.note ?? null]
      );
    } else {
      await conn.execute(
        `UPDATE setup_project_prereqs
         SET is_done=?,
             done_at=?,
             done_by=?,
             note=?,
             updated_at=CURRENT_TIMESTAMP
         WHERE setup_id=? AND prereq_key=?`,
        [isDone, doneAt, doneBy, patch.note ?? null, setupId, key]
      );
    }

    await conn.commit();

    // 최신 상태 리턴(프론트가 바로 UI 갱신 가능)
    const [rows] = await conn.execute(
      `SELECT * FROM setup_project_prereqs WHERE setup_id=? AND prereq_key=? LIMIT 1`,
      [setupId, key]
    );
    return rows[0] || null;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};