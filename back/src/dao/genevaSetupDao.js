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
    const query = `SELECT * FROM GENEVA_SETUP WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error finding entry by name: ${err.message}`);
  }
};

exports.saveChecklist = async (checklistData) => {
    console.log('checklistData:', checklistData);  // checklistData가 제대로 전달되는지 확인
    console.log('checklistData for Save:', checklistData); // 여기에 콘솔 로그 추가
  const connection = await pool.getConnection(async conn => conn);
  try {
    // 1. 먼저 이름으로 기존 데이터가 있는지 확인
    const queryFind = `SELECT * FROM GENEVA_SETUP WHERE name = ?`;
    const [rows] = await connection.query(queryFind, [checklistData.name]);

    if (rows.length > 0) {
      // 2. 만약 데이터가 있으면 업데이트
      await this.updateChecklist(checklistData);
    } else {
      // 3. 데이터가 없으면 새로 삽입
      await this.insertChecklist(checklistData);
    }

  } catch (err) {
    console.error('Error saving checklist:', err);
    throw new Error(`Error saving checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};


exports.insertChecklist = async (checklistData) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
        INSERT INTO GENEVA_SETUP (
          name, INST_IMPORT_ORDER, INST_PACKING_LIST, INST_OHT_LINE_CHECK, INST_SPACING_CHECK, INST_DRAW_SETUP,
          INST_DRAW_MARKING, INST_UTILITY_SPEC, FAB_MODULE_UNPACK, FAB_MODULE_CLEAN, FAB_MODULE_MOVE, DOCK_TOOL_SIZE,
          DOCK_LASER_JIG, DOCK_JACK_USE, DOCK_HEIGHT_CHECK, DOCK_MODULE_CONNECT, DOCK_REALIGN, DOCK_LEVEL_POS,
          DOCK_LEVEL_SPEC, DOCK_HOOK_UP, CABLE_SORTING, CABLE_GRATING, CABLE_LADDER_RULES, CABLE_CONNECTION,
          CABLE_TRAY_ARRANGE, CABLE_REAR_MONITOR, CABLE_EFEM_PM_SIGNAL, CABLE_BUBBLER_PM_CONNECT, CABLE_FORMIC_PM_CONNECT,
          POWER_GPS_UPS_SPS, POWER_TURN_SEQ, POWER_ALARM_TROUBLE, POWER_CB_UNDERSTAND, POWER_SAFETY_MODULE, POWER_EMO_CHECK,
          POWER_SYCON_NUMBER, POWER_SYCON_SETUP, POWER_SYCON_TROUBLE, UTIL_TURN_SEQ, UTIL_VACUUM_TURN, UTIL_CDA_TURN,
          UTIL_PCW_TURN, UTIL_EXHAUST_TURN, GAS_TURN_SEQ, GAS_N2_CHECK, GAS_FORMIC_CHECK, TEACH_ROBOT_CONTROL,
          TEACH_ROBOT_LEVELING, TEACH_ARM_LEVELING, TEACH_LOAD_PORT, TEACH_ALIGNER, TEACH_LOADLOCK, TEACH_DATA_SAVE,
          TEACH_MICRO_ADJUST, TEACH_MARGIN_CHECK, TEACH_SEMI_TRANSFER, PART_EXHAUST_PORT, PART_END_EFFECTOR,
          PART_END_EFFECTOR_LEVEL, PART_APC_SETUP, PART_PROCESS_KIT, PART_PIO_SENSOR, PART_CCTV_SETUP, LEAK_PM,
          LEAK_GAS_LINE, LEAK_LL, LEAK_BUBBLER, LEAK_SOLENOID, LEAK_FORMIC_ON, LEAK_FORMIC_GAS, TTTM_CHUCK_LEVEL,
          TTTM_CHUCK_SPEED, TTTM_TEMP_CALIBRATION, TTTM_TEMP_PROFILE, TTTM_SEASONING_TEST, TTTM_APC_AUTO_LEARN,
          TTTM_REGULATOR, TTTM_MFC_ZERO_CAL, TTTM_HW_SETUP, TTTM_MFC_HUNTING, TTTM_GAS_LEAK_CHECK, TTTM_DNET_CAL,
          TTTM_SHEET_WRITE, CUST_OHT_CERT, CUST_IMARK_LOC, CUST_LABELING, CUST_MID_CERT, CUST_ENV_QUAL,
          CUST_OHT_LAYOUT, PROC_AGING_TEST, PROC_AR_TEST, PROC_SCRATCH_TEST, PROC_PARTICLE_CHECK, PROC_EES_TOOL
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            checklistData.name, checklistData.INST_IMPORT_ORDER, checklistData.INST_PACKING_LIST, checklistData.INST_OHT_LINE_CHECK, 
            checklistData.INST_SPACING_CHECK, checklistData.INST_DRAW_SETUP, checklistData.INST_DRAW_MARKING, 
            checklistData.INST_UTILITY_SPEC, checklistData.FAB_MODULE_UNPACK, checklistData.FAB_MODULE_CLEAN, 
            checklistData.FAB_MODULE_MOVE, checklistData.DOCK_TOOL_SIZE, checklistData.DOCK_LASER_JIG, 
            checklistData.DOCK_JACK_USE, checklistData.DOCK_HEIGHT_CHECK, checklistData.DOCK_MODULE_CONNECT, 
            checklistData.DOCK_REALIGN, checklistData.DOCK_LEVEL_POS, checklistData.DOCK_LEVEL_SPEC, 
            checklistData.DOCK_HOOK_UP, checklistData.CABLE_SORTING, checklistData.CABLE_GRATING, 
            checklistData.CABLE_LADDER_RULES, checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGE, 
            checklistData.CABLE_REAR_MONITOR, checklistData.CABLE_EFEM_PM_SIGNAL, checklistData.CABLE_BUBBLER_PM_CONNECT, 
            checklistData.CABLE_FORMIC_PM_CONNECT, checklistData.POWER_GPS_UPS_SPS, checklistData.POWER_TURN_SEQ, 
            checklistData.POWER_ALARM_TROUBLE, checklistData.POWER_CB_UNDERSTAND, checklistData.POWER_SAFETY_MODULE, 
            checklistData.POWER_EMO_CHECK, checklistData.POWER_SYCON_NUMBER, checklistData.POWER_SYCON_SETUP, 
            checklistData.POWER_SYCON_TROUBLE, checklistData.UTIL_TURN_SEQ, checklistData.UTIL_VACUUM_TURN, 
            checklistData.UTIL_CDA_TURN, checklistData.UTIL_PCW_TURN, checklistData.UTIL_EXHAUST_TURN, 
            checklistData.GAS_TURN_SEQ, checklistData.GAS_N2_CHECK, checklistData.GAS_FORMIC_CHECK, 
            checklistData.TEACH_ROBOT_CONTROL, checklistData.TEACH_ROBOT_LEVELING, checklistData.TEACH_ARM_LEVELING, 
            checklistData.TEACH_LOAD_PORT, checklistData.TEACH_ALIGNER, checklistData.TEACH_LOADLOCK, 
            checklistData.TEACH_DATA_SAVE, checklistData.TEACH_MICRO_ADJUST, checklistData.TEACH_MARGIN_CHECK, 
            checklistData.TEACH_SEMI_TRANSFER, checklistData.PART_EXHAUST_PORT, checklistData.PART_END_EFFECTOR, 
            checklistData.PART_END_EFFECTOR_LEVEL, checklistData.PART_APC_SETUP, checklistData.PART_PROCESS_KIT, 
            checklistData.PART_PIO_SENSOR, checklistData.PART_CCTV_SETUP, checklistData.LEAK_PM, checklistData.LEAK_GAS_LINE, 
            checklistData.LEAK_LL, checklistData.LEAK_BUBBLER, checklistData.LEAK_SOLENOID, checklistData.LEAK_FORMIC_ON, 
            checklistData.LEAK_FORMIC_GAS, checklistData.TTTM_CHUCK_LEVEL, checklistData.TTTM_CHUCK_SPEED, 
            checklistData.TTTM_TEMP_CALIBRATION, checklistData.TTTM_TEMP_PROFILE, checklistData.TTTM_SEASONING_TEST, 
            checklistData.TTTM_APC_AUTO_LEARN, checklistData.TTTM_REGULATOR, checklistData.TTTM_MFC_ZERO_CAL, 
            checklistData.TTTM_HW_SETUP, checklistData.TTTM_MFC_HUNTING, checklistData.TTTM_GAS_LEAK_CHECK, 
            checklistData.TTTM_DNET_CAL, checklistData.TTTM_SHEET_WRITE, checklistData.CUST_OHT_CERT, 
            checklistData.CUST_IMARK_LOC, checklistData.CUST_LABELING, checklistData.CUST_MID_CERT, 
            checklistData.CUST_ENV_QUAL, checklistData.CUST_OHT_LAYOUT, checklistData.PROC_AGING_TEST, 
            checklistData.PROC_AR_TEST, checklistData.PROC_SCRATCH_TEST, checklistData.PROC_PARTICLE_CHECK, 
            checklistData.PROC_EES_TOOL
        ];

        console.log('SQL Query for Insert:', query);
        console.log('SQL Values for Insert:', values);

        await connection.query(query, values);
    } finally {
        connection.release();
    }
};
  



exports.updateChecklist = async (checklistData) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
        UPDATE GENEVA_SETUP SET
          INST_IMPORT_ORDER = ?, INST_PACKING_LIST = ?, INST_OHT_LINE_CHECK = ?, INST_SPACING_CHECK = ?, INST_DRAW_SETUP = ?,
          INST_DRAW_MARKING = ?, INST_UTILITY_SPEC = ?, FAB_MODULE_UNPACK = ?, FAB_MODULE_CLEAN = ?, FAB_MODULE_MOVE = ?,
          DOCK_TOOL_SIZE = ?, DOCK_LASER_JIG = ?, DOCK_JACK_USE = ?, DOCK_HEIGHT_CHECK = ?, DOCK_MODULE_CONNECT = ?,
          DOCK_REALIGN = ?, DOCK_LEVEL_POS = ?, DOCK_LEVEL_SPEC = ?, DOCK_HOOK_UP = ?, CABLE_SORTING = ?, CABLE_GRATING = ?,
          CABLE_LADDER_RULES = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ARRANGE = ?, CABLE_REAR_MONITOR = ?, CABLE_EFEM_PM_SIGNAL = ?,
          CABLE_BUBBLER_PM_CONNECT = ?, CABLE_FORMIC_PM_CONNECT = ?, POWER_GPS_UPS_SPS = ?, POWER_TURN_SEQ = ?, POWER_ALARM_TROUBLE = ?,
          POWER_CB_UNDERSTAND = ?, POWER_SAFETY_MODULE = ?, POWER_EMO_CHECK = ?, POWER_SYCON_NUMBER = ?, POWER_SYCON_SETUP = ?,
          POWER_SYCON_TROUBLE = ?, UTIL_TURN_SEQ = ?, UTIL_VACUUM_TURN = ?, UTIL_CDA_TURN = ?, UTIL_PCW_TURN = ?, UTIL_EXHAUST_TURN = ?,
          GAS_TURN_SEQ = ?, GAS_N2_CHECK = ?, GAS_FORMIC_CHECK = ?, TEACH_ROBOT_CONTROL = ?, TEACH_ROBOT_LEVELING = ?,
          TEACH_ARM_LEVELING = ?, TEACH_LOAD_PORT = ?, TEACH_ALIGNER = ?, TEACH_LOADLOCK = ?, TEACH_DATA_SAVE = ?,
          TEACH_MICRO_ADJUST = ?, TEACH_MARGIN_CHECK = ?, TEACH_SEMI_TRANSFER = ?, PART_EXHAUST_PORT = ?, PART_END_EFFECTOR = ?,
          PART_END_EFFECTOR_LEVEL = ?, PART_APC_SETUP = ?, PART_PROCESS_KIT = ?, PART_PIO_SENSOR = ?, PART_CCTV_SETUP = ?,
          LEAK_PM = ?, LEAK_GAS_LINE = ?, LEAK_LL = ?, LEAK_BUBBLER = ?, LEAK_SOLENOID = ?, LEAK_FORMIC_ON = ?, LEAK_FORMIC_GAS = ?,
          TTTM_CHUCK_LEVEL = ?, TTTM_CHUCK_SPEED = ?, TTTM_TEMP_CALIBRATION = ?, TTTM_TEMP_PROFILE = ?, TTTM_SEASONING_TEST = ?,
          TTTM_APC_AUTO_LEARN = ?, TTTM_REGULATOR = ?, TTTM_MFC_ZERO_CAL = ?, TTTM_HW_SETUP = ?, TTTM_MFC_HUNTING = ?,
          TTTM_GAS_LEAK_CHECK = ?, TTTM_DNET_CAL = ?, TTTM_SHEET_WRITE = ?, CUST_OHT_CERT = ?, CUST_IMARK_LOC = ?, CUST_LABELING = ?,
          CUST_MID_CERT = ?, CUST_ENV_QUAL = ?, CUST_OHT_LAYOUT = ?, PROC_AGING_TEST = ?, PROC_AR_TEST = ?, PROC_SCRATCH_TEST = ?,
          PROC_PARTICLE_CHECK = ?, PROC_EES_TOOL = ?
        WHERE name = ?
        `;

        const values = [
            checklistData.INST_IMPORT_ORDER, checklistData.INST_PACKING_LIST, checklistData.INST_OHT_LINE_CHECK, checklistData.INST_SPACING_CHECK,
            checklistData.INST_DRAW_SETUP, checklistData.INST_DRAW_MARKING, checklistData.INST_UTILITY_SPEC, checklistData.FAB_MODULE_UNPACK,
            checklistData.FAB_MODULE_CLEAN, checklistData.FAB_MODULE_MOVE, checklistData.DOCK_TOOL_SIZE, checklistData.DOCK_LASER_JIG,
            checklistData.DOCK_JACK_USE, checklistData.DOCK_HEIGHT_CHECK, checklistData.DOCK_MODULE_CONNECT, checklistData.DOCK_REALIGN,
            checklistData.DOCK_LEVEL_POS, checklistData.DOCK_LEVEL_SPEC, checklistData.DOCK_HOOK_UP, checklistData.CABLE_SORTING,
            checklistData.CABLE_GRATING, checklistData.CABLE_LADDER_RULES, checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGE,
            checklistData.CABLE_REAR_MONITOR, checklistData.CABLE_EFEM_PM_SIGNAL, checklistData.CABLE_BUBBLER_PM_CONNECT,
            checklistData.CABLE_FORMIC_PM_CONNECT, checklistData.POWER_GPS_UPS_SPS, checklistData.POWER_TURN_SEQ, checklistData.POWER_ALARM_TROUBLE,
            checklistData.POWER_CB_UNDERSTAND, checklistData.POWER_SAFETY_MODULE, checklistData.POWER_EMO_CHECK, checklistData.POWER_SYCON_NUMBER,
            checklistData.POWER_SYCON_SETUP, checklistData.POWER_SYCON_TROUBLE, checklistData.UTIL_TURN_SEQ, checklistData.UTIL_VACUUM_TURN,
            checklistData.UTIL_CDA_TURN, checklistData.UTIL_PCW_TURN, checklistData.UTIL_EXHAUST_TURN, checklistData.GAS_TURN_SEQ,
            checklistData.GAS_N2_CHECK, checklistData.GAS_FORMIC_CHECK, checklistData.TEACH_ROBOT_CONTROL, checklistData.TEACH_ROBOT_LEVELING,
            checklistData.TEACH_ARM_LEVELING, checklistData.TEACH_LOAD_PORT, checklistData.TEACH_ALIGNER, checklistData.TEACH_LOADLOCK,
            checklistData.TEACH_DATA_SAVE, checklistData.TEACH_MICRO_ADJUST, checklistData.TEACH_MARGIN_CHECK, checklistData.TEACH_SEMI_TRANSFER,
            checklistData.PART_EXHAUST_PORT, checklistData.PART_END_EFFECTOR, checklistData.PART_END_EFFECTOR_LEVEL, checklistData.PART_APC_SETUP,
            checklistData.PART_PROCESS_KIT, checklistData.PART_PIO_SENSOR, checklistData.PART_CCTV_SETUP, checklistData.LEAK_PM,
            checklistData.LEAK_GAS_LINE, checklistData.LEAK_LL, checklistData.LEAK_BUBBLER, checklistData.LEAK_SOLENOID, checklistData.LEAK_FORMIC_ON,
            checklistData.LEAK_FORMIC_GAS, checklistData.TTTM_CHUCK_LEVEL, checklistData.TTTM_CHUCK_SPEED, checklistData.TTTM_TEMP_CALIBRATION,
            checklistData.TTTM_TEMP_PROFILE, checklistData.TTTM_SEASONING_TEST, checklistData.TTTM_APC_AUTO_LEARN, checklistData.TTTM_REGULATOR,
            checklistData.TTTM_MFC_ZERO_CAL, checklistData.TTTM_HW_SETUP, checklistData.TTTM_MFC_HUNTING, checklistData.TTTM_GAS_LEAK_CHECK,
            checklistData.TTTM_DNET_CAL, checklistData.TTTM_SHEET_WRITE, checklistData.CUST_OHT_CERT, checklistData.CUST_IMARK_LOC,
            checklistData.CUST_LABELING, checklistData.CUST_MID_CERT, checklistData.CUST_ENV_QUAL, checklistData.CUST_OHT_LAYOUT,
            checklistData.PROC_AGING_TEST, checklistData.PROC_AR_TEST, checklistData.PROC_SCRATCH_TEST, checklistData.PROC_PARTICLE_CHECK,
            checklistData.PROC_EES_TOOL, checklistData.name
        ];

        console.log('checklistData for Update:', checklistData);
        console.log('SQL Query for Update:', query);

        await connection.query(query, values);
    } catch (err) {
        console.error('Error updating checklist:', err);
        throw new Error(`Error updating checklist: ${err.message}`);
    } finally {
        connection.release();
    }
};

  
  
  
  

exports.getChecklistByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM GENEVA_SETUP WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving checklist: ${err.message}`);
  }
};

exports.getAllChecklists = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      const query = `SELECT * FROM GENEVA_SETUP_COUNT`; // 나중에 수정해야 되는 부분 !!!!!!!!!
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllGenevaSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // GENEVA_SETUP 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM GENEVA_SETUP`;
      const [rows] = await connection.query(query);  // GENEVA_SETUP 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from GENEVA_SETUP: ${err.message}`);
  }
};
