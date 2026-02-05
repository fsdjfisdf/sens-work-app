// back/src/dao/setupBoardDao.js
// back/src/dao/setupBoardDao.js
'use strict';

const { pool } = require('../../config/database');

function toInt(v, def) {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function buildSort(sort) {
  const orderMap = {
    updated_desc: 'p.updated_at DESC',
    updated_asc:  'p.updated_at ASC',
    target_asc:   'p.target_date ASC, p.updated_at DESC',
    target_desc:  'p.target_date DESC, p.updated_at DESC'
  };
  return orderMap[sort] || orderMap.updated_desc;
}

exports.listBoard = async ({ customer, site, line, status, q, sort, limit, offset }) => {
  const lim = clamp(toInt(limit, 200), 1, 500);
  const off = Math.max(toInt(offset, 0), 0);

  const where = [];
  const params = [];

  if (customer) { where.push('p.customer = ?'); params.push(customer); }
  if (site)     { where.push('p.site = ?');     params.push(site); }
  if (line)     { where.push('p.line = ?');     params.push(line); }
  if (status)   { where.push('p.board_status = ?'); params.push(status); }
  if (q)        { where.push('p.equipment_name LIKE ?'); params.push(`%${q}%`); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = buildSort(sort);

  const sql = `
    SELECT
      p.id AS setup_id,
      p.equipment_name, p.equipment_type, p.customer, p.site, p.line, p.location,
      p.board_status, p.start_date, p.target_date, p.owner_main, p.owner_support,
      p.last_note, p.updated_at,

      SUM(CASE WHEN s.status='DONE' THEN 1 ELSE 0 END) AS done_steps,
      COUNT(*) AS total_steps,
      MAX(CASE WHEN s.status='IN_PROGRESS' THEN s.step_no ELSE NULL END) AS in_progress_step_no,

      CONCAT(
        '{',
        GROUP_CONCAT(
          CONCAT('"', s.step_no, '":"', s.status, '"')
          ORDER BY s.step_no SEPARATOR ','
        ),
        '}'
      ) AS step_status_map,

      (SELECT COUNT(*) FROM setup_issues i WHERE i.setup_id=p.id AND i.state='OPEN') AS open_issues,
      (SELECT COUNT(*) FROM setup_issues i WHERE i.setup_id=p.id AND i.state='OPEN' AND i.severity='CRITICAL') AS critical_open_issues

    FROM setup_projects p
    JOIN setup_project_steps s ON s.setup_id = p.id
    ${whereSql}
    GROUP BY p.id
    ORDER BY ${orderSql}
    LIMIT ${off}, ${lim}
  `;

  const [rows] = await pool.query(sql, params); // ✅ execute → query
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

const [prereqs] = await pool.execute(
  `SELECT p.*, t.prereq_name, t.description, t.required_before_step_no, t.is_required, t.sort_order
   FROM setup_project_prereqs p
   JOIN setup_prereq_template t ON t.prereq_key = p.prereq_key
   WHERE p.setup_id = ?
   ORDER BY t.sort_order ASC`,
  [setupId]
);

return { project, steps, prereqs }; // issues 대신 prereqs

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

exports.insertPrereqsFromTemplate = async (conn, { setupId, actor }) => {
  const sql = `
    INSERT INTO setup_project_prereqs (setup_id, prereq_key, is_done, done_at, done_by)
    SELECT ?, t.prereq_key, 0, NULL, NULL
    FROM setup_prereq_template t
    WHERE t.is_active = 1
    ORDER BY t.sort_order
  `;
  await conn.execute(sql, [setupId]);
};

exports.getPrereqsMap = async (setupId) => {
  const [rows] = await pool.execute(
    `SELECT 
       p.prereq_key,
       p.is_done,
       p.done_at,
       p.done_by,
       p.note,
       p.updated_at,
       t.prereq_name,
       t.description,
       t.required_before_step_no,
       t.is_required,
       t.sort_order,
       t.is_active
     FROM setup_prereq_template t
     LEFT JOIN setup_project_prereqs p
       ON p.prereq_key = t.prereq_key
      AND p.setup_id = ?
     WHERE t.is_active = 1
     ORDER BY t.sort_order ASC`,
    [setupId]
  );

  // ✅ 프론트가 기대하는 형태로 변환
  const map = {};
  for (const r of rows) {
    map[r.prereq_key] = {
      code: r.prereq_key,
      title: r.prereq_name,
      description: r.description,
      required_before_step_no: r.required_before_step_no,
      required: r.is_required === 1,
      sort_order: r.sort_order,

      // 프론트에서 row.done / row.done_date 를 씀
      done: r.is_done === 1,
      done_date: r.done_at,      // 프론트에서 fmtYYMMDD(row.done_date)
      done_by: r.done_by,
      note: r.note
    };
  }
  return map;
};