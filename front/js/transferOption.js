document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for transferItemOptionSelect
    $('#transferItemOptionSelect').select2();

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const transferItemOptionContainer = document.getElementById('transferItemOptions'); // 수정된 부분
    const transferItemOptionSelect = document.getElementById('transferItemOptionSelect');

    const transferItemOptions = {
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

    function updatetransferItemOptions() {
        if (workTypeSelect.value === 'MAINT') {
            transferItemOptionContainer.style.display = 'block';
            const options = transferItemOptions[equipmentTypeSelect.value] || ["SELECT"];
            transferItemOptionSelect.innerHTML = ""; // 기존 옵션 초기화
            console.log('Maint options for', equipmentTypeSelect.value, ':', options);
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.innerHTML = option;
                transferItemOptionSelect.appendChild(opt);
            });
            $('#transferItemOptionSelect').select2(); // re-initialize Select2 with new options
        } else {
            transferItemOptionContainer.style.display = 'none';
        }
    }

    workTypeSelect.addEventListener('change', updatetransferItemOptions);
    equipmentTypeSelect.addEventListener('change', updatetransferItemOptions);
});
