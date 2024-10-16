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
    const query = `SELECT * FROM ECOLITE_SETUP WHERE name = ?`;
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
    const queryFind = `SELECT * FROM ECOLITE_SETUP WHERE name = ?`;
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
        INSERT INTO ECOLITE_SETUP (
          name, EQ_IMPORT_ORDER, PACK_LIST_CHECK, OHT_LINE_CHECK_300, OHT_LINE_CHECK_400, EQ_SPACING_CHECK, 
          DRAWING_TEMPLATE_SETUP, DRAWING_TEMPLATE_MARKING, UTILITY_SPEC_UNDERSTANDING, MODULE_UNPACKING_CAUTION, 
          MODULE_CLEAN_CAUTION, MODULE_MOVEMENT_CAUTION, TOOL_SIZE_UNDERSTANDING, LASER_JIG_ALIGNMENT_300, 
          LASER_JIG_ALIGNMENT_400, JACK_USAGE_UNDERSTANDING, MODULE_HEIGHT_DOCKING, MODULE_DOCKING, DOCKING_REALIGNMENT, 
          LEVELER_POSITION_UNDERSTANDING, MODULE_LEVELING, ACCESSORY_INSTALLATION, HOOK_UP_UNDERSTANDING, TRAY_CHECK, 
          CABLE_SORTING, GRATING_OPEN_CAUTION, LADDER_SAFETY_RULES, CABLE_INSTALLATION, CABLE_CONNECTION, 
          CABLE_TRAY_ARRANGEMENT, CABLE_CUTTING, CABLE_RACK_CONNECTION, PUMP_CABLE_TRAY, PUMP_CABLE_ARRANGEMENT, 
          CABLE_PM_PUMP_CONNECTION, GPS_UPS_SPS_UNDERSTANDING, POWER_TURN_ON_SEQUENCE, ALARM_TROUBLESHOOTING, 
          RACK_CB_UNDERSTANDING, SAFETY_MODULE_UNDERSTANDING, EMO_CHECK, SYCON_NUMBER_UNDERSTANDING, SYCON_INITIAL_SETUP, 
          SYCON_TROUBLESHOOTING, UTILITY_TURN_ON_SEQUENCE, VACUUM_TURN_ON, CDA_TURN_ON, PCW_TURN_ON, CHILLER_TEMP_ADJUST, 
          IONIZER_TURN_ON, GAS_TURN_ON_SEQUENCE, O2_N2_GAS_TURN_ON, CF4_GAS_TURN_ON, CF4_H2N2_PRESSURE_TEST, 
          MANOMETER_ADJUST, EFEM_LEVELING_SANKYO, EFEM_ARM_LEVEL_SANKYO, EFEM_LOAD_PORT_SANKYO, EFEM_LOADLOCK_SANKYO, 
          EFEM_BM_MODULE_SANKYO, EFEM_TEACH_SAVE_SANKYO, EFEM_LEVELING_YASKAWA, EFEM_ARM_LEVEL_YASKAWA, EFEM_LOAD_PORT_YASKAWA, 
          EFEM_LOADLOCK_YASKAWA, EFEM_BM_MODULE_YASKAWA, EFEM_TEACH_SAVE_YASKAWA, ABS_HOME_SETTING, TM_ROBOT_PENDANT_CONTROL, 
          TM_BM_TEACHING, TM_PM_TEACHING, TM_TEACH_SAVE, FINE_TEACHING, MARGIN_CHECK, SEMI_AUTO_TRANSFER, 
          EXHAUST_PORT_INSTALLATION, ENDEFFECTOR_INSTALL_SANKYO, ENDEFFECTOR_ADJUST_SANKYO, ENDEFFECTOR_LEVEL_SANKYO, 
          TM_ENDEFFECTOR_INSTALL, TM_ENDEFFECTOR_ADJUST_38X, TM_ENDEFFECTOR_ADJUST_16, TM_ENDEFFECTOR_LEVEL, PROCESS_KIT_INSTALL, 
          PIO_SENSOR_INSTALL, SIGNAL_TOWER_INSTALL, WALL_LINEAR_INSTALL, PUMP_TURN_ON, PM_LEAK_CHECK, GAS_LINE_LEAK_CHECK, 
          TM_LEAK_CHECK, ECID_MATCHING, PUMP_PURGE_TIME, VENTING_TIME_ADJUST, EPD_PEAK_OFFSET_ADJUST, TEMP_AUTOTUNE, 
          SLIT_DOOR_CONTROL, APC_AUTOLEARN, PART_LIST_SHEET, PIN_ADJUST, GAS_PRESSURE_CHECK, MFC_HUNTING_CHECK, 
          GAS_LEAK_CHECK, DNET_CAL, TTTM_SHEET, OHT_CERTIFICATION, IMARKING_POSITION, GND_LABELING, CSF_SILICONE_FINISH, 
          MID_CERT_RESPONSE, ENV_QUAL_RESPONSE, MFC_CERT_RESPONSE, OHT_LAYOUT_CERTIFICATION, AGING_TEST, AR_TEST, 
          SCRATCH_TEST, PARTICLE_CHECK, EC_TOOL_MATCH
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      
      
        const values = [
            checklistData.name, checklistData.EQ_IMPORT_ORDER, checklistData.PACK_LIST_CHECK, checklistData.OHT_LINE_CHECK_300, 
            checklistData.OHT_LINE_CHECK_400, checklistData.EQ_SPACING_CHECK, checklistData.DRAWING_TEMPLATE_SETUP, 
            checklistData.DRAWING_TEMPLATE_MARKING, checklistData.UTILITY_SPEC_UNDERSTANDING, checklistData.MODULE_UNPACKING_CAUTION, 
            checklistData.MODULE_CLEAN_CAUTION, checklistData.MODULE_MOVEMENT_CAUTION, checklistData.TOOL_SIZE_UNDERSTANDING, 
            checklistData.LASER_JIG_ALIGNMENT_300, checklistData.LASER_JIG_ALIGNMENT_400, checklistData.JACK_USAGE_UNDERSTANDING, 
            checklistData.MODULE_HEIGHT_DOCKING, checklistData.MODULE_DOCKING, checklistData.DOCKING_REALIGNMENT, 
            checklistData.LEVELER_POSITION_UNDERSTANDING, checklistData.MODULE_LEVELING, checklistData.ACCESSORY_INSTALLATION, 
            checklistData.HOOK_UP_UNDERSTANDING, checklistData.TRAY_CHECK, checklistData.CABLE_SORTING, 
            checklistData.GRATING_OPEN_CAUTION, checklistData.LADDER_SAFETY_RULES, checklistData.CABLE_INSTALLATION, 
            checklistData.CABLE_CONNECTION, checklistData.CABLE_TRAY_ARRANGEMENT, checklistData.CABLE_CUTTING, 
            checklistData.CABLE_RACK_CONNECTION, checklistData.PUMP_CABLE_TRAY, checklistData.PUMP_CABLE_ARRANGEMENT, 
            checklistData.CABLE_PM_PUMP_CONNECTION, checklistData.GPS_UPS_SPS_UNDERSTANDING, checklistData.POWER_TURN_ON_SEQUENCE, 
            checklistData.ALARM_TROUBLESHOOTING, checklistData.RACK_CB_UNDERSTANDING, checklistData.SAFETY_MODULE_UNDERSTANDING, 
            checklistData.EMO_CHECK, checklistData.SYCON_NUMBER_UNDERSTANDING, checklistData.SYCON_INITIAL_SETUP, 
            checklistData.SYCON_TROUBLESHOOTING, checklistData.UTILITY_TURN_ON_SEQUENCE, checklistData.VACUUM_TURN_ON, 
            checklistData.CDA_TURN_ON, checklistData.PCW_TURN_ON, checklistData.CHILLER_TEMP_ADJUST, checklistData.IONIZER_TURN_ON, 
            checklistData.GAS_TURN_ON_SEQUENCE, checklistData.O2_N2_GAS_TURN_ON, checklistData.CF4_GAS_TURN_ON, 
            checklistData.CF4_H2N2_PRESSURE_TEST, checklistData.MANOMETER_ADJUST, checklistData.EFEM_LEVELING_SANKYO, 
            checklistData.EFEM_ARM_LEVEL_SANKYO, checklistData.EFEM_LOAD_PORT_SANKYO, checklistData.EFEM_LOADLOCK_SANKYO, 
            checklistData.EFEM_BM_MODULE_SANKYO, checklistData.EFEM_TEACH_SAVE_SANKYO, checklistData.EFEM_LEVELING_YASKAWA, 
            checklistData.EFEM_ARM_LEVEL_YASKAWA, checklistData.EFEM_LOAD_PORT_YASKAWA, checklistData.EFEM_LOADLOCK_YASKAWA, 
            checklistData.EFEM_BM_MODULE_YASKAWA, checklistData.EFEM_TEACH_SAVE_YASKAWA, checklistData.ABS_HOME_SETTING, 
            checklistData.TM_ROBOT_PENDANT_CONTROL, checklistData.TM_BM_TEACHING, checklistData.TM_PM_TEACHING, 
            checklistData.TM_TEACH_SAVE, checklistData.FINE_TEACHING, checklistData.MARGIN_CHECK, checklistData.SEMI_AUTO_TRANSFER, 
            checklistData.EXHAUST_PORT_INSTALLATION, checklistData.ENDEFFECTOR_INSTALL_SANKYO, checklistData.ENDEFFECTOR_ADJUST_SANKYO, 
            checklistData.ENDEFFECTOR_LEVEL_SANKYO, checklistData.TM_ENDEFFECTOR_INSTALL, checklistData.TM_ENDEFFECTOR_ADJUST_38X, 
            checklistData.TM_ENDEFFECTOR_ADJUST_16, checklistData.TM_ENDEFFECTOR_LEVEL, checklistData.PROCESS_KIT_INSTALL, 
            checklistData.PIO_SENSOR_INSTALL, checklistData.SIGNAL_TOWER_INSTALL, checklistData.WALL_LINEAR_INSTALL, 
            checklistData.PUMP_TURN_ON, checklistData.PM_LEAK_CHECK, checklistData.GAS_LINE_LEAK_CHECK, checklistData.TM_LEAK_CHECK, 
            checklistData.ECID_MATCHING, checklistData.PUMP_PURGE_TIME, checklistData.VENTING_TIME_ADJUST, 
            checklistData.EPD_PEAK_OFFSET_ADJUST, checklistData.TEMP_AUTOTUNE, checklistData.SLIT_DOOR_CONTROL, 
            checklistData.APC_AUTOLEARN, checklistData.PART_LIST_SHEET, checklistData.PIN_ADJUST, checklistData.GAS_PRESSURE_CHECK, 
            checklistData.MFC_HUNTING_CHECK, checklistData.GAS_LEAK_CHECK, checklistData.DNET_CAL, checklistData.TTTM_SHEET, 
            checklistData.OHT_CERTIFICATION, checklistData.IMARKING_POSITION, checklistData.GND_LABELING, 
            checklistData.CSF_SILICONE_FINISH, checklistData.MID_CERT_RESPONSE, checklistData.ENV_QUAL_RESPONSE, 
            checklistData.MFC_CERT_RESPONSE, checklistData.OHT_LAYOUT_CERTIFICATION, checklistData.AGING_TEST, 
            checklistData.AR_TEST, checklistData.SCRATCH_TEST, checklistData.PARTICLE_CHECK, checklistData.EC_TOOL_MATCH
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
        UPDATE ECOLITE_SETUP SET
          EQ_IMPORT_ORDER = ?, PACK_LIST_CHECK = ?, OHT_LINE_CHECK_300 = ?, OHT_LINE_CHECK_400 = ?, EQ_SPACING_CHECK = ?,
          DRAWING_TEMPLATE_SETUP = ?, DRAWING_TEMPLATE_MARKING = ?, UTILITY_SPEC_UNDERSTANDING = ?, MODULE_UNPACKING_CAUTION = ?,
          MODULE_CLEAN_CAUTION = ?, MODULE_MOVEMENT_CAUTION = ?, TOOL_SIZE_UNDERSTANDING = ?, LASER_JIG_ALIGNMENT_300 = ?,
          LASER_JIG_ALIGNMENT_400 = ?, JACK_USAGE_UNDERSTANDING = ?, MODULE_HEIGHT_DOCKING = ?, MODULE_DOCKING = ?,
          DOCKING_REALIGNMENT = ?, LEVELER_POSITION_UNDERSTANDING = ?, MODULE_LEVELING = ?, ACCESSORY_INSTALLATION = ?,
          HOOK_UP_UNDERSTANDING = ?, TRAY_CHECK = ?, CABLE_SORTING = ?, GRATING_OPEN_CAUTION = ?, LADDER_SAFETY_RULES = ?,
          CABLE_INSTALLATION = ?, CABLE_CONNECTION = ?, CABLE_TRAY_ARRANGEMENT = ?, CABLE_CUTTING = ?, CABLE_RACK_CONNECTION = ?,
          PUMP_CABLE_TRAY = ?, PUMP_CABLE_ARRANGEMENT = ?, CABLE_PM_PUMP_CONNECTION = ?, GPS_UPS_SPS_UNDERSTANDING = ?,
          POWER_TURN_ON_SEQUENCE = ?, ALARM_TROUBLESHOOTING = ?, RACK_CB_UNDERSTANDING = ?, SAFETY_MODULE_UNDERSTANDING = ?,
          EMO_CHECK = ?, SYCON_NUMBER_UNDERSTANDING = ?, SYCON_INITIAL_SETUP = ?, SYCON_TROUBLESHOOTING = ?, UTILITY_TURN_ON_SEQUENCE = ?,
          VACUUM_TURN_ON = ?, CDA_TURN_ON = ?, PCW_TURN_ON = ?, CHILLER_TEMP_ADJUST = ?, IONIZER_TURN_ON = ?, GAS_TURN_ON_SEQUENCE = ?,
          O2_N2_GAS_TURN_ON = ?, CF4_GAS_TURN_ON = ?, CF4_H2N2_PRESSURE_TEST = ?, MANOMETER_ADJUST = ?, EFEM_LEVELING_SANKYO = ?,
          EFEM_ARM_LEVEL_SANKYO = ?, EFEM_LOAD_PORT_SANKYO = ?, EFEM_LOADLOCK_SANKYO = ?, EFEM_BM_MODULE_SANKYO = ?, EFEM_TEACH_SAVE_SANKYO = ?,
          EFEM_LEVELING_YASKAWA = ?, EFEM_ARM_LEVEL_YASKAWA = ?, EFEM_LOAD_PORT_YASKAWA = ?, EFEM_LOADLOCK_YASKAWA = ?,
          EFEM_BM_MODULE_YASKAWA = ?, EFEM_TEACH_SAVE_YASKAWA = ?, ABS_HOME_SETTING = ?, TM_ROBOT_PENDANT_CONTROL = ?,
          TM_BM_TEACHING = ?, TM_PM_TEACHING = ?, TM_TEACH_SAVE = ?, FINE_TEACHING = ?, MARGIN_CHECK = ?, SEMI_AUTO_TRANSFER = ?,
          EXHAUST_PORT_INSTALLATION = ?, ENDEFFECTOR_INSTALL_SANKYO = ?, ENDEFFECTOR_ADJUST_SANKYO = ?, ENDEFFECTOR_LEVEL_SANKYO = ?,
          TM_ENDEFFECTOR_INSTALL = ?, TM_ENDEFFECTOR_ADJUST_38X = ?, TM_ENDEFFECTOR_ADJUST_16 = ?, TM_ENDEFFECTOR_LEVEL = ?,
          PROCESS_KIT_INSTALL = ?, PIO_SENSOR_INSTALL = ?, SIGNAL_TOWER_INSTALL = ?, WALL_LINEAR_INSTALL = ?, PUMP_TURN_ON = ?,
          PM_LEAK_CHECK = ?, GAS_LINE_LEAK_CHECK = ?, TM_LEAK_CHECK = ?, ECID_MATCHING = ?, PUMP_PURGE_TIME = ?, VENTING_TIME_ADJUST = ?,
          EPD_PEAK_OFFSET_ADJUST = ?, TEMP_AUTOTUNE = ?, SLIT_DOOR_CONTROL = ?, APC_AUTOLEARN = ?, PART_LIST_SHEET = ?, PIN_ADJUST = ?,
          GAS_PRESSURE_CHECK = ?, MFC_HUNTING_CHECK = ?, GAS_LEAK_CHECK = ?, DNET_CAL = ?, TTTM_SHEET = ?, OHT_CERTIFICATION = ?,
          IMARKING_POSITION = ?, GND_LABELING = ?, CSF_SILICONE_FINISH = ?, MID_CERT_RESPONSE = ?, ENV_QUAL_RESPONSE = ?,
          MFC_CERT_RESPONSE = ?, OHT_LAYOUT_CERTIFICATION = ?, AGING_TEST = ?, AR_TEST = ?, SCRATCH_TEST = ?, PARTICLE_CHECK = ?,
          EC_TOOL_MATCH = ?
        WHERE name = ?
      `;
      
  
      // checklistData 및 쿼리 값 확인
      console.log('checklistData for Update:', checklistData);
      console.log('SQL Query for Update:', query);
  
      const values = [
        checklistData.EQ_IMPORT_ORDER, checklistData.PACK_LIST_CHECK, checklistData.OHT_LINE_CHECK_300, 
        checklistData.OHT_LINE_CHECK_400, checklistData.EQ_SPACING_CHECK, checklistData.DRAWING_TEMPLATE_SETUP, 
        checklistData.DRAWING_TEMPLATE_MARKING, checklistData.UTILITY_SPEC_UNDERSTANDING, checklistData.MODULE_UNPACKING_CAUTION, 
        checklistData.MODULE_CLEAN_CAUTION, checklistData.MODULE_MOVEMENT_CAUTION, checklistData.TOOL_SIZE_UNDERSTANDING, 
        checklistData.LASER_JIG_ALIGNMENT_300, checklistData.LASER_JIG_ALIGNMENT_400, checklistData.JACK_USAGE_UNDERSTANDING, 
        checklistData.MODULE_HEIGHT_DOCKING, checklistData.MODULE_DOCKING, checklistData.DOCKING_REALIGNMENT, 
        checklistData.LEVELER_POSITION_UNDERSTANDING, checklistData.MODULE_LEVELING, checklistData.ACCESSORY_INSTALLATION, 
        checklistData.HOOK_UP_UNDERSTANDING, checklistData.TRAY_CHECK, checklistData.CABLE_SORTING, checklistData.GRATING_OPEN_CAUTION, 
        checklistData.LADDER_SAFETY_RULES, checklistData.CABLE_INSTALLATION, checklistData.CABLE_CONNECTION, 
        checklistData.CABLE_TRAY_ARRANGEMENT, checklistData.CABLE_CUTTING, checklistData.CABLE_RACK_CONNECTION, 
        checklistData.PUMP_CABLE_TRAY, checklistData.PUMP_CABLE_ARRANGEMENT, checklistData.CABLE_PM_PUMP_CONNECTION, 
        checklistData.GPS_UPS_SPS_UNDERSTANDING, checklistData.POWER_TURN_ON_SEQUENCE, checklistData.ALARM_TROUBLESHOOTING, 
        checklistData.RACK_CB_UNDERSTANDING, checklistData.SAFETY_MODULE_UNDERSTANDING, checklistData.EMO_CHECK, 
        checklistData.SYCON_NUMBER_UNDERSTANDING, checklistData.SYCON_INITIAL_SETUP, checklistData.SYCON_TROUBLESHOOTING, 
        checklistData.UTILITY_TURN_ON_SEQUENCE, checklistData.VACUUM_TURN_ON, checklistData.CDA_TURN_ON, checklistData.PCW_TURN_ON, 
        checklistData.CHILLER_TEMP_ADJUST, checklistData.IONIZER_TURN_ON, checklistData.GAS_TURN_ON_SEQUENCE, 
        checklistData.O2_N2_GAS_TURN_ON, checklistData.CF4_GAS_TURN_ON, checklistData.CF4_H2N2_PRESSURE_TEST, checklistData.MANOMETER_ADJUST, 
        checklistData.EFEM_LEVELING_SANKYO, checklistData.EFEM_ARM_LEVEL_SANKYO, checklistData.EFEM_LOAD_PORT_SANKYO, 
        checklistData.EFEM_LOADLOCK_SANKYO, checklistData.EFEM_BM_MODULE_SANKYO, checklistData.EFEM_TEACH_SAVE_SANKYO, 
        checklistData.EFEM_LEVELING_YASKAWA, checklistData.EFEM_ARM_LEVEL_YASKAWA, checklistData.EFEM_LOAD_PORT_YASKAWA, 
        checklistData.EFEM_LOADLOCK_YASKAWA, checklistData.EFEM_BM_MODULE_YASKAWA, checklistData.EFEM_TEACH_SAVE_YASKAWA, 
        checklistData.ABS_HOME_SETTING, checklistData.TM_ROBOT_PENDANT_CONTROL, checklistData.TM_BM_TEACHING, checklistData.TM_PM_TEACHING, 
        checklistData.TM_TEACH_SAVE, checklistData.FINE_TEACHING, checklistData.MARGIN_CHECK, checklistData.SEMI_AUTO_TRANSFER, 
        checklistData.EXHAUST_PORT_INSTALLATION, checklistData.ENDEFFECTOR_INSTALL_SANKYO, checklistData.ENDEFFECTOR_ADJUST_SANKYO, 
        checklistData.ENDEFFECTOR_LEVEL_SANKYO, checklistData.TM_ENDEFFECTOR_INSTALL, checklistData.TM_ENDEFFECTOR_ADJUST_38X, 
        checklistData.TM_ENDEFFECTOR_ADJUST_16, checklistData.TM_ENDEFFECTOR_LEVEL, checklistData.PROCESS_KIT_INSTALL, 
        checklistData.PIO_SENSOR_INSTALL, checklistData.SIGNAL_TOWER_INSTALL, checklistData.WALL_LINEAR_INSTALL, 
        checklistData.PUMP_TURN_ON, checklistData.PM_LEAK_CHECK, checklistData.GAS_LINE_LEAK_CHECK, checklistData.TM_LEAK_CHECK, 
        checklistData.ECID_MATCHING, checklistData.PUMP_PURGE_TIME, checklistData.VENTING_TIME_ADJUST, checklistData.EPD_PEAK_OFFSET_ADJUST, 
        checklistData.TEMP_AUTOTUNE, checklistData.SLIT_DOOR_CONTROL, checklistData.APC_AUTOLEARN, checklistData.PART_LIST_SHEET, 
        checklistData.PIN_ADJUST, checklistData.GAS_PRESSURE_CHECK, checklistData.MFC_HUNTING_CHECK, checklistData.GAS_LEAK_CHECK, 
        checklistData.DNET_CAL, checklistData.TTTM_SHEET, checklistData.OHT_CERTIFICATION, checklistData.IMARKING_POSITION, 
        checklistData.GND_LABELING, checklistData.CSF_SILICONE_FINISH, checklistData.MID_CERT_RESPONSE, checklistData.ENV_QUAL_RESPONSE, 
        checklistData.MFC_CERT_RESPONSE, checklistData.OHT_LAYOUT_CERTIFICATION, checklistData.AGING_TEST, checklistData.AR_TEST, 
        checklistData.SCRATCH_TEST, checklistData.PARTICLE_CHECK, checklistData.EC_TOOL_MATCH, checklistData.name
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
    const query = `SELECT * FROM ECOLITE_SETUP WHERE name = ?`;
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
      const query = `SELECT * FROM ECOLITE_PLUS_SETUP`; // 나중에 수정해야 되는 부분 !!!!!!!!!
      const [rows] = await connection.query(query);
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving checklists: ${err.message}`);
  }
};

exports.getAllEcoliteSetupData = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      // ECOLITE_SETUP 테이블에서 모든 데이터를 가져오는 쿼리
      const query = `SELECT * FROM ECOLITE_SETUP`;
      const [rows] = await connection.query(query);  // ECOLITE_SETUP 테이블에서 데이터 가져오기
      connection.release();
      return rows;
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving data from ECOLITE_SETUP: ${err.message}`);
  }
};
