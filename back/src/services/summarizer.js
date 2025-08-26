// src/services/summarizer.js
// Node 18+는 fetch 내장, 18 미만이면 아래 두 줄 주석 해제
// if (typeof fetch === 'undefined') {
//   global.fetch = (...args) => import('node-fetch').then(({default:f}) => f(...args));
// }

const ENABLED  = (process.env.SUMMARIZER_ENABLED || 'false').toLowerCase() === 'true';
const PROVIDER = process.env.AI_PROVIDER || 'ollama';

function tryParseJSON(s){ try { return JSON.parse(s); } catch { return null; } }

function buildPrompt({ group, site, weekStart, kpis, topCause = [], topEq = [], incidents = [] }) {
  const facts = {
    context: { group, site, weekStart },
    kpis,
    topCause: topCause.slice(0,3),
    topEq: topEq.slice(0,3),
    incidents: incidents.slice(0,5).map(x => ({
      task_date: x.task_date,
      equipment_name: x.equipment_name,
      task_name: x.task_name,
      task_cause: x.task_cause,
      status: x.status,
      hours: x.hours
    }))
  };

  const instructions = `
당신은 반도체 설비 엔지니어링 팀의 주간 운영 리포트 작성 보조입니다.
- 한국어, 보고체(간결/정확)로 작성하세요.
- 용어 통일: 이동시간, 평균 처리시간/건, 미해결(=open), 주말 작업
- 장비명은 대문자, 원인 앞 불필요 기호(-., 공백) 제거
- "권고" 항목은 실행 가능한 한 줄 액션으로
- 아래 JSON 스키마로만 출력하세요. 추가 텍스트/주석 금지.

JSON 스키마:
{
  "one_liner": "string",
  "top_issues": [
    { "title": "string", "evidence": "string", "recommendation": "string" }
  ],
  "next_actions": ["string"]
}
`;

  return `${instructions}\n\n<FACTS>${JSON.stringify(facts)}</FACTS>`;
}

async function callOllama(prompt) {
  const base  = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3:8b-instruct';
  const body = { model, prompt: `${prompt}\n\n반드시 위 JSON 스키마에 맞는 JSON만 출력.`, stream:false };

  const res = await fetch(`${base}/api/generate`, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`ollama error ${res.status}`);
  const data = await res.json();           // { response: "..." }
  const json = tryParseJSON(data.response);
  if (!json) throw new Error('ollama: invalid JSON');
  return json;
}

exports.summarizeWeekly = async (payload) => {
  if (!ENABLED) throw new Error('summarizer disabled');
  const prompt = buildPrompt(payload);
  if (PROVIDER === 'ollama') return await callOllama(prompt);
  throw new Error(`unknown provider: ${PROVIDER}`);
};
