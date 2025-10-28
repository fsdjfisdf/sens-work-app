// RAG 프런트 스크립트
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

  // 간단한 마크다운 최소 렌더(리스트/헤딩/코드블록 정도만)
  function md(text=''){
    // 코드블록
    text = text.replace(/```([\s\S]*?)```/g, (_, code)=>`<pre><code>${escapeHtml(code)}</code></pre>`);
    // 헤딩
    text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    // 불릿
    text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // 줄바꿈->p
    text = text.split(/\n{2,}/).map(p=>`<p>${p}</p>`).join('\n');
    return text;
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }

  // 로딩 표시
  function setLoading(on, msg=''){
    els.ask.disabled = on;
    els.status.textContent = on ? (msg || '검색 중...') : (msg || '');
  }

  // 최근 질문 저장/로드
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

  // 근거 테이블 렌더
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

  // 호출
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
      // JWT 필요해지면 주석 해제
      // const token = localStorage.getItem('ACCESS_TOKEN');
      // if(token) headers['x-access-token'] = token;

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

      // 상단 칩
      els.chipDays.textContent = `기간 ${body.days}일`;
      els.chipTopk.textContent = `Top-K ${body.topK}`;
      els.chipPref.textContent = `프리필터 ${body.prefilterLimit}`;
      const modelStr = data?.used?.model ? `${data.used.model.chat} / ${data.used.model.embedding}` : '모델 정보 없음';
      els.chipModel.textContent = modelStr;

      // 답변/근거
      els.answer.innerHTML = md(data.answer || '응답 없음');
      renderEvidence(data.evidence_preview || []);
      els.resultCard.classList.remove('hidden');
      els.evidenceWrap.open = false; // 기본 닫힘

      saveHistory(question);
      setLoading(false, '완료');
      setTimeout(()=>setLoading(false,''), 1200);
    }catch(err){
      console.error(err);
      setLoading(false, '오류: ' + err.message);
    }
  }

  // 이벤트 바인딩
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

  // 초기
  renderHistory();
})();
