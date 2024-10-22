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
    const query = `SELECT * FROM PRECIA_SETUP WHERE name = ?`;
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
    const queryFind = `SELECT * FROM PRECIA_SETUP WHERE name = ?`;
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
    INSERT INTO PRECIA_SETUP (
      name, INST_OHT_CHECK, INST_SPACING_CHECK, INST_DRAW_SETUP, INST_DRAW_MARKING, INST_UTILITY_SPEC, FAB_IMPORT_ORDER, 
      FAB_WARN_ISSUE, FAB_INSPECT, FAB_FORBIDDEN, FAB_GRATING, FAB_PACKING_LIST, DOCK_TOOL_SIZE, DOCK_LASER_JIG, 
      DOCK_CASTER, DOCK_HEIGHT, DOCK_MODULE, DOCK_REALIGN, DOCK_LEVEL_POS, DOCK_LEVEL_SPEC, DOCK_ACCESSORY, 
      DOCK_HOOK_UP, CABLE_TRAY_CHECK, CABLE_SORTING, CABLE_GRATING, CABLE_LADDER_RULES, CABLE_INSTALL, 
      CABLE_CONNECTION, CABLE_TRAY_ARRANGE, CABLE_CUTTING, CABLE_RACK_CONNECT, CABLE_PUMP_TRAY, 
      CABLE_PUMP_ARRANGE, CABLE_MODULE_PUMP, POWER_GPS_UPS_SPS, POWER_TURN_SEQ, POWER_CB_UNDERSTAND, 
      POWER_SAFETY_MODULE, POWER_EMO_CHECK, POWER_MODULE_MCB, POWER_SYCON_UNDERST, POWER_SYCON_TROUBLE, 
      POWER_NAVIGATOR, POWER_SERVO_CHECK, POWER_ALARM_TROUBLE, POWER_CHECKLIST, POWER_VISION_CONNECT, 
      POWER_IP_CHANGE, UTIL_CDA_TURN, UTIL_PRE_CHECK, UTIL_SETUP_MOD, UTIL_TURN_SEQ, UTIL_VACUUM_TURN, 
      UTIL_SOLENOID, UTIL_RELIEF_VALVE, UTIL_MANUAL_VALVE, UTIL_PUMP_TURN, UTIL_SIGNAL_CHECK, UTIL_CHILLER_TURN, 
      UTIL_CHILLER_CHECK, UTIL_MANOMETER_ADJUST, GAS_TURN_SEQ, GAS_O2_LEAK, GAS_N2_LEAK, GAS_AR_TURN, 
      GAS_CF4_TURN, GAS_SF6_TURN, GAS_TURN_WARN, GAS_DILLUTION_TEST, GAS_FLOW_CHECK, TEACH_ROBOT_CONTROL, 
      TEACH_ROBOT_XYZ, TEACH_ROBOT_PARAM, TEACH_DATA_SAVE, TEACH_AWC_CAL, TEACH_TM_CONTROL, TEACH_TM_LEVELING, 
      TEACH_TM_VALUES, TEACH_TM_PM, TEACH_TM_AWC, TEACH_TM_LL, TEACH_TM_LL_AWC, TEACH_TM_DATA_SAVE, TEACH_TM_MACRO, 
      TEACH_TM_AXIS, TEACH_SEMI_TRANSFER, TEACH_AGING, TEACH_PIN, TEACH_CHUCK, TEACH_GAP, TEACH_SENSOR, 
      TEACH_CAL, TEACH_CENTERING, PART_PROCESS_KIT, PART_PIN_HEIGHT, PART_PIO_SENSOR, PART_EARTHQUAKE, 
      PART_EFEM_PICK, PART_EFEM_PICK_LEVEL, PART_EFEM_PICK_ADJUST, PART_TM_PICK, PART_TM_PICK_LEVEL, 
      PART_TM_PICK_ADJUST, LEAK_CHAMBER, LEAK_LINE, LEAK_HISTORY, TTTM_MANOMETER_DNET, TTTM_PIRANI_DNET, 
      TTTM_VALVE_TIME, TTTM_APC_AUTOTUNE, TTTM_PIN_HEIGHT, TTTM_GAS_PRESSURE, TTTM_MFC_CAL, TTTM_LP_FLOW, 
      TTTM_REPORT, TTTM_SHEET, CUST_LP_CERT, CUST_RUN_CERT, CUST_LABEL, CUST_I_MARK, CUST_I_MARK_LOC, 
      CUST_ENV_QUAL, CUST_OHT_CERT, CUST_RUN_CERTIFY, PROC_PARTICLE, PROC_EA_TEST
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      checklistData.name, checklistData.INST_OHT_CHECK, checklistData.INST_SPACING_CHECK, checklistData.INST_DRAW_SETUP, 
      checklistData.INST_DRAW_MARKING, checklistData.INST_UTILITY_SPEC, checklistData.FAB_IMPORT_ORDER, 
      checklistData.FAB_WARN_ISSUE, checklistData.FAB_INSPECT, checklistData.FAB_FORBIDDEN, checklistData.FAB_GRATING, 
      checklistData.FAB_PACKING_LIST, checklistData.DOCK_TOOL_SIZE, checklistData.DOCK_LASER_JIG, 
      checklistData.DOCK_CASTER, checklistData.DOCK_HEIGHT, checklistData.DOCK_MODULE, checklistData.DOCK_REALIGN, 
      checklistData.DOCK_LEVEL_POS, checklistData.DOCK_LEVEL_SPEC, checklistData.DOCK_ACCESSORY, checklistData.DOCK_HOOK_UP, 
      checklistData.CABLE_TRAY_CHECK, checklistData.CABLE_SORTING, checklistData.CABLE_GRATING, 
      checklistData.CABLE_LADDER_RULES, checklistData.CABLE_INSTALL, checklistData.CABLE_CONNECTION, 
      checklistData.CABLE_TRAY_ARRANGE, checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECT, 
      checklistData.CABLE_PUMP_TRAY, checklistData.CABLE_PUMP_ARRANGE, checklistData.CABLE_MODULE_PUMP, 
      checklistData.POWER_GPS_UPS_SPS, checklistData.POWER_TURN_SEQ, checklistData.POWER_CB_UNDERSTAND, 
      checklistData.POWER_SAFETY_MODULE, checklistData.POWER_EMO_CHECK, checklistData.POWER_MODULE_MCB, 
      checklistData.POWER_SYCON_UNDERST, checklistData.POWER_SYCON_TROUBLE, checklistData.POWER_NAVIGATOR, 
      checklistData.POWER_SERVO_CHECK, checklistData.POWER_ALARM_TROUBLE, checklistData.POWER_CHECKLIST, 
      checklistData.POWER_VISION_CONNECT, checklistData.POWER_IP_CHANGE, checklistData.UTIL_CDA_TURN, 
      checklistData.UTIL_PRE_CHECK, checklistData.UTIL_SETUP_MOD, checklistData.UTIL_TURN_SEQ, checklistData.UTIL_VACUUM_TURN, 
      checklistData.UTIL_SOLENOID, checklistData.UTIL_RELIEF_VALVE, checklistData.UTIL_MANUAL_VALVE, 
      checklistData.UTIL_PUMP_TURN, checklistData.UTIL_SIGNAL_CHECK, checklistData.UTIL_CHILLER_TURN, 
      checklistData.UTIL_CHILLER_CHECK, checklistData.UTIL_MANOMETER_ADJUST, checklistData.GAS_TURN_SEQ, 
      checklistData.GAS_O2_LEAK, checklistData.GAS_N2_LEAK, checklistData.GAS_AR_TURN, checklistData.GAS_CF4_TURN, 
      checklistData.GAS_SF6_TURN, checklistData.GAS_TURN_WARN, checklistData.GAS_DILLUTION_TEST, checklistData.GAS_FLOW_CHECK, 
      checklistData.TEACH_ROBOT_CONTROL, checklistData.TEACH_ROBOT_XYZ, checklistData.TEACH_ROBOT_PARAM, checklistData.TEACH_DATA_SAVE, 
      checklistData.TEACH_AWC_CAL, checklistData.TEACH_TM_CONTROL, checklistData.TEACH_TM_LEVELING, checklistData.TEACH_TM_VALUES, 
      checklistData.TEACH_TM_PM, checklistData.TEACH_TM_AWC, checklistData.TEACH_TM_LL, checklistData.TEACH_TM_LL_AWC, 
      checklistData.TEACH_TM_DATA_SAVE, checklistData.TEACH_TM_MACRO, checklistData.TEACH_TM_AXIS, checklistData.TEACH_SEMI_TRANSFER, 
      checklistData.TEACH_AGING, checklistData.TEACH_PIN, checklistData.TEACH_CHUCK, checklistData.TEACH_GAP, checklistData.TEACH_SENSOR, 
      checklistData.TEACH_CAL, checklistData.TEACH_CENTERING, checklistData.PART_PROCESS_KIT, checklistData.PART_PIN_HEIGHT, 
      checklistData.PART_PIO_SENSOR, checklistData.PART_EARTHQUAKE, checklistData.PART_EFEM_PICK, checklistData.PART_EFEM_PICK_LEVEL, 
      checklistData.PART_EFEM_PICK_ADJUST, checklistData.PART_TM_PICK, checklistData.PART_TM_PICK_LEVEL, checklistData.PART_TM_PICK_ADJUST, 
      checklistData.LEAK_CHAMBER, checklistData.LEAK_LINE, checklistData.LEAK_HISTORY, checklistData.TTTM_MANOMETER_DNET, 
      checklistData.TTTM_PIRANI_DNET, checklistData.TTTM_VALVE_TIME, checklistData.TTTM_APC_AUTOTUNE, checklistData.TTTM_PIN_HEIGHT, 
      checklistData.TTTM_GAS_PRESSURE, checklistData.TTTM_MFC_CAL, checklistData.TTTM_LP_FLOW, checklistData.TTTM_REPORT, 
      checklistData.TTTM_SHEET, checklistData.CUST_LP_CERT, checklistData.CUST_RUN_CERT, checklistData.CUST_LABEL, checklistData.CUST_I_MARK, 
      checklistData.CUST_I_MARK_LOC, checklistData.CUST_ENV_QUAL, checklistData.CUST_OHT_CERT, checklistData.CUST_RUN_CERTIFY, 
      checklistData.PROC_PARTICLE, checklistData.PROC_EA_TEST
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
  UPDATE PRECIA_SETUP SET
    INST_OHT_CHECK = ?, INST_SPACING_CHECK = ?, INST_DRAW_SETUP = ?, INST_DRAW_MARKING = ?, INST_UTILITY_SPEC = ?, 
    FAB_IMPORT_ORDER = ?, FAB_WARN_ISSUE = ?, FAB_INSPECT = ?, FAB_FORBIDDEN = ?, FAB_GRATING = ?, FAB_PACKING_LIST = ?, 
    DOCK_TOOL_SIZE = ?, DOCK_LASER_JIG = ?, DOCK_CASTER = ?, DOCK_HEIGHT = ?, DOCK_MODULE = ?, DOCK_REALIGN = ?, 
    DOCK_LEVEL_POS = ?, DOCK_LEVEL_SPEC = ?, DOCK_ACCESSORY = ?, DOCK_HOOK_UP = ?, CABLE_TRAY_CHECK = ?, CABLE_SORTING = ?, 
    CABLE_GRATING = ?, CABLE_LADDER_RULES = ?, CABLE_INSTALL = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ARRANGE = ?, 
    CABLE_CUTTING = ?, CABLE_RACK_CONNECT = ?, CABLE_PUMP_TRAY = ?, CABLE_PUMP_ARRANGE = ?, CABLE_MODULE_PUMP = ?, 
    POWER_GPS_UPS_SPS = ?, POWER_TURN_SEQ = ?, POWER_CB_UNDERSTAND = ?, POWER_SAFETY_MODULE = ?, POWER_EMO_CHECK = ?, 
    POWER_MODULE_MCB = ?, POWER_SYCON_UNDERST = ?, POWER_SYCON_TROUBLE = ?, POWER_NAVIGATOR = ?, POWER_SERVO_CHECK = ?, 
    POWER_ALARM_TROUBLE = ?, POWER_CHECKLIST = ?, POWER_VISION_CONNECT = ?, POWER_IP_CHANGE = ?, UTIL_CDA_TURN = ?, 
    UTIL_PRE_CHECK = ?, UTIL_SETUP_MOD = ?, UTIL_TURN_SEQ = ?, UTIL_VACUUM_TURN = ?, UTIL_SOLENOID = ?, 
    UTIL_RELIEF_VALVE = ?, UTIL_MANUAL_VALVE = ?, UTIL_PUMP_TURN = ?, UTIL_SIGNAL_CHECK = ?, UTIL_CHILLER_TURN = ?, 
    UTIL_CHILLER_CHECK = ?, UTIL_MANOMETER_ADJUST = ?, GAS_TURN_SEQ = ?, GAS_O2_LEAK = ?, GAS_N2_LEAK = ?, GAS_AR_TURN = ?, 
    GAS_CF4_TURN = ?, GAS_SF6_TURN = ?, GAS_TURN_WARN = ?, GAS_DILLUTION_TEST = ?, GAS_FLOW_CHECK = ?, TEACH_ROBOT_CONTROL = ?, 
    TEACH_ROBOT_XYZ = ?, TEACH_ROBOT_PARAM = ?, TEACH_DATA_SAVE = ?, TEACH_AWC_CAL = ?, TEACH_TM_CONTROL = ?, TEACH_TM_LEVELING = ?, 
    TEACH_TM_VALUES = ?, TEACH_TM_PM = ?, TEACH_TM_AWC = ?, TEACH_TM_LL = ?, TEACH_TM_LL_AWC = ?, TEACH_TM_DATA_SAVE = ?, 
    TEACH_TM_MACRO = ?, TEACH_TM_AXIS = ?, TEACH_SEMI_TRANSFER = ?, TEACH_AGING = ?, TEACH_PIN = ?, TEACH_CHUCK = ?, TEACH_GAP = ?, 
    TEACH_SENSOR = ?, TEACH_CAL = ?, TEACH_CENTERING = ?, PART_PROCESS_KIT = ?, PART_PIN_HEIGHT = ?, PART_PIO_SENSOR = ?, 
    PART_EARTHQUAKE = ?, PART_EFEM_PICK = ?, PART_EFEM_PICK_LEVEL = ?, PART_EFEM_PICK_ADJUST = ?, PART_TM_PICK = ?, 
    PART_TM_PICK_LEVEL = ?, PART_TM_PICK_ADJUST = ?, LEAK_CHAMBER = ?, LEAK_LINE = ?, LEAK_HISTORY = ?, TTTM_MANOMETER_DNET = ?, 
    TTTM_PIRANI_DNET = ?, TTTM_VALVE_TIME = ?, TTTM_APC_AUTOTUNE = ?, TTTM_PIN_HEIGHT = ?, TTTM_GAS_PRESSURE = ?, 
    TTTM_MFC_CAL = ?, TTTM_LP_FLOW = ?, TTTM_REPORT = ?, TTTM_SHEET = ?, CUST_LP_CERT = ?, CUST_RUN_CERT = ?, CUST_LABEL = ?, 
    CUST_I_MARK = ?, CUST_I_MARK_LOC = ?, CUST_ENV_QUAL = ?, CUST_OHT_CERT = ?, CUST_RUN_CERTIFY = ?, PROC_PARTICLE = ?, 
    PROC_EA_TEST = ?
  WHERE name = ?
`;

const values = [
  checklistData.INST_OHT_CHECK, checklistData.INST_SPACING_CHECK, checklistData.INST_DRAW_SETUP, checklistData.INST_DRAW_MARKING, 
  checklistData.INST_UTILITY_SPEC, checklistData.FAB_IMPORT_ORDER, checklistData.FAB_WARN_ISSUE, checklistData.FAB_INSPECT, 
  checklistData.FAB_FORBIDDEN, checklistData.FAB_GRATING, checklistData.FAB_PACKING_LIST, checklistData.DOCK_TOOL_SIZE, 
  checklistData.DOCK_LASER_JIG, checklistData.DOCK_CASTER, checklistData.DOCK_HEIGHT, checklistData.DOCK_MODULE, 
  checklistData.DOCK_REALIGN, checklistData.DOCK_LEVEL_POS, checklistData.DOCK_LEVEL_SPEC, checklistData.DOCK_ACCESSORY, 
  checklistData.DOCK_HOOK_UP, checklistData.CABLE_TRAY_CHECK, checklistData.CABLE_SORTING, checklistData.CABLE_GRATING, 
  checklistData.CABLE_LADDER_RULES, checklistData.CABLE_INSTALL, checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGE, 
  checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECT, checklistData.CABLE_PUMP_TRAY, checklistData.CABLE_PUMP_ARRANGE, 
  checklistData.CABLE_MODULE_PUMP, checklistData.POWER_GPS_UPS_SPS, checklistData.POWER_TURN_SEQ, checklistData.POWER_CB_UNDERSTAND, 
  checklistData.POWER_SAFETY_MODULE, checklistData.POWER_EMO_CHECK, checklistData.POWER_MODULE_MCB, checklistData.POWER_SYCON_UNDERST, 
  checklistData.POWER_SYCON_TROUBLE, checklistData.POWER_NAVIGATOR, checklistData.POWER_SERVO_CHECK, checklistData.POWER_ALARM_TROUBLE, 
  checklistData.POWER_CHECKLIST, checklistData.POWER_VISION_CONNECT, checklistData.POWER_IP_CHANGE, checklistData.UTIL_CDA_TURN, 
  checklistData.UTIL_PRE_CHECK, checklistData.UTIL_SETUP_MOD, checklistData.UTIL_TURN_SEQ, checklistData.UTIL_VACUUM_TURN, 
  checklistData.UTIL_SOLENOID, checklistData.UTIL_RELIEF_VALVE, checklistData.UTIL_MANUAL_VALVE, checklistData.UTIL_PUMP_TURN, 
  checklistData.UTIL_SIGNAL_CHECK, checklistData.UTIL_CHILLER_TURN, checklistData.UTIL_CHILLER_CHECK, checklistData.UTIL_MANOMETER_ADJUST, 
  checklistData.GAS_TURN_SEQ, checklistData.GAS_O2_LEAK, checklistData.GAS_N2_LEAK, checklistData.GAS_AR_TURN, checklistData.GAS_CF4_TURN, 
  checklistData.GAS_SF6_TURN, checklistData.GAS_TURN_WARN, checklistData.GAS_DILLUTION_TEST, checklistData.GAS_FLOW_CHECK, 
  checklistData.TEACH_ROBOT_CONTROL, checklistData.TEACH_ROBOT_XYZ, checklistData.TEACH_ROBOT_PARAM, checklistData.TEACH_DATA_SAVE, 
  checklistData.TEACH_AWC_CAL, checklistData.TEACH_TM_CONTROL, checklistData.TEACH_TM_LEVELING, checklistData.TEACH_TM_VALUES, 
  checklistData.TEACH_TM_PM, checklistData.TEACH_TM_AWC, checklistData.TEACH_TM_LL, checklistData.TEACH_TM_LL_AWC, 
  checklistData.TEACH_TM_DATA_SAVE, checklistData.TEACH_TM_MACRO, checklistData.TEACH_TM_AXIS, checklistData.TEACH_SEMI_TRANSFER, 
  checklistData.TEACH_AGING, checklistData.TEACH_PIN, checklistData.TEACH_CHUCK, checklistData.TEACH_GAP, checklistData.TEACH_SENSOR, 
  checklistData.TEACH_CAL, checklistData.TEACH_CENTERING, checklistData.PART_PROCESS_KIT, checklistData.PART_PIN_HEIGHT, 
  checklistData.PART_PIO_SENSOR, checklistData.PART_EARTHQUAKE, checklistData.PART_EFEM_PICK, checklistData.PART_EFEM_PICK_LEVEL, 
  checklistData.PART_EFEM_PICK_ADJUST, checklistData.PART_TM_PICK, checklistData.PART_TM_PICK_LEVEL, checklistData.PART_TM_PICK_ADJUST, 
  checklistData.LEAK_CHAMBER, checklistData.LEAK_LINE, checklistData.LEAK_HISTORY, checklistData.TTTM_MANOMETER_DNET, 
  checklistData.TTTM_PIRANI_DNET, checklistData.TTTM_VALVE_TIME, checklistData.TTTM_APC_AUTOTUNE, checklistData.TTTM_PIN_HEIGHT, 
  checklistData.TTTM_GAS_PRESSURE, checklistData.TTTM_MFC_CAL, checklistData.TTTM_LP_FLOW, checklistData.TTTM_REPORT, 
  checklistData.TTTM_SHEET, checklistData.CUST_LP_CERT, checklistData.CUST_RUN_CERT, checklistData.CUST_LABEL, checklistData.CUST_I_MARK, 
  checklistData.CUST_I_MARK_LOC, checklistData.CUST_ENV_QUAL, checklistData.CUST_OHT_CERT, checklistData.CUST_RUN_CERTIFY, 
  checklistData.PROC_PARTICLE, checklistData.PROC_EA_TEST, checklistData.name
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
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM PRECIA_SETUP WHERE name = ?`;
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
      const query = `SELECT * FROM PRECIA_SETUP_COUNT`;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllPreciaSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // PRECIA_SETUP 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM PRECIA_SETUP`;
      const [rows] = await connection.query(query);  // PRECIA_SETUP 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from PRECIA_SETUP: ${err.message}`);
  }
};
