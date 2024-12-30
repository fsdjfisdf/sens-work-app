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

    // CHECK 버튼 클릭: 설비 정보 가져오기
    checkWarrantyButton.addEventListener('click', function () {
        const equipmentName = equipmentNameInput.value.trim();

        if (!equipmentName) {
            alert('설비명을 입력하세요.');
            return;
        }

        fetch(`http://3.37.73.151:3001/api/equipment?eqname=${equipmentName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                return response.json();
            })
            .then(data => {
                if (data.length === 0) {
                    alert('정보가 없습니다. 직접 입력하세요.');
                    resetFields();
                } else {
                    const equipmentData = data.find(eq => eq.EQNAME.toLowerCase() === equipmentName.toLowerCase());
                    if (equipmentData) {
                        updateFields(equipmentData);
                    } else {
                        alert('일치하는 설비 정보를 찾을 수 없습니다.');
                        resetFields();
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('정보를 가져오는 데 오류가 발생했습니다. 다시 시도하세요.');
            });
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
            const response = await axios.post('http://3.37.73.151:3001/api/equipment/update-info', {
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
        const lineOptions = {
            PT: ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
            HS: ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRDK", "NRD-V", "U4", "M1", "5L"],
            IC: ["M10", "M14", "M16", "R3"],
            CJ: ["M11", "M12", "M15"],
            PSKH: ["PSKH", "C1", "C2", "C3", "C5"],
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
