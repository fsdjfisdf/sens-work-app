// back/src/services/aiRagIngestService.js
const { openai, MODELS } = require('../../config/openai');

function decodeEmbedding(any, expectedDim = 1536) {
  // 1) 이미 배열인 경우
  if (Array.isArray(any)) return Float32Array.from(any);

  // 2) 버퍼인 경우
  if (Buffer.isBuffer(any)) {
    // 2-1) 길이가 4바이트 배수면 바이너리(Float32)로 가정
    if (any.length % 4 === 0 && any.length > 0) {
      const len = any.length / 4;
      const arr = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = any.readFloatLE(i * 4);
      }
      return arr;
    }
    // 2-2) 4바이트 배수가 아니면 → UTF-8로 JSON 파싱 시도
    const s = any.toString('utf8').trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        return Float32Array.from(parsed);
      } catch (e) {
        // fallthrough
      }
    }
  }

  // 3) 문자열인 경우(JSON)
  if (typeof any === 'string') {
    const s = any.trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        return Float32Array.from(parsed);
      } catch (e) { /* ignore */ }
    }
  }

  // 4) 실패 시 빈 벡터 반환(랭킹에서 자동 필터)
  return new Float32Array(expectedDim).fill(0);
}

function cosineSim(a, b) {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
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
  const expectedDim = queryVec.length || 1536;

  // decode + 안전 필터
  const scored = [];
  for (const r of embedRows) {
    const vec = decodeEmbedding(r.embedding, expectedDim);
    // 길이/NaN 보호
    if (!vec || !vec.length) continue;
    const score = cosineSim(queryVec, vec);
    if (!Number.isFinite(score)) continue;

    const bonus = keywordBonusFn ? Number(keywordBonusFn(r.id) || 0) : 0;
    scored.push({ id: r.id, score: score + bonus });
  }

  // 점수 높은 순으로 정렬
  scored.sort((a,b)=> b.score - a.score);
  return scored;
}

function packContext(contents, topIds, topK = 8) {
  const map = new Map(contents.map(c => [c.id, c]));
  const picked = [];
  for (const t of topIds.slice(0, topK)) {
    const c = map.get(t);
    if (c) picked.push(c);
  }
  const blocks = picked.map((c, idx) => `### evidence_${idx+1} (id=${c.id})
${c.content}`).join('\n\n---\n\n');
  return { picked, blocks };
}

module.exports = {
  embedQuery,
  rankByCosine,
  packContext,
};
