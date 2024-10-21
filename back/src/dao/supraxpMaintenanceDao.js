const { pool } = require('../../config/database');

exports.getUserById = async (userId) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT userID, nickname FROM Users WHERE userIdx = ? AND status = 'A'`;
    const [rows] = await connection.query(query, [userId]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving user: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.findByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM SUPRA_XP_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error finding entry by name: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.insertChecklist = async (checklistData) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
        INSERT INTO SUPRA_XP_MAINT_SELF (
          name, LP_ESCORT, ROBOT_ESCORT, SR8241_TEACHING, ROBOT_REP, ROBOT_CONTROLLER_REP, END_EFFECTOR_REP,
          PERSIMMON_TEACHING, END_EFFECTOR_PAD_REP, L_L_PIN, L_L_SENSOR, L_L_DSA, GAS_LINE, L_L_ISOLATION_VV,
          FFU_CONTROLLER, FAN, MOTOR_DRIVER, MATCHER, 3000QC, 3100QC, CHUCK, PROCESS_KIT, SLOT_VALVE_BLADE,
          TEFLON_ALIGN_PIN, O_RING, HELIUM_DETECTOR, HOOK_LIFT_PIN, BELLOWS, PIN_BOARD, LM_GUIDE,
          PIN_MOTOR_CONTROLLER, LASER_PIN_SENSOR, \`DUAL\`, DC_POWER_SUPPLY, PIO_SENSOR, D_NET, SIM_BOARD,
          MFC, VALVE, SOLENOID, PENDULUM_VALVE, SLOT_VALVE_DOOR_VALVE, SHUTOFF_VALVE, RF_GENERATOR,
          BARATRON_ASSY, PIRANI_ASSY, VIEW_PORT_QUARTZ, FLOW_SWITCH, CERAMIC_PLATE, MONITOR, KEYBOARD,
          SIDE_STORAGE, MULTI_PORT_32, MINI8, TM_EPC_MFC, CTC, EFEM_CONTROLLER, SW_PATCH
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      

      const values = [
        checklistData.name, checklistData['LP_ESCORT'], checklistData['ROBOT_ESCORT'], checklistData['SR8241_TEACHING'],
        checklistData['ROBOT_REP'], checklistData['ROBOT_CONTROLLER_REP'], checklistData['END_EFFECTOR_REP'],
        checklistData['PERSIMMON_TEACHING'], checklistData['END_EFFECTOR_PAD_REP'], checklistData['L_L_PIN'],
        checklistData['L_L_SENSOR'], checklistData['L_L_DSA'], checklistData['GAS_LINE'], checklistData['L_L_ISOLATION_VV'],
        checklistData['FFU_CONTROLLER'], checklistData['FAN'], checklistData['MOTOR_DRIVER'], checklistData['MATCHER'],
        checklistData['3000QC'], checklistData['3100QC'], checklistData['CHUCK'], checklistData['PROCESS_KIT'],
        checklistData['SLOT_VALVE_BLADE'], checklistData['TEFLON_ALIGN_PIN'], checklistData['O_RING'],
        checklistData['HELIUM_DETECTOR'], checklistData['HOOK_LIFT_PIN'], checklistData['BELLOWS'], checklistData['PIN_BOARD'],
        checklistData['LM_GUIDE'], checklistData['PIN_MOTOR_CONTROLLER'], checklistData['LASER_PIN_SENSOR'],
        checklistData['DUAL'], checklistData['DC_POWER_SUPPLY'], checklistData['PIO_SENSOR'], checklistData['D_NET'],
        checklistData['SIM_BOARD'], checklistData['MFC'], checklistData['VALVE'], checklistData['SOLENOID'],
        checklistData['PENDULUM_VALVE'], checklistData['SLOT_VALVE_DOOR_VALVE'], checklistData['SHUTOFF_VALVE'],
        checklistData['RF_GENERATOR'], checklistData['BARATRON_ASSY'], checklistData['PIRANI_ASSY'],
        checklistData['VIEW_PORT_QUARTZ'], checklistData['FLOW_SWITCH'], checklistData['CERAMIC_PLATE'],
        checklistData['MONITOR'], checklistData['KEYBOARD'], checklistData['SIDE_STORAGE'], checklistData['MULTI_PORT_32'],
        checklistData['MINI8'], checklistData['TM_EPC_MFC'], checklistData['CTC'], checklistData['EFEM_CONTROLLER'],
        checklistData['SW_PATCH']
      ];
      

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error inserting checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.updateChecklist = async (checklistData) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
        UPDATE SUPRA_XP_MAINT_SELF SET
          LP_ESCORT = ?, ROBOT_ESCORT = ?, SR8241_TEACHING = ?, ROBOT_REP = ?, ROBOT_CONTROLLER_REP = ?, END_EFFECTOR_REP = ?,
          PERSIMMON_TEACHING = ?, END_EFFECTOR_PAD_REP = ?, L_L_PIN = ?, L_L_SENSOR = ?, L_L_DSA = ?, GAS_LINE = ?, L_L_ISOLATION_VV = ?,
          FFU_CONTROLLER = ?, FAN = ?, MOTOR_DRIVER = ?, MATCHER = ?, 3000QC = ?, 3100QC = ?, CHUCK = ?, PROCESS_KIT = ?, SLOT_VALVE_BLADE = ?,
          TEFLON_ALIGN_PIN = ?, O_RING = ?, HELIUM_DETECTOR = ?, HOOK_LIFT_PIN = ?, BELLOWS = ?, PIN_BOARD = ?, LM_GUIDE = ?,
          PIN_MOTOR_CONTROLLER = ?, LASER_PIN_SENSOR = ?, \`DUAL\` = ?, DC_POWER_SUPPLY = ?, PIO_SENSOR = ?, D_NET = ?, SIM_BOARD = ?,
          MFC = ?, VALVE = ?, SOLENOID = ?, PENDULUM_VALVE = ?, SLOT_VALVE_DOOR_VALVE = ?, SHUTOFF_VALVE = ?, RF_GENERATOR = ?,
          BARATRON_ASSY = ?, PIRANI_ASSY = ?, VIEW_PORT_QUARTZ = ?, FLOW_SWITCH = ?, CERAMIC_PLATE = ?, MONITOR = ?, KEYBOARD = ?,
          SIDE_STORAGE = ?, MULTI_PORT_32 = ?, MINI8 = ?, TM_EPC_MFC = ?, CTC = ?, EFEM_CONTROLLER = ?, SW_PATCH = ?
        WHERE name = ?
      `;
  
      const values = [
        checklistData['LP_ESCORT'], checklistData['ROBOT_ESCORT'], checklistData['SR8241_TEACHING'], checklistData['ROBOT_REP'],
        checklistData['ROBOT_CONTROLLER_REP'], checklistData['END_EFFECTOR_REP'], checklistData['PERSIMMON_TEACHING'],
        checklistData['END_EFFECTOR_PAD_REP'], checklistData['L_L_PIN'], checklistData['L_L_SENSOR'], checklistData['L_L_DSA'],
        checklistData['GAS_LINE'], checklistData['L_L_ISOLATION_VV'], checklistData['FFU_CONTROLLER'], checklistData['FAN'],
        checklistData['MOTOR_DRIVER'], checklistData['MATCHER'], checklistData['3000QC'], checklistData['3100QC'], checklistData['CHUCK'],
        checklistData['PROCESS_KIT'], checklistData['SLOT_VALVE_BLADE'], checklistData['TEFLON_ALIGN_PIN'], checklistData['O_RING'],
        checklistData['HELIUM_DETECTOR'], checklistData['HOOK_LIFT_PIN'], checklistData['BELLOWS'], checklistData['PIN_BOARD'],
        checklistData['LM_GUIDE'], checklistData['PIN_MOTOR_CONTROLLER'], checklistData['LASER_PIN_SENSOR'], checklistData['DUAL'],
        checklistData['DC_POWER_SUPPLY'], checklistData['PIO_SENSOR'], checklistData['D_NET'], checklistData['SIM_BOARD'],
        checklistData['MFC'], checklistData['VALVE'], checklistData['SOLENOID'], checklistData['PENDULUM_VALVE'],
        checklistData['SLOT_VALVE_DOOR_VALVE'], checklistData['SHUTOFF_VALVE'], checklistData['RF_GENERATOR'],
        checklistData['BARATRON_ASSY'], checklistData['PIRANI_ASSY'], checklistData['VIEW_PORT_QUARTZ'], checklistData['FLOW_SWITCH'],
        checklistData['CERAMIC_PLATE'], checklistData['MONITOR'], checklistData['KEYBOARD'], checklistData['SIDE_STORAGE'],
        checklistData['MULTI_PORT_32'], checklistData['MINI8'], checklistData['TM_EPC_MFC'], checklistData['CTC'],
        checklistData['EFEM_CONTROLLER'], checklistData['SW_PATCH'], checklistData.name
      ];
  
      await connection.query(query, values);
    } catch (err) {
      throw new Error(`Error updating checklist: ${err.message}`);
    } finally {
      connection.release();
    }
  };
  

exports.getChecklistByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM SUPRA_XP_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.getAllChecklists = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM SUPRA_XP_MAINT_SELF`;
    const [rows] = await connection.query(query);
    return rows; // 모든 사용자의 체크리스트 데이터를 반환
  } catch (err) {
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  } finally {
    connection.release();
  }
};
