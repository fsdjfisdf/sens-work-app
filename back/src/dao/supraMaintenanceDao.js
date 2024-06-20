const { pool } = require('../config/database');

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      checklistData.name, checklistData['LP ESCORT'], checklistData['ROBOT ESCORT'], checklistData['EFEM ROBOT TEACHING'],
      checklistData['EFEM ROBOT REP'], checklistData['EFEM ROBOT CONTROLLER REP'], checklistData['TM ROBOT TEACHING'],
      checklistData['TM ROBOT REP'], checklistData['TM ROBOT CONTROLLER REP'], checklistData['PASSIVE PAD REP'],
      checklistData['PIN CYLINDER'], checklistData['PUSHER CYLINDER'], checklistData['IB FLOW'], checklistData['DRT'],
      checklistData['FFU CONTROLLER'], checklistData['FAN'], checklistData['MOTOR DRIVER'], checklistData['FCIP'],
      checklistData['R1'], checklistData['R3'], checklistData['R5'], checklistData['R3 TO R5'], checklistData['MICROWAVE'],
      checklistData['APPLICATOR'], checklistData['GENERATOR'], checklistData['CHUCK'], checklistData['PROCESS KIT'],
      checklistData['HELIUM DETECTOR'], checklistData['HOOK LIFT PIN'], checklistData['BELLOWS'], checklistData['PIN SENSOR'],
      checklistData['LM GUIDE'], checklistData['PIN MOTOR CONTROLLER'], checklistData['SINGLE'], checklistData['DUAL'],
      checklistData['GAS BOX BOARD'], checklistData['TEMP CONTROLLER BOARD'], checklistData['POWER DISTRIBUTION BOARD'],
      checklistData['DC POWER SUPPLY'], checklistData['BM SENSOR'], checklistData['PIO SENSOR'], checklistData['SAFETY MODULE'],
      checklistData['D-NET'], checklistData['MFC'], checklistData['VALVE'], checklistData['SOLENOID'], checklistData['FAST VAC VALVE'],
      checklistData['SLOW VAC VALVE'], checklistData['SLIT DOOR'], checklistData['APC VALVE'], checklistData['SHUTOFF VALVE'],
      checklistData['BARATRON ASSY'], checklistData['PIRANI ASSY'], checklistData['VIEW PORT QUARTZ'], checklistData['FLOW SWITCH'],
      checklistData['CERAMIC PLATE'], checklistData['MONITOR'], checklistData['KEYBOARD'], checklistData['MOUSE'],
      checklistData['CTC'], checklistData['PMC'], checklistData['EDA'], checklistData['EFEM CONTROLLER'], checklistData['S/W PATCH']
    ];

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error saving checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};
