// worklog-paid-modal.js
// - 스텝3 작업자값 사용 안 함. 모달에서 별도 입력
// - EMS가 '유상'이 되면 즉시 모달 오픈(수동 선택 + AUTO 버튼으로 자동선택 모두)
// - 유상인데 모달 저장 안 했으면 결재요청 가로막음
// - 저장한 유상 상세는 본문 제출(201, pending_id) 직후 /api/work-log-paid/pending/:id 로 업로드

(function () {
  if (typeof window === "undefined" || !document) return;
  const hasAxios = typeof window.axios !== "undefined";
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /* ───────── helpers ───────── */
  const isHHMM = (v) => /^\d{2}:\d{2}$/.test(v||'');
  const toMin  = (v) => { if(!isHHMM(v)) return null; const [h,m]=v.split(':').map(Number); return h*60+m; };
  const lt     = (a,b) => { const A=toMin(a), B=toMin(b); if(A==null||B==null) return null; return A < B; };
  const gt     = (a,b) => { const A=toMin(a), B=toMin(b); if(A==null||B==null) return null; return A > B; };

  function currentEmsValue() {
    const ck = document.querySelector('input[name="emsChoice"]:checked');
    if (!ck) return null;
    return ck.value === '1' ? 1 : 0;
  }

  /* ───────── modal DOM ───────── */
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
      width:'min(980px, 92vw)', maxHeight:'80vh', overflow:'auto',
      background:'#fff', borderRadius:'16px', boxShadow:'0 10px 40px rgba(0,0,0,.25)',
      padding:'18px', display:'none', zIndex:'9999'
    });

    modal.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <h3 style="margin:0;font-size:18px;">유상(EMS) 상세 입력</h3>
          <p style="margin:.25rem 0 0 0;color:#475569;font-size:13px;line-height:1.4;">
            각 작업자별로 시간을 입력하세요.<br>
            <b>라인 입실</b> = 라인에 들어간 시각 / <b>라인 퇴실</b> = 라인에서 나온 시각<br>
            <b>작업 시작(Inform)</b> = 작업을 실제로 시작한 시각 / <b>작업 완료(Inform)</b> = 실제 종료 시각
          </p>
        </div>
        <button type="button" id="paid-close" style="border:none;background:#f4f4f5;padding:8px 12px;border-radius:10px;cursor:pointer;">닫기</button>
      </div>

      <!-- 컬럼 헤더 -->
      <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="display:grid;grid-template-columns:1.2fr repeat(4,.9fr) 72px;background:#f8fafc;color:#0f172a;font-weight:600;font-size:12.5px;padding:10px 12px;">
          <div>작업자</div>
          <div title="라인에 입실한 시각">라인 입실</div>
          <div title="라인에서 퇴실한 시각">라인 퇴실</div>
          <div title="작업(Inform) 시작 시각">작업 시작</div>
          <div title="작업(Inform) 완료 시각">작업 완료</div>
          <div>관리</div>
        </div>
        <div id="paid-rows"></div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:10px;flex-wrap:wrap;">
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" id="paid-add-row" style="border:1px solid #d4d4d8;background:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;">+ 작업자 추가</button>
          <button type="button" id="paid-fill-inform" style="border:1px solid #d4d4d8;background:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;" title="Step 4의 START/END를 각 행의 작업 시작/완료에 일괄 적용">작업시간 일괄적용</button>
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
    const host = $('#paid-rows', modal);
    if (!host.children.length) addRow(); // 비어 있으면 1행 생성
  }
  function closeModal() {
    if (!modal) return;
    overlay.style.display = 'none';
    modal.style.display = 'none';
  }

  function rowTemplate() {
    const id = `rw_${Math.random().toString(36).slice(2,8)}`;
    return `
      <div class="paid-row" data-id="${id}" style="padding:10px 12px;border-top:1px solid #eef2f7;">
        <div style="display:grid;grid-template-columns:1.2fr repeat(4,.9fr) 72px;gap:8px;align-items:center;">
          <input type="text"  class="paid-worker" placeholder="예: 홍길동" aria-label="작업자" />
          <input type="time"  class="paid-ls" placeholder="예: 09:00" aria-label="라인 입실" title="라인에 들어간 시각" />
          <input type="time"  class="paid-le" placeholder="예: 18:00" aria-label="라인 퇴실" title="라인에서 나온 시각" />
          <input type="time"  class="paid-is" placeholder="예: 09:30" aria-label="작업 시작" title="작업(Inform) 시작 시각" />
          <input type="time"  class="paid-ie" placeholder="예: 17:30" aria-label="작업 완료" title="작업(Inform) 완료 시각" />
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
        ok=false; showRowErr(el, '라인 퇴실은 라인 입실보다 늦어야 합니다.'); return;
      }
      if (!lt(data.inform_start_time, data.inform_end_time)) {
        ok=false; showRowErr(el, '작업 완료는 작업 시작보다 늦어야 합니다.'); return;
      }

      // 포함 관계: line_start < inform_start < inform_end < line_end
      if (!lt(data.line_start_time, data.inform_start_time)) {
        ok=false; showRowErr(el, '라인 입실은 작업 시작보다 빨라야 합니다.'); return;
      }
      if (!gt(data.line_end_time, data.inform_end_time)) {
        ok=false; showRowErr(el, '라인 퇴실은 작업 완료보다 늦어야 합니다.'); return;
      }
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
    // AUTO/권고 반영 직후 상태 확인
    const paidChecked = document.getElementById('ems-paid')?.checked;
    if (paidChecked) openModal();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const paid = document.getElementById('ems-paid');
    const free = document.getElementById('ems-free');
    const auto = document.getElementById('ems-auto-btn');
    const warrantySel = document.getElementById('warranty');
    const checkBtn = document.getElementById('check-warranty');

    // 1) 수동으로 '유상' 선택
    paid?.addEventListener('change', () => { if (paid.checked) openModal(); });

    // 2) '무상' 전환 시 임시저장 초기화
    free?.addEventListener('change', () => {
      if (free.checked) {
        closeModal();
        window.__paidRowsDraft = null;
        window.__paidReadyToSubmit = false;
      }
    });

    // 3) AUTO 버튼으로 유상 자동 선택되었을 때도 모달 오픈
    auto?.addEventListener('click', () => setTimeout(maybeOpenOnAutoResult, 0));

    // (보너스) WARRANTY 변경/체크 결과로 권고값이 반영될 때도 모달 오픈
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
              await axios.post(
                `/api/work-log-paid/pending/${pendingId}`,
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
