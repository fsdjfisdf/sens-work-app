// front/js/rag.js
(function () {
  /* ========== DOM helpers ========== */
  const $  = (s, r=document)=>r.querySelector(s);
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

  /* ========== Tiny toast ========== */
  function toast(msg, type='info'){
    let box = $('#__tiny_toast');
    if(!box){
      box = document.createElement('div');
      box.id='__tiny_toast';
      box.style.cssText = `
        position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
        background:#1f2937; color:#fff; padding:10px 14px; border-radius:12px;
        font-size:13px; box-shadow:0 8px 24px rgba(0,0,0,.18); z-index:9999; opacity:0;
        transition:opacity .18s ease;
      `;
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.background = type==='error' ? '#e64646' : (type==='ok' ? '#0f9d58' : '#1f2937');
    box.style.opacity = '0.98';
    setTimeout(()=> box.style.opacity='0', 1500);
  }

  /* ========== Markdown utils ========== */
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }

  function md(text=''){
    // 코드블록
    text = text.replace(/```([\s\S]*?)```/g, (_, code)=>`<pre><code>${escapeHtml(code)}</code></pre>`);
    // 제목/불릿
    text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // 굵게
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 문단
    text = text.split(/\n{2,}/).map(p=>`<p>${p}</p>`).join('\n');
    return text;
  }

  /* ========== Evidence helpers ========== */
  function formatDate(d){
    if(!d) return '';
    // 서버가 'YYYY-MM-DD' or 'YYYY-MM-DDT...' 를 줄 수 있음
    const s = String(d);
    if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    return s;
  }

  /* ========== History ========== */
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
      pill.onclick = ()=>{ els.q.value = q; autoGrow(els.q); els.q.focus(); };
      els.history.appendChild(pill);
    });
  }

  /* ========== UI state ========== */
  function setLoading(on, msg=''){
    els.ask.disabled = on;
    els.status.textContent = on ? (msg || '검색 중...') : (msg || '');
    if(on) { els.ask.dataset._label = els.ask.textContent; els.ask.textContent = '검색 중…'; }
    else if(els.ask.dataset._label){ els.ask.textContent = els.ask.dataset._label; }
  }

  /* ========== Evidence table render ========== */
  function renderEvidence(list){
    if(!list || !list.length){
      els.evidence.innerHTML = '<div class="hint">근거가 없습니다.</div>';
      return;
    }
    const rows = list.map(r=>{
      const siteLine = [r.site, r.line].filter(Boolean).join(' ');
      const eq       = r.eq || '';
      const desc     = r.desc || '';
      const name     = r.name || '';
      return `
        <tr>
          <td class="idcell">#${r.id}</td>
          <td>${formatDate(r.date) || ''}</td>
          <td>${escapeHtml(siteLine)}</td>
          <td>${escapeHtml(eq)}</td>
          <td class="sim">${(r.sim ?? 0).toFixed(3)}</td>
          <td class="desc">
            <div class="rowline">
              <span class="badge">${escapeHtml(name || 'WORK')}</span>
            </div>
            <div class="muted">${escapeHtml(desc)}</div>
          </td>
        </tr>
      `;
    }).join('');
    els.evidence.innerHTML = `
      <table>
        <thead>
          <tr><th>ID</th><th>날짜</th><th>SITE-LINE</th><th>장비</th><th>유사도</th><th>요약</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  /* ========== Autosize textarea & placeholder rotation ========== */
  function autoGrow(t){
    t.style.height = 'auto';
    // 최대 높이 제한 (행동을 막기 위함)
    const maxH = 280;
    t.style.height = Math.min(t.scrollHeight, maxH) + 'px';
  }

  const PLACEHOLDERS = [
    '예) HS 15L TM ROBOT COMM/REAL TIME Error 원인과 조치 요약해줘',
    '예) PT P2D EFEM Wafer Sensor Alarm 빈발 사례 모아서 알려줘',
    '예) EPAB310 Slow/Fast Valve 반복 이슈 해결 플레이북',
    '예) FCIP O-RING REP 평균 소요시간과 변동 범위',
    '예) GEN EVA L/L Door Cylinder 풀림 방지 작업 요약',
  ];
  let phIdx = 0;
  function rotatePlaceholder(){
    if(!els.q || document.activeElement === els.q) return; // 입력 중이면 변경 X
    phIdx = (phIdx + 1) % PLACEHOLDERS.length;
    els.q.setAttribute('placeholder', PLACEHOLDERS[phIdx]);
  }
  setInterval(rotatePlaceholder, 5000);

  /* ========== Core ask ========== */
  async function ask(){
    const question = els.q.value.trim();
    if(!question){ els.q.focus(); toast('질문을 입력해 주세요.', 'error'); return; }

    const body = {
      question,
      days: Number(els.days?.value || 365),
      prefilterLimit: Number(els.pref?.value || 300),
      topK: Number(els.topk?.value || 20),
      filters: {} // 필요 시 { site, line, equipment_type } 셋업
    };

    setLoading(true, '유사 로그 검색 및 요약 생성 중…');

    try{
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

      // Chips
      els.chipDays.textContent = `기간 ${body.days}일`;
      els.chipTopk.textContent = `Top-K ${body.topK}`;
      els.chipPref.textContent = `프리필터 ${body.prefilterLimit}`;
      const modelStr = data?.used?.model ? `${data.used.model.chat} / ${data.used.model.embedding}` : '모델 정보 없음';
      els.chipModel.textContent = modelStr;

      // Answer & Evidence
      els.answer.innerHTML = md(data.answer || '응답 없음');
      renderEvidence(data.evidence_preview || []);
      els.resultCard.classList.remove('hidden');
      els.evidenceWrap.open = false;

      saveHistory(question);
      toast('완료', 'ok');
      setLoading(false, '');
    }catch(err){
      console.error(err);
      setLoading(false, '');
      toast('오류: ' + err.message, 'error');
      els.status.textContent = '오류: ' + err.message;
    }
  }

  /* ========== Wire events ========== */
  // 버튼
  els.ask.addEventListener('click', ask);
  els.clear.addEventListener('click', ()=>{
    els.q.value = '';
    autoGrow(els.q);
    els.status.textContent = '';
    els.resultCard.classList.add('hidden');
    toast('입력을 지웠습니다.');
  });
  els.clearHistory.addEventListener('click', ()=>{
    localStorage.removeItem(HS_KEY);
    renderHistory();
    toast('최근 질문을 비웠습니다.');
  });

  // 예시 프리셋
  $$('.btn.ghost[data-preset]').forEach(b=>{
    b.addEventListener('click', ()=>{
      els.q.value = b.getAttribute('data-preset') || '';
      autoGrow(els.q);
      els.q.focus();
    });
  });

  // 입력 UX: 자동 높이/단축키
  if(els.q){
    // 초기 placeholder
    els.q.setAttribute('placeholder', PLACEHOLDERS[0]);
    els.q.addEventListener('input', ()=> autoGrow(els.q));
    autoGrow(els.q);

    // Ctrl/Cmd + Enter 전송, Shift+Enter 줄바꿈
    els.q.addEventListener('keydown', (e)=>{
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
        e.preventDefault();
        ask();
      }
    });

    // 페이지 로드시 포커스
    setTimeout(()=> els.q.focus(), 80);
  }

  renderHistory();
})();
