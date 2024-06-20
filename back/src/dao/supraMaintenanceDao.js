const { pool } = require('../../config/database'); // 올바른 경로로 수정

exports.getUserById = async (userId) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT userID, nickname FROM Users WHERE userIdx = ? AND status = 'A'`;
    const [rows] = await connection.query(query, [userId]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving user: ${err.message}`);
  }
};

exports.saveChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO SUPRA_N_MAINT_SELF (
        name, LP_ESCORT, ROBOT_ESCORT, EFEM_ROBOT_TEACHING, EFEM_ROBOT_REP, EFEM_ROBOT_CONTROLLER_REP,
        TM_ROBOT_TEACHING, TM_ROBOT_REP, TM_ROBOT_CONTROLLER_REP, PASSIVE_PAD_REP, PIN_CYLINDER, PUSHER_CYLINDER,
        IB_FLOW, DRT, FFU_CONTROLLER, FAN, MOTOR_DRIVER, FCIP, R1, R3, R5, R3_TO_R5, MICROWAVE, APPLICATOR,
        GENERATOR, CHUCK, PROCESS_KIT, HELIUM_DETECTOR, HOOK_LIFT_PIN, BELLOWS, PIN_SENSOR, LM_GUIDE,
        PIN_MOTOR_CONTROLLER, SINGLE, DUAL, GAS_BOX_BOARD, TEMP_CONTROLLER_BOARD, POWER_DISTRIBUTION_BOARD,
        DC_POWER_SUPPLY, BM_SENSOR, PIO_SENSOR, SAFETY_MODULE, D_NET, MFC, VALVE, SOLENOID, FAST_VAC_VALVE,
        SLOW_VAC_VALVE, SLIT_DOOR, APC_VALVE, SHUTOFF_VALVE, BARATRON_ASSY, PIRANI_ASSY, VIEW_PORT_QUARTZ,
        FLOW_SWITCH, CERAMIC_PLATE, MONITOR, KEYBOARD, MOUSE, CTC, PMC, EDA, EFEM_CONTROLLER, SW_PATCH
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      checklistData.name, checklistData['LP_ESCORT'], checklistData['ROBOT_ESCORT'], checklistData['EFEM_ROBOT_TEACHING'],
      checklistData['EFEM_ROBOT_REP'], checklistData['EFEM_ROBOT_CONTROLLER_REP'], checklistData['TM_ROBOT_TEACHING'],
      checklistData['TM_ROBOT_REP'], checklistData['TM_ROBOT_CONTROLLER_REP'], checklistData['PASSIVE_PAD_REP'],
      checklistData['PIN_CYLINDER'], checklistData['PUSHER_CYLINDER'], checklistData['IB_FLOW'], checklistData['DRT'],
      checklistData['FFU_CONTROLLER'], checklistData['FAN'], checklistData['MOTOR_DRIVER'], checklistData['FCIP'],
      checklistData['R1'], checklistData['R3'], checklistData['R5'], checklistData['R3_TO_R5'], checklistData['MICROWAVE'],
      checklistData['APPLICATOR'], checklistData['GENERATOR'], checklistData['CHUCK'], checklistData['PROCESS_KIT'],
      checklistData['HELIUM_DETECTOR'], checklistData['HOOK_LIFT_PIN'], checklistData['BELLOWS'], checklistData['PIN_SENSOR'],
      checklistData['LM_GUIDE'], checklistData['PIN_MOTOR_CONTROLLER'], checklistData['SINGLE'], checklistData['DUAL'],
      checklistData['GAS_BOX_BOARD'], checklistData['TEMP_CONTROLLER_BOARD'], checklistData['POWER_DISTRIBUTION_BOARD'],
      checklistData['DC_POWER_SUPPLY'], checklistData['BM_SENSOR'], checklistData['PIO_SENSOR'], checklistData['SAFETY_MODULE'],
      checklistData['D_NET'], checklistData['MFC'], checklistData['VALVE'], checklistData['SOLENOID'], checklistData['FAST_VAC_VALVE'],
      checklistData['SLOW_VAC_VALVE'], checklistData['SLIT_DOOR'], checklistData['APC_VALVE'], checklistData['SHUTOFF_VALVE'],
      checklistData['BARATRON_ASSY'], checklistData['PIRANI_ASSY'], checklistData['VIEW_PORT_QUARTZ'], checklistData['FLOW_SWITCH'],
      checklistData['CERAMIC_PLATE'], checklistData['MONITOR'], checklistData['KEYBOARD'], checklistData['MOUSE'],
      checklistData['CTC'], checklistData['PMC'], checklistData['EDA'], checklistData['EFEM_CONTROLLER'], checklistData['SW_PATCH']
    ];

    console.log('SQL Query:', query);
    console.log('Values:', values);

    await connection.query(query, values);
  } catch (err) {
    console.error('Error saving checklist:', err);
    throw new Error(`Error saving checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};
