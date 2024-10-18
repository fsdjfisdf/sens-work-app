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
    const query = `SELECT * FROM SUPRA_XP_SETUP_SELF WHERE name = ?`;
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
    const queryFind = `SELECT * FROM SUPRA_XP_SETUP_SELF WHERE name = ?`;
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
      INSERT INTO SUPRA_XP_SETUP_SELF (
        name, INST_IMPORT_ORDER, INST_PACKING_LIST, INST_OHT_CHECK, INST_SPACING_CHECK, INST_DRAW_SETUP, INST_DRAW_MARKING, 
        INST_UTILITY_SPEC, FAB_UNPACK_WARN, FAB_CLEAN_WARN, FAB_MOVE_WARN, DOCK_TOOL_SIZE, DOCK_LASER_JIG, DOCK_LIFT_CASTER, 
        DOCK_FRAME_HEIGHT, DOCK_MODULE, DOCK_REALIGN, DOCK_LEVELER_POS, DOCK_LEVEL_SPEC, DOCK_ACCESSORY, DOCK_HOOK_UP, 
        CABLE_TRAY_CHECK, CABLE_SORTING, CABLE_GRATING, CABLE_LADDER_RULES, CABLE_INSTALL, CABLE_CONNECTION, 
        CABLE_TRAY_ARRANGE, CABLE_CUTTING, CABLE_RACK_CONNECT, CABLE_PUMP_TRAY, CABLE_PUMP_ARRANGE, CABLE_MODULE_PUMP, 
        POWER_GPS_UPS_SPS, POWER_TURN_SEQ, POWER_ALARM_TROUBLE, POWER_CB_UNDERSTAND, POWER_SAFETY_MODULE, 
        POWER_EMO_CHECK, POWER_SYCON_UNDERST, POWER_SYCON_TROUBLE, UTIL_TURN_SEQ, UTIL_VACUUM_TURN, UTIL_CDA_TURN, 
        UTIL_PCW_TURN, GAS_TURN_SEQ, GAS_O2_N2_CHECK, GAS_TOXIC_CHECK, GAS_MANOMETER_ADJUST, TEACH_ROBOT_CONTROL, 
        TEACH_ROBOT_LEVEL, TEACH_ARM_LEVEL, TEACH_LOAD_PORT, TEACH_LOADLOCK, TEACH_SIDE_STORAGE, TEACH_DATA_SAVE, 
        TEACH_TM_CONTROL, TEACH_TM_LOADLOCK, TEACH_TM_PM, TEACH_TM_DATA_SAVE, TEACH_WAFER_JIG, TEACH_FINE, TEACH_MARGIN, 
        TEACH_SEMI_TRANSFER, PART_EXHAUST_PORT, PART_EFF_SANKYO, PART_EFF_ADJUST, PART_EFF_LEVEL, PART_TM_EFF, 
        PART_TM_ADJUST_380, PART_TM_ADJUST_16, PART_TM_LEVEL, PART_PROCESS_KIT, PART_PIO_CABLE, PART_RACK_SIGNAL, 
        LEAK_PUMP_TURN, LEAK_PM_CHECK, LEAK_GAS_CHECK, LEAK_TM_LL_CHECK, TTTM_ECID_MATCH, TTTM_PUMP_TIME, 
        TTTM_VENT_TIME, TTTM_EPD_ADJUST, TTTM_TEMP_AUTOTUNE, TTTM_VALVE_CONTROL, TTTM_PENDULUM, TTTM_PIN_ADJUST, 
        TTTM_GAS_PRESSURE, TTTM_MFC_HUNT, TTTM_GAS_LEAK, TTTM_DNET_CAL, TTTM_SHEET, CUST_OHT_CERT, CUST_I_MARKING, 
        CUST_GND_LABEL, CUST_CSF_SEAL, CUST_CERT_RESPONSE, CUST_ENV_QUAL, CUST_OHT_LAYOUT, PROCESS_AGING, 
        PROCESS_AR_TEST, PROCESS_SCRATCH, PROCESS_PARTICLE, PROCESS_EES_MATCH
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        checklistData.name, checklistData.INST_IMPORT_ORDER, checklistData.INST_PACKING_LIST, checklistData.INST_OHT_CHECK, 
        checklistData.INST_SPACING_CHECK, checklistData.INST_DRAW_SETUP, checklistData.INST_DRAW_MARKING, 
        checklistData.INST_UTILITY_SPEC, checklistData.FAB_UNPACK_WARN, checklistData.FAB_CLEAN_WARN, checklistData.FAB_MOVE_WARN, 
        checklistData.DOCK_TOOL_SIZE, checklistData.DOCK_LASER_JIG, checklistData.DOCK_LIFT_CASTER, checklistData.DOCK_FRAME_HEIGHT, 
        checklistData.DOCK_MODULE, checklistData.DOCK_REALIGN, checklistData.DOCK_LEVELER_POS, checklistData.DOCK_LEVEL_SPEC, 
        checklistData.DOCK_ACCESSORY, checklistData.DOCK_HOOK_UP, checklistData.CABLE_TRAY_CHECK, checklistData.CABLE_SORTING, 
        checklistData.CABLE_GRATING, checklistData.CABLE_LADDER_RULES, checklistData.CABLE_INSTALL, checklistData.CABLE_CONNECTION, 
        checklistData.CABLE_TRAY_ARRANGE, checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECT, checklistData.CABLE_PUMP_TRAY, 
        checklistData.CABLE_PUMP_ARRANGE, checklistData.CABLE_MODULE_PUMP, checklistData.POWER_GPS_UPS_SPS, 
        checklistData.POWER_TURN_SEQ, checklistData.POWER_ALARM_TROUBLE, checklistData.POWER_CB_UNDERSTAND, 
        checklistData.POWER_SAFETY_MODULE, checklistData.POWER_EMO_CHECK, checklistData.POWER_SYCON_UNDERST, 
        checklistData.POWER_SYCON_TROUBLE, checklistData.UTIL_TURN_SEQ, checklistData.UTIL_VACUUM_TURN, 
        checklistData.UTIL_CDA_TURN, checklistData.UTIL_PCW_TURN, checklistData.GAS_TURN_SEQ, checklistData.GAS_O2_N2_CHECK, 
        checklistData.GAS_TOXIC_CHECK, checklistData.GAS_MANOMETER_ADJUST, checklistData.TEACH_ROBOT_CONTROL, 
        checklistData.TEACH_ROBOT_LEVEL, checklistData.TEACH_ARM_LEVEL, checklistData.TEACH_LOAD_PORT, 
        checklistData.TEACH_LOADLOCK, checklistData.TEACH_SIDE_STORAGE, checklistData.TEACH_DATA_SAVE, checklistData.TEACH_TM_CONTROL, 
        checklistData.TEACH_TM_LOADLOCK, checklistData.TEACH_TM_PM, checklistData.TEACH_TM_DATA_SAVE, checklistData.TEACH_WAFER_JIG, 
        checklistData.TEACH_FINE, checklistData.TEACH_MARGIN, checklistData.TEACH_SEMI_TRANSFER, checklistData.PART_EXHAUST_PORT, 
        checklistData.PART_EFF_SANKYO, checklistData.PART_EFF_ADJUST, checklistData.PART_EFF_LEVEL, checklistData.PART_TM_EFF, 
        checklistData.PART_TM_ADJUST_380, checklistData.PART_TM_ADJUST_16, checklistData.PART_TM_LEVEL, checklistData.PART_PROCESS_KIT, 
        checklistData.PART_PIO_CABLE, checklistData.PART_RACK_SIGNAL, checklistData.LEAK_PUMP_TURN, checklistData.LEAK_PM_CHECK, 
        checklistData.LEAK_GAS_CHECK, checklistData.LEAK_TM_LL_CHECK, checklistData.TTTM_ECID_MATCH, checklistData.TTTM_PUMP_TIME, 
        checklistData.TTTM_VENT_TIME, checklistData.TTTM_EPD_ADJUST, checklistData.TTTM_TEMP_AUTOTUNE, checklistData.TTTM_VALVE_CONTROL, 
        checklistData.TTTM_PENDULUM, checklistData.TTTM_PIN_ADJUST, checklistData.TTTM_GAS_PRESSURE, checklistData.TTTM_MFC_HUNT, 
        checklistData.TTTM_GAS_LEAK, checklistData.TTTM_DNET_CAL, checklistData.TTTM_SHEET, checklistData.CUST_OHT_CERT, 
        checklistData.CUST_I_MARKING, checklistData.CUST_GND_LABEL, checklistData.CUST_CSF_SEAL, checklistData.CUST_CERT_RESPONSE, 
        checklistData.CUST_ENV_QUAL, checklistData.CUST_OHT_LAYOUT, checklistData.PROCESS_AGING, checklistData.PROCESS_AR_TEST, 
        checklistData.PROCESS_SCRATCH, checklistData.PROCESS_PARTICLE, checklistData.PROCESS_EES_MATCH
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
      UPDATE SUPRA_XP_SETUP_SELF SET
        INST_IMPORT_ORDER = ?, INST_PACKING_LIST = ?, INST_OHT_CHECK = ?, INST_SPACING_CHECK = ?, 
        INST_DRAW_SETUP = ?, INST_DRAW_MARKING = ?, INST_UTILITY_SPEC = ?, FAB_UNPACK_WARN = ?, 
        FAB_CLEAN_WARN = ?, FAB_MOVE_WARN = ?, DOCK_TOOL_SIZE = ?, DOCK_LASER_JIG = ?, DOCK_LIFT_CASTER = ?, 
        DOCK_FRAME_HEIGHT = ?, DOCK_MODULE = ?, DOCK_REALIGN = ?, DOCK_LEVELER_POS = ?, DOCK_LEVEL_SPEC = ?, 
        DOCK_ACCESSORY = ?, DOCK_HOOK_UP = ?, CABLE_TRAY_CHECK = ?, CABLE_SORTING = ?, CABLE_GRATING = ?, 
        CABLE_LADDER_RULES = ?, CABLE_INSTALL = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ARRANGE = ?, 
        CABLE_CUTTING = ?, CABLE_RACK_CONNECT = ?, CABLE_PUMP_TRAY = ?, CABLE_PUMP_ARRANGE = ?, 
        CABLE_MODULE_PUMP = ?, POWER_GPS_UPS_SPS = ?, POWER_TURN_SEQ = ?, POWER_ALARM_TROUBLE = ?, 
        POWER_CB_UNDERSTAND = ?, POWER_SAFETY_MODULE = ?, POWER_EMO_CHECK = ?, POWER_SYCON_UNDERST = ?, 
        POWER_SYCON_TROUBLE = ?, UTIL_TURN_SEQ = ?, UTIL_VACUUM_TURN = ?, UTIL_CDA_TURN = ?, UTIL_PCW_TURN = ?, 
        GAS_TURN_SEQ = ?, GAS_O2_N2_CHECK = ?, GAS_TOXIC_CHECK = ?, GAS_MANOMETER_ADJUST = ?, TEACH_ROBOT_CONTROL = ?, 
        TEACH_ROBOT_LEVEL = ?, TEACH_ARM_LEVEL = ?, TEACH_LOAD_PORT = ?, TEACH_LOADLOCK = ?, TEACH_SIDE_STORAGE = ?, 
        TEACH_DATA_SAVE = ?, TEACH_TM_CONTROL = ?, TEACH_TM_LOADLOCK = ?, TEACH_TM_PM = ?, TEACH_TM_DATA_SAVE = ?, 
        TEACH_WAFER_JIG = ?, TEACH_FINE = ?, TEACH_MARGIN = ?, TEACH_SEMI_TRANSFER = ?, PART_EXHAUST_PORT = ?, 
        PART_EFF_SANKYO = ?, PART_EFF_ADJUST = ?, PART_EFF_LEVEL = ?, PART_TM_EFF = ?, PART_TM_ADJUST_380 = ?, 
        PART_TM_ADJUST_16 = ?, PART_TM_LEVEL = ?, PART_PROCESS_KIT = ?, PART_PIO_CABLE = ?, PART_RACK_SIGNAL = ?, 
        LEAK_PUMP_TURN = ?, LEAK_PM_CHECK = ?, LEAK_GAS_CHECK = ?, LEAK_TM_LL_CHECK = ?, TTTM_ECID_MATCH = ?, 
        TTTM_PUMP_TIME = ?, TTTM_VENT_TIME = ?, TTTM_EPD_ADJUST = ?, TTTM_TEMP_AUTOTUNE = ?, TTTM_VALVE_CONTROL = ?, 
        TTTM_PENDULUM = ?, TTTM_PIN_ADJUST = ?, TTTM_GAS_PRESSURE = ?, TTTM_MFC_HUNT = ?, TTTM_GAS_LEAK = ?, 
        TTTM_DNET_CAL = ?, TTTM_SHEET = ?, CUST_OHT_CERT = ?, CUST_I_MARKING = ?, CUST_GND_LABEL = ?, 
        CUST_CSF_SEAL = ?, CUST_CERT_RESPONSE = ?, CUST_ENV_QUAL = ?, CUST_OHT_LAYOUT = ?, PROCESS_AGING = ?, 
        PROCESS_AR_TEST = ?, PROCESS_SCRATCH = ?, PROCESS_PARTICLE = ?, PROCESS_EES_MATCH = ?
      WHERE name = ?
      `;
      
      const values = [
        checklistData.INST_IMPORT_ORDER, checklistData.INST_PACKING_LIST, checklistData.INST_OHT_CHECK, 
        checklistData.INST_SPACING_CHECK, checklistData.INST_DRAW_SETUP, checklistData.INST_DRAW_MARKING, 
        checklistData.INST_UTILITY_SPEC, checklistData.FAB_UNPACK_WARN, checklistData.FAB_CLEAN_WARN, 
        checklistData.FAB_MOVE_WARN, checklistData.DOCK_TOOL_SIZE, checklistData.DOCK_LASER_JIG, checklistData.DOCK_LIFT_CASTER, 
        checklistData.DOCK_FRAME_HEIGHT, checklistData.DOCK_MODULE, checklistData.DOCK_REALIGN, checklistData.DOCK_LEVELER_POS, 
        checklistData.DOCK_LEVEL_SPEC, checklistData.DOCK_ACCESSORY, checklistData.DOCK_HOOK_UP, checklistData.CABLE_TRAY_CHECK, 
        checklistData.CABLE_SORTING, checklistData.CABLE_GRATING, checklistData.CABLE_LADDER_RULES, checklistData.CABLE_INSTALL, 
        checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGE, checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECT, 
        checklistData.CABLE_PUMP_TRAY, checklistData.CABLE_PUMP_ARRANGE, checklistData.CABLE_MODULE_PUMP, 
        checklistData.POWER_GPS_UPS_SPS, checklistData.POWER_TURN_SEQ, checklistData.POWER_ALARM_TROUBLE, 
        checklistData.POWER_CB_UNDERSTAND, checklistData.POWER_SAFETY_MODULE, checklistData.POWER_EMO_CHECK, 
        checklistData.POWER_SYCON_UNDERST, checklistData.POWER_SYCON_TROUBLE, checklistData.UTIL_TURN_SEQ, 
        checklistData.UTIL_VACUUM_TURN, checklistData.UTIL_CDA_TURN, checklistData.UTIL_PCW_TURN, checklistData.GAS_TURN_SEQ, 
        checklistData.GAS_O2_N2_CHECK, checklistData.GAS_TOXIC_CHECK, checklistData.GAS_MANOMETER_ADJUST, 
        checklistData.TEACH_ROBOT_CONTROL, checklistData.TEACH_ROBOT_LEVEL, checklistData.TEACH_ARM_LEVEL, 
        checklistData.TEACH_LOAD_PORT, checklistData.TEACH_LOADLOCK, checklistData.TEACH_SIDE_STORAGE, checklistData.TEACH_DATA_SAVE, 
        checklistData.TEACH_TM_CONTROL, checklistData.TEACH_TM_LOADLOCK, checklistData.TEACH_TM_PM, checklistData.TEACH_TM_DATA_SAVE, 
        checklistData.TEACH_WAFER_JIG, checklistData.TEACH_FINE, checklistData.TEACH_MARGIN, checklistData.TEACH_SEMI_TRANSFER, 
        checklistData.PART_EXHAUST_PORT, checklistData.PART_EFF_SANKYO, checklistData.PART_EFF_ADJUST, checklistData.PART_EFF_LEVEL, 
        checklistData.PART_TM_EFF, checklistData.PART_TM_ADJUST_380, checklistData.PART_TM_ADJUST_16, checklistData.PART_TM_LEVEL, 
        checklistData.PART_PROCESS_KIT, checklistData.PART_PIO_CABLE, checklistData.PART_RACK_SIGNAL, checklistData.LEAK_PUMP_TURN, 
        checklistData.LEAK_PM_CHECK, checklistData.LEAK_GAS_CHECK, checklistData.LEAK_TM_LL_CHECK, checklistData.TTTM_ECID_MATCH, 
        checklistData.TTTM_PUMP_TIME, checklistData.TTTM_VENT_TIME, checklistData.TTTM_EPD_ADJUST, checklistData.TTTM_TEMP_AUTOTUNE, 
        checklistData.TTTM_VALVE_CONTROL, checklistData.TTTM_PENDULUM, checklistData.TTTM_PIN_ADJUST, checklistData.TTTM_GAS_PRESSURE, 
        checklistData.TTTM_MFC_HUNT, checklistData.TTTM_GAS_LEAK, checklistData.TTTM_DNET_CAL, checklistData.TTTM_SHEET, 
        checklistData.CUST_OHT_CERT, checklistData.CUST_I_MARKING, checklistData.CUST_GND_LABEL, checklistData.CUST_CSF_SEAL, 
        checklistData.CUST_CERT_RESPONSE, checklistData.CUST_ENV_QUAL, checklistData.CUST_OHT_LAYOUT, checklistData.PROCESS_AGING, 
        checklistData.PROCESS_AR_TEST, checklistData.PROCESS_SCRATCH, checklistData.PROCESS_PARTICLE, checklistData.PROCESS_EES_MATCH, 
        checklistData.name
      ];
  
      console.log('SQL Query for Update:', query);
      console.log('SQL Values for Update:', values);
  
      await connection.query(query, values);
    } finally {
      connection.release();
    }
};

  
  
  
  

exports.getChecklistByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM SUPRA_XP_SETUP_SELF WHERE name = ?`;
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
      const query = `SELECT * FROM SUPRA_XP_SETUP`;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllSupraxpSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // SUPRA_XP_SETUP_SELF 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM SUPRA_XP_SETUP_SELF`;
      const [rows] = await connection.query(query);  // SUPRA_XP_SETUP_SELF 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from SUPRA_XP_SETUP_SELF: ${err.message}`);
  }
};
