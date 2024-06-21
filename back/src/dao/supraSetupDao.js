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
    const query = `SELECT * FROM SUPRA_N_SETUP_SELF WHERE name = ?`;
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
      INSERT INTO SUPRA_N_SETUP_SELF (
        name, DRAWING_TEMPLATE_ALIGNMENT, DRAWING_TEMPLATE_MARKING, LINE_ALIGNMENT_CHECK, UTILITY_SPEC_KNOWLEDGE,
        FAB_IN_CAUTION, FAB_IN_ORDER, GAP_CHECK, PACKING_LIST_CHECK, TOOL_SIZE_KNOWLEDGE, LASER_JIG_ALIGNMENT,
        LIFT_USE, MODULE_HEIGHT_KNOWLEDGE, MODULE_DOCKING, DOCKING_REALIGNMENT, LEVELER_POSITION_KNOWLEDGE,
        LEVELING_SPEC_KNOWLEDGE, INTERNAL_HOOK_UP, TRAY_CHECK, CABLE_CLASSIFICATION, GRATING_OPEN_CAUTION,
        LADDER_SAFETY, CABLE_INSTALLATION, CABLE_CONNECTION, CABLE_TRAY_ORGANIZATION, CABLE_CUTTING,
        CABLE_RACK_CONNECTION, PUMP_CABLE_TYPE_KNOWLEDGE, PUMP_CABLE_INSTALLATION, PUMP_CABLE_PM_CONNECTION,
        POWER_SYSTEM_KNOWLEDGE, POWER_ON_ORDER, CB_TYPE_KNOWLEDGE, SYCON_NUMBER_KNOWLEDGE, MODULE_CB_TURN_ON,
        SAFETY_MODULE_KNOWLEDGE, EMO_CHECK, ALARM_TROUBLE_SHOOTING, UTILITY_ON_ORDER, VACUUM_ON_ADJUSTMENT,
        CDA_ON_ADJUSTMENT, PCW_ON_ADJUSTMENT, GAS_ON_KNOWLEDGE, GAS_ON_CHECK, GAS_FLOW_CHECK,
        MANOMETER_ADJUSTMENT, EFEM_ROBOT_PENDANT, EFEM_ROBOT_LEVELING, EFEM_ARM_LEVELING, EFEM_DATA_SAVE,
        TM_ROBOT_PENDANT, TM_PICK_ADJUST, TM_BM_TEACHING, TM_PM_TEACHING, TM_DATA_SAVE, WAFER_JIG_USE,
        LASER_JIG_USE, FINE_TEACHING, MARGIN_CHECK, SEMI_AUTO_TRANSFER, AGING_TEST, GAUGE_INSTALLATION,
        EPD_INSTALLATION, PIO_INSTALLATION, SIGNAL_TOWER_INSTALLATION, CTC_INSTALLATION, PORTABLE_RACK_INSTALLATION,
        SAFETY_COVER_INSTALLATION, PROCESS_KIT_INSTALLATION, PUMP_ON, PM_LEAK_CHECK, GAS_LEAK_CHECK,
        HELIUM_DETECTOR_USE, ECID_MATCHING, COOLING_STAGE_ADJUSTMENT, PUMPING_VENTING_ADJUSTMENT,
        EPD_ADJUSTMENT, TEMP_AUTOTUNE, DOOR_VALVE_ADJUSTMENT, APC_AUTOLEARN, PIN_SPEED_ADJUSTMENT,
        GAS_PRESSURE_CHECK, MFC_HUNTING_CHECK, FCIP_CAL, TTTM_SHEET, OHT_LAYOUT_CERTIFICATION,
        OHT_CERTIFICATION, MID_CERTIFICATION_TOOL_KNOWLEDGE, EFEM_MID_CERTIFICATION, TM_MID_CERTIFICATION,
        PM_MID_CERTIFICATION, SUB_UNIT_MID_CERTIFICATION, RACK_MID_CERTIFICATION, MID_CERTIFICATION_RESPONSE,
        ENV_QUAL_RESPONSE, AGING_TEST_KNOWLEDGE, EES_REPORT_PROCEDURE
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      checklistData.name, checklistData['DRAWING_TEMPLATE_ALIGNMENT'], checklistData['DRAWING_TEMPLATE_MARKING'],
      checklistData['LINE_ALIGNMENT_CHECK'], checklistData['UTILITY_SPEC_KNOWLEDGE'], checklistData['FAB_IN_CAUTION'],
      checklistData['FAB_IN_ORDER'], checklistData['GAP_CHECK'], checklistData['PACKING_LIST_CHECK'], checklistData['TOOL_SIZE_KNOWLEDGE'],
      checklistData['LASER_JIG_ALIGNMENT'], checklistData['LIFT_USE'], checklistData['MODULE_HEIGHT_KNOWLEDGE'],
      checklistData['MODULE_DOCKING'], checklistData['DOCKING_REALIGNMENT'], checklistData['LEVELER_POSITION_KNOWLEDGE'],
      checklistData['LEVELING_SPEC_KNOWLEDGE'], checklistData['INTERNAL_HOOK_UP'], checklistData['TRAY_CHECK'],
      checklistData['CABLE_CLASSIFICATION'], checklistData['GRATING_OPEN_CAUTION'], checklistData['LADDER_SAFETY'],
      checklistData['CABLE_INSTALLATION'], checklistData['CABLE_CONNECTION'], checklistData['CABLE_TRAY_ORGANIZATION'],
      checklistData['CABLE_CUTTING'], checklistData['CABLE_RACK_CONNECTION'], checklistData['PUMP_CABLE_TYPE_KNOWLEDGE'],
      checklistData['PUMP_CABLE_INSTALLATION'], checklistData['PUMP_CABLE_PM_CONNECTION'], checklistData['POWER_SYSTEM_KNOWLEDGE'],
      checklistData['POWER_ON_ORDER'], checklistData['CB_TYPE_KNOWLEDGE'], checklistData['SYCON_NUMBER_KNOWLEDGE'],
      checklistData['MODULE_CB_TURN_ON'], checklistData['SAFETY_MODULE_KNOWLEDGE'], checklistData['EMO_CHECK'],
      checklistData['ALARM_TROUBLE_SHOOTING'], checklistData['UTILITY_ON_ORDER'], checklistData['VACUUM_ON_ADJUSTMENT'],
      checklistData['CDA_ON_ADJUSTMENT'], checklistData['PCW_ON_ADJUSTMENT'], checklistData['GAS_ON_KNOWLEDGE'],
      checklistData['GAS_ON_CHECK'], checklistData['GAS_FLOW_CHECK'], checklistData['MANOMETER_ADJUSTMENT'],
      checklistData['EFEM_ROBOT_PENDANT'], checklistData['EFEM_ROBOT_LEVELING'], checklistData['EFEM_ARM_LEVELING'],
      checklistData['EFEM_DATA_SAVE'], checklistData['TM_ROBOT_PENDANT'], checklistData['TM_PICK_ADJUST'],
      checklistData['TM_BM_TEACHING'], checklistData['TM_PM_TEACHING'], checklistData['TM_DATA_SAVE'],
      checklistData['WAFER_JIG_USE'], checklistData['LASER_JIG_USE'], checklistData['FINE_TEACHING'],
      checklistData['MARGIN_CHECK'], checklistData['SEMI_AUTO_TRANSFER'], checklistData['AGING_TEST'],
      checklistData['GAUGE_INSTALLATION'], checklistData['EPD_INSTALLATION'], checklistData['PIO_INSTALLATION'],
      checklistData['SIGNAL_TOWER_INSTALLATION'], checklistData['CTC_INSTALLATION'], checklistData['PORTABLE_RACK_INSTALLATION'],
      checklistData['SAFETY_COVER_INSTALLATION'], checklistData['PROCESS_KIT_INSTALLATION'], checklistData['PUMP_ON'],
      checklistData['PM_LEAK_CHECK'], checklistData['GAS_LEAK_CHECK'], checklistData['HELIUM_DETECTOR_USE'],
      checklistData['ECID_MATCHING'], checklistData['COOLING_STAGE_ADJUSTMENT'], checklistData['PUMPING_VENTING_ADJUSTMENT'],
      checklistData['EPD_ADJUSTMENT'], checklistData['TEMP_AUTOTUNE'], checklistData['DOOR_VALVE_ADJUSTMENT'],
      checklistData['APC_AUTOLEARN'], checklistData['PIN_SPEED_ADJUSTMENT'], checklistData['GAS_PRESSURE_CHECK'],
      checklistData['MFC_HUNTING_CHECK'], checklistData['FCIP_CAL'], checklistData['TTTM_SHEET'],
      checklistData['OHT_LAYOUT_CERTIFICATION'], checklistData['OHT_CERTIFICATION'], checklistData['MID_CERTIFICATION_TOOL_KNOWLEDGE'],
      checklistData['EFEM_MID_CERTIFICATION'], checklistData['TM_MID_CERTIFICATION'], checklistData['PM_MID_CERTIFICATION'],
      checklistData['SUB_UNIT_MID_CERTIFICATION'], checklistData['RACK_MID_CERTIFICATION'], checklistData['MID_CERTIFICATION_RESPONSE'],
      checklistData['ENV_QUAL_RESPONSE'], checklistData['AGING_TEST_KNOWLEDGE'], checklistData['EES_REPORT_PROCEDURE']
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
      UPDATE SUPRA_N_SETUP_SELF SET
        DRAWING_TEMPLATE_ALIGNMENT = ?, DRAWING_TEMPLATE_MARKING = ?, LINE_ALIGNMENT_CHECK = ?, UTILITY_SPEC_KNOWLEDGE = ?,
        FAB_IN_CAUTION = ?, FAB_IN_ORDER = ?, GAP_CHECK = ?, PACKING_LIST_CHECK = ?, TOOL_SIZE_KNOWLEDGE = ?, LASER_JIG_ALIGNMENT = ?,
        LIFT_USE = ?, MODULE_HEIGHT_KNOWLEDGE = ?, MODULE_DOCKING = ?, DOCKING_REALIGNMENT = ?, LEVELER_POSITION_KNOWLEDGE = ?,
        LEVELING_SPEC_KNOWLEDGE = ?, INTERNAL_HOOK_UP = ?, TRAY_CHECK = ?, CABLE_CLASSIFICATION = ?, GRATING_OPEN_CAUTION = ?,
        LADDER_SAFETY = ?, CABLE_INSTALLATION = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ORGANIZATION = ?, CABLE_CUTTING = ?,
        CABLE_RACK_CONNECTION = ?, PUMP_CABLE_TYPE_KNOWLEDGE = ?, PUMP_CABLE_INSTALLATION = ?, PUMP_CABLE_PM_CONNECTION = ?,
        POWER_SYSTEM_KNOWLEDGE = ?, POWER_ON_ORDER = ?, CB_TYPE_KNOWLEDGE = ?, SYCON_NUMBER_KNOWLEDGE = ?, MODULE_CB_TURN_ON = ?,
        SAFETY_MODULE_KNOWLEDGE = ?, EMO_CHECK = ?, ALARM_TROUBLE_SHOOTING = ?, UTILITY_ON_ORDER = ?, VACUUM_ON_ADJUSTMENT = ?,
        CDA_ON_ADJUSTMENT = ?, PCW_ON_ADJUSTMENT = ?, GAS_ON_KNOWLEDGE = ?, GAS_ON_CHECK = ?, GAS_FLOW_CHECK = ?,
        MANOMETER_ADJUSTMENT = ?, EFEM_ROBOT_PENDANT = ?, EFEM_ROBOT_LEVELING = ?, EFEM_ARM_LEVELING = ?, EFEM_DATA_SAVE = ?,
        TM_ROBOT_PENDANT = ?, TM_PICK_ADJUST = ?, TM_BM_TEACHING = ?, TM_PM_TEACHING = ?, TM_DATA_SAVE = ?, WAFER_JIG_USE = ?,
        LASER_JIG_USE = ?, FINE_TEACHING = ?, MARGIN_CHECK = ?, SEMI_AUTO_TRANSFER = ?, AGING_TEST = ?, GAUGE_INSTALLATION = ?,
        EPD_INSTALLATION = ?, PIO_INSTALLATION = ?, SIGNAL_TOWER_INSTALLATION = ?, CTC_INSTALLATION = ?, PORTABLE_RACK_INSTALLATION = ?,
        SAFETY_COVER_INSTALLATION = ?, PROCESS_KIT_INSTALLATION = ?, PUMP_ON = ?, PM_LEAK_CHECK = ?, GAS_LEAK_CHECK = ?,
        HELIUM_DETECTOR_USE = ?, ECID_MATCHING = ?, COOLING_STAGE_ADJUSTMENT = ?, PUMPING_VENTING_ADJUSTMENT = ?,
        EPD_ADJUSTMENT = ?, TEMP_AUTOTUNE = ?, DOOR_VALVE_ADJUSTMENT = ?, APC_AUTOLEARN = ?, PIN_SPEED_ADJUSTMENT = ?,
        GAS_PRESSURE_CHECK = ?, MFC_HUNTING_CHECK = ?, FCIP_CAL = ?, TTTM_SHEET = ?, OHT_LAYOUT_CERTIFICATION = ?,
        OHT_CERTIFICATION = ?, MID_CERTIFICATION_TOOL_KNOWLEDGE = ?, EFEM_MID_CERTIFICATION = ?, TM_MID_CERTIFICATION = ?,
        PM_MID_CERTIFICATION = ?, SUB_UNIT_MID_CERTIFICATION = ?, RACK_MID_CERTIFICATION = ?, MID_CERTIFICATION_RESPONSE = ?,
        ENV_QUAL_RESPONSE = ?, AGING_TEST_KNOWLEDGE = ?, EES_REPORT_PROCEDURE = ?
      WHERE name = ?
    `;

    const values = [
      checklistData['DRAWING_TEMPLATE_ALIGNMENT'], checklistData['DRAWING_TEMPLATE_MARKING'], checklistData['LINE_ALIGNMENT_CHECK'],
      checklistData['UTILITY_SPEC_KNOWLEDGE'], checklistData['FAB_IN_CAUTION'], checklistData['FAB_IN_ORDER'], checklistData['GAP_CHECK'],
      checklistData['PACKING_LIST_CHECK'], checklistData['TOOL_SIZE_KNOWLEDGE'], checklistData['LASER_JIG_ALIGNMENT'], checklistData['LIFT_USE'],
      checklistData['MODULE_HEIGHT_KNOWLEDGE'], checklistData['MODULE_DOCKING'], checklistData['DOCKING_REALIGNMENT'], checklistData['LEVELER_POSITION_KNOWLEDGE'],
      checklistData['LEVELING_SPEC_KNOWLEDGE'], checklistData['INTERNAL_HOOK_UP'], checklistData['TRAY_CHECK'], checklistData['CABLE_CLASSIFICATION'],
      checklistData['GRATING_OPEN_CAUTION'], checklistData['LADDER_SAFETY'], checklistData['CABLE_INSTALLATION'], checklistData['CABLE_CONNECTION'],
      checklistData['CABLE_TRAY_ORGANIZATION'], checklistData['CABLE_CUTTING'], checklistData['CABLE_RACK_CONNECTION'], checklistData['PUMP_CABLE_TYPE_KNOWLEDGE'],
      checklistData['PUMP_CABLE_INSTALLATION'], checklistData['PUMP_CABLE_PM_CONNECTION'], checklistData['POWER_SYSTEM_KNOWLEDGE'], checklistData['POWER_ON_ORDER'],
      checklistData['CB_TYPE_KNOWLEDGE'], checklistData['SYCON_NUMBER_KNOWLEDGE'], checklistData['MODULE_CB_TURN_ON'], checklistData['SAFETY_MODULE_KNOWLEDGE'],
      checklistData['EMO_CHECK'], checklistData['ALARM_TROUBLE_SHOOTING'], checklistData['UTILITY_ON_ORDER'], checklistData['VACUUM_ON_ADJUSTMENT'],
      checklistData['CDA_ON_ADJUSTMENT'], checklistData['PCW_ON_ADJUSTMENT'], checklistData['GAS_ON_KNOWLEDGE'], checklistData['GAS_ON_CHECK'],
      checklistData['GAS_FLOW_CHECK'], checklistData['MANOMETER_ADJUSTMENT'], checklistData['EFEM_ROBOT_PENDANT'], checklistData['EFEM_ROBOT_LEVELING'],
      checklistData['EFEM_ARM_LEVELING'], checklistData['EFEM_DATA_SAVE'], checklistData['TM_ROBOT_PENDANT'], checklistData['TM_PICK_ADJUST'],
      checklistData['TM_BM_TEACHING'], checklistData['TM_PM_TEACHING'], checklistData['TM_DATA_SAVE'], checklistData['WAFER_JIG_USE'], checklistData['LASER_JIG_USE'],
      checklistData['FINE_TEACHING'], checklistData['MARGIN_CHECK'], checklistData['SEMI_AUTO_TRANSFER'], checklistData['AGING_TEST'], checklistData['GAUGE_INSTALLATION'],
      checklistData['EPD_INSTALLATION'], checklistData['PIO_INSTALLATION'], checklistData['SIGNAL_TOWER_INSTALLATION'], checklistData['CTC_INSTALLATION'],
      checklistData['PORTABLE_RACK_INSTALLATION'], checklistData['SAFETY_COVER_INSTALLATION'], checklistData['PROCESS_KIT_INSTALLATION'], checklistData['PUMP_ON'],
      checklistData['PM_LEAK_CHECK'], checklistData['GAS_LEAK_CHECK'], checklistData['HELIUM_DETECTOR_USE'], checklistData['ECID_MATCHING'], checklistData['COOLING_STAGE_ADJUSTMENT'],
      checklistData['PUMPING_VENTING_ADJUSTMENT'], checklistData['EPD_ADJUSTMENT'], checklistData['TEMP_AUTOTUNE'], checklistData['DOOR_VALVE_ADJUSTMENT'],
      checklistData['APC_AUTOLEARN'], checklistData['PIN_SPEED_ADJUSTMENT'], checklistData['GAS_PRESSURE_CHECK'], checklistData['MFC_HUNTING_CHECK'],
      checklistData['FCIP_CAL'], checklistData['TTTM_SHEET'], checklistData['OHT_LAYOUT_CERTIFICATION'], checklistData['OHT_CERTIFICATION'],
      checklistData['MID_CERTIFICATION_TOOL_KNOWLEDGE'], checklistData['EFEM_MID_CERTIFICATION'], checklistData['TM_MID_CERTIFICATION'], checklistData['PM_MID_CERTIFICATION'],
      checklistData['SUB_UNIT_MID_CERTIFICATION'], checklistData['RACK_MID_CERTIFICATION'], checklistData['MID_CERTIFICATION_RESPONSE'], checklistData['ENV_QUAL_RESPONSE'],
      checklistData['AGING_TEST_KNOWLEDGE'], checklistData['EES_REPORT_PROCEDURE'], checklistData.name
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
    const query = `SELECT * FROM SUPRA_N_SETUP_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving checklist: ${err.message}`);
  }
};
