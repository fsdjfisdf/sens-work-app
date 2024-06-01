document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for maintOptionSelect and transferOptionSelect
    $('#transferOptionSelect').select2(); // 추가된 부분

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const transferOptionContainer = document.getElementById('transferOptions'); // 추가된 부분
    const transferOptionSelect = document.getElementById('transferOptionSelect'); // 추가된 부분

    const transferOptions = { // 추가된 부분
        "SUPRA N": ["SELECT", "EFEM ROBOT TEACHING", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER", "TM ROBOT TEACHING", "TM ROBOT REP",
        "TM ROBOT CONTROLLER", "PASSIVE PAD REP", "PIN CYLINDER", "PUSHER CYLINDER", "IB FLOW", "DRT", "FFU CONTROLLER", "FAN", "MOTOR DRIVER",
        "R1","R3","R5","R3 TO R5", "MICROWAVE", "APPLICATOR", "GENERATOR", "CHUCK", "PROCESS KIT", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
        "PIN SENSOR", "LM GUIDE", "PIN MOTOR CONTROLLER", "SINGLE EPD", "DUAL EPD", "GAS BOX BOARD", "TEMP CONTROLLER BOARD", "POWER DISTRIBUTiON BOARD",
        "DC POWER SUPPLY", "BM SENSOR", "PIO SENSOR", "SAFETY MODULE", "D-NET", "MFC", "VALVE", "SOLENOID","FAST VAC VALVE", "SLOW VAC VALVE",
        "SLIT DOOR", "APC VALVE", "SHUTOFF VALVE", "BARATRON ASS'Y", "PIRANI ASS'Y", "VIEW PORT QUARTZ", "FLOW SWITCH", "CERAMIC PLATE", "MONITOR",
        "KEYBOARD","MOUSE","CTC","PMC","EDA","EFEM CONTROLLER","S/W PATCH"],
        "SUPRA XP": ["SELECT", "TRANSFER OPTION 1"],
        "INTEGER": ["SELECT", "TRANSFER OPTION 1", "TRANSFER OPTION 2"],
        "PRECIA": ["SELECT"],
        "ECOLITE": ["SELECT"],
        "JENEVA": ["SELECT"]
    };

    function updateMaintOptions() {
        if (workTypeSelect.value === 'MAINT') {
            const transferOptionsList = transferOptions[equipmentTypeSelect.value] || ["SELECT"]; // 추가된 부분
            transferOptionSelect.innerHTML = ""; // 기존 옵션 초기화
            transferOptionsList.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.innerHTML = option;
                transferOptionSelect.appendChild(opt);
            });
            $('#transferOptionSelect').select2(); // re-initialize Select2 with new options
        } else {
            transferOptionContainer.style.display = 'none'; // 추가된 부분
        }
    }

    equipmentTypeSelect.addEventListener('change', updateMaintOptions);
});