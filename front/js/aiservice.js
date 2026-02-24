/**
 * front/js/aiservice.js
 * ChatGPT 스타일 AI 채팅 UI
 * - API: POST /api/ai/worklog/query
 *        GET  /api/ai/filter-options
 */
(function () {
  'use strict';

  const API_QUERY = '/api/ai/worklog/query';
  const API_OPTS  = '/api/ai/filter-options';

  // ── DOM ───────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const elQuestion      = $('question');
  const elEqType        = $('equipmentType');
  const elSite          = $('site');
  const elLine          = $('line');
  const elTopK          = $('topK');
  const elBtnSearch     = $('btnSearch');
  const elCharCount     = $('charCount');
  const elFilterStatus  = $('filterStatus');
  const elWelcome       = $('welcomeScreen');
  const elMessages      = $('messagesWrap');
  const elErrorToast    = $('errorToast');
  const elErrorMsg      = $('errorMsg');
  const elToastClose    = $('toastClose');
  const elModal         = $('detailModal');
  const elMTitle        = $('modalTitle');
  const elMBody         = $('modalBody');
  const elMClose        = $('modalClose');
  const elBtnNew        = $('btnNewChat');
  const elHistoryList   = $('historyList');
  const elSidebar       = $('sidebar');
  const elSidebarToggle = $('sidebarToggle');

  // ── 상태 ──────────────────────────────────────────────────
  let isLoading  = false;
  let currentRow = null; // 모달용
  const chatHistory = []; // [{q, filters, summary, results, meta}]

  // ── 사이드바 토글 (모바일) ────────────────────────────────
  elSidebarToggle.addEventListener('click', () => {
    elSidebar.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!elSidebar.contains(e.target) && !elSidebarToggle.contains(e.target)) {
      elSidebar.classList.remove('open');
    }
  });

  // ── 새 대화 ───────────────────────────────────────────────
  elBtnNew.addEventListener('click', () => {
    clearChat();
    elQuestion.focus();
  });

  function clearChat() {
    elMessages.innerHTML = '';
    elMessages.classList.remove('visible');
    elWelcome.style.display = '';
    elQuestion.value = '';
    elCharCount.textContent = '0';
    autoResize();
  }

  // ── 텍스트에어리어 자동 높이 조절 ───────────────────────
  function autoResize() {
    elQuestion.style.height = 'auto';
    elQuestion.style.height = Math.min(elQuestion.scrollHeight, 180) + 'px';
  }
  elQuestion.addEventListener('input', () => {
    autoResize();
    elCharCount.textContent = elQuestion.value.length;
    updateSendBtn();
  });

  // ── 필터 상태 표시 ────────────────────────────────────────
  function updateFilterStatus() {
    const eq = elEqType.value;
    if (!eq) {
      elFilterStatus.textContent = '설비 종류를 선택해주세요';
      elFilterStatus.className   = 'filter-status filter-missing';
    } else {
      const site = elSite.value ? ` / ${elSite.value}` : '';
      const line = elLine.value.trim() ? ` / ${elLine.value.trim()}` : '';
      elFilterStatus.textContent = `${eq}${site}${line}`;
      elFilterStatus.className   = 'filter-status filter-ok';
    }
    updateSendBtn();
  }

  elEqType.addEventListener('change', updateFilterStatus);
  elSite.addEventListener('change',   updateFilterStatus);
  elLine.addEventListener('input',    updateFilterStatus);

  function updateSendBtn() {
    const hasQ  = elQuestion.value.trim().length > 0;
    const hasEq = elEqType.value !== '';
    elBtnSearch.disabled = !(hasQ && hasEq) || isLoading;
  }

  // ── Enter 전송 ────────────────────────────────────────────
  elQuestion.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!elBtnSearch.disabled) doSearch();
    }
  });
  elBtnSearch.addEventListener('click', doSearch);

  // ── 예시 질문 카드 ────────────────────────────────────────
  document.querySelectorAll('.example-card').forEach((card) => {
    card.addEventListener('click', () => {
      const q = card.dataset.q;
      elQuestion.value = q;
      elCharCount.textContent = q.length;
      autoResize();
      updateSendBtn();
      if (!elEqType.value) {
        showToast('설비 종류를 먼저 선택해주세요.');
        elEqType.focus();
        return;
      }
      doSearch();
    });
  });

  // ── 드롭다운 옵션 로드 ────────────────────────────────────
  async function loadFilterOptions() {
    try {
      const res  = await fetch(API_OPTS);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();

      (data.equipment_types || []).forEach((v) =>
        elEqType.appendChild(makeOption(v, v))
      );
      (data.sites || []).forEach((v) =>
        elSite.appendChild(makeOption(v, v))
      );
    } catch {
      // 폴백: 엑셀에서 확인된 실제 값
      ['INTEGER Plus','PRECIA','SUPRA N','SUPRA XP','ECOLITE','GENEVA','HDW']
        .forEach((v) => elEqType.appendChild(makeOption(v, v)));
      ['PT','HS','IC','CJ','PSKH']
        .forEach((v) => elSite.appendChild(makeOption(v, v)));
    }
  }

  function makeOption(value, text) {
    const o = document.createElement('option');
    o.value = value; o.textContent = text;
    return o;
  }

  // ── 검색 실행 ────────────────────────────────────────────
  async function doSearch() {
    const question = elQuestion.value.trim();
    const eqType   = elEqType.value;

    if (!question)  { showToast('질문을 입력해주세요.'); return; }
    if (!eqType)    { showToast('설비 종류를 선택해주세요. (필수)'); return; }
    if (isLoading)  return;

    const filters = {
      equipment_type: eqType,
      site: elSite.value || null,
      line: elLine.value.trim() || null,
      top_k: parseInt(elTopK.value, 10) || 10,
    };

    // 웰컴 화면 숨기고 메시지 영역 보임
    elWelcome.style.display  = 'none';
    elMessages.classList.add('visible');
    clearToast();

    // 사용자 메시지 추가
    appendUserMsg(question, filters);

    // 입력창 초기화
    elQuestion.value = '';
    elCharCount.textContent = '0';
    autoResize();

    // 로딩 메시지 추가
    const loadingId = appendLoadingMsg();
    setLoading(true);

    try {
      const res  = await fetch(API_QUERY, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          question,
          equipment_type: filters.equipment_type,
          site:           filters.site,
          line:           filters.line,
          top_k:          filters.top_k,
        }),
      });
      const data = await res.json();

      removeMsg(loadingId);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `서버 오류 (${res.status})`);
      }

      appendAiMsg(question, data, filters);

      // 히스토리 저장
      chatHistory.push({ question, filters, ...data });
      addHistoryItem(question);

    } catch (err) {
      removeMsg(loadingId);
      appendErrorMsg(err.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // ── 메시지 렌더 함수들 ───────────────────────────────────

  function appendUserMsg(question, filters) {
    const tags = Object.entries({
      '설비': filters.equipment_type,
      'Site': filters.site,
      'Line': filters.line,
      '최대': filters.top_k + '건',
    })
    .filter(([, v]) => v && v !== 'null')
    .map(([k, v]) => `<span class="filter-tag">${k}: ${esc(v)}</span>`)
    .join('');

    const html = `
      <div class="msg-row user-row" id="${genId()}">
        <div class="msg-inner">
          <div class="msg-avatar user-avatar">나</div>
          <div class="msg-content">
            <div class="user-text">${esc(question)}</div>
            ${tags ? `<div class="filter-tags">${tags}</div>` : ''}
          </div>
        </div>
      </div>`;
    elMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
  }

  function appendLoadingMsg() {
    const id = genId();
    const html = `
      <div class="msg-row ai-row loading-row" id="${id}">
        <div class="msg-inner">
          <div class="msg-avatar ai-avatar">AI</div>
          <div class="msg-content">
            <div class="ai-summary">
              <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    elMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
    return id;
  }

  function appendAiMsg(question, data, filters) {
    const { summary, results, meta } = data;
    const id = genId();

    // 결과 카드 HTML
    let cardsHtml = '';
    if (results && results.length > 0) {
      const cardItems = results.slice(0, 5).map((r, i) =>
        buildResultCard(r, i)
      ).join('');

      let moreBtn = '';
      if (results.length > 5) {
        moreBtn = `<button class="btn-expand-card" data-msgid="${id}">
          + 나머지 ${results.length - 5}건 더 보기
        </button>`;
      }

      cardsHtml = `
        <div class="result-cards">
          <p class="result-cards-title">관련 작업이력 ${results.length}건</p>
          ${cardItems}
          ${moreBtn}
        </div>`;
    } else {
      cardsHtml = `<p class="no-result-msg">📋 조건에 맞는 작업이력이 없습니다.</p>`;
    }

    const metaStr = `${meta.result_count}건 · ${meta.elapsed_ms}ms · ${meta.ai_model}`;

    const html = `
      <div class="msg-row ai-row" id="${id}" data-results='${safeJson(results)}'>
        <div class="msg-inner">
          <div class="msg-avatar ai-avatar">AI</div>
          <div class="msg-content">
            <pre class="ai-summary">${esc(summary)}</pre>
            ${cardsHtml}
            <div class="ai-actions">
              <button class="ai-action-btn btn-copy-ai" data-id="${id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                복사
              </button>
              <span class="ai-meta-text">${esc(metaStr)}</span>
            </div>
          </div>
        </div>
      </div>`;

    elMessages.insertAdjacentHTML('beforeend', html);

    // 이벤트 바인딩
    const msgEl = document.getElementById(id);

    // 카드 클릭 → 모달
    msgEl.querySelectorAll('.result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        const allResults = JSON.parse(msgEl.dataset.results || '[]');
        openModal(allResults[idx]);
      });
    });

    // 더보기 버튼
    const moreBtn = msgEl.querySelector('.btn-expand-card');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const allResults = JSON.parse(msgEl.dataset.results || '[]');
        const container  = msgEl.querySelector('.result-cards');
        // 나머지 카드 삽입
        const extra = allResults.slice(5).map((r, i) => buildResultCard(r, i + 5)).join('');
        moreBtn.insertAdjacentHTML('beforebegin', extra);
        // 새 카드에 클릭 이벤트
        msgEl.querySelectorAll('.result-card').forEach((card) => {
          card.onclick = null;
          card.addEventListener('click', () => {
            const idx2 = parseInt(card.dataset.idx, 10);
            openModal(allResults[idx2]);
          });
        });
        moreBtn.remove();
      });
    }

    // 복사 버튼
    msgEl.querySelector('.btn-copy-ai')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      copyText(summary, btn);
    });

    scrollToBottom();
  }

  function appendErrorMsg(msg) {
    const id = genId();
    const html = `
      <div class="msg-row ai-row" id="${id}">
        <div class="msg-inner">
          <div class="msg-avatar ai-avatar">AI</div>
          <div class="msg-content">
            <pre class="ai-summary" style="color:#f87171">⚠️ ${esc(msg)}</pre>
          </div>
        </div>
      </div>`;
    elMessages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
  }

  function removeMsg(id) {
    document.getElementById(id)?.remove();
  }

  // ── 결과 카드 HTML 빌더 ──────────────────────────────────
  function buildResultCard(r, idx) {
    const wt2cls  = { REP:'wt-REP', ADJ:'wt-ADJ', MON:'wt-MON', CLN:'wt-CLN' }[r.work_type2_code] || 'wt-def';
    const wt2     = r.work_type2 && r.work_type2 !== '-' ? r.work_type2 : '-';
    const workers = buildWorkerHtml(r);

    return `
      <div class="result-card" data-idx="${idx}">
        <div class="card-header">
          <span class="card-title">${esc(r.task_name)}</span>
          <div class="card-meta">
            <span class="card-date">${esc(r.task_date)}</span>
            <span class="card-site">${esc(r.site)} / ${esc(r.line)}</span>
            <span class="wt-badge ${wt2cls}">${esc(wt2)}</span>
          </div>
        </div>
        <div class="card-body">
          <span>${esc(r.equipment_name)}</span>
          ${r.task_cause && r.task_cause !== '-' ? ` · 원인: ${esc(trunc(r.task_cause, 50))}` : ''}
        </div>
        <div class="card-desc">${esc(trunc(r.task_description, 100))}</div>
        <div class="card-worker">${workers}</div>
      </div>`;
  }

  function buildWorkerHtml(r) {
    const main    = r.task_man_main    !== '-' ? r.task_man_main    : null;
    const support = r.task_man_support !== '-' ? r.task_man_support : null;
    const raw     = r.task_man_raw || '-';

    if (!main && !support) return `<span style="color:var(--tx-3)">${esc(raw)}</span>`;

    let html = '';
    if (main)    html += `<span class="worker-main-tag">👤 ${esc(main)}</span>`;
    if (support) html += `<span class="worker-support-tag"> · support: ${esc(support)}</span>`;
    return html;
  }

  // ── 히스토리 ─────────────────────────────────────────────
  function addHistoryItem(question) {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span class="history-text">${esc(question)}</span>`;
    elHistoryList.insertBefore(li, elHistoryList.firstChild);

    // 최대 10개
    while (elHistoryList.children.length > 10) {
      elHistoryList.removeChild(elHistoryList.lastChild);
    }
  }

  // ── 모달 ─────────────────────────────────────────────────
  function openModal(row) {
    if (!row) return;
    elMTitle.textContent = `[${row.task_date}] ${row.task_name}`;

    let workerHtml = `<div class="m-value">${esc(row.task_man_raw)}</div>`;
    if (row.task_man_main && row.task_man_main !== '-') {
      workerHtml = `
        <div class="m-row">
          <div class="m-field">
            <div class="m-label">메인 작업자</div>
            <div class="m-value" style="color:#10a37f;font-weight:600">${esc(row.task_man_main)}</div>
          </div>
          <div class="m-field">
            <div class="m-label">서포트 작업자</div>
            <div class="m-value">${esc(row.task_man_support)}</div>
          </div>
        </div>`;
    }

    elMBody.innerHTML = `
      <div class="m-row-3">
        <div class="m-field">
          <div class="m-label">설비 종류</div>
          <div class="m-value">${esc(row.equipment_type)}</div>
        </div>
        <div class="m-field">
          <div class="m-label">설비명</div>
          <div class="m-value">${esc(row.equipment_name)}</div>
        </div>
        <div class="m-field">
          <div class="m-label">작업일</div>
          <div class="m-value" style="font-family:var(--f-mono)">${esc(row.task_date)}</div>
        </div>
      </div>

      <div class="m-row-3">
        <div class="m-field">
          <div class="m-label">그룹 / 지역 / 라인</div>
          <div class="m-value">${esc(row.group)} / ${esc(row.site)} / ${esc(row.line)}</div>
        </div>
        <div class="m-field">
          <div class="m-label">작업 유형</div>
          <div class="m-value">${esc(row.work_type)} / ${esc(row.work_type2)}</div>
        </div>
        <div class="m-field">
          <div class="m-label">소요 시간</div>
          <div class="m-value" style="font-family:var(--f-mono)">${esc(row.task_duration)}</div>
        </div>
      </div>

      ${workerHtml}
      <div class="m-divider"></div>

      <div class="m-field">
        <div class="m-label">작업 원인</div>
        <div class="m-value">${esc(row.task_cause)}</div>
      </div>
      <div class="m-field">
        <div class="m-label">작업 내용 (task_description)</div>
        <div class="m-value highlight">${esc(row.task_description)}</div>
      </div>
      <div class="m-field">
        <div class="m-label">작업 결과</div>
        <div class="m-value">${esc(row.task_result)}</div>
      </div>

      <div class="m-divider"></div>

      <div class="m-row">
        <div class="m-field">
          <div class="m-label">워런티</div>
          <div class="m-value">${esc(row.warranty)}</div>
        </div>
        <div class="m-field">
          <div class="m-label">시간</div>
          <div class="m-value" style="font-family:var(--f-mono)">${esc(row.start_time)} ~ ${esc(row.end_time)}</div>
        </div>
      </div>

      ${(row.SOP || row.tsguide) ? `
      <div class="m-row">
        ${row.SOP     ? `<div class="m-field"><div class="m-label">SOP</div><div class="m-value">${esc(row.SOP)}</div></div>` : ''}
        ${row.tsguide ? `<div class="m-field"><div class="m-label">TS Guide</div><div class="m-value">${esc(row.tsguide)}</div></div>` : ''}
      </div>` : ''}
    `;

    elModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  elMClose.addEventListener('click', closeModal);
  elModal.addEventListener('click', (e) => { if (e.target === elModal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // ── 에러 토스트 ──────────────────────────────────────────
  function showToast(msg) {
    elErrorMsg.textContent = msg;
    elErrorToast.classList.remove('hidden');
    setTimeout(clearToast, 4000);
  }
  function clearToast() { elErrorToast.classList.add('hidden'); }
  elToastClose.addEventListener('click', clearToast);

  // ── 유틸 ─────────────────────────────────────────────────
  function setLoading(on) {
    isLoading = on;
    elBtnSearch.disabled = on;
  }

  function scrollToBottom() {
    setTimeout(() => {
      elMessages.scrollTop = elMessages.scrollHeight;
    }, 50);
  }

  let _idCounter = 0;
  function genId() { return 'msg-' + (++_idCounter); }

  function esc(str) {
    if (str === null || str === undefined) return '-';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function trunc(str, max) {
    if (!str || str === '-') return str || '-';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  function safeJson(obj) {
    // data-* 속성에 넣을 때 작은따옴표 이스케이프
    return JSON.stringify(obj || []).replace(/'/g, '&apos;');
  }

  function copyText(text, btn) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 복사됨';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
      }
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  // ── 초기 실행 ────────────────────────────────────────────
  loadFilterOptions();
  updateFilterStatus();
  elQuestion.focus();

})();
