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
        name, DRAWING_TEMPLATE, DRAWING_TEMPLATE_MARKING, OHT_LINE_CONFIRM, UTILITY_SPEC,
        FAB_IN_NOTICE, FAB_IN_ORDER, CLEARANCE_CHECK, PACKING_LIST_CHECK, TOOL_SIZE, LASER_JIG_ALIGN,
        EFEM_CASTER_REMOVE, MODULE_DOCKING, MODULE_DOCKING_CONFIRM, DOCKING_REALIGN, LEVELER_POSITION,
        LEVELING_SPEC, HOOK_UP, TRAY_CHECK, CABLE_MODULE_SORT, GRATING_OPEN_NOTICE, LADDER_SAFETY, CABLE_ROUTE,
        CABLE_CONNECTION, CABLE_TRAY_SORT, CABLE_CUT, CABLE_RACK_CONNECTION, PUMP_CABLE_SORT, PUMP_CABLE_ROUTE,
        CABLE_PM_CONNECTION, POWER_SYSTEM_ROLE, POWER_TURN_ON_ORDER, CB_FUNCTION, SYCON_PART, MODULE_CB_POSITION,
        SAFETY_MODULE_FUNCTION, EMO_CHECK, ALARM_TROUBLESHOOTING, UTILITY_TURN_ON_ORDER, VACUUM_ADJUST, CDA_ADJUST,
        PCW_ADJUST, GAS_TURN_ON, GAS_TURN_ON_CHECK, GAS_FLOW_CHECK, MANOMETER_ADJUST, EFEM_PENDANT_OPERATION, EFEM_LEVELING,
        EFEM_ARM_LEVELING, EFEM_TEACHING_DATA, TM_PENDANT_OPERATION, TM_PICK_ADJUST, TM_BM_TEACHING, TM_PM_TEACHING,
        TM_TEACHING_DATA, TEACHING_WAFER_JIG, LASER_TEACHING_JIG, FINE_TEACHING, MARGIN_CHECK, SEMI_AUTO_TRANSFER, AGING_TEST,
        GAUGE_INSTALL, EPD_INSTALL, PIO_INSTALL, SIGNAL_TOWER_INSTALL, CTC_INSTALL, PORTABLE_RACK_INSTALL, SAFETY_COVER_INSTALL,
        PROCESS_KIT_INSTALL, PUMP_TURN_ON, PM_LEAK_CHECK, GAS_LEAK_CHECK, HELIUM_DETECTOR_USE, ECID_MATCHING, COOLING_STAGE_ADJUST,
        PUMING_VENTING_ADJUST, EPD_ADJUST, TEMP_AUTOTUNE, DOOR_VALVE_ADJUST, APC_AUTOLEARN, PIN_ADJUST, GAS_SUPPLY_CHECK,
        MFC_HUNTING_CHECK, FCIP_CAL, TTTM_SHEET, OHT_LAYOUT_CERT, OHT_CERT, MID_CERT_TOOL, EFEM_MID_CERT, TM_MID_CERT,
        PM_MID_CERT, SUB_UNIT_MID_CERT, RACK_MID_CERT, MID_CERT, ENV_QUAL, AGING_TEST_QUAL, EES_REPORT
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      checklistData.name, checklistData['DRAWING_TEMPLATE'], checklistData['DRAWING_TEMPLATE_MARKING'],
      checklistData['OHT_LINE_CONFIRM'], checklistData['UTILITY_SPEC'], checklistData['FAB_IN_NOTICE'],
      checklistData['FAB_IN_ORDER'], checklistData['CLEARANCE_CHECK'], checklistData['PACKING_LIST_CHECK'],
      checklistData['TOOL_SIZE'], checklistData['LASER_JIG_ALIGN'], checklistData['EFEM_CASTER_REMOVE'],
      checklistData['MODULE_DOCKING'], checklistData['MODULE_DOCKING_CONFIRM'], checklistData['DOCKING_REALIGN'],
      checklistData['LEVELER_POSITION'], checklistData['LEVELING_SPEC'], checklistData['HOOK_UP'],
      checklistData['TRAY_CHECK'], checklistData['CABLE_MODULE_SORT'], checklistData['GRATING_OPEN_NOTICE'],
      checklistData['LADDER_SAFETY'], checklistData['CABLE_ROUTE'], checklistData['CABLE_CONNECTION'],
      checklistData['CABLE_TRAY_SORT'], checklistData['CABLE_CUT'], checklistData['CABLE_RACK_CONNECTION'],
      checklistData['PUMP_CABLE_SORT'], checklistData['PUMP_CABLE_ROUTE'], checklistData['CABLE_PM_CONNECTION'],
      checklistData['POWER_SYSTEM_ROLE'], checklistData['POWER_TURN_ON_ORDER'], checklistData['CB_FUNCTION'],
      checklistData['SYCON_PART'], checklistData['MODULE_CB_POSITION'], checklistData['SAFETY_MODULE_FUNCTION'],
      checklistData['EMO_CHECK'], checklistData['ALARM_TROUBLESHOOTING'], checklistData['UTILITY_TURN_ON_ORDER'],
      checklistData['VACUUM_ADJUST'], checklistData['CDA_ADJUST'], checklistData['PCW_ADJUST'], checklistData['GAS_TURN_ON'],
      checklistData['GAS_TURN_ON_CHECK'], checklistData['GAS_FLOW_CHECK'], checklistData['MANOMETER_ADJUST'],
      checklistData['EFEM_PENDANT_OPERATION'], checklistData['EFEM_LEVELING'], checklistData['EFEM_ARM_LEVELING'],
      checklistData['EFEM_TEACHING_DATA'], checklistData['TM_PENDANT_OPERATION'], checklistData['TM_PICK_ADJUST'],
      checklistData['TM_BM_TEACHING'], checklistData['TM_PM_TEACHING'], checklistData['TM_TEACHING_DATA'],
      checklistData['TEACHING_WAFER_JIG'], checklistData['LASER_TEACHING_JIG'], checklistData['FINE_TEACHING'],
      checklistData['MARGIN_CHECK'], checklistData['SEMI_AUTO_TRANSFER'], checklistData['AGING_TEST'],
      checklistData['GAUGE_INSTALL'], checklistData['EPD_INSTALL'], checklistData['PIO_INSTALL'],
      checklistData['SIGNAL_TOWER_INSTALL'], checklistData['CTC_INSTALL'], checklistData['PORTABLE_RACK_INSTALL'],
      checklistData['SAFETY_COVER_INSTALL'], checklistData['PROCESS_KIT_INSTALL'], checklistData['PUMP_TURN_ON'],
      checklistData['PM_LEAK_CHECK'], checklistData['GAS_LEAK_CHECK'], checklistData['HELIUM_DETECTOR_USE'],
      checklistData['ECID_MATCHING'], checklistData['COOLING_STAGE_ADJUST'], checklistData['PUMING_VENTING_ADJUST'],
      checklistData['EPD_ADJUST'], checklistData['TEMP_AUTOTUNE'], checklistData['DOOR_VALVE_ADJUST'],
      checklistData['APC_AUTOLEARN'], checklistData['PIN_ADJUST'], checklistData['GAS_SUPPLY_CHECK'],
      checklistData['MFC_HUNTING_CHECK'], checklistData['FCIP_CAL'], checklistData['TTTM_SHEET'],
      checklistData['OHT_LAYOUT_CERT'], checklistData['OHT_CERT'], checklistData['MID_CERT_TOOL'],
      checklistData['EFEM_MID_CERT'], checklistData['TM_MID_CERT'], checklistData['PM_MID_CERT'],
      checklistData['SUB_UNIT_MID_CERT'], checklistData['RACK_MID_CERT'], checklistData['MID_CERT'],
      checklistData['ENV_QUAL'], checklistData['AGING_TEST_QUAL'], checklistData['EES_REPORT']
    ];

    await connection.query(query, values);
    connection.release(); // 연결 해제 위치 수정
  } catch (err) {
    connection.release(); // 연결 해제 위치 수정
    console.error('Error inserting checklist:', err);
    throw new Error(`Error inserting checklist: ${err.message}`);
  }
};

exports.updateChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE SUPRA_N_SETUP_SELF SET
        DRAWING_TEMPLATE = ?, DRAWING_TEMPLATE_MARKING = ?, OHT_LINE_CONFIRM = ?, UTILITY_SPEC = ?,
        FAB_IN_NOTICE = ?, FAB_IN_ORDER = ?, CLEARANCE_CHECK = ?, PACKING_LIST_CHECK = ?, TOOL_SIZE = ?,
        LASER_JIG_ALIGN = ?, EFEM_CASTER_REMOVE = ?, MODULE_DOCKING = ?, MODULE_DOCKING_CONFIRM = ?,
        DOCKING_REALIGN = ?, LEVELER_POSITION = ?, LEVELING_SPEC = ?, HOOK_UP = ?, TRAY_CHECK = ?,
        CABLE_MODULE_SORT = ?, GRATING_OPEN_NOTICE = ?, LADDER_SAFETY = ?, CABLE_ROUTE = ?, CABLE_CONNECTION = ?,
        CABLE_TRAY_SORT = ?, CABLE_CUT = ?, CABLE_RACK_CONNECTION = ?, PUMP_CABLE_SORT = ?, PUMP_CABLE_ROUTE = ?,
        CABLE_PM_CONNECTION = ?, POWER_SYSTEM_ROLE = ?, POWER_TURN_ON_ORDER = ?, CB_FUNCTION = ?, SYCON_PART = ?,
        MODULE_CB_POSITION = ?, SAFETY_MODULE_FUNCTION = ?, EMO_CHECK = ?, ALARM_TROUBLESHOOTING = ?, UTILITY_TURN_ON_ORDER = ?,
        VACUUM_ADJUST = ?, CDA_ADJUST = ?, PCW_ADJUST = ?, GAS_TURN_ON = ?, GAS_TURN_ON_CHECK = ?, GAS_FLOW_CHECK = ?,
        MANOMETER_ADJUST = ?, EFEM_PENDANT_OPERATION = ?, EFEM_LEVELING = ?, EFEM_ARM_LEVELING = ?, EFEM_TEACHING_DATA = ?,
        TM_PENDANT_OPERATION = ?, TM_PICK_ADJUST = ?, TM_BM_TEACHING = ?, TM_PM_TEACHING = ?, TM_TEACHING_DATA = ?,
        TEACHING_WAFER_JIG = ?, LASER_TEACHING_JIG = ?, FINE_TEACHING = ?, MARGIN_CHECK = ?, SEMI_AUTO_TRANSFER = ?, AGING_TEST = ?,
        GAUGE_INSTALL = ?, EPD_INSTALL = ?, PIO_INSTALL = ?, SIGNAL_TOWER_INSTALL = ?, CTC_INSTALL = ?, PORTABLE_RACK_INSTALL = ?,
        SAFETY_COVER_INSTALL = ?, PROCESS_KIT_INSTALL = ?, PUMP_TURN_ON = ?, PM_LEAK_CHECK = ?, GAS_LEAK_CHECK = ?, HELIUM_DETECTOR_USE = ?,
        ECID_MATCHING = ?, COOLING_STAGE_ADJUST = ?, PUMING_VENTING_ADJUST = ?, EPD_ADJUST = ?, TEMP_AUTOTUNE = ?, DOOR_VALVE_ADJUST = ?,
        APC_AUTOLEARN = ?, PIN_ADJUST = ?, GAS_SUPPLY_CHECK = ?, MFC_HUNTING_CHECK = ?, FCIP_CAL = ?, TTTM_SHEET = ?,
        OHT_LAYOUT_CERT = ?, OHT_CERT = ?, MID_CERT_TOOL = ?, EFEM_MID_CERT = ?, TM_MID_CERT = ?, PM_MID_CERT = ?,
        SUB_UNIT_MID_CERT = ?, RACK_MID_CERT = ?, MID_CERT = ?, ENV_QUAL = ?, AGING_TEST_QUAL = ?, EES_REPORT = ?
      WHERE name = ?
    `;

    const values = [
      checklistData['DRAWING_TEMPLATE'], checklistData['DRAWING_TEMPLATE_MARKING'], checklistData['OHT_LINE_CONFIRM'],
      checklistData['UTILITY_SPEC'], checklistData['FAB_IN_NOTICE'], checklistData['FAB_IN_ORDER'],
      checklistData['CLEARANCE_CHECK'], checklistData['PACKING_LIST_CHECK'], checklistData['TOOL_SIZE'],
      checklistData['LASER_JIG_ALIGN'], checklistData['EFEM_CASTER_REMOVE'], checklistData['MODULE_DOCKING'],
      checklistData['MODULE_DOCKING_CONFIRM'], checklistData['DOCKING_REALIGN'], checklistData['LEVELER_POSITION'],
      checklistData['LEVELING_SPEC'], checklistData['HOOK_UP'], checklistData['TRAY_CHECK'],
      checklistData['CABLE_MODULE_SORT'], checklistData['GRATING_OPEN_NOTICE'], checklistData['LADDER_SAFETY'],
      checklistData['CABLE_ROUTE'], checklistData['CABLE_CONNECTION'], checklistData['CABLE_TRAY_SORT'],
      checklistData['CABLE_CUT'], checklistData['CABLE_RACK_CONNECTION'], checklistData['PUMP_CABLE_SORT'],
      checklistData['PUMP_CABLE_ROUTE'], checklistData['CABLE_PM_CONNECTION'], checklistData['POWER_SYSTEM_ROLE'],
      checklistData['POWER_TURN_ON_ORDER'], checklistData['CB_FUNCTION'], checklistData['SYCON_PART'],
      checklistData['MODULE_CB_POSITION'], checklistData['SAFETY_MODULE_FUNCTION'], checklistData['EMO_CHECK'],
      checklistData['ALARM_TROUBLESHOOTING'], checklistData['UTILITY_TURN_ON_ORDER'], checklistData['VACUUM_ADJUST'],
      checklistData['CDA_ADJUST'], checklistData['PCW_ADJUST'], checklistData['GAS_TURN_ON'], checklistData['GAS_TURN_ON_CHECK'],
      checklistData['GAS_FLOW_CHECK'], checklistData['MANOMETER_ADJUST'], checklistData['EFEM_PENDANT_OPERATION'],
      checklistData['EFEM_LEVELING'], checklistData['EFEM_ARM_LEVELING'], checklistData['EFEM_TEACHING_DATA'],
      checklistData['TM_PENDANT_OPERATION'], checklistData['TM_PICK_ADJUST'], checklistData['TM_BM_TEACHING'],
      checklistData['TM_PM_TEACHING'], checklistData['TM_TEACHING_DATA'], checklistData['TEACHING_WAFER_JIG'],
      checklistData['LASER_TEACHING_JIG'], checklistData['FINE_TEACHING'], checklistData['MARGIN_CHECK'],
      checklistData['SEMI_AUTO_TRANSFER'], checklistData['AGING_TEST'], checklistData['GAUGE_INSTALL'],
      checklistData['EPD_INSTALL'], checklistData['PIO_INSTALL'], checklistData['SIGNAL_TOWER_INSTALL'],
      checklistData['CTC_INSTALL'], checklistData['PORTABLE_RACK_INSTALL'], checklistData['SAFETY_COVER_INSTALL'],
      checklistData['PROCESS_KIT_INSTALL'], checklistData['PUMP_TURN_ON'], checklistData['PM_LEAK_CHECK'],
      checklistData['GAS_LEAK_CHECK'], checklistData['HELIUM_DETECTOR_USE'], checklistData['ECID_MATCHING'],
      checklistData['COOLING_STAGE_ADJUST'], checklistData['PUMING_VENTING_ADJUST'], checklistData['EPD_ADJUST'],
      checklistData['TEMP_AUTOTUNE'], checklistData['DOOR_VALVE_ADJUST'], checklistData['APC_AUTOLEARN'],
      checklistData['PIN_ADJUST'], checklistData['GAS_SUPPLY_CHECK'], checklistData['MFC_HUNTING_CHECK'],
      checklistData['FCIP_CAL'], checklistData['TTTM_SHEET'], checklistData['OHT_LAYOUT_CERT'],
      checklistData['OHT_CERT'], checklistData['MID_CERT_TOOL'], checklistData['EFEM_MID_CERT'],
      checklistData['TM_MID_CERT'], checklistData['PM_MID_CERT'], checklistData['SUB_UNIT_MID_CERT'],
      checklistData['RACK_MID_CERT'], checklistData['MID_CERT'], checklistData['ENV_QUAL'],
      checklistData['AGING_TEST_QUAL'], checklistData['EES_REPORT'], checklistData.name
    ];

    await connection.query(query, values);
    connection.release(); // 연결 해제 위치 수정
  } catch (err) {
    connection.release(); // 연결 해제 위치 수정
    console.error('Error updating checklist:', err);
    throw new Error(`Error updating checklist: ${err.message}`);
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
