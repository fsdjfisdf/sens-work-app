(() => {
  const $ = (sel) => document.querySelector(sel);
  const form = $('#ragForm');

  const el = {
    q: $('#q'),
    days: $('#days'),
    prefilter: $('#prefilter'),
    topK: $('#topK'),
    answerTopK: $('#answerTopK'),
    g: $('#filterGroup'),
    s: $('#filterSite'),
    eq: $('#filterEq'),
    w1: $('#filterWork1'),
    w2: $('#filterWork2'),
    status: $('#status'),
    answer: $('#answer'),
    params: $('#params'),
    evidences: $('#evidences'),
    btnCopy: $('#btnCopy'),
    btnToggle: $('#btnToggle'),
    btnReset: $('#btnReset'),
  };

  // ---- helpers ----
  function toast(msg, type='info'){
    el.status.textContent = msg;
    if(type==='err') el.status.style.color = '#ff6b6b';
    else if(type==='ok') el.status.style.color = '#48d597';
    else el.status.style.color = '';
  }

  function saveLocal(){
    const data = {
      q: el.q.value,
      days: el.days.value,
      prefilter: el.prefilter.value,
      topK: el.topK.value,
      answerTopK: el.answerTopK.value,
      filters: {
        group: el.g.value,
        site: el.s.value,
        equipment_type: el.eq.value,
        work_type: el.w1.value,
        work_type2: el.w2.value
      }
    };
    localStorage.setItem('rag-form', JSON.stringify(data));
  }
  function loadLocal(){
    try{
      const raw = localStorage.getItem('rag-form');
      if(!raw) return;
      const d = JSON.parse(raw);
      el.q.value = d.q ?? '';
      el.days.value = d.days ?? 365;
      el.prefilter.value = d.prefilter ?? 300;
      el.topK.value = d.topK ?? 20;
      el.answerTopK.value = d.answerTopK ?? 8;
      const f = d.filters || {};
      el.g.value = f.group ?? '';
      el.s.value = f.site ?? '';
      el.eq.value = f.equipment_type ?? '';
      el.w1.value = f.work_type ?? '';
      el.w2.value = f.work_type2 ?? '';
    }catch(e){}
  }

  function renderParams(obj){
    el.params.textContent = JSON.stringify(obj, null, 2);
  }

  function renderAnswer(text){
    el.answer.textContent = text || '결과가 없습니다.';
  }

  function renderEvidences(list){
    if(!list || !list.length){
      el.evidences.innerHTML = '<div class="badge warn" style="margin:10px;">근거가 없습니다.</div>';
      return;
    }
    const rows = list.map(ev => `
      <tr>
        <td><code>${ev.id}</code></td>
        <td>${ev.date ?? ''}</td>
        <td>${ev.group ?? ''}</td>
        <td>${ev.site ?? ''}</td>
        <td>${ev.equip ?? ''}</td>
        <td>${ev.work_type ?? ''}</td>
        <td>${ev.work_type2 ?? ''}</td>
      </tr>
    `).join('');
    el.evidences.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID</th><th>DATE</th><th>GROUP</th><th>SITE</th>
            <th>EQUIP</th><th>WORK</th><th>WORK2</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  async function callRag(body){
    const res = await fetch('/api/rag/ask', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    if(!res.ok){
      const t = await res.text().catch(()=> '');
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${t}`);
    }
    return res.json();
  }

  // ---- events ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = el.q.value.trim();
    if(!q){ toast('질문을 입력해 주세요.', 'err'); el.q.focus(); return; }

    const body = {
      q,
      days: Number(el.days.value || 365),
      prefilter: Number(el.prefilter.value || 300),
      topK: Number(el.topK.value || 20),
      answerTopK: Number(el.answerTopK.value || 8),
      filters: {
        group: el.g.value.trim() || undefined,
        site: el.s.value.trim() || undefined,
        equipment_type: el.eq.value.trim() || undefined,
        work_type: el.w1.value.trim() || undefined,
        work_type2: el.w2.value.trim() || undefined,
      }
    };

    saveLocal();
    renderParams(body);
    renderAnswer('분석 중…');
    renderEvidences([]);
    toast('검색 중…');

    try{
      const json = await callRag(body);
      renderAnswer(json.answer || '결과가 없습니다.');
      renderEvidences(json.evidences || []);
      toast('완료', 'ok');
    }catch(err){
      console.error(err);
      renderAnswer('');
      renderEvidences([]);
      toast(`오류: ${err.message}`, 'err');
    }
  });

  // Ctrl/Cmd + Enter
  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
      $('#btnSearch')?.click();
    }
  });

  // 복사
  el.btnCopy.addEventListener('click', async () => {
    const text = el.answer.textContent || '';
    try{
      await navigator.clipboard.writeText(text);
      toast('복사됨', 'ok');
    }catch{ toast('복사 실패', 'err'); }
  });

  // 근거 접기/펼치기 (단순 토글)
  el.btnToggle.addEventListener('click', () => {
    const wrap = el.evidences;
    if(!wrap.dataset.collapse){
      wrap.style.maxHeight = '160px';
      wrap.style.overflow = 'auto';
      wrap.dataset.collapse = '1';
      el.btnToggle.textContent = '펼치기';
    }else{
      wrap.style.maxHeight = '';
      wrap.style.overflow = '';
      wrap.dataset.collapse = '';
      el.btnToggle.textContent = '접기/펼치기';
    }
  });

  // 지우기
  el.btnReset.addEventListener('click', () => {
    el.q.value = '';
    toast('입력값을 초기화했습니다.');
    el.q.focus();
  });

  // 초기화
  loadLocal();
})();
