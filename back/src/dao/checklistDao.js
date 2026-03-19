'use strict';

const { pool } = require('../../config/database');
const catalog = require('../config/checklistCatalog');

function sanitizeCode(v) {
  return String(v || '').trim().toUpperCase();
}

function sanitizeKind(v) {
  return String(v || '').trim().toUpperCase();
}

function toYN(v) {
  return v ? 1 : 0;
}

function calcSectionSummary(section, answersMap) {
  const total = section.questions.length;
  const checked = section.questions.filter((q) => !!answersMap.get(q.id)).length;
  const completionRate = total > 0 ? Math.round((checked / total) * 1000) / 10 : 0;
  return { total_questions: total, checked_questions: checked, completion_rate: completionRate };
}

async function getUserById(conn, userIdx) {
  const [rows] = await conn.query(
    `SELECT userIdx, nickname, userID, role, status, \`group\`, site
       FROM Users
      WHERE userIdx = ? AND status = 'A'
      LIMIT 1`,
    [userIdx]
  );
  return rows[0] || null;
}

async function resolveEngineer(conn, userIdx) {
  const user = await getUserById(conn, userIdx);
  if (!user) return null;

  const [mappedRows] = await conn.query(
    `SELECT e.*
       FROM user_engineer_map m
       JOIN engineer e ON e.id = m.engineer_id
      WHERE m.user_idx = ?
        AND m.is_active = 1
      ORDER BY m.is_primary DESC, m.id ASC
      LIMIT 1`,
    [userIdx]
  );
  if (mappedRows[0]) {
    return { ...mappedRows[0], resolved_by: 'user_engineer_map', user };
  }

  const [engineerRows] = await conn.query(
    `SELECT e.*
       FROM engineer e
      WHERE e.name = ?
      ORDER BY (e.\`group\` = ?) DESC, (e.site = ?) DESC, e.id ASC
      LIMIT 1`,
    [user.nickname, user.group || '', user.site || '']
  );
  if (engineerRows[0]) {
    return { ...engineerRows[0], resolved_by: 'nickname_fallback', user };
  }

  return { user, resolved_by: 'user_only' };
}

async function getAccessMap(conn, engineerId, engineerGroup) {
  const [groupRows] = await conn.query(
    `SELECT equipment_group_code, is_allowed
       FROM checklist_group_equipment_access
      WHERE engineer_group = ?`,
    [engineerGroup || '']
  );

  const [equipmentRows] = await conn.query(
    `SELECT code, display_name, sort_order, is_active
       FROM checklist_equipment_group
      WHERE is_active = 1
      ORDER BY sort_order, code`
  );

  const allowed = new Map();
  for (const row of equipmentRows) allowed.set(row.code, false);
  for (const row of groupRows) {
    allowed.set(row.equipment_group_code, !!row.is_allowed);
  }

  if (engineerId) {
    const [overrideRows] = await conn.query(
      `SELECT equipment_group_code, access_type, reason, created_at, updated_at
         FROM checklist_engineer_access_override
        WHERE engineer_id = ?`,
      [engineerId]
    );
    for (const row of overrideRows) {
      allowed.set(row.equipment_group_code, row.access_type === 'ALLOW');
    }
  }

  return equipmentRows.map((row) => ({
    code: row.code,
    display_name: row.display_name,
    sort_order: row.sort_order,
    allowed: !!allowed.get(row.code),
  }));
}

async function findActiveTemplate(conn, equipmentGroupCode, checklistKind) {
  const [rows] = await conn.query(
    `SELECT *
       FROM checklist_template
      WHERE equipment_group_code = ?
        AND checklist_kind = ?
        AND is_active = 1
      ORDER BY version_no DESC, id DESC
      LIMIT 1`,
    [equipmentGroupCode, checklistKind]
  );
  return rows[0] || null;
}

async function loadTemplateStructure(conn, templateId) {
  const [sectionRows] = await conn.query(
    `SELECT id, section_code, section_name, sort_order
       FROM checklist_section
      WHERE template_id = ? AND is_active = 1
      ORDER BY sort_order, id`,
    [templateId]
  );

  const [questionRows] = await conn.query(
    `SELECT id, section_id, question_code, question_text, sort_order
       FROM checklist_question
      WHERE template_id = ? AND is_active = 1
      ORDER BY section_id IS NULL, section_id, sort_order, id`,
    [templateId]
  );

  const questionsBySection = new Map();
  for (const row of questionRows) {
    const key = row.section_id || '__NO_SECTION__';
    if (!questionsBySection.has(key)) questionsBySection.set(key, []);
    questionsBySection.get(key).push({
      id: row.id,
      question_code: row.question_code,
      question_text: row.question_text,
      sort_order: row.sort_order,
    });
  }

  const sections = sectionRows.map((section) => ({
    id: section.id,
    section_code: section.section_code,
    section_name: section.section_name,
    sort_order: section.sort_order,
    questions: questionsBySection.get(section.id) || [],
  }));

  const noSectionQuestions = questionsBySection.get('__NO_SECTION__') || [];
  if (noSectionQuestions.length) {
    sections.push({
      id: null,
      section_code: 'GENERAL',
      section_name: 'GENERAL',
      sort_order: 999,
      questions: noSectionQuestions,
    });
  }

  return sections;
}

async function ensureTemplateAccess(conn, userIdx, equipmentGroupCode) {
  const engineer = await resolveEngineer(conn, userIdx);
  if (!engineer?.id && !engineer?.user) {
    const err = new Error('사용자 정보를 찾을 수 없습니다.');
    err.statusCode = 401;
    throw err;
  }

  const accessRows = await getAccessMap(conn, engineer.id || null, engineer.group || engineer.user?.group || '');
  const access = accessRows.find((row) => row.code === equipmentGroupCode);
  if (!access?.allowed) {
    const err = new Error('해당 설비 체크리스트 접근 권한이 없습니다.');
    err.statusCode = 403;
    throw err;
  }

  return { engineer, accessRows };
}

async function getOrCreateResponse(conn, engineerId, templateId, userIdx) {
  const [rows] = await conn.query(
    `SELECT *
       FROM checklist_response
      WHERE engineer_id = ? AND template_id = ?
      LIMIT 1`,
    [engineerId, templateId]
  );
  if (rows[0]) return rows[0];

  const [result] = await conn.query(
    `INSERT INTO checklist_response (
       engineer_id, template_id, response_status, created_by, updated_by, submitted_at
     ) VALUES (?, ?, 'ACTIVE', ?, ?, NOW())`,
    [engineerId, templateId, userIdx || null, userIdx || null]
  );

  const [createdRows] = await conn.query(
    `SELECT *
       FROM checklist_response
      WHERE id = ?`,
    [result.insertId]
  );
  return createdRows[0];
}

exports.getCurrentUserProfile = async (userIdx) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const engineer = await resolveEngineer(conn, userIdx);
    if (!engineer?.user) return null;

    const access = await getAccessMap(conn, engineer.id || null, engineer.group || engineer.user.group || '');
    return {
      user: engineer.user,
      engineer: engineer.id ? {
        id: engineer.id,
        legacy_id: engineer.legacy_id,
        name: engineer.name,
        company: engineer.company,
        group: engineer.group,
        site: engineer.site,
        role: engineer.role,
        main_eq_id: engineer.main_eq_id,
        multi_eq_id: engineer.multi_eq_id,
        resolved_by: engineer.resolved_by,
      } : null,
      access,
    };
  } finally {
    conn.release();
  }
};

exports.getAvailableTemplatesForUser = async (userIdx) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const engineer = await resolveEngineer(conn, userIdx);
    if (!engineer?.user) {
      const err = new Error('인증 사용자 정보를 찾을 수 없습니다.');
      err.statusCode = 401;
      throw err;
    }

    const access = await getAccessMap(conn, engineer.id || null, engineer.group || engineer.user.group || '');
    const allowedCodes = access.filter((row) => row.allowed).map((row) => row.code);
    if (!allowedCodes.length) return { engineer, rows: [] };

    const [templateRows] = await conn.query(
      `SELECT
         t.id,
         t.equipment_group_code,
         eg.display_name AS equipment_group_name,
         t.checklist_kind,
         t.template_name,
         t.version_no,
         t.updated_at,
         COUNT(q.id) AS question_count
       FROM checklist_template t
       JOIN checklist_equipment_group eg
         ON eg.code = t.equipment_group_code
       LEFT JOIN checklist_question q
         ON q.template_id = t.id
        AND q.is_active = 1
      WHERE t.is_active = 1
        AND t.equipment_group_code IN (?)
      GROUP BY t.id, t.equipment_group_code, eg.display_name, t.checklist_kind, t.template_name, t.version_no, t.updated_at
      ORDER BY eg.sort_order, t.checklist_kind, t.version_no DESC`,
      [allowedCodes]
    );

    return { engineer, rows: templateRows, access };
  } finally {
    conn.release();
  }
};

exports.getTemplate = async ({ userIdx, equipmentGroupCode, checklistKind }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const { engineer } = await ensureTemplateAccess(conn, userIdx, equipmentGroupCode);
    const template = await findActiveTemplate(conn, equipmentGroupCode, checklistKind);
    if (!template) {
      const err = new Error('체크리스트 템플릿이 없습니다. 먼저 sync-catalog를 실행하세요.');
      err.statusCode = 404;
      throw err;
    }
    const sections = await loadTemplateStructure(conn, template.id);
    return { engineer, template, sections };
  } finally {
    conn.release();
  }
};

exports.getMyChecklist = async ({ userIdx, equipmentGroupCode, checklistKind }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const { engineer } = await ensureTemplateAccess(conn, userIdx, equipmentGroupCode);
    if (!engineer?.id) {
      const err = new Error('engineer 테이블과 현재 로그인 사용자가 연결되지 않았습니다.');
      err.statusCode = 400;
      throw err;
    }

    const template = await findActiveTemplate(conn, equipmentGroupCode, checklistKind);
    if (!template) {
      const err = new Error('체크리스트 템플릿이 없습니다. 먼저 sync-catalog를 실행하세요.');
      err.statusCode = 404;
      throw err;
    }

    const sections = await loadTemplateStructure(conn, template.id);

    const [responseRows] = await conn.query(
      `SELECT *
         FROM checklist_response
        WHERE engineer_id = ? AND template_id = ?
        LIMIT 1`,
      [engineer.id, template.id]
    );
    const response = responseRows[0] || null;

    let answerRows = [];
    if (response) {
      const [rows] = await conn.query(
        `SELECT question_id, is_checked, checked_at, note
           FROM checklist_response_answer
          WHERE response_id = ?`,
        [response.id]
      );
      answerRows = rows;
    }

    const answersMap = new Map(answerRows.map((row) => [row.question_id, !!row.is_checked]));
    const answersDetailMap = new Map(answerRows.map((row) => [row.question_id, row]));

    const sectionsWithAnswers = sections.map((section) => {
      const summary = calcSectionSummary(section, answersMap);
      return {
        ...section,
        summary,
        questions: section.questions.map((q) => ({
          ...q,
          is_checked: !!answersMap.get(q.id),
          checked_at: answersDetailMap.get(q.id)?.checked_at || null,
          note: answersDetailMap.get(q.id)?.note || null,
        })),
      };
    });

    const totalQuestions = sectionsWithAnswers.reduce((acc, section) => acc + section.questions.length, 0);
    const totalChecked = sectionsWithAnswers.reduce((acc, section) => acc + section.summary.checked_questions, 0);
    const overallCompletionRate = totalQuestions > 0
      ? Math.round((totalChecked / totalQuestions) * 1000) / 10
      : 0;

    return {
      engineer,
      template,
      response,
      sections: sectionsWithAnswers,
      summary: {
        total_questions: totalQuestions,
        checked_questions: totalChecked,
        completion_rate: overallCompletionRate,
      },
    };
  } finally {
    conn.release();
  }
};

exports.saveMyChecklist = async ({ userIdx, equipmentGroupCode, checklistKind, answers, responseStatus = 'ACTIVE' }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    await conn.beginTransaction();

    const { engineer } = await ensureTemplateAccess(conn, userIdx, equipmentGroupCode);
    if (!engineer?.id) {
      const err = new Error('engineer 테이블과 현재 로그인 사용자가 연결되지 않았습니다.');
      err.statusCode = 400;
      throw err;
    }

    const template = await findActiveTemplate(conn, equipmentGroupCode, checklistKind);
    if (!template) {
      const err = new Error('체크리스트 템플릿이 없습니다. 먼저 sync-catalog를 실행하세요.');
      err.statusCode = 404;
      throw err;
    }

    const [questionRows] = await conn.query(
      `SELECT id, question_code
         FROM checklist_question
        WHERE template_id = ? AND is_active = 1`,
      [template.id]
    );
    const questionById = new Map(questionRows.map((row) => [row.id, row]));
    const questionByCode = new Map(questionRows.map((row) => [row.question_code, row]));

    const normalized = [];
    for (const item of Array.isArray(answers) ? answers : []) {
      let question = null;
      if (item.question_id) {
        question = questionById.get(Number(item.question_id));
      } else if (item.question_code) {
        question = questionByCode.get(String(item.question_code).trim());
      }
      if (!question) continue;

      normalized.push({
        question_id: question.id,
        is_checked: item.is_checked ? 1 : 0,
        note: item.note == null ? null : String(item.note).trim(),
      });
    }

    const seen = new Set();
    const normalizedMap = new Map();
    for (const row of normalized) {
      if (seen.has(row.question_id)) continue;
      seen.add(row.question_id);
      normalizedMap.set(row.question_id, row);
    }

    for (const row of questionRows) {
      if (!normalizedMap.has(row.id)) {
        normalizedMap.set(row.id, {
          question_id: row.id,
          is_checked: 0,
          note: null,
        });
      }
    }

    const response = await getOrCreateResponse(conn, engineer.id, template.id, userIdx);

    await conn.query(
      `UPDATE checklist_response
          SET response_status = ?,
              updated_by = ?,
              submitted_at = NOW()
        WHERE id = ?`,
      [responseStatus === 'SUBMITTED' ? 'SUBMITTED' : 'ACTIVE', userIdx || null, response.id]
    );

    await conn.query(`DELETE FROM checklist_response_answer WHERE response_id = ?`, [response.id]);

    const values = Array.from(normalizedMap.values()).map((row) => ([
      response.id,
      row.question_id,
      row.is_checked,
      row.is_checked ? new Date() : null,
      row.note,
    ]));

    if (values.length) {
      await conn.query(
        `INSERT INTO checklist_response_answer (
           response_id, question_id, is_checked, checked_at, note
         ) VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    return await exports.getMyChecklist({ userIdx, equipmentGroupCode, checklistKind });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.getEngineerAccess = async (engineerId) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [engineerRows] = await conn.query(
      `SELECT id, legacy_id, name, company, \`group\`, site, role
         FROM engineer
        WHERE id = ?
        LIMIT 1`,
      [engineerId]
    );
    const engineer = engineerRows[0];
    if (!engineer) {
      const err = new Error('engineer not found');
      err.statusCode = 404;
      throw err;
    }

    const defaultAccess = await getAccessMap(conn, null, engineer.group || '');

    const [overrideRows] = await conn.query(
      `SELECT id, engineer_id, equipment_group_code, access_type, reason, created_by, created_at, updated_at
         FROM checklist_engineer_access_override
        WHERE engineer_id = ?
        ORDER BY equipment_group_code`,
      [engineerId]
    );

    const finalAccess = await getAccessMap(conn, engineerId, engineer.group || '');
    return { engineer, default_access: defaultAccess, overrides: overrideRows, final_access: finalAccess };
  } finally {
    conn.release();
  }
};

exports.upsertEngineerAccessOverride = async ({ engineerId, equipmentGroupCode, accessType, reason, createdBy }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [existsEngineer] = await conn.query(`SELECT id FROM engineer WHERE id = ? LIMIT 1`, [engineerId]);
    if (!existsEngineer[0]) {
      const err = new Error('engineer not found');
      err.statusCode = 404;
      throw err;
    }

    const [existsEq] = await conn.query(`SELECT code FROM checklist_equipment_group WHERE code = ? LIMIT 1`, [equipmentGroupCode]);
    if (!existsEq[0]) {
      const err = new Error('equipment_group_code not found');
      err.statusCode = 404;
      throw err;
    }

    await conn.query(
      `INSERT INTO checklist_engineer_access_override (
         engineer_id, equipment_group_code, access_type, reason, created_by
       ) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         access_type = VALUES(access_type),
         reason = VALUES(reason),
         created_by = VALUES(created_by),
         updated_at = CURRENT_TIMESTAMP`,
      [engineerId, equipmentGroupCode, accessType, reason || null, createdBy || null]
    );

    return await exports.getEngineerAccess(engineerId);
  } finally {
    conn.release();
  }
};

exports.deleteEngineerAccessOverride = async ({ engineerId, equipmentGroupCode }) => {
  const conn = await pool.getConnection(async c => c);
  try {
    await conn.query(
      `DELETE FROM checklist_engineer_access_override
        WHERE engineer_id = ? AND equipment_group_code = ?`,
      [engineerId, equipmentGroupCode]
    );
    return await exports.getEngineerAccess(engineerId);
  } finally {
    conn.release();
  }
};

exports.syncCatalog = async () => {
  const conn = await pool.getConnection(async c => c);
  const counters = {
    equipment_groups_upserted: 0,
    templates_upserted: 0,
    sections_upserted: 0,
    questions_upserted: 0,
  };

  try {
    await conn.beginTransaction();

    for (const eq of catalog.equipmentGroups || []) {
      await conn.query(
        `INSERT INTO checklist_equipment_group (code, display_name, sort_order, is_active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           display_name = VALUES(display_name),
           sort_order = VALUES(sort_order),
           is_active = 1`,
        [eq.code, eq.display_name, eq.sort_order || 999]
      );
      counters.equipment_groups_upserted += 1;
    }

    for (const [groupName, eqCodes] of Object.entries(catalog.defaultGroupAccess || {})) {
      for (const code of eqCodes) {
        await conn.query(
          `INSERT INTO checklist_group_equipment_access (engineer_group, equipment_group_code, is_allowed)
           VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE
             is_allowed = 1`,
          [groupName, code]
        );
      }
    }

    for (const templateDef of catalog.templates || []) {
      await conn.query(
        `INSERT INTO checklist_template (
           equipment_group_code, checklist_kind, template_name, version_no, is_active
         ) VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           template_name = VALUES(template_name),
           is_active = 1`,
        [
          templateDef.equipment_group_code,
          templateDef.checklist_kind,
          templateDef.template_name,
          templateDef.version_no || 1,
        ]
      );

      const [templateRows] = await conn.query(
        `SELECT id
           FROM checklist_template
          WHERE equipment_group_code = ?
            AND checklist_kind = ?
            AND version_no = ?
          LIMIT 1`,
        [
          templateDef.equipment_group_code,
          templateDef.checklist_kind,
          templateDef.version_no || 1,
        ]
      );
      const templateId = templateRows[0].id;
      counters.templates_upserted += 1;

      const sectionCodes = [];
      for (const sectionDef of templateDef.sections || []) {
        sectionCodes.push(sectionDef.section_code);

        await conn.query(
          `INSERT INTO checklist_section (
             template_id, section_code, section_name, sort_order, is_active
           ) VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             section_name = VALUES(section_name),
             sort_order = VALUES(sort_order),
             is_active = 1`,
          [
            templateId,
            sectionDef.section_code,
            sectionDef.section_name,
            sectionDef.sort_order || 999,
          ]
        );
        counters.sections_upserted += 1;

        const [sectionRows] = await conn.query(
          `SELECT id
             FROM checklist_section
            WHERE template_id = ? AND section_code = ?
            LIMIT 1`,
          [templateId, sectionDef.section_code]
        );
        const sectionId = sectionRows[0].id;

        const questionCodes = [];
        for (const questionDef of sectionDef.questions || []) {
          questionCodes.push(questionDef.question_code);
          await conn.query(
            `INSERT INTO checklist_question (
               template_id, section_id, question_code, question_text, sort_order, is_active
             ) VALUES (?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE
               section_id = VALUES(section_id),
               question_text = VALUES(question_text),
               sort_order = VALUES(sort_order),
               is_active = 1`,
            [
              templateId,
              sectionId,
              questionDef.question_code,
              questionDef.question_text,
              questionDef.sort_order || 999,
            ]
          );
          counters.questions_upserted += 1;
        }

        if (questionCodes.length) {
          await conn.query(
            `UPDATE checklist_question
                SET is_active = 0
              WHERE template_id = ?
                AND section_id = ?
                AND question_code NOT IN (?)`,
            [templateId, sectionId, questionCodes]
          );
        }
      }

      if (sectionCodes.length) {
        await conn.query(
          `UPDATE checklist_section
              SET is_active = 0
            WHERE template_id = ?
              AND section_code NOT IN (?)`,
          [templateId, sectionCodes]
        );
      }
    }

    await conn.commit();
    return counters;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
