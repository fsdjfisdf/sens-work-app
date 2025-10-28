// front/js/rag.js
(function () {
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  const els = {
    q: $('#question'),
    days: $('#days'),
    pref: $('#prefilterLimit'),
    topk: $('#topK'),
    ask: $('#btn-ask'),
    clear: $('#btn-clear'),
    status: $('#status'),
    resultCard: $('#result-card'),
    answer: $('#answer'),
    chipDays: $('#chip-days'),
    chipTopk: $('#chip-topk'),
    chipPref: $('#chip-pref'),
    chipModel: $('#chip-model'),
    evidenceWrap: $('#evidence-wrap'),
    evidence: $('#evidence'),
    history: $('#history'),
    clearHistory: $('#btn-clear-history')
  };

  function md(text=''){
    text = text.replace(/```([\s\S]*?)```/g, (_, code)=>`<pre><code>${escapeHtml(code)}</code></pre>`);
    text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    text = text.split(/\n{2,}/).map(p=>`<p>${p}</p>`).join('\n');
    return text;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }

  function setLoading(on, msg=''){
    els.ask.disabled = on;
    els.status.textContent = on ? (msg || '검색 중...') : (msg || '');
  }

  const HS_KEY = 'RAG_RECENT_QUESTIONS';
  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(HS_KEY)||'[]'); } catch { return [] }
  }
  function saveHistory(q){
    if(!q) return;
    const arr = loadHistory().filter(x=>x!==q);
    arr.unshift(q);
    localStorage.setItem(HS_KEY, JSON.stringify(arr.slice(0,12)));
    renderHistory();
  }
  function renderHistory(){
    const arr = loadHistory();
    els.history.innerHTML = '';
    arr.forEach(q=>{
      const pill = document.createElement('button');
      pill.className = 'pill';
      pill.textContent = q;
      pill.title = q;
      pill.onclick = ()=>{ els.q.value = q; };
      els.history.appendChild(pill);
    });
  }

  function renderEvidence(list){
    if(!list || !list.length){ els.evidence.innerHTML = '<div class="hint">근거가 없습니다.</div>'; return; }
    const rows = list.map(r=>`
      <tr>
        <td class="idcell">#${r.id}</td>
        <td>${r.date || ''}</td>
        <td>${escapeHtml([r.site, r.line].filter(Boolean).join(' '))}</td>
        <td>${escapeHtml(r.eq || '')}</td>
        <td class="sim">${(r.sim ?? 0).toFixed(3)}</td>
        <td class="desc">${escapeHtml(r.name || '')}<br><span class="muted">${escapeHtml(r.desc || '')}</span></td>
      </tr>
    `).join('');
    els.evidence.innerHTML = `
      <table>
        <thead>
          <tr><th>ID</th><th>날짜</th><th>SITE-LINE</th><th>장비</th><th>유사도</th><th>요약</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  async function ask(){
    const question = els.q.value.trim();
    if(!question){ els.q.focus(); return; }

    const body = {
      question,
      days: Number(els.days.value||365),
      prefilterLimit: Number(els.pref.value||300),
      topK: Number(els.topk.value||20)
    };

    setLoading(true, '유사 로그 검색 및 요약 생성 중…');

    try{
      const headers = { 'Content-Type': 'application/json' };
      const res = await fetch('/api/rag/ask', {
        method:'POST',
        headers,
        body: JSON.stringify(body)
      });

      // 항상 텍스트로 읽은 뒤 JSON 시도
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        throw new Error(`HTTP ${res.status} - JSON 파싱 실패. 응답 미리보기: ${raw.slice(0,200)}`);
      }

      if(!res.ok) throw new Error(data?.detail || data?.error || ('HTTP '+res.status));

      els.chipDays.textContent = `기간 ${body.days}일`;
      els.chipTopk.textContent = `Top-K ${body.topK}`;
      els.chipPref.textContent = `프리필터 ${body.prefilterLimit}`;
      const modelStr = data?.used?.model ? `${data.used.model.chat} / ${data.used.model.embedding}` : '모델 정보 없음';
      els.chipModel.textContent = modelStr;

      els.answer.innerHTML = md(data.answer || '응답 없음');
      renderEvidence(data.evidence_preview || []);
      els.resultCard.classList.remove('hidden');
      els.evidenceWrap.open = false;

      saveHistory(question);
      setLoading(false, '완료');
      setTimeout(()=>setLoading(false,''), 1200);
    }catch(err){
      console.error(err);
      setLoading(false, '오류: ' + err.message);
    }
  }

  els.ask.addEventListener('click', ask);
  els.clear.addEventListener('click', ()=>{
    els.q.value = '';
    els.status.textContent = '';
    els.resultCard.classList.add('hidden');
  });
  els.clearHistory.addEventListener('click', ()=>{
    localStorage.removeItem(HS_KEY);
    renderHistory();
  });
  $$('.btn.ghost[data-preset]').forEach(b=>{
    b.addEventListener('click', ()=>{
      els.q.value = b.getAttribute('data-preset') || '';
      els.q.focus();
    });
  });

  renderHistory();
})();
