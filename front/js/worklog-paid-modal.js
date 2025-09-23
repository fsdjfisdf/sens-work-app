// worklog-paid-modal.js (mobile-friendly)
// - EMS가 '유상'이면 모달 자동 오픈
// - 저장 전 결재요청 가로막음
// - 제출 직후 pendingId에 draft 업로드
// - ★ 모바일 대응: 풀스크린 시트, 스티키 헤더/푸터, 1열 폼, 터치 사이즈↑, 배경 스크롤 락

(function () {
  if (typeof window === "undefined" || !document) return;
  const hasAxios = typeof window.axios !== "undefined";
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /* ───────── helpers ───────── */
  const isHHMM = (v) => /^\d{2}:\d{2}$/.test(v||'');
  const toMin  = (v) => { if(!isHHMM(v)) return null; const [h,m]=v.split(':').map(Number); return h*60+m; };
  const lt     = (a,b) => { const A=toMin(a), B=toMin(b); if(A==null||B==null) return null; return A <= B; };
  const gt     = (a,b) => { const A=toMin(a), B=toMin(b); if(A==null||B==null) return null; return A >= B; };

  function currentEmsValue() {
    const ck = document.querySelector('input[name="emsChoice"]:checked');
    if (!ck) return null;
    return ck.value === '1' ? 1 : 0;
  }

  /* ───────── modal DOM ───────── */
  let modal, overlay;

function injectModalStylesOnce(){
  if (document.getElementById('paid-modal-style')) return;
  const css = `
    /* ===== Overlay ===== */
    #paid-overlay{
      position:fixed; inset:0; background: rgba(0,0,0,.35);
      -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
      display:none; z-index:9998;
    }
    /* ===== Base Sheet ===== */
    #paid-modal{
      position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
      width:min(980px, 92vw); max-height:80vh; overflow:hidden;
      background:#fff; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,.25);
      padding:0; display:none; z-index:9999;
      display:flex; flex-direction:column;
    }
    /* 내부 스크롤 영역 */
    #paid-modal .paid-scroll{ overflow:auto; padding:12px 16px; }
    /* 헤더/푸터 */
    #paid-modal .paid-head{
      position:sticky; top:0; z-index:2;
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      padding:12px 16px; border-bottom:1px solid #e5e7eb;
      background:linear-gradient(180deg,#fff,#fdfefe);
    }
    #paid-modal .paid-actions{
      position:sticky; bottom:0; z-index:2;
      display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;
      padding:10px 12px; border-top:1px solid #e5e7eb;
      background:linear-gradient(0deg,#fff,#fdfefe);
    }
    #paid-modal .btn{
      height:42px; padding:0 14px; border-radius:12px; cursor:pointer; font-weight:700;
      border:1px solid #d4d4d8; background:#fff;
    }
    #paid-modal .btn-primary{ background:#18181b; color:#fff; border-color:#18181b; }
    #paid-modal .btn-danger{ background:#fee2e2; color:#b91c1c; border-color:#fecaca; }
    #paid-modal input[type="text"], #paid-modal input[type="time"]{
      height:44px; font-size:16px; /* iOS 줌 방지 */
      border-radius:10px; border:1px solid #e5e7eb; padding:0 10px; width:100%;
    }
    #paid-modal .paid-header-grid{
      display:grid; grid-template-columns:1.2fr repeat(4,.9fr) 72px;
      background:#f8fafc; color:#0f172a; font-weight:700; font-size:12.5px;
      padding:10px 12px; border:1px solid #e5e7eb; border-radius:12px 12px 0 0;
    }
    #paid-rows{ border:1px solid #e5e7eb; border-top:0; border-radius:0 0 12px 12px; overflow:hidden; }
    #paid-modal .paid-row{ padding:10px 12px; border-top:1px solid #eef2f7; }
    #paid-modal .paid-grid{
      display:grid; grid-template-columns:1.2fr repeat(4,.9fr) 72px; gap:8px; align-items:center;
    }
    #paid-modal .row-err{ color:#b42318; font-size:12px; margin-top:6px; display:none; }

    /* ===== 필드 래퍼/라벨/힌트 ===== */
    #paid-modal .fld{ display:flex; flex-direction:column; gap:6px; }
    #paid-modal .fld-lbl{ display:none; font-size:12.5px; font-weight:800; color:#425269; }
    #paid-modal .fld-hint{ display:none; font-size:12px; color:#7890a8; }

    /* ===== Mobile: full-screen sheet ===== */
    @media (max-width: 640px){
      #paid-modal{
        top:0; left:0; transform:none;
        width:100vw; height:100dvh; max-height:100dvh; border-radius:0;
      }
      #paid-modal .paid-head{ padding:12px 14px; }
      #paid-modal .paid-scroll{ padding:10px 12px; }
      #paid-modal .paid-header-grid{ display:none; } /* 헤더 숨김 */
      #paid-modal .paid-grid{ grid-template-columns:1fr !important; } /* 1열 스택 */
      #paid-modal .btn{ height:46px; font-size:15px; }
      #paid-modal .btn-danger{ padding:8px 12px; }
      /* safe-area */
      #paid-modal .paid-head{ padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
      #paid-modal .paid-actions{ padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); }
      /* 라벨/힌트 모바일에서 표시 */
      #paid-modal .fld-lbl, #paid-modal .fld-hint{ display:block; }
    }

    /* close & error */
    #paid-close{ border:1px solid #e5e7eb; background:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }
    #paid-error{ color:#b42318; font-size:12.5px; display:none; }

    /* body scroll lock */
    body.modal-open{ overflow:hidden; touch-action:none; overscroll-behavior:contain; }
  `;
  const style = document.createElement('style');
  style.id = 'paid-modal-style';
  style.textContent = css;
  document.head.appendChild(style);
}


  function ensureModal() {
    if (modal) return modal;

    injectModalStylesOnce();

    overlay = document.createElement('div');
    overlay.id = 'paid-overlay';

    modal = document.createElement('div');
    modal.id = 'paid-modal';

    modal.innerHTML = `
      <div class="paid-head">
        <div>
          <h3 style="margin:0;font-size:18px;">유상(EMS) 상세 입력</h3>
          <p style="margin:.25rem 0 0 0;color:#475569;font-size:13px;line-height:1.4;">
            각 작업자별로 시간을 입력하세요.<br>
            <b>라인 입실</b> = 라인에 들어간 시각 / <b>라인 퇴실</b> = 라인에서 나온 시각<br>
            <b>작업 시작(Inform)</b> = 작업을 실제로 시작한 시각 / <b>작업 완료(Inform)</b> = 실제 종료 시각
          </p>
        </div>
        <button type="button" id="paid-close">닫기</button>
      </div>

      <div class="paid-scroll">
        <div class="paid-header-grid">
          <div>작업자</div>
          <div title="라인에 입실한 시각">라인 입실</div>
          <div title="라인에서 퇴실한 시각">라인 퇴실</div>
          <div title="작업(Inform) 시작 시각">작업 시작</div>
          <div title="작업(Inform) 완료 시각">작업 완료</div>
          <div>관리</div>
        </div>
        <div id="paid-rows"></div>
      </div>

      <div class="paid-actions">
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" id="paid-add-row" class="btn">+ 작업자 추가</button>
          <button type="button" id="paid-fill-inform" class="btn"
            title="첫 번째 행의 시간을 아래 행들에 복사">첫 행 시간 복사</button>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <span id="paid-error"></span>
          <button type="button" id="paid-save" class="btn btn-primary">저장</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    overlay.addEventListener('click', closeModal);
    $('#paid-close', modal).addEventListener('click', closeModal);
    $('#paid-add-row', modal).addEventListener('click', () => addRow());
    $('#paid-fill-inform', modal).addEventListener('click', fillInformAll);
    $('#paid-save', modal).addEventListener('click', onSaveClicked);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
    });

    return modal;
  }

  function openModal() {
    ensureModal();
    overlay.style.display = 'block';
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    const host = $('#paid-rows', modal);
    if (!host.children.length) addRow(); // 비어 있으면 1행 생성
    // 첫 입력칸 포커스
    const firstWorker = $('.paid-row .paid-worker', modal);
    if (firstWorker) firstWorker.focus({ preventScroll:true });
  }

  function closeModal() {
    if (!modal) return;
    overlay.style.display = 'none';
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

function rowTemplate() {
  const id = `rw_${Math.random().toString(36).slice(2,8)}`;
  return `
    <div class="paid-row" data-id="${id}">
      <div class="paid-grid">
        <div class="fld">
          <span class="fld-lbl">작업자</span>
          <input type="text" class="paid-worker" placeholder="예: 정현우" aria-label="작업자" />
          <small class="fld-hint">작업자 실명(필수)</small>
        </div>

        <div class="fld">
          <span class="fld-lbl">라인 입실</span>
          <input type="time" class="paid-ls" placeholder="예: 09:00" aria-label="라인 입실" title="라인에 들어간 시각" />
          <small class="fld-hint">라인에 들어간 시각(HH:MM)</small>
        </div>

        <div class="fld">
          <span class="fld-lbl">라인 퇴실</span>
          <input type="time" class="paid-le" placeholder="예: 18:00" aria-label="라인 퇴실" title="라인에서 나온 시각" />
          <small class="fld-hint">라인에서 나온 시각(HH:MM)</small>
        </div>

        <div class="fld">
          <span class="fld-lbl">작업 시작(Inform)</span>
          <input type="time" class="paid-is" placeholder="예: 09:30" aria-label="작업 시작" title="작업(Inform) 시작 시각" />
          <small class="fld-hint">작업을 실제로 시작한 시각(HH:MM)</small>
        </div>

        <div class="fld">
          <span class="fld-lbl">작업 완료(Inform)</span>
          <input type="time" class="paid-ie" placeholder="예: 17:30" aria-label="작업 완료" title="작업(Inform) 완료 시각" />
          <small class="fld-hint">작업을 실제로 마친 시각(HH:MM)</small>
        </div>

        <button type="button" class="paid-del btn btn-danger">삭제</button>
      </div>
      <div class="row-err"></div>
    </div>
  `;
}


  function addRow() {
    const host = $('#paid-rows', modal);
    const wrap = document.createElement('div');
    wrap.innerHTML = rowTemplate();
    const el = wrap.firstElementChild;
    host.appendChild(el);
    $('.paid-del', el).addEventListener('click', () => el.remove());

    // 신규행에 첫행 시간 자동 복사(있을 때만)
    const first = $$('.paid-row', modal)[0];
    if (first && first !== el) {
      const ls = $('.paid-ls', first)?.value || '';
      const le = $('.paid-le', first)?.value || '';
      const is = $('.paid-is', first)?.value || '';
      const ie = $('.paid-ie', first)?.value || '';
      if (isHHMM(ls)) $('.paid-ls', el).value = ls;
      if (isHHMM(le)) $('.paid-le', el).value = le;
      if (isHHMM(is)) $('.paid-is', el).value = is;
      if (isHHMM(ie)) $('.paid-ie', el).value = ie;
    }

    // 모바일 UX: 새 행의 첫 입력에 포커스
    $('.paid-worker', el)?.focus({ preventScroll:true });
  }

  function showRowErr(el, msg) {
    const e = $('.row-err', el);
    if (!e) return;
    e.textContent = msg || '';
    e.style.display = msg ? 'block' : 'none';
  }

  function getRowsRaw() {
    const arr = [];
    $$('.paid-row', modal).forEach(row => {
      arr.push({
        el: row,
        data: {
          paid_worker:        $('.paid-worker', row)?.value?.trim() || '',
          line_start_time:    $('.paid-ls', row)?.value || '',
          line_end_time:      $('.paid-le', row)?.value || '',
          inform_start_time:  $('.paid-is', row)?.value || '',
          inform_end_time:    $('.paid-ie', row)?.value || ''
        }
      });
    });
    return arr;
  }

  // 유효성: 기본(형식/시작<종료) + "라인 입실 < 작업 시작" + "작업 완료 < 라인 퇴실"
  function validateRows() {
    let ok = true;
    const pageErr = $('#paid-error', modal);
    pageErr.style.display = 'none';
    pageErr.textContent = '';

    const rows = getRowsRaw();
    if (!rows.length) {
      pageErr.textContent = '최소 1명의 작업자를 입력하세요.';
      pageErr.style.display = 'inline';
      return false;
    }

    rows.forEach(({el, data}) => {
      showRowErr(el, '');

      if (!data.paid_worker) { ok=false; showRowErr(el, '작업자 이름은 필수입니다.'); return; }

      const need = ['line_start_time','line_end_time','inform_start_time','inform_end_time'];
      for (const k of need) {
        if (!isHHMM(data[k])) { ok=false; showRowErr(el, '모든 시간은 HH:MM 형식으로 입력하세요.'); return; }
      }

      // 기본 순서
      if (!lt(data.line_start_time, data.line_end_time)) {
        ok=false; showRowErr(el, '라인 퇴실은 라인 입실보다 늦거나 같아야 합니다.'); return;
      }
      if (!lt(data.inform_start_time, data.inform_end_time)) {
        ok=false; showRowErr(el, '작업 완료는 작업 시작보다 늦거나 같아야 합니다.'); return;
      }

      // 포함 관계: line_start < inform_start < inform_end < line_end
      if (!lt(data.line_start_time, data.inform_start_time)) {
        ok=false; showRowErr(el, '라인 입실은 작업 시작보다 빠르거나 같아야 합니다.'); return;
      }
      if (!gt(data.line_end_time, data.inform_end_time)) {
        ok=false; showRowErr(el, '라인 퇴실은 작업 완료보다 빠르거나 같아야 합니다.'); return;
      }
    });
    return ok;
  }

  function fillInformAll() {
    const rows = $$('.paid-row', modal);
    if (!rows.length) return;

    // 소스: 첫 번째 행
    let src_ls = $('.paid-ls', rows[0])?.value || '';
    let src_le = $('.paid-le', rows[0])?.value || '';
    let src_is = $('.paid-is', rows[0])?.value || '';
    let src_ie = $('.paid-ie', rows[0])?.value || '';

    // 첫 행의 작업(Inform) 시간이 비어 있으면 Step4 값으로 보조 채움
    if (!isHHMM(src_is) || !isHHMM(src_ie)) {
      const st = $('#start_time')?.value || '';
      const et = $('#end_time')?.value || '';
      if (isHHMM(st)) src_is = st;
      if (isHHMM(et)) src_ie = et;
    }

    // 있는 값만 복사
    rows.slice(1).forEach(row => {
      if (isHHMM(src_ls)) $('.paid-ls', row).value = src_ls;
      if (isHHMM(src_le)) $('.paid-le', row).value = src_le;
      if (isHHMM(src_is)) $('.paid-is', row).value = src_is;
      if (isHHMM(src_ie)) $('.paid-ie', row).value = src_ie;
    });
  }

  function onSaveClicked() {
    if (!validateRows()) return;
    const rows = getRowsRaw().map(({data}) => data);
    window.__paidRowsDraft = { rows, ts: Date.now() };
    window.__paidReadyToSubmit = true; // 통과 허용
    closeModal();
    toast('success', '저장됨', '유상 상세가 저장되었습니다. 미리보기 후 결재요청을 진행하세요.');
  }

  /* ───────── EMS 변화에 따른 모달 오픈 ───────── */
  function maybeOpenOnAutoResult() {
    const paidChecked = document.getElementById('ems-paid')?.checked;
    if (paidChecked) openModal();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const paid = document.getElementById('ems-paid');
    const free = document.getElementById('ems-free');
    const auto = document.getElementById('ems-auto-btn');
    const warrantySel = document.getElementById('warranty');
    const checkBtn = document.getElementById('check-warranty');

    // 수동 '유상'
    paid?.addEventListener('change', () => { if (paid.checked) openModal(); });

    // '무상' 전환 시 임시저장 초기화
    free?.addEventListener('change', () => {
      if (free.checked) {
        closeModal();
        window.__paidRowsDraft = null;
        window.__paidReadyToSubmit = false;
      }
    });

    // AUTO/권고 반영 후에도 열기
    auto?.addEventListener('click', () => setTimeout(maybeOpenOnAutoResult, 0));
    warrantySel?.addEventListener('change', () => setTimeout(maybeOpenOnAutoResult, 0));
    checkBtn?.addEventListener('click', () => setTimeout(maybeOpenOnAutoResult, 0));
  });

  /* ───────── 결재요청 가드 ───────── */
  document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirm-save');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', (e) => {
      const ems = currentEmsValue();
      if (ems !== 1) return; // 무상/미선택은 통과

      const draftOk = window.__paidRowsDraft && Array.isArray(window.__paidRowsDraft.rows) && window.__paidRowsDraft.rows.length > 0;
      if (!draftOk) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openModal();
        toast('warn', '입력이 필요합니다', '유상 상세(작업자/시간)를 먼저 저장해 주세요.');
      }
    }, { capture:true });
  });

  /* ───────── 제출 후 업로드 ───────── */
  if (hasAxios) {
    axios.interceptors.response.use(async (res) => {
      try {
        const url = (res?.config?.url || '').toString();
        const isSubmit = res?.status === 201 && /\/approval\/work-log\/submit/.test(url);

        if (isSubmit) {
          const pendingId = res?.data?.pending_id;
          const ems = currentEmsValue();
          const draft = window.__paidRowsDraft;

          if (ems === 1 && pendingId && draft && Array.isArray(draft.rows) && draft.rows.length) {
            try {
              const token = localStorage.getItem('x-access-token') || '';
              const API_BASE = window.API_BASE || 'http://3.37.73.151:3001';
              await axios.post(
                `${API_BASE}/api/work-log-paid/pending/${pendingId}`,
                { rows: draft.rows },
                { headers: { 'Content-Type':'application/json', 'x-access-token': token } }
              );
              window.__paidRowsDraft = null;
              window.__paidReadyToSubmit = false;
              toast('success', '유상 상세 저장 완료', '결재요청과 유상 상세 저장이 완료되었습니다.');
            } catch (e) {
              console.error('[paid] rows upload failed:', e);
              toast('warn', '유상 상세 저장 실패', '결재요청은 완료되었으나, 유상 상세 저장에 실패했습니다. 관리자에게 알려주세요.');
            }
          }
        }
      } catch (_) {}
      return res;
    }, (err) => Promise.reject(err));
  }

  /* ───────── mini toast ───────── */
  function toast(type, title, msg) {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      Object.assign(root.style, { position:'fixed', inset:'0', pointerEvents:'none' });
      root.setAttribute('aria-live','polite');
      root.setAttribute('aria-atomic','true');
      document.body.appendChild(root);
    }
    const box = document.createElement('div');
    box.className = `toast ${type}`;
    Object.assign(box.style, {
      pointerEvents:'auto', position:'absolute', right:'16px', bottom:'16px',
      minWidth:'280px', maxWidth:'420px', background:'#18181b', color:'#fff',
      borderRadius:'12px', padding:'10px 12px', boxShadow:'0 10px 30px rgba(0,0,0,.28)'
    });
    box.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:12px;opacity:.8">${type==='error'?'오류':type==='warn'?'안내':'성공'}</span>
        <strong style="font-weight:600">${title||''}</strong>
      </div>
      <div style="font-size:13px;opacity:.9;margin-top:4px;">${msg||''}</div>
    `;
    root.appendChild(box);
    setTimeout(()=> box.remove(), 4800);
  }
})();
