document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for transferOptionSelect
    $('#transferOptionSelect').select2();

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const transferOptionContainer = document.getElementById('transferOptions');
    const transferOptionSelect = document.getElementById('transferOptionSelect');

    const transferOptions = {
        "SUPRA N": ["SELECT", "LP ESCORT", "ROBOT ESCORT", "EFEM ROBOT TEACHING", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER", "TM ROBOT TEACHING", "TM ROBOT REP",
        "TM ROBOT CONTROLLER", "PASSIVE PAD REP", "PIN CYLINDER", "PUSHER CYLINDER", "IB FLOW", "DRT", "FFU CONTROLLER", "FAN", "MOTOR DRIVER",
        "R1","R3","R5","R3 TO R5", "MICROWAVE", "APPLICATOR", "GENERATOR", "CHUCK", "PROCESS KIT", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
        "PIN SENSOR", "LM GUIDE", "PIN MOTOR CONTROLLER", "SINGLE EPD", "DUAL EPD", "GAS BOX BOARD", "TEMP CONTROLLER BOARD", "POWER DISTRIBUTiON BOARD",
        "DC POWER SUPPLY", "BM SENSOR", "PIO SENSOR", "SAFETY MODULE", "D-NET", "MFC", "VALVE", "SOLENOID","FAST VAC VALVE", "SLOW VAC VALVE",
        "SLIT DOOR", "APC VALVE", "SHUTOFF VALVE", "BARATRON ASS'Y", "PIRANI ASS'Y", "VIEW PORT QUARTZ", "FLOW SWITCH", "CERAMIC PLATE", "MONITOR",
        "KEYBOARD","MOUSE","CTC","PMC","EDA","EFEM CONTROLLER","S/W PATCH"],
        "SUPRA XP": ["이관항목 없음"],
        "INTEGER plus": ["SELECT", "SWAP KIT", "GAS LINE & GAS FILTER","FLANGE ADAPTOR","SLOT VALVE ASSY(HOUSING)","SLOT VALVE","DOOR VALVE",
            "PENDULUM VALVE","PIN ASSY MODIFY","MOTOR & CONTROLLER","PIN 구동부 ASSY","SENSOR","STEP MOTOR & CONTROLLER","LL 구동부 ASSY",
            "EFEM ROBOT REP","TM ROBOT REP", "EFEM ROBOT TEACHING", "TM ROBOT TEACHING","UNDER COVER","VAC LINE","BARATRON GAUGE",
            "PIRANI GAUGE","MANUAL VALVE","PNEUMATIC VALVE","ISOLATION VALVE","VACUUM BLOCK","CHECK VALVE","EPC","CHUCK","GENERATOR",
            "AIO CALIBRATION(PSK BOARD)","AIO CALIBRATION(TOS BOARD)","CODED SENSOR","GAS BOX DOOR SENSOR","LASER SENSOR AMP"],
        "PRECIA": ["이관항목 없음"],
        "ECOLITE": ["이관항목 없음"],
        "JENEVA": ["이관항목 없음"]
    };

    const supraModels = ["SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM"];
    const integerModels = ["INTEGER IVr", "INTEGER plus", "INTEGER XP"];

    // Assign the same options for SUPRA N to other SUPRA models
    supraModels.forEach(model => {
        transferOptions[model] = transferOptions["SUPRA N"];
    });

    // Assign the same options for INTEGER to other INTEGER models
    integerModels.forEach(model => {
        transferOptions[model] = transferOptions["INTEGER plus"];
    });

    function updateTransferOptions() {
        const workTypeValue = workTypeSelect.value;
        const equipmentTypeValue = equipmentTypeSelect.value;

        if (workTypeValue === 'MAINT') {
            transferOptionContainer.style.display = 'block';
            const transferOptionsList = transferOptions[equipmentTypeValue] || ["SELECT"];
            updateOptions(transferOptionSelect, transferOptionsList);
        } else {
            transferOptionContainer.style.display = 'none';
        }
    }

    function updateOptions(selectElement, options) {
        selectElement.innerHTML = "";
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.innerHTML = option;
            selectElement.appendChild(opt);
        });
        $(selectElement).select2(); // re-initialize Select2 with new options
    }

    workTypeSelect.addEventListener('change', updateTransferOptions);
    equipmentTypeSelect.addEventListener('change', updateTransferOptions);

    transferOptionSelect.addEventListener('change', function() {
        const transfer_item = transferOptionSelect.value;
        console.log('Transfer item selected:', transfer_item);
    });
});
