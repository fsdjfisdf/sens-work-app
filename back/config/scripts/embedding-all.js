/* eslint-disable no-console */
// back/config/scripts/embedding-all.js
const crypto = require('crypto');
const pLimit = require('p-limit');
const { openai, MODELS } = require('../openai');
const { pool } = require('../database');

const CONCURRENCY = 3;      // 동시 OpenAI 호출
const BATCH_SIZE  = 200;    // 한 번에 스캔할 행 수

function sha1(s) {
  return crypto.createHash('sha1').update(s, 'utf8').digest('hex');
}
function float32ToBuffer(arr) {
  const buf = Buffer.allocUnsafe(arr.length * 4);
  for (let i = 0; i < arr.length; i++) buf.writeFloatLE(arr[i], i * 4);
  return buf;
}

async function fetchTotalCount(conn) {
  // rag_chunks 기준으로 스캔(뷰 계산 비용↓)
  const [r] = await conn.query(`
    SELECT COUNT(*) AS cnt
    FROM rag_chunks c
    JOIN v_rag_source s ON s.id = c.src_id
  `);
  return r[0].cnt;
}

async function fetchWindow(conn, offset, limit) {
  const [rows] = await conn.query(
    `
    SELECT
      c.id              AS chunk_id,     -- ✅ 청크ID
      s.content,
      SHA1(s.content)   AS new_hash,
      e.content_hash    AS prev_hash
    FROM rag_chunks c
    JOIN v_rag_source s ON s.id = c.src_id
    LEFT JOIN rag_embeddings e ON e.chunk_id = c.id
    ORDER BY c.id
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );
  return rows.filter(r => !r.prev_hash || r.prev_hash !== r.new_hash);
}

async function embedOne(conn, row) {
  const { chunk_id, content, new_hash } = row;
  const resp = await openai.embeddings.create({
    model: MODELS.embedding,
    input: content,
  });
  const vec = resp.data[0].embedding;
  const buf = float32ToBuffer(vec);

  await conn.query(
    `
    INSERT INTO rag_embeddings (chunk_id, dim, embedding, content_hash)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      dim = VALUES(dim),
      embedding = VALUES(embedding),
      content_hash = VALUES(content_hash),
      updated_at = CURRENT_TIMESTAMP
    `,
    [chunk_id, vec.length, buf, new_hash]
  );
}

(async function main(){
  const conn = await pool.getConnection();
  try{
    console.log('[embed] start');
    const total = await fetchTotalCount(conn);
    console.log('[embed] total rows in v_rag_source =', total);

    const limit = pLimit(CONCURRENCY);
    let offset = 0;
    let updated = 0;

    while(offset < total){
      const delta = await fetchWindow(conn, offset, BATCH_SIZE);
      if(delta.length){
        await Promise.all(delta.map(r => limit(() => embedOne(conn, r).then(() => { updated++; }))));
        console.log(`[embed] +${delta.length} updated (cum=${updated}) @offset=${offset}`);
      }else{
        console.log(`[embed] no changes @offset=${offset}`);
      }
      offset += BATCH_SIZE;
    }
    console.log('[embed] done. updated =', updated);
    process.exit(0);
  }catch(err){
    console.error('[embed] error', err);
    process.exit(1);
  }finally{
    conn.release();
  }
})();
