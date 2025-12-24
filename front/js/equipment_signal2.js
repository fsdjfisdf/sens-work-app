// equipment_signal2.js
const API_BASE_EQ2 = 'http://3.37.73.151:3001/api';

let eq2Equipments = [];
let eq2SelectedEquipment = null;
let eq2EquipmentLogs = [];

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
    eq2EquipmentLogs = [];
    renderEq2EquipmentList();
    renderEq2EquipmentDetail();
  });

  // ADD / EDIT 이후 다시 검색하도록 커스텀 이벤트 리스너
  window.addEventListener('equipmentChanged', () => {
    handleEq2Search();
  });

  // 초기 화면
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
    eq2SelectedEquipment = eq2Equipments[0] || null;

    renderEq2EquipmentList();
    renderEq2EquipmentDetail();

    if (eq2SelectedEquipment) {
      fetchEq2History(eq2SelectedEquipment.EQNAME);
    } else {
      eq2EquipmentLogs = [];
    }
  } catch (err) {
    console.error('Error fetching equipment list:', err);
    alert('설비 조회 중 오류가 발생했습니다.');
  }
}

async function fetchEq2History(eqname) {
  if (!eqname) {
    eq2EquipmentLogs = [];
    renderEq2EquipmentDetail();
    return;
  }

  try {
    const res = await axios.get(
      `${API_BASE_EQ2}/equipment/${encodeURIComponent(eqname)}/logs`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('x-access-token') || ''}`,
        },
      }
    );

    eq2EquipmentLogs = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching equipment history:', err);
    eq2EquipmentLogs = [];
  }

  renderEq2EquipmentDetail();
}

// ===== 포맷 헬퍼 =====

function formatDateOnly(value) {
  if (!value) return '-';
  const s = String(value);
  if (s.length >= 10) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

function formatTimeOnly(value) {
  if (!value) return '-';
  const s = String(value);
  const parts = s.split(':');
  if (parts.length < 2) return s;
  const [h, m] = parts;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function formatDuration(value) {
  if (!value) return '-';
  const s = String(value);
  const parts = s.split(':');
  if (parts.length < 2) return s;
  const [h, m] = parts;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// DESC 안의 <br> 만 줄바꿈으로 허용
function formatDescription(text) {
  if (!text) return '';
  // 먼저 전체를 escape 해서 스크립트/태그 막기
  let safe = escapeHtml(text);
  // 그 다음, 원래 있던 <br>를 다시 줄바꿈 태그로 되살리기
  safe = safe.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  return safe;
}

function formatDateRange(start, end) {
  return `${formatDateOnly(start)} ~ ${formatDateOnly(end)}`;
}

// ===== 리스트 렌더링 =====

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
      fetchEq2History(eq.EQNAME);
    });

    listEl.appendChild(btn);
  });
}

// ===== 상세 렌더링 (INFO + 작업 이력) =====

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
  const periodText = formatDateRange(eq.START_DATE, eq.END_DATE);
  const floorBayText = `${eq.FLOOR || '-'} / ${eq.BAY || '-'}`;

  const historyHtml =
    eq2EquipmentLogs.length === 0
      ? '<p class="eq2-history-empty">등록된 작업 이력이 없거나, 최근 200건 이내에 작업이 없습니다.</p>'
      : eq2EquipmentLogs
          .map((log) => {
            const date = formatDateOnly(log.task_date);
            const st = formatTimeOnly(log.start_time);
            const et = formatTimeOnly(log.end_time);
            const du = formatDuration(log.task_duration);
            const descHtml = formatDescription(log.task_description || '');
            return `
              <article class="eq2-history-item">
                <div class="eq2-history-main">
                  <div class="eq2-history-title-row">
                    <span class="eq2-history-date">${date}</span>
                    <span class="eq2-history-type">${log.work_type || '-'}</span>
                  </div>
                  <div class="eq2-history-title">${escapeHtml(log.task_name || '')}</div>
                  <div class="eq2-history-meta">
                    <span>작업자: ${escapeHtml(log.task_man || '-')}</span>
                    <span>시간: ${st} ~ ${et} (${du})</span>
                  </div>
                </div>
                ${
                  descHtml
                    ? `<details class="eq2-history-desc">
                         <summary>상세 보기</summary>
                         <p>${descHtml}</p>
                       </details>`
                    : ''
                }
              </article>
            `;
          })
          .join('');

container.innerHTML = `
  <div class="eq2-detail-card">
    <header class="eq2-detail-header">
      <div>
        <h2 class="eq2-detail-title">${eq.EQNAME || '-'}</h2>
        <div class="eq2-detail-tags">
          <span class="eq2-tag">${eq.TYPE || '-'}</span>
          <span class="eq2-tag">${eq.SITE || '-'} / ${eq.LINE || '-'}</span>
          <span class="eq2-tag">${eq.WARRANTY_STATUS || '-'}</span>
        </div>
      </div>
      <div class="eq2-detail-actions">
        <button type="button" id="eq2-edit-btn" class="eq2-btn eq2-btn-outline">
          EDIT
        </button>
        <button type="button" id="eq2-delete-btn" class="eq2-btn eq2-btn-danger">
          DELETE
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
          <span class="eq2-detail-label">Warranty Date</span>
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

      <section class="eq2-detail-history">
        <div class="eq2-detail-info-header">
          <span>작업 이력</span>
          <span class="eq2-history-count">${eq2EquipmentLogs.length}건</span>
        </div>
        <div class="eq2-history-list">
          ${historyHtml}
        </div>
      </section>
    </div>
  `;

  const saveInfoBtn = $eq2('eq2-info-save-btn');
  const editBtn = $eq2('eq2-edit-btn');
  const deleteBtn = $eq2('eq2-delete-btn');   // 🔴 추가

  if (saveInfoBtn) {
    saveInfoBtn.addEventListener('click', handleEq2InfoSave);
  }

  if (editBtn && window.openEquipmentEditModal2) {
    editBtn.addEventListener('click', () => {
      window.openEquipmentEditModal2(eq);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleEq2Delete);
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
    eq2SelectedEquipment.INFO = newInfo;
    eq2Equipments = eq2Equipments.map((eq) =>
      eq.EQNAME === eq2SelectedEquipment.EQNAME ? { ...eq, INFO: newInfo } : eq
    );
  } catch (err) {
    console.error('Error updating INFO:', err);
    alert('INFO 저장 중 오류가 발생했습니다.');
  }
}

async function handleEq2Delete() {
  if (!eq2SelectedEquipment) return;

  const targetName = eq2SelectedEquipment.EQNAME;
  const ok = confirm(
    `정말로 설비 "${targetName}" 을(를) 삭제하시겠습니까?\n` +
    `※ 관련 작업이력 테이블과의 연동/제약은 DB 설정에 따라 달라집니다.`
  );
  if (!ok) return;

  try {
    await axios.delete(
      `${API_BASE_EQ2}/equipment/${encodeURIComponent(targetName)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('x-access-token') || ''}`,
        },
      }
    );

    alert('설비가 삭제되었습니다.');

    // 현재 리스트에서 제거
    eq2Equipments = eq2Equipments.filter((eq) => eq.EQNAME !== targetName);

    // 선택된 설비 재설정
    if (eq2Equipments.length > 0) {
      eq2SelectedEquipment = eq2Equipments[0];
      await fetchEq2History(eq2SelectedEquipment.EQNAME);
    } else {
      eq2SelectedEquipment = null;
      eq2EquipmentLogs = [];
      renderEq2EquipmentList();
      renderEq2EquipmentDetail();
    }
  } catch (err) {
    console.error('Error deleting equipment:', err);
    const msg =
      err.response?.data?.error ||
      '설비 삭제 중 오류가 발생했습니다.';
    alert(msg);
  }
}
