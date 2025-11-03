// back/src/services/aiRagIngestService.js
const { openai, MODELS } = require('../../config/openai');

function bufferToFloat32Array(buf) {
  const len = buf.length / 4;
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) arr[i] = buf.readFloatLE(i * 4);
  return arr;
}
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    dot += x * y; na += x*x; nb += y*y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
async function embedQuery(q) {
  const resp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: q,
  });
  return resp.data[0].embedding;
}

function rankByCosine(queryVec, embedRows, keywordBonusFn) {
    return embedRows.map(r => {
    const vec = bufferToFloat32Array(r.embedding);
    const score = cosineSim(queryVec, vec);
    const bonus = keywordBonusFn ? keywordBonusFn(r.id) : 0;
    return { id: r.id, score: score + bonus };
    }).sort((a,b) => b.score - a.score);
}

function packContext(contents, topIds, topK = 8) {
  const map = new Map(contents.map(c => [c.id, c]));
  const picked = [];
  for (const t of topIds.slice(0, topK)) {
    const c = map.get(t);
    if (c) picked.push(c);
  }
  // 모델 컨텍스트: 근거 블록을 구분자와 함께
  const blocks = picked.map((c, idx) => `### evidence_${idx+1} (id=${c.id})
${c.content}`).join('\n\n---\n\n');
  return { picked, blocks };
}

module.exports = {
  embedQuery,
  rankByCosine,
  packContext,
};
