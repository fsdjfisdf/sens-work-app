document.addEventListener('DOMContentLoaded', function () {
    const checkWarrantyButton = document.getElementById('check-warranty');
    const editInfoButton = document.getElementById('edit-info');
    const saveInfoButton = document.getElementById('save-info');
    const equipmentNameInput = document.getElementById('equipment_name');
    const groupSelect = document.getElementById('group');
    const siteSelect = document.getElementById('site');
    const lineSelect = document.getElementById('line');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const warrantySelect = document.getElementById('warranty');
    const infoTextarea = document.getElementById('info');

    const addModal = document.getElementById('equipment-add-modal');
    const confirmEquipmentAdd = document.getElementById('confirm-equipment-add');
    const cancelEquipmentAdd = document.getElementById('cancel-equipment-add');
    const closeModalButton = document.querySelector('.equipment-add-modal-close');

    const newEqname = document.getElementById("new_eqname");
    const newGroup = document.getElementById("new_group");
    const newSite = document.getElementById("new_site");
    const newLine = document.getElementById("new_line");
    const newType = document.getElementById("new_type");
    const newWarranty = document.getElementById("new_warranty");
    const newInfo = document.getElementById("new_info");

    

    if (!addModal || !confirmEquipmentAdd) {
        console.error("모달 요소를 찾을 수 없습니다. HTML에서 ID를 확인하세요.");
        return;
    }

    // CHECK 버튼 클릭: 설비 정보 가져오기
    checkWarrantyButton.addEventListener('click', function () {
        const equipmentName = equipmentNameInput.value.trim();

        if (!equipmentName) {
            alert('설비명을 입력하세요.');
            return;
        }

        fetch(`http://13.125.122.202:3001/api/equipment?eqname=${equipmentName}`)
            .then(response => response.json())
            .then(data => {
                console.log("📡 서버 응답 데이터:", data); // ✅ 응답 확인용 콘솔 출력

                // 서버 응답이 없는 경우
                if (!data || data.length === 0) {
                    console.log("🚨 설비 정보 없음 -> 설비 추가 모달 표시");
                    openAddEquipmentModal();
                    return;
                }

                // 서버에서 받은 데이터 중 해당 설비명을 가진 데이터 찾기
                const equipmentData = data.find(eq => eq.EQNAME && eq.EQNAME.toLowerCase() === equipmentName.toLowerCase());

                if (equipmentData) {
                    console.log("✅ 설비 정보 확인됨", equipmentData);
                    updateFields(equipmentData);
                } else {
                    console.log("🚨 설비 정보 없음 -> 설비 추가 모달 표시");
                    openAddEquipmentModal();
                }
            })
            .catch(error => {
                console.error('⚠️ 데이터 가져오기 오류:', error);
                alert('정보를 가져오는 데 오류가 발생했습니다. 다시 시도하세요.');
            });
    });

        const formFields = [newEqname, newGroup, newSite, newLine, newType, newWarranty];

    // SITE별 LINE 옵션
    const lineOptions = {
        "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
        "HS": ["1L", "12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRDK", "NRD-V", "U4", "M1", "5L"],
        "IC": ["M10", "M14", "M16", "R3"],
        "CJ": ["M11", "M12", "M15"],
        "PSKH": ["PSKH", "C1", "C2", "C3", "C5"],
        "USA-Portland": ["INTEL"],
        "USA-Arizona": ["INTEL"],
        "Ireland": ["INTEL"],
        "Japan-Hiroshima": ["MICRON"],
        "China-Wuxi": ["HYNIX"],
        "China-Xian": ["HYNIX", "SAMSUNG"],
        "China-Shanghai": ["GTX"],
        "China-Beijing": ["JIDIAN"],
        "Taiwan-Taichoung": ["MICRON"],
        "Taiwan-Linkou": ["select", "MICRON"],
        "Singapore": ["MICRON"],
        "Training": ["Training"]
    };

    /** ✅ `SITE` 선택 시 `LINE` 옵션 자동 업데이트 */
    newSite.addEventListener('change', function () {
        updateLineOptions(newSite.value);
        validateForm(); // 필수 입력 검증 다시 실행
    });

    function updateLineOptions(selectedSite) {
        newLine.innerHTML = '<option value="">SELECT</option>'; // 기본 옵션 추가
        if (lineOptions[selectedSite]) {
            lineOptions[selectedSite].forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                newLine.appendChild(option);
            });
            newLine.disabled = false;
        } else {
            newLine.innerHTML = '<option value="">선택할 수 없습니다</option>';
            newLine.disabled = true;
        }
    }

    /** ✅ 입력 필드 검증 (필수 값 입력 시 ADD 버튼 활성화) */
    function validateForm() {
        const isValid = formFields.every(field => field.value.trim() !== "" && field.value !== "SELECT");
        confirmEquipmentAdd.disabled = !isValid;
    }

    formFields.forEach(field => {
        field.addEventListener('input', validateForm);
        field.addEventListener('change', validateForm);
    });

    // 설비 추가 모달 열기 (정보 없을 때 자동으로 실행)
    function openAddEquipmentModal() {
        console.log("🚨 설비 정보 없음 -> 설비 추가 모달 표시");
        addModal.classList.add("active");
        addModal.style.display = "flex"; 
    }

    function closeAddModal() {
        console.log("✅ 모달 닫기");
        addModal.classList.remove("active");
        addModal.style.display = "none"; 
    }

    closeModalButton.addEventListener('click', closeAddModal);
    cancelEquipmentAdd.addEventListener('click', closeAddModal);

    // "ADD" 버튼 클릭 시 설비 추가
    confirmEquipmentAdd.addEventListener("click", async () => {
        const equipmentData = {
            eqname: newEqname.value.trim(),
            group: newGroup.value,
            site: newSite.value,
            type: newType.value,
            line: newLine.value.trim(),
            floor: document.getElementById("new_floor").value.trim(),
            bay: document.getElementById("new_bay").value.trim(),
            start_date: document.getElementById("new_start_date").value,
            end_date: document.getElementById("new_end_date").value,
            warranty_status: newWarranty.value,
            info: newInfo.value.trim(),
        };
    
        if (!equipmentData.eqname || !equipmentData.group || !equipmentData.site ||
            !equipmentData.type || !equipmentData.warranty_status || !equipmentData.line) {
            alert("필수 항목을 모두 입력하세요.");
            return;
        }
    
        try {
            const response = await fetch("http://13.125.122.202:3001/api/equipment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(equipmentData)
            });
    
            const result = await response.json();
            if (response.ok) {
                alert("설비가 추가되었습니다.");
                addModal.classList.remove("active"); // ✅ "show" → "active"로 변경
            } else {
                alert("설비 추가 실패: " + result.error);
            }
        } catch (error) {
            console.error("설비 추가 오류:", error);
            alert("설비 추가 중 오류가 발생했습니다.");
        }
    });


    editInfoButton.addEventListener('click', () => {
        infoTextarea.disabled = false; // textarea 활성화
        saveInfoButton.style.display = 'inline-block'; // 저장 버튼 표시
        infoTextarea.focus(); // 포커스 설정
    });

    // SAVE 버튼 클릭: 특이사항 업데이트
    saveInfoButton.addEventListener('click', async () => {
        const equipmentName = equipmentNameInput.value.trim();
        const updatedInfo = infoTextarea.value.trim();

        if (!equipmentName) {
            alert('설비명을 입력하세요.');
            return;
        }

        try {
            const response = await axios.post('http://13.125.122.202:3001/api/equipment/update-info', {
                eqname: equipmentName,
                info: updatedInfo,
            });

            if (response.status === 200) {
                alert('특이사항이 성공적으로 저장되었습니다.');
                infoTextarea.disabled = true; // textarea 비활성화
                saveInfoButton.style.display = 'none'; // 저장 버튼 숨기기
            } else {
                alert('특이사항 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('특이사항 저장 실패:', error);
            alert('특이사항 저장 중 오류가 발생했습니다.');
        }
    });

    function resetFields() {
        infoTextarea.value = '';
    }

    function updateFields(data) {
        infoTextarea.value = data.INFO || '';
    }

    // 필드 초기화
    function resetFields() {
        groupSelect.value = 'SELECT';
        siteSelect.value = 'SELECT';
        lineSelect.value = 'SELECT';
        equipmentTypeSelect.value = 'SELECT';
        warrantySelect.value = 'SELECT';
        infoTextarea.value = '';
    }

    // 필드 업데이트
    function updateFields(equipmentData) {
        groupSelect.value = equipmentData.GROUP || 'SELECT';
        siteSelect.value = equipmentData.SITE || 'SELECT';
        updateLineOptions(equipmentData.SITE);
        lineSelect.value = equipmentData.LINE || 'SELECT';
        equipmentTypeSelect.value = equipmentData.TYPE || 'SELECT';
        warrantySelect.value = equipmentData.WARRANTY_STATUS || 'SELECT';
        infoTextarea.value = equipmentData.INFO || '';
    }

    // 라인 옵션 업데이트
function updateLineOptions(siteSelection) {
  const LINE_OPTIONS = {
    "PT": ["P1F","P1D","P2F","P2D","P2-S5","P3F","P3D","P3-S5","P4F","P4D","P4-S5","Training"],
    "HS": ["1L","12L","13L","15L","16L","17L","S1","S3","S4","S3V","NRD","NRDK","NRD-V","U4","M1","5L","G1L","Training"],
    "IC": ["M10","M14","M16","R3","Training"],
    "CJ": ["M11","M12","M15","Training"],
    "PSKH": ["PSKH","C1","C2","C3","C5","Training"],
    "USA-Portland": ["INTEL","Training"],
    "USA-Arizona": ["INTEL","Training"],
    "USA-Texas": ["Texas Instrument","Training"], // 셀렉트 값과 정확히 일치 필요
    "Ireland": ["INTEL","Training"],
    "Japan-Hiroshima": ["MICRON","Training"],
    "China-Wuxi": ["MICRON","HYNIX","Training"],
    "China-Xian": ["MICRON","HYNIX","SAMSUNG","Training"],
    "China-Shanghai": ["MICRON","GTX","Training"],
    "China-Beijing": ["JIDIAN","Training"],
    "Taiwan-Taichoung": ["MICRON","Training"],      // 셀렉트에 'Taichoung'로 표기되어 있음
    "Taiwan-Linkou": ["MICRON","Training"],         // ★ 누락되어있던 문제의 핵심
    "Singapore": ["MICRON","Training"],             // 셀렉트는 'Singapore' (대소문자 맞춤)
    "Training": ["Training","TRAINING"]
  };

        lineSelect.innerHTML = '<option value="SELECT">SELECT</option>';
        if (lineOptions[siteSelection]) {
            lineOptions[siteSelection].forEach(line => {
                const option = document.createElement('option');
                option.value = line;
                option.textContent = line;
                lineSelect.appendChild(option);
            });
        }
    }
});
