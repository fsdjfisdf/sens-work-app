// front/js/rag.js
(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    /* ===== DOM helpers ===== */
    const $  = (s, r=document)=>r.querySelector(s);
    const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

    /* ===== Elements ===== */
    const els = {
      chat: $('#chat'),
      q: $('#question'),
      ask: $('#btn-ask'),
      clear: $('#btn-clear'),
      status: $('#status'),

      // sidebar controls
      days: $('#days'),
      pref: $('#prefilterLimit'),
      topk: $('#topK'),
      newChat: $('#btn-new-chat'),
      history: $('#history'),
      clearHistory: $('#btn-clear-history'),

      // chips
      chipModel: $('#chip-model'),
      chipDays: $('#chip-days'),
      chipPref: $('#chip-pref'),
      chipTopk: $('#chip-topk'),
    };

    /* ===== App State ===== */
    const STATE = {
      lastQuestion: '',
      lastAnswerHtml: '',
      lastEvidence: [],
      evidenceView: {
        sortBy: 'sim', // 'sim' | 'date' | 'site' | 'eq'
        sortDir: 'desc', // 'asc' | 'desc'
        query: '',
        compact: false,
      },
      filters: {
        site: null,
        line: null,
        equipment_type: null,
      }
    };

    /* ===== Utils ===== */
    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])) }
    function md(text=''){
      text = text.replace(/```([\s\S]*?)```/g, (_, code)=>`<pre><code>${escapeHtml(code)}</code></pre>`);
      text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
      text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
      text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.split(/\n{2,}/).map(p=>`<p>${p}</p>`).join('\n');
      return text;
    }
    function formatDate(d){
      if(!d) return '';
      const s = String(d);
      if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      return s;
    }
    function toast(msg, type='info'){
      let box = document.getElementById('__tiny_toast');
      if(!box){
        box = document.createElement('div');
        box.id='__tiny_toast';
        box.style.cssText = `
          position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
          background:#111418; color:#fff; padding:10px 14px; border-radius:12px;
          font-size:13px; box-shadow:0 8px 24px rgba(0,0,0,.18); z-index:9999; opacity:0;
          transition:opacity .18s ease;
        `;
        document.body.appendChild(box);
      }
      box.textContent = msg;
      box.style.background = type==='error' ? '#e64646' : (type==='ok' ? '#0f9d58' : '#111418');
      box.style.opacity = '0.98';
      setTimeout(()=> box.style.opacity='0', 1500);
    }

    /* ===== History ===== */
    const HS_KEY = 'RAG_RECENT_QUESTIONS_V2';
    function loadHistory(){
      try { return JSON.parse(localStorage.getItem(HS_KEY)||'[]'); } catch { return [] }
    }
    function addHistory(q){
      const arr = loadHistory().filter(x=>x!==q);
      arr.unshift(q);
      localStorage.setItem(HS_KEY, JSON.stringify(arr.slice(0,30)));
      renderHistory();
    }
    function renderHistory(){
      if(!els.history) return;
      const arr = loadHistory();
      els.history.innerHTML = '';
      if(!arr.length){
        els.history.innerHTML = `<div class="small muted">아직 기록이 없습니다.</div>`;
        return;
      }
      arr.forEach(q=>{
        const b = document.createElement('button');
        b.className = 'history-item';
        b.innerHTML = `<span class="title">${escapeHtml(q)}</span><span class="sub">질문 불러오기</span>`;
        b.onclick = ()=>{ els.q.value = q; autoGrow(els.q); els.q.focus(); };
        els.history.appendChild(b);
      });
    }

    /* ===== Chat Bubbles ===== */
    function addMsg(role, html, opts={}){
      const wrap = document.createElement('div');
      wrap.className = 'msg';

      const avatar = document.createElement('div');
      avatar.className = 'avatar ' + (role==='user' ? 'user' : 'assistant');
      avatar.textContent = role==='user' ? '나' : 'AI';

      const bubble = document.createElement('div');
      bubble.className = 'bubble ' + (role==='user' ? 'user' : 'assistant');

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = opts.meta || (role==='user' ? '사용자' : '요약');

      const body = document.createElement('div');
      body.className = 'markdown';
      body.innerHTML = html;

      bubble.appendChild(meta);
      bubble.appendChild(body);

      // evidence block (assistant only)
      if (role !== 'user' && opts.evidence && Array.isArray(opts.evidence)) {
        const ev = renderEvidenceBlock(opts.evidence);
        bubble.appendChild(ev);
      }

      wrap.appendChild(avatar);
      wrap.appendChild(bubble);
      els.chat.appendChild(wrap);
      els.chat.scrollTop = els.chat.scrollHeight;
      return {wrap, bubble};
    }

    function addSkeleton(){
      const wrap = document.createElement('div');
      wrap.className = 'msg';
      wrap.innerHTML = `
        <div class="avatar assistant">AI</div>
        <div class="bubble assistant">
          <div class="meta">요약</div>
          <div class="markdown">
            <div class="sk-line" style="width:82%"></div>
            <div class="sk-line" style="width:94%"></div>
            <div class="sk-line" style="width:76%"></div>
          </div>
        </div>
      `;
      els.chat.appendChild(wrap);
      els.chat.scrollTop = els.chat.scrollHeight;
      return ()=>wrap.remove();
    }

    /* ===== Evidence UI ===== */
    function renderEvidenceBlock(list){
      STATE.lastEvidence = Array.isArray(list) ? list.slice() : [];

      const wrap = document.createElement('div');
      wrap.className = 'evidence';

      // Controls
      const controls = document.createElement('div');
      controls.className = 'evi-controls';
      controls.innerHTML = `
        <div class="left">
          <input class="evi-search" type="search" placeholder="근거 검색 (site/line/장비/요약)" />
          <select class="evi-sort">
            <option value="sim:desc">정렬: 유사도 ⬇</option>
            <option value="sim:asc">정렬: 유사도 ⬆</option>
            <option value="date:desc">정렬: 날짜 ⬇</option>
            <option value="date:asc">정렬: 날짜 ⬆</option>
            <option value="site:asc">정렬: SITE ⬆</option>
            <option value="site:desc">정렬: SITE ⬇</option>
            <option value="eq:asc">정렬: 장비 ⬆</option>
            <option value="eq:desc">정렬: 장비 ⬇</option>
          </select>
          <label class="evi-compact"><input type="checkbox" /> 컴팩트 보기</label>
        </div>
        <div class="right">
          <button class="btn mini" data-act="csv">CSV</button>
          <button class="btn mini" data-act="copy">표 복사</button>
          <button class="btn mini ghost" data-act="clear-filter">필터 해제</button>
        </div>
      `;
      wrap.appendChild(controls);

      // Table
      const tableWrap = document.createElement('div');
      tableWrap.className = 'table-wrap';
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr>
            <th>ID</th>
            <th>날짜</th>
            <th>SITE-LINE</th>
            <th>장비</th>
            <th class="t-right">유사도</th>
            <th>요약/상세</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      tableWrap.appendChild(table);
      wrap.appendChild(tableWrap);

      const searchInput = controls.querySelector('.evi-search');
      const sortSelect  = controls.querySelector('.evi-sort');
      const compactChk  = controls.querySelector('.evi-compact input');

      // 초기값
      sortSelect.value = `${STATE.evidenceView.sortBy}:${STATE.evidenceView.sortDir}`;
      compactChk.checked = !!STATE.evidenceView.compact;
      if (STATE.evidenceView.query) searchInput.value = STATE.evidenceView.query;
      if (compactChk.checked) table.classList.add('compact');

      // 렌더러
      function filteredSorted(){
        const q = (searchInput.value||'').trim().toLowerCase();
        STATE.evidenceView.query = q;

        let rows = STATE.lastEvidence.map(r=>({...r}));
        if(q){
          rows = rows.filter(r=>{
            const siteLine = [r.site, r.line].filter(Boolean).join(' ').toLowerCase();
            const eq = (r.eq||'').toLowerCase();
            const name = (r.name||'').toLowerCase();
            const desc = (r.desc||'').toLowerCase();
            return siteLine.includes(q) || eq.includes(q) || name.includes(q) || desc.includes(q);
          });
        }

        const [by, dir] = sortSelect.value.split(':');
        STATE.evidenceView.sortBy = by;
        STATE.evidenceView.sortDir = dir;

        rows.sort((a,b)=>{
          let av, bv;
          if(by==='sim'){ av=a.sim||0; bv=b.sim||0; }
          else if(by==='date'){ av=(a.date||''); bv=(b.date||''); }
          else if(by==='site'){ av=((a.site||'')+' '+(a.line||'')); bv=((b.site||'')+' '+(b.line||'')); }
          else if(by==='eq'){ av=(a.eq||''); bv=(b.eq||''); }
          else { av=0; bv=0; }
          if(av < bv) return dir==='asc' ? -1 : 1;
          if(av > bv) return dir==='asc' ? 1 : -1;
          return 0;
        });
        return rows;
      }

      function renderBody(){
        const rows = filteredSorted();
        const tbody = table.querySelector('tbody');
        if(!rows.length){
          tbody.innerHTML = `<tr><td colspan="6" class="muted">조건에 맞는 근거가 없습니다.</td></tr>`;
          return;
        }
        tbody.innerHTML = rows.map(r=>{
          const siteLine = [r.site, r.line].filter(Boolean).join(' ');
          const eq = r.eq || '';
          const name = r.name || '';
          const desc = r.desc || '';
          return `
            <tr data-id="${r.id}">
              <td class="idcell">#${r.id}</td>
              <td>${formatDate(r.date) || ''}</td>
              <td>
                <div class="rowline">
                  <span class="badge link" data-fsite="${escapeHtml(r.site||'')}">${escapeHtml(r.site||'')}</span>
                  <span class="sep"></span>
                  <span class="badge link" data-fline="${escapeHtml(r.line||'')}">${escapeHtml(r.line||'')}</span>
                </div>
              </td>
              <td>
                <div class="rowline">
                  <span class="badge link" data-feq="${escapeHtml(eq)}">${escapeHtml(eq||'')}</span>
                </div>
              </td>
              <td class="t-right">${(r.sim ?? 0).toFixed(3)}</td>
              <td class="desc">
                <div class="label">${escapeHtml(name||'WORK')}</div>
                <details>
                  <summary>요약 보기</summary>
                  <div class="desc-full">${escapeHtml(desc)}</div>
                  <div class="desc-actions">
                    <button class="btn mini" data-act="copy-desc">내용 복사</button>
                    <button class="btn mini ghost" data-act="site-filter">이 SITE로 재검색</button>
                    <button class="btn mini ghost" data-act="eq-filter">이 장비로 재검색</button>
                  </div>
                </details>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Events
      searchInput.addEventListener('input', renderBody);
      sortSelect.addEventListener('change', renderBody);
      compactChk.addEventListener('change', ()=>{
        STATE.evidenceView.compact = compactChk.checked;
        table.classList.toggle('compact', STATE.evidenceView.compact);
      });

      controls.addEventListener('click', (e)=>{
        const act = e.target?.dataset?.act;
        if(!act) return;
        if(act==='csv'){
          const rows = filteredSorted();
          const csv = toCSV(rows);
          downloadBlob(csv, 'evidence.csv', 'text/csv;charset=utf-8;');
        } else if(act==='copy'){
          const rows = filteredSorted();
          const text = rows.map(r=>{
            const siteLine = [r.site, r.line].filter(Boolean).join(' ');
            return `#${r.id}\t${formatDate(r.date) || ''}\t${siteLine}\t${r.eq||''}\t${(r.sim??0).toFixed(3)}\t${(r.name||'')}\t${(r.desc||'')}`;
          }).join('\n');
          navigator.clipboard.writeText(text).then(()=>toast('표 복사 완료','ok'));
        } else if(act==='clear-filter'){
          STATE.filters = {site:null,line:null,equipment_type:null};
          toast('필터를 해제했습니다.');
        }
      });

      tableWrap.addEventListener('click', (e)=>{
        const t = e.target;
        if(!(t instanceof HTMLElement)) return;

        if (t.dataset.act === 'copy-desc') {
          const full = t.closest('details')?.querySelector('.desc-full')?.textContent || '';
          navigator.clipboard.writeText(full).then(()=>toast('내용 복사 완료','ok'));
        } else if (t.dataset.act === 'site-filter') {
          const tr = t.closest('tr');
          const id = tr?.dataset?.id;
          const row = STATE.lastEvidence.find(x=>String(x.id)===String(id));
          if(row){
            STATE.filters.site = row.site || null;
            STATE.filters.line = row.line || null;
            toast(`SITE 필터 적용: ${[row.site,row.line].filter(Boolean).join(' ')}`);
            rerunWithFilter();
          }
        } else if (t.dataset.act === 'eq-filter') {
          const tr = t.closest('tr');
          const id = tr?.dataset?.id;
          const row = STATE.lastEvidence.find(x=>String(x.id)===String(id));
          if(row){
            const type = (row.eq||'').split('/')[0].trim() || null;
            STATE.filters.equipment_type = type || null;
            toast(`장비타입 필터 적용: ${type||'-'}`);
            rerunWithFilter();
          }
        }

        if (t.matches('[data-fsite]')) {
          STATE.filters.site = t.dataset.fsite || null;
          toast(`SITE 필터: ${STATE.filters.site||'-'}`);
          rerunWithFilter();
        } else if (t.matches('[data-fline]')) {
          STATE.filters.line = t.dataset.fline || null;
          toast(`LINE 필터: ${STATE.filters.line||'-'}`);
          rerunWithFilter();
        } else if (t.matches('[data-feq]')) {
          const type = (t.dataset.feq||'').split('/')[0].trim() || null;
          STATE.filters.equipment_type = type || null;
          toast(`장비타입 필터: ${type||'-'}`);
          rerunWithFilter();
        }
      });

      renderBody();
      return wrap;
    }

    function toCSV(rows){
      const header = ['ID','날짜','SITE','LINE','장비','유사도','라벨','요약'];
      const out = [header.join(',')];
      rows.forEach(r=>{
        const fields = [
          `#${r.id}`,
          formatDate(r.date)||'',
          (r.site||''),
          (r.line||''),
          (r.eq||''),
          (r.sim??0).toFixed(3),
          (r.name||''),
          (r.desc||'').replace(/\n/g,' ').replace(/"/g,'""'),
        ];
        out.push(fields.map(f=>`"${String(f)}"`).join(','));
      });
      return out.join('\n');
    }
    function downloadBlob(text, filename, mime){
      const blob = new Blob([text], {type:mime});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    /* ===== Composer helpers ===== */
    function autoGrow(t){
      if(!t) return;
      t.style.height = 'auto';
      t.style.height = Math.min(t.scrollHeight, 180) + 'px';
    }

    /* ===== Core ask ===== */
    async function ask(question, opts={}){
      const q = (question ?? els.q.value ?? '').trim();
      if(!q){ els.q.focus(); toast('메시지를 입력해 주세요.','error'); return; }

      addMsg('user', escapeHtml(q), { meta:'사용자' });
      els.status.textContent = '생성 중…';
      const removeSkel = addSkeleton();

      const days = Number(els.days?.value || 365);
      const prefilterLimit = Number(els.pref?.value || 300);
      const topK = Number(els.topk?.value || 20);

      const body = {
        question: q,
        days,
        prefilterLimit,
        topK,
        filters: cleanupFilters(STATE.filters)
      };

      try{
        const res = await fetch('/api/rag/ask', {
          method:'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });
        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); }
        catch { throw new Error(`HTTP ${res.status} - JSON 파싱 실패. 응답: ${raw.slice(0,200)}`); }
        if(!res.ok) throw new Error(data?.detail || data?.error || ('HTTP '+res.status));

        // chips
        els.chipModel.textContent = `모델: ${data?.used?.model ? `${data.used.model.chat} / ${data.used.model.embedding}` : '-'}`;
        els.chipDays.textContent  = `기간 ${days}일`;
        els.chipPref.textContent  = `프리필터 ${prefilterLimit}`;
        els.chipTopk.textContent  = `Top-K ${topK}`;

        removeSkel();
        const html = md(data.answer || '응답 없음');
        const evidence = data.evidence_preview || [];
        addMsg('assistant', html, { meta:'요약', evidence });

        STATE.lastQuestion = q;
        addHistory(q);
        els.status.textContent = '';

      }catch(err){
        console.error(err);
        removeSkel();
        addMsg('assistant', md('오류가 발생했습니다:\n- '+String(err.message||err)), { meta:'오류' });
        els.status.textContent = '오류: '+String(err.message||err);
        toast('오류: '+String(err.message||err), 'error');
      }
    }

    function cleanupFilters(f){
      const out = {};
      if (f.site) out.site = f.site;
      if (f.line) out.line = f.line;
      if (f.equipment_type) out.equipment_type = f.equipment_type;
      return out;
    }

    function rerunWithFilter(){
      if(!STATE.lastQuestion){
        toast('최근 질문이 없습니다. 먼저 질문을 입력하세요.');
        return;
      }
      addMsg('assistant', md(`적용된 필터로 다시 검색합니다.\n- SITE: **${STATE.filters.site||'-'}**\n- LINE: **${STATE.filters.line||'-'}**\n- 장비타입: **${STATE.filters.equipment_type||'-'}**`), { meta: '안내' });
      ask(STATE.lastQuestion);
    }

    /* ===== Wire events ===== */
    els.ask?.addEventListener('click', ()=> ask());
    els.clear?.addEventListener('click', ()=>{
      els.q.value = '';
      autoGrow(els.q);
      els.status.textContent = '';
      toast('초기화했습니다.');
    });
    els.newChat?.addEventListener('click', ()=>{
      els.chat.innerHTML = '';
      els.q.value = '';
      autoGrow(els.q);
      STATE.lastQuestion = '';
      STATE.lastAnswerHtml = '';
      STATE.lastEvidence = [];
      STATE.filters = {site:null,line:null,equipment_type:null};
      toast('새 대화를 시작합니다.');
    });
    els.clearHistory?.addEventListener('click', ()=>{
      localStorage.removeItem(HS_KEY);
      renderHistory();
      toast('기록을 비웠습니다.');
    });

    els.q?.addEventListener('input', ()=> autoGrow(els.q));
    els.q?.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault();
        ask();
      } else if ((e.ctrlKey||e.metaKey) && e.key==='Enter'){
        e.preventDefault();
        ask();
      }
    });
    setTimeout(()=> els.q && els.q.focus(), 80);

    renderHistory();
  }
})();
