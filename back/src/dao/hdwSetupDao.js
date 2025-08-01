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
    const query = `SELECT * FROM HDW_SETUP WHERE name = ?`;
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
    const queryFind = `SELECT * FROM HDW_SETUP WHERE name = ?`;
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
      INSERT INTO HDW_SETUP (
        name, EQ_IMPORT_ORDER, PACK_LIST_CHECK, OHT_LINE_CHECK_GENERAL, EQ_SPACING_CHECK,
        DRAWING_TEMPLATE_SETUP, DRAWING_TEMPLATE_MARKING, POKE_POSITION_UNDERSTANDING, UTILITY_SPEC_UNDERSTANDING,
        MODULE_UNPACKING_CAUTION, MODULE_CLEAN_CAUTION, MODULE_MOVEMENT_CAUTION,
        TOOL_REQUIREMENT_UNDERSTANDING, TOOL_SIZE_UNDERSTANDING, MODULE_HEIGHT_DOCKING,
        CASTER_JIG_SEPARATION, MODULE_DOCKING, DOCKING_PIPE_REALIGNMENT, CUSTOM_PIPE_REALIGNMENT,
        LEVEL_CONSIDERATION_POSITION,
        GRATING_OPEN_CAUTION, CABLE_CONNECTION, CABLE_NO_INTERFERENCE, CN1_POSITION_UNDERSTANDING,
        SIGNAL_CABLE_PINMAP, SIGNAL_CABLE_FUNCTION_EXPLANATION,
        GPS_UPS_UNDERSTANDING, POWER_TURN_ON_SEQUENCE, ALARM_TROUBLESHOOTING, RACK_CB_UNDERSTANDING,
        EMO_CHECK, UTILITY_TURN_ON_SEQUENCE, CDA_TURN_ON, UPW_TURN_ON, INLET_VALVE_OPERATION,
        OUTLET_VALVE_OPERATION, BYPASS_VALVE_OPERATION, DRAIN_VALVE_OPERATION,
        GAS_TURN_ON_SEQUENCE, CDA_GAS_CHECK,
        VALVE_INSTALLATION, LEAK_SENSOR_INSTALLATION, SIGNAL_TOWER_INSTALLATION,
        HDW_LEAK_CHECK, GAS_LINE_LEAK_CHECK, PIPE_LEAK_CHECK, UPW_LEAK_CHECK_METHOD, LEAK_RESPONSE_ACTION,
        FLOW_OFF_ADJUST, FLOW_ON_ADJUST, TEMP_SETTING, PARAMETER_SETTING, TC_ADJUST,
        OD_ADJUST, PIPE_DI_LEAK_CHECK,
        IMARKING_POSITION, GND_LABELING, MID_CERT_RESPONSE, AIR_CAP_REMOVAL,
        HDW_REMOTE_TEST, HDW_LOCAL_TEST
      ) VALUES (${Array(61).fill('?').join(', ')})
    `;

    const values = [
      checklistData.name,
      checklistData.EQ_IMPORT_ORDER, checklistData.PACK_LIST_CHECK, checklistData.OHT_LINE_CHECK_GENERAL, checklistData.EQ_SPACING_CHECK,
      checklistData.DRAWING_TEMPLATE_SETUP, checklistData.DRAWING_TEMPLATE_MARKING, checklistData.POKE_POSITION_UNDERSTANDING, checklistData.UTILITY_SPEC_UNDERSTANDING,
      checklistData.MODULE_UNPACKING_CAUTION, checklistData.MODULE_CLEAN_CAUTION, checklistData.MODULE_MOVEMENT_CAUTION,
      checklistData.TOOL_REQUIREMENT_UNDERSTANDING, checklistData.TOOL_SIZE_UNDERSTANDING, checklistData.MODULE_HEIGHT_DOCKING,
      checklistData.CASTER_JIG_SEPARATION, checklistData.MODULE_DOCKING, checklistData.DOCKING_PIPE_REALIGNMENT, checklistData.CUSTOM_PIPE_REALIGNMENT,
      checklistData.LEVEL_CONSIDERATION_POSITION,
      checklistData.GRATING_OPEN_CAUTION, checklistData.CABLE_CONNECTION, checklistData.CABLE_NO_INTERFERENCE, checklistData.CN1_POSITION_UNDERSTANDING,
      checklistData.SIGNAL_CABLE_PINMAP, checklistData.SIGNAL_CABLE_FUNCTION_EXPLANATION,
      checklistData.GPS_UPS_UNDERSTANDING, checklistData.POWER_TURN_ON_SEQUENCE, checklistData.ALARM_TROUBLESHOOTING, checklistData.RACK_CB_UNDERSTANDING,
      checklistData.EMO_CHECK, checklistData.UTILITY_TURN_ON_SEQUENCE, checklistData.CDA_TURN_ON, checklistData.UPW_TURN_ON, checklistData.INLET_VALVE_OPERATION,
      checklistData.OUTLET_VALVE_OPERATION, checklistData.BYPASS_VALVE_OPERATION, checklistData.DRAIN_VALVE_OPERATION,
      checklistData.GAS_TURN_ON_SEQUENCE, checklistData.CDA_GAS_CHECK,
      checklistData.VALVE_INSTALLATION, checklistData.LEAK_SENSOR_INSTALLATION, checklistData.SIGNAL_TOWER_INSTALLATION,
      checklistData.HDW_LEAK_CHECK, checklistData.GAS_LINE_LEAK_CHECK, checklistData.PIPE_LEAK_CHECK, checklistData.UPW_LEAK_CHECK_METHOD, checklistData.LEAK_RESPONSE_ACTION,
      checklistData.FLOW_OFF_ADJUST, checklistData.FLOW_ON_ADJUST, checklistData.TEMP_SETTING, checklistData.PARAMETER_SETTING, checklistData.TC_ADJUST,
      checklistData.OD_ADJUST, checklistData.PIPE_DI_LEAK_CHECK,
      checklistData.IMARKING_POSITION, checklistData.GND_LABELING, checklistData.MID_CERT_RESPONSE, checklistData.AIR_CAP_REMOVAL,
      checklistData.HDW_REMOTE_TEST, checklistData.HDW_LOCAL_TEST
    ];

    await connection.query(query, values);
  } finally {
    connection.release();
  }
};
  



exports.updateChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE HDW_SETUP SET
        EQ_IMPORT_ORDER = ?, PACK_LIST_CHECK = ?, OHT_LINE_CHECK_GENERAL = ?, EQ_SPACING_CHECK = ?,
        DRAWING_TEMPLATE_SETUP = ?, DRAWING_TEMPLATE_MARKING = ?, POKE_POSITION_UNDERSTANDING = ?, UTILITY_SPEC_UNDERSTANDING = ?,
        MODULE_UNPACKING_CAUTION = ?, MODULE_CLEAN_CAUTION = ?, MODULE_MOVEMENT_CAUTION = ?,
        TOOL_REQUIREMENT_UNDERSTANDING = ?, TOOL_SIZE_UNDERSTANDING = ?, MODULE_HEIGHT_DOCKING = ?,
        CASTER_JIG_SEPARATION = ?, MODULE_DOCKING = ?, DOCKING_PIPE_REALIGNMENT = ?, CUSTOM_PIPE_REALIGNMENT = ?,
        LEVEL_CONSIDERATION_POSITION = ?,
        GRATING_OPEN_CAUTION = ?, CABLE_CONNECTION = ?, CABLE_NO_INTERFERENCE = ?, CN1_POSITION_UNDERSTANDING = ?,
        SIGNAL_CABLE_PINMAP = ?, SIGNAL_CABLE_FUNCTION_EXPLANATION = ?,
        GPS_UPS_UNDERSTANDING = ?, POWER_TURN_ON_SEQUENCE = ?, ALARM_TROUBLESHOOTING = ?, RACK_CB_UNDERSTANDING = ?,
        EMO_CHECK = ?, UTILITY_TURN_ON_SEQUENCE = ?, CDA_TURN_ON = ?, UPW_TURN_ON = ?, INLET_VALVE_OPERATION = ?,
        OUTLET_VALVE_OPERATION = ?, BYPASS_VALVE_OPERATION = ?, DRAIN_VALVE_OPERATION = ?,
        GAS_TURN_ON_SEQUENCE = ?, CDA_GAS_CHECK = ?,
        VALVE_INSTALLATION = ?, LEAK_SENSOR_INSTALLATION = ?, SIGNAL_TOWER_INSTALLATION = ?,
        HDW_LEAK_CHECK = ?, GAS_LINE_LEAK_CHECK = ?, PIPE_LEAK_CHECK = ?, UPW_LEAK_CHECK_METHOD = ?, LEAK_RESPONSE_ACTION = ?,
        FLOW_OFF_ADJUST = ?, FLOW_ON_ADJUST = ?, TEMP_SETTING = ?, PARAMETER_SETTING = ?, TC_ADJUST = ?,
        OD_ADJUST = ?, PIPE_DI_LEAK_CHECK = ?,
        IMARKING_POSITION = ?, GND_LABELING = ?, MID_CERT_RESPONSE = ?, AIR_CAP_REMOVAL = ?,
        HDW_REMOTE_TEST = ?, HDW_LOCAL_TEST = ?
      WHERE name = ?
    `;

    const values = [
      checklistData.EQ_IMPORT_ORDER, checklistData.PACK_LIST_CHECK, checklistData.OHT_LINE_CHECK_GENERAL, checklistData.EQ_SPACING_CHECK,
      checklistData.DRAWING_TEMPLATE_SETUP, checklistData.DRAWING_TEMPLATE_MARKING, checklistData.POKE_POSITION_UNDERSTANDING, checklistData.UTILITY_SPEC_UNDERSTANDING,
      checklistData.MODULE_UNPACKING_CAUTION, checklistData.MODULE_CLEAN_CAUTION, checklistData.MODULE_MOVEMENT_CAUTION,
      checklistData.TOOL_REQUIREMENT_UNDERSTANDING, checklistData.TOOL_SIZE_UNDERSTANDING, checklistData.MODULE_HEIGHT_DOCKING,
      checklistData.CASTER_JIG_SEPARATION, checklistData.MODULE_DOCKING, checklistData.DOCKING_PIPE_REALIGNMENT, checklistData.CUSTOM_PIPE_REALIGNMENT,
      checklistData.LEVEL_CONSIDERATION_POSITION,
      checklistData.GRATING_OPEN_CAUTION, checklistData.CABLE_CONNECTION, checklistData.CABLE_NO_INTERFERENCE, checklistData.CN1_POSITION_UNDERSTANDING,
      checklistData.SIGNAL_CABLE_PINMAP, checklistData.SIGNAL_CABLE_FUNCTION_EXPLANATION,
      checklistData.GPS_UPS_UNDERSTANDING, checklistData.POWER_TURN_ON_SEQUENCE, checklistData.ALARM_TROUBLESHOOTING, checklistData.RACK_CB_UNDERSTANDING,
      checklistData.EMO_CHECK, checklistData.UTILITY_TURN_ON_SEQUENCE, checklistData.CDA_TURN_ON, checklistData.UPW_TURN_ON, checklistData.INLET_VALVE_OPERATION,
      checklistData.OUTLET_VALVE_OPERATION, checklistData.BYPASS_VALVE_OPERATION, checklistData.DRAIN_VALVE_OPERATION,
      checklistData.GAS_TURN_ON_SEQUENCE, checklistData.CDA_GAS_CHECK,
      checklistData.VALVE_INSTALLATION, checklistData.LEAK_SENSOR_INSTALLATION, checklistData.SIGNAL_TOWER_INSTALLATION,
      checklistData.HDW_LEAK_CHECK, checklistData.GAS_LINE_LEAK_CHECK, checklistData.PIPE_LEAK_CHECK, checklistData.UPW_LEAK_CHECK_METHOD, checklistData.LEAK_RESPONSE_ACTION,
      checklistData.FLOW_OFF_ADJUST, checklistData.FLOW_ON_ADJUST, checklistData.TEMP_SETTING, checklistData.PARAMETER_SETTING, checklistData.TC_ADJUST,
      checklistData.OD_ADJUST, checklistData.PIPE_DI_LEAK_CHECK,
      checklistData.IMARKING_POSITION, checklistData.GND_LABELING, checklistData.MID_CERT_RESPONSE, checklistData.AIR_CAP_REMOVAL,
      checklistData.HDW_REMOTE_TEST, checklistData.HDW_LOCAL_TEST,
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
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM HDW_SETUP WHERE name = ?`;
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
      const query = `SELECT * FROM HDW_SETUP_COUNT`; // 나중에 수정해야 되는 부분 !!!!!!!!!
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllHdwSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // HDW_SETUP 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM HDW_SETUP`;
      const [rows] = await connection.query(query);  // HDW_SETUP 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from HDW_SETUP: ${err.message}`);
  }
};
