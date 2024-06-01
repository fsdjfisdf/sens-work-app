document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for maintOptionSelect and transferOptionSelect
    $('#maintOptionSelect').select2();
    $('#transferOptionSelect').select2(); // 추가된 부분

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const maintOptionContainer = document.getElementById('maintOptions');
    const maintOptionSelect = document.getElementById('maintOptionSelect');
    const transferOptionContainer = document.getElementById('transferOptions'); // 추가된 부분
    const transferOptionSelect = document.getElementById('transferOptionSelect'); // 추가된 부분

    const maintOptions = {
        "SUPRA N": ["SELECT", "EFEM ROBOT TEACHING", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER", "TM ROBOT TEACHING", "TM ROBOT REP",
            "TM ROBOT CONTROLLER", "PASSIVE PAD REP", "PIN CYLINDER", "PUSHER CYLINDER", "IB FLOW", "DRT", "FFU CONTROLLER", "FAN", "MOTOR DRIVER",
            "R1","R3","R5","R3 TO R5", "MICROWAVE", "APPLICATOR", "GENERATOR", "CHUCK", "PROCESS KIT", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
            "PIN SENSOR", "LM GUIDE", "PIN MOTOR CONTROLLER", "SINGLE EPD", "DUAL EPD", "GAS BOX BOARD", "TEMP CONTROLLER BOARD", "POWER DISTRIBUTiON BOARD",
            "DC POWER SUPPLY", "BM SENSOR", "PIO SENSOR", "SAFETY MODULE", "D-NET", "MFC", "VALVE", "SOLENOID","FAST VAC VALVE", "SLOW VAC VALVE",
            "SLIT DOOR", "APC VALVE", "SHUTOFF VALVE", "BARATRON ASS'Y", "PIRANI ASS'Y", "VIEW PORT QUARTZ", "FLOW SWITCH", "CERAMIC PLATE", "MONITOR",
            "KEYBOARD","MOUSE","CTC","PMC","EDA","EFEM CONTROLLER","S/W PATCH"],
        "SUPRA XP": ["SELECT"],
        "INTEGER": ["SELECT", "SWAP KIT", "GAS LINE & GAS FILTER","FLANGE ADAPTOR","SLOT VALVE ASSY(HOUSING)","SLOT VALVE","DOOR VALVE",
            "PENDULUM VALVE","PIN ASSY MODIFY","MOTOR & CONTROLLER","PIN 구동부 ASSY","SENSOR","STEP MOTOR & CONTROLLER","LL 구동부 ASSY",
            "EFEM ROBOT REP","TM ROBOT REP", "EFEM ROBOT TEACHING", "TM ROBOT TEACHING","UNDER COVER","VAC LINE","BARATRON GAUGE",
            "PIRANI GAUGE","MANUAL VALVE","PNEUMATIC VALVE","ISOLATION VALVE","VACUUM BLOCK","CHECK VALVE","EPC","CHUCK","GENERATOR",
            "AIO CALIBRATION(PSK BOARD)","AIO CALIBRATION(TOS BOARD)","CODED SENSOR","GAS BOX DOOR SENSOR","LASER SENSOR AMP"],
        "PRECIA": ["SELECT"],
        "ECOLITE": ["SELECT"],
        "JENEVA": ["SELECT"]
    };

    const transferOptions = { // 추가된 부분
        "SUPRA N": ["SELECT", "TRANSFER OPTION 1", "TRANSFER OPTION 2"],
        "SUPRA XP": ["SELECT", "TRANSFER OPTION 1"],
        "INTEGER": ["SELECT", "TRANSFER OPTION 1", "TRANSFER OPTION 2"],
        "PRECIA": ["SELECT"],
        "ECOLITE": ["SELECT"],
        "JENEVA": ["SELECT"]
    };

    function updateMaintOptions() {
        if (workTypeSelect.value === 'MAINT') {
            maintOptionContainer.style.display = 'block';
            transferOptionContainer.style.display = 'block'; // 추가된 부분
            const maintOptionsList = maintOptions[equipmentTypeSelect.value] || ["SELECT"];
            maintOptionSelect.innerHTML = "";
            maintOptionsList.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.innerHTML = option;
                maintOptionSelect.appendChild(opt);
            });
            $('#maintOptionSelect').select2();

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
            maintOptionContainer.style.display = 'none';
            transferOptionContainer.style.display = 'none'; // 추가된 부분
        }
    }

    workTypeSelect.addEventListener('change', updateMaintOptions);
    equipmentTypeSelect.addEventListener('change', updateMaintOptions);
});
