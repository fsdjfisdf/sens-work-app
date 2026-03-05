/**
 * wl_dao.js
 * 새 스키마(wl_event, wl_worker, wl_work_item, wl_part, wl_approval)용 DAO
 * 기존 work_LogDao.js 구조·컨벤션 그대로 유지
 */
'use strict';

const { pool } = require('../../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/** 분(int) → "HH:MM" 문자열 (wl_worker.task_duration 저장용) */
function minToTime(min) {
  const m = Math.max(0, Number(min) || 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** TIME_TO_SEC 계산 (start/end가 없을 때 대비) */
function calcDuration(startTime, endTime, noneTime, moveTime) {
  if (!startTime || !endTime) return 0;
  const toSec = s => {
    const [hh, mm, ss = 0] = s.split(':').map(Number);
    return hh * 3600 + mm * 60 + ss;
  };
  const raw = toSec(endTime) - toSec(startTime);
  const net = raw - (Number(noneTime) || 0) * 60 - (Number(moveTime) || 0) * 60;
  return Math.max(0, Math.floor(net / 60)); // 분 단위 반환
}


// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

exports.getUsersByNicknames = async (nicknames) => {
  if (!Array.isArray(nicknames) || !nicknames.length) return [];
  const conn = await pool.getConnection(async c => c);
  try {
    const [rows] = await conn.query(
      `SELECT userIdx, nickname, userID, role, \`group\`, site
       FROM Users WHERE nickname IN (?) AND status='A'`,
      [nicknames]
    );
    return rows;
  } finally { conn.release(); }
};

/** userDB에서 이름으로 LEVEL 조회 */
exports.getEngineerLevel = async (name) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [rows] = await conn.query(
      `SELECT ID, \`LEVEL\` FROM userDB WHERE NAME = ? LIMIT 1`,
      [name.trim()]
    );
    return rows[0] || null; // { ID, LEVEL } or null
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// Work Code 자동 생성
// ─────────────────────────────────────────────────────────────────────────────

exports.generateWorkCode = async (eqType, site, wtype, wtype2, taskDate, taskName) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [rows] = await conn.query(
      `SELECT fn_gen_work_code(?, ?, ?, ?, ?, ?) AS code`,
      [eqType, site, wtype, wtype2, taskDate, taskName]
    );
    return rows[0]?.code || null;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 작업 항목 마스터 (wl_work_item_master)
// ─────────────────────────────────────────────────────────────────────────────

exports.getWorkItemsByEqType = async (equipmentType) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [rows] = await conn.query(
      `SELECT id, item_name, item_name_kr, category
       FROM wl_work_item_master
       WHERE equipment_type = ? AND is_active = 1
       ORDER BY category, item_name`,
      [equipmentType]
    );
    return rows;
  } finally { conn.release(); }
};

/** 교체 파트 마스터 */
exports.getPartsByEqType = async (equipmentType) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [rows] = await conn.query(
      `SELECT id, part_name, part_name_kr, category
       FROM wl_part_master
       WHERE equipment_type = ? AND is_active = 1
       ORDER BY category, part_name`,
      [equipmentType]
    );
    return rows;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 결재 대기 제출  →  wl_event(DRAFT) + wl_worker + wl_work_item + wl_part
// ─────────────────────────────────────────────────────────────────────────────

/**
 * payload 구조:
 * {
 *   // wl_event
 *   task_name, task_date, country,
 *   group, site, line,
 *   equipment_type, equipment_name, warranty, ems,
 *   work_type, work_type2, setup_item,
 *   status, task_description, task_cause, task_result,
 *   SOP, tsguide,
 *   start_time, end_time, none_time, move_time,
 *   is_rework, rework_seq, rework_ref_id,
 *   created_by,          // Users.userIdx (JWT에서)
 *
 *   // wl_worker  (배열)
 *   workers: [{ name, role, start_time?, end_time? }, ...]
 *
 *   // wl_work_item (배열)  ← 기존 transfer_item
 *   workItems: [{ master_id?, item_name_free? }, ...]
 *
 *   // wl_part (배열)
 *   parts: [{ master_id?, part_name_free?, qty? }, ...]
 * }
 */
exports.submitEvent = async (payload) => {
  const conn = await pool.getConnection(async c => c);
  try {
    await conn.beginTransaction();

    // 1) work_code 생성
    const [codeRows] = await conn.query(
      `SELECT fn_gen_work_code(?, ?, ?, ?, ?, ?) AS code`,
      [
        payload.equipment_type, payload.site,
        payload.work_type, payload.work_type2,
        payload.task_date, payload.task_name
      ]
    );
    const workCode = codeRows[0]?.code || null;

    // 2) wl_event INSERT (approval_status = 'DRAFT' → 제출 시 PENDING)
    const [evRes] = await conn.query(
      `INSERT INTO wl_event (
        work_code, task_name, task_date, country,
        \`group\`, site, \`line\`,
        equipment_type, equipment_name, warranty, ems,
        work_type, work_type2, setup_item,
        status, task_description, task_cause, task_result,
        SOP, tsguide,
        start_time, end_time, none_time, move_time,
        is_rework, rework_seq, rework_ref_id,
        approval_status, created_by
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        'PENDING', ?
      )`,
      [
        workCode,
        payload.task_name,
        payload.task_date,
        payload.country || 'KR',
        payload.group,
        payload.site,
        payload.line,
        payload.equipment_type,
        payload.equipment_name,
        payload.warranty,
        payload.ems === 1 ? 1 : 0,
        payload.work_type,
        payload.work_type2,
        payload.setup_item || null,
        payload.status,
        payload.task_description,
        payload.task_cause,
        payload.task_result,
        payload.SOP,
        payload.tsguide,
        payload.start_time || null,
        payload.end_time || null,
        Number(payload.none_time) || 0,
        Number(payload.move_time) || 0,
        payload.is_rework ? 1 : 0,
        Number(payload.rework_seq) || 0,
        payload.rework_ref_id || null,
        payload.created_by || null,
      ]
    );
    const eventId = evRes.insertId;

    // 3) wl_worker INSERT (작업자별)
    const workers = Array.isArray(payload.workers) ? payload.workers : [];
    for (const w of workers) {
      // userDB에서 LEVEL 조회
      const [uRows] = await conn.query(
        `SELECT ID, \`LEVEL\` FROM userDB WHERE NAME = ? LIMIT 1`,
        [w.name.trim()]
      );
      const userdbId  = uRows[0]?.ID   || null;
      const engLevel  = uRows[0]?.LEVEL ?? null;

      const duration = calcDuration(
        w.start_time || payload.start_time,
        w.end_time   || payload.end_time,
        payload.none_time,
        payload.move_time
      );

      await conn.query(
        `INSERT INTO wl_worker
           (event_id, engineer_name, userdb_id, role, eng_level,
            task_duration, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId, w.name.trim(), userdbId,
          w.role || 'main', engLevel,
          duration,
          w.start_time || payload.start_time || null,
          w.end_time   || payload.end_time   || null,
        ]
      );
    }

    // 4) wl_work_item INSERT
    const workItems = Array.isArray(payload.workItems) ? payload.workItems : [];
    for (const wi of workItems) {
      if (!wi.master_id && !wi.item_name_free) continue;
      await conn.query(
        `INSERT INTO wl_work_item (event_id, master_id, item_name_free)
         VALUES (?, ?, ?)`,
        [eventId, wi.master_id || null, wi.item_name_free || null]
      );
    }

    // 5) wl_part INSERT
    const parts = Array.isArray(payload.parts) ? payload.parts : [];
    for (const p of parts) {
      if (!p.master_id && !p.part_name_free) continue;
      await conn.query(
        `INSERT INTO wl_part (event_id, master_id, part_name_free, qty)
         VALUES (?, ?, ?, ?)`,
        [eventId, p.master_id || null, p.part_name_free || null, Number(p.qty) || 1]
      );
    }

    // 6) wl_approval 로그
    await conn.query(
      `INSERT INTO wl_approval (event_id, seq, action, actor_id, actor_name)
       VALUES (?, 1, 'SUBMIT', ?, ?)`,
      [eventId, payload.created_by || null, payload.submitter_name || null]
    );

    await conn.commit();
    return { eventId, workCode };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 결재 대기 목록 조회
// ─────────────────────────────────────────────────────────────────────────────

exports.listPendingEvents = async (group, site, mineNickname) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const cond = [`e.approval_status = 'PENDING'`];
    const vals = [];

    if (group) { cond.push('e.`group` = ?'); vals.push(group); }
    if (site && group !== 'PSKH') { cond.push('e.site = ?'); vals.push(site); }

    if (mineNickname) {
      cond.push(`EXISTS (
        SELECT 1 FROM wl_worker ww
        WHERE ww.event_id = e.id AND ww.engineer_name = ?
      )`);
      vals.push(mineNickname.trim());
    }

    const sql = `
      SELECT e.*,
        GROUP_CONCAT(ww.engineer_name ORDER BY ww.id SEPARATOR ', ') AS workers
      FROM wl_event e
      LEFT JOIN wl_worker ww ON ww.event_id = e.id
      WHERE ${cond.join(' AND ')}
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;
    const [rows] = await conn.query(sql, vals);
    return rows;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 단건 조회 (wl_event + workers + work_items + parts)
// ─────────────────────────────────────────────────────────────────────────────

exports.getEventById = async (id) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [[event]] = await conn.query(
      `SELECT * FROM wl_event WHERE id = ?`, [id]
    );
    if (!event) return null;

    const [workers] = await conn.query(
      `SELECT * FROM wl_worker WHERE event_id = ? ORDER BY id`, [id]
    );
    const [workItems] = await conn.query(
      `SELECT wi.*, m.item_name AS master_item_name
       FROM wl_work_item wi
       LEFT JOIN wl_work_item_master m ON m.id = wi.master_id
       WHERE wi.event_id = ?`, [id]
    );
    const [parts] = await conn.query(
      `SELECT p.*, pm.part_name AS master_part_name
       FROM wl_part p
       LEFT JOIN wl_part_master pm ON pm.id = p.master_id
       WHERE p.event_id = ?`, [id]
    );
    const [approvals] = await conn.query(
      `SELECT * FROM wl_approval WHERE event_id = ? ORDER BY seq, acted_at`, [id]
    );

    return { ...event, workers, workItems, parts, approvals };
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// PATCH (결재자 또는 제출자 수정)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_PATCH_FIELDS = [
  'task_name', 'task_date', 'country',
  'group', 'site', 'line',
  'equipment_type', 'equipment_name', 'warranty', 'ems',
  'work_type', 'work_type2', 'setup_item',
  'status', 'task_description', 'task_cause', 'task_result',
  'SOP', 'tsguide',
  'start_time', 'end_time', 'none_time', 'move_time',
  'is_rework', 'rework_seq', 'rework_ref_id',
];

exports.patchEvent = async (id, patch) => {
  const sets = [], vals = [];
  for (const k of Object.keys(patch || {})) {
    if (!ALLOWED_PATCH_FIELDS.includes(k)) continue;
    sets.push(`\`${k}\` = ?`);
    vals.push(patch[k]);
  }
  if (!sets.length) return;
  vals.push(id);
  await pool.query(`UPDATE wl_event SET ${sets.join(', ')} WHERE id = ?`, vals);
};


// ─────────────────────────────────────────────────────────────────────────────
// 반려
// ─────────────────────────────────────────────────────────────────────────────

exports.rejectEvent = async (id, actorId, actorName, comment) => {
  const conn = await pool.getConnection(async c => c);
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE wl_event SET approval_status = 'REJECTED' WHERE id = ?`, [id]
    );

    const [[prev]] = await conn.query(
      `SELECT IFNULL(MAX(seq), 0) AS maxSeq FROM wl_approval WHERE event_id = ?`, [id]
    );
    await conn.query(
      `INSERT INTO wl_approval (event_id, seq, action, actor_id, actor_name, comment)
       VALUES (?, ?, 'REJECT', ?, ?, ?)`,
      [id, (prev.maxSeq || 0) + 1, actorId, actorName, comment || null]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback(); throw e;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 재제출 (REJECTED → PENDING)
// ─────────────────────────────────────────────────────────────────────────────

exports.resubmitEvent = async (id, actorId, actorName, patch) => {
  const conn = await pool.getConnection(async c => c);
  try {
    await conn.beginTransaction();

    if (patch && Object.keys(patch).length) {
      const sets = [], vals = [];
      for (const k of Object.keys(patch)) {
        if (!ALLOWED_PATCH_FIELDS.includes(k)) continue;
        sets.push(`\`${k}\` = ?`); vals.push(patch[k]);
      }
      if (sets.length) {
        vals.push(id);
        await conn.query(`UPDATE wl_event SET ${sets.join(', ')} WHERE id = ?`, vals);
      }
    }

    await conn.query(
      `UPDATE wl_event SET approval_status = 'PENDING' WHERE id = ?`, [id]
    );

    const [[prev]] = await conn.query(
      `SELECT IFNULL(MAX(seq), 0) AS maxSeq FROM wl_approval WHERE event_id = ?`, [id]
    );
    await conn.query(
      `INSERT INTO wl_approval (event_id, seq, action, actor_id, actor_name)
       VALUES (?, ?, 'SUBMIT', ?, ?)`,
      [id, (prev.maxSeq || 0) + 1, actorId, actorName]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback(); throw e;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 승인 (PENDING → APPROVED, wl_approval에 스냅샷 저장)
// ─────────────────────────────────────────────────────────────────────────────

exports.approveEvent = async (id, actorId, actorName, comment, patch) => {
  const conn = await pool.getConnection(async c => c);
  try {
    await conn.beginTransaction();

    // 결재자 보정 먼저 적용
    if (patch && Object.keys(patch).length) {
      const sets = [], vals = [];
      for (const k of Object.keys(patch)) {
        if (!ALLOWED_PATCH_FIELDS.includes(k)) continue;
        sets.push(`\`${k}\` = ?`); vals.push(patch[k]);
      }
      if (sets.length) { vals.push(id); await conn.query(`UPDATE wl_event SET ${sets.join(', ')} WHERE id = ?`, vals); }
    }

    // 최종 데이터 스냅샷
    const [[snapshot]] = await conn.query(`SELECT * FROM wl_event WHERE id = ?`, [id]);

    await conn.query(
      `UPDATE wl_event SET approval_status = 'APPROVED' WHERE id = ?`, [id]
    );

    const [[prev]] = await conn.query(
      `SELECT IFNULL(MAX(seq), 0) AS maxSeq FROM wl_approval WHERE event_id = ?`, [id]
    );
    await conn.query(
      `INSERT INTO wl_approval (event_id, seq, action, actor_id, actor_name, comment, snapshot)
       VALUES (?, ?, 'APPROVE', ?, ?, ?, ?)`,
      [id, (prev.maxSeq || 0) + 1, actorId, actorName, comment || null, JSON.stringify(snapshot)]
    );

    await conn.commit();
    return id;
  } catch (e) {
    await conn.rollback(); throw e;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 내 반려 목록
// ─────────────────────────────────────────────────────────────────────────────

exports.listMyRejected = async (userIdx) => {
  const conn = await pool.getConnection(async c => c);
  try {
    const [rows] = await conn.query(
      `SELECT e.*,
         GROUP_CONCAT(ww.engineer_name ORDER BY ww.id SEPARATOR ', ') AS workers,
         (SELECT comment FROM wl_approval
          WHERE event_id = e.id AND action = 'REJECT'
          ORDER BY acted_at DESC LIMIT 1) AS reject_comment
       FROM wl_event e
       LEFT JOIN wl_worker ww ON ww.event_id = e.id
       WHERE e.approval_status = 'REJECTED' AND e.created_by = ?
       GROUP BY e.id
       ORDER BY e.updated_at DESC`,
      [userIdx]
    );
    return rows;
  } finally { conn.release(); }
};


// ─────────────────────────────────────────────────────────────────────────────
// 결재자 조회 (기존 APPROVER_MAP 그대로 활용)
// ─────────────────────────────────────────────────────────────────────────────

exports.getApproversByGroupSite = async (group, site) => {
  // APPROVER_MAP은 컨트롤러에서 관리 → 닉네임 배열을 받아 Users 조회
  // 이 함수는 nicknames 배열을 받아 Users 행 반환
  return exports.getUsersByNicknames; // 컨트롤러에서 직접 호출
};
