// worklog.js — end-to-end validation, step-guard, better error anchors, preview/submit flow + EMS(유/무상) 자동권고/수동오버라이드
document.addEventListener('DOMContentLoaded', async () => {
  /* ========== Helpers ========== */
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // block Enter submit except textarea
  const formRoot = document.getElementById('worklogForm');
  if (formRoot) {
    formRoot.addEventListener('keydown', (e) => {
      const a = document.activeElement;
      if (e.key === 'Enter' && a && a.tagName.toLowerCase() !== 'textarea') e.preventDefault();
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
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth()+1).padStart(2,'0');
    const d = String(t.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  const taskDateEl = document.getElementById('task_date');
  if (taskDateEl && !taskDateEl.value) taskDateEl.value = getTodayDate();

  /* ========== Step show/hide utilities ========== */
  function activeStepEl(){ return $('.form-step.active'); }
  function stepEl(n){ return $(`.form-step[data-step="${n}"]`); }
  function getStepOfNode(node){ return node?.closest('.form-step'); }
  function getStepIndexOfNode(node){
    const step = getStepOfNode(node);
    return step ? Number(step.dataset.step) : null;
  }
  function goStep(n){
    const cur = activeStepEl();
    const nxt = stepEl(n);
    if (!nxt || cur === nxt) return;
    cur?.classList.add('fade-out');
    setTimeout(() => {
      cur?.classList.remove('active','fade-out');
      nxt.classList.add('active','fade-in');
    }, 150);
  }
  function goStepOfNode(node){
    const idx = getStepIndexOfNode(node);
    if (idx) goStep(idx);
  }
  function goFirstErrorStep(){
    const firstErrRow = $('.form-row.error') || $('.form-step.has-error') || document.body;
    goStepOfNode(firstErrRow);
    firstErrRow?.scrollIntoView({behavior:'smooth', block:'center'});
    const bad = firstErrRow?.querySelector('[aria-invalid="true"]') || firstErrRow?.querySelector('input,select,textarea,button');
    try{ bad?.focus(); }catch(_){}
  }

  /* ========== Toast root (auto-inject) ========== */
  function ensureToastRoot(){
    let root = document.getElementById('toast-root');
    if (!root){
      root = document.createElement('div');
      root.id = 'toast-root';
      root.style.position = 'fixed';
      root.style.inset = '0';
      root.style.pointerEvents = 'none';
      root.setAttribute('aria-live','polite');
      root.setAttribute('aria-atomic','true');
      document.body.appendChild(root);
    }
    return root;
  }
  function showToast(type, title, msg){
    const root = ensureToastRoot();
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    box.style.pointerEvents = 'auto';
    box.innerHTML = `
      <div class="toast-head">
        <span class="badge">${type === 'error' ? '오류' : type === 'warn' ? '안내' : '성공'}</span>
        <span>${title || ''}</span>
      </div>
      <div class="toast-body">${msg || ''}</div>
    `;
    root.appendChild(box);
    setTimeout(()=>box.remove(), 5200);
  }

  /* ========== Error rendering (anchor-aware) ========== */
  function clearFieldError(rowOrAnchor){
    if (!rowOrAnchor) return;
    const scope = rowOrAnchor.classList?.contains('form-row') ? rowOrAnchor : rowOrAnchor.parentElement || rowOrAnchor;
    scope.classList?.remove('error');
    scope.removeAttribute?.('data-error');
    scope.querySelectorAll?.('.field-error-msg').forEach(n => n.remove());
    scope.querySelectorAll?.('input,select,textarea').forEach(el => el.setAttribute('aria-invalid','false'));
  }
  function setFieldError(row, message, anchorEl){
    const scope = row?.classList?.contains('form-row') ? row : (anchorEl?.parentElement || row || document.body);
    clearFieldError(scope);
    scope.classList?.add('error');
    scope.setAttribute?.('data-error','true');

    const msg = document.createElement('div');
    msg.className = 'field-error-msg';
    msg.textContent = message || '필드 입력을 확인해주세요.';
    msg.style.marginTop = '6px';
    msg.style.color = '#b42318';
    msg.style.fontSize = '12.5px';

    if (anchorEl && anchorEl.insertAdjacentElement){
      anchorEl.insertAdjacentElement('afterend', msg);
    } else if (scope.querySelector?.('.input-button-row')) {
      scope.querySelector('.input-button-row').insertAdjacentElement('afterend', msg);
    } else {
      const firstField = scope.querySelector?.('input,select,textarea') || scope.firstElementChild;
      (firstField?.insertAdjacentElement ? firstField : scope).insertAdjacentElement('afterend', msg);
    }
    scope.querySelectorAll?.('input,select,textarea').forEach(el => el.setAttribute('aria-invalid','true'));
  }
  function rowOf(id){ return document.getElementById(id)?.closest('.form-row'); }
  function refreshStepFlags(){
    $$('.form-step').forEach(step => {
      const hasErr = step.querySelector('.form-row.error');
      step.classList.toggle('has-error', !!hasErr);
    });
  }
  function scrollToFirstError(){
    const first = $('.form-row.error') || $('.form-step.has-error');
    if (first) first.scrollIntoView({behavior:'smooth', block:'center'});
  }

  /* ========== Show/hide by Work Type ========== */
  const workTypeSel = document.getElementById('workType');
  const additionalOptions = document.getElementById('additionalOptions');
  const maintOptions = document.getElementById('maintOptions');
  const transferOptions = document.getElementById('transferOptions');
  const transferOptions2 = document.getElementById('transferOptions2');

  function show(el){ if (!el) return; el.classList.remove('hidden'); el.style.display = 'block'; }
  function hide(el){ if (!el) return; el.classList.add('hidden'); el.style.display = 'none'; }

  if (workTypeSel) {
    workTypeSel.addEventListener('change', function(){
      const v = this.value;
      if (v === 'SET UP' || v === 'RELOCATION') {
        show(additionalOptions);
        hide(maintOptions);
        hide(transferOptions);
        hide(transferOptions2);
      } else if (v === 'MAINT') {
        hide(additionalOptions);
        hide(maintOptions);
        show(transferOptions);
        show(transferOptions2);
      } else {
        hide(additionalOptions);
        hide(maintOptions);
        hide(transferOptions);
        hide(transferOptions2);
      }
    });
  }

  /* ========== EMS (유/무상) 권고/오버라이드 로직 ========== */
  const warrantySel = document.getElementById('warranty');
  const emsPaid = document.getElementById('ems-paid');
  const emsFree = document.getElementById('ems-free');
  const emsNull = document.getElementById('ems-null');
  const emsHint = document.getElementById('ems-hint');
  const emsAutoBtn = document.getElementById('ems-auto-btn');
  const emsResetBtn = document.getElementById('ems-reset-btn');
  const checkWarrantyBtn = document.getElementById('check-warranty');

  let emsAutoFollow = true;  // true면 warranty 변경 시 권고값 자동 반영

  function suggestedEmsFromWarranty(w){
    if (w === 'WO') return 1;         // 유상 권고 (단, 예외가 있으므로 오버라이드 가능)
    if (w === 'WI') return 0;         // 무상 권고
    return null;                      // 미결정 권고
  }
  function setEmsUI(value){
    if (!emsPaid || !emsFree || !emsNull) return;
    if (value === 1){ emsPaid.checked = true; }
    else if (value === 0){ emsFree.checked = true; }
    else { emsNull.checked = true; }
    if (emsHint){
      const txt = (value===1) ? '권고: 유상' : (value===0) ? '권고: 무상' : '권고: 미결정';
      emsHint.textContent = txt;
    }
  }
  function currentEmsValue(){
    const v = document.querySelector('input[name="emsChoice"]:checked')?.value ?? 'null';
    if (v === '1') return 1;
    if (v === '0') return 0;
    return null;
  }
  function applyEmsSuggestion(){
    if (!warrantySel) return;
    const sug = suggestedEmsFromWarranty(warrantySel.value || '');
    setEmsUI(sug);
  }
  function setAuto(on){
    emsAutoFollow = !!on;
    emsAutoBtn?.classList.toggle('active', emsAutoFollow);
    if (emsAutoFollow) applyEmsSuggestion();
  }

  // 초기: AUTO on + 현재 워런티 기준 권고반영
  setAuto(true);

  // warranty 변경 시 (AUTO일 때만) 권고 재적용
  warrantySel?.addEventListener('change', () => {
    if (emsAutoFollow) applyEmsSuggestion();
  });

  // CHECK 버튼(설비 조회) 후에도 업데이트(AUTO 중일 때)
  checkWarrantyBtn?.addEventListener('click', () => {
    setTimeout(() => { if (emsAutoFollow) applyEmsSuggestion(); }, 0);
  });

  // 수동으로 EMS 라디오를 건드리면 AUTO 해제
  document.querySelectorAll('input[name="emsChoice"]').forEach(r => {
    r.addEventListener('change', () => {
      setAuto(false);
    });
  });

  // AUTO 버튼: 다시 워런티를 따라가며 권고값 반영
  emsAutoBtn?.addEventListener('click', () => {
    setAuto(true);
  });

  // 권고로 되돌리기: AUTO 상태와 무관하게 권고값만 한 번 반영
  emsResetBtn?.addEventListener('click', () => {
    applyEmsSuggestion();
  });

  /* ========== Preview / Paste Modals (class .show) ========== */
  const overlay = document.getElementById('modal-overlay');
  const previewModal = document.getElementById('preview-modal');
  const previewBtn = document.getElementById('preview-save');
  const confirmSaveBtn = document.getElementById('confirm-save');
  const cancelSaveBtn = document.getElementById('cancel-save');
  const hiddenSubmit = document.getElementById('save-button');

  function openPreview(){
    overlay?.classList.add('show');
    previewModal?.classList.add('show');
    try{ confirmSaveBtn?.focus(); }catch(_){}
  }
  function closePreview(){
    previewModal?.classList.remove('show');
    overlay?.classList.remove('show');
  }
  function setText(id, text){
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }
  function getVal(id){ return document.getElementById(id)?.value || ''; }

  if (previewBtn){
    previewBtn.addEventListener('click', () => {
      // 미리보기는 입력값 그대로 표시(검증/제출은 confirm에서)
      setText('preview-task_date', getVal('task_date'));
      setText('preview-start_time', getVal('start_time'));
      setText('preview-end_time',   getVal('end_time'));
      setText('preview-task_name',  getVal('task_name'));
      setText('preview-equipment_name', getVal('equipment_name'));
      setText('preview-setupItem',  document.getElementById('additionalWorkType')?.value || '');
      setText('preview-transferItem', document.getElementById('transferOptionSelect')?.value || '');

      const workerTokens = [];
      document.querySelectorAll('.task-man-container').forEach((wrap) => {
        const t = wrap.querySelector('.task-man-input');
        const s = wrap.querySelector('.task-man-select');
        const name = t ? t.value.trim() : '';
        const role = s ? s.value : '';
        if (name) workerTokens.push(`${name}${role ? ` (${role})` : ''}`);
      });
      const uniqueWorkers = [...new Set(workerTokens)].join(', ');
      setText('preview-task_man', uniqueWorkers);

      // EMS 표시
      const emsTxt = (currentEmsValue()===1) ? '유상' : (currentEmsValue()===0) ? '무상' : '미결정';
      setText('preview-ems', emsTxt);

      openPreview();
    });
  }
  confirmSaveBtn?.addEventListener('click', () => {
    closePreview();
    hiddenSubmit?.click();
  });
  cancelSaveBtn?.addEventListener('click', closePreview);

  /* PASTE modal (optional) */
  const pasteBtn = document.getElementById('paste-button');
  const popup = document.getElementById('popup');
  const pasteCancel = document.getElementById('paste-cancel');
  const pasteSubmit = document.getElementById('paste-submit');
  const pasteTextarea = document.getElementById('paste-textarea');
  const linesEl = document.getElementById('paste-lines');
  const charsEl = document.getElementById('paste-chars');

  function updatePasteCounters(){
    if (!pasteTextarea) return;
    const v = pasteTextarea.value || '';
    const lines = v ? v.split(/\r?\n/).length : 0;
    if (linesEl) linesEl.textContent = String(lines);
    if (charsEl) charsEl.textContent = String(v.length);
  }
  function openPaste(){
    overlay?.classList.add('show');
    popup?.classList.add('show');
    requestAnimationFrame(()=> pasteTextarea?.focus());
    updatePasteCounters();
  }
  function closePaste(){
    popup?.classList.remove('show');
    overlay?.classList.remove('show');
  }
  pasteTextarea?.addEventListener('input', updatePasteCounters);
  pasteBtn?.addEventListener('click', openPaste);
  pasteCancel?.addEventListener('click', closePaste);
  pasteSubmit?.addEventListener('click', closePaste);

  // ESC / overlay click -> close whichever open
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

  /* ========== Step 1 — INFO editable toggle ========== */
  const infoTextarea = document.getElementById('info');
  const editInfoBtn  = document.getElementById('edit-info');
  const saveInfoBtn  = document.getElementById('save-info');
  saveInfoBtn?.classList.add('hidden');
  let pristineInfo = infoTextarea ? infoTextarea.value : '';

  function updateSaveInfoVisibility(){
    if (!infoTextarea || !saveInfoBtn) return;
    const hasContent = infoTextarea.value.trim().length > 0;
    const editable   = !infoTextarea.hasAttribute('disabled');
    const changed    = infoTextarea.value !== pristineInfo;
    saveInfoBtn.classList.toggle('hidden', !(hasContent && editable && changed));
  }
  editInfoBtn?.addEventListener('click', () => {
    if (!infoTextarea) return;
    if (infoTextarea.hasAttribute('disabled')) {
      infoTextarea.removeAttribute('disabled');
      infoTextarea.focus();
    } else {
      infoTextarea.setAttribute('disabled','disabled');
    }
    updateSaveInfoVisibility();
  });
  infoTextarea?.addEventListener('input', updateSaveInfoVisibility);
  saveInfoBtn?.addEventListener('click', () => {
    if (!infoTextarea) return;
    pristineInfo = infoTextarea.value;
    infoTextarea.setAttribute('disabled','disabled');
    updateSaveInfoVisibility();
  });

  /* ========== Validation ========== */
  const getV = id => document.getElementById(id)?.value ?? '';
  function invalidSelectValue(id){
    const el = document.getElementById(id);
    if (!el) return false;
    el.classList.add('option-select');
    return (el.value === 'SELECT' || el.value === '');
  }
  function isTimeStr(s){ return /^\d{2}:\d{2}(:\d{2})?$/.test(s || ''); }
  function toSec(s){
    if (!s) return 0;
    const [hh, mm, ss='0'] = s.split(':').map(Number);
    return (hh*3600 + mm*60 + ss);
  }

  function validateStep1(){
    const errors = [];
    clearFieldError(rowOf('equipment_name'));
    clearFieldError(rowOf('group'));
    clearFieldError(rowOf('site'));
    clearFieldError(rowOf('line'));
    clearFieldError(rowOf('equipment_type'));
    clearFieldError(rowOf('warranty'));

    if (!getV('equipment_name').trim()){
      const wrap = rowOf('equipment_name');
      const anchor = wrap?.querySelector('.input-button-row') || document.getElementById('equipment_name');
      setFieldError(wrap, 'EQ NAME을 입력하세요.', anchor);
      errors.push(['equipment_name']);
    }
    if (invalidSelectValue('group'))          { setFieldError(rowOf('group'),'GROUP을 선택하세요.', document.getElementById('group')); errors.push(['group']); }
    if (invalidSelectValue('site'))           { setFieldError(rowOf('site'),'SITE를 선택하세요.', document.getElementById('site')); errors.push(['site']); }
    if (invalidSelectValue('line'))           { setFieldError(rowOf('line'),'LINE을 선택하세요.', document.getElementById('line')); errors.push(['line']); }
    if (invalidSelectValue('equipment_type')) { setFieldError(rowOf('equipment_type'),'EQ TYPE을 선택하세요.', document.getElementById('equipment_type')); errors.push(['equipment_type']); }
    if (invalidSelectValue('warranty'))       { setFieldError(rowOf('warranty'),'WARRANTY를 선택하세요.', document.getElementById('warranty')); errors.push(['warranty']); }

    return errors.length === 0;
  }

  function validateStep2(){
    const errors = [];
    clearFieldError(rowOf('workType'));
    clearFieldError(rowOf('additionalWorkType'));
    clearFieldError(rowOf('maintOptionSelect'));
    clearFieldError(rowOf('transferOptionSelect'));
    clearFieldError(rowOf('workType2'));

    if (invalidSelectValue('workType')) {
      setFieldError(rowOf('workType'),'WORK TYPE을 선택하세요.', document.getElementById('workType'));
      errors.push(['workType']);
    }
    return errors.length === 0;
  }

  function validateStep3(){
    const errors = [];
    const manGroup = document.getElementById('task-mans-container');
    const rows = $$('.task-man-container', manGroup);
    let atLeastOne = false;
    rows.forEach(wrap => {
      const name = $('.task-man-input', wrap)?.value.trim() || '';
      clearFieldError(wrap.closest('.form-row') || manGroup.closest('.form-row'));
      if (name) atLeastOne = true;
    });
    if (!atLeastOne){
      const row = manGroup.closest('.form-row');
      setFieldError(row, '최소 1명 이상의 작업자를 입력하세요.', manGroup);
      errors.push(['task-mans-container']);
    }

    clearFieldError(rowOf('SOP'));
    clearFieldError(rowOf('tsguide'));
    if (invalidSelectValue('SOP'))     { setFieldError(rowOf('SOP'),'SOP 사용여부를 선택하세요.', document.getElementById('SOP')); errors.push(['SOP']); }
    if (invalidSelectValue('tsguide')) { setFieldError(rowOf('tsguide'),'TS GUIDE 사용여부를 선택하세요.', document.getElementById('tsguide')); errors.push(['tsguide']); }

    return errors.length === 0;
  }

  function validateStep4(){
    const errors = [];
    clearFieldError(rowOf('task_date'));
    clearFieldError(rowOf('start_time'));
    clearFieldError(rowOf('end_time'));
    clearFieldError(rowOf('noneTime'));
    clearFieldError(rowOf('moveTime'));

    const d  = getV('task_date');
    const st = getV('start_time');
    const et = getV('end_time');
    const noneTime = getV('noneTime');
    const moveTime = getV('moveTime');

    if (!d) setFieldError(rowOf('task_date'),'WORK DATE를 입력하세요.', document.getElementById('task_date')), errors.push(['task_date']);
    if (!isTimeStr(st)) { setFieldError(rowOf('start_time'),'START TIME 형식이 올바르지 않습니다 (HH:MM).', document.getElementById('start_time')); errors.push(['start_time']); }
    if (!isTimeStr(et)) { setFieldError(rowOf('end_time'),'END TIME 형식이 올바르지 않습니다 (HH:MM).', document.getElementById('end_time')); errors.push(['end_time']); }

    if (isTimeStr(st) && isTimeStr(et)){
      if (toSec(et) <= toSec(st)){
        setFieldError(rowOf('end_time'),'END TIME은 START TIME보다 늦어야 합니다.', document.getElementById('end_time'));
        errors.push(['end_time']);
      }
    }

    if (noneTime && Number(noneTime) < 0){
      setFieldError(rowOf('noneTime'),'NONE TIME은 0 이상이어야 합니다.', document.getElementById('noneTime'));
      errors.push(['noneTime']);
    }
    if (moveTime && Number(moveTime) < 0){
      setFieldError(rowOf('moveTime'),'MOVE TIME은 0 이상이어야 합니다.', document.getElementById('moveTime'));
      errors.push(['moveTime']);
    }

    return errors.length === 0;
  }

  function validateStep5(){
    const errors = [];
    clearFieldError(rowOf('task_name'));
    clearFieldError(rowOf('status'));
    const actsRow    = document.getElementById('task-descriptions-container')?.closest('.form-row');
    const causesRow  = document.getElementById('task-causes-container')?.closest('.form-row');
    const resultsRow = document.getElementById('task-results-container')?.closest('.form-row');
    clearFieldError(actsRow); clearFieldError(causesRow); clearFieldError(resultsRow);

    const name = getV('task_name').trim();
    const status = getV('status').trim();
    if (!name){ setFieldError(rowOf('task_name'),'TITLE을 입력하세요.', document.getElementById('task_name')); errors.push(['task_name']); }
    if (!status){ setFieldError(rowOf('status'),'STATUS를 입력하세요.', document.getElementById('status')); errors.push(['status']); }

    const joinValues = (cls) => $$('.'+cls).map(el => (el.value || '').trim()).filter(Boolean).join('<br>');
    const acts    = joinValues('task-description-input');
    const causes  = joinValues('task-cause-input');
    const results = joinValues('task-result-input');

    if (!acts){ setFieldError(actsRow,'ACTION을 최소 1개 이상 입력하세요.', document.getElementById('task-descriptions-container')); errors.push(['task-descriptions-container']); }
    if (!causes){ setFieldError(causesRow,'CAUSE를 최소 1개 이상 입력하세요.', document.getElementById('task-causes-container')); errors.push(['task-causes-container']); }
    if (!results){ setFieldError(resultsRow,'RESULT를 최소 1개 이상 입력하세요.', document.getElementById('task-results-container')); errors.push(['task-results-container']); }

    function checkLen(val, max, id, label){
      if (val && val.length > max){
        setFieldError(rowOf(id), `${label}는 ${max}자 이내로 입력하세요. (현재 ${val.length}자)`, document.getElementById(id));
        errors.push([id]);
      }
    }
    checkLen(name, 255, 'task_name','TITLE');
    checkLen(status,255, 'status',   'STATUS');

    return errors.length === 0;
  }

  function validateByStep(step){
    switch(String(step)){
      case '1': return validateStep1();
      case '2': return validateStep2();
      case '3': return validateStep3();
      case '4': return validateStep4();
      case '5': return validateStep5();
      default:  return true;
    }
  }

  function clearAllErrors(){
    $$('.form-row.error').forEach(r => clearFieldError(r));
    $$('.form-step').forEach(s => s.classList.remove('has-error'));
  }

  function validateAll(){
    clearAllErrors();
    const ok1 = validateStep1();
    const ok2 = validateStep2();
    const ok3 = validateStep3();
    const ok4 = validateStep4();
    const ok5 = validateStep5();
    refreshStepFlags();
    if (!(ok1 && ok2 && ok3 && ok4 && ok5)){
      showToast('error','저장 실패','입력값을 다시 확인해주세요. 잘못된 필드가 표시됩니다.');
      goFirstErrorStep();
      return false;
    }
    return true;
  }

  /* ========== Guard step navigation ========== */
  $$('.next-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cur = activeStepEl();
      if (!cur) return;
      const step = cur.getAttribute('data-step');
      if (!validateByStep(step)){
        e.stopImmediatePropagation();
        e.preventDefault();
        refreshStepFlags();
        goFirstErrorStep();
      } else {
        const next = Number(step) + 1;
        goStep(next);
      }
    }, { capture:true });
  });
  $$('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = activeStepEl(); if (!cur) return;
      const step = Number(cur.getAttribute('data-step'));
      goStep(step-1);
    });
  });

  /* ========== Submit ========== */
  const form = document.getElementById('worklogForm');
  form?.addEventListener('submit', async (e) => {
    if (!validateAll()){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    try{
      const now = new Date();
      const before11 = now.getHours() < 11; // 기존 로직: 11시 이전 경고
      const isToday = (getV('task_date') || '') === getTodayDate();
      if (before11 && isToday){
        const yes = confirm('현재 시간이 오전 11시 이전인데, 작업 날짜를 오늘로 선택하셨습니다. 오늘 진행한 작업이 맞으신가요?');
        if (!yes){
          e.preventDefault();
          e.stopImmediatePropagation();
          goStep(4);
          document.getElementById('task_date')?.focus();
          return;
        }
      }
    }catch(_){}

    e.preventDefault(); // axios로 제출

    const getVal = (id) => document.getElementById(id)?.value || '';

    const task_name = getVal('task_name');
    const status    = getVal('status');
    const taskResults = Array.from(document.getElementsByClassName('task-result-input')).map(el => el.value).join('<br>');
    const taskCauses  = Array.from(document.getElementsByClassName('task-cause-input')).map(el => el.value).join('<br>');

    if (task_name.length > 255){ showToast('error','제목 길이 초과',`TITLE은 255자 이내로 입력해 주세요. 현재 ${task_name.length}자입니다.`); goStep(5); return; }
    if (taskResults.length > 255){ showToast('error','RESULT 길이 초과',`RESULT는 255자 이내로 입력해 주세요. 현재 ${taskResults.length}자입니다.`); goStep(5); return; }
    if (taskCauses.length  > 255){ showToast('error','CAUSE 길이 초과',`CAUSE는 255자 이내로 입력해 주세요. 현재 ${taskCauses.length}자입니다.`); goStep(5); return; }
    if (status.length      > 255){ showToast('error','STATUS 길이 초과',`STATUS는 255자 이내로 입력해 주세요. 현재 ${status.length}자입니다.`); goStep(5); return; }

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

    function isTimeStr(s){ return /^\d{2}:\d{2}(:\d{2})?$/.test(s || ''); }
    function toSec(s){ if (!s) return 0; const [hh,mm,ss='0']=s.split(':').map(Number); return hh*3600+mm*60+ss; }

    if (!isTimeStr(start_time) || !isTimeStr(end_time) || toSec(end_time) <= toSec(start_time)){
      setFieldError(rowOf('end_time'),'END TIME은 START TIME보다 늦어야 합니다.', document.getElementById('end_time'));
      refreshStepFlags();
      showToast('error','시간 오류','시간 입력을 다시 확인해주세요.');
      goStep(4);
      return;
    }

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

    // EMS 경고(선택): 미결정으로 올리면 안내만 띄움(저장은 허용)
    if (currentEmsValue() === null) {
      showToast('warn','EMS 미결정','워런티 기준 권고와 다를 수 있습니다. 필요 시 유상/무상을 명시 선택하세요.');
    }

    try{
      const response = await axios.post(`http://3.37.73.151:3001/approval/work-log/submit`, {
        task_name, task_result: taskResults, task_cause: taskCauses, task_man: taskMans,
        task_description: taskDescriptions, task_date, start_time, end_time, none_time: noneTime, move_time: moveTime,
        group, site, SOP, tsguide, warranty, line, equipment_type, equipment_name, workType, workType2,
        setupItem, maintItem, transferItem, task_maint, status,
        ems: currentEmsValue() // 1(유상) | 0(무상) | null(미결정)
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': localStorage.getItem('x-access-token')
        }
      });

      if (response.status === 201) {
        showToast('success','결재 요청','결재 대기 등록 완료(승인 후 저장됩니다).');
      }
    }catch(error){
      let title = '저장 실패';
      let msg   = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')){
        title = '네트워크 지연';
        msg   = '서버 응답이 지연되고 있습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도하세요.';
      }
      else if (!error.response){
        title = '네트워크 오류';
        msg   = '서버에 연결하지 못했습니다. 인터넷 연결 또는 서버 상태를 확인하세요.';
      }
      else{
        const { status, data } = error.response;
        if (status === 401){
          title = '인증 만료'; msg = '로그인이 만료되었습니다. 다시 로그인 후 저장하세요.';
        } else if (status === 413){
          title = '본문 크기 초과'; msg = '본문(텍스트)이 너무 큽니다. ACTION/CAUSE/RESULT를 나누어 저장해주세요.';
        } else if (status === 409){
          title = '중복 또는 충돌'; msg = (data?.message) || '동일한 작업 이력이 이미 존재할 수 있습니다. 날짜/제목을 확인하세요.';
        } else if (status === 404){
          title = '엔드포인트 없음'; msg = '서버 저장 경로를 찾지 못했습니다. 관리자에게 문의해주세요. (/approval/work-log/submit)';
        } else if (status === 422 || status === 400){
          title = '유효성 오류'; msg = (data?.message || data?.error) || '입력값을 다시 확인해주세요.';
        } else if (status >= 500){
          title = '서버 오류'; msg = '서버 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.';
        } else {
          msg = data?.message || data?.error || msg;
        }

        if (status === 400 && (data?.error||'').includes('제출자는 task_man')){
          const manGroup = document.getElementById('task-mans-container');
          const row = manGroup?.closest('.form-row');
          setFieldError(row, data.error, manGroup);
          refreshStepFlags();
          goStep(3);
          manGroup?.scrollIntoView({behavior:'smooth', block:'center'});
        }

        if (Array.isArray(data?.errors)){
          data.errors.forEach(err => {
            const id = err.field;
            const message = err.message || '입력값을 확인해주세요.';
            const el = id ? document.getElementById(id) : null;
            const row = el ? rowOf(id) : null;
            if (row) setFieldError(row, message, el || row);
          });
          refreshStepFlags();
          goFirstErrorStep();
        }
      }

      showToast('error', title, msg);
    }
  }, { capture:true });

  /* ========== initial bootstrap ========== */
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

  /* ========== sign-out shortcut ========== */
  const signOutButton = document.querySelector('#sign-out');
  signOutButton?.addEventListener('click', function () {
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('user-role');
    alert('로그아웃 되었습니다.');
    window.location.replace('./signin.html');
  });

  /* ========== Mobile menu toggle (robust) ========== */
  (function fixMenuToggle(){
    const menuBarSel = 'nav .menu-bar';
    const menuBtnSel = 'nav .menu-btn';
    const menuBar = document.querySelector(menuBarSel);
    const oldBtn  = document.querySelector(menuBtnSel);
    if (!menuBar || !oldBtn) return;

    const menuBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(menuBtn, oldBtn);

    menuBar.classList.remove('open');
    menuBar.style.overflow = 'hidden';
    menuBar.style.maxHeight = '0px';
    menuBtn.setAttribute('aria-expanded','false');
    menuBtn.setAttribute('aria-controls','menu-bar');

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

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuBar.classList.contains('open');
      setOpen(!isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!menuBar.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (menuBar.classList.contains('open')) {
        menuBar.style.maxHeight = menuBar.scrollHeight + 'px';
      }
    });
  })();
});
