document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for maintOptionSelect and transferOptionSelect
    $('#maintOptionSelect').select2();
    $('#transferOptionSelect').select2();

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const maintOptionContainer = document.getElementById('maintOptions');
    const maintOptionSelect = document.getElementById('maintOptionSelect');
    const transferOptionContainer = document.getElementById('transferOptions');
    const transferOptionSelect = document.getElementById('transferOptionSelect');

    const maintOptions = {
        "SUPRA N": ["SELECT", "LP ESCORT", "EFEM ROBOT TEACHING", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER", "TM ROBOT TEACHING", "TM ROBOT REP",
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

    const transferOptions = {
        "SUPRA N": ["SELECT", "LP ESCORT", "EFEM ROBOT TEACHING", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER", "TM ROBOT TEACHING", "TM ROBOT REP",
        "TM ROBOT CONTROLLER", "PASSIVE PAD REP", "PIN CYLINDER", "PUSHER CYLINDER", "IB FLOW", "DRT", "FFU CONTROLLER", "FAN", "MOTOR DRIVER",
        "R1","R3","R5","R3 TO R5", "MICROWAVE", "APPLICATOR", "GENERATOR", "CHUCK", "PROCESS KIT", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
        "PIN SENSOR", "LM GUIDE", "PIN MOTOR CONTROLLER", "SINGLE EPD", "DUAL EPD", "GAS BOX BOARD", "TEMP CONTROLLER BOARD", "POWER DISTRIBUTiON BOARD",
        "DC POWER SUPPLY", "BM SENSOR", "PIO SENSOR", "SAFETY MODULE", "D-NET", "MFC", "VALVE", "SOLENOID","FAST VAC VALVE", "SLOW VAC VALVE",
        "SLIT DOOR", "APC VALVE", "SHUTOFF VALVE", "BARATRON ASS'Y", "PIRANI ASS'Y", "VIEW PORT QUARTZ", "FLOW SWITCH", "CERAMIC PLATE", "MONITOR",
        "KEYBOARD","MOUSE","CTC","PMC","EDA","EFEM CONTROLLER","S/W PATCH"],
        "SUPRA XP": ["SELECT", "TRANSFER OPTION 1"],
        "INTEGER": ["SELECT", "SWAP KIT", "GAS LINE & GAS FILTER","FLANGE ADAPTOR","SLOT VALVE ASSY(HOUSING)","SLOT VALVE","DOOR VALVE",
            "PENDULUM VALVE","PIN ASSY MODIFY","MOTOR & CONTROLLER","PIN 구동부 ASSY","SENSOR","STEP MOTOR & CONTROLLER","LL 구동부 ASSY",
            "EFEM ROBOT REP","TM ROBOT REP", "EFEM ROBOT TEACHING", "TM ROBOT TEACHING","UNDER COVER","VAC LINE","BARATRON GAUGE",
            "PIRANI GAUGE","MANUAL VALVE","PNEUMATIC VALVE","ISOLATION VALVE","VACUUM BLOCK","CHECK VALVE","EPC","CHUCK","GENERATOR",
            "AIO CALIBRATION(PSK BOARD)","AIO CALIBRATION(TOS BOARD)","CODED SENSOR","GAS BOX DOOR SENSOR","LASER SENSOR AMP"],
        "PRECIA": ["SELECT"],
        "ECOLITE": ["SELECT"],
        "JENEVA": ["SELECT"]
    };

    const supraModels = ["SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM"];
    const integerModels = ["INTEGER IVr", "INTEGER plus", "INTEGER XP"];

    // Assign the same options for SUPRA N to other SUPRA models
    supraModels.forEach(model => {
        maintOptions[model] = maintOptions["SUPRA N"];
        transferOptions[model] = transferOptions["SUPRA N"];
    });

    // Assign the same options for INTEGER to other INTEGER models
    integerModels.forEach(model => {
        maintOptions[model] = maintOptions["INTEGER"];
        transferOptions[model] = transferOptions["INTEGER"];
    });

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

    function updateMaintOptions() {
        if (workTypeSelect.value === 'MAINT') {
            maintOptionContainer.style.display = 'block';
            transferOptionContainer.style.display = 'none';
            const maintOptionsList = maintOptions[equipmentTypeSelect.value] || ["SELECT"];
            updateOptions(maintOptionSelect, maintOptionsList);
        } else if (workTypeSelect.value === 'TRANSFER') {
            maintOptionContainer.style.display = 'none';
            transferOptionContainer.style.display = 'block';
            const transferOptionsList = transferOptions[equipmentTypeSelect.value] || ["SELECT"];
            updateOptions(transferOptionSelect, transferOptionsList);
        } else {
            maintOptionContainer.style.display = 'none';
            transferOptionContainer.style.display = 'none';
        }
    }

    workTypeSelect.addEventListener('change', updateMaintOptions);
    equipmentTypeSelect.addEventListener('change', updateMaintOptions);
});
