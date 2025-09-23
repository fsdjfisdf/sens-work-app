// worklog-paid-modal.js
// 요구사항:
//  1) 스텝3 작업자 값은 쓰지 않음. 모달에서 별도 입력(작업자/라인입실/라인퇴실/작업시작/작업완료)
//  2) EMS=유상(ems, WO) 선택 시 즉시 모달 오픈
//  3) EMS=유상인데 모달 저장 안 하면 결재요청 가로막고 모달 띄움
//  4) 결재요청 성공(201, pending_id) 시 유상 rows를 /api/work-log-paid/pending/:pendingId 로 전송

(function () {
  if (typeof window === "undefined" || !document) return;
  const hasAxios = typeof window.axios !== "undefined";

  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /** 현재 EMS 선택값 (1 유상, 0 무상, null 미선택) */
  function currentEmsValue() {
    const ck = document.querySelector('input[name="emsChoice"]:checked');
    if (!ck) return null;
    return ck.value === '1' ? 1 : 0;
  }

  /** HH:MM 형식 체크 */
  const isHHMM = (v) => /^\d{2}:\d{2}$/.test(v||'');
  const toMin  = (v) => { if(!isHHMM(v)) return null; const [h,m]=v.split(':').map(Number); return h*60+m; };
  const gt     = (a,b) => { const A=toMin(a), B=toMin(b); if(A==null||B==null) return null; return A>B; };

  /* ───────────── 모달 DOM ───────────── */
  let modal, overlay;

  function ensureModal() {
    if (modal) return modal;

    overlay = document.createElement('div');
    overlay.id = 'paid-overlay';
    Object.assign(overlay.style, {
      position:'fixed', inset:'0', background:'rgba(0,0,0,.35)', backdropFilter:'blur(2px)',
      display:'none', zIndex:'9998'
    });

    modal = document.createElement('div');
    modal.id = 'paid-modal';
    Object.assign(modal.style, {
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      width:'min(960px, 90vw)', maxHeight:'80vh', overflow:'auto',
      background:'#fff', borderRadius:'16px', boxShadow:'0 10px 40px rgba(0,0,0,.25)',
      padding:'20px', display:'none', zIndex:'9999'
    });

    modal.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:12px;">
        <h3 style="margin:0;font-size:18px;">유상 상세 입력</h3>
        <button type="button" id="paid-close" style="border:none;background:#f4f4f5;padding:6px 10px;border-radius:10px;cursor:pointer;">닫기</button>
      </div>

      <p style="margin:.2rem 0 .8rem 0;color:#475569;">
        EMS가 <b>유상</b>인 경우, <b>작업자별</b>로 다음 항목을 입력해 주세요.<br>
        <small>필수: 작업자 / 라인 입실 · 퇴실 / 작업 시작 · 완료 (HH:MM)</small>
      </p>

      <div id="paid-rows"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:10px;flex-wrap:wrap;">
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" id="paid-add-row" style="border:1px solid #d4d4d8;background:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;">+ 작업자 추가</button>
          <button type="button" id="paid-fill-inform" style="border:1px solid #d4d4d8;background:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;" title="Step4의 Start/End를 작업 시작/완료에 일괄 적용">작업시간 일괄적용</button>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <span id="paid-error" style="color:#b42318;font-size:12.5px;display:none;"></span>
          <button type="button" id="paid-save" style="background:#18181b;color:#fff;padding:10px 14px;border-radius:12px;border:none;cursor:pointer;">저장</button>
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
    modal.style.display = 'block';

    // 비어 있으면 기본 1행 생성 (스텝3에서 끌어오지 않음!)
    const host = $('#paid-rows', modal);
    if (!host.children.length) addRow();
  }
  function closeModal() {
    if (!modal) return;
    overlay.style.display = 'none';
    modal.style.display = 'none';
  }

  function rowTemplate() {
    const id = `rw_${Math.random().toString(36).slice(2,8)}`;
    return `
      <div class="paid-row" data-id="${id}" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:10px 0;">
        <div style="display:grid;grid-template-columns:1.2fr repeat(4,.9fr) auto;gap:8px;align-items:center;">
          <input type="text"  class="paid-worker" placeholder="작업자 (예: 홍길동)" />
          <input type="time"  class="paid-ls" title="라인 입실" />
          <input type="time"  class="paid-le" title="라인 퇴실" />
          <input type="time"  class="paid-is" title="작업 시작" />
          <input type="time"  class="paid-ie" title="작업 완료" />
          <button type="button" class="paid-del" style="border:none;background:#fee2e2;color:#b91c1c;padding:8px 10px;border-radius:10px;cursor:pointer;">삭제</button>
        </div>
        <div class="row-err" style="color:#b42318;font-size:12px;margin-top:6px;display:none;"></div>
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
        if (!isHHMM(data[k])) { ok=false; showRowErr(el, '시간은 HH:MM 형식으로 모두 입력하세요.'); return; }
      }
      const badLine = !gt(data.line_end_time, data.line_start_time);
      const badWork = !gt(data.inform_end_time, data.inform_start_time);
      if (badLine || badWork) { ok=false; showRowErr(el, '라인/작업 시간은 시작 < 종료가 되어야 합니다.'); return; }
    });
    return ok;
  }
  function fillInformAll() {
    const st = $('#start_time')?.value || '';
    const et = $('#end_time')?.value || '';
    $$('.paid-row', modal).forEach(row => {
      const is = $('.paid-is', row), ie = $('.paid-ie', row);
      if (is && isHHMM(st)) is.value = st;
      if (ie && isHHMM(et)) ie.value = et;
    });
  }

  /* 저장(임시 캐시만) */
  function onSaveClicked() {
    if (!validateRows()) return;
    const rows = getRowsRaw().map(({data}) => data);
    window.__paidRowsDraft = { rows, ts: Date.now() };
    window.__paidReadyToSubmit = true; // 결재요청 통과 허용
    closeModal();
    toast('success', '저장됨', '유상 상세가 저장되었습니다. 미리보기 후 결재요청을 진행하세요.');
  }

  /* ───────── EMS 라디오 선택 시 즉시 모달 ───────── */
  document.addEventListener('DOMContentLoaded', () => {
    const paid = document.getElementById('ems-paid');
    const free = document.getElementById('ems-free');

    if (paid) paid.addEventListener('change', () => {
      if (paid.checked) {
        // 유상 선택 → 바로 모달 오픈
        openModal();
      }
    });

    if (free) free.addEventListener('change', () => {
      if (free.checked) {
        // 무상 전환 → 모달 닫고 임시 저장 초기화
        closeModal();
        window.__paidRowsDraft = null;
        window.__paidReadyToSubmit = false;
      }
    });
  });

  /* ───────── 결재요청(확인) 시 가드: 유상인데 저장 안 했으면 막기 ───────── */
  document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirm-save');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', (e) => {
      const ems = currentEmsValue();
      if (ems !== 1) return; // 무상/미선택은 통과

      // 유상인데 저장된 드래프트가 없으면 → 모달 먼저
      const draftOk = window.__paidRowsDraft && Array.isArray(window.__paidRowsDraft.rows) && window.__paidRowsDraft.rows.length > 0;
      if (!draftOk) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openModal();
        toast('warn', '입력이 필요합니다', '유상 상세(작업자/시간)를 먼저 저장해 주세요.');
        return;
      }
    }, { capture:true });
  });

  /* ───────── axios 응답 인터셉터: 본문 제출 성공 후 유상상세 업로드 ───────── */
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
              await axios.post(
                `/api/work-log-paid/pending/${pendingId}`,
                { rows: draft.rows },
                { headers: { 'Content-Type':'application/json', 'x-access-token': token } }
              );
              window.__paidRowsDraft = null;           // 성공 시 비우기
              window.__paidReadyToSubmit = false;      // 한 번 제출 끝
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

  /* ───────── 간단 토스트 ───────── */
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
