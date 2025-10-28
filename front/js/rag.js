// front/js/rag.js
(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    /* ========== DOM helpers ========== */
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

    // 안전하게 요소 가져오기 (없으면 생성해서 붙임)
    function need(sel, creator){
      let el = $(sel);
      if(!el && typeof creator === 'function'){
        el = creator();
      }
      return el;
    }

    /* ========== 잡을 요소들 ========== */
    const els = {
      q: need('#question'),
      days: $('#days'),
      pref: $('#prefilterLimit'),
      topk: $('#topK'),
      ask: $('#btn-ask'),
      clear: $('#btn-clear'),
      status: need('#status', ()=>{
        const d = document.createElement('div');
        d.id = 'status';
        (need('main')||document.body).appendChild(d);
        return d;
      }),
      resultCard: need('#result-card', ()=>{
        const s = document.createElement('section');
        s.id = 'result-card';
        s.className = 'card';
        (need('main')||document.body).appendChild(s);
        return s;
      }),
      answer: need('#answer', ()=>{
        const a = document.createElement('article');
        a.id = 'answer';
        a.className = 'answer markdown';
        need('#result-card').appendChild(a);
        return a;
      }),
      chipDays: need('#chip-days', ()=>{
        const span = document.createElement('span');
        span.id = 'chip-days';
        span.className = 'chip';
        addChips(span);
        return span;
      }),
      chipTopk: need('#chip-topk', ()=>{
        const span = document.createElement('span');
        span.id = 'chip-topk';
        span.className = 'chip';
        addChips(span);
        return span;
      }),
      chipPref: need('#chip-pref', ()=>{
        const span = document.createElement('span');
        span.id = 'chip-pref';
        span.className = 'chip';
        addChips(span);
        return span;
      }),
      chipModel: need('#chip-model', ()=>{
        const span = document.createElement('span');
        span.id = 'chip-model';
        span.className = 'chip';
        addChips(span);
        return span;
      }),
      evidenceWrap: need('#evidence-wrap', ()=>{
        const det = document.createElement('details');
        det.id = 'evidence-wrap';
        det.className = 'evidence';
        det.innerHTML = '<summary>근거 보기 (Top-K)</summary><div id="evidence"></div>';
        need('#result-card').appendChild(det);
        return det;
      }),
      evidence: need('#evidence', ()=>{
        const d = document.createElement('div');
        d.id = 'evidence';
        need('#evidence-wrap').appendChild(d);
        return d;
      }),
      history: need('#history', ()=>{
        const d = document.createElement('div');
        d.id = 'history';
        (need('main')||document.body).appendChild(d);
        return d;
      }),
      clearHistory: $('#btn-clear-history')
    };

    function addChips(span){
      let chips = $('#result-card .chips');
      if(!chips){
        const head = document.createElement('div');
        head.className = 'card-head row';
        head.innerHTML = '<h2>요약 결과</h2><div class="chips"></div>';
        els.resultCard.insertBefore(head, els.resultCard.firstChild);
        chips = head.querySelector('.chips');
      }
      chips.appendChild(span);
    }

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
      if(!els.history) return;
      const arr = loadHistory();
      els.history.innerHTML = '';
      arr.forEach(q=>{
        const pill = document.createElement('button');
        pill.className = 'pill';
        pill.textContent = q;
        pill.title = q;
        pill.onclick = ()=>{ if(els.q){ els.q.value = q; autoGrow(els.q); els.q.focus(); } };
        els.history.appendChild(pill);
      });
    }

    /* ========== “챗GPT-스러운” 미니 연출 ========== */
    function addUserBubble(text){
      if(!els.answer) return;
      const wrap = document.createElement('div');
      wrap.className = 'bubble user';
      wrap.innerHTML = `<div class="bubble-hd">나</div><div class="bubble-bd">${escapeHtml(text)}</div>`;
      els.answer.appendChild(wrap);
      els.resultCard.classList.remove('hidden');
      els.answer.scrollTop = els.answer.scrollHeight;
    }
    function addAssistantSkeleton(){
      if(!els.answer) return ()=>{};
      const wrap = document.createElement('div');
      wrap.className = 'bubble ai skeleton';
      wrap.innerHTML = `
        <div class="bubble-hd">요약</div>
        <div class="bubble-bd">
          <div class="sk-line" style="width:82%"></div>
          <div class="sk-line" style="width:94%"></div>
          <div class="sk-line" style="width:76%"></div>
        </div>
      `;
      els.answer.appendChild(wrap);
      els.resultCard.classList.remove('hidden');
      els.answer.scrollTop = els.answer.scrollHeight;
      return ()=>{ wrap.remove(); };
    }
    function addAssistantBubble(html){
      if(!els.answer) return;
      const wrap = document.createElement('div');
      wrap.className = 'bubble ai';
      wrap.innerHTML = `<div class="bubble-hd">요약</div><div class="bubble-bd">${html}</div>`;
      els.answer.appendChild(wrap);
      els.resultCard.classList.remove('hidden');
      els.answer.scrollTop = els.answer.scrollHeight;
    }

    /* ========== UI state ========== */
    function setLoading(on){
      if(els.ask){
        els.ask.disabled = on;
        if(on) { els.ask.dataset._label = els.ask.textContent; els.ask.textContent = '검색 중…'; }
        else if(els.ask.dataset._label){ els.ask.textContent = els.ask.dataset._label; }
      }
      if(els.status){
        els.status.textContent = on ? '유사 로그 검색 및 요약 생성 중…' : '';
      }
    }

    /* ========== Evidence table render ========== */
    function renderEvidence(list){
      if(!els.evidence) return;
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
      if(!t) return;
      t.style.height = 'auto';
      const maxH = 280;
      t.style.height = Math.min(t.scrollHeight, maxH) + 'px';
    }

    const PLACEHOLDERS = [
      '예) HS 15L TM ROBOT COMM/REAL TIME Error 원인과 조치 요약',
      '예) PT P2D EFEM Wafer Sensor Alarm 빈발 사례 모아줘',
      '예) EPAB310 Slow/Fast Valve 반복 이슈 해결 플레이북',
      '예) FCIP O-RING REP 평균 소요시간과 변동 범위',
      '예) GEN EVA L/L Door Cylinder 풀림 방지 작업 요약',
    ];
    let phIdx = 0;
    function rotatePlaceholder(){
      if(!els.q || document.activeElement === els.q) return;
      phIdx = (phIdx + 1) % PLACEHOLDERS.length;
      els.q.setAttribute('placeholder', PLACEHOLDERS[phIdx]);
    }
    setInterval(rotatePlaceholder, 5000);

    /* ========== Core ask ========== */
    async function ask(){
      if(!els.answer){ toast('결과 영역이 없습니다. HTML을 확인하세요.', 'error'); return; }

      const question = (els.q && els.q.value || '').trim();
      if(!question){ if(els.q) els.q.focus(); toast('질문을 입력해 주세요.', 'error'); return; }

      // 대화 버블: 사용자
      addUserBubble(question);

      const body = {
        question,
        days: Number(els.days?.value || 365),
        prefilterLimit: Number(els.pref?.value || 300),
        topK: Number(els.topk?.value || 20),
        filters: {}
      };

      setLoading(true);
      const removeSkel = addAssistantSkeleton();

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
        if(els.chipDays) els.chipDays.textContent = `기간 ${body.days}일`;
        if(els.chipTopk) els.chipTopk.textContent = `Top-K ${body.topK}`;
        if(els.chipPref) els.chipPref.textContent = `프리필터 ${body.prefilterLimit}`;
        const modelStr = data?.used?.model ? `${data.used.model.chat} / ${data.used.model.embedding}` : '모델 정보 없음';
        if(els.chipModel) els.chipModel.textContent = modelStr;

        // Answer & Evidence (버블로 교체)
        removeSkel();
        addAssistantBubble(md(data.answer || '응답 없음'));
        renderEvidence(data.evidence_preview || []);
        els.resultCard.classList.remove('hidden');
        if(els.evidenceWrap) els.evidenceWrap.open = false;

        saveHistory(question);
        toast('완료', 'ok');
      }catch(err){
        console.error(err);
        removeSkel();
        addAssistantBubble(md('오류가 발생했습니다:\n- ' + String(err.message||err)));
        toast('오류: ' + err.message, 'error');
        if(els.status) els.status.textContent = '오류: ' + err.message;
      }finally{
        setLoading(false);
      }
    }

    /* ========== Wire events ========== */
    if(els.ask) els.ask.addEventListener('click', ask);
    if(els.clear) els.clear.addEventListener('click', ()=>{
      if(els.q){ els.q.value = ''; autoGrow(els.q); }
      if(els.status) els.status.textContent = '';
      if(els.resultCard) els.resultCard.classList.add('hidden');
      if(els.answer) els.answer.innerHTML = '';  // 대화 버블 초기화
      toast('입력을 지웠습니다.');
    });
    if(els.clearHistory) els.clearHistory.addEventListener('click', ()=>{
      localStorage.removeItem(HS_KEY);
      renderHistory();
      toast('최근 질문을 비웠습니다.');
    });

    // 예시 프리셋
    $$('.btn.ghost[data-preset]').forEach(b=>{
      b.addEventListener('click', ()=>{
        if(!els.q) return;
        els.q.value = b.getAttribute('data-preset') || '';
        autoGrow(els.q);
        els.q.focus();
      });
    });

    // 입력 UX: 자동 높이/단축키
    if(els.q){
      els.q.setAttribute('placeholder', PLACEHOLDERS[0]);
      els.q.addEventListener('input', ()=> autoGrow(els.q));
      autoGrow(els.q);
      els.q.addEventListener('keydown', (e)=>{
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
          e.preventDefault();
          ask();
        }
      });
      setTimeout(()=> els.q && els.q.focus(), 80);
    }

    renderHistory();
  }
})();
