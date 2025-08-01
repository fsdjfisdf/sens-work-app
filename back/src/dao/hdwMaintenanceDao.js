const { pool } = require('../../config/database');

// 사용자 정보 조회
exports.getUserById = async (userId) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT userID, nickname FROM Users WHERE userIdx = ? AND status = 'A'`;
    const [rows] = await connection.query(query, [userId]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving user: ${err.message}`);
  } finally {
    connection.release();
  }
};

// 이름으로 기존 체크리스트 찾기
exports.findByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM HDW_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error finding entry by name: ${err.message}`);
  } finally {
    connection.release();
  }
};

// 체크리스트 삽입
exports.insertChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO HDW_MAINT_SELF (
        name,
        OD_REP, Relay_REP, Fan_REP, NTC_NTU_REP, SSR_REP, MC_REP, Fuse_REP, CT_REP,
        HBD_REP, SMPS_REP, PLC_REP, ELB_REP,
        Heater_REP, Qtz_tank_REP, Leak_troubleshooting, Flow_meter_REP,
        Air_valve_REP, Shut_off_valve_REP, Sol_valve_REP, Elbow_fitting_REP,
        Leak_tray, TC_Sensor,
        Touch_panel_patch, PLC_patch, Touch_panel_REP, PLC_REP_SW
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      checklistData.name,
      checklistData.OD_REP, checklistData.Relay_REP, checklistData.Fan_REP, checklistData.NTC_NTU_REP,
      checklistData.SSR_REP, checklistData.MC_REP, checklistData.Fuse_REP, checklistData.CT_REP,
      checklistData.HBD_REP, checklistData.SMPS_REP, checklistData.PLC_REP, checklistData.ELB_REP,
      checklistData.Heater_REP, checklistData.Qtz_tank_REP, checklistData.Leak_troubleshooting, checklistData.Flow_meter_REP,
      checklistData.Air_valve_REP, checklistData.Shut_off_valve_REP, checklistData.Sol_valve_REP, checklistData.Elbow_fitting_REP,
      checklistData.Leak_tray, checklistData.TC_Sensor,
      checklistData.Touch_panel_patch, checklistData.PLC_patch, checklistData.Touch_panel_REP, checklistData.PLC_REP_SW
    ];

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error inserting checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

// 체크리스트 업데이트
exports.updateChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE HDW_MAINT_SELF SET
        OD_REP = ?, Relay_REP = ?, Fan_REP = ?, NTC_NTU_REP = ?, SSR_REP = ?, MC_REP = ?, Fuse_REP = ?, CT_REP = ?,
        HBD_REP = ?, SMPS_REP = ?, PLC_REP = ?, ELB_REP = ?,
        Heater_REP = ?, Qtz_tank_REP = ?, Leak_troubleshooting = ?, Flow_meter_REP = ?,
        Air_valve_REP = ?, Shut_off_valve_REP = ?, Sol_valve_REP = ?, Elbow_fitting_REP = ?,
        Leak_tray = ?, TC_Sensor = ?,
        Touch_panel_patch = ?, PLC_patch = ?, Touch_panel_REP = ?, PLC_REP_SW = ?
      WHERE name = ?
    `;

    const values = [
      checklistData.OD_REP, checklistData.Relay_REP, checklistData.Fan_REP, checklistData.NTC_NTU_REP,
      checklistData.SSR_REP, checklistData.MC_REP, checklistData.Fuse_REP, checklistData.CT_REP,
      checklistData.HBD_REP, checklistData.SMPS_REP, checklistData.PLC_REP, checklistData.ELB_REP,
      checklistData.Heater_REP, checklistData.Qtz_tank_REP, checklistData.Leak_troubleshooting, checklistData.Flow_meter_REP,
      checklistData.Air_valve_REP, checklistData.Shut_off_valve_REP, checklistData.Sol_valve_REP, checklistData.Elbow_fitting_REP,
      checklistData.Leak_tray, checklistData.TC_Sensor,
      checklistData.Touch_panel_patch, checklistData.PLC_patch, checklistData.Touch_panel_REP, checklistData.PLC_REP_SW,
      checklistData.name
    ];

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error updating checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

// 이름으로 체크리스트 조회
exports.getChecklistByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM HDW_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

// 전체 체크리스트 조회
exports.getAllChecklists = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM HDW_MAINT_SELF`;
    const [rows] = await connection.query(query);
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  } finally {
    connection.release();
  }
};
