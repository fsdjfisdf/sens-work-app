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
    const query = `SELECT * FROM INTEGER_SETUP WHERE name = ?`;
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
    const queryFind = `SELECT * FROM INTEGER_SETUP WHERE name = ?`;
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
      INSERT INTO INTEGER_SETUP (
        name, CUSTOMER_OHT_LINE_CHECK, EQUIPMENT_CLEARANCE_CHECK, DRAWING_TEMPLATE_SETUP, DRAWING_TEMPLATE_MARKING, 
        UTILITY_SPEC_UNDERSTANDING, EQUIPMENT_IMPORT_ORDER, IMPORT_COMPANY_CAUTION, IMPORT_INSPECTION_POINTS, 
        PROHIBITED_ITEMS_IMPORT, GRATING_OPENING_CHECK, PACKING_LIST_VERIFICATION, TOOL_SIZE_UNDERSTANDING, 
        LASER_JIG_ALIGNMENT, LIFT_CASTER_REMOVAL, MODULE_HEIGHT_DOCKING, MODULE_DOCKING, DOCKING_REALIGNMENT, 
        LEVELER_POSITION_UNDERSTANDING, MODULE_LEVELING, DOCKING_PIN_POSITION, HOOK_UP, TRAY_CHECK, CABLE_SORTING, 
        GRATING_OPEN_CAUTION, LADDER_SAFETY_RULES, CABLE_INSTALLATION, CABLE_CONNECTION, CABLE_TRAY_ARRANGEMENT, 
        CABLE_CUTTING, CABLE_RACK_CONNECTION, PUMP_CABLE_TRAY, PUMP_CABLE_ARRANGEMENT, CABLE_PM_PUMP_CONNECTION, 
        GPS_UPS_SPS_UNDERSTANDING, POWER_TURN_ON_SEQUENCE, RACK_ELCB_MCB_UNDERSTANDING, SAFETY_MODULE_UNDERSTANDING, 
        EMO_CHECK, MODULE_MCB_TURN_ON, SYCON_NUMBER_UNDERSTANDING, SYCON_TROUBLESHOOTING, 
        POWER_TURN_ON_ALARM_TROUBLESHOOTING, CHECKLIST_COMPLETION, IP_ADDRESS_CHANGE, UTILITY_TURN_ON_SEQUENCE, 
        VACUUM_TURN_ON, CDA_TURN_ON, PCW_TURN_ON, SOLANOID_VALVE_LOCATION, RELIEF_VALVE_LOCATION, 
        MANUAL_VALVE_LOCATION, PUMP_TURN_ON, PURGE_N2_TURN_ON, DILLUTION_SIGNAL_CHECK, CHILLER_HEAT_EXCHANGER_TURN_ON, 
        CHILLER_HEAT_EXCHANGER_CHECK, MANOMETER_LIMIT_ADJUST, GAS_TURN_ON_PRECHECK, NF3_LINE_LEAK_CHECK, H2_LINE_LEAK_CHECK, NF3_TURN_ON, H2_TURN_ON, 
        GAS_TURN_ON_CONFIRM, GAS_TURN_ON_CAUTION, PM_DILLUTION_TEST, EFEM_ROBOT_PENDANT_CONTROL, EFEM_ROBOT_XYZ_VALUES, 
        EFEM_ROBOT_PARAMETER_EDIT, EFEM_TEACHING_DATA_SAVE, TM_ROBOT_PENDANT_CONTROL, TM_ROBOT_LEVELING, TM_ROBOT_XYZ_VALUES, 
        TM_ROBOT_PM_TEACHING, TM_ROBOT_AM_TEACHING, TM_TEACHING_DATA_SAVE, WAFER_JIG_USE, LASER_JIG_USE, MARGIN_CHECK, 
        SEMI_AUTO_TRANSFER, AGING_TEST, CERAMIC_PLATE_PIN_INSTALLATION, PIN_HEIGHT_ADJUST, PIO_SENSOR_INSTALLATION, 
        VIEW_PORT_COVER_INSTALLATION, LOAD_LOCK_LEVELING, TM_ROBOT_PICK_INSTALLATION, TM_ROBOT_PICK_LEVELING, 
        GAS_BOX_WINDOW_INSTALLATION, GAS_BOX_DAMPER_INSTALLATION, LINE_MANUAL_LEAK_CHECK, MANUAL_LEAK_CHECK_HISTORY, 
        HE_DETECTOR_USE, HE_BOTTLE_CHECK, HE_DETECTOR_HOUSING_LEAK_CHECK, SLOT_VALVE_HE_LEAK_CHECK, VAC_CDA_SPEC_ADJUST, 
        TEMP_PROFILE, PUMP_VENT_TIME_ADJUST, EPD_PEAK_OFFSET_ADJUST, PM_BAFFLE_TEMP_AUTOTUNE, DOOR_VALVE_CONTROL, 
        APC_AUTOLEARN, PIN_SPEED_HEIGHT_ADJUST, GAS_SUPPLY_PRESSURE_CHECK, GAS_EXHAUST_MONAMETER_CONTROL, 
        MFC_HUNTING_CHECK, LP_FLOW_CONTROL, AICP_POWER_CAL, PRODUCT_REPORT_COMPLETION, TTTM_SHEET_COMPLETION, 
        LP_CERTIFICATION, FULL_PUMPING, MID_OPERATION_CERTIFICATION_PREP, LABEL_PLACEMENT, I_MARKING_PROCEDURE, 
        I_MARKING_LOCATION, GAS_BOX_BOARD_LEVELING, ENVIRONMENTAL_QUAL_TEST, OHT_AUTO_TRANSFER_CERTIFICATION, 
        PARTICLE_TEST, EA_TEST
      ) VALUES (?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const values = [
        checklistData.name, checklistData.CUSTOMER_OHT_LINE_CHECK, checklistData.EQUIPMENT_CLEARANCE_CHECK, 
        checklistData.DRAWING_TEMPLATE_SETUP, checklistData.DRAWING_TEMPLATE_MARKING, checklistData.UTILITY_SPEC_UNDERSTANDING, 
        checklistData.EQUIPMENT_IMPORT_ORDER, checklistData.IMPORT_COMPANY_CAUTION, checklistData.IMPORT_INSPECTION_POINTS, 
        checklistData.PROHIBITED_ITEMS_IMPORT, checklistData.GRATING_OPENING_CHECK, checklistData.PACKING_LIST_VERIFICATION, 
        checklistData.TOOL_SIZE_UNDERSTANDING, checklistData.LASER_JIG_ALIGNMENT, checklistData.LIFT_CASTER_REMOVAL, 
        checklistData.MODULE_HEIGHT_DOCKING, checklistData.MODULE_DOCKING, checklistData.DOCKING_REALIGNMENT, 
        checklistData.LEVELER_POSITION_UNDERSTANDING, checklistData.MODULE_LEVELING, checklistData.DOCKING_PIN_POSITION, 
        checklistData.HOOK_UP, checklistData.TRAY_CHECK, checklistData.CABLE_SORTING, checklistData.GRATING_OPEN_CAUTION, 
        checklistData.LADDER_SAFETY_RULES, checklistData.CABLE_INSTALLATION, checklistData.CABLE_CONNECTION, 
        checklistData.CABLE_TRAY_ARRANGEMENT, checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECTION, 
        checklistData.PUMP_CABLE_TRAY, checklistData.PUMP_CABLE_ARRANGEMENT, checklistData.CABLE_PM_PUMP_CONNECTION, 
        checklistData.GPS_UPS_SPS_UNDERSTANDING, checklistData.POWER_TURN_ON_SEQUENCE, checklistData.RACK_ELCB_MCB_UNDERSTANDING, 
        checklistData.SAFETY_MODULE_UNDERSTANDING, checklistData.EMO_CHECK, checklistData.MODULE_MCB_TURN_ON, 
        checklistData.SYCON_NUMBER_UNDERSTANDING, checklistData.SYCON_TROUBLESHOOTING, checklistData.POWER_TURN_ON_ALARM_TROUBLESHOOTING, 
        checklistData.CHECKLIST_COMPLETION, checklistData.IP_ADDRESS_CHANGE, checklistData.UTILITY_TURN_ON_SEQUENCE, 
        checklistData.VACUUM_TURN_ON, checklistData.CDA_TURN_ON, checklistData.PCW_TURN_ON, checklistData.SOLANOID_VALVE_LOCATION, 
        checklistData.RELIEF_VALVE_LOCATION, checklistData.MANUAL_VALVE_LOCATION, checklistData.PUMP_TURN_ON, 
        checklistData.PURGE_N2_TURN_ON, checklistData.DILLUTION_SIGNAL_CHECK, checklistData.CHILLER_HEAT_EXCHANGER_TURN_ON, 
        checklistData.CHILLER_HEAT_EXCHANGER_CHECK, checklistData.MANOMETER_LIMIT_ADJUST, checklistData.GAS_TURN_ON_PRECHECK, 
        checklistData.NF3_LINE_LEACK_CHECK, checklistData.H2_LINE_LEAK_CHECK,
        checklistData.NF3_TURN_ON, checklistData.H2_TURN_ON, checklistData.GAS_TURN_ON_CONFIRM, checklistData.GAS_TURN_ON_CAUTION, 
        checklistData.PM_DILLUTION_TEST, checklistData.EFEM_ROBOT_PENDANT_CONTROL, checklistData.EFEM_ROBOT_XYZ_VALUES, 
        checklistData.EFEM_ROBOT_PARAMETER_EDIT, checklistData.EFEM_TEACHING_DATA_SAVE, checklistData.TM_ROBOT_PENDANT_CONTROL, 
        checklistData.TM_ROBOT_LEVELING, checklistData.TM_ROBOT_XYZ_VALUES, checklistData.TM_ROBOT_PM_TEACHING, 
        checklistData.TM_ROBOT_AM_TEACHING, checklistData.TM_TEACHING_DATA_SAVE, checklistData.WAFER_JIG_USE, 
        checklistData.LASER_JIG_USE, checklistData.MARGIN_CHECK, checklistData.SEMI_AUTO_TRANSFER, checklistData.AGING_TEST, 
        checklistData.CERAMIC_PLATE_PIN_INSTALLATION, checklistData.PIN_HEIGHT_ADJUST, checklistData.PIO_SENSOR_INSTALLATION, 
        checklistData.VIEW_PORT_COVER_INSTALLATION, checklistData.LOAD_LOCK_LEVELING, checklistData.TM_ROBOT_PICK_INSTALLATION, 
        checklistData.TM_ROBOT_PICK_LEVELING, checklistData.GAS_BOX_WINDOW_INSTALLATION, checklistData.GAS_BOX_DAMPER_INSTALLATION, 
        checklistData.LINE_MANUAL_LEAK_CHECK, checklistData.MANUAL_LEAK_CHECK_HISTORY, checklistData.HE_DETECTOR_USE, 
        checklistData.HE_BOTTLE_CHECK, checklistData.HE_DETECTOR_HOUSING_LEAK_CHECK, checklistData.SLOT_VALVE_HE_LEAK_CHECK, 
        checklistData.VAC_CDA_SPEC_ADJUST, checklistData.TEMP_PROFILE, checklistData.PUMP_VENT_TIME_ADJUST, 
        checklistData.EPD_PEAK_OFFSET_ADJUST, checklistData.PM_BAFFLE_TEMP_AUTOTUNE, checklistData.DOOR_VALVE_CONTROL, 
        checklistData.APC_AUTOLEARN, checklistData.PIN_SPEED_HEIGHT_ADJUST, checklistData.GAS_SUPPLY_PRESSURE_CHECK, 
        checklistData.GAS_EXHAUST_MONAMETER_CONTROL, checklistData.MFC_HUNTING_CHECK, checklistData.LP_FLOW_CONTROL, 
        checklistData.AICP_POWER_CAL, checklistData.PRODUCT_REPORT_COMPLETION, checklistData.TTTM_SHEET_COMPLETION, 
        checklistData.LP_CERTIFICATION, checklistData.FULL_PUMPING, checklistData.MID_OPERATION_CERTIFICATION_PREP, 
        checklistData.LABEL_PLACEMENT, checklistData.I_MARKING_PROCEDURE, checklistData.I_MARKING_LOCATION, 
        checklistData.GAS_BOX_BOARD_LEVELING, checklistData.ENVIRONMENTAL_QUAL_TEST, checklistData.OHT_AUTO_TRANSFER_CERTIFICATION, 
        checklistData.PARTICLE_TEST, checklistData.EA_TEST
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
        UPDATE INTEGER_SETUP SET
          CUSTOMER_OHT_LINE_CHECK = ?, EQUIPMENT_CLEARANCE_CHECK = ?, DRAWING_TEMPLATE_SETUP = ?, DRAWING_TEMPLATE_MARKING = ?, 
          UTILITY_SPEC_UNDERSTANDING = ?, EQUIPMENT_IMPORT_ORDER = ?, IMPORT_COMPANY_CAUTION = ?, IMPORT_INSPECTION_POINTS = ?, 
          PROHIBITED_ITEMS_IMPORT = ?, GRATING_OPENING_CHECK = ?, PACKING_LIST_VERIFICATION = ?, TOOL_SIZE_UNDERSTANDING = ?, 
          LASER_JIG_ALIGNMENT = ?, LIFT_CASTER_REMOVAL = ?, MODULE_HEIGHT_DOCKING = ?, MODULE_DOCKING = ?, 
          DOCKING_REALIGNMENT = ?, LEVELER_POSITION_UNDERSTANDING = ?, MODULE_LEVELING = ?, DOCKING_PIN_POSITION = ?, 
          HOOK_UP = ?, TRAY_CHECK = ?, CABLE_SORTING = ?, GRATING_OPEN_CAUTION = ?, LADDER_SAFETY_RULES = ?, 
          CABLE_INSTALLATION = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ARRANGEMENT = ?, CABLE_CUTTING = ?, 
          CABLE_RACK_CONNECTION = ?, PUMP_CABLE_TRAY = ?, PUMP_CABLE_ARRANGEMENT = ?, CABLE_PM_PUMP_CONNECTION = ?, 
          GPS_UPS_SPS_UNDERSTANDING = ?, POWER_TURN_ON_SEQUENCE = ?, RACK_ELCB_MCB_UNDERSTANDING = ?, 
          SAFETY_MODULE_UNDERSTANDING = ?, EMO_CHECK = ?, MODULE_MCB_TURN_ON = ?, SYCON_NUMBER_UNDERSTANDING = ?, 
          SYCON_TROUBLESHOOTING = ?, POWER_TURN_ON_ALARM_TROUBLESHOOTING = ?, CHECKLIST_COMPLETION = ?, IP_ADDRESS_CHANGE = ?, 
          UTILITY_TURN_ON_SEQUENCE = ?, VACUUM_TURN_ON = ?, CDA_TURN_ON = ?, PCW_TURN_ON = ?, SOLANOID_VALVE_LOCATION = ?, 
          RELIEF_VALVE_LOCATION = ?, MANUAL_VALVE_LOCATION = ?, PUMP_TURN_ON = ?, PURGE_N2_TURN_ON = ?, 
          DILLUTION_SIGNAL_CHECK = ?, CHILLER_HEAT_EXCHANGER_TURN_ON = ?, CHILLER_HEAT_EXCHANGER_CHECK = ?, 
          MANOMETER_LIMIT_ADJUST = ?, GAS_TURN_ON_PRECHECK = ?, NF3_LINE_LEAK_CHECK = ?, H2_LINE_LEAK_CHECK = ?, NF3_TURN_ON = ?, H2_TURN_ON = ?, 
          GAS_TURN_ON_CONFIRM = ?, GAS_TURN_ON_CAUTION = ?, PM_DILLUTION_TEST = ?, EFEM_ROBOT_PENDANT_CONTROL = ?, 
          EFEM_ROBOT_XYZ_VALUES = ?, EFEM_ROBOT_PARAMETER_EDIT = ?, EFEM_TEACHING_DATA_SAVE = ?, 
          TM_ROBOT_PENDANT_CONTROL = ?, TM_ROBOT_LEVELING = ?, TM_ROBOT_XYZ_VALUES = ?, TM_ROBOT_PM_TEACHING = ?, 
          TM_ROBOT_AM_TEACHING = ?, TM_TEACHING_DATA_SAVE = ?, WAFER_JIG_USE = ?, LASER_JIG_USE = ?, 
          MARGIN_CHECK = ?, SEMI_AUTO_TRANSFER = ?, AGING_TEST = ?, CERAMIC_PLATE_PIN_INSTALLATION = ?, 
          PIN_HEIGHT_ADJUST = ?, PIO_SENSOR_INSTALLATION = ?, VIEW_PORT_COVER_INSTALLATION = ?, 
          LOAD_LOCK_LEVELING = ?, TM_ROBOT_PICK_INSTALLATION = ?, TM_ROBOT_PICK_LEVELING = ?, 
          GAS_BOX_WINDOW_INSTALLATION = ?, GAS_BOX_DAMPER_INSTALLATION = ?, LINE_MANUAL_LEAK_CHECK = ?, 
          MANUAL_LEAK_CHECK_HISTORY = ?, HE_DETECTOR_USE = ?, HE_BOTTLE_CHECK = ?, HE_DETECTOR_HOUSING_LEAK_CHECK = ?, 
          SLOT_VALVE_HE_LEAK_CHECK = ?, VAC_CDA_SPEC_ADJUST = ?, TEMP_PROFILE = ?, PUMP_VENT_TIME_ADJUST = ?, 
          EPD_PEAK_OFFSET_ADJUST = ?, PM_BAFFLE_TEMP_AUTOTUNE = ?, DOOR_VALVE_CONTROL = ?, APC_AUTOLEARN = ?, 
          PIN_SPEED_HEIGHT_ADJUST = ?, GAS_SUPPLY_PRESSURE_CHECK = ?, GAS_EXHAUST_MONAMETER_CONTROL = ?, 
          MFC_HUNTING_CHECK = ?, LP_FLOW_CONTROL = ?, AICP_POWER_CAL = ?, PRODUCT_REPORT_COMPLETION = ?, 
          TTTM_SHEET_COMPLETION = ?, LP_CERTIFICATION = ?, FULL_PUMPING = ?, MID_OPERATION_CERTIFICATION_PREP = ?, 
          LABEL_PLACEMENT = ?, I_MARKING_PROCEDURE = ?, I_MARKING_LOCATION = ?, GAS_BOX_BOARD_LEVELING = ?, 
          ENVIRONMENTAL_QUAL_TEST = ?, OHT_AUTO_TRANSFER_CERTIFICATION = ?, PARTICLE_TEST = ?, EA_TEST = ?, 
          updated_at = CURRENT_TIMESTAMP
        WHERE name = ?
      `;
      const values = [
        checklistData.CUSTOMER_OHT_LINE_CHECK, checklistData.EQUIPMENT_CLEARANCE_CHECK, checklistData.DRAWING_TEMPLATE_SETUP, 
        checklistData.DRAWING_TEMPLATE_MARKING, checklistData.UTILITY_SPEC_UNDERSTANDING, checklistData.EQUIPMENT_IMPORT_ORDER, 
        checklistData.IMPORT_COMPANY_CAUTION, checklistData.IMPORT_INSPECTION_POINTS, checklistData.PROHIBITED_ITEMS_IMPORT, 
        checklistData.GRATING_OPENING_CHECK, checklistData.PACKING_LIST_VERIFICATION, checklistData.TOOL_SIZE_UNDERSTANDING, 
        checklistData.LASER_JIG_ALIGNMENT, checklistData.LIFT_CASTER_REMOVAL, checklistData.MODULE_HEIGHT_DOCKING, 
        checklistData.MODULE_DOCKING, checklistData.DOCKING_REALIGNMENT, checklistData.LEVELER_POSITION_UNDERSTANDING, 
        checklistData.MODULE_LEVELING, checklistData.DOCKING_PIN_POSITION, checklistData.HOOK_UP, checklistData.TRAY_CHECK, 
        checklistData.CABLE_SORTING, checklistData.GRATING_OPEN_CAUTION, checklistData.LADDER_SAFETY_RULES, 
        checklistData.CABLE_INSTALLATION, checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGEMENT, 
        checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECTION, checklistData.PUMP_CABLE_TRAY, 
        checklistData.PUMP_CABLE_ARRANGEMENT, checklistData.CABLE_PM_PUMP_CONNECTION, checklistData.GPS_UPS_SPS_UNDERSTANDING, 
        checklistData.POWER_TURN_ON_SEQUENCE, checklistData.RACK_ELCB_MCB_UNDERSTANDING, checklistData.SAFETY_MODULE_UNDERSTANDING, 
        checklistData.EMO_CHECK, checklistData.MODULE_MCB_TURN_ON, checklistData.SYCON_NUMBER_UNDERSTANDING, 
        checklistData.SYCON_TROUBLESHOOTING, checklistData.POWER_TURN_ON_ALARM_TROUBLESHOOTING, 
        checklistData.CHECKLIST_COMPLETION, checklistData.IP_ADDRESS_CHANGE, checklistData.UTILITY_TURN_ON_SEQUENCE, 
        checklistData.VACUUM_TURN_ON, checklistData.CDA_TURN_ON, checklistData.PCW_TURN_ON, checklistData.SOLANOID_VALVE_LOCATION, 
        checklistData.RELIEF_VALVE_LOCATION, checklistData.MANUAL_VALVE_LOCATION, checklistData.PUMP_TURN_ON, 
        checklistData.PURGE_N2_TURN_ON, checklistData.DILLUTION_SIGNAL_CHECK, checklistData.CHILLER_HEAT_EXCHANGER_TURN_ON, 
        checklistData.CHILLER_HEAT_EXCHANGER_CHECK, checklistData.MANOMETER_LIMIT_ADJUST, checklistData.GAS_TURN_ON_PRECHECK, 
        checklistData.NF3_LINE_LEACK_CHECK, checklistData.H2_LINE_LEAK_CHECK,
        checklistData.NF3_TURN_ON, checklistData.H2_TURN_ON, checklistData.GAS_TURN_ON_CONFIRM, checklistData.GAS_TURN_ON_CAUTION, 
        checklistData.PM_DILLUTION_TEST, checklistData.EFEM_ROBOT_PENDANT_CONTROL, checklistData.EFEM_ROBOT_XYZ_VALUES, 
        checklistData.EFEM_ROBOT_PARAMETER_EDIT, checklistData.EFEM_TEACHING_DATA_SAVE, checklistData.TM_ROBOT_PENDANT_CONTROL, 
        checklistData.TM_ROBOT_LEVELING, checklistData.TM_ROBOT_XYZ_VALUES, checklistData.TM_ROBOT_PM_TEACHING, 
        checklistData.TM_ROBOT_AM_TEACHING, checklistData.TM_TEACHING_DATA_SAVE, checklistData.WAFER_JIG_USE, 
        checklistData.LASER_JIG_USE, checklistData.MARGIN_CHECK, checklistData.SEMI_AUTO_TRANSFER, checklistData.AGING_TEST, 
        checklistData.CERAMIC_PLATE_PIN_INSTALLATION, checklistData.PIN_HEIGHT_ADJUST, checklistData.PIO_SENSOR_INSTALLATION, 
        checklistData.VIEW_PORT_COVER_INSTALLATION, checklistData.LOAD_LOCK_LEVELING, checklistData.TM_ROBOT_PICK_INSTALLATION, 
        checklistData.TM_ROBOT_PICK_LEVELING, checklistData.GAS_BOX_WINDOW_INSTALLATION, checklistData.GAS_BOX_DAMPER_INSTALLATION, 
        checklistData.LINE_MANUAL_LEAK_CHECK, checklistData.MANUAL_LEAK_CHECK_HISTORY, checklistData.HE_DETECTOR_USE, 
        checklistData.HE_BOTTLE_CHECK, checklistData.HE_DETECTOR_HOUSING_LEAK_CHECK, checklistData.SLOT_VALVE_HE_LEAK_CHECK, 
        checklistData.VAC_CDA_SPEC_ADJUST, checklistData.TEMP_PROFILE, checklistData.PUMP_VENT_TIME_ADJUST, 
        checklistData.EPD_PEAK_OFFSET_ADJUST, checklistData.PM_BAFFLE_TEMP_AUTOTUNE, checklistData.DOOR_VALVE_CONTROL, 
        checklistData.APC_AUTOLEARN, checklistData.PIN_SPEED_HEIGHT_ADJUST, checklistData.GAS_SUPPLY_PRESSURE_CHECK, 
        checklistData.GAS_EXHAUST_MONAMETER_CONTROL, checklistData.MFC_HUNTING_CHECK, checklistData.LP_FLOW_CONTROL, 
        checklistData.AICP_POWER_CAL, checklistData.PRODUCT_REPORT_COMPLETION, checklistData.TTTM_SHEET_COMPLETION, 
        checklistData.LP_CERTIFICATION, checklistData.FULL_PUMPING, checklistData.MID_OPERATION_CERTIFICATION_PREP, 
        checklistData.LABEL_PLACEMENT, checklistData.I_MARKING_PROCEDURE, checklistData.I_MARKING_LOCATION, 
        checklistData.GAS_BOX_BOARD_LEVELING, checklistData.ENVIRONMENTAL_QUAL_TEST, checklistData.OHT_AUTO_TRANSFER_CERTIFICATION, 
        checklistData.PARTICLE_TEST, checklistData.EA_TEST, checklistData.name
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
    const query = `SELECT * FROM INTEGER_SETUP WHERE name = ?`;
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
      const query = `SELECT * FROM INTEGER_SETUP`;
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllIntegerSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // INTEGER_SETUP 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM INTEGER_SETUP`;
      const [rows] = await connection.query(query);  // INTEGER_SETUP 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from INTEGER_SETUP: ${err.message}`);
  }
};
