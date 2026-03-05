/**
 * worklog_new.js
 * 새 스키마(wl_event / wl_worker / wl_work_item / wl_part) 대응 프론트엔드
 * 기존 worklog.js의 스텝·EMS·유효성·PASTE·미리보기 흐름을 그대로 계승
 */

document.addEventListener('DOMContentLoaded', async () => {

  const API = 'http://3.37.73.151:3001'; // 서버 주소

  /* ── 공통 헬퍼 ──────────────────────────────────────────────────────── */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const getV = id => (document.getElementById(id)?.value || '').trim();

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

  function getTodayDate() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  const taskDateEl = document.getElementById('task_date');
  if (taskDateEl && !taskDateEl.value) taskDateEl.value = getTodayDate();

  /* ── Enter 키 제출 방지 ─────────────────────────────────────────────── */
  $('#worklogForm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement?.tagName !== 'TEXTAREA') e.preventDefault();
  });


  /* ══════════════════════════════════════════════════════════════════════
     STEP 네비게이션
  ══════════════════════════════════════════════════════════════════════ */
  let currentStep = 1;
  const TOTAL_STEPS = 5;

  function goStep(n) {
    const cur = $(`.form-step[data-step="${currentStep}"]`);
    const nxt = $(`.form-step[data-step="${n}"]`);
    if (!nxt || cur === nxt) return;
    cur?.classList.remove('active');
    nxt.classList.add('active');
    currentStep = n;
    updateStepIndicator();
    window.scrollTo(0, 0);
  }

  function updateStepIndicator() {
    $$('.step-dot').forEach(dot => {
      const t = Number(dot.dataset.target);
      dot.classList.toggle('active',    t === currentStep);
      dot.classList.toggle('completed', t < currentStep);
    });
  }

  $$('.next-step').forEach(btn => btn.addEventListener('click', () => {
    if (validateStep(currentStep)) goStep(currentStep + 1);
  }));
  $$('.prev-step').forEach(btn => btn.addEventListener('click', () => goStep(currentStep - 1)));


  /* ══════════════════════════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════════════════════════ */
  function showToast(type, title, msg) {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      Object.assign(root.style, { position:'fixed', inset:'0', pointerEvents:'none', zIndex:'9999' });
      document.body.appendChild(root);
    }
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    box.style.pointerEvents = 'auto';
    box.innerHTML = `<div class="toast-head"><span class="badge">${type==='error'?'오류':type==='warn'?'안내':'성공'}</span> ${title||''}</div><div class="toast-body">${msg||''}</div>`;
    root.appendChild(box);
    setTimeout(() => box.remove(), 5200);
  }


  /* ══════════════════════════════════════════════════════════════════════
     EMS 자동 권고 (기존 로직 그대로)
  ══════════════════════════════════════════════════════════════════════ */
  let emsManualOverride = false;
  const emsHint = document.getElementById('ems-hint');

  function recommendEms() {
    const warranty = getV('warranty');
    if (!warranty || warranty === 'SELECT') return null;
    return warranty === 'WO' ? 1 : 0;
  }

  function applyEmsRecommend(force = false) {
    const rec = recommendEms();
    if (rec === null) { emsHint && (emsHint.textContent = '권고: -'); return; }
    emsHint && (emsHint.textContent = `권고: ${rec === 1 ? '유상' : '무상'}`);
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


  /* ══════════════════════════════════════════════════════════════════════
     Step 2 — 동적 표시 / 마스터 데이터 로드
  ══════════════════════════════════════════════════════════════════════ */
  let workItemMaster = [];  // { id, item_name }
  let partMaster     = [];  // { id, part_name }

  // 선택된 항목들 (배열로 관리)
  const selectedWorkItems = []; // { master_id?, item_name_free?, label }
  const selectedParts     = []; // { master_id?, part_name_free?, qty, label }

  async function loadMasters(eqType) {
    if (!eqType || eqType === 'SELECT') return;
    try {
      const [wi, p] = await Promise.all([
        axios.get(`${API}/wl/master/work-items?equipment_type=${encodeURIComponent(eqType)}`, { headers: authHeaders() }),
        axios.get(`${API}/wl/master/parts?equipment_type=${encodeURIComponent(eqType)}`,       { headers: authHeaders() }),
      ]);
      workItemMaster = wi.data.items || [];
      partMaster     = p.data.parts  || [];
      rebuildWorkItemSelect();
      rebuildPartSelect();
    } catch (e) {
      console.warn('마스터 로드 실패:', e.message);
    }
  }

  function rebuildWorkItemSelect() {
    const sel = document.getElementById('work-item-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 항목 선택 --</option>';
    workItemMaster.forEach(i => {
      const opt = document.createElement('option');
      opt.value = i.id;
      opt.textContent = i.item_name;
      sel.appendChild(opt);
    });
  }

  function rebuildPartSelect() {
    const sel = document.getElementById('part-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 파트 선택 --</option>';
    partMaster.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.part_name;
      sel.appendChild(opt);
    });
  }

  // EQ TYPE 변경 → 마스터 로드
  document.getElementById('equipment_type')?.addEventListener('change', async function() {
    selectedWorkItems.length = 0;
    selectedParts.length = 0;
    renderChips('work-items-container', selectedWorkItems);
    renderChips('parts-container', selectedParts);
    await loadMasters(this.value);
  });

  // WORK TYPE 변경 → 하위 옵션 표시/숨김
  document.getElementById('work_type')?.addEventListener('change', function() {
    const isSetup  = this.value === 'SET UP' || this.value === 'RELOCATION';
    const isMaint  = this.value === 'MAINT';

    toggleRow('setup-item-row',    isSetup);
    toggleRow('work-type2-row',    isMaint);
    toggleRow('work-items-row',    isMaint);
    toggleRow('parts-row',         isMaint);
  });

  function toggleRow(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !show);
  }

  /* 칩(태그) 렌더링 */
  function renderChips(containerId, arr) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    arr.forEach((item, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `${item.label} <button type="button" data-idx="${idx}">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        arr.splice(idx, 1);
        renderChips(containerId, arr);
      });
      container.appendChild(chip);
    });
  }

  // 작업 항목 추가
  document.getElementById('add-work-item')?.addEventListener('click', () => {
    const sel = document.getElementById('work-item-select');
    const id  = sel?.value;
    if (!id) return;
    const master = workItemMaster.find(i => String(i.id) === String(id));
    if (!master) return;
    if (selectedWorkItems.find(x => x.master_id === master.id)) return;
    selectedWorkItems.push({ master_id: master.id, label: master.item_name });
    renderChips('work-items-container', selectedWorkItems);
    sel.value = '';
  });

  document.getElementById('add-work-item-free')?.addEventListener('click', () => {
    const val = document.getElementById('work-item-free')?.value.trim();
    if (!val) return;
    if (selectedWorkItems.find(x => x.item_name_free === val)) return;
    selectedWorkItems.push({ item_name_free: val, label: val });
    renderChips('work-items-container', selectedWorkItems);
    document.getElementById('work-item-free').value = '';
  });

  // 파트 추가
  document.getElementById('add-part')?.addEventListener('click', () => {
    const sel = document.getElementById('part-select');
    const id  = sel?.value;
    if (!id) return;
    const master = partMaster.find(p => String(p.id) === String(id));
    if (!master) return;
    if (selectedParts.find(x => x.master_id === master.id)) return;
    selectedParts.push({ master_id: master.id, label: master.part_name, qty: 1 });
    renderChips('parts-container', selectedParts);
    sel.value = '';
  });

  document.getElementById('add-part-free')?.addEventListener('click', () => {
    const val = document.getElementById('part-free')?.value.trim();
    if (!val) return;
    if (selectedParts.find(x => x.part_name_free === val)) return;
    selectedParts.push({ part_name_free: val, label: val, qty: 1 });
    renderChips('parts-container', selectedParts);
    document.getElementById('part-free').value = '';
  });


  /* ══════════════════════════════════════════════════════════════════════
     Step 3 — 작업자 추가/삭제
  ══════════════════════════════════════════════════════════════════════ */
  document.getElementById('add-worker')?.addEventListener('click', () => {
    const container = document.getElementById('task-mans-container');
    const addBtn    = document.getElementById('add-worker');
    const div = document.createElement('div');
    div.className = 'task-man-container';
    div.innerHTML = `
      <input type="text" class="task-man-input" placeholder="이름" required>
      <select class="task-man-role">
        <option value="main">main</option>
        <option value="support">support</option>
      </select>
      <button type="button" class="btn-remove remove-worker">−</button>
    `;
    div.querySelector('.remove-worker').addEventListener('click', () => div.remove());
    container.insertBefore(div, addBtn);
    updateFirstWorkerRemoveBtn();
  });

  function updateFirstWorkerRemoveBtn() {
    const btns = $$('.remove-worker');
    btns.forEach((b, i) => { b.disabled = i === 0 && btns.length === 1; });
  }

  $('#task-mans-container')?.addEventListener('click', e => {
    if (e.target.classList.contains('remove-worker')) {
      e.target.closest('.task-man-container')?.remove();
      updateFirstWorkerRemoveBtn();
    }
  });


  /* ══════════════════════════════════════════════════════════════════════
     Step 4 — 실작업 시간 계산 미리보기
  ══════════════════════════════════════════════════════════════════════ */
  function calcAndShowDuration() {
    const s = getV('start_time'), e = getV('end_time');
    const none = Number(getV('noneTime')) || 0;
    const move = Number(getV('moveTime')) || 0;
    const el = document.getElementById('calc-duration');
    if (!el) return;
    if (!s || !e) { el.textContent = '—'; return; }
    const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const total = toMin(e) - toMin(s) - none - move;
    if (total <= 0) { el.textContent = '0분'; return; }
    el.textContent = `${Math.floor(total/60)}시간 ${total%60}분`;
  }

  ['start_time','end_time','noneTime','moveTime'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', calcAndShowDuration)
  );


  /* ══════════════════════════════════════════════════════════════════════
     Step 5 — 동적 textarea (ACTION / CAUSE / RESULT)
  ══════════════════════════════════════════════════════════════════════ */
  function addDynField(containerId, itemClass, inputClass, removeClass, addBtnId) {
    document.getElementById(addBtnId)?.addEventListener('click', () => {
      const c = document.getElementById(containerId);
      const btn = document.getElementById(addBtnId);
      const div = document.createElement('div');
      div.className = itemClass;
      div.innerHTML = `<textarea class="${inputClass}"></textarea><button type="button" class="btn-remove ${removeClass}">−</button>`;
      div.querySelector(`.${removeClass}`).addEventListener('click', () => div.remove());
      c.insertBefore(div, btn);
    });
  }
  addDynField('task-descriptions-container','task-desc-item','task-description-input','remove-desc','add-desc');
  addDynField('task-causes-container',      'task-cause-item','task-cause-input','remove-cause','add-cause');
  addDynField('task-results-container',     'task-result-item','task-result-input','remove-result','add-result');


  /* ══════════════════════════════════════════════════════════════════════
     유효성 검사 (스텝별)
  ══════════════════════════════════════════════════════════════════════ */
  function validateStep(step) {
    switch (step) {
      case 1: {
        if (!getV('equipment_name')) { showToast('error','입력 오류','EQ NAME을 입력하세요.'); return false; }
        if (getV('group') === 'SELECT') { showToast('error','입력 오류','GROUP을 선택하세요.'); return false; }
        if (getV('site')  === 'SELECT') { showToast('error','입력 오류','SITE를 선택하세요.'); return false; }
        if (getV('equipment_type') === 'SELECT') { showToast('error','입력 오류','EQ TYPE을 선택하세요.'); return false; }
        if (getV('warranty') === 'SELECT') { showToast('error','입력 오류','WARRANTY를 선택하세요.'); return false; }
        if (currentEms() === null) { showToast('error','입력 오류','EMS(유상/무상)를 선택하세요.'); return false; }
        return true;
      }
      case 2: {
        if (getV('work_type') === 'SELECT') { showToast('error','입력 오류','WORK TYPE을 선택하세요.'); return false; }
        return true;
      }
      case 3: {
        const names = $$('.task-man-input').map(el => el.value.trim()).filter(Boolean);
        if (!names.length) { showToast('error','입력 오류','작업자를 1명 이상 입력하세요.'); return false; }
        return true;
      }
      case 4: {
        const s = getV('start_time'), e = getV('end_time');
        if (!s || !e) { showToast('error','시간 오류','시작/종료 시간을 입력하세요.'); return false; }
        const toSec = t => { const [h,m] = t.split(':').map(Number); return h*3600+m*60; };
        if (toSec(e) <= toSec(s)) { showToast('error','시간 오류','종료 시간은 시작 시간보다 늦어야 합니다.'); return false; }
        return true;
      }
      case 5: {
        if (!getV('task_name')) { showToast('error','입력 오류','TITLE을 입력하세요.'); return false; }
        return true;
      }
      default: return true;
    }
  }


  /* ══════════════════════════════════════════════════════════════════════
     미리보기 모달
  ══════════════════════════════════════════════════════════════════════ */
  document.getElementById('preview-save')?.addEventListener('click', () => {
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (!validateStep(i)) { goStep(i); return; }
    }
    // 오전 11시 이전 + 오늘 날짜 경고 (기존 로직 유지)
    const now = new Date();
    if (now.getHours() < 11 && getV('task_date') === getTodayDate()) {
      if (!confirm('현재 시간이 오전 11시 이전입니다. 오늘 작업이 맞습니까?')) { goStep(4); return; }
    }

    // 미리보기 채우기
    const workers = $$('.task-man-container').map(c => {
      const name = c.querySelector('.task-man-input')?.value.trim() || '';
      const role = c.querySelector('.task-man-role')?.value || 'main';
      return `${name}(${role})`;
    }).filter(Boolean);

    document.getElementById('pv-date').textContent     = getV('task_date');
    document.getElementById('pv-time').textContent     = `${getV('start_time')} ~ ${getV('end_time')} (none:${getV('noneTime')} move:${getV('moveTime')})`;
    document.getElementById('pv-ems').textContent      = currentEms() === 1 ? '유상' : '무상';
    document.getElementById('pv-site').textContent     = `${getV('site')} / ${getV('line')}`;
    document.getElementById('pv-eqname').textContent   = getV('equipment_name');
    document.getElementById('pv-eqtype').textContent   = getV('equipment_type');
    document.getElementById('pv-worktype').textContent = `${getV('work_type')} / ${getV('work_type2') || getV('setup_item') || '-'}`;
    document.getElementById('pv-workitems').textContent = selectedWorkItems.map(x=>x.label).join(', ') || '-';
    document.getElementById('pv-parts').textContent    = selectedParts.map(x=>x.label).join(', ') || '-';
    document.getElementById('pv-workers').textContent  = workers.join(', ');
    document.getElementById('pv-title').textContent    = getV('task_name');
    document.getElementById('pv-rework').textContent   = document.getElementById('is-rework')?.checked ? '✅ Rework' : '-';

    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('preview-modal').style.display = 'block';
  });

  document.getElementById('cancel-save')?.addEventListener('click', closePreview);
  document.getElementById('modal-overlay')?.addEventListener('click', closePreview);
  function closePreview() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('preview-modal').style.display = 'none';
  }


  /* ══════════════════════════════════════════════════════════════════════
     최종 제출
  ══════════════════════════════════════════════════════════════════════ */
  document.getElementById('confirm-save')?.addEventListener('click', async () => {
    closePreview();

    const workers = $$('.task-man-container').map(c => ({
      name: c.querySelector('.task-man-input')?.value.trim() || '',
      role: c.querySelector('.task-man-role')?.value || 'main',
    })).filter(w => w.name);

    const task_description = $$('.task-description-input').map(el => el.value.trim()).filter(Boolean).join('<br>');
    const task_cause       = $$('.task-cause-input').map(el => el.value.trim()).filter(Boolean).join('<br>');
    const task_result      = $$('.task-result-input').map(el => el.value.trim()).filter(Boolean).join('<br>');

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
      work_type:        getV('work_type'),
      work_type2:       getV('work_type2') || null,
      setup_item:       getV('setup_item') || null,
      status:           getV('status'),
      task_description,
      task_cause,
      task_result,
      SOP:              getV('SOP'),
      tsguide:          getV('tsguide'),
      start_time:       getV('start_time') ? getV('start_time')+':00' : null,
      end_time:         getV('end_time')   ? getV('end_time')  +':00' : null,
      none_time:        Number(getV('noneTime')) || 0,
      move_time:        Number(getV('moveTime')) || 0,
      is_rework:        document.getElementById('is-rework')?.checked ? 1 : 0,
      workers,
      workItems: selectedWorkItems.map(({ label, ...rest }) => rest),
      parts:     selectedParts.map(({ label, ...rest }) => rest),
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
      showToast('error', title, msg);
    }
  });

  document.getElementById('result-ok')?.addEventListener('click', () => {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('result-modal').style.display  = 'none';
    $('#worklogForm')?.reset();
    selectedWorkItems.length = 0;
    selectedParts.length = 0;
    renderChips('work-items-container', selectedWorkItems);
    renderChips('parts-container', selectedParts);
    goStep(1);
  });


  /* ══════════════════════════════════════════════════════════════════════
     PASTE 팝업 — 기존 paste.js 와 연동 (파싱 후 폼에 값 세팅)
     paste.js가 workers 배열을 채울 수 있도록 커스텀 이벤트 수신
  ══════════════════════════════════════════════════════════════════════ */
  document.addEventListener('worklog:paste', (e) => {
    const { workers: pastedWorkers } = e.detail || {};
    if (!Array.isArray(pastedWorkers)) return;

    const container = document.getElementById('task-mans-container');
    const addBtn    = document.getElementById('add-worker');
    // 기존 작업자 제거 (첫 번째만 남김)
    $$('.task-man-container').slice(1).forEach(el => el.remove());

    pastedWorkers.forEach((name, i) => {
      if (i === 0) {
        const first = $('.task-man-container');
        if (first) first.querySelector('.task-man-input').value = name;
        return;
      }
      const div = document.createElement('div');
      div.className = 'task-man-container';
      div.innerHTML = `
        <input type="text" class="task-man-input" value="${name}" required>
        <select class="task-man-role"><option value="main">main</option><option value="support">support</option></select>
        <button type="button" class="btn-remove remove-worker">−</button>`;
      div.querySelector('.remove-worker').addEventListener('click', () => div.remove());
      container.insertBefore(div, addBtn);
    });
    updateFirstWorkerRemoveBtn();
  });

});
