document.addEventListener('DOMContentLoaded', () => {
    const addEquipmentBtn = document.getElementById('add-equipment-btn');
    const addEquipmentModal = document.getElementById('add-equipment-modal');
    const cancelAddEquipmentBtn = document.getElementById('cancel-add-equipment-btn');
    const addEquipmentForm = document.getElementById('add-equipment-form');

    // 모달 열기
    addEquipmentBtn.addEventListener('click', () => {
        addEquipmentModal.classList.remove('hidden');
    });

    // 모달 닫기
    cancelAddEquipmentBtn.addEventListener('click', () => {
        addEquipmentModal.classList.add('hidden');
    });

    // 장비 추가 폼 제출
    addEquipmentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(addEquipmentForm);
        const payload = {};
        formData.forEach((value, key) => {
            payload[key] = value;
        });

        try {
            const response = await axios.post('http://3.37.73.151:3001/api/equipment', payload);
            if (response.status === 201) {
                alert('Equipment added successfully!');
                addEquipmentModal.classList.add('hidden');
                addEquipmentForm.reset();
                // 필요하면 새 데이터를 다시 불러오기
                location.reload();
            } else {
                alert('Failed to add equipment.');
            }
        } catch (error) {
            console.error('Error adding equipment:', error);
            alert('Error adding equipment. Please try again.');
        }
    });
});
