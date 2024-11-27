document.addEventListener('DOMContentLoaded', () => {
    const addEquipmentBtn = document.getElementById('add-equipment-btn');
    const addEquipmentModal = document.getElementById('add-equipment-modal');
    const cancelAddEquipmentBtn = document.getElementById('cancel-add-equipment-btn');
    const addEquipmentForm = document.getElementById('add-equipment-form');
    const saveEquipmentBtn = document.getElementById('save-equipment-btn');
    const siteSelect = document.getElementById('site-select');
    const lineSelect = document.getElementById('line-select');

    const requiredFields = [
        'eq-name', 
        'group', 
        'site-select', 
        'line-select', 
        'type', 
        'start-date', 
        'end-date', 
        'warranty-status'
    ];

    // 사이트별 라인 옵션
    const lineOptions = {
        "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
        "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
        "IC": ["M10", "M14", "M16", "R3"],
        "CJ": ["M11", "M12", "M15"],
        "PSKH": ["PSKH", "C1", "C2", "C3", "C5"]
    };

    // 필수 입력 필드 확인 함수
    const validateForm = () => {
        let isValid = true;
        requiredFields.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.style.borderColor = 'DARKRED'; // 필수 입력 실패 시 빨간 테두리
                isValid = false;
            } else {
                field.style.borderColor = ''; // 정상 입력 시 초기화
            }
        });
        saveEquipmentBtn.disabled = !isValid; // 버튼 활성화/비활성화
        return isValid;
    };

    // 사이트 선택 시 라인 옵션 업데이트
    siteSelect.addEventListener('change', () => {
        const selectedSite = siteSelect.value;

        lineSelect.innerHTML = '<option value="">Select Line</option>'; // 초기화
        if (selectedSite && lineOptions[selectedSite]) {
            lineOptions[selectedSite].forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                lineSelect.appendChild(option);
            });
            lineSelect.disabled = false;
        } else {
            lineSelect.disabled = true;
        }
        validateForm(); // 필드 검증 호출
    });

    // 모든 입력 필드에 입력 이벤트 추가
    requiredFields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        field.addEventListener('input', validateForm);
    });

    // 모달 열기
    addEquipmentBtn.addEventListener('click', () => {
        addEquipmentModal.classList.remove('hidden');
        validateForm(); // 열 때 검증
    });

    // 모달 닫기
    cancelAddEquipmentBtn.addEventListener('click', () => {
        addEquipmentModal.classList.add('hidden');
        addEquipmentForm.reset(); // 폼 초기화
        lineSelect.disabled = true; // 라인 비활성화
    });

    // 폼 제출
    addEquipmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const { isValid, missingFields } = validateForm();
        if (!isValid) {
            alert('다음 필드를 입력하세요:\n' + missingFields.map(fieldId => {
                const field = document.getElementById(fieldId);
                const label = field.previousElementSibling.textContent;
                return `- ${label}`;
            }).join('\n'));
            return;
        }

        const formData = new FormData(addEquipmentForm);
        const payload = {};
        formData.forEach((value, key) => {
            payload[key] = value;
        });

        try {
            const response = await axios.post('http://3.37.73.151:3001/api/equipment', payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('x-access-token')}` },
            });

            if (response.status === 201) {
                alert('Equipment added successfully!');
                addEquipmentModal.classList.add('hidden');
                addEquipmentForm.reset();
                location.reload(); // 새로고침
            } else {
                alert('Failed to add equipment.');
            }
        } catch (error) {
            console.error('Error adding equipment:', error.response?.data || error.message);
            alert('Error adding equipment. Please try again.');
        }
    });
});
