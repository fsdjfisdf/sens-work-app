const { openai, MODELS } = require('../../config/openai');
const { fetchCandidateRows, readRowsByIds } = require('../dao/ragDao');

// 코사인 유사도
function cosine(a, b) {
  let dot=0, na=0, nb=0;
  const L = Math.min(a.length, b.length);
  for (let i=0;i<L;i++){ dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-9);
}

exports.ask = async (req, res) => {
  try {
    const { question, days=365, prefilterLimit=300, topK=20 } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question(text) is required' });
    }

    // 1) 질문 임베딩
    const qEmbRes = await openai.embeddings.create({
      model: MODELS.embedding,
      input: question
    });
    const qEmb = qEmbRes.data[0].embedding;

    // 2) 후보(키워드 프리필터) 조회
    const candidates = await fetchCandidateRows(question, days, prefilterLimit);

    // 3) 유사도 계산 & 상위 N
    for (const c of candidates) {
      const emb = JSON.parse(c.emb);
      c.sim = cosine(qEmb, emb);
    }
    candidates.sort((a,b)=>b.sim-a.sim);
    const top = candidates.slice(0, topK);

    // 4) 근거 행 상세 로딩
    const ids = top.map(r=>r.id);
    const evidences = await readRowsByIds(ids);

    // 5) LLM 요약 생성 (근거 강제 표기)
    const context = top.map(r => ({
      id: r.id,
      date: r.task_date,
      name: r.task_name,
      man: r.task_man,
      site: r.site,
      line: r.line,
      eq: r.equipment_type,
      desc: (r.task_description || '').replace(/\s+/g,' ').slice(0, 800),
      sim: Number(r.sim.toFixed(3))
    }));

    const sys = `너는 반도체 필드서비스 로그만을 근거로 한국어로 답한다.
- 추정/상상 금지. 근거가 부족하면 "근거 부족"이라고 말해라.
- 반드시 "근거(ID, 날짜, SITE-LINE, EQ)"를 항목으로 제시해라.
- 요청이 절차/체크리스트면 항목화하고, 원인/조치/결과/주의점을 구조적으로 요약하라.`;

    const userMsg = `질문: ${question}
다음은 유사도 Top${top.length} 로그(유사도 내림차순)이다. 이를 근거로 요약하라.
${JSON.stringify(context, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: MODELS.chat,
      temperature: 0.2,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg }
      ]
    });

    res.json({
      question,
      used: { days, prefilterLimit, topK, model: MODELS },
      evidence_preview: context,            // 프론트에서 토글로 보여주기 좋음
      answer: completion.choices[0].message.content
    });
  } catch (err) {
    console.error('RAG ask error:', err.message);
    res.status(500).json({ error: 'internal_error', detail: err.message });
  }
};
