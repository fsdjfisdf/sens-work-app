document.addEventListener('DOMContentLoaded', function () {
    const checkWarrantyButton = document.getElementById('check-warranty');
    const equipmentNameInput = document.getElementById('equipment_name');
    const groupSelect = document.getElementById('group');
    const siteSelect = document.getElementById('site');
    const lineSelect = document.getElementById('line');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const warrantySelect = document.getElementById('warranty');

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
                    const equipmentData = data[0];
                    console.log('Mapped equipmentData:', equipmentData);

                    // 매칭 과정에서 데이터를 출력
                    groupSelect.value = equipmentData.GROUP || 'SELECT';
                    console.log(`Group matched: ${groupSelect.value}`);

                    siteSelect.value = equipmentData.SITE || 'SELECT';
                    console.log(`Site matched: ${siteSelect.value}`);

                    updateLineOptions(equipmentData.SITE);
                    lineSelect.value = equipmentData.LINE || 'SELECT';
                    console.log(`Line matched: ${lineSelect.value}`);

                    equipmentTypeSelect.value = equipmentData.TYPE || 'SELECT';
                    console.log(`Equipment Type matched: ${equipmentTypeSelect.value}`);

                    warrantySelect.value = equipmentData.WARRANTY_STATUS || 'SELECT';
                    console.log(`Warranty matched: ${warrantySelect.value}`);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('정보를 가져오는 데 오류가 발생했습니다. 다시 시도하세요.');
            });
    });

    function resetFields() {
        groupSelect.value = 'SELECT';
        console.log('Group reset to SELECT');
        siteSelect.value = 'SELECT';
        console.log('Site reset to SELECT');
        lineSelect.value = 'SELECT';
        console.log('Line reset to SELECT');
        equipmentTypeSelect.value = 'SELECT';
        console.log('Equipment Type reset to SELECT');
        warrantySelect.value = 'SELECT';
        console.log('Warranty reset to SELECT');
    }

    function updateLineOptions(siteSelection) {
        const lineOptions = {
            "PT": ["P1F", "P1D", "P2F", "P2D", "P2-S5", "P3F", "P3D", "P3-S5", "P4F", "P4D", "P4-S5"],
            "HS": ["12L", "13L", "15L", "16L", "17L", "S1", "S3", "S4", "S3V", "NRD", "NRD-V", "U4", "M1", "5L"],
            "IC": ["M10", "M14", "M16", "R3"],
            "CJ": ["M11", "M12", "M15"],
            "PSKH": ["PSKH", "C1", "C2", "C3", "C5"]
        };

        console.log(`Updating line options for site: ${siteSelection}`);
        lineSelect.innerHTML = '<option value="SELECT">SELECT</option>';
        if (lineOptions[siteSelection]) {
            lineOptions[siteSelection].forEach(function (line) {
                const option = document.createElement('option');
                option.value = option.textContent = line;
                lineSelect.appendChild(option);
                console.log(`Added line option: ${line}`);
            });
        } else {
            console.log('No line options found for this site.');
        }
    }
});
