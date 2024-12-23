const { pool } = require('../../config/database');

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

exports.findByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM SUPRA_N_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error finding entry by name: ${err.message}`);
  }
};

exports.insertChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO SUPRA_N_MAINT_SELF (
        name, LP_ESCORT, ROBOT_ESCORT, EFEM_ROBOT_TEACHING, EFEM_ROBOT_REP, EFEM_ROBOT_CONTROLLER_REP,
        TM_ROBOT_TEACHING, TM_ROBOT_REP, TM_ROBOT_CONTROLLER_REP, PASSIVE_PAD_REP, PIN_CYLINDER, PUSHER_CYLINDER,
        IB_FLOW, DRT, FFU_CONTROLLER, FAN, MOTOR_DRIVER, FCIP, R1, R3, R5, R3_TO_R5, MICROWAVE, APPLICATOR,
        GENERATOR, CHUCK, PROCESS_KIT, HELIUM_DETECTOR, HOOK_LIFT_PIN, BELLOWS, PIN_SENSOR, LM_GUIDE,
        PIN_MOTOR_CONTROLLER, SINGLE_EPD, \`DUAL_EPD\`, GAS_BOX_BOARD, TEMP_CONTROLLER_BOARD, POWER_DISTRIBUTION_BOARD,
        DC_POWER_SUPPLY, BM_SENSOR, PIO_SENSOR, SAFETY_MODULE, \`D_NET\`, MFC, VALVE, SOLENOID, FAST_VAC_VALVE,
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
      checklistData['LM_GUIDE'], checklistData['PIN_MOTOR_CONTROLLER'], checklistData['SINGLE_EPD'], checklistData['DUAL_EPD'],
      checklistData['GAS_BOX_BOARD'], checklistData['TEMP_CONTROLLER_BOARD'], checklistData['POWER_DISTRIBUTION_BOARD'],
      checklistData['DC_POWER_SUPPLY'], checklistData['BM_SENSOR'], checklistData['PIO_SENSOR'], checklistData['SAFETY_MODULE'],
      checklistData['D_NET'], checklistData['MFC'], checklistData['VALVE'], checklistData['SOLENOID'], checklistData['FAST_VAC_VALVE'],
      checklistData['SLOW_VAC_VALVE'], checklistData['SLIT_DOOR'], checklistData['APC_VALVE'], checklistData['SHUTOFF_VALVE'],
      checklistData['BARATRON_ASSY'], checklistData['PIRANI_ASSY'], checklistData['VIEW_PORT_QUARTZ'], checklistData['FLOW_SWITCH'],
      checklistData['CERAMIC_PLATE'], checklistData['MONITOR'], checklistData['KEYBOARD'], checklistData['MOUSE'],
      checklistData['CTC'], checklistData['PMC'], checklistData['EDA'], checklistData['EFEM_CONTROLLER'], checklistData['SW_PATCH']
    ];

    await connection.query(query, values);
  } catch (err) {
    console.error('Error inserting checklist:', err);
    throw new Error(`Error inserting checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.updateChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE SUPRA_N_MAINT_SELF SET
        LP_ESCORT = ?, ROBOT_ESCORT = ?, EFEM_ROBOT_TEACHING = ?, EFEM_ROBOT_REP = ?, EFEM_ROBOT_CONTROLLER_REP = ?,
        TM_ROBOT_TEACHING = ?, TM_ROBOT_REP = ?, TM_ROBOT_CONTROLLER_REP = ?, PASSIVE_PAD_REP = ?, PIN_CYLINDER = ?,
        PUSHER_CYLINDER = ?, IB_FLOW = ?, DRT = ?, FFU_CONTROLLER = ?, FAN = ?, MOTOR_DRIVER = ?, FCIP = ?, R1 = ?, R3 = ?, R5 = ?,
        R3_TO_R5 = ?, MICROWAVE = ?, APPLICATOR = ?, GENERATOR = ?, CHUCK = ?, PROCESS_KIT = ?, HELIUM_DETECTOR = ?,
        HOOK_LIFT_PIN = ?, BELLOWS = ?, PIN_SENSOR = ?, LM_GUIDE = ?, PIN_MOTOR_CONTROLLER = ?, SINGLE_EPD = ?, \`DUAL_EPD\` = ?,
        GAS_BOX_BOARD = ?, TEMP_CONTROLLER_BOARD = ?, POWER_DISTRIBUTION_BOARD = ?, DC_POWER_SUPPLY = ?, BM_SENSOR = ?,
        PIO_SENSOR = ?, SAFETY_MODULE = ?, \`D_NET\` = ?, MFC = ?, VALVE = ?, SOLENOID = ?, FAST_VAC_VALVE = ?,
        SLOW_VAC_VALVE = ?, SLIT_DOOR = ?, APC_VALVE = ?, SHUTOFF_VALVE = ?, BARATRON_ASSY = ?, PIRANI_ASSY = ?, VIEW_PORT_QUARTZ = ?,
        FLOW_SWITCH = ?, CERAMIC_PLATE = ?, MONITOR = ?, KEYBOARD = ?, MOUSE = ?, CTC = ?, PMC = ?, EDA = ?, EFEM_CONTROLLER = ?, SW_PATCH = ?
      WHERE name = ?
    `;

    const values = [
      checklistData['LP_ESCORT'], checklistData['ROBOT_ESCORT'], checklistData['EFEM_ROBOT_TEACHING'],
      checklistData['EFEM_ROBOT_REP'], checklistData['EFEM_ROBOT_CONTROLLER_REP'], checklistData['TM_ROBOT_TEACHING'],
      checklistData['TM_ROBOT_REP'], checklistData['TM_ROBOT_CONTROLLER_REP'], checklistData['PASSIVE_PAD_REP'],
      checklistData['PIN_CYLINDER'], checklistData['PUSHER_CYLINDER'], checklistData['IB_FLOW'], checklistData['DRT'],
      checklistData['FFU_CONTROLLER'], checklistData['FAN'], checklistData['MOTOR_DRIVER'], checklistData['FCIP'],
      checklistData['R1'], checklistData['R3'], checklistData['R5'], checklistData['R3_TO_R5'], checklistData['MICROWAVE'],
      checklistData['APPLICATOR'], checklistData['GENERATOR'], checklistData['CHUCK'], checklistData['PROCESS_KIT'],
      checklistData['HELIUM_DETECTOR'], checklistData['HOOK_LIFT_PIN'], checklistData['BELLOWS'], checklistData['PIN_SENSOR'],
      checklistData['LM_GUIDE'], checklistData['PIN_MOTOR_CONTROLLER'], checklistData['SINGLE_EPD'], checklistData['DUAL_EPD'],
      checklistData['GAS_BOX_BOARD'], checklistData['TEMP_CONTROLLER_BOARD'], checklistData['POWER_DISTRIBUTION_BOARD'],
      checklistData['DC_POWER_SUPPLY'], checklistData['BM_SENSOR'], checklistData['PIO_SENSOR'], checklistData['SAFETY_MODULE'],
      checklistData['D_NET'], checklistData['MFC'], checklistData['VALVE'], checklistData['SOLENOID'], checklistData['FAST_VAC_VALVE'],
      checklistData['SLOW_VAC_VALVE'], checklistData['SLIT_DOOR'], checklistData['APC_VALVE'], checklistData['SHUTOFF_VALVE'],
      checklistData['BARATRON_ASSY'], checklistData['PIRANI_ASSY'], checklistData['VIEW_PORT_QUARTZ'], checklistData['FLOW_SWITCH'],
      checklistData['CERAMIC_PLATE'], checklistData['MONITOR'], checklistData['KEYBOARD'], checklistData['MOUSE'],
      checklistData['CTC'], checklistData['PMC'], checklistData['EDA'], checklistData['EFEM_CONTROLLER'], checklistData['SW_PATCH'],
      checklistData.name
    ];

    await connection.query(query, values);
  } catch (err) {
    console.error('Error updating checklist:', err);
    throw new Error(`Error updating checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.getChecklistByName = async (name) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `SELECT * FROM SUPRA_N_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0]; // 이름에 해당하는 첫 번째 데이터 반환
  } catch (err) {
    console.error("Error retrieving checklist by name:", err);
    throw new Error(err.message);
  } finally {
    connection.release();
  }
};


exports.getLatestChecklistByName = async (name) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      SELECT *
      FROM SUPRA_N_MAINT_SELF
      WHERE name = ?
      ORDER BY approval_date DESC
      LIMIT 1
    `;
    const [rows] = await connection.query(query, [name]);
    return rows[0]; // 가장 최신 데이터를 반환
  } catch (err) {
    console.error("Error retrieving latest checklist:", err);
    throw new Error(err.message);
  } finally {
    connection.release();
  }
};


exports.getAllChecklists = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    // 모든 사용자 체크리스트 데이터를 가져오는 쿼리
    const query = `SELECT * FROM SUPRA_N_MAINT_SELF`;
    const [rows] = await connection.query(query);
    connection.release();
    return rows; // 모든 사용자의 체크리스트 데이터를 반환
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  }
};

exports.insertApprovalRequest = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO SUPRA_N_MAINT_APPROVAL (
        name, checklist_data, approval_status, LP_ESCORT, ROBOT_ESCORT, SR8241_TEACHING, SR8240_TEACHING, M124_TEACHING, EFEM FIXTURE, EFEM_ROBOT_REP, 
        EFEM_ROBOT_CONTROLLER_REP, SR8250_TEACHING, SR8232_TEACHING, TM_FIXTURE, TM_ROBOT_REP, TM_ROBOT_CONTROLLER_REP, PASSIVE_PAD_REP,
        PIN_CYLINDER, PUSHER_CYLINDER, IB_FLOW, DRT, FFU_CONTROLLER, FAN, MOTOR_DRIVER, R1, R3, R5, R3_TO_R5, PRISM,
        MICROWAVE, APPLICATOR, GENERATOR, CHUCK, PROCESS_KIT, HELIUM_DETECTOR, HOOK_LIFT_PIN, BELLOWS, PIN_SENSOR, 
        LM_GUIDE, PIN_MOTOR_CONTROLLER, SINGLE_EPD, DUAL_EPD, GAS_BOX_BOARD, TEMP_CONTROLLER_BOARD, 
        POWER_DISTRIBUTION_BOARD, DC_POWER_SUPPLY, BM_SENSOR, PIO_SENSOR, SAFETY_MODULE, IO_BOX, FPS_BOARD, D_NET, MFC, VALVE, 
        SOLENOID, FAST_VAC_VALVE, SLOW_VAC_VALVE, SLIT_DOOR, APC_VALVE, SHUTOFF_VALVE, BARATRON_ASSY, 
        PIRANI_ASSY, VIEW_PORT_QUARTZ, FLOW_SWITCH, CERAMIC_PLATE, MONITOR, KEYBOARD, MOUSE, HEATING_JACKET, WATER_LEAK_DETECTOR, MANOMETER, CTC, PMC, EDA, 
        EFEM_CONTROLLER, TEMP_LIMIT_CONTROLLER, TEMP_CONTROLLER, SW_PATCH
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      checklistData.name, JSON.stringify(checklistData), checklistData.LP_ESCORT, checklistData.ROBOT_ESCORT,
      checklistData.SR8241_TEACHING, checklistData.SR8240_TEACHING, checklistData.M124_TEACHING, checklistData.EFEM_FIXTURE, 
      checklistData.EFEM_ROBOT_REP, checklistData.EFEM_ROBOT_CONTROLLER_REP,
      checklistData.SR8250_TEACHING, checklistData.SR8232_TEACHING, checklistData.TM_FIXTURE, 
      checklistData.TM_ROBOT_REP, checklistData.TM_ROBOT_CONTROLLER_REP,
      checklistData.PASSIVE_PAD_REP, checklistData.PIN_CYLINDER, checklistData.PUSHER_CYLINDER, checklistData.IB_FLOW,
      checklistData.DRT, checklistData.FFU_CONTROLLER, checklistData.FAN, checklistData.MOTOR_DRIVER, checklistData.FCIP,
      checklistData.R1, checklistData.R3, checklistData.R5, checklistData.R3_TO_R5, checklistData.MICROWAVE,
      checklistData.APPLICATOR, checklistData.GENERATOR, checklistData.CHUCK, checklistData.PROCESS_KIT,
      checklistData.HELIUM_DETECTOR, checklistData.HOOK_LIFT_PIN, checklistData.BELLOWS, checklistData.PIN_SENSOR,
      checklistData.LM_GUIDE, checklistData.PIN_MOTOR_CONTROLLER, checklistData.SINGLE_EPD, checklistData.DUAL_EPD,
      checklistData.GAS_BOX_BOARD, checklistData.TEMP_CONTROLLER_BOARD, checklistData.POWER_DISTRIBUTION_BOARD,
      checklistData.DC_POWER_SUPPLY, checklistData.BM_SENSOR, checklistData.PIO_SENSOR, checklistData.SAFETY_MODULE,
      checklistData.IO_BOX, checklistData.FPS_BOARD,
      checklistData.D_NET, checklistData.MFC, checklistData.VALVE, checklistData.SOLENOID, checklistData.FAST_VAC_VALVE,
      checklistData.SLOW_VAC_VALVE, checklistData.SLIT_DOOR, checklistData.APC_VALVE, checklistData.SHUTOFF_VALVE,
      checklistData.BARATRON_ASSY, checklistData.PIRANI_ASSY, checklistData.VIEW_PORT_QUARTZ, checklistData.FLOW_SWITCH,
      checklistData.CERAMIC_PLATE, checklistData.MONITOR, checklistData.KEYBOARD, checklistData.MOUSE,
      checklistData.HEATING_JACKET, checklistData.WATER_LEAK_DETECTOR, checklistData.MANOMETER,
      checklistData.CTC, checklistData.PMC, checklistData.EDA, checklistData.EFEM_CONTROLLER, checklistData.TEMP_LIMIT_CONTROLLER, checklistData.TEMP_CONTROLLER, checklistData.SW_PATCH
    ];
    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error inserting approval request: ${err.message}`);
  } finally {
    connection.release();
  }
};







exports.getApprovalRequestById = async (id) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `SELECT * FROM SUPRA_N_MAINT_APPROVAL WHERE id = ?`;
    const [rows] = await connection.query(query, [id]);

    if (!rows[0]) {
      return null; // 요청이 없을 경우 null 반환
    }

    let checklistData = rows[0].checklist_data;
    if (typeof checklistData === "string") {
      try {
        checklistData = JSON.parse(checklistData); // 문자열인 경우 JSON 파싱
      } catch (err) {
        console.error(`Error parsing JSON for ID ${id}:`, rows[0].checklist_data);
        throw new Error("Invalid checklist data format.");
      }
    }

    return {
      ...rows[0],
      checklist_data: checklistData, // JSON 데이터 반환
    };
  } finally {
    connection.release();
  }
};






exports.updateApprovalStatus = async (id, status) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE SUPRA_N_MAINT_APPROVAL
      SET approval_status = ?, approval_date = NOW()
      WHERE id = ?
    `;
    await connection.query(query, [status, id]);
  } finally {
    connection.release();
  }
};

exports.saveChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      INSERT INTO SUPRA_N_MAINT_APPROVAL (
        \`name\`, \`approver_name\`, \`approval_status\`, \`approval_date\`, \`request_date\`, \`checklist_data\`, \`LP_ESCORT\`, \`ROBOT_ESCORT\`,
        \`SR8241_TEACHING\`, \`SR8240_TEACHING\`, \`M124_TEACHING\`, \`EFEM_FIXTURE\`, \`EFEM_ROBOT_REP\`, \`EFEM_ROBOT_CONTROLLER_REP\`,
        \`SR8250_TEACHING\`, \`SR8232_TEACHING\`, \`TM_FIXTURE\`, \`TM_ROBOT_REP\`, \`TM_ROBOT_CONTROLLER_REP\`, \`PASSIVE_PAD_REP\`,
        \`PIN_CYLINDER\`, \`PUSHER_CYLINDER\`, \`IB_FLOW\`, \`DRT\`, \`FFU_CONTROLLER\`, \`FAN\`, \`MOTOR_DRIVER\`, \`R1\`, \`R3\`,
        \`R5\`, \`R3_TO_R5\`, \`PRISM\`, \`MICROWAVE\`, \`APPLICATOR\`, \`GENERATOR\`, \`CHUCK\`, \`PROCESS_KIT\`, \`HELIUM_DETECTOR\`,
        \`HOOK_LIFT_PIN\`, \`BELLOWS\`, \`PIN_SENSOR\`, \`LM_GUIDE\`, \`PIN_MOTOR_CONTROLLER\`, \`SINGLE_EPD\`, \`DUAL_EPD\`,
        \`GAS_BOX_BOARD\`, \`TEMP_CONTROLLER_BOARD\`, \`POWER_DISTRIBUTION_BOARD\`, \`DC_POWER_SUPPLY\`, \`BM_SENSOR\`, \`PIO_SENSOR\`,
        \`IO_BOX\`, \`FPS_BOARD\`, \`SAFETY_MODULE\`, \`D_NET\`, \`MFC\`, \`VALVE\`, \`SOLENOID\`, \`FAST_VAC_VALVE\`, \`SLOW_VAC_VALVE\`,
        \`SLIT_DOOR\`, \`APC_VALVE\`, \`SHUTOFF_VALVE\`, \`BARATRON_ASSY\`, \`PIRANI_ASSY\`, \`VIEW_PORT_QUARTZ\`, \`FLOW_SWITCH\`,
        \`CERAMIC_PLATE\`, \`MONITOR\`, \`KEYBOARD\`, \`MOUSE\`, \`HEATING_JACKET\`, \`WATER_LEAK_DETECTOR\`, \`MANOMETER\`,
        \`CTC\`, \`PMC\`, \`EDA\`, \`EFEM_CONTROLLER\`, \`TEMP_LIMIT_CONTROLLER\`, \`TEMP_CONTROLLER\`, \`SW_PATCH\`, \`updated_at\`
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
      )
    `;

    const values = [
      checklistData.name,
      checklistData.approver_name || '관리자',
      checklistData.approval_status || 'pending',
      checklistData.approval_date || null,
      new Date().toISOString().slice(0, 19).replace('T', ' '),
      JSON.stringify(checklistData) || null,
      checklistData.LP_ESCORT,
      checklistData.ROBOT_ESCORT,
      checklistData.SR8241_TEACHING,
      checklistData.SR8240_TEACHING,
      checklistData.M124_TEACHING,
      checklistData.EFEM_FIXTURE,
      checklistData.EFEM_ROBOT_REP,
      checklistData.EFEM_ROBOT_CONTROLLER_REP,
      checklistData.SR8250_TEACHING,
      checklistData.SR8232_TEACHING,
      checklistData.TM_FIXTURE,
      checklistData.TM_ROBOT_REP,
      checklistData.TM_ROBOT_CONTROLLER_REP,
      checklistData.PASSIVE_PAD_REP,
      checklistData.PIN_CYLINDER,
      checklistData.PUSHER_CYLINDER,
      checklistData.IB_FLOW,
      checklistData.DRT,
      checklistData.FFU_CONTROLLER,
      checklistData.FAN,
      checklistData.MOTOR_DRIVER,
      checklistData.R1,
      checklistData.R3,
      checklistData.R5,
      checklistData.R3_TO_R5,
      checklistData.PRISM,
      checklistData.MICROWAVE,
      checklistData.APPLICATOR,
      checklistData.GENERATOR,
      checklistData.CHUCK,
      checklistData.PROCESS_KIT,
      checklistData.HELIUM_DETECTOR,
      checklistData.HOOK_LIFT_PIN,
      checklistData.BELLOWS,
      checklistData.PIN_SENSOR,
      checklistData.LM_GUIDE,
      checklistData.PIN_MOTOR_CONTROLLER,
      checklistData.SINGLE_EPD,
      checklistData.DUAL_EPD,
      checklistData.GAS_BOX_BOARD,
      checklistData.TEMP_CONTROLLER_BOARD,
      checklistData.POWER_DISTRIBUTION_BOARD,
      checklistData.DC_POWER_SUPPLY,
      checklistData.BM_SENSOR,
      checklistData.PIO_SENSOR,
      checklistData.IO_BOX,
      checklistData.FPS_BOARD,
      checklistData.SAFETY_MODULE,
      checklistData.D_NET,
      checklistData.MFC,
      checklistData.VALVE,
      checklistData.SOLENOID,
      checklistData.FAST_VAC_VALVE,
      checklistData.SLOW_VAC_VALVE,
      checklistData.SLIT_DOOR,
      checklistData.APC_VALVE,
      checklistData.SHUTOFF_VALVE,
      checklistData.BARATRON_ASSY,
      checklistData.PIRANI_ASSY,
      checklistData.VIEW_PORT_QUARTZ,
      checklistData.FLOW_SWITCH,
      checklistData.CERAMIC_PLATE,
      checklistData.MONITOR,
      checklistData.KEYBOARD,
      checklistData.MOUSE,
      checklistData.HEATING_JACKET,
      checklistData.WATER_LEAK_DETECTOR,
      checklistData.MANOMETER,
      checklistData.CTC,
      checklistData.PMC,
      checklistData.EDA,
      checklistData.EFEM_CONTROLLER,
      checklistData.TEMP_LIMIT_CONTROLLER,
      checklistData.TEMP_CONTROLLER,
      checklistData.SW_PATCH
    ];

    await connection.query(query, values);
  } catch (err) {
    console.error("Error inserting checklist into SUPRA_N_MAINT_APPROVAL:", err);
    throw new Error("Error inserting checklist.");
  } finally {
    connection.release();
  }
};






exports.deleteApprovalRequest = async (id) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `DELETE FROM SUPRA_N_MAINT_APPROVAL WHERE id = ?`;
    await connection.query(query, [id]);
  } finally {
    connection.release();
  }
};

exports.getAllApprovalRequests = async () => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      SELECT id, name, approval_status, request_date
      FROM SUPRA_N_MAINT_APPROVAL
      WHERE approval_status = 'pending'
    `;
    const [rows] = await connection.query(query);
    return rows;
  } catch (err) {
    console.error("Error retrieving approval requests:", err);
    throw new Error(err.message);
  } finally {
    connection.release();
  }
};

exports.isAuthorizedUser = async (nickname) => {
  const connection = await pool.getConnection(async (conn) => conn);
  try {
    const query = `
      SELECT nickname 
      FROM Users 
      WHERE nickname = ? AND role = 'admin' AND status = 'A'
    `;
    const [rows] = await connection.query(query, [nickname]);
    return rows.length > 0; // 해당 사용자가 존재하면 true 반환
  } catch (err) {
    console.error("Error checking user authorization:", err);
    throw new Error("Error checking user authorization");
  } finally {
    connection.release();
  }
};
