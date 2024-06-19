exports.createMaintSelf = async function (connection, maintSelfData) {
    const query = `
        INSERT INTO SUPRA_N_MAINT_SELF (
            nickname, LP_ESCORT, ROBOT_ESCORT, EFEM_ROBOT_TEACHING, EFEM_ROBOT_REP, EFEM_ROBOT_CONTROLLER_REP, 
            TM_ROBOT_TEACHING, TM_ROBOT_REP, TM_ROBOT_CONTROLLER_REP, PASSIVE_PAD_REP, PIN_CYLINDER, PUSHER_CYLINDER, 
            IB_FLOW, DRT, FFU_CONTROLLER, FAN, MOTOR_DRIVER, FCIP, R1, R3, R5, R3_TO_R5, MICROWAVE, APPLICATOR, 
            GENERATOR, CHUCK, PROCESS_KIT, HELIUM_DETECTOR, HOOK_LIFT_PIN, BELLOWS, PIN_SENSOR, LM_GUIDE, 
            PIN_MOTOR_CONTROLLER, SINGLE, DUAL, GAS_BOX_BOARD, TEMP_CONTROLLER_BOARD, POWER_DISTRIBUTION_BOARD, 
            DC_POWER_SUPPLY, BM_SENSOR, PIO_SENSOR, SAFETY_MODULE, D_NET, MFC, VALVE, SOLENOID, FAST_VAC_VALVE, 
            SLOW_VAC_VALVE, SLIT_DOOR, APC_VALVE, SHUTOFF_VALVE, BARATRON_ASSY, PIRANI_ASSY, VIEW_PORT_QUARTZ, 
            FLOW_SWITCH, CERAMIC_PLATE, MONITOR, KEYBOARD, MOUSE, CTC, PMC, EDA, EFEM_CONTROLLER, SW_PATCH
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const params = [
        maintSelfData.nickname, maintSelfData.LP_ESCORT, maintSelfData.ROBOT_ESCORT, maintSelfData.EFEM_ROBOT_TEACHING, 
        maintSelfData.EFEM_ROBOT_REP, maintSelfData.EFEM_ROBOT_CONTROLLER_REP, maintSelfData.TM_ROBOT_TEACHING, 
        maintSelfData.TM_ROBOT_REP, maintSelfData.TM_ROBOT_CONTROLLER_REP, maintSelfData.PASSIVE_PAD_REP, 
        maintSelfData.PIN_CYLINDER, maintSelfData.PUSHER_CYLINDER, maintSelfData.IB_FLOW, maintSelfData.DRT, 
        maintSelfData.FFU_CONTROLLER, maintSelfData.FAN, maintSelfData.MOTOR_DRIVER, maintSelfData.FCIP, maintSelfData.R1, 
        maintSelfData.R3, maintSelfData.R5, maintSelfData.R3_TO_R5, maintSelfData.MICROWAVE, maintSelfData.APPLICATOR, 
        maintSelfData.GENERATOR, maintSelfData.CHUCK, maintSelfData.PROCESS_KIT, maintSelfData.HELIUM_DETECTOR, 
        maintSelfData.HOOK_LIFT_PIN, maintSelfData.BELLOWS, maintSelfData.PIN_SENSOR, maintSelfData.LM_GUIDE, 
        maintSelfData.PIN_MOTOR_CONTROLLER, maintSelfData.SINGLE, maintSelfData.DUAL, maintSelfData.GAS_BOX_BOARD, 
        maintSelfData.TEMP_CONTROLLER_BOARD, maintSelfData.POWER_DISTRIBUTION_BOARD, maintSelfData.DC_POWER_SUPPLY, 
        maintSelfData.BM_SENSOR, maintSelfData.PIO_SENSOR, maintSelfData.SAFETY_MODULE, maintSelfData.D_NET, 
        maintSelfData.MFC, maintSelfData.VALVE, maintSelfData.SOLENOID, maintSelfData.FAST_VAC_VALVE, 
        maintSelfData.SLOW_VAC_VALVE, maintSelfData.SLIT_DOOR, maintSelfData.APC_VALVE, maintSelfData.SHUTOFF_VALVE, 
        maintSelfData.BARATRON_ASSY, maintSelfData.PIRANI_ASSY, maintSelfData.VIEW_PORT_QUARTZ, maintSelfData.FLOW_SWITCH, 
        maintSelfData.CERAMIC_PLATE, maintSelfData.MONITOR, maintSelfData.KEYBOARD, maintSelfData.MOUSE, 
        maintSelfData.CTC, maintSelfData.PMC, maintSelfData.EDA, maintSelfData.EFEM_CONTROLLER, maintSelfData.SW_PATCH
    ];
    const [result] = await connection.query(query, params);
    return result;
};

exports.getMaintSelfByNickname = async function (connection, nickname) {
    const query = `
        SELECT * FROM SUPRA_N_MAINT_SELF WHERE nickname = ?
    `;
    const params = [nickname];
    const [result] = await connection.query(query, params);
    return result;
};
