'use strict';

const { pool } = require('../../config/database');

function resolveUserIdx(userLike) {
  return (
    userLike?.userIdx ||
    userLike?.user_idx ||
    userLike?.id ||
    null
  );
}

async function getUserById(conn, userIdx) {
  if (!userIdx) return null;
  const [rows] = await conn.query(
    `SELECT userIdx, nickname, role, status, \`group\`, site
       FROM Users
      WHERE userIdx = ?
      LIMIT 1`,
    [userIdx]
  );
  return rows[0] || null;
}

async function ensureAdmin(conn, userIdx) {
  const user = await getUserById(conn, userIdx);
  if (!user) {
    const err = new Error('사용자 정보를 찾을 수 없습니다.');
    err.statusCode = 401;
    throw err;
  }
  if (user.role !== 'admin') {
    const err = new Error('관리자만 사용할 수 있습니다.');
    err.statusCode = 403;
    throw err;
  }
  return user;
}

async function getFilterOptions() {
  const conn = await pool.getConnection();
  try {
    const [equipmentGroups] = await conn.query(
      `SELECT code, display_name, sort_order
         FROM checklist_equipment_group
        WHERE is_active = 1
        ORDER BY sort_order, code`
    );

    const [groups] = await conn.query(
      `SELECT DISTINCT \`group\`
         FROM engineer
        WHERE \`group\` IS NOT NULL AND \`group\` <> ''
        ORDER BY \`group\``
    );

    const [sites] = await conn.query(
      `SELECT DISTINCT site
         FROM engineer
        WHERE site IS NOT NULL AND site <> ''
        ORDER BY site`
    );

    return {
      equipment_groups: equipmentGroups,
      groups: groups.map((row) => row.group),
      sites: sites.map((row) => row.site),
      domains: ['MAINT', 'SETUP'],
      source_work_types: ['MAINT', 'SETUP', 'RELOCATION', 'MERGED'],
    };
  } finally {
    conn.release();
  }
}

async function getMatrix({
  equipmentGroupCode,
  pciDomain,
  engineerGroup = '',
  site = '',
  keyword = '',
  dateFrom,
  dateTo,
  sourceWorkType = '',
}) {
  const conn = await pool.getConnection();
  try {
    const useSourceWorkType =
      pciDomain === 'MAINT'
        ? 'MAINT'
        : (sourceWorkType && ['SETUP', 'RELOCATION', 'MERGED'].includes(sourceWorkType) ? sourceWorkType : 'MERGED');

    const [rows] = await conn.query(
      `
      WITH filtered_engineers AS (
        SELECT e.id, e.name, e.company, e.\`group\`, e.site
        FROM engineer e
        WHERE 1=1
          AND (? = '' OR e.\`group\` = ?)
          AND (? = '' OR e.site = ?)
          AND (? = '' OR e.name LIKE ?)
      ),
      filtered_items AS (
        SELECT pi.id, pi.equipment_group_code, pi.pci_domain, pi.item_code, pi.item_name, pi.item_name_kr,
               pi.category, pi.required_count, pi.self_weight, pi.history_max_score, pi.sort_order
        FROM pci_item pi
        WHERE pi.is_active = 1
          AND pi.equipment_group_code = ?
          AND pi.pci_domain = ?
      ),
      history_agg AS (
        SELECT
          ds.engineer_id,
          ds.pci_item_id,
          SUM(ds.main_count) AS main_count,
          SUM(ds.support_count) AS support_count,
          SUM(ds.converted_count) AS converted_count,
          SUM(ds.event_count) AS event_count
        FROM pci_daily_summary ds
        WHERE ds.equipment_group_code = ?
          AND ds.pci_domain = ?
          AND ds.source_work_type = ?
          AND ds.task_date BETWEEN ? AND ?
        GROUP BY ds.engineer_id, ds.pci_item_id
      ),
      self_agg AS (
        SELECT
          r.engineer_id,
          sm.pci_item_id,
          MAX(CASE WHEN a.is_checked = 1 THEN 1 ELSE 0 END) AS self_completed
        FROM checklist_response r
        JOIN checklist_response_answer a
          ON a.response_id = r.id
        JOIN pci_item_selfcheck_map sm
          ON sm.checklist_question_id = a.question_id
         AND sm.is_active = 1
        JOIN pci_item pi
          ON pi.id = sm.pci_item_id
        WHERE r.response_status = 'APPROVED'
          AND pi.equipment_group_code = ?
          AND pi.pci_domain = ?
        GROUP BY r.engineer_id, sm.pci_item_id
      )
      SELECT
        fe.id AS engineer_id,
        fe.name AS engineer_name,
        fe.company,
        fe.\`group\` AS engineer_group,
        fe.site AS engineer_site,
        fi.id AS pci_item_id,
        fi.item_code,
        fi.item_name,
        fi.item_name_kr,
        fi.category,
        fi.required_count,
        fi.self_weight,
        fi.history_max_score,
        COALESCE(sa.self_completed, 0) AS self_completed,
        CASE WHEN COALESCE(sa.self_completed, 0) = 1 THEN fi.self_weight ELSE 0 END AS self_score,
        COALESCE(ha.main_count, 0) AS main_count,
        COALESCE(ha.support_count, 0) AS support_count,
        COALESCE(ha.converted_count, 0) AS converted_count,
        COALESCE(ha.event_count, 0) AS event_count,
        ROUND(
          LEAST(
            COALESCE(ha.converted_count, 0) / NULLIF(fi.required_count, 0),
            1.0
          ) * fi.history_max_score,
          2
        ) AS history_score,
        ROUND(
          LEAST(
            (CASE WHEN COALESCE(sa.self_completed, 0) = 1 THEN fi.self_weight ELSE 0 END) +
            (
              LEAST(
                COALESCE(ha.converted_count, 0) / NULLIF(fi.required_count, 0),
                1.0
              ) * fi.history_max_score
            ),
            100
          ),
          2
        ) AS pci_score
      FROM filtered_engineers fe
      CROSS JOIN filtered_items fi
      LEFT JOIN history_agg ha
        ON ha.engineer_id = fe.id
       AND ha.pci_item_id = fi.id
      LEFT JOIN self_agg sa
        ON sa.engineer_id = fe.id
       AND sa.pci_item_id = fi.id
      ORDER BY fi.category, fi.sort_order, fi.item_name, fe.name
      `,
      [
        engineerGroup, engineerGroup,
        site, site,
        keyword, `%${keyword}%`,
        equipmentGroupCode, pciDomain,
        equipmentGroupCode, pciDomain, useSourceWorkType, dateFrom, dateTo,
        equipmentGroupCode, pciDomain,
      ]
    );

    return { rows, sourceWorkType: useSourceWorkType };
  } finally {
    conn.release();
  }
}

async function getCellDetail({
  engineerId,
  pciItemId,
  dateFrom,
  dateTo,
  sourceWorkType = '',
}) {
  const conn = await pool.getConnection();
  try {
    const [[itemRow]] = await conn.query(
      `SELECT id, equipment_group_code, pci_domain, item_code, item_name, item_name_kr,
              category, required_count, self_weight, history_max_score
         FROM pci_item
        WHERE id = ?
        LIMIT 1`,
      [pciItemId]
    );

    if (!itemRow) {
      const err = new Error('PCI 항목을 찾을 수 없습니다.');
      err.statusCode = 404;
      throw err;
    }

    const effectiveSourceWorkType =
      itemRow.pci_domain === 'MAINT'
        ? 'MAINT'
        : (sourceWorkType && ['SETUP', 'RELOCATION', 'MERGED'].includes(sourceWorkType) ? sourceWorkType : 'MERGED');

    const [[engineerRow]] = await conn.query(
      `SELECT id, name, company, \`group\`, site
         FROM engineer
        WHERE id = ?
        LIMIT 1`,
      [engineerId]
    );

    const [[summary]] = await conn.query(
      `
      SELECT
        pi.id AS pci_item_id,
        pi.equipment_group_code,
        pi.pci_domain,
        pi.item_code,
        pi.item_name,
        pi.item_name_kr,
        pi.category,
        pi.required_count,
        pi.self_weight,
        pi.history_max_score,
        COALESCE(sa.self_completed, 0) AS self_completed,
        CASE WHEN COALESCE(sa.self_completed, 0) = 1 THEN pi.self_weight ELSE 0 END AS self_score,
        COALESCE(SUM(ds.main_count), 0) AS main_count,
        COALESCE(SUM(ds.support_count), 0) AS support_count,
        COALESCE(SUM(ds.converted_count), 0) AS converted_count,
        COALESCE(SUM(ds.event_count), 0) AS event_count
      FROM pci_item pi
      LEFT JOIN pci_daily_summary ds
        ON ds.pci_item_id = pi.id
       AND ds.engineer_id = ?
       AND ds.source_work_type = ?
       AND ds.task_date BETWEEN ? AND ?
      LEFT JOIN (
        SELECT
          r.engineer_id,
          sm.pci_item_id,
          MAX(CASE WHEN a.is_checked = 1 THEN 1 ELSE 0 END) AS self_completed
        FROM checklist_response r
        JOIN checklist_response_answer a
          ON a.response_id = r.id
        JOIN pci_item_selfcheck_map sm
          ON sm.checklist_question_id = a.question_id
         AND sm.is_active = 1
        WHERE r.response_status = 'APPROVED'
          AND r.engineer_id = ?
        GROUP BY r.engineer_id, sm.pci_item_id
      ) sa
        ON sa.pci_item_id = pi.id
      WHERE pi.id = ?
      GROUP BY
        pi.id, pi.equipment_group_code, pi.pci_domain, pi.item_code, pi.item_name, pi.item_name_kr,
        pi.category, pi.required_count, pi.self_weight, pi.history_max_score, sa.self_completed
      `,
      [engineerId, effectiveSourceWorkType, dateFrom, dateTo, engineerId, pciItemId]
    );

    const [events] = await conn.query(
      `
      SELECT
        f.event_id,
        f.role,
        f.main_count,
        f.support_count,
        f.converted_count,
        f.task_date,
        f.source_work_type,
        e.task_name,
        e.equipment_type,
        e.equipment_name,
        e.work_type,
        e.setup_item,
        e.task_description,
        e.task_cause,
        e.task_result,
        e.\`group\` AS event_group,
        e.site AS event_site,
        e.line
      FROM pci_event_fact f
      JOIN wl_event e
        ON e.id = f.event_id
      WHERE f.engineer_id = ?
        AND f.pci_item_id = ?
        AND f.task_date BETWEEN ? AND ?
        AND (
          ? = '' OR
          (? = 'MERGED' AND f.source_work_type IN ('SETUP', 'RELOCATION')) OR
          f.source_work_type = ?
        )
      ORDER BY f.task_date DESC, f.event_id DESC
      `,
      [engineerId, pciItemId, dateFrom, dateTo, effectiveSourceWorkType, effectiveSourceWorkType, effectiveSourceWorkType]
    );

    const [selfQuestions] = await conn.query(
      `
      SELECT
        q.id AS checklist_question_id,
        q.question_code,
        q.question_text,
        COALESCE(MAX(CASE WHEN r.response_status = 'APPROVED' THEN a.is_checked ELSE 0 END), 0) AS is_checked,
        MAX(CASE WHEN r.response_status = 'APPROVED' THEN a.checked_at ELSE NULL END) AS checked_at,
        CASE
          WHEN MAX(CASE WHEN r.response_status = 'APPROVED' THEN 1 ELSE 0 END) = 1 THEN 'APPROVED'
          ELSE '-'
        END AS response_status,
        COUNT(DISTINCT CASE WHEN r.response_status = 'APPROVED' THEN r.id ELSE NULL END) AS approved_response_count
      FROM pci_item_selfcheck_map sm
      JOIN checklist_question q
        ON q.id = sm.checklist_question_id
      LEFT JOIN checklist_response_answer a
        ON a.question_id = q.id
      LEFT JOIN checklist_response r
        ON r.id = a.response_id
       AND r.engineer_id = ?
      WHERE sm.pci_item_id = ?
        AND sm.is_active = 1
      GROUP BY q.id, q.question_code, q.question_text
      ORDER BY q.id
      `,
      [engineerId, pciItemId]
    );

    return {
      item: itemRow,
      engineer: engineerRow || null,
      summary: summary || null,
      events,
      self_questions: selfQuestions,
      source_work_type: effectiveSourceWorkType,
    };
  } finally {
    conn.release();
  }
}

async function getEngineerDetail({
  engineerId,
  equipmentGroupCode,
  pciDomain,
  dateFrom,
  dateTo,
  sourceWorkType = '',
}) {
  const conn = await pool.getConnection();
  try {
    const effectiveSourceWorkType =
      pciDomain === 'MAINT'
        ? 'MAINT'
        : (sourceWorkType && ['SETUP', 'RELOCATION', 'MERGED'].includes(sourceWorkType) ? sourceWorkType : 'MERGED');

    const [[engineer]] = await conn.query(
      `SELECT id, name, company, \`group\`, site
         FROM engineer
        WHERE id = ?
        LIMIT 1`,
      [engineerId]
    );

    if (!engineer) {
      const err = new Error('엔지니어를 찾을 수 없습니다.');
      err.statusCode = 404;
      throw err;
    }

    const [rows] = await conn.query(
      `
      WITH filtered_items AS (
        SELECT id, item_code, item_name, item_name_kr, category, required_count, self_weight, history_max_score, sort_order
        FROM pci_item
        WHERE is_active = 1
          AND equipment_group_code = ?
          AND pci_domain = ?
      ),
      history_agg AS (
        SELECT
          ds.engineer_id,
          ds.pci_item_id,
          SUM(ds.main_count) AS main_count,
          SUM(ds.support_count) AS support_count,
          SUM(ds.converted_count) AS converted_count,
          SUM(ds.event_count) AS event_count
        FROM pci_daily_summary ds
        WHERE ds.engineer_id = ?
          AND ds.equipment_group_code = ?
          AND ds.pci_domain = ?
          AND ds.source_work_type = ?
          AND ds.task_date BETWEEN ? AND ?
        GROUP BY ds.engineer_id, ds.pci_item_id
      ),
      self_agg AS (
        SELECT
          r.engineer_id,
          sm.pci_item_id,
          MAX(CASE WHEN a.is_checked = 1 THEN 1 ELSE 0 END) AS self_completed
        FROM checklist_response r
        JOIN checklist_response_answer a
          ON a.response_id = r.id
        JOIN pci_item_selfcheck_map sm
          ON sm.checklist_question_id = a.question_id
         AND sm.is_active = 1
        WHERE r.response_status = 'APPROVED'
          AND r.engineer_id = ?
        GROUP BY r.engineer_id, sm.pci_item_id
      )
      SELECT
        fi.id AS pci_item_id,
        fi.item_code,
        fi.item_name,
        fi.item_name_kr,
        fi.category,
        fi.required_count,
        COALESCE(sa.self_completed, 0) AS self_completed,
        CASE WHEN COALESCE(sa.self_completed, 0) = 1 THEN fi.self_weight ELSE 0 END AS self_score,
        COALESCE(ha.main_count, 0) AS main_count,
        COALESCE(ha.support_count, 0) AS support_count,
        COALESCE(ha.converted_count, 0) AS converted_count,
        COALESCE(ha.event_count, 0) AS event_count,
        ROUND(LEAST(COALESCE(ha.converted_count, 0) / NULLIF(fi.required_count, 0), 1.0) * fi.history_max_score, 2) AS history_score,
        ROUND(
          LEAST(
            (CASE WHEN COALESCE(sa.self_completed, 0) = 1 THEN fi.self_weight ELSE 0 END) +
            LEAST(COALESCE(ha.converted_count, 0) / NULLIF(fi.required_count, 0), 1.0) * fi.history_max_score,
            100
          ),
          2
        ) AS pci_score
      FROM filtered_items fi
      LEFT JOIN history_agg ha
        ON ha.pci_item_id = fi.id
      LEFT JOIN self_agg sa
        ON sa.pci_item_id = fi.id
      ORDER BY fi.category, fi.sort_order, fi.item_name
      `,
      [equipmentGroupCode, pciDomain, engineerId, equipmentGroupCode, pciDomain, effectiveSourceWorkType, dateFrom, dateTo, engineerId]
    );

    return { engineer, rows, sourceWorkType: effectiveSourceWorkType };
  } finally {
    conn.release();
  }
}

async function updatePciItem({
  userIdx,
  pciItemId,
  requiredCount,
  selfWeight,
  mainWeight,
  supportWeight,
  historyMaxScore,
  sortOrder,
  isActive,
  descriptionText,
}) {
  const conn = await pool.getConnection();
  try {
    await ensureAdmin(conn, userIdx);
    await conn.query(
      `
      UPDATE pci_item
         SET required_count = ?,
             self_weight = ?,
             main_weight = ?,
             support_weight = ?,
             history_max_score = ?,
             sort_order = ?,
             is_active = ?,
             description_text = ?,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
      `,
      [
        requiredCount,
        selfWeight,
        mainWeight,
        supportWeight,
        historyMaxScore,
        sortOrder,
        isActive ? 1 : 0,
        descriptionText || null,
        pciItemId,
      ]
    );

    const [[row]] = await conn.query(
      `SELECT *
         FROM pci_item
        WHERE id = ?
        LIMIT 1`,
      [pciItemId]
    );
    return row || null;
  } finally {
    conn.release();
  }
}

async function rebuildRange({
  userIdx,
  dateFrom,
  dateTo,
}) {
  const conn = await pool.getConnection();
  try {
    const admin = await ensureAdmin(conn, userIdx);
    await conn.query(`CALL sp_pci_rebuild_all(?, ?)`, [dateFrom, dateTo]);
    return {
      ok: true,
      requested_by: admin.nickname,
      date_from: dateFrom,
      date_to: dateTo,
    };
  } finally {
    conn.release();
  }
}

async function getAdminItems({
  equipmentGroupCode = '',
  pciDomain = '',
  keyword = '',
}) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `
      SELECT
        pi.*, 
        COUNT(DISTINCT sm.id) AS source_map_count,
        COUNT(DISTINCT scm.id) AS selfcheck_map_count
      FROM pci_item pi
      LEFT JOIN pci_item_source_map sm
        ON sm.pci_item_id = pi.id
       AND sm.is_active = 1
      LEFT JOIN pci_item_selfcheck_map scm
        ON scm.pci_item_id = pi.id
       AND scm.is_active = 1
      WHERE 1=1
        AND (? = '' OR pi.equipment_group_code = ?)
        AND (? = '' OR pi.pci_domain = ?)
        AND (? = '' OR pi.item_name LIKE ? OR pi.item_name_kr LIKE ? OR pi.item_code LIKE ?)
      GROUP BY pi.id
      ORDER BY pi.equipment_group_code, pi.pci_domain, pi.category, pi.sort_order, pi.item_name
      `,
      [
        equipmentGroupCode, equipmentGroupCode,
        pciDomain, pciDomain,
        keyword, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`
      ]
    );
    return { rows };
  } finally {
    conn.release();
  }
}

module.exports = {
  resolveUserIdx,
  getFilterOptions,
  getMatrix,
  getCellDetail,
  getEngineerDetail,
  updatePciItem,
  rebuildRange,
  getAdminItems,
};
