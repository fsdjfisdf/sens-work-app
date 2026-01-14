/*!
 * pci_group_bundle.js (Compare Picker Edition)
 * - 여러명 선택(리스트 클릭) → 개인 API 여러번 호출 → "각 개인 데이터" 그대로 반환
 * - ✅ 추가: 선택 인원 평균 PCI(selectedAvgPci) + 인원별 평균 PCI(workerAvgPci)
 * - Excel: 선택 인원별로 sheet 생성
 */

(function (global) {
  "use strict";

  const ESC_RE = /[&<>"']/g;
  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s ?? "").replace(ESC_RE, (ch) => ESC_MAP[ch] || ch);

  function uniq(arr){
    const seen = new Set();
    const out = [];
    for (const x of arr){ if (!seen.has(x)){ seen.add(x); out.push(x); } }
    return out;
  }

  function debounce(fn, ms=120){
    let t;
    return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
  }

  function toNum(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function mean(nums){
    const a = (nums || []).filter(n => Number.isFinite(n));
    if (!a.length) return 0;
    return a.reduce((s,n)=>s+n,0)/a.length;
  }

  // ✅ 개인 평균 PCI(우선 summary.avgPci, 없으면 rows[].pci_pct 평균)
  function getAvgPciFromData(data){
    const s = data?.summary;
    if (s && s.avgPci != null) return toNum(s.avgPci);

    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if (!rows.length) return 0;
    return mean(rows.map(r => toNum(r.pci_pct)));
  }

  class PciGroupBundle {
    constructor(opts = {}) {
      this.storageKey = opts.storageKey || "PCI_COMPARE_SELECTION";
      this.maxNames = opts.maxNames ?? 30;
      this.normalizeName = typeof opts.normalizeName === "function"
        ? opts.normalizeName
        : (n) => String(n || "").trim();

      if (!opts.host || typeof opts.host.fetchWorker !== "function" || typeof opts.host.renderCompare !== "function") {
        throw new Error("PciGroupBundle: host.fetchWorker(name) and host.renderCompare(result) are required.");
      }

      this.host = {
        fetchWorker: opts.host.fetchWorker,
        renderCompare: opts.host.renderCompare,
        renderError: opts.host.renderError || ((msg) => alert(msg)),
        renderLoading: opts.host.renderLoading || null,
      };

      this.state = { names: [] };
      this.cache = new Map(); // name -> {summary, rows}

      this.ui = null;
      this.availableNames = []; // worker list

      this.loadState();
    }

    loadState(){
      try{
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.names)) this.state.names = saved.names.map(this.normalizeName).filter(Boolean);
      }catch(_){}
      this.state.names = uniq(this.state.names).slice(0, this.maxNames);
    }

    saveState(){
      try{ localStorage.setItem(this.storageKey, JSON.stringify(this.state)); }catch(_){}
    }

    getNames(){ return this.state.names.slice(); }

    isSelected(name){
      const n = this.normalizeName(name);
      return this.state.names.includes(n);
    }

    toggleName(nameRaw){
      const name = this.normalizeName(nameRaw);
      if (!name) return;

      const has = this.state.names.includes(name);
      if (has){
        this.state.names = this.state.names.filter(n => n !== name);
      } else {
        if (this.state.names.length >= this.maxNames){
          this.host.renderError(`최대 ${this.maxNames}명까지 선택할 수 있어요.`);
          return;
        }
        this.state.names.push(name);
      }
      this.saveState();
      this.renderChips();
      this.renderPicker();
      this.syncButtons();
    }

    removeName(nameRaw){
      const name = this.normalizeName(nameRaw);
      this.state.names = this.state.names.filter(n => n !== name);
      this.saveState();
      this.renderChips();
      this.renderPicker();
      this.syncButtons();
    }

    clearNames(){
      this.state.names = [];
      this.saveState();
      this.renderChips();
      this.renderPicker();
      this.syncButtons();
    }

    setAvailableNames(list){
      this.availableNames = (Array.isArray(list) ? list : []).map(this.normalizeName).filter(Boolean);
      this.availableNames = uniq(this.availableNames);
      this.renderPicker();
    }

    mountUI(ui){
      this.ui = ui;

      // chips remove
      if (ui.chipsWrap){
        ui.chipsWrap.addEventListener("click", (e)=>{
          const btn = e.target.closest("[data-remove]");
          if (!btn) return;
          this.removeName(btn.getAttribute("data-remove"));
        });
      }

      // picker click
      if (ui.pickerWrap){
        ui.pickerWrap.addEventListener("click", (e)=>{
          const row = e.target.closest("[data-name]");
          if (!row) return;
          this.toggleName(row.getAttribute("data-name"));
        });
      }

      // search
      if (ui.pickerSearch){
        const onSearch = debounce(()=> this.renderPicker(), 80);
        ui.pickerSearch.addEventListener("input", onSearch);
      }

      if (ui.runBtn) ui.runBtn.addEventListener("click", ()=> this.run());
      if (ui.clearBtn) ui.clearBtn.addEventListener("click", ()=> this.clearNames());
      if (ui.exportBtn) ui.exportBtn.addEventListener("click", ()=> this.exportXlsx());

      this.renderChips();
      this.renderPicker();
      this.syncButtons();
    }

    syncButtons(){
      const names = this.getNames();
      if (this.ui?.runBtn) this.ui.runBtn.disabled = names.length === 0;
      if (this.ui?.exportBtn) this.ui.exportBtn.disabled = !this.lastRendered || names.length === 0;
    }

    renderChips(){
      const ui = this.ui;
      if (!ui?.chipsWrap) return;

      const names = this.getNames();
      ui.chipsWrap.innerHTML = `
        <div class="cmp-chip-head">
          <div class="cmp-chip-title">선택 인원 (${names.length})</div>
          <div class="cmp-chip-sub">클릭으로 선택/해제 가능</div>
        </div>
        <div class="cmp-chips">
          ${
            names.length
              ? names.map(n => `
                <span class="cmp-chip" title="${esc(n)}">
                  ${esc(n)}
                  <button type="button" class="cmp-x" data-remove="${esc(n)}" aria-label="제거">×</button>
                </span>
              `).join("")
              : `<span class="cmp-empty">아직 선택된 인원이 없어요.</span>`
          }
        </div>
      `;
    }

    renderPicker(){
      const ui = this.ui;
      if (!ui?.pickerWrap) return;

      const q = (ui.pickerSearch?.value || "").trim().toLowerCase();
      const names = this.availableNames
        .filter(n => !q || n.toLowerCase().includes(q));

      ui.pickerWrap.innerHTML = names.map(n=>{
        const sel = this.isSelected(n);
        return `
          <div class="wp-row ${sel ? "sel" : ""}" data-name="${esc(n)}" role="button" tabindex="0" aria-pressed="${sel}">
            <span class="wp-name">${esc(n)}</span>
            <span class="wp-mark">${sel ? "선택됨" : "선택"}</span>
          </div>
        `;
      }).join("") || `<div class="wp-empty">검색 결과가 없어요.</div>`;
    }

    async fetchAllSelected(){
      const names = this.getNames();
      const results = [];

      for (const name of names){
        if (this.cache.has(name)){
          results.push({ name, data: this.cache.get(name) });
          continue;
        }
        const data = await this.host.fetchWorker(name); // {summary, rows}
        this.cache.set(name, data);
        results.push({ name, data });
      }
      return results;
    }

    async run(){
      const names = this.getNames();
      if (!names.length) return this.host.renderError("선택된 인원이 없습니다.");

      try{
        this.host.renderLoading?.(true);

        const by_worker = await this.fetchAllSelected();

        // ✅ 추가 계산: 인원별 평균 PCI / 선택 인원 평균 PCI
        const workerAvgPci = {};
        const per = [];
        for (const w of by_worker){
          const avg = getAvgPciFromData(w.data);
          workerAvgPci[w.name] = avg;
          per.push(avg);
        }
        const selectedAvgPci = mean(per);

        const result = { names, by_worker, workerAvgPci, selectedAvgPci };
        this.lastRendered = result;

        this.host.renderCompare(result);
        this.syncButtons();
        return result;
      }catch(e){
        console.error("[PciGroupBundle] run error:", e);
        this.host.renderError("선택 인원 조회 중 오류가 발생했습니다.");
      }finally{
        this.host.renderLoading?.(false);
      }
    }

    exportXlsx(){
      if (!global.XLSX) return this.host.renderError("XLSX 라이브러리가 없어 Excel 내보내기를 할 수 없습니다.");
      if (!this.lastRendered) return this.host.renderError("먼저 조회를 실행하세요.");

      const { by_worker } = this.lastRendered;
      if (!by_worker?.length) return this.host.renderError("내보낼 데이터가 없습니다.");

      const wb = XLSX.utils.book_new();

      for (const w of by_worker){
        const name = w.name;
        const rows = w.data?.rows || [];

        const header = ["중분류","항목","기준","main","support","교육","총횟수","작업이력(80)","자가(20)","PCI(%)"];
        const aoa = [header];

        for (const r of rows){
          aoa.push([
            r.category ?? "",
            r.item ?? "",
            r.baseline ?? "",
            r.main_count ?? 0,
            r.support_count ?? 0,
            r.add_count ?? 0,
            r.total_count ?? 0,
            Number((Number(r.work_pct)||0).toFixed(1)),
            Number((Number(r.self_pct)||0).toFixed(1)),
            Number((Number(r.pci_pct)||0).toFixed(1)),
          ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName(name));
      }

      XLSX.writeFile(wb, `PCI_COMPARE_${by_worker.length}명.xlsx`);

      function safeSheetName(s){
        const x = String(s||"sheet").replace(/[\\/?*\[\]:]/g," ").trim();
        return x.length > 28 ? x.slice(0,28) : x || "sheet";
      }
    }
  }

  global.PciGroupBundle = PciGroupBundle;

})(window);
