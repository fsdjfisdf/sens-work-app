// worklog.js — fixed: use .show class for modals (preview/paste) + previous improvements
document.addEventListener('DOMContentLoaded', async () => {
  const formRoot = document.getElementById('worklogForm');
  if (formRoot) {
    formRoot.addEventListener('keydown', (event) => {
      const activeElement = document.activeElement;
      if (event.key === 'Enter' && activeElement && activeElement.tagName.toLowerCase() !== 'textarea') {
        event.preventDefault();
      }
    });
  }

  function checkLogin() {
    const token = localStorage.getItem('x-access-token');
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.replace('./signin.html');
      return false;
    }
    return true;
  }

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const taskDateEl = document.getElementById('task_date');
  if (taskDateEl && !taskDateEl.value) taskDateEl.value = getTodayDate();

  // Work Type 토글
  const workTypeSel = document.getElementById('workType');
  const additionalOptions = document.getElementById('additionalOptions');
  const maintOptions = document.getElementById('maintOptions');
  const transferOptions = document.getElementById('transferOptions');
  const transferOptions2 = document.getElementById('transferOptions2');

  if (workTypeSel) {
    workTypeSel.addEventListener('change', function () {
      const v = this.value;
      if (v === 'SET UP' || v === 'RELOCATION') {
        additionalOptions.style.display = 'block';
        maintOptions.style.display = 'none';
        transferOptions.style.display = 'none';
        transferOptions2.style.display = 'none';
      } else if (v === 'MAINT') {
        additionalOptions.style.display = 'none';
        maintOptions.style.display = 'block';
        transferOptions.style.display = 'block';
        transferOptions2.style.display = 'block';
      } else {
        additionalOptions.style.display = 'none';
        maintOptions.style.display = 'none';
        transferOptions.style.display = 'none';
        transferOptions2.style.display = 'none';
      }
    });
  }

  /* ---------- 미리보기 모달 ---------- */
  const overlay = document.getElementById('modal-overlay');
  const previewModal = document.getElementById('preview-modal');
  const previewBtn = document.getElementById('preview-save');
  const confirmSaveBtn = document.getElementById('confirm-save');
  const cancelSaveBtn = document.getElementById('cancel-save');
  const hiddenSubmit = document.getElementById('save-button');

  function openPreview() {
    overlay && overlay.classList.add('show');
    previewModal && previewModal.classList.add('show');
    try { confirmSaveBtn && confirmSaveBtn.focus(); } catch (_) {}
  }
  function closePreview() {
    previewModal && previewModal.classList.remove('show');
    overlay && overlay.classList.remove('show');
  }
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const task_date = getVal('task_date');
      const start_time = getVal('start_time');
      const end_time = getVal('end_time');
      const task_name = getVal('task_name');
      const equipment_name = getVal('equipment_name');
      const setupItem = document.getElementById('additionalWorkType')?.value || '';
      const transferItem = document.getElementById('transferOptionSelect')?.value || '';

      const workerTokens = [];
      document.querySelectorAll('.task-man-container').forEach((wrap) => {
        const t = wrap.querySelector('.task-man-input');
        const s = wrap.querySelector('.task-man-select');
        const name = t ? t.value.trim() : '';
        const role = s ? s.value : '';
        if (name) workerTokens.push(`${name}${role ? ` (${role})` : ''}`);
      });
      const uniqueWorkers = [...new Set(workerTokens)].join(', ');

      setText('preview-task_date', task_date);
      setText('preview-start_time', start_time);
      setText('preview-end_time', end_time);
      setText('preview-task_name', task_name);
      setText('preview-equipment_name', equipment_name);
      setText('preview-setupItem', setupItem);
      setText('preview-transferItem', transferItem);
      setText('preview-task_man', uniqueWorkers);

      openPreview();
    });
  }
  confirmSaveBtn?.addEventListener('click', () => {
    closePreview();
    hiddenSubmit?.click();
  });
  cancelSaveBtn?.addEventListener('click', closePreview);

  /* ---------- PASTE 모달 ---------- */
  const pasteBtn = document.getElementById('paste-button');
  const popup = document.getElementById('popup');
  const pasteCancel = document.getElementById('paste-cancel');
  const pasteSubmit = document.getElementById('paste-submit');
  const pasteTextarea = document.getElementById('paste-textarea');
  const linesEl = document.getElementById('paste-lines');
  const charsEl = document.getElementById('paste-chars');

  function updatePasteCounters() {
    if (!pasteTextarea) return;
    const v = pasteTextarea.value || '';
    const lines = v ? v.split(/\r?\n/).length : 0;
    if (linesEl) linesEl.textContent = String(lines);
    if (charsEl) charsEl.textContent = String(v.length);
  }
  function openPaste() {
    overlay && overlay.classList.add('show');
    popup && popup.classList.add('show');
    requestAnimationFrame(() => { pasteTextarea && pasteTextarea.focus(); });
    updatePasteCounters();
  }
  function closePaste() {
    popup && popup.classList.remove('show');
    overlay && overlay.classList.remove('show');
  }
  pasteTextarea?.addEventListener('input', updatePasteCounters);
  pasteBtn?.addEventListener('click', openPaste);
  pasteCancel?.addEventListener('click', closePaste);
  pasteSubmit?.addEventListener('click', closePaste);

  // ESC / 오버레이 클릭으로 두 모달 모두 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (previewModal?.classList.contains('show')) closePreview();
      if (popup?.classList.contains('show')) closePaste();
    }
  });
  overlay?.addEventListener('click', () => {
    if (previewModal?.classList.contains('show')) closePreview();
    if (popup?.classList.contains('show')) closePaste();
  });

  /* ---------- Step 1 — INFO 편집/저장 노출 ---------- */
  const infoTextarea = document.getElementById('info');
  const editInfoBtn = document.getElementById('edit-info');
  const saveInfoBtn = document.getElementById('save-info');
  saveInfoBtn?.classList.add('hidden'); // 초기는 숨김
  let pristineInfo = infoTextarea ? infoTextarea.value : '';

  function updateSaveInfoVisibility() {
    if (!infoTextarea || !saveInfoBtn) return;
    const hasContent = infoTextarea.value.trim().length > 0;
    const editable = !infoTextarea.hasAttribute('disabled');
    const changed = infoTextarea.value !== pristineInfo;
    saveInfoBtn.classList.toggle('hidden', !(hasContent && editable && changed));
  }
  editInfoBtn?.addEventListener('click', () => {
    if (!infoTextarea) return;
    if (infoTextarea.hasAttribute('disabled')) {
      infoTextarea.removeAttribute('disabled');
      infoTextarea.focus();
    } else {
      infoTextarea.setAttribute('disabled', 'disabled');
    }
    updateSaveInfoVisibility();
  });
  infoTextarea?.addEventListener('input', updateSaveInfoVisibility);
  saveInfoBtn?.addEventListener('click', () => {
    if (!infoTextarea) return;
    pristineInfo = infoTextarea.value;
    infoTextarea.setAttribute('disabled', 'disabled');
    updateSaveInfoVisibility();
  });

  /* ---------- 제출 ---------- */
  const form = document.getElementById('worklogForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value || '';
    const task_name = getVal('task_name');
    const status = getVal('status');

    const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(el => el.value).join('<br>');
    const taskCauses  = Array.from(document.getElementsByClassName('task-cause-input')).map(el => el.value).join('<br>');

    if (task_name.length > 255) return alert(`TITLE은 255자 이내로 입력해 주세요. 현재 ${task_name.length}자입니다.`);
    if (taskResults.length > 255) return alert(`RESULT는 255자 이내로 입력해 주세요. 현재 ${taskResults.length}자입니다.`);
    if (taskCauses.length  > 255) return alert(`CAUSE은 255자 이내로 입력해 주세요. 현재 ${taskCauses.length}자입니다.`);
    if (status.length      > 255) return alert(`STATUS는 255자 이내로 입력해 주세요. 현재 ${status.length}자입니다.`);

    let taskMans = Array.from(document.querySelectorAll('.task-man-container')).map((c) => {
      const input = c.querySelector('.task-man-input')?.value || '';
      const role  = c.querySelector('.task-man-select')?.value || '';
      return `${input}(${role})`;
    });
    taskMans = [...new Set(taskMans)].join(', ');

    const taskDescriptions = Array.from(document.getElementsByClassName('task-description-input')).map(el => el.value).join('<br>');

    let task_date  = getVal('task_date') || getTodayDate();
    let start_time = getVal('start_time');
    let end_time   = getVal('end_time');
    const noneTime = getVal('noneTime');
    const moveTime = getVal('moveTime');

    start_time = start_time ? `${start_time}:00` : '00:00:00';
    end_time   = end_time   ? `${end_time}:00`   : '00:00:00';

    const group          = getVal('group');
    const site           = getVal('site');
    const line           = getVal('line');
    const SOP            = getVal('SOP');
    const tsguide        = getVal('tsguide');
    const warranty       = getVal('warranty');
    const equipment_type = getVal('equipment_type');
    const equipment_name = getVal('equipment_name');
    const workType       = getVal('workType');
    const workType2      = getVal('workType2');

    const setupItem     = (workType === 'SET UP' || workType === 'RELOCATION') ? (document.getElementById('additionalWorkType')?.value || 'SELECT') : 'SELECT';
    const maintItem     = (workType === 'MAINT') ? (document.getElementById('maintOptionSelect')?.value || 'SELECT') : 'SELECT';
    const transferItem  = (workType === 'MAINT') ? (document.getElementById('transferOptionSelect')?.value || 'SELECT') : 'SELECT';
    const task_maint    = maintItem;

    try {
      const response = await axios.post(`http://3.37.73.151:3001/log`, {
        task_name, task_result: taskResults, task_cause: taskCauses, task_man: taskMans,
        task_description: taskDescriptions, task_date, start_time, end_time, none_time: noneTime, move_time: moveTime,
        group, site, SOP, tsguide, warranty, line, equipment_type, equipment_name, workType, workType2,
        setupItem, maintItem, transferItem, task_maint, status
      }, { headers: { 'Content-Type': 'application/json' } });

      if (response.status === 201) {
        alert('작업 이력 추가 성공');
        if (typeof loadWorkLogs === 'function') await loadWorkLogs();
      }
    } catch (error) {
      console.error('작업 이력 추가 실패:', error);
    }
  });

  if (checkLogin()) {
    try {
      if (typeof loadEngineers === 'function') await loadEngineers();
      if (typeof loadWorkLogs === 'function') await loadWorkLogs();
      if (typeof renderCalendar === 'function' && typeof logs !== 'undefined' && typeof engineers !== 'undefined') {
        renderCalendar(logs, engineers, window.currentYear, window.currentMonth);
      }
    } catch (e) {
      console.warn('초기 로딩 일부 실패(무시 가능):', e);
    }
  }

  const signOutButton = document.querySelector('#sign-out');
  signOutButton?.addEventListener('click', function () {
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.');
    window.location.replace('./signin.html');
  });

// === Reliable hamburger toggle ===
// === Reliable hamburger toggle (conflict-proof, height-managed) ===
(function fixMenuToggle(){
  const menuBarSel = 'nav .menu-bar';
  const menuBtnSel = 'nav .menu-btn';
  const menuBar = document.querySelector(menuBarSel);
  const oldBtn  = document.querySelector(menuBtnSel);
  if (!menuBar || !oldBtn) return;

  // 1) 기존에 걸려 있던 모든 클릭 리스너 제거(클론 교체 트릭)
  const menuBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(menuBtn, oldBtn);

  // 2) 초기 상태 보정
  menuBar.classList.remove('open');
  menuBar.style.overflow = 'hidden';
  menuBar.style.maxHeight = '0px';
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.setAttribute('aria-controls','menu-bar');

  // 3) 열고/닫기 함수 (실제 컨텐츠 높이 기반)
  const setOpen = (open) => {
    if (open) {
      menuBar.classList.add('open');
      menuBar.style.maxHeight = menuBar.scrollHeight + 'px';
      menuBtn.setAttribute('aria-expanded','true');
    } else {
      menuBar.style.maxHeight = '0px';
      menuBar.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false');
    }
  };

  // 4) 버튼 클릭: 토글
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menuBar.classList.contains('open');
    setOpen(!isOpen);                // ← 두 번째 클릭 시 닫힘
  });

  // 5) 바깥 클릭 / ESC 닫기
  document.addEventListener('click', (e) => {
    if (!menuBar.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // 6) 창 크기 변화 시, 열린 상태면 높이 재계산
  window.addEventListener('resize', () => {
    if (menuBar.classList.contains('open')) {
      menuBar.style.maxHeight = menuBar.scrollHeight + 'px';
    }
  });
})();



  if (!window.__worklogStepNavBound) {
    window.__worklogStepNavBound = true;
    document.querySelectorAll('.next-step').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.querySelector('.form-step.active');
        const next = document.querySelector(`.form-step[data-step="${parseInt(current.dataset.step, 10) + 1}"]`);
        if (!current || !next) return;
        current.classList.add('fade-out');
        setTimeout(() => {
          current.classList.remove('active', 'fade-out');
          next.classList.add('active', 'fade-in');
        }, 150);
      });
    });
    document.querySelectorAll('.prev-step').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.querySelector('.form-step.active');
        const prev = document.querySelector(`.form-step[data-step="${parseInt(current.dataset.step, 10) - 1}"]`);
        if (!current || !prev) return;
        current.classList.add('fade-out');
        setTimeout(() => {
          current.classList.remove('active', 'fade-out');
          prev.classList.add('active', 'fade-in');
        }, 150);
      });
    });
  }
});
