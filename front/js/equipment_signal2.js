// equipment_signal2.js

const API_BASE_EQ2 = 'http://3.37.73.151:3001/api';

let eq2Equipments = [];
let eq2SelectedEquipment = null;

const $eq2 = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = $eq2('eq-search-form');
  const resetBtn = $eq2('eq-reset-btn');
  const siteFilter = $eq2('filter-site');
  const lineFilter = $eq2('filter-line');

  // 사이트별 라인 옵션 (검색 필터용)
  const lineOptions = {
    PT: ['P1F', 'P1D', 'P2F', 'P2D', 'P2-S5', 'P3F', 'P3D', 'P3-S5', 'P4F', 'P4D', 'P4-S5'],
    HS: ['12L', '13L', '15L', '16L', '17L', 'S1', 'S3', 'S4', 'S3V', 'NRD', 'NRD-V', 'U4', 'M1', '5L'],
    IC: ['M10', 'M14', 'M16', 'R3'],
    CJ: ['M11', 'M12', 'M15'],
    PSKH: ['PSKH', 'C1', 'C2', 'C3', 'C5'],
  };

  // SITE 선택 시 LINE 옵션 변경
  siteFilter.addEventListener('change', () => {
    const selectedSite = siteFilter.value;
    lineFilter.innerHTML = '<option value="">ALL</option>';

    if (selectedSite && lineOptions[selectedSite]) {
      lineOptions[selectedSite].forEach((line) => {
        const opt = document.createElement('option');
        opt.value = line;
        opt.textContent = line;
        lineFilter.appendChild(opt);
      });
      lineFilter.disabled = false;
    } else {
      lineFilter.disabled = true;
    }
  });

  // 검색
  searchForm.addEventListener('submit', handleEq2Search);

  // 리셋
  resetBtn.addEventListener('click', () => {
    searchForm.reset();
    lineFilter.disabled = true;
    eq2Equipments = [];
    eq2SelectedEquipment = null;
    renderEq2EquipmentList();
    renderEq2EquipmentDetail();
  });

  // ADD / EDIT 이후 다시 검색하도록 커스텀 이벤트 리스너
  window.addEventListener('equipmentChanged', () => {
    // 마지막 검색 조건 기준으로 다시 검색하거나,
    // 단순히 전체 검색을 하고 싶다면 아래처럼:
    handleEq2Search();
  });

  // 초기 화면: 헬프 텍스트만 노출
  renderEq2EquipmentList();
  renderEq2EquipmentDetail();
});

async function handleEq2Search(e) {
  if (e) e.preventDefault();

  const eqname = $eq2('filter-eqname').value.trim();
  const group = $eq2('filter-group').value;
  const site = $eq2('filter-site').value;
  const line = $eq2('filter-line').value;
  const type = $eq2('filter-type').value;
  const warranty = $eq2('filter-warranty').value;

  const params = new URLSearchParams();

  if (eqname) params.append('eqname', eqname);
  if (group) params.append('group', group);
  if (site) params.append('site', site);
  if (line) params.append('line', line);
  if (type) params.append('type', type);
  if (warranty) params.append('warranty_status', warranty);

  const url =
    params.toString().length > 0
      ? `${API_BASE_EQ2}/equipment?${params.toString()}`
      : `${API_BASE_EQ2}/equipment`;

  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('x-access-token') || ''}`,
      },
    });

    eq2Equipments = Array.isArray(res.data) ? res.data : [];
    // 아무 것도 선택 안 되어 있으면 첫 번째 설비 자동 선택
    eq2SelectedEquipment = eq2Equipments[0] || null;

    renderEq2EquipmentList();
    renderEq2EquipmentDetail();
  } catch (err) {
    console.error('Error fetching equipment list:', err);
    alert('설비 조회 중 오류가 발생했습니다.');
  }
}

function renderEq2EquipmentList() {
  const listEl = $eq2('eq-result-list');
  const emptyEl = $eq2('eq-result-empty');
  const countEl = $eq2('eq-result-count');

  listEl.innerHTML = '';

  if (!eq2Equipments || eq2Equipments.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (countEl) countEl.textContent = '0 Equipments';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (countEl) countEl.textContent = `${eq2Equipments.length} Equipments`;

  eq2Equipments.forEach((eq) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'eq2-row' +
      (eq2SelectedEquipment && eq2SelectedEquipment.EQNAME === eq.EQNAME
        ? ' eq2-row-active'
        : '');

    // 컬러 정보가 있으면 사용하고, 없으면 gray
    const color =
      (eq.COLOR && String(eq.COLOR).toLowerCase()) ||
      (eq.WARRANTY_STATUS === 'WI' ? 'green' : 'gray');

    btn.innerHTML = `
      <div class="eq2-row-main">
        <span class="eq2-status-dot eq2-status-${color}"></span>
        <span class="eq2-row-name">${eq.EQNAME || '-'}</span>
      </div>
      <div class="eq2-row-meta">
        <span>${eq.SITE || '-'}</span>
        <span>${eq.LINE || '-'}</span>
        <span>${eq.TYPE || '-'}</span>
        <span>${eq.WARRANTY_STATUS || '-'}</span>
      </div>
    `;

    btn.addEventListener('click', () => {
      eq2SelectedEquipment = eq;
      renderEq2EquipmentList();
      renderEq2EquipmentDetail();
    });

    listEl.appendChild(btn);
  });
}

function renderEq2EquipmentDetail() {
  const container = $eq2('eq-detail');

  if (!container) return;

  if (!eq2SelectedEquipment) {
    container.innerHTML = `
      <div class="eq2-detail-empty">
        <p>설비를 선택하면 상세 정보와 INFO를 여기에서 확인할 수 있습니다.</p>
      </div>
    `;
    return;
  }

  const eq = eq2SelectedEquipment;

  const periodText = `${eq.START_DATE || '-'} ~ ${eq.END_DATE || '-'}`;
  const floorBayText = `${eq.FLOOR || '-'} / ${eq.BAY || '-'}`;

  container.innerHTML = `
    <div class="eq2-detail-card">
      <header class="eq2-detail-header">
        <div>
          <h2 class="eq2-detail-title">${eq.EQNAME || '-'}</h2>
          <div class="eq2-detail-tags">
            <span class="eq2-tag">${eq.TYPE || '-'}</span>
            <span class="eq2-tag">${eq.SITE || '-'} / ${eq.LINE || '-'}</span>
            <span class="eq2-tag">${eq.WARRANTORY || eq.WARRANTY_STATUS || '-'}</span>
          </div>
        </div>
        <div class="eq2-detail-actions">
          <button type="button" id="eq2-edit-btn" class="eq2-btn eq2-btn-outline">
            EDIT
          </button>
        </div>
      </header>

      <section class="eq2-detail-grid">
        <div class="eq2-detail-item">
          <span class="eq2-detail-label">GROUP</span>
          <span class="eq2-detail-value">${eq.GROUP || '-'}</span>
        </div>
        <div class="eq2-detail-item">
          <span class="eq2-detail-label">SITE</span>
          <span class="eq2-detail-value">${eq.SITE || '-'}</span>
        </div>
        <div class="eq2-detail-item">
          <span class="eq2-detail-label">LINE</span>
          <span class="eq2-detail-value">${eq.LINE || '-'}</span>
        </div>
        <div class="eq2-detail-item">
          <span class="eq2-detail-label">FLOOR / BAY</span>
          <span class="eq2-detail-value">${floorBayText}</span>
        </div>
        <div class="eq2-detail-item">
          <span class="eq2-detail-label">기간</span>
          <span class="eq2-detail-value">${periodText}</span>
        </div>
        <div class="eq2-detail-item">
          <span class="eq2-detail-label">WARRANTY</span>
          <span class="eq2-detail-value">${eq.WARRANTY_STATUS || '-'}</span>
        </div>
      </section>

      <section class="eq2-detail-info">
        <div class="eq2-detail-info-header">
          <span>INFO (특이사항)</span>
        </div>
        <textarea id="eq2-info-textarea" class="eq2-info-textarea" rows="6">${
          eq.INFO || ''
        }</textarea>
        <div class="eq2-detail-info-actions">
          <button type="button" id="eq2-info-save-btn" class="eq2-btn eq2-btn-primary">
            INFO SAVE
          </button>
        </div>
      </section>
    </div>
  `;

  const saveInfoBtn = $eq2('eq2-info-save-btn');
  const editBtn = $eq2('eq2-edit-btn');

  if (saveInfoBtn) {
    saveInfoBtn.addEventListener('click', handleEq2InfoSave);
  }

  if (editBtn && window.openEquipmentEditModal2) {
    editBtn.addEventListener('click', () => {
      window.openEquipmentEditModal2(eq);
    });
  }
}

async function handleEq2InfoSave() {
  if (!eq2SelectedEquipment) return;

  const infoEl = $eq2('eq2-info-textarea');
  const newInfo = infoEl ? infoEl.value : '';

  try {
    await axios.post(
      `${API_BASE_EQ2}/equipment/update-info`,
      {
        eqname: eq2SelectedEquipment.EQNAME,
        info: newInfo,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('x-access-token') || ''}`,
        },
      }
    );

    alert('INFO가 저장되었습니다.');
    // 로컬 상태도 업데이트
    eq2SelectedEquipment.INFO = newInfo;
    eq2Equipments = eq2Equipments.map((eq) =>
      eq.EQNAME === eq2SelectedEquipment.EQNAME ? { ...eq, INFO: newInfo } : eq
    );
  } catch (err) {
    console.error('Error updating INFO:', err);
    alert('INFO 저장 중 오류가 발생했습니다.');
  }
}
