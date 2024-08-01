document.addEventListener('DOMContentLoaded', function() {
    const checkWarrantyButton = document.getElementById('check-warranty');
    const equipmentNameInput = document.getElementById('equipment_name');
    const warrantySelect = document.getElementById('warranty');

    checkWarrantyButton.addEventListener('click', function() {
        const equipmentName = equipmentNameInput.value.trim();

        if (!equipmentName) {
            alert('설비명을 입력하세요.');
            return;
        }

        fetch(`http://3.37.165.84/api/equipment?eqname=${equipmentName}`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched data:', data); // 콘솔에 데이터를 출력하여 확인

                if (data.length === 0) {
                    alert('정보가 없습니다. 직접 선택하세요.');
                    warrantySelect.value = 'SELECT';
                } else {
                    const warrantyStatus = data[0].WARRANTY_STATUS;
                    console.log('Fetched warranty status:', warrantyStatus); // 데이터를 다시 출력하여 확인

                    if (warrantyStatus === 'WI') {
                        warrantySelect.value = 'WI';
                    } else if (warrantyStatus === 'WO') {
                        warrantySelect.value = 'WO';
                    } else {
                        alert('정보가 없습니다. 직접 선택하세요.');
                        warrantySelect.value = 'SELECT';
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('정보를 가져오는 데 오류가 발생했습니다. 다시 시도하세요.');
            });
    });
});
