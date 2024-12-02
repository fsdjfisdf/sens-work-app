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
    const query = `SELECT * FROM SUPRA_SETUP WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    connection.release();
    return rows[0];
  } catch (err) {
    connection.release();
    throw new Error(`Error finding entry by name: ${err.message}`);
  }
};

exports.saveChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    // 1. 먼저 이름으로 기존 데이터가 있는지 확인
    const queryFind = `SELECT * FROM SUPRA_SETUP WHERE name = ?`;
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

exports.updateApprovalStatusByName = async (name, status, approver, approvalDate) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      const query = `
          UPDATE SUPRA_SETUP
          SET approvalStatus = ?, approver = ?, approvalDate = ?
          WHERE name = ?
      `;
      const values = [status, approver, approvalDate, name];
      const [result] = await connection.query(query, values);

      if (result.affectedRows === 0) {
          throw new Error('No rows updated. Name might not exist.');
      }

      console.log(`Updated approvalStatus for ${name} to ${status}. Approver: ${approver}, Date: ${approvalDate}`);
  } catch (err) {
      console.error('Error updating approval status:', err);
      throw new Error(`Error updating approval status: ${err.message}`);
  } finally {
      connection.release();
  }
};




exports.getPendingChecklists = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      const query = `SELECT name, approvalStatus, approvalDate, updated_at FROM SUPRA_SETUP WHERE approvalStatus = 'Pending'`;
      const [rows] = await connection.query(query);
      return rows; // name을 반환
  } catch (err) {
      console.error('Error retrieving pending checklists:', err);
      throw new Error(`Error retrieving pending checklists: ${err.message}`);
  } finally {
      connection.release();
  }
};



exports.insertChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
    INSERT INTO SUPRA_SETUP (
      name, DRAWING_TEMPLATE_SETUP, DRAWING_TEMPLATE_MARKING, CUSTOMER_OHT_LINE_CHECK, UTILITY_SPEC_UNDERSTANDING, 
      EQUIPMENT_IMPORT_CAUTION, EQUIPMENT_IMPORT_ORDER, EQUIPMENT_SPACING_CHECK, PACKING_LIST_CHECK,
      TOOL_SIZE_UNDERSTANDING, LASER_JIG_ALIGNMENT, LIFT_CASTER_REMOVAL, MODULE_HEIGHT_DOCKING, MODULE_DOCKING,
      DOCKING_REALIGNMENT, LEVELER_POSITION_UNDERSTANDING, MODULE_LEVELING, HOOK_UP, TRAY_CHECK, CABLE_SORTING, 
      GRATING_OPEN_CAUTION, LADDER_SAFETY_RULES, CABLE_INSTALLATION, CABLE_CONNECTION, CABLE_TRAY_ARRANGEMENT, 
      CABLE_CUTTING, PUMP_CABLE_TRAY, PUMP_CABLE_ARRANGEMENT, CABLE_PM_PUMP_CONNECTION, GPS_UPS_SPS_UNDERSTANDING, 
      POWER_TURN_ON_SEQUENCE, RACK_CB_UNDERSTANDING, SYCON_NUMBER_UNDERSTANDING, MODULE_CB_TURN_ON, 
      SAFETY_MODULE_UNDERSTANDING, EMO_CHECK, POWER_TURN_ON_ALARM_TROUBLESHOOTING, UTILITY_TURN_ON_SEQUENCE, 
      VACUUM_TURN_ON, CDA_TURN_ON, PCW_TURN_ON, GAS_TURN_ON, GAS_TURN_ON_CHECK, OX_NX_GAS_TURN_ON, 
      MANOMETER_LIMIT_ADJUST, EFEM_ROBOT_PENDANT_CONTROL, EFEM_ROBOT_LEVELING, EFEM_ROBOT_ARM_LEVELING, 
      EFEM_TEACHING_DATA_SAVE, TM_ROBOT_PENDANT_CONTROL, TM_ROBOT_PICK_ADJUST, TM_ROBOT_BM_TEACHING, 
      TM_ROBOT_PM_TEACHING, TM_TEACHING_DATA_SAVE, WAFER_JIG_USE, LASER_JIG_USE, FINE_TEACHING, MARGIN_CHECK, 
      SEMI_AUTO_TRANSFER, AGING_TEST, BARATRON_PIRANI_GAUGE_INSTALLATION, EPD_INSTALLATION, PIO_SENSOR_CABLE_INSTALLATION,
      RACK_SIGNAL_TOWER_INSTALLATION, CTC_INSTALLATION, PORTABLE_RACK_INSTALLATION, PM_SAFETY_COVER_INSTALLATION, 
      PROCESS_KIT_INSTALLATION, PUMP_TURN_ON, PM_LEAK_CHECK, GAS_LINE_LEAK_CHECK, HELIUM_DETECTOR_USE, 
      ECID_MATCHING, COOLING_STAGE_PIN_CONTROL, PUMP_VENT_TIME_ADJUST, EPD_PEAK_OFFSET_ADJUST, TEMP_AUTOTUNE, 
      DOOR_VALVE_CONTROL, APC_AUTOLEARN, PIN_SPEED_HEIGHT_ADJUST, GAS_SUPPLY_PRESSURE_CHECK, MFC_HUNTING_CHECK, 
      FCIP_CAL, TTTM_SHEET_COMPLETION, OHT_LAY_OUT_CERTIFICATION, OHT_CERTIFICATION, TOOL_PREP_CERTIFICATION, 
      EFEM_CERTIFICATION_PREP, TM_CERTIFICATION_PREP, PM_CERTIFICATION_PREP, SUB_UNIT_CERTIFICATION_PREP, 
      RACK_CERTIFICATION_PREP, CERTIFICATION_RESPONSE, ENVIRONMENTAL_QUAL_RESPONSE, AGING_TEST_PROCESS_CONFIRM, 
      EES_REPORT_PROCEDURE
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;  

    const values = [
      checklistData.name, checklistData.DRAWING_TEMPLATE_SETUP, checklistData.DRAWING_TEMPLATE_MARKING,
      checklistData.CUSTOMER_OHT_LINE_CHECK, checklistData.UTILITY_SPEC_UNDERSTANDING, checklistData.EQUIPMENT_IMPORT_CAUTION,
      checklistData.EQUIPMENT_IMPORT_ORDER, checklistData.EQUIPMENT_SPACING_CHECK, checklistData.PACKING_LIST_CHECK,
      checklistData.TOOL_SIZE_UNDERSTANDING, checklistData.LASER_JIG_ALIGNMENT, checklistData.LIFT_CASTER_REMOVAL,
      checklistData.MODULE_HEIGHT_DOCKING, checklistData.MODULE_DOCKING, checklistData.DOCKING_REALIGNMENT,
      checklistData.LEVELER_POSITION_UNDERSTANDING, checklistData.MODULE_LEVELING, checklistData.HOOK_UP,
      checklistData.TRAY_CHECK, checklistData.CABLE_SORTING, checklistData.GRATING_OPEN_CAUTION, 
      checklistData.LADDER_SAFETY_RULES, checklistData.CABLE_INSTALLATION, checklistData.CABLE_CONNECTION, 
      checklistData.CABLE_TRAY_ARRANGEMENT, checklistData.CABLE_CUTTING, checklistData.PUMP_CABLE_TRAY, 
      checklistData.PUMP_CABLE_ARRANGEMENT, checklistData.CABLE_PM_PUMP_CONNECTION, checklistData.GPS_UPS_SPS_UNDERSTANDING, 
      checklistData.POWER_TURN_ON_SEQUENCE, checklistData.RACK_CB_UNDERSTANDING, checklistData.SYCON_NUMBER_UNDERSTANDING, 
      checklistData.MODULE_CB_TURN_ON, checklistData.SAFETY_MODULE_UNDERSTANDING, checklistData.EMO_CHECK, 
      checklistData.POWER_TURN_ON_ALARM_TROUBLESHOOTING, checklistData.UTILITY_TURN_ON_SEQUENCE, checklistData.VACUUM_TURN_ON, 
      checklistData.CDA_TURN_ON, checklistData.PCW_TURN_ON, checklistData.GAS_TURN_ON, checklistData.GAS_TURN_ON_CHECK, 
      checklistData.OX_NX_GAS_TURN_ON, checklistData.MANOMETER_LIMIT_ADJUST, checklistData.EFEM_ROBOT_PENDANT_CONTROL, 
      checklistData.EFEM_ROBOT_LEVELING, checklistData.EFEM_ROBOT_ARM_LEVELING, checklistData.EFEM_TEACHING_DATA_SAVE, 
      checklistData.TM_ROBOT_PENDANT_CONTROL, checklistData.TM_ROBOT_PICK_ADJUST, checklistData.TM_ROBOT_BM_TEACHING, 
      checklistData.TM_ROBOT_PM_TEACHING, checklistData.TM_TEACHING_DATA_SAVE, checklistData.WAFER_JIG_USE, 
      checklistData.LASER_JIG_USE, checklistData.FINE_TEACHING, checklistData.MARGIN_CHECK, checklistData.SEMI_AUTO_TRANSFER, 
      checklistData.AGING_TEST, checklistData.BARATRON_PIRANI_GAUGE_INSTALLATION, checklistData.EPD_INSTALLATION, 
      checklistData.PIO_SENSOR_CABLE_INSTALLATION, checklistData.RACK_SIGNAL_TOWER_INSTALLATION, checklistData.CTC_INSTALLATION, 
      checklistData.PORTABLE_RACK_INSTALLATION, checklistData.PM_SAFETY_COVER_INSTALLATION, checklistData.PROCESS_KIT_INSTALLATION, 
      checklistData.PUMP_TURN_ON, checklistData.PM_LEAK_CHECK, checklistData.GAS_LINE_LEAK_CHECK, 
      checklistData.HELIUM_DETECTOR_USE, checklistData.ECID_MATCHING, checklistData.COOLING_STAGE_PIN_CONTROL, 
      checklistData.PUMP_VENT_TIME_ADJUST, checklistData.EPD_PEAK_OFFSET_ADJUST, checklistData.TEMP_AUTOTUNE, 
      checklistData.DOOR_VALVE_CONTROL, checklistData.APC_AUTOLEARN, checklistData.PIN_SPEED_HEIGHT_ADJUST, 
      checklistData.GAS_SUPPLY_PRESSURE_CHECK, checklistData.MFC_HUNTING_CHECK, checklistData.FCIP_CAL, 
      checklistData.TTTM_SHEET_COMPLETION, checklistData.OHT_LAY_OUT_CERTIFICATION, checklistData.OHT_CERTIFICATION, 
      checklistData.TOOL_PREP_CERTIFICATION, checklistData.EFEM_CERTIFICATION_PREP, checklistData.TM_CERTIFICATION_PREP, 
      checklistData.PM_CERTIFICATION_PREP, checklistData.SUB_UNIT_CERTIFICATION_PREP, checklistData.RACK_CERTIFICATION_PREP, 
      checklistData.CERTIFICATION_RESPONSE, checklistData.ENVIRONMENTAL_QUAL_RESPONSE, checklistData.AGING_TEST_PROCESS_CONFIRM, 
      checklistData.EES_REPORT_PROCEDURE
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
      UPDATE SUPRA_SETUP SET
        DRAWING_TEMPLATE_SETUP = ?, DRAWING_TEMPLATE_MARKING = ?, CUSTOMER_OHT_LINE_CHECK = ?, UTILITY_SPEC_UNDERSTANDING = ?, 
        EQUIPMENT_IMPORT_CAUTION = ?, EQUIPMENT_IMPORT_ORDER = ?, EQUIPMENT_SPACING_CHECK = ?, PACKING_LIST_CHECK = ?,
        TOOL_SIZE_UNDERSTANDING = ?, LASER_JIG_ALIGNMENT = ?, LIFT_CASTER_REMOVAL = ?, MODULE_HEIGHT_DOCKING = ?, 
        MODULE_DOCKING = ?, DOCKING_REALIGNMENT = ?, LEVELER_POSITION_UNDERSTANDING = ?, MODULE_LEVELING = ?, 
        HOOK_UP = ?, TRAY_CHECK = ?, CABLE_SORTING = ?, GRATING_OPEN_CAUTION = ?, LADDER_SAFETY_RULES = ?, 
        CABLE_INSTALLATION = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ARRANGEMENT = ?, CABLE_CUTTING = ?, PUMP_CABLE_TRAY = ?, 
        PUMP_CABLE_ARRANGEMENT = ?, CABLE_PM_PUMP_CONNECTION = ?, GPS_UPS_SPS_UNDERSTANDING = ?, POWER_TURN_ON_SEQUENCE = ?, 
        RACK_CB_UNDERSTANDING = ?, SYCON_NUMBER_UNDERSTANDING = ?, MODULE_CB_TURN_ON = ?, SAFETY_MODULE_UNDERSTANDING = ?, 
        EMO_CHECK = ?, POWER_TURN_ON_ALARM_TROUBLESHOOTING = ?, UTILITY_TURN_ON_SEQUENCE = ?, VACUUM_TURN_ON = ?, 
        CDA_TURN_ON = ?, PCW_TURN_ON = ?, GAS_TURN_ON = ?, GAS_TURN_ON_CHECK = ?, OX_NX_GAS_TURN_ON = ?, 
        MANOMETER_LIMIT_ADJUST = ?, EFEM_ROBOT_PENDANT_CONTROL = ?, EFEM_ROBOT_LEVELING = ?, EFEM_ROBOT_ARM_LEVELING = ?, 
        EFEM_TEACHING_DATA_SAVE = ?, TM_ROBOT_PENDANT_CONTROL = ?, TM_ROBOT_PICK_ADJUST = ?, TM_ROBOT_BM_TEACHING = ?, 
        TM_ROBOT_PM_TEACHING = ?, TM_TEACHING_DATA_SAVE = ?, WAFER_JIG_USE = ?, LASER_JIG_USE = ?, FINE_TEACHING = ?, 
        MARGIN_CHECK = ?, SEMI_AUTO_TRANSFER = ?, AGING_TEST = ?, BARATRON_PIRANI_GAUGE_INSTALLATION = ?, 
        EPD_INSTALLATION = ?, PIO_SENSOR_CABLE_INSTALLATION = ?, RACK_SIGNAL_TOWER_INSTALLATION = ?, CTC_INSTALLATION = ?, 
        PORTABLE_RACK_INSTALLATION = ?, PM_SAFETY_COVER_INSTALLATION = ?, PROCESS_KIT_INSTALLATION = ?, PUMP_TURN_ON = ?, 
        PM_LEAK_CHECK = ?, GAS_LINE_LEAK_CHECK = ?, HELIUM_DETECTOR_USE = ?, ECID_MATCHING = ?, COOLING_STAGE_PIN_CONTROL = ?, 
        PUMP_VENT_TIME_ADJUST = ?, EPD_PEAK_OFFSET_ADJUST = ?, TEMP_AUTOTUNE = ?, DOOR_VALVE_CONTROL = ?, 
        APC_AUTOLEARN = ?, PIN_SPEED_HEIGHT_ADJUST = ?, GAS_SUPPLY_PRESSURE_CHECK = ?, MFC_HUNTING_CHECK = ?, FCIP_CAL = ?, 
        TTTM_SHEET_COMPLETION = ?, OHT_LAY_OUT_CERTIFICATION = ?, OHT_CERTIFICATION = ?, TOOL_PREP_CERTIFICATION = ?, 
        EFEM_CERTIFICATION_PREP = ?, TM_CERTIFICATION_PREP = ?, PM_CERTIFICATION_PREP = ?, SUB_UNIT_CERTIFICATION_PREP = ?, 
        RACK_CERTIFICATION_PREP = ?, CERTIFICATION_RESPONSE = ?, ENVIRONMENTAL_QUAL_RESPONSE = ?, AGING_TEST_PROCESS_CONFIRM = ?, 
        EES_REPORT_PROCEDURE = ?
      WHERE name = ?
    `;
    const values = [
      checklistData.DRAWING_TEMPLATE_SETUP, checklistData.DRAWING_TEMPLATE_MARKING, checklistData.CUSTOMER_OHT_LINE_CHECK, 
      checklistData.UTILITY_SPEC_UNDERSTANDING, checklistData.EQUIPMENT_IMPORT_CAUTION, checklistData.EQUIPMENT_IMPORT_ORDER, 
      checklistData.EQUIPMENT_SPACING_CHECK, checklistData.PACKING_LIST_CHECK, checklistData.TOOL_SIZE_UNDERSTANDING, 
      checklistData.LASER_JIG_ALIGNMENT, checklistData.LIFT_CASTER_REMOVAL, checklistData.MODULE_HEIGHT_DOCKING, 
      checklistData.MODULE_DOCKING, checklistData.DOCKING_REALIGNMENT, checklistData.LEVELER_POSITION_UNDERSTANDING, 
      checklistData.MODULE_LEVELING, checklistData.HOOK_UP, checklistData.TRAY_CHECK, checklistData.CABLE_SORTING, 
      checklistData.GRATING_OPEN_CAUTION, checklistData.LADDER_SAFETY_RULES, checklistData.CABLE_INSTALLATION, 
      checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGEMENT, checklistData.CABLE_CUTTING, 
      checklistData.PUMP_CABLE_TRAY, checklistData.PUMP_CABLE_ARRANGEMENT, checklistData.CABLE_PM_PUMP_CONNECTION, 
      checklistData.GPS_UPS_SPS_UNDERSTANDING, checklistData.POWER_TURN_ON_SEQUENCE, checklistData.RACK_CB_UNDERSTANDING, 
      checklistData.SYCON_NUMBER_UNDERSTANDING, checklistData.MODULE_CB_TURN_ON, checklistData.SAFETY_MODULE_UNDERSTANDING, 
      checklistData.EMO_CHECK, checklistData.POWER_TURN_ON_ALARM_TROUBLESHOOTING, checklistData.UTILITY_TURN_ON_SEQUENCE, 
      checklistData.VACUUM_TURN_ON, checklistData.CDA_TURN_ON, checklistData.PCW_TURN_ON, checklistData.GAS_TURN_ON, 
      checklistData.GAS_TURN_ON_CHECK, checklistData.OX_NX_GAS_TURN_ON, checklistData.MANOMETER_LIMIT_ADJUST, 
      checklistData.EFEM_ROBOT_PENDANT_CONTROL, checklistData.EFEM_ROBOT_LEVELING, checklistData.EFEM_ROBOT_ARM_LEVELING, 
      checklistData.EFEM_TEACHING_DATA_SAVE, checklistData.TM_ROBOT_PENDANT_CONTROL, checklistData.TM_ROBOT_PICK_ADJUST, 
      checklistData.TM_ROBOT_BM_TEACHING, checklistData.TM_ROBOT_PM_TEACHING, checklistData.TM_TEACHING_DATA_SAVE, 
      checklistData.WAFER_JIG_USE, checklistData.LASER_JIG_USE, checklistData.FINE_TEACHING, checklistData.MARGIN_CHECK, 
      checklistData.SEMI_AUTO_TRANSFER, checklistData.AGING_TEST, checklistData.BARATRON_PIRANI_GAUGE_INSTALLATION, 
      checklistData.EPD_INSTALLATION, checklistData.PIO_SENSOR_CABLE_INSTALLATION, checklistData.RACK_SIGNAL_TOWER_INSTALLATION, 
      checklistData.CTC_INSTALLATION, checklistData.PORTABLE_RACK_INSTALLATION, checklistData.PM_SAFETY_COVER_INSTALLATION, 
      checklistData.PROCESS_KIT_INSTALLATION, checklistData.PUMP_TURN_ON, checklistData.PM_LEAK_CHECK, 
      checklistData.GAS_LINE_LEAK_CHECK, checklistData.HELIUM_DETECTOR_USE, checklistData.ECID_MATCHING, 
      checklistData.COOLING_STAGE_PIN_CONTROL, checklistData.PUMP_VENT_TIME_ADJUST, checklistData.EPD_PEAK_OFFSET_ADJUST, 
      checklistData.TEMP_AUTOTUNE, checklistData.DOOR_VALVE_CONTROL, checklistData.APC_AUTOLEARN, 
      checklistData.PIN_SPEED_HEIGHT_ADJUST, checklistData.GAS_SUPPLY_PRESSURE_CHECK, checklistData.MFC_HUNTING_CHECK, 
      checklistData.FCIP_CAL, checklistData.TTTM_SHEET_COMPLETION, checklistData.OHT_LAY_OUT_CERTIFICATION, 
      checklistData.OHT_CERTIFICATION, checklistData.TOOL_PREP_CERTIFICATION, checklistData.EFEM_CERTIFICATION_PREP, 
      checklistData.TM_CERTIFICATION_PREP, checklistData.PM_CERTIFICATION_PREP, checklistData.SUB_UNIT_CERTIFICATION_PREP, 
      checklistData.RACK_CERTIFICATION_PREP, checklistData.CERTIFICATION_RESPONSE, checklistData.ENVIRONMENTAL_QUAL_RESPONSE, 
      checklistData.AGING_TEST_PROCESS_CONFIRM, checklistData.EES_REPORT_PROCEDURE, checklistData.name
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
    const query = `SELECT * FROM SUPRA_SETUP WHERE name = ?`;
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
      const query = `SELECT * FROM SUPRA_N_SETUP`;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllSupraSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // SUPRA_SETUP 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM SUPRA_SETUP`;
      const [rows] = await connection.query(query);  // SUPRA_SETUP 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from SUPRA_SETUP: ${err.message}`);
  }
};
