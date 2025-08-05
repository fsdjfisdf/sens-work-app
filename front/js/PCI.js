document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('x-access-token');
    const groupSelect = document.getElementById('groupSelect');
    const equipmentSelect = document.getElementById('equipmentSelect');
    const taskTypeSelect = document.getElementById('taskTypeSelect');
    const moveButton = document.getElementById('moveButton');
    const resetButton = document.getElementById('resetButton');

    // 토큰이 없는 경우 로그인 페이지로 리다이렉트
    if (!token) {
        alert("로그인이 필요합니다.");
        window.location.replace("./signin.html");
        return;
    }

    // 그룹 선택에 따른 설비 필드 업데이트 옵션
    const equipmentOptions = {
        "": ["SUPRA N", "SUPRA XP", "INTEGER", "PRECIA", "ECOLITE", "GENEVA"],
        "PEE1": ["SUPRA N", "SUPRA XP"],
        "PEE2": ["INTEGER", "PRECIA"],
        "PSKH": ["ECOLITE", "GENEVA", "HDW"]
    };

    // 설비와 작업 종류에 따른 URL 매핑
    const urlMapping = {
        "SUPRA N": { "SET UP": "supra_setup_total.html", "MAINTENANCE": "worklog-table.html" },
        "SUPRA XP": { "SET UP": "supra_xp_setup_total.html", "MAINTENANCE": "supra_xp-table.html" },
        "INTEGER": { "SET UP": "integer_setup_total.html", "MAINTENANCE": "integer-table.html" },
        "PRECIA": { "SET UP": "precia_setup_total.html", "MAINTENANCE": "precia-table.html" },
        "ECOLITE": { "SET UP": "ecolite_setup_total.html", "MAINTENANCE": "ecolite-table.html" },
        "GENEVA": { "SET UP": "geneva_setup_total.html", "MAINTENANCE": "geneva-table.html" },
        "HDW": { "SET UP": "hdw_setup_total.html", "MAINTENANCE": "hdw-table.html" }
    };

    // 그룹 선택 시 설비 필드 업데이트
    function updateEquipmentOptions() {
        const selectedGroup = groupSelect.value;
        equipmentSelect.innerHTML = '<option value="">Select Equipment</option>';

        equipmentOptions[selectedGroup].forEach(equipment => {
            const option = document.createElement('option');
            option.value = equipment;
            option.textContent = equipment;
            equipmentSelect.appendChild(option);
        });
    }

    // 이동 버튼 활성화 상태 업데이트
    function updateMoveButtonState() {
        moveButton.disabled = !(groupSelect.value && equipmentSelect.value && taskTypeSelect.value);
    }

    // 이동 버튼 클릭 시 URL로 이동
    moveButton.addEventListener('click', () => {
        const selectedEquipment = equipmentSelect.value;
        const selectedTaskType = taskTypeSelect.value;

        if (urlMapping[selectedEquipment] && urlMapping[selectedEquipment][selectedTaskType]) {
            const targetUrl = urlMapping[selectedEquipment][selectedTaskType];
            window.location.href = targetUrl;
        }
    });

    // 리셋 버튼 클릭 시 초기화
    resetButton.addEventListener('click', () => {
        groupSelect.value = "";
        equipmentSelect.innerHTML = '<option value="">Select Equipment</option>';
        taskTypeSelect.value = "";
        updateMoveButtonState();
    });

    // 필드 변경 이벤트 설정
    groupSelect.addEventListener('change', () => {
        updateEquipmentOptions();
        updateMoveButtonState();
    });

    equipmentSelect.addEventListener('change', updateMoveButtonState);
    taskTypeSelect.addEventListener('change', updateMoveButtonState);
});
