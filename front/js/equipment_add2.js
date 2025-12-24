// equipment_add2.js
// ADD / EDIT 겸용 모달


document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-equipment-btn2');
  const modal = document.getElementById('add-equipment-modal2');
  const cancelBtn = document.getElementById('cancel-add-equipment-btn2');
  const form = document.getElementById('add-equipment-form2');
  const saveBtn = document.getElementById('save-equipment-btn2');
  const siteSelect = document.getElementById('eq2-site-select');
  const lineSelect = document.getElementById('eq2-line-select');
  const modalTitle = document.getElementById('add-equipment-modal-title');
  const eqnameInput = document.getElementById('eq2-eqname');

  // ADD / EDIT 모드 상태
  let mode = 'add'; // 'add' | 'edit'
  let originalEqname = null;

  // SITE별 LINE 옵션
  const lineOptions = {
    PT: ['P1F', 'P1D', 'P2F', 'P2D', 'P2-S5', 'P3F', 'P3D', 'P3-S5', 'P4F', 'P4D', 'P4-S5'],
    HS: ['12L', '13L', '15L', '16L', '17L', 'S1', 'S3', 'S4', 'S3V', 'NRD', 'NRD-V', 'U4', 'M1', '5L'],
    IC: ['M10', 'M14', 'M16', 'R3'],
    CJ: ['M11', 'M12', 'M15'],
    PSKH: ['PSKH', 'C1', 'C2', 'C3', 'C5'],
  };

  const requiredFields = [
    'eq2-eqname',
    'eq2-group',
    'eq2-site-select',
    'eq2-line-select',
    'eq2-type',
    'eq2-start-date',
    'eq2-end-date',
    'eq2-warranty-status',
  ];

  const validateForm = () => {
    let isValid = true;

    requiredFields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const value = (el.value || '').trim();
      if (!value) {
        el.classList.add('eq2-input-error');
        isValid = false;
      } else {
        el.classList.remove('eq2-input-error');
      }
    });

    if (saveBtn) saveBtn.disabled = !isValid;
    return isValid;
  };

  // SITE 선택 → LINE 옵션 변경
  siteSelect.addEventListener('change', () => {
    const selectedSite = siteSelect.value;
    lineSelect.innerHTML = '<option value="">Select Line</option>';

    if (selectedSite && lineOptions[selectedSite]) {
      lineOptions[selectedSite].forEach((line) => {
        const opt = document.createElement('option');
        opt.value = line;
        opt.textContent = line;
        lineSelect.appendChild(opt);
      });
      lineSelect.disabled = false;
    } else {
      lineSelect.disabled = true;
    }

    validateForm();
  });

  // 필수 필드 입력 시마다 검증
  requiredFields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', validateForm);
    el.addEventListener('change', validateForm);
  });

  // 모달 열기 - ADD 모드
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openAddMode();
    });
  }

  // 모달 닫기
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeModal();
    });
  }

  // 폼 제출
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm()) {
        alert('필수 항목을 모두 입력해 주세요.');
        return;
      }

      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => {
        payload[key] = value;
      });

      try {
        if (mode === 'add') {
          await handleAddEquipment(payload);
        } else {
          await handleEditEquipment(payload);
        }
      } catch (err) {
        console.error('Error in submit:', err);
        alert('저장 중 오류가 발생했습니다.');
      }
    });
  }

  function openAddMode() {
    mode = 'add';
    originalEqname = null;
    if (modalTitle) modalTitle.textContent = 'Add Equipment';
    if (form) form.reset();
    lineSelect.disabled = true;
    if (eqnameInput) {
      eqnameInput.disabled = false;
    }
    validateForm();
    openModal();
  }

  function openEditMode(equipment) {
    mode = 'edit';
    originalEqname = equipment.EQNAME;
    if (modalTitle) modalTitle.textContent = `Edit Equipment - ${equipment.EQNAME}`;

    // 값 채우기
    if (eqnameInput) {
      eqnameInput.value = equipment.EQNAME || '';
      eqnameInput.disabled = true; // KEY는 변경하지 않는 것이 안전
    }
    setValue('eq2-group', equipment.GROUP);
    setValue('eq2-site-select', equipment.SITE);
    // SITE 먼저 세팅 후 LINE 옵션 구성
    siteSelect.dispatchEvent(new Event('change'));
    setValue('eq2-line-select', equipment.LINE);
    setValue('eq2-type', equipment.TYPE);
    setValue('eq2-floor', equipment.FLOOR);
    setValue('eq2-bay', equipment.BAY);
    setValue('eq2-start-date', normalizeDate(equipment.START_DATE));
    setValue('eq2-end-date', normalizeDate(equipment.END_DATE));
    setValue('eq2-warranty-status', equipment.WARRANTY_STATUS);
    setValue('eq2-info', equipment.INFO);

    validateForm();
    openModal();
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value || '';
  }

  function normalizeDate(dateStr) {
    if (!dateStr) return '';
    // 이미 'YYYY-MM-DD' 형식이면 그대로 사용
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // 날짜 문자열에서 앞 10자리만 잘라 사용 (MySQL DATETIME 등)
    return String(dateStr).slice(0, 10);
  }

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('eq2-modal-open');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('eq2-modal-open');
    if (form) form.reset();
    lineSelect.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
  }

  async function handleAddEquipment(payload) {
    const res = await axios.post(`${API_BASE_EQ2}/equipment`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('x-access-token') || ''}`,
      },
    });

    if (res.status === 201) {
      alert('장비가 추가되었습니다.');
      closeModal();
      window.dispatchEvent(new Event('equipmentChanged'));
    } else {
      alert('장비 추가에 실패했습니다.');
    }
  }

  async function handleEditEquipment(payload) {
    if (!originalEqname) {
      alert('수정할 설비 정보가 없습니다.');
      return;
    }

    const res = await axios.put(
      `${API_BASE_EQ2}/equipment/${encodeURIComponent(originalEqname)}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('x-access-token') || ''}`,
        },
      }
    );

    if (res.status === 200) {
      alert('장비 정보가 수정되었습니다.');
      closeModal();
      window.dispatchEvent(new Event('equipmentChanged'));
    } else {
      alert('장비 수정에 실패했습니다.');
    }
  }

  // 다른 스크립트에서 EDIT 모달 호출할 수 있게 전역 함수 등록
  window.openEquipmentEditModal2 = openEditMode;
});
