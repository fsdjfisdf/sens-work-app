/**
 * worklog_new.js
 * [수정] 작업자별 개인 시간 (START, END, NONE, MOVE) — 공통 시간 제거, 4단계
 * [수정] join('\n') — <br> 대신 줄바꿈 문자로 저장
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {

  const API = 'http://3.37.73.151:3001';

  /* ── 헬퍼 ── */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const getV = id => (document.getElementById(id)?.value || '').trim();

  /* ── 로그인 체크 ── */
  function checkLogin() {
    if (!localStorage.getItem('x-access-token')) {
      alert('로그인이 필요합니다.');
      location.replace('./signin.html');
      return false;
    }
    return true;
  }
  if (!checkLogin()) return;

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'x-access-token': localStorage.getItem('x-access-token') };
  }

  /* ── 오늘 날짜 ── */
  function getTodayDate() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }
  const taskDateEl = document.getElementById('task_date');
  if (taskDateEl && !taskDateEl.value) taskDateEl.value = getTodayDate();

  /* ── Enter 제출 방지 ── */
  $('#worklogForm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement?.tagName !== 'TEXTAREA') e.preventDefault();
  });

  /* ── NAV 초기화 ── */
  const me = (() => {
    try { return JSON.parse(atob(localStorage.getItem('x-access-token').split('.')[1])); } catch { return null; }
  })();
  if (me) {
    $$('.sign-container.unsigned').forEach(el => el.classList.add('hidden'));
    $$('.sign-container.signed').forEach(el => el.classList.remove('hidden'));
    if (me.role !== 'admin') $$('.admin-only').forEach(el => el.style.display = 'none');
  }
  $('#sign-out')?.addEventListener('click', () => {
    localStorage.removeItem('x-access-token');
    location.replace('./signin.html');
  });
  $('.menu-btn')?.addEventListener('click', () => $('.menu-bar')?.classList.toggle('open'));


  /* ══════════════════════════════════════════
     STEP 네비게이션 (4단계)
  ══════════════════════════════════════════ */
  let currentStep = 1;
  const TOTAL_STEPS = 4;

  function goStep(n) {
    const cur = $(`.form-step[data-step="${currentStep}"]`);
    const nxt = $(`.form-step[data-step="${n}"]`);
    if (!nxt || cur === nxt) return;
    cur?.classList.remove('active');
    nxt.classList.add('active');
    currentStep = n;
    updateStepIndicator();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updateStepIndicator() {
    $$('.step-dot').forEach(dot => {
      const t = Number(dot.dataset.target);
      dot.classList.toggle('active',    t === currentStep);
      dot.classList.toggle('completed', t < currentStep);
    });
    $$('.step-line').forEach((line, i) => {
      line.classList.toggle('done', i + 1 < currentStep);
    });
  }
  $$('.next-step').forEach(btn => btn.addEventListener('click', () => {
    if (validateStep(currentStep)) goStep(currentStep + 1);
  }));
  $$('.prev-step').forEach(btn => btn.addEventListener('click', () => goStep(currentStep - 1)));


  /* ══════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════ */
  function showToast(type, msg) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'danger' : type}`;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }


  /* ══════════════════════════════════════════
     EMS 자동 권고
  ══════════════════════════════════════════ */
  let emsManualOverride = false;
  const emsHint = document.getElementById('ems-hint');

  function recommendEms() {
    const w = getV('warranty');
    if (!w || w === 'SELECT') return null;
    return w === 'WO' ? 1 : 0;
  }
  function applyEmsRecommend(force = false) {
    const rec = recommendEms();
    if (rec === null) { if (emsHint) emsHint.textContent = '권고: -'; return; }
    if (emsHint) emsHint.textContent = `권고: ${rec === 1 ? '유상' : '무상'}`;
    if (!emsManualOverride || force) {
      const radio = document.querySelector(`input[name="emsChoice"][value="${rec}"]`);
      if (radio) radio.checked = true;
    }
  }
  document.getElementById('warranty')?.addEventListener('change', () => { emsManualOverride = false; applyEmsRecommend(); });
  $$('input[name="emsChoice"]').forEach(r => r.addEventListener('change', () => { emsManualOverride = true; }));
  document.getElementById('ems-auto-btn')?.addEventListener('click', () => { emsManualOverride = false; applyEmsRecommend(true); });
  function currentEms() {
    const checked = document.querySelector('input[name="emsChoice"]:checked');
    return checked ? Number(checked.value) : null;
  }


  /* ══════════════════════════════════════════
     Step 2 — WORK TYPE
  ══════════════════════════════════════════ */
  document.getElementById('workType')?.addEventListener('change', function () {
    const isSetup = this.value === 'SET UP' || this.value === 'RELOCATION';
    const isMaint = this.value === 'MAINT';
    document.getElementById('setup-item-row')?.classList.toggle('hidden', !isSetup);
    document.getElementById('transfer-item-row')?.classList.toggle('hidden', !isMaint);
    document.getElementById('worksort-row')?.classList.toggle('hidden', !isMaint);
  });


  /* ══════════════════════════════════════════
     Step 3 — 작업자 (개인별 시간 포함)
  ══════════════════════════════════════════ */

  function calcWorkerDuration(container) {
    const s    = container.querySelector('.worker-start-time')?.value || '';
    const e    = container.querySelector('.worker-end-time')?.value || '';
    const none = Number(container.querySelector('.worker-none-time')?.value) || 0;
    const move = Number(container.querySelector('.worker-move-time')?.value) || 0;
    const el   = container.querySelector('.worker-calc-duration');
    if (!el) return;
    if (!s || !e) { el.textContent = '—'; return; }
    const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const total = toMin(e) - toMin(s) - none - move;
    el.textContent = total <= 0 ? '0분' : `${Math.floor(total / 60)}시간 ${total % 60}분`;
  }

  function bindWorkerTimeCalc(container) {
    ['worker-start-time', 'worker-end-time', 'worker-none-time', 'worker-move-time'].forEach(cls => {
      container.querySelector(`.${cls}`)?.addEventListener('input', () => calcWorkerDuration(container));
    });
  }

  // 첫 번째 작업자 바인딩
  const firstWorkerEl = $('.task-man-container');
  if (firstWorkerEl) bindWorkerTimeCalc(firstWorkerEl);

  function createWorkerRow(name = '', role = 'main') {
    const div = document.createElement('div');
    div.className = 'task-man-container';
    div.innerHTML = `
      <div class="worker-main-row">
        <input type="text" class="task-man-input" placeholder="이름" value="${name.replace(/"/g,'&quot;')}" required>
        <select class="task-man-role">
          <option value="main"${role === 'main' ? ' selected' : ''}>main</option>
          <option value="support"${role === 'support' ? ' selected' : ''}>support</option>
        </select>
        <button type="button" class="btn-remove remove-worker">−</button>
      </div>
      <div class="worker-time-row">
        <div>
          <label>START</label>
          <input type="time" class="worker-start-time">
        </div>
        <div>
          <label>END</label>
          <input type="time" class="worker-end-time">
        </div>
        <div>
          <label>NONE(분)</label>
          <input type="number" class="worker-none-time" min="0" value="0">
        </div>
        <div>
          <label>MOVE(분)</label>
          <input type="number" class="worker-move-time" min="0" value="0">
        </div>
      </div>
      <div class="worker-duration-preview">
        실 작업: <span class="worker-calc-duration">—</span>
      </div>
    `;
    div.querySelector('.remove-worker').addEventListener('click', () => {
      div.remove();
      updateWorkerRemoveBtns();
    });
    bindWorkerTimeCalc(div);
    return div;
  }

  function updateWorkerRemoveBtns() {
    const btns = $$('.remove-worker');
    btns.forEach((b, i) => { b.disabled = (i === 0 && btns.length === 1); });
  }

  document.getElementById('add-worker')?.addEventListener('click', () => {
    const container = document.getElementById('task-mans-container');
    const bulkArea  = container.querySelector('.worker-bulk-actions');
    container.insertBefore(createWorkerRow(), bulkArea);
    updateWorkerRemoveBtns();
  });

  // 시간 전체 복사: 첫 번째 작업자의 시간을 나머지에 복사
  document.getElementById('copy-time-all')?.addEventListener('click', () => {
    const containers = $$('.task-man-container');
    if (containers.length < 2) return;
    const src = containers[0];
    const sVal = src.querySelector('.worker-start-time')?.value || '';
    const eVal = src.querySelector('.worker-end-time')?.value || '';
    const nVal = src.querySelector('.worker-none-time')?.value || '0';
    const mVal = src.querySelector('.worker-move-time')?.value || '0';
    containers.slice(1).forEach(c => {
      c.querySelector('.worker-start-time').value = sVal;
      c.querySelector('.worker-end-time').value = eVal;
      c.querySelector('.worker-none-time').value = nVal;
      c.querySelector('.worker-move-time').value = mVal;
      calcWorkerDuration(c);
    });
    showToast('success', '시간이 전체 복사되었습니다.');
  });


  /* ══════════════════════════════════════════
     Step 4 — 동적 textarea
  ══════════════════════════════════════════ */
  function addDynField(containerId, itemClass, inputClass, removeClass, addBtnId) {
    document.getElementById(addBtnId)?.addEventListener('click', () => {
      const c   = document.getElementById(containerId);
      const btn = document.getElementById(addBtnId);
      const div = document.createElement('div');
      div.className = itemClass;
      div.innerHTML = `<textarea class="${inputClass}" rows="3"></textarea><button type="button" class="btn-remove ${removeClass}">−</button>`;
      div.querySelector(`.${removeClass}`).addEventListener('click', () => div.remove());
      c.insertBefore(div, btn);
    });
  }
  addDynField('task-descriptions-container','task-desc-item','task-description-input','remove-desc','add-desc');
  addDynField('task-causes-container',      'task-cause-item','task-cause-input','remove-cause','add-cause');
  addDynField('task-results-container',     'task-result-item','task-result-input','remove-result','add-result');


  /* ══════════════════════════════════════════
     유효성 검사
  ══════════════════════════════════════════ */
  function validateStep(step) {
    switch (step) {
      case 1: {
        if (!getV('task_date')) { showToast('error','WORK DATE를 입력하세요.'); return false; }
        if (!getV('equipment_name')) { showToast('error','EQ NAME을 입력하세요.'); return false; }
        if (getV('group') === 'SELECT') { showToast('error','GROUP을 선택하세요.'); return false; }
        if (getV('site')  === 'SELECT') { showToast('error','SITE를 선택하세요.'); return false; }
        if (getV('equipment_type') === 'SELECT') { showToast('error','EQ TYPE을 선택하세요.'); return false; }
        if (getV('warranty') === 'SELECT') { showToast('error','WARRANTY를 선택하세요.'); return false; }
        if (currentEms() === null) { showToast('error','EMS(유상/무상)를 선택하세요.'); return false; }
        return true;
      }
      case 2: {
        if (getV('workType') === 'SELECT') { showToast('error','WORK TYPE을 선택하세요.'); return false; }
        return true;
      }
      case 3: {
        const containers = $$('.task-man-container');
        const names = containers.map(c => c.querySelector('.task-man-input')?.value.trim()).filter(Boolean);
        if (!names.length) { showToast('error','작업자를 1명 이상 입력하세요.'); return false; }
        // 작업자별 시간 검증
        for (const c of containers) {
          const name = c.querySelector('.task-man-input')?.value.trim();
          if (!name) continue;
          const s = c.querySelector('.worker-start-time')?.value;
          const e = c.querySelector('.worker-end-time')?.value;
          if (!s || !e) { showToast('error', `${name}의 시작/종료 시간을 입력하세요.`); return false; }
          const toSec = t => { const [h,m] = t.split(':').map(Number); return h*3600+m*60; };
          if (toSec(e) <= toSec(s)) { showToast('error', `${name}의 종료 시간은 시작 시간보다 늦어야 합니다.`); return false; }
        }
        return true;
      }
      case 4: {
        if (!getV('task_name')) { showToast('error','TITLE을 입력하세요.'); return false; }
        return true;
      }
      default: return true;
    }
  }


  /* ══════════════════════════════════════════
     미리보기 모달
  ══════════════════════════════════════════ */
  document.getElementById('preview-save')?.addEventListener('click', () => {
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (!validateStep(i)) { goStep(i); return; }
    }
    const now = new Date();
    if (now.getHours() < 11 && getV('task_date') === getTodayDate()) {
      if (!confirm('현재 시간이 오전 11시 이전입니다. 오늘 작업이 맞습니까?')) { goStep(1); return; }
    }

    // 작업자 미리보기
    const workers = $$('.task-man-container').map(c => {
      const name = c.querySelector('.task-man-input')?.value.trim() || '';
      const role = c.querySelector('.task-man-role')?.value || 'main';
      const ws   = c.querySelector('.worker-start-time')?.value || '';
      const we   = c.querySelector('.worker-end-time')?.value || '';
      const wn   = c.querySelector('.worker-none-time')?.value || '0';
      const wm   = c.querySelector('.worker-move-time')?.value || '0';
      return name ? `${name}(${role}) ${ws}~${we} 논:${wn}분 무브:${wm}분` : '';
    }).filter(Boolean);

    document.getElementById('pv-date').textContent    = getV('task_date');
    document.getElementById('pv-ems').textContent     = currentEms() === 1 ? '유상 (EMS)' : '무상 (WI)';
    document.getElementById('pv-site').textContent    = `${getV('site')} / ${getV('line')}`;
    document.getElementById('pv-eqname').textContent  = getV('equipment_name');
    document.getElementById('pv-eqtype').textContent  = getV('equipment_type');
    document.getElementById('pv-worktype').textContent= `${getV('workType')} / ${getV('workType2') || getV('additionalWorkType') || '-'}`;
    document.getElementById('pv-workers').textContent = workers.join('\n');
    document.getElementById('pv-title').textContent   = getV('task_name');
    document.getElementById('pv-rework').textContent  = document.getElementById('is-rework')?.checked ? '✅ Rework' : '-';

    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('preview-modal').style.display = 'block';
  });

  document.getElementById('cancel-save')?.addEventListener('click', closePreview);
  document.getElementById('modal-overlay')?.addEventListener('click', closePreview);
  function closePreview() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('preview-modal').style.display = 'none';
  }


  /* ══════════════════════════════════════════
     최종 제출
  ══════════════════════════════════════════ */
  document.getElementById('confirm-save')?.addEventListener('click', async () => {
    closePreview();

    // 작업자 배열 (개인별 시간 포함)
    const workers = $$('.task-man-container').map(c => ({
      name:       c.querySelector('.task-man-input')?.value.trim() || '',
      role:       c.querySelector('.task-man-role')?.value || 'main',
      start_time: c.querySelector('.worker-start-time')?.value
                    ? c.querySelector('.worker-start-time').value + ':00' : null,
      end_time:   c.querySelector('.worker-end-time')?.value
                    ? c.querySelector('.worker-end-time').value + ':00' : null,
      none_time:  Number(c.querySelector('.worker-none-time')?.value) || 0,
      move_time:  Number(c.querySelector('.worker-move-time')?.value) || 0,
    })).filter(w => w.name);

    const task_description = $$('.task-description-input').map(el => el.value.trim()).filter(Boolean).join('\n');
    const task_cause       = $$('.task-cause-input').map(el => el.value.trim()).filter(Boolean).join('\n');
    const task_result      = $$('.task-result-input').map(el => el.value.trim()).filter(Boolean).join('\n');

    const payload = {
      task_name:        getV('task_name'),
      task_date:        getV('task_date'),
      country:          getV('country') || 'KR',
      group:            getV('group'),
      site:             getV('site'),
      line:             getV('line'),
      equipment_type:   getV('equipment_type'),
      equipment_name:   getV('equipment_name'),
      warranty:         getV('warranty'),
      ems:              currentEms(),
      work_type:        getV('workType'),
      work_type2:       getV('workType2') || null,
      setup_item:       getV('additionalWorkType') || null,
      status:           getV('status'),
      task_description,
      task_cause,
      task_result,
      SOP:              getV('SOP'),
      tsguide:          getV('tsguide'),
      // 공통 시간은 비워서 보냄 (하위호환 — 서버에서 첫 작업자 시간으로 대체)
      start_time:       null,
      end_time:         null,
      none_time:        0,
      move_time:        0,
      is_rework:        document.getElementById('is-rework')?.checked ? 1 : 0,
      workers,
    };

    try {
      const res = await axios.post(`${API}/wl/submit`, payload, { headers: authHeaders() });
      if (res.status === 201) {
        document.getElementById('result-msg').textContent  = '결재 대기 등록이 완료되었습니다.';
        document.getElementById('result-code').textContent = `Work Code: ${res.data.work_code || '-'}`;
        document.getElementById('modal-overlay').style.display = 'block';
        document.getElementById('result-modal').style.display  = 'block';
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error || err.message;
      let title = '저장 실패';
      if (status === 401) title = '인증 만료';
      if (status === 400) title = '입력 오류';
      if (status === 403) title = '권한 없음';
      if (status >= 500)  title = '서버 오류';
      showToast('error', `${title}: ${msg}`);
    }
  });

  document.getElementById('result-ok')?.addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('result-modal').style.display  = 'none';
    $('#worklogForm')?.reset();
    goStep(1);
  });


  /* ══════════════════════════════════════════
     PASTE 팝업
  ══════════════════════════════════════════ */
  const pasteTA = document.getElementById('paste-textarea');
  document.getElementById('paste-button')?.addEventListener('click', () => {
    document.getElementById('popup').style.display = 'block';
  });
  document.getElementById('paste-cancel')?.addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none';
  });
  pasteTA?.addEventListener('input', () => {
    const lines = pasteTA.value.split('\n').length;
    const chars = pasteTA.value.length;
    document.getElementById('paste-lines').textContent = lines;
    document.getElementById('paste-chars').textContent = chars;
  });
  document.getElementById('paste-submit')?.addEventListener('click', () => {
    const text = pasteTA?.value || '';
    if (!text.trim()) return;
    parsePaste(text);
    document.getElementById('popup').style.display = 'none';
  });

  function parsePaste(raw) {
    const lines = raw.split('\n');
    let titleLine = '', statusLines = [], actionLines = [], causeLines = [], resultLines = [];
    let workerLine = '', timeLine = '';
    let section = '';

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (!titleLine && !t.match(/^\d\)/)) { titleLine = t; continue; }
      if (t.match(/^1\)\s*STATUS/i))  { section = 'status'; continue; }
      if (t.match(/^2\)\s*ACTION/i))  { section = 'action'; continue; }
      if (t.match(/^3\)\s*CAUSE/i))   { section = 'cause';  continue; }
      if (t.match(/^4\)\s*RESULT/i))  { section = 'result'; continue; }
      if (t.match(/^5\)/))             { section = '';       continue; }
      if (t.match(/^작업자\s*[:：]/))  { workerLine = t; continue; }
      if (t.match(/^작업\s*시간\s*[:：]/)) { timeLine = t; continue; }
      if (section === 'status') statusLines.push(t);
      else if (section === 'action') actionLines.push(t);
      else if (section === 'cause')  causeLines.push(t);
      else if (section === 'result') resultLines.push(t);
    }

    if (titleLine) { const el = document.getElementById('task_name'); if (el) el.value = titleLine; }
    if (statusLines.length) { const el = document.getElementById('status'); if (el) el.value = statusLines.join('\n'); }

    fillDynField('task-descriptions-container', '.task-description-input', 'task-desc-item', 'remove-desc', 'add-desc', actionLines);
    fillDynField('task-causes-container', '.task-cause-input', 'task-cause-item', 'remove-cause', 'add-cause', causeLines);
    fillDynField('task-results-container', '.task-result-input', 'task-result-item', 'remove-result', 'add-result', resultLines);

    // 작업자 + 시간 파싱
    let parsedStartTime = '', parsedEndTime = '', parsedNone = 0, parsedMove = 0;
    if (timeLine) {
      const m = timeLine.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
      if (m) {
        parsedStartTime = m[1].padStart(5, '0');
        parsedEndTime   = m[2].padStart(5, '0');
      }
      const noneM = timeLine.match(/논\s*(\d+)/);
      const moveM = timeLine.match(/무브\s*(\d+)/);
      if (noneM) parsedNone = Number(noneM[1]);
      if (moveM) parsedMove = Number(moveM[1]);
    }

    if (workerLine) {
      const names = workerLine.replace(/^작업자\s*[:：]\s*/,'').split(/[,，、]/).map(s=>s.trim()).filter(Boolean);
      const container = document.getElementById('task-mans-container');
      const bulkArea  = container.querySelector('.worker-bulk-actions');
      $$('.task-man-container').slice(1).forEach(el => el.remove());
      if (names[0]) {
        const first = $('.task-man-container');
        if (first) {
          first.querySelector('.task-man-input').value = names[0];
          if (parsedStartTime) first.querySelector('.worker-start-time').value = parsedStartTime;
          if (parsedEndTime) first.querySelector('.worker-end-time').value = parsedEndTime;
          first.querySelector('.worker-none-time').value = parsedNone;
          first.querySelector('.worker-move-time').value = parsedMove;
          calcWorkerDuration(first);
        }
      }
      names.slice(1).forEach(name => {
        const row = createWorkerRow(name);
        row.querySelector('.worker-start-time').value = parsedStartTime;
        row.querySelector('.worker-end-time').value   = parsedEndTime;
        row.querySelector('.worker-none-time').value  = parsedNone;
        row.querySelector('.worker-move-time').value  = parsedMove;
        container.insertBefore(row, bulkArea);
        calcWorkerDuration(row);
      });
      updateWorkerRemoveBtns();
    }

    goStep(4);
  }

  function fillDynField(containerId, inputSel, itemClass, removeClass, addBtnId, lines) {
    if (!lines.length) return;
    const c      = document.getElementById(containerId);
    const addBtn = document.getElementById(addBtnId);
    c.querySelectorAll(`.${itemClass}`).forEach(el => el.remove());
    const joined = lines.join('\n');
    const div = document.createElement('div');
    div.className = itemClass;
    div.innerHTML = `<textarea class="${inputSel.replace('.','')}" rows="4"></textarea><button type="button" class="btn-remove ${removeClass}">−</button>`;
    div.querySelector('textarea').value = joined;
    div.querySelector(`.${removeClass}`).addEventListener('click', () => div.remove());
    c.insertBefore(div, addBtn);
  }


  /* ══════════════════════════════════════════
     설비 추가 모달
  ══════════════════════════════════════════ */
  document.querySelector('.equipment-add-modal-close')?.addEventListener('click', () => {
    document.getElementById('equipment-add-modal')?.classList.remove('active');
  });
  document.getElementById('cancel-equipment-add')?.addEventListener('click', () => {
    document.getElementById('equipment-add-modal')?.classList.remove('active');
  });

});
