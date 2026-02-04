cat > /home/ubuntu/sens-work-app/back/src/services/setupBoardService.js <<'EOF'
'use strict';

const { pool } = require('../../config/database');
const dao = require('../dao/setupBoardDao');

/**
 * 프로젝트 생성 + 템플릿 step 17개 생성 (트랜잭션)
 * - payload: setup_projects에 들어갈 필드
 * - actor: 변경자(로그 남김)
 */
exports.createProjectWithSteps = async ({ payload, actor }) => {
  if (!payload?.equipment_name) throw new Error('equipment_name is required');
  if (!payload?.site) throw new Error('site is required');
  if (!payload?.line) throw new Error('line is required');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // created_by를 payload에 주입
    const setupId = await dao.insertProject(conn, {
      ...payload,
      created_by: actor
    });

    // 템플릿 기반 step 생성
    await dao.insertStepsFromTemplate(conn, { setupId, actor });

    // audit 로그 (PROJECT CREATE)
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

  // patch에서 undefined 제거 (필드가 undefined면 UPDATE에 들어가면 안 됨)
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
 * - 정책: 같은 설비에서 다른 IN_PROGRESS는 HOLD로 내림
 */
exports.updateStep = async ({ setupId, stepNo, patch, actor }) => {
  const sid = Number(setupId);
  const sn = Number(stepNo);
  if (!sid) throw new Error('invalid setup id');
  if (!sn || sn < 1 || sn > 17) throw new Error('stepNo must be 1~17');

  // undefined 제거
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

    // IN_PROGRESS로 올리는 경우 다른 step IN_PROGRESS 정리
    if (cleanPatch.status === 'IN_PROGRESS') {
      await dao.clearOtherInProgress(conn, { setupId: sid, stepNo: sn, actor });
      // 프로젝트 상태도 IN_PROGRESS로 동기화하고 싶다면:
      await dao.updateProject(conn, sid, { board_status: 'IN_PROGRESS' });
    }

    // DONE이면 실제 종료일이 없으면 자동으로 채우고 싶다면(선택):
    // if (cleanPatch.status === 'DONE' && !cleanPatch.actual_end) cleanPatch.actual_end = new Date();

    await dao.updateStep(conn, { setupId: sid, stepNo: sn, patch: cleanPatch, actor });

    const after = await dao.getStepOne(conn, { setupId: sid, stepNo: sn });

    await dao.insertAudit(conn, {
      entity_type: 'STEP',
      entity_id: after.id || 0, // step row PK가 있다면 id 기록, 없으면 0
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
EOF
