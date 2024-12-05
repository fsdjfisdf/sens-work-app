document.addEventListener('DOMContentLoaded', function () {
    const checkWarrantyButton = document.getElementById('check-warranty');
    const equipmentNameInput = document.getElementById('equipment_name');
    const groupSelect = document.getElementById('group');
    const siteSelect = document.getElementById('site');
    const lineSelect = document.getElementById('line');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const warrantySelect = document.getElementById('warranty');
    const infoTextarea = document.getElementById('info');

    checkWarrantyButton.addEventListener('click', function () {
        const equipmentName = equipmentNameInput.value.trim();

        if (!equipmentName) {
            alert('설비명을 입력하세요.');
            return;
        }

        console.log(`Fetching data for equipmentName: ${equipmentName}`);
        fetch(`http://3.37.73.151:3001/api/equipment?eqname=${equipmentName}`)
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data);

                if (data.length === 0) {
                    alert('정보가 없습니다. 직접 선택하세요.');
                    resetFields();
                } else {
                    const equipmentData = mapEquipmentData(data, equipmentName);

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

    function resetFields() {
        groupSelect.value = 'SELECT';
        siteSelect.value = 'SELECT';
        lineSelect.value = 'SELECT';
        equipmentTypeSelect.value = 'SELECT';
        warrantySelect.value = 'SELECT';
    }

    function updateFields(equipmentData) {
        groupSelect.value = equipmentData.GROUP || 'SELECT';
        siteSelect.value = equipmentData.SITE || 'SELECT';

        updateLineOptions(equipmentData.SITE);
        lineSelect.value = equipmentData.LINE || 'SELECT';

        equipmentTypeSelect.value = equipmentData.TYPE || 'SELECT';
        warrantySelect.value = equipmentData.WARRANTY_STATUS || 'SELECT';

        console.log('Updated fields:', {
            GROUP: groupSelect.value,
            SITE: siteSelect.value,
            LINE: lineSelect.value,
            TYPE: equipmentTypeSelect.value,
            WARRANTY: warrantySelect.value,
        });
    }

    function updateLineOptions(siteSelection) {
        const lineOptions = {
            PT: ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
            HS: ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
            IC: ["M10", "M14", "M16", "R3"],
            CJ: ["M11", "M12", "M15"],
            PSKH: ["PSKH", "C1", "C2", "C3", "C5"]
        };

        console.log(`Updating line options for site: ${siteSelection}`);
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

    function mapEquipmentData(equipmentData, equipmentName) {
        const normalizedEquipmentName = equipmentName.toLowerCase();
        const matchedEquipment = equipmentData.find(eq => eq.EQNAME.toLowerCase() === normalizedEquipmentName);

        if (matchedEquipment) {
            console.log("Mapped equipmentData:", matchedEquipment);
            return matchedEquipment;
        } else {
            console.warn(`No equipment matched for name: ${equipmentName}`);
            return null;
        }
    }

    // RESET 버튼과 INFO 필드 초기화
function resetFields() {
    groupSelect.value = 'SELECT';
    siteSelect.value = 'SELECT';
    lineSelect.value = 'SELECT';
    equipmentTypeSelect.value = 'SELECT';
    warrantySelect.value = 'SELECT';
    infoTextarea.value = '';
}

// INFO 필드 업데이트
function updateFields(equipmentData) {
    groupSelect.value = equipmentData.GROUP || 'SELECT';
    siteSelect.value = equipmentData.SITE || 'SELECT';
    updateLineOptions(equipmentData.SITE);
    lineSelect.value = equipmentData.LINE || 'SELECT';
    equipmentTypeSelect.value = equipmentData.TYPE || 'SELECT';
    warrantySelect.value = equipmentData.WARRANTY_STATUS || 'SELECT';
    infoTextarea.value = equipmentData.INFO || '';
}
});

document.getElementById('check-warranty').addEventListener('click', function () {
    // Fetch INFO와 같은 데이터를 가져오는 기존 로직...
});

document.getElementById('save-info').addEventListener('click', function () {
    const equipmentName = equipmentNameInput.value.trim();
    const updatedInfo = infoTextarea.value.trim();

    if (!equipmentName) {
        alert('설비명을 입력하세요.');
        return;
    }

    fetch(`http://3.37.73.151:3001/api/equipment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eqname: equipmentName, info: updatedInfo }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('특이사항이 성공적으로 저장되었습니다.');
            } else {
                alert('저장에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error updating info:', error);
            alert('정보 저장 중 오류가 발생했습니다.');
        });
});
