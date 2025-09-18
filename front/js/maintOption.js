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
        "GAS SPRING",
        "LP ESCORT"
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
        "ECOLITE 300": [
            "SELECT", "LP Escort", "Robot Escort", "SR8240 Teaching", "M124V Teaching", "M124C Teaching", "Robot REP", "Robot Controller REP",
            "SR8250 Teaching", "SR8232 Teaching", "Pin Cylinder", "Pusher Cylinder", "DRT", "FFU Controller", "Fan", "Motor Driver",
            "Microwave", "Applicator", "Applicator Tube", "Generator", "Matcher", "Chuck", "Toplid Process Kit", "Chamber Process Kit",
            "Helium Detector", "Hook Lift Pin", "Bellows", "Pin Sensor", "LM Guide", "HOOK LIFTER SERVO MOTOR", "Pin Motor Controller",
            "Single", "Gas Box Board", "Power Distribution Board", "DC Power Supply", "BM Sensor", "PIO Sensor", "Safety Module",
            "IO BOX", "Rack Board", "D-NET", "MFC", "Valve", "Solenoid", "Fast Vac Valve", "Slow Vac Valve", "Slit Door", "APC Valve",
            "Shutoff Valve", "Baratron Ass'y", "Pirani Ass'y", "View Port Quartz", "Flow Switch", "Monitor", "Keyboard", "Mouse",
            "Water Leak Detector", "Manometer", "LIGHT CURTAIN", "GAS SPRING", "CTC", "PMC", "EDA", "Temp Limit Controller",
            "Temp Controller", "EFEM CONTROLLER", "S/W Patch"
        ],
        "GENEVA": [
            "SELECT", "LP Escort", "Robot Escort", "SR8240 Teaching", "GENMARK robot teaching", "SR8240 Robot REP", "GENMARK Robot REP",
            "Robot Controller REP", "FFU Controller", "Fan", "Motor Driver", "Elbow heater", "Insulation heater", "Chuck heater",
            "Harmonic driver", "Amplifier (Disc controller)", "Disc bearing", "Chuck leveling", "Wafer support pin alignment",
            "Temp profile", "O2 leak test", "Chuck up & down status", "Ring seal", "Ring seal O-ring", "Door seal", "Door seal O-ring",
            "Gas Box Board", "Temp Controller Board", "Power Distribution Board", "DC Power Supply", "Facility Board", "Station Board",
            "Bubbler Board", "D-NET", "MFC", "Valve", "O2 analyzer 교체", "O2 controller 교체", "O2 pump 교체", "O2 cell 교체",
            "O2 Sample valve", "Feed & Delivery valve", "Fill & Vent valve", "Drain valve", "APC valve", "Bypass valve", "Shutoff valve",
            "Vac sol valve", "Vac CDA valve", "Bubbler level sensor", "Bubbler flexible hose", "Baratron Ass'y", "View Port",
            "Flow Switch", "LL Door cylinder", "Chuck cylinder", "Monitor", "Keyboard", "Mouse", "Water Leak Detector",
            "Formic Detector", "Exhaust gauge", "CTC", "EDA", "Temp Limit Controller", "Temp Controller", "S/W Patch"
        ],
        "HDW": [
            "SELECT", "OD REP", "Relay REP", "Fan REP", "NTC / NTU REP", "SSR REP", "MC REP", "Fuse REP", "CT REP", "HBD REP", "SMPS REP",
            "PLC (main unit 제외) REP", "ELB REP", "Heater (Halogen lamp) REP", "Q'tz tank REP", "Leak troubleshooting", "Flow meter REP",
            "Air valve REP", "Shut off valve REP", "Sol valve REP", "Elbow fitting (Q'tz) REP", "Leak tray", "TC Sensor", "Touch panel patch",
            "PLC patch", "Touch panel REP", "PLC REP"
        ]
    };

    const supraModels = ["SUPRA NM", "SUPRA III", "SUPRA IV", "SUPRA V", "SUPRA Vplus", "SUPRA VM", "SUPRA Q"];
    const integerModels = ["INTEGER IVr", "INTEGER XP"];
    const ecoliteModels = ["ECOLITE 300", "ECOLITE 400", "ECOLITE 3000", "ECOLITE XP", "TERA21"];

    // Assign the same options for SUPRA N to other SUPRA models
    supraModels.forEach(model => {
        transferOptions[model] = transferOptions["SUPRA N"];
    });

    // Assign the same options for INTEGER to other INTEGER models
    integerModels.forEach(model => {
        transferOptions[model] = transferOptions["INTEGER Plus"];
    });

    ecoliteModels.forEach(model => {
    transferOptions[model] = transferOptions["ECOLITE 300"];
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
