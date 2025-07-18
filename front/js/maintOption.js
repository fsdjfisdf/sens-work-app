document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2 for transferOptionSelect
    $('#transferOptionSelect').select2();

    const workTypeSelect = document.getElementById('workType');
    const equipmentTypeSelect = document.getElementById('equipment_type');
    const transferOptionContainer = document.getElementById('transferOptions');
    const transferOptionSelect = document.getElementById('transferOptionSelect');

    const transferOptions = { // SR8241 TEACHING, SR8240 TEACHING, M124 TEACHING, SR8250 TEACHING, SR8232 TEACHING, PRISM, IO BOX, FPS BOARD, HEATING JACKET, WATER LEAK DETECTOR, MANOMETER, TEMP LIMIT CONTROLLER, TEMP CONTROLLER
        "SUPRA N": ["SELECT", "LP ESCORT", "ROBOT ESCORT", "SR8241 TEACHING", "SR8240 TEACHING", "M124 TEACHING", "EFEM FIXTURE", "EFEM ROBOT REP", "EFEM ROBOT CONTROLLER",
        "SR8250 TEACHING", "SR8232 TEACHING", "TM FIXTURE", "TM ROBOT REP", "TM ROBOT CONTROLLER", "PASSIVE PAD REP", "PIN CYLINDER", "PUSHER CYLINDER", "IB FLOW", "DRT", "FFU CONTROLLER", "FAN", "MOTOR DRIVER",
        "R1","R3","R5","R3 TO R5","PRISM" , "MICROWAVE", "APPLICATOR", "GENERATOR", "CHUCK", "PROCESS KIT", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
        "PIN SENSOR", "LM GUIDE", "PIN MOTOR CONTROLLER", "SINGLE EPD", "DUAL EPD", "GAS BOX BOARD", "TEMP CONTROLLER BOARD", "POWER DISTRIBUTiON BOARD",
        "DC POWER SUPPLY", "BM SENSOR", "PIO SENSOR", "SAFETY MODULE", "IO BOX", "FPS BOARD", "D-NET", "MFC", "VALVE", "SOLENOID","FAST VAC VALVE", "SLOW VAC VALVE",
        "SLIT DOOR", "APC VALVE", "SHUTOFF VALVE", "BARATRON ASS'Y", "PIRANI ASS'Y", "VIEW PORT QUARTZ", "FLOW SWITCH", "CERAMIC PLATE", "MONITOR",
        "KEYBOARD","HEATING JACKET", "WATER LEAK DETECTOR", "MANOMETER", "MOUSE","CTC","PMC","EDA", "TEMP LIMIT CONTROLLER", "TEMP CONTROLLER", "EFEM CONTROLLER","S/W PATCH"],
        "SUPRA XP": [
            "SELECT", "LP ESCORT", "ROBOT ESCORT", "SR8241 TEACHING", "ROBOT REP", "ROBOT CONTROLLER REP", "END EFFECTOR REP", "PERSIMMON TEACHING",
            "END EFFECTORPAD REP", "LL PIN", "LL SENSOR", "LL DSA", "GAS LINE", "LL ISOLATION VV", "FFU CONTROLLER", "FAN", "MOTOR DRIVER", "MATCHER",
            "3000QC", "3100QC", "CHUCK", "PROCESS KIT", "SLOT VALVE BLADE", "TEFLON ALIGN PIN", "O-RING", "HELIUM DETECTOR", "HOOK LIFT PIN", "BELLOWS",
            "PIN BOARD", "LM GUIDE", "PIN MOTOR CONTROLLER", "LASER PIN SENSOR", "DUAL", "DC POWER SUPPLY", "PIO SENSOR", "D-NET", "SIM BOARD", "MFC",
            "VALVE", "SOLENOID", "PENDULUM VALVE", "SLOT VALVE DOOR VALVE", "SHUTOFF VALVE", "RF GENERATOR", "BARATRON ASSY", "PIRANI ASSY", "VIEW PORT QUARTZ",
            "FLOW SWITCH", "CERAMIC PLATE", "MONITOR", "KEYBOARD", "SIDE STORAGE", "32 MULTI PORT", "MINI8", "TM EPC (MFC)", "CTC", "EFEM CONTROLLER", "SW PATCH"
        ],
        "INTEGER Plus": [
        "SELECT",
        "SWAP KIT",
        "GAS LINE & GAS FILTER",
        "TOP FEED THROUGH",
        "GAS GEED THROUGH",
        "CERAMIC PARTS",
        "MATCHER",
        "PM BAFFLE",
        "AM BAFFLE",
        "FLANGE ADAPTOR",
        "SLOT VALVE ASSY(HOUSING)",
        "SLOT VALVE",
        "DOOR VALVE",
        "PENDULUM VALVE",
        "PIN ASSY MODIFY",
        "MOTOR & CONTROLLER",
        "PIN 구동부 ASSY",
        "PIN BELLOWS",  // Added from the table
        "SENSOR",
        "STEP MOTOR & CONTROLLER",
        "CASSETTE & HOLDER PAD",  // Added from the table
        "BALL SCREW ASSY",  // Added from the table
        "BUSH",  // Added from the table
        "MAIN SHAFT",  // Added from the table
        "BELLOWS",  // Added from the table
        "EFEM ROBOT REP",
        "TM ROBOT REP",
        "EFEM ROBOT TEACHING",
        "TM ROBOT TEACHING",
        "TM ROBOT SERVO PACK",
        "UNDER COVER",
        "VAC LINE",
        "BARATRON GAUGE",
        "PIRANI GAUGE",
        "CONVACTION GAUGE",
        "MANUAL VALVE",
        "PNEUMATIC VALVE",
        "ISOLATION VALVE",
        "VACUUM BLOCK",
        "CHECK VALVE",
        "EPC",
        "PURGE LINE REGULATOR",
        "COOLING CHUCK",  // Changed from "CHUCK" to match the table
        "HEATER CHUCK",  // Added from the table
        "GENERATOR",
        "D-NET BOARD",
        "SOURCE BOX BOARD",
        "INTERFACE BOARD",
        "SENSOR BOARD",
        "PIO SENSOR BOARD",
        "AIO CALIBRATION(PSK BOARD)",
        "AIO CALIBRATION(TOS BOARD)",
        "CODED SENSOR",
        "GAS BOX DOOR SENSOR",
        "LASER SENSOR AMP",
        "HE LEAK CHECK",
        "DIFFUSER",
        "LOT 조사",
        "GAS SPRING"
    ],
        "PRECIA": [
            "SELECT",
            "PM CENTERING",
            "PM CLN",
            "EFEM ROBOT TEACHING",
            "TM ROBOT TEACHING",
            "PM SLOT VALVE REP",
            "PM PEEK PLATE REP",
            "PM RF MATCHER REP",
            "PM PIN HOLDER REP",
            "PM GAP SENSOR ADJUST",
            "PM PROCESS KIT REP",
            "LOT 조사",
            "LP ESCORT"
        ],
        "ECOLITE": ["이관항목 없음"],
        "GENEVA": ["이관항목 없음"]
    };

    const supraModels = ["SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM", "SUPRA Q"];
    const integerModels = ["INTEGER IVr", "INTEGER XP"];

    // Assign the same options for SUPRA N to other SUPRA models
    supraModels.forEach(model => {
        transferOptions[model] = transferOptions["SUPRA N"];
    });

    // Assign the same options for INTEGER to other INTEGER models
    integerModels.forEach(model => {
        transferOptions[model] = transferOptions["INTEGER Plus"];
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
