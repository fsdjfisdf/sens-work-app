/**
 * front/js/aiservice.js
 * 작업이력 AI 질의응답 프론트엔드
 * - Vanilla JS, 외부 의존성 없음
 * - API: POST /api/ai/worklog/query
 *        GET  /api/ai/filter-options
 */

(function () {
  'use strict';

  // ── 설정 ──────────────────────────────────────────────────
  const API_BASE  = '';                        // 동일 origin
  const API_QUERY = `${API_BASE}/api/ai/worklog/query`;
  const API_OPTS  = `${API_BASE}/api/ai/filter-options`;

  // ── DOM 참조 ──────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const elQuestion  = $('question');
  const elEqType    = $('equipmentType');
  const elSite      = $('site');
  const elLine      = $('line');
  const elDateFrom  = $('dateFrom');
  const elDateTo    = $('dateTo');
  const elTopK      = $('topK');
  const elBtnSearch = $('btnSearch');
  const elBtnLabel  = $('btnLabel');
  const elBtnReset  = $('btnReset');
  const elCharCount = $('charCount');
  const elLoading   = $('loading');
  const elErrorBox  = $('errorBox');
  const elErrorMsg  = $('errorMsg');
  const elResultSec = $('resultSection');
  const elSummary   = $('summaryText');
  const elMeta      = $('resultMeta');
  const elBody      = $('resultBody');
  const elCount     = $('resultCount');
  const elNoResult  = $('noResult');
  const elTableWrap = $('tableWrap');
  const elModal     = $('detailModal');
  const elMTitle    = $('modalTitle');
  const elMBody     = $('modalBody');
  const elMClose    = $('modalClose');
  const elCopySumm  = $('btnCopySummary');

  // ── 글자 수 카운터 ────────────────────────────────────────
  elQuestion.addEventListener('input', () => {
    elCharCount.textContent = elQuestion.value.length;
  });

  // ── Enter 키 검색 (Shift+Enter = 줄바꿈) ─────────────────
  elQuestion.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSearch();
    }
  });

  // ── 드롭다운 옵션 로드 ────────────────────────────────────
  async function loadFilterOptions() {
    try {
      const res  = await fetch(API_OPTS);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();

      if (data.equipment_types && data.equipment_types.length) {
        data.equipment_types.forEach((v) => {
          elEqType.appendChild(makeOption(v, v));
        });
      }
      if (data.sites && data.sites.length) {
        data.sites.forEach((v) => {
          elSite.appendChild(makeOption(v, v));
        });
      }
    } catch (err) {
      console.warn('[aiservice] filter-options 로드 실패, 폴백 사용:', err.message);
      // 폴백: 엑셀에서 확인된 실제 equipment_type 값
      // TODO: 실제 DB 값이 다르면 아래 목록 업데이트 필요
      [
        'INTEGER Plus', 'PRECIA', 'SUPRA N', 'SUPRA XP',
        'ECOLITE', 'GENEVA', 'HDW',
      ].forEach((v) => elEqType.appendChild(makeOption(v, v)));

      ['PT', 'HS', 'IC', 'CJ', 'PSKH'].forEach((v) =>
        elSite.appendChild(makeOption(v, v))
      );
    }
  }

  function makeOption(value, text) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    return o;
  }

  // ── 상태 토글 ─────────────────────────────────────────────
  function setLoading(on) {
    elLoading.classList.toggle('hidden', !on);
    elBtnSearch.disabled = on;
    elBtnLabel.textContent = on ? '분석 중...' : 'AI 검색';
  }

  function showError(msg) {
    elErrorMsg.textContent = msg;
    elErrorBox.classList.remove('hidden');
  }

  function clearError()  { elErrorBox.classList.add('hidden'); }
  function hideResult()  { elResultSec.classList.add('hidden'); }

  // ── 유효성 검사 ──────────────────────────────────────────
  function validate() {
    const q  = elQuestion.value.trim();
    const eq = elEqType.value;

    if (!q) {
      showError('질문을 입력해주세요.');
      elQuestion.focus();
      return false;
    }
    if (!eq) {
      showError('설비 종류(Equipment Type)를 선택해주세요. (필수)');
      elEqType.focus();
      return false;
    }
    const df = elDateFrom.value;
    const dt = elDateTo.value;
    if (df && dt && df > dt) {
      showError('시작일이 종료일보다 늦습니다.');
      return false;
    }
    return true;
  }

  // ── 검색 실행 ────────────────────────────────────────────
  async function doSearch() {
    clearError();
    hideResult();
    if (!validate()) return;

    const payload = {
      question:       elQuestion.value.trim(),
      equipment_type: elEqType.value,
      site:           elSite.value     || null,
      line:           elLine.value.trim() || null,
      date_from:      elDateFrom.value  || null,
      date_to:        elDateTo.value    || null,
      top_k:          parseInt(elTopK.value, 10) || 10,
    };

    setLoading(true);
    try {
      const res  = await fetch(API_QUERY, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `서버 오류 (${res.status})`);
      }
      renderResult(data);
    } catch (err) {
      showError(err.message || '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  // ── 결과 렌더 ────────────────────────────────────────────
  function renderResult(data) {
    const { summary, results, meta } = data;

    // 요약
    elSummary.textContent = summary;

    // 메타 정보
    elMeta.textContent =
      `${meta.result_count}건 검색 | ${meta.elapsed_ms}ms | 모델: ${meta.ai_model}${meta.keyword ? ` | 키워드: "${meta.keyword}"` : ''}`;

    // 카운트
    elCount.textContent = `총 ${meta.result_count}건`;

    // 테이블 초기화
    elBody.innerHTML = '';

    if (!results || results.length === 0) {
      elTableWrap.classList.add('hidden');
      elNoResult.classList.remove('hidden');
    } else {
      elTableWrap.classList.remove('hidden');
      elNoResult.classList.add('hidden');

      results.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = [
          `<td class="cell-date">${esc(row.task_date)}</td>`,
          `<td>${esc(trunc(row.task_name, 30))}</td>`,
          `<td>${esc(row.equipment_name)}</td>`,
          `<td style="white-space:nowrap">${esc(row.site)} / ${esc(row.line)}</td>`,
          `<td class="cell-worker">${renderWorker(row)}</td>`,
          `<td>${esc(trunc(row.task_cause, 40))}</td>`,
          `<td class="cell-desc">${esc(trunc(row.task_description, 90))}</td>`,
          `<td>${esc(trunc(row.task_result, 40))}</td>`,
          `<td>${renderWt2(row.work_type2_code, row.work_type2)}</td>`,
          `<td style="font-family:var(--f-mono);font-size:11.5px;white-space:nowrap">${esc(row.task_duration)}</td>`,
        ].join('');
        tr.addEventListener('click', () => openModal(row));
        elBody.appendChild(tr);
      });
    }

    elResultSec.classList.remove('hidden');
    // 스크롤
    setTimeout(() => {
      elResultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  // ── 작업자 렌더 (main/support 파싱 결과 표시) ────────────
  function renderWorker(row) {
    const raw     = row.task_man_raw     || '-';
    const main    = row.task_man_main    !== '-' ? row.task_man_main    : null;
    const support = row.task_man_support !== '-' ? row.task_man_support : null;

    if (!main && !support) return esc(raw);

    let html = '';
    if (main)    html += `<span class="worker-main">${esc(main)}</span>`;
    if (support) html += `<span class="worker-support">support: ${esc(support)}</span>`;
    return html;
  }

  // ── work_type2 배지 렌더 ─────────────────────────────────
  function renderWt2(code, label) {
    const cls = { REP:'wt-REP', ADJ:'wt-ADJ', MON:'wt-MON', CLN:'wt-CLN' }[code] || 'wt-def';
    return label && label !== '-'
      ? `<span class="wt-badge ${cls}">${esc(label)}</span>`
      : '<span class="wt-badge wt-def">-</span>';
  }

  // ── 모달 열기 ────────────────────────────────────────────
  function openModal(row) {
    elMTitle.textContent = `[${row.task_date}] ${row.task_name}`;

    // 작업자 표시
    let workerHtml = `<div class="m-value">${esc(row.task_man_raw)}</div>`;
    if (row.task_man_main !== '-') {
      workerHtml = `
        <div class="m-row">
          <div class="m-field">
            <div class="m-label">메인 작업자</div>
            <div class="m-value worker-main">${esc(row.task_man_main)}</div>
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
          <div class="m-value">${esc(row.work_type)} / ${renderWt2(row.work_type2_code, row.work_type2)}</div>
        </div>
        <div class="m-field">
          <div class="m-label">소요 시간</div>
          <div class="m-value" style="font-family:var(--f-mono)">${esc(row.task_duration)} (${esc(row.start_time)} ~ ${esc(row.end_time)})</div>
        </div>
      </div>

      ${workerHtml}

      <div class="m-divider"></div>

      <div class="m-field">
        <div class="m-label">작업 원인</div>
        <div class="m-value">${esc(row.task_cause)}</div>
      </div>

      <div class="m-field">
        <div class="m-label">작업 내용 (task_description) — 핵심</div>
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
          <div class="m-label">상태</div>
          <div class="m-value">${esc(row.status || '-')}</div>
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

  // ── 요약 복사 ────────────────────────────────────────────
  elCopySumm.addEventListener('click', () => {
    const text = elSummary.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      elCopySumm.textContent = '✅ 복사됨';
      setTimeout(() => { elCopySumm.textContent = '📋 복사'; }, 2000);
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      elCopySumm.textContent = '✅ 복사됨';
      setTimeout(() => { elCopySumm.textContent = '📋 복사'; }, 2000);
    });
  });

  // ── 초기화 버튼 ──────────────────────────────────────────
  elBtnReset.addEventListener('click', () => {
    elQuestion.value  = '';
    elEqType.value    = '';
    elSite.value      = '';
    elLine.value      = '';
    elDateFrom.value  = '';
    elDateTo.value    = '';
    elTopK.value      = '10';
    elCharCount.textContent = '0';
    clearError();
    hideResult();
    elQuestion.focus();
  });

  // ── 검색 버튼 ────────────────────────────────────────────
  elBtnSearch.addEventListener('click', doSearch);

  // ── 유틸 ─────────────────────────────────────────────────
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

  // ── 초기 실행 ────────────────────────────────────────────
  loadFilterOptions();
  elQuestion.focus();

})();
