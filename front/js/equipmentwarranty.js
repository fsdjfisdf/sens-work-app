document.addEventListener('DOMContentLoaded', function() {
    const checkWarrantyButton = document.getElementById('check-warranty');
    const equipmentNameInput = document.getElementById('equipment_name');
    const groupSelect = document.getElementById('group');
    const siteSelect = document.getElementById('site');
    const lineSelect = document.getElementById('line');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const warrantySelect = document.getElementById('warranty');

    checkWarrantyButton.addEventListener('click', function() {
        const equipmentName = equipmentNameInput.value.trim();

        if (!equipmentName) {
            alert('설비명을 입력하세요.');
            return;
        }

        fetch(`http://3.37.165.84:3001/api/equipment?eqname=${equipmentName}`)
            .then(response => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data);

                if (data.length === 0) {
                    alert('정보가 없습니다. 직접 선택하세요.');
                    resetFields();
                } else {
                    const equipmentData = data[0];
                    groupSelect.value = equipmentData.GROUP || 'SELECT';
                    siteSelect.value = equipmentData.SITE || 'SELECT';
                    updateLineOptions(equipmentData.SITE);
                    lineSelect.value = equipmentData.LINE || 'SELECT';
                    equipmentTypeSelect.value = equipmentData.TYPE || 'SELECT';
                    warrantySelect.value = equipmentData.WARRANTY_STATUS || 'SELECT';
                }
            })
            .catch(error => {
                console.error('Error:', error);
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

    function updateLineOptions(siteSelection) {
        const lineOptions = {
            "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
            "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
            "IC": ["M10", "M14", "M16", "R3"],
            "CJ": ["M11", "M12", "M15"],
            "PSKH": ["PSKH"]
        };

        lineSelect.innerHTML = '<option value="SELECT">SELECT</option>';
        if (lineOptions[siteSelection]) {
            lineOptions[siteSelection].forEach(function(line) {
                const option = document.createElement('option');
                option.value = option.textContent = line;
                lineSelect.appendChild(option);
            });
        }
    }
});
