const { pool } = require('../../config/database');

/* ===== 유틸: KST 기준 월요일/일요일 ===== */
function fmtYMD(d){const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,'0'),da=String(d.getUTCDate()).padStart(2,'0');return `${y}-${m}-${da}`;}
function addDaysISO(iso,n){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return fmtYMD(d);}
function getKstMondayISO(base=new Date()){
  const kst=new Date(base.getTime()+9*3600*1000);
  const dow=kst.getUTCDay(); const diff=(dow===0?-6:1-dow);
  const mon=new Date(kst); mon.setUTCDate(kst.getUTCDate()+diff); return fmtYMD(mon);
}

/* ===== 쿼리들 ===== */
async function fetchKpis({weekStart,weekEnd,group,site}){
  const sql=`
    SELECT
      COUNT(*) AS total_tasks,
      ROUND(SUM(TIME_TO_SEC(IFNULL(task_duration,'00:00:00')))/3600,2) AS sum_task_hours,
      ROUND(SUM(IFNULL(move_time,0))/60,2) AS sum_move_hours,
      ROUND((SUM(TIME_TO_SEC(IFNULL(task_duration,'00:00:00')))/3600)+(SUM(IFNULL(move_time,0))/60),2) AS sum_total_hours,
      ROUND(AVG(TIME_TO_SEC(IFNULL(task_duration,'00:00:00')))/3600,2) AS avg_task_hours,
      SUM(CASE WHEN DAYOFWEEK(task_date) IN (1,7) THEN 1 ELSE 0 END) AS weekend_tasks,
      SUM(CASE WHEN LOWER(IFNULL(status,'')) REGEXP 'fail|ng|보류|미해결' THEN 1 ELSE 0 END) AS failed_tasks
    FROM work_log
    WHERE task_date BETWEEN ? AND ? AND \`group\`=? AND site=?`;
  const [rows]=await pool.execute(sql,[weekStart,weekEnd,group,site]); return rows[0]||null;
}
async function fetchTopEqByCount(p){
  const sql=`
    SELECT equipment_name, COUNT(*) AS cnt
    FROM work_log
    WHERE task_date BETWEEN ? AND ? AND \`group\`=? AND site=?
    GROUP BY equipment_name
    ORDER BY cnt DESC LIMIT ?`;
  const [rows]=await pool.execute(sql,[p.weekStart,p.weekEnd,p.group,p.site,p.limit||5]); return rows;
}
async function fetchTopCause(p){
  const sql=`
    SELECT COALESCE(NULLIF(TRIM(task_cause),''),'미기재') AS cause, COUNT(*) AS cnt
    FROM work_log
    WHERE task_date BETWEEN ? AND ? AND \`group\`=? AND site=?
    GROUP BY cause ORDER BY cnt DESC LIMIT ?`;
  const [rows]=await pool.execute(sql,[p.weekStart,p.weekEnd,p.group,p.site,p.limit||5]); return rows;
}
async function fetchIncidents(p){
  const sql=`
    SELECT task_date,equipment_name,task_name,
           COALESCE(NULLIF(TRIM(task_cause),''),'미기재') AS task_cause,
           IFNULL(status,'') AS status,
           ROUND(TIME_TO_SEC(IFNULL(task_duration,'00:00:00'))/3600 + IFNULL(move_time,0)/60,2) AS hours
    FROM work_log
    WHERE task_date BETWEEN ? AND ? AND \`group\`=? AND site=?
      AND (TIME_TO_SEC(IFNULL(task_duration,'00:00:00'))>=4*3600 OR LOWER(IFNULL(status,'')) REGEXP 'fail|ng|보류|미해결')
    ORDER BY hours DESC LIMIT ?`;
  const [rows]=await pool.execute(sql,[p.weekStart,p.weekEnd,p.group,p.site,p.limit||50]); return rows;
}
async function getCached({weekStart,group,site}){
  const [rows]=await pool.execute(
    `SELECT * FROM weekly_summaries WHERE week_start=? AND \`group\`=? AND site=?`,
    [weekStart,group,site]
  );
  const r=rows[0]; if(!r) return null;
  const k=typeof r.kpis_json==='string'?JSON.parse(r.kpis_json):r.kpis_json;
  const s=typeof r.llm_summary_json==='string'?JSON.parse(r.llm_summary_json):r.llm_summary_json;
  return {week_start:r.week_start,group:r.group,site:r.site,kpis_json:k,llm_summary_json:s,generated_at:r.generated_at};
}
async function upsertCache({weekStart,group,site,kpis,summary}){
  const sql=`
    INSERT INTO weekly_summaries (week_start,\`group\`,site,kpis_json,llm_summary_json)
    VALUES (?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      kpis_json=VALUES(kpis_json),
      llm_summary_json=VALUES(llm_summary_json),
      generated_at=CURRENT_TIMESTAMP`;
  await pool.execute(sql,[weekStart,group,site,JSON.stringify(kpis),JSON.stringify(summary)]);
}

/* ===== 규칙 기반 요약(LLM 없이도 동작) ===== */
function buildRuleSummary({kpis,topEqByCnt=[],topCause=[],incidents=[]}){
  const one=(()=>{
    const t=kpis?.total_tasks??0,h=kpis?.sum_total_hours??0,w=kpis?.weekend_tasks??0,f=kpis?.failed_tasks??0;
    const eq=topEqByCnt[0]?.equipment_name||'주요 장비 미도출';
    return `총 ${t}건 / ${h}h 처리, 주말 ${w}건, 실패/미해결 ${f}건. 이슈 집중 장비: ${eq}`;
  })();
  const kpi_highlights=[
    `총 작업시간: ${kpis?.sum_total_hours??0}h`,
    `작업:${kpis?.sum_task_hours??0}h + 이동:${kpis?.sum_move_hours??0}h`,
    `평균/건: ${kpis?.avg_task_hours??0}h`,
    `주말 작업: ${kpis?.weekend_tasks??0}건`,
    `실패/미해결: ${kpis?.failed_tasks??0}건`,
  ];
  const top_issues=[];
  if(topCause[0]) top_issues.push({title:`반복 원인: ${topCause[0].cause}`,evidence:`빈도 ${topCause[0].cnt}건`,recommendation:`"${topCause[0].cause}" 관련 SOP/TS 보강`});
  if(topEqByCnt[0]) top_issues.push({title:`장비 집중: ${topEqByCnt[0].equipment_name}`,evidence:`작업 ${topEqByCnt[0].cnt}건`,recommendation:`PM/교정 점검 및 예방조치`});
  if(incidents[0]){const it=incidents[0]; top_issues.push({title:`장시간/이슈 사례: ${it.equipment_name}`,evidence:`${it.task_date} ${it.task_name} (${it.hours}h, 원인:${it.task_cause}, 상태:${it.status})`,recommendation:`경과 분석 및 재발방지`});}
  while(top_issues.length<3) top_issues.push({title:'추가 이슈 없음',evidence:'-',recommendation:'-'});
  const next_actions=['반복 원인 상위 1건 CAPA 회의','Top 장비 1대 PM/교정 점검','미해결 리스트 48h 내 클로징 계획'];
  return {one_liner:one,kpi_highlights,top_issues,next_actions};
}

/* ===== 외부 공개 메서드 ===== */
exports.getOrCreateWeeklySummary = async ({group,site,weekStart,force=false})=>{
  const wkStart=weekStart||getKstMondayISO(); const wkEnd=addDaysISO(wkStart,6);
  if(!force){const cached=await getCached({weekStart:wkStart,group,site}); if(cached) return cached;}
  const [kpis,topEqByCnt,topCause,incidents]=await Promise.all([
    fetchKpis({weekStart:wkStart,weekEnd:wkEnd,group,site}),
    fetchTopEqByCount({weekStart:wkStart,weekEnd:wkEnd,group,site}),
    fetchTopCause({weekStart:wkStart,weekEnd:wkEnd,group,site}),
    fetchIncidents({weekStart:wkStart,weekEnd:wkEnd,group,site})
  ]);
  const summary=buildRuleSummary({kpis,topEqByCnt,topCause,incidents});
  await upsertCache({weekStart:wkStart,group,site,kpis,summary});
  return {week_start:wkStart,group,site,kpis_json:kpis,llm_summary_json:summary};
};
