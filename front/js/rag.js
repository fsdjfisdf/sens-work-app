// front/js/rag.js
(function () {
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  // ===== Elements =====
  const els = {
    chat: $('#chat'),
    q: $('#question'),
    ask: $('#btn-ask'),
    clear: $('#btn-clear'),
    newChat: $('#btn-new-chat'),
    status: $('#status'),
    days: $('#days'),
    pref: $('#prefilterLimit'),
    topk: $('#topK'),
    chipDays: $('#chip-days'),
    chipTopk: $('#chip-topk'),
    chipPref: $('#chip-pref'),
    chipModel: $('#chip-model'),
    history: $('#history'),
    clearHistory: $('#btn-clear-history'),
  };

  // ===== Helpers =====
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }

  function md(text=''){
    text = text.replace(/```([\s\S]*?)```/g, (_, code)=>`<pre><code>${escapeHtml(code)}</code></pre>`);
    text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    text = text.split(/\n{2,}/).map(p=>`<p>${p}</p>`).join('\n');
    return text;
  }

  function setLoading(on, msg=''){
    els.ask.disabled = on;
    els.status.textContent = on ? (msg || '검색 중...') : '';
  }

  function autoResizeTextarea(t){
    t.style.height = 'auto';
    t.style.height = Math.min(180, t.scrollHeight) + 'px';
  }

  // ===== Local history =====
  const HS_KEY = 'RAG_RECENT_QUESTIONS';
  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(HS_KEY)||'[]'); } catch { return [] }
  }
  function saveHistory(q){
    if(!q) return;
    const arr = loadHistory().filter(x=>x!==q);
    arr.unshift(q);
    localStorage.setItem(HS_KEY, JSON.stringify(arr.slice(0,30)));
    renderHistory();
  }
  function renderHistory(){
    const arr = loadHistory();
    els.history.innerHTML = '';
    if(!arr.length){
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = '<span class="title">기록이 없습니다</span><span class="sub">메시지를 보내 시작해보세요</span>';
      els.history.appendChild(div);
      return;
    }
    arr.forEach(q=>{
      const item = document.createElement('button');
      item.className = 'history-item';
      item.innerHTML = `<span class="title">${escapeHtml(q)}</span><span class="sub">클릭하여 입력칸에 불러오기</span>`;
      item.onclick = ()=>{ els.q.value = q; autoResizeTextarea(els.q); els.q.focus(); };
      els.history.appendChild(item);
    });
  }

  // ===== Chat rendering =====
  function makeMsg({role, html, meta, evidence}) {
    const row = document.createElement('div');
    row.className = 'msg';

    const avatar = document.createElement('div');
    avatar.className = 'avatar ' + (role==='user' ? 'user' : 'assistant');
    avatar.textContent = role==='user' ? 'U' : 'A';

    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + (role==='user' ? 'user' : 'assistant');

    if (meta) {
      const m = document.createElement('div');
      m.className = 'meta';
      m.innerHTML = meta;
      bubble.appendChild(m);
    }

    const body = document.createElement('div');
    body.className = 'markdown';
    body.innerHTML = html || '';
    bubble.appendChild(body);

    if (evidence && evidence.length) {
      const ev = document.createElement('div');
      ev.className = 'evidence';
      ev.innerHTML = buildEvidenceTable(evidence);
      bubble.appendChild(ev);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    return row;
  }

  function buildEvidenceTable(list){
    if(!list || !list.length){ return ''; }
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
    return `
      <details open>
        <summary>근거 (Top-K)</summary>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>날짜</th><th>SITE-LINE</th><th>장비</th><th>유사도</th><th>요약</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>
    `;
  }

  function scrollToBottom(){
    requestAnimationFrame(()=>{ els.chat.scrollTop = els.chat.scrollHeight; });
  }

  // ===== Send / Ask =====
  async function ask(){
    const question = (els.q.value || '').trim();
    if(!question){ els.q.focus(); return; }

    // 카드 상단 칩 업데이트
    els.chipDays.textContent = `기간 ${Number(els.days.value||365)}일`;
    els.chipTopk.textContent = `Top-K ${Number(els.topk.value||20)}`;
    els.chipPref.textContent = `프리필터 ${Number(els.pref.value||300)}`;

    // 1) 유저 버블 추가
    els.chat.appendChild(makeMsg({
      role: 'user',
      html: escapeHtml(question)
    }));
    scrollToBottom();

    // 2) 어시스턴트 placeholder (타이핑)
    const placeholder = makeMsg({
      role: 'assistant',
      html: '<em>분석 중…</em>'
    });
    els.chat.appendChild(placeholder);
    scrollToBottom();

    els.q.value = '';
    autoResizeTextarea(els.q);
    setLoading(true, '검색 및 요약 생성 중…');

    try{
      const body = {
        question,
        days: Number(els.days.value||365),
        prefilterLimit: Number(els.pref.value||300),
        topK: Number(els.topk.value||20),
        // filters는 필요 시 확장
      };

      const headers = { 'Content-Type': 'application/json' };
      const res = await fetch('/api/rag/ask', {
        method:'POST',
        headers,
        body: JSON.stringify(body)
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        throw new Error(`HTTP ${res.status} - JSON 파싱 실패. 응답 미리보기: ${raw.slice(0,200)}`);
      }
      if(!res.ok) throw new Error(data?.detail || data?.error || ('HTTP '+res.status));

      // 칩 모델 업데이트
      const modelStr = data?.used?.model ? `${data.used.model.chat} / ${data.used.model.embedding}` : '모델 정보 없음';
      els.chipModel.textContent = `모델: ${modelStr}`;

      // placeholder 교체
      const ansHtml = md(data.answer || '응답 없음');
      const evidence = data.evidence_preview || [];

      placeholder.replaceWith(makeMsg({
        role:'assistant',
        html: ansHtml,
        meta: '',
        evidence
      }));
      scrollToBottom();

      saveHistory(question);
      setLoading(false, '완료');
      setTimeout(()=>setLoading(false,''), 900);
    }catch(err){
      console.error(err);
      placeholder.replaceWith(makeMsg({
        role:'assistant',
        html:`<span style="color:#e64646">오류:</span> ${escapeHtml(err.message||String(err))}`
      }));
      setLoading(false, '오류');
    }
  }

  // ===== Events =====
  els.ask.addEventListener('click', ask);
  els.clear.addEventListener('click', ()=>{
    els.chat.innerHTML = '';
    els.status.textContent = '';
  });
  els.newChat.addEventListener('click', ()=>{
    els.chat.innerHTML = '';
    els.q.value = '';
    autoResizeTextarea(els.q);
    els.q.focus();
  });
  els.clearHistory.addEventListener('click', ()=>{
    localStorage.removeItem(HS_KEY);
    renderHistory();
  });
  els.q.addEventListener('input', ()=>autoResizeTextarea(els.q));

  // Enter to send (Shift+Enter newline)
  els.q.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      ask();
    }
  });

  // ===== Boot =====
  renderHistory();
  autoResizeTextarea(els.q);
})();
