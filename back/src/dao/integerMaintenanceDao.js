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
    const query = `SELECT * FROM INTEGER_MAINT_SELF WHERE name = ?`;
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
        INSERT INTO INTEGER_MAINT_SELF (
  name, SWAP_KIT, GAS_LINE_&_GAS_FILTER, TOP_FEED_THROUGH, GAS_FEED_THROUGH, CERAMIC_PARTS, MATCHER, PM_BAFFLE, AM_BAFFLE, FLANGE_ADAPTOR,
  SLOT_VALVE_ASSY(HOUSING), SLOT_VALVE, DOOR_VALVE, PENDULUM_VALVE, PIN_ASSY_MODIFY, MOTOR_&_CONTROLLER,
  PIN_구동부_ASSY, PIN_BELLOWS, SENSOR, STEP_MOTOR_&_CONTROLLER, CASSETTE_&_HOLDER_PAD, BALL_SCREW_ASSY,
  BUSH, MAIN_SHAFT, BELLOWS, EFEM_ROBOT_REP, TM_ROBOT_REP, EFEM_ROBOT_TEACHING, TM_ROBOT_TEACHING, TM_ROBOT_SERVO_PACK,
  UNDER_COVER, VAC._LINE, BARATRON_GAUGE, PIRANI_GAUGE, CONVACTRON_GAUGE, MANUAL_VALVE, PNEUMATIC_VALVE, ISOLATION_VALVE,
  VACUUM_BLOCK, CHECK_VALVE, EPC, PURGE_LINE_REGULATOR, COOLING_CHUCK, HEATER_CHUCK, GENERATOR,
  D-NET_BOARD, SOURCE_BOX_BOARD, INTERFACE_BOARD, SENSOR_BOARD, PIO_SENSOR_BOARD,
  AIO_CALIBRATION[PSK_BOARD], AIO_CALIBRATION[TOS_BOARD], CODED_SENSOR, GAS_BOX_DOOR_SENSOR,
  LASER_SENSOR_AMP, HE_LEAK_CHECK, DIFFUSER, LOT_조사, GAS_SPRING
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      `;

      const values = [
        checklistData.name, // ✅ 반드시 맨 앞에
        checklistData['SWAP_KIT'], checklistData['GAS_LINE_&_GAS_FILTER'], checklistData['TOP_FEED_THROUGH'], checklistData['GAS_FEED_THROUGH'],
        checklistData['CERAMIC_PARTS'], checklistData['MATCHER'], checklistData['PM_BAFFLE'], checklistData['AM_BAFFLE'], checklistData['FLANGE_ADAPTOR'],
        checklistData['SLOT_VALVE_ASSY(HOUSING)'], checklistData['SLOT_VALVE'], checklistData['DOOR_VALVE'], checklistData['PENDULUM_VALVE'],
        checklistData['PIN_ASSY_MODIFY'], checklistData['MOTOR_&_CONTROLLER'], checklistData['PIN_구동부_ASSY'], checklistData['PIN_BELLOWS'],
        checklistData['SENSOR'], checklistData['STEP_MOTOR_&_CONTROLLER'], checklistData['CASSETTE_&_HOLDER_PAD'], checklistData['BALL_SCREW_ASSY'],
        checklistData['BUSH'], checklistData['MAIN_SHAFT'], checklistData['BELLOWS'], checklistData['EFEM_ROBOT_REP'], checklistData['TM_ROBOT_REP'],
        checklistData['EFEM_ROBOT_TEACHING'], checklistData['TM_ROBOT_TEACHING'], checklistData['TM_ROBOT_SERVO_PACK'],
        checklistData['UNDER_COVER'], checklistData['VAC._LINE'], checklistData['BARATRON_GAUGE'], checklistData['PIRANI_GAUGE'],
        checklistData['CONVACTRON_GAUGE'], checklistData['MANUAL_VALVE'], checklistData['PNEUMATIC_VALVE'], checklistData['ISOLATION_VALVE'],
        checklistData['VACUUM_BLOCK'], checklistData['CHECK_VALVE'], checklistData['EPC'], checklistData['PURGE_LINE_REGULATOR'],
        checklistData['COOLING_CHUCK'], checklistData['HEATER_CHUCK'], checklistData['GENERATOR'],
        checklistData['D-NET_BOARD'], checklistData['SOURCE_BOX_BOARD'], checklistData['INTERFACE_BOARD'], checklistData['SENSOR_BOARD'], checklistData['PIO_SENSOR_BOARD'],
        checklistData['AIO_CALIBRATION[PSK_BOARD]'], checklistData['AIO_CALIBRATION[TOS_BOARD]'], checklistData['CODED_SENSOR'],
        checklistData['GAS_BOX_DOOR_SENSOR'], checklistData['LASER_SENSOR_AMP'], checklistData['HE_LEAK_CHECK'],
        checklistData['DIFFUSER'], checklistData['LOT_조사'], checklistData['GAS_SPRING']
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
        UPDATE INTEGER_MAINT_SELF SET
          SWAP_KIT = ?, \`GAS_LINE_&_GAS_FILTER\` = ?, TOP_FEED_THROUGH = ?, GAS_FEED_THROUGH = ?, CERAMIC_PARTS = ?, MATCHER = ?, PM_BAFFLE = ?, AM_BAFFLE = ?, FLANGE_ADAPTOR = ?,
          \`SLOT_VALVE_ASSY(HOUSING)\` = ?, SLOT_VALVE = ?, DOOR_VALVE = ?, PENDULUM_VALVE = ?, PIN_ASSY_MODIFY = ?, \`MOTOR_&_CONTROLLER\` = ?,
          PIN_구동부_ASSY = ?, PIN_BELLOWS = ?, SENSOR = ?, \`STEP_MOTOR_&_CONTROLLER\` = ?, \`CASSETTE_&_HOLDER_PAD\` = ?, BALL_SCREW_ASSY = ?,
          BUSH = ?, MAIN_SHAFT = ?, BELLOWS = ?, EFEM_ROBOT_REP = ?, TM_ROBOT_REP = ?, EFEM_ROBOT_TEACHING = ?, TM_ROBOT_TEACHING = ?, TM_ROBOT_SERVO_PACK = ?,
          UNDER_COVER = ?, \`VAC._LINE\` = ?, BARATRON_GAUGE = ?, PIRANI_GAUGE = ?, CONVACTRON_GAUGE = ?, MANUAL_VALVE = ?, PNEUMATIC_VALVE = ?,
          ISOLATION_VALVE = ?, VACUUM_BLOCK = ?, CHECK_VALVE = ?, EPC = ?, PURGE_LINE_REGULATOR = ?, COOLING_CHUCK = ?, HEATER_CHUCK = ?, GENERATOR = ?,
          \`D-NET_BOARD\` = ?, SOURCE_BOX_BOARD = ?, INTERFACE_BOARD = ?, SENSOR_BOARD = ?, PIO_SENSOR_BOARD = ?,
          \`AIO_CALIBRATION[PSK_BOARD]\` = ?, \`AIO_CALIBRATION[TOS_BOARD]\` = ?, CODED_SENSOR = ?, GAS_BOX_DOOR_SENSOR = ?, LASER_SENSOR_AMP = ?,
          HE_LEAK_CHECK = ?, DIFFUSER = ?, LOT_조사 = ?, GAS_SPRING = ?
        WHERE name = ?
      `;
  
      const values = [
        checklistData['SWAP_KIT'], checklistData['GAS_LINE_&_GAS_FILTER'], checklistData['TOP_FEED_THROUGH'], checklistData['GAS_FEED_THROUGH'],
        checklistData['CERAMIC_PARTS'], checklistData['MATCHER'], checklistData['PM_BAFFLE'], checklistData['AM_BAFFLE'], checklistData['FLANGE_ADAPTOR'],
        checklistData['SLOT_VALVE_ASSY(HOUSING)'], checklistData['SLOT_VALVE'], checklistData['DOOR_VALVE'], checklistData['PENDULUM_VALVE'],
        checklistData['PIN_ASSY_MODIFY'], checklistData['MOTOR_&_CONTROLLER'], checklistData['PIN_구동부_ASSY'], checklistData['PIN_BELLOWS'],
        checklistData['SENSOR'], checklistData['STEP_MOTOR_&_CONTROLLER'], checklistData['CASSETTE_&_HOLDER_PAD'],
        checklistData['BALL_SCREW_ASSY'], checklistData['BUSH'], checklistData['MAIN_SHAFT'], checklistData['BELLOWS'],
        checklistData['EFEM_ROBOT_REP'], checklistData['TM_ROBOT_REP'], checklistData['EFEM_ROBOT_TEACHING'], checklistData['TM_ROBOT_TEACHING'],
        checklistData['TM_ROBOT_SERVO_PACK'],
        checklistData['UNDER_COVER'], checklistData['VAC._LINE'], checklistData['BARATRON_GAUGE'], checklistData['PIRANI_GAUGE'],
        checklistData['CONVACTRON_GAUGE'], checklistData['MANUAL_VALVE'], checklistData['PNEUMATIC_VALVE'], checklistData['ISOLATION_VALVE'],
        checklistData['VACUUM_BLOCK'], checklistData['CHECK_VALVE'], checklistData['EPC'], checklistData['PURGE_LINE_REGULATOR'],
        checklistData['COOLING_CHUCK'], checklistData['HEATER_CHUCK'], checklistData['GENERATOR'],
        checklistData['D-NET_BOARD'], checklistData['SOURCE_BOX_BOARD'], checklistData['INTERFACE_BOARD'], checklistData['SENSOR_BOARD'], checklistData['PIO_SENSOR_BOARD'],
        checklistData['AIO_CALIBRATION[PSK_BOARD]'], checklistData['AIO_CALIBRATION[TOS_BOARD]'], checklistData['CODED_SENSOR'],
        checklistData['GAS_BOX_DOOR_SENSOR'], checklistData['LASER_SENSOR_AMP'], checklistData['HE_LEAK_CHECK'],
        checklistData['DIFFUSER'], checklistData['LOT_조사'], checklistData['GAS_SPRING'], checklistData.name
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
    const query = `SELECT * FROM INTEGER_MAINT_SELF WHERE name = ?`;
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
    const query = `SELECT * FROM INTEGER_MAINT_SELF`;
    const [rows] = await connection.query(query);
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  } finally {
    connection.release();
  }
};