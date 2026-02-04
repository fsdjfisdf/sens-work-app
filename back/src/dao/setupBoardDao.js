// back/src/dao/setupBoardDao.js
'use strict';

const { pool } = require('../../config/database');

// ---------- Board List ----------
function buildSort(sort) {
  // 안전한 화이트리스트
  switch (sort) {
    case 'target_asc': return 'p.target_date ASC, p.updated_at DESC';
    case 'target_desc': return 'p.target_date DESC, p.updated_at DESC';
    case 'updated_asc': return 'p.updated_at ASC';
    case 'updated_desc':
    default: return 'p.updated_at DESC';
  }
}

exports.listBoard = async ({ customer, site, line, status, q, sort, limit, offset }) => {
  const where = [];
  const params = [];

  if (customer) { where.push('p.customer = ?'); params.push(customer); }
  if (site) { where.push('p.site = ?'); params.push(site); }
  if (line) { where.push('p.line = ?'); params.push(line); }
  if (status) { where.push('p.board_status = ?'); params.push(status); }

  if (q) {
    // FULLTEXT가 있으면 MATCH 사용, 없으면 LIKE로 대체 가능
    // where.push('MATCH(p.equipment_name) AGAINST (? IN BOOLEAN MODE)');
    // params.push(q + '*');
    where.push('p.equipment_name LIKE ?');
    params.push(`%${q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = buildSort(sort);

  // v_setup_board 뷰가 있으면 더 깔끔하지만, 여기서는 조인으로 작성
  const sql = `
    SELECT
      p.id AS setup_id,
      p.equipment_name, p.equipment_type, p.customer, p.site, p.line, p.location,
      p.board_status, p.start_date, p.target_date, p.owner_main, p.owner_support,
      p.last_note, p.updated_at,

      SUM(CASE WHEN s.status='DONE' THEN 1 ELSE 0 END) AS done_steps,
      COUNT(*) AS total_steps,
      MAX(CASE WHEN s.status='IN_PROGRESS' THEN s.step_no ELSE NULL END) AS in_progress_step_no,

      (SELECT COUNT(*) FROM setup_issues i WHERE i.setup_id=p.id AND i.state='OPEN') AS open_issues,
      (SELECT COUNT(*) FROM setup_issues i WHERE i.setup_id=p.id AND i.state='OPEN' AND i.severity='CRITICAL') AS critical_open_issues

    FROM setup_projects p
    JOIN setup_project_steps s ON s.setup_id = p.id
    ${whereSql}
    GROUP BY p.id
    ORDER BY ${orderSql}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.execute(sql, [...params, limit, offset]);
  return rows;
};

// ---------- Detail ----------
exports.getProjectDetail = async (setupId) => {
  const [pRows] = await pool.execute(`SELECT * FROM setup_projects WHERE id = ?`, [setupId]);
  if (!pRows.length) return null;

  const project = pRows[0];

  const [steps] = await pool.execute(
    `SELECT s.*, t.step_name, t.description AS step_description
     FROM setup_project_steps s
     JOIN setup_step_template t ON t.step_no = s.step_no
     WHERE s.setup_id = ?
     ORDER BY s.step_no ASC`,
    [setupId]
  );

  const [issues] = await pool.execute(
    `SELECT * FROM setup_issues WHERE setup_id = ? ORDER BY state ASC, severity DESC, updated_at DESC`,
    [setupId]
  );

  return { project, steps, issues };
};

// ---------- Transaction-friendly helpers ----------
exports.insertProject = async (conn, payload) => {
  const sql = `
    INSERT INTO setup_projects
      (equipment_name, equipment_type, customer, site, line, location,
       board_status, start_date, target_date, owner_main, owner_support, last_note, created_by)
    VALUES
      (?, ?, ?, ?, ?, ?, 'PLANNED', ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    payload.equipment_name,
    payload.equipment_type,
    payload.customer,
    payload.site,
    payload.line,
    payload.location,
    payload.start_date,
    payload.target_date,
    payload.owner_main,
    payload.owner_support,
    payload.last_note,
    payload.created_by
  ];
  const [r] = await conn.execute(sql, params);
  return r.insertId;
};

exports.insertStepsFromTemplate = async (conn, { setupId, actor }) => {
  const sql = `
    INSERT INTO setup_project_steps (setup_id, step_no, status, updated_by)
    SELECT ?, t.step_no, 'NOT_STARTED', ?
    FROM setup_step_template t
    WHERE t.is_active = 1
    ORDER BY t.step_no
  `;
  await conn.execute(sql, [setupId, actor]);
};

exports.getProjectOne = async (conn, setupId) => {
  const [rows] = await conn.execute(`SELECT * FROM setup_projects WHERE id=?`, [setupId]);
  return rows[0] || null;
};

exports.updateProject = async (conn, setupId, patch) => {
  const fields = [];
  const params = [];

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return;

  const sql = `UPDATE setup_projects SET ${fields.join(', ')} WHERE id = ?`;
  params.push(setupId);
  await conn.execute(sql, params);
};

exports.getStepOne = async (conn, { setupId, stepNo }) => {
  const [rows] = await conn.execute(
    `SELECT * FROM setup_project_steps WHERE setup_id=? AND step_no=?`,
    [setupId, stepNo]
  );
  return rows[0] || null;
};

exports.listSteps = async (conn, setupId) => {
  const [rows] = await conn.execute(
    `SELECT * FROM setup_project_steps WHERE setup_id=? ORDER BY step_no ASC`,
    [setupId]
  );
  return rows;
};

exports.clearOtherInProgress = async (conn, { setupId, stepNo, actor }) => {
  // 정책: 같은 설비에서 다른 IN_PROGRESS는 HOLD로 내림(원하면 NOT_STARTED로 바꿔도 됨)
  const sql = `
    UPDATE setup_project_steps
    SET status='HOLD', updated_by=?, updated_at=CURRENT_TIMESTAMP
    WHERE setup_id=? AND step_no<>? AND status='IN_PROGRESS'
  `;
  await conn.execute(sql, [actor, setupId, stepNo]);
};

exports.updateStep = async (conn, { setupId, stepNo, patch, actor }) => {
  const fields = [];
  const params = [];

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return;

  // updated_by는 항상 기록
  fields.push(`updated_by = ?`);
  params.push(actor);

  const sql = `
    UPDATE setup_project_steps
    SET ${fields.join(', ')}, updated_at=CURRENT_TIMESTAMP
    WHERE setup_id=? AND step_no=?
  `;
  params.push(setupId, stepNo);
  await conn.execute(sql, params);
};

// ---------- Issues ----------
exports.insertIssue = async (conn, { setupId, payload, actor }) => {
  const sql = `
    INSERT INTO setup_issues
      (setup_id, step_no, severity, category, title, content, state, owner, created_by)
    VALUES
      (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
  `;
  const params = [
    setupId,
    payload.step_no,
    payload.severity,
    payload.category,
    payload.title,
    payload.content,
    payload.owner,
    actor
  ];
  const [r] = await conn.execute(sql, params);
  return r.insertId;
};

exports.getIssueOne = async (conn, issueId) => {
  const [rows] = await conn.execute(`SELECT * FROM setup_issues WHERE id=?`, [issueId]);
  return rows[0] || null;
};

exports.updateIssue = async (conn, issueId, patch, actor) => {
  const fields = [];
  const params = [];

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  const sql = `UPDATE setup_issues SET ${fields.join(', ')} WHERE id=?`;
  params.push(issueId);
  await conn.execute(sql, params);
};

// ---------- Audit ----------
exports.insertAudit = async (conn, { entity_type, entity_id, action, before, after, actor }) => {
  const sql = `
    INSERT INTO setup_audit_logs
      (entity_type, entity_id, action, before_json, after_json, actor)
    VALUES
      (?, ?, ?, ?, ?, ?)
  `;
  await conn.execute(sql, [
    entity_type,
    entity_id,
    action,
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null,
    actor
  ]);
};

exports.listAudit = async ({ entity_type, entity_id, limit, offset }) => {
  const where = [];
  const params = [];

  if (entity_type) { where.push('entity_type = ?'); params.push(entity_type); }
  if (entity_id) { where.push('entity_id = ?'); params.push(entity_id); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `
    SELECT * FROM setup_audit_logs
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [...params, limit, offset]);
  return rows;
};

exports.listProjectAudit = async ({ setupId, limit, offset }) => {
  // 프로젝트 자체 + 해당 프로젝트의 step/issue 로그까지 묶어서 보고 싶으면 after_json/before_json에서 setup_id를 포함시키는 방법도 있음.
  // 여기서는 간단히: PROJECT 엔티티 + (STEP은 step row id라 직접 연결이 어려움) => 실제 운영에선 "setup_id" 컬럼을 audit에 추가하는 걸 추천.
  const sql = `
    SELECT * FROM setup_audit_logs
    WHERE (entity_type='PROJECT' AND entity_id=?)
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(sql, [setupId, limit, offset]);
  return rows;
};
