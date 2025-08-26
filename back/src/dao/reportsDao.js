// src/dao/reportsDao.js
'use strict';

const { pool } = require('../../config/database');

/* =========================
 *  Optional AI summarizer
 * ========================= */
let summarizeWeekly = null;
try {
  // 존재하지 않아도 됨. 있으면 사용, 없으면 폴백.
  ({ summarizeWeekly } = require('../services/summarizer'));
} catch (_e) {
  summarizeWeekly = null;
}

/* =========================
 *  Date & util helpers
 * ========================= */
function fmtYMD(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}
function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return fmtYMD(d);
}
function getKstMondayISO(base = new Date()) {
  const kst = new Date(base.getTime() + 9 * 3600 * 1000);
  const dow = kst.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = (dow === 0 ? -6 : 1 - dow);
  const mon = new Date(kst);
  mon.setUTCDate(kst.getUTCDate() + diff);
  return fmtYMD(mon);
}
function safeLimit(n, def = 5, max = 200) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v) || v <= 0) return def;
  return Math.min(v, max);
}

/* =========================
 *  Ensure cache table
 * ========================= */
async function ensureCacheTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS weekly_summaries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      week_start DATE NOT NULL,
      \`group\` VARCHAR(255) NOT NULL,
      site VARCHAR(255) NOT NULL,
      kpis_json JSON NOT NULL,
      llm_summary_json JSON NOT NULL,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_week_group_site (week_start, \`group\`, site)
    );
  `;
  try {
    await pool.execute(sql);
  } catch (e) {
    // JSON 미지원(MySQL 5.6 이하) 등으로 실패할 수 있음. 에러만 알리고 진행.
    console.warn('[weekly_summaries] ensure table failed:', e.message);
  }
}

/* =========================
 *  Aggregations
 * ========================= */
async function fetchKpis({ weekStart, weekEnd, group, site }) {
  const sql = `
    SELECT
      COUNT(*) AS total_tasks,
      ROUND(SUM(TIME_TO_SEC(IFNULL(task_duration,'00:00:00')))/3600, 2) AS sum_task_hours,
      ROUND(SUM(IFNULL(move_time,0))/60, 2) AS sum_move_hours,
      ROUND(
        (SUM(TIME_TO_SEC(IFNULL(task_duration,'00:00:00')))/3600) + (SUM(IFNULL(move_time,0))/60), 2
      ) AS sum_total_hours,
      ROUND(AVG(TIME_TO_SEC(IFNULL(task_duration,'00:00:00')))/3600, 2) AS avg_task_hours,
      SUM(CASE WHEN DAYOFWEEK(task_date) IN (1,7) THEN 1 ELSE 0 END) AS weekend_tasks,
      SUM(CASE WHEN LOWER(IFNULL(status,'')) REGEXP 'fail|ng|보류|미해결' THEN 1 ELSE 0 END) AS failed_tasks
    FROM work_log
    WHERE task_date BETWEEN ? AND ?
      AND \`group\` = ?
      AND site = ?
  `;
  const [rows] = await pool.execute(sql, [weekStart, weekEnd, group, site]);
  return rows[0] || {
    total_tasks: 0,
    sum_task_hours: 0,
    sum_move_hours: 0,
    sum_total_hours: 0,
    avg_task_hours: 0,
    weekend_tasks: 0,
    failed_tasks: 0
  };
}

async function fetchTopEqByCount({ weekStart, weekEnd, group, site, limit = 5 }) {
  const lim = safeLimit(limit, 5, 100);
  const sql = `
    SELECT equipment_name, COUNT(*) AS cnt
    FROM work_log
    WHERE task_date BETWEEN ? AND ?
      AND \`group\` = ? AND site = ?
    GROUP BY equipment_name
    ORDER BY cnt DESC
    LIMIT ${lim}
  `;
  const [rows] = await pool.execute(sql, [weekStart, weekEnd, group, site]);
  return rows;
}

async function fetchTopCause({ weekStart, weekEnd, group, site, limit = 5 }) {
  const lim = safeLimit(limit, 5, 100);
  const sql = `
    SELECT COALESCE(NULLIF(TRIM(task_cause),''), '미기재') AS cause, COUNT(*) AS cnt
    FROM work_log
    WHERE task_date BETWEEN ? AND ?
      AND \`group\` = ? AND site = ?
    GROUP BY cause
    ORDER BY cnt DESC
    LIMIT ${lim}
  `;
  const [rows] = await pool.execute(sql, [weekStart, weekEnd, group, site]);
  return rows;
}

async function fetchIncidents({ weekStart, weekEnd, group, site, limit = 50 }) {
  const lim = safeLimit(limit, 50, 200);
  const sql = `
    SELECT
      task_date, equipment_name, task_name,
      COALESCE(NULLIF(TRIM(task_cause),''), '미기재') AS task_cause,
      IFNULL(status,'') AS status,
      ROUND(TIME_TO_SEC(IFNULL(task_duration,'00:00:00'))/3600 + IFNULL(move_time,0)/60, 2) AS hours
    FROM work_log
    WHERE task_date BETWEEN ? AND ?
      AND \`group\` = ? AND site = ?
      AND (
        TIME_TO_SEC(IFNULL(task_duration,'00:00:00')) >= 4*3600
        OR LOWER(IFNULL(status,'')) REGEXP 'fail|ng|보류|미해결'
      )
    ORDER BY hours DESC
    LIMIT ${lim}
  `;
  const [rows] = await pool.execute(sql, [weekStart, weekEnd, group, site]);
  return rows;
}

/* =========================
 *  Cache helpers
 * ========================= */
async function getCached({ weekStart, group, site }) {
  const [rows] = await pool.execute(
    `SELECT * FROM weekly_summaries WHERE week_start=? AND \`group\`=? AND site=?`,
    [weekStart, group, site]
  );
  const r = rows[0];
  if (!r) return null;

  let kpis = r.kpis_json;
  let summary = r.llm_summary_json;
  // JSON 컬럼이 아닌 TEXT 환경 대비
  if (typeof kpis === 'string') {
    try { kpis = JSON.parse(kpis); } catch (_e) {}
  }
  if (typeof summary === 'string') {
    try { summary = JSON.parse(summary); } catch (_e) {}
  }

  return {
    week_start: r.week_start,
    group: r.group,
    site: r.site,
    kpis_json: kpis,
    llm_summary_json: summary,
    generated_at: r.generated_at
  };
}

async function upsertCache({ weekStart, group, site, kpis, summary }) {
  const sql = `
    INSERT INTO weekly_summaries (week_start, \`group\`, site, kpis_json, llm_summary_json)
    VALUES (?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      kpis_json = VALUES(kpis_json),
      llm_summary_json = VALUES(llm_summary_json),
      generated_at = CURRENT_TIMESTAMP
  `;
  await pool.execute(sql, [
    weekStart, group, site,
    JSON.stringify(kpis), JSON.stringify(summary)
  ]);
}

/* =========================
 *  Rule-based summary
 * ========================= */
function buildRuleSummary({ kpis, topEqByCnt = [], topCause = [], incidents = [] }) {
  const t = kpis?.total_tasks ?? 0;
  const h = kpis?.sum_total_hours ?? 0;
  const w = kpis?.weekend_tasks ?? 0;
  const f = kpis?.failed_tasks ?? 0;
  const eq = (topEqByCnt[0]?.equipment_name || '주요 장비 미도출');

  const one_liner = `총 ${t}건 / ${h}h 처리, 주말 ${w}건, 실패/미해결 ${f}건. 이슈 집중 장비: ${eq}`;

  const top_issues = [];
  if (topCause[0]) {
    top_issues.push({
      title: `반복 원인: ${topCause[0].cause}`,
      evidence: `빈도 ${topCause[0].cnt}건`,
      recommendation: `원인 "${topCause[0].cause}" 관련 SOP/TS 가이드 보강`
    });
  }
  if (topEqByCnt[0]) {
    top_issues.push({
      title: `장비 집중: ${topEqByCnt[0].equipment_name}`,
      evidence: `작업 ${topEqByCnt[0].cnt}건`,
      recommendation: `PM 주기/교정 점검 및 예방조치`
    });
  }
  if (incidents[0]) {
    const it = incidents[0];
    top_issues.push({
      title: `장시간/이슈 사례: ${it.equipment_name}`,
      evidence: `${it.task_date} ${it.task_name} (${it.hours}h, 원인:${it.task_cause}, 상태:${it.status})`,
      recommendation: `경과 분석 및 재발 방지 대책`
    });
  }
  while (top_issues.length < 3) {
    top_issues.push({ title: '추가 이슈 없음', evidence: '-', recommendation: '-' });
  }

  const next_actions = [
    '반복 원인 상위 1건 CAPA 회의',
    'Top 장비 1대 PM/교정 점검',
    '미해결 리스트 48h 내 클로징 계획'
  ];

  return { one_liner, top_issues, next_actions };
}

/* =========================
 *  Public API
 * ========================= */
exports.getOrCreateWeeklySummary = async ({ group, site, weekStart, force = false }) => {
  await ensureCacheTable();

  const wkStart = weekStart || getKstMondayISO();
  const wkEnd = addDaysISO(wkStart, 6);

  if (!force) {
    const cached = await getCached({ weekStart: wkStart, group, site });
    if (cached) return cached;
  }

  const [kpis, topEqByCnt, topCause, incidents] = await Promise.all([
    fetchKpis({ weekStart: wkStart, weekEnd: wkEnd, group, site }),
    fetchTopEqByCount({ weekStart: wkStart, weekEnd: wkEnd, group, site, limit: 5 }),
    fetchTopCause({ weekStart: wkStart, weekEnd: wkEnd, group, site, limit: 5 }),
    fetchIncidents({ weekStart: wkStart, weekEnd: wkEnd, group, site, limit: 50 })
  ]);

  let summary;

  // 1) AI 요약 시도 (summarizer.js가 있고, SUMMARIZER_ENABLED=true일 때)
  if (typeof summarizeWeekly === 'function') {
    try {
      summary = await summarizeWeekly({
        group, site, weekStart: wkStart,
        kpis, topCause, topEq: topEqByCnt, incidents
      });
      // 최소 스키마 체크
      if (!summary?.one_liner || !Array.isArray(summary?.top_issues)) {
        throw new Error('summarizer returned invalid shape');
      }
    } catch (e) {
      // 실패 시 로그만 남기고 룰 기반으로 폴백
      console.warn('[summarizer] failed, fallback to rule-based:', e.message);
      summary = buildRuleSummary({ kpis, topEqByCnt, topCause, incidents });
    }
  } else {
    // 2) summarizer 미사용 → 룰 기반
    summary = buildRuleSummary({ kpis, topEqByCnt, topCause, incidents });
  }

  await upsertCache({ weekStart: wkStart, group, site, kpis, summary });

  return {
    week_start: wkStart,
    group,
    site,
    kpis_json: kpis,
    llm_summary_json: summary
  };
};

/* (선택) 테스트/디버깅을 위해 내부 함수도 필요하면 export 하세요 */
// exports._internal = { fetchKpis, fetchTopEqByCount, fetchTopCause, fetchIncidents, buildRuleSummary };
