const { pool } = require('../../config/database');

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

exports.findByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM GENEVA_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error finding entry by name: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.insertChecklist = async (data) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const fields = [
      'name', 'LP_Escort', 'Robot_Escort', 'SR8240_Teaching', 'GENMARK_Robot_Teaching', 'SR8240_Robot_REP',
      'GENMARK_Robot_REP', 'Robot_Controller_REP', 'FFU_Controller', 'Fan', 'Motor_Driver', 'Elbow_heater',
      'Insulation_heater', 'Chuck_heater', 'Harmonic_driver', 'Amplifier', 'Disc_bearing', 'Chuck_leveling',
      'Wafer_support_pin_alignment', 'Temp_profile', 'O2_leak_test', 'Chuck_up_down_status', 'Ring_seal',
      'Door_seal', 'Ring_seal_O_ring', 'Door_seal_O_ring', 'Gas_Box_Board', 'Temp_Controller_Board',
      'Power_Distribution_Board', 'DC_Power_Supply', 'Facility_Board', 'Station_Board', 'Bubbler_Board',
      'D_NET', 'MFC', 'Valve', 'O2_analyzer_replace', 'O2_controller_replace', 'O2_pump_replace',
      'O2_cell_replace', 'O2_Sample_valve', 'Feed_Delivery_valve', 'Fill_Vent_valve', 'Drain_valve',
      'APC_valve', 'Bypass_valve', 'Shutoff_valve', 'Vac_sol_valve', 'Vac_CDA_valve',
      'Bubbler_level_sensor', 'Bubbler_flexible_hose', "Baratron_Assy", 'View_Port', 'Flow_Switch',
      'LL_Door_cylinder', 'Chuck_cylinder', 'Monitor', 'Keyboard', 'Mouse', 'Water_Leak_Detector',
      'Formic_Detector', 'Exhaust_gauge', 'CTC', 'EDA', 'Temp_Limit_Controller', 'Temp_Controller', 'SW_Patch'
    ];

    const placeholders = fields.map(() => '?').join(', ');
    const query = `INSERT INTO GENEVA_MAINT_SELF (${fields.join(', ')}) VALUES (${placeholders})`;
    const values = fields.map(f => data[f]);

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error inserting checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.updateChecklist = async (data) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const fields = [
      'LP_Escort', 'Robot_Escort', 'SR8240_Teaching', 'GENMARK_Robot_Teaching', 'SR8240_Robot_REP',
      'GENMARK_Robot_REP', 'Robot_Controller_REP', 'FFU_Controller', 'Fan', 'Motor_Driver', 'Elbow_heater',
      'Insulation_heater', 'Chuck_heater', 'Harmonic_driver', 'Amplifier', 'Disc_bearing', 'Chuck_leveling',
      'Wafer_support_pin_alignment', 'Temp_profile', 'O2_leak_test', 'Chuck_up_down_status', 'Ring_seal',
      'Door_seal', 'Ring_seal_Oring', 'Door_seal_Oring', 'Gas_Box_Board', 'Temp_Controller_Board',
      'Power_Distribution_Board', 'DC_Power_Supply', 'Facility_Board', 'Station_Board', 'Bubbler_Board',
      'D_NET', 'MFC', 'Valve', 'O2_analyzer_replace', 'O2_controller_replace', 'O2_pump_replace',
      'O2_cell_replace', 'O2_Sample_valve', 'Feed_Delivery_valve', 'Fill_Vent_valve', 'Drain_valve',
      'APC_valve', 'Bypass_valve', 'Shutoff_valve', 'Vac_sol_valve', 'Vac_CDA_valve',
      'Bubbler_level_sensor', 'Bubbler_flexible_hose', "Baratron_Assy", 'View_Port', 'Flow_Switch',
      'LL_Door_cylinder', 'Chuck_cylinder', 'Monitor', 'Keyboard', 'Mouse', 'Water_Leak_Detector',
      'Formic_Detector', 'Exhaust_gauge', 'CTC', 'EDA', 'Temp_Limit_Controller', 'Temp_Controller', 'SW_Patch'
    ];

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const query = `UPDATE GENEVA_MAINT_SELF SET ${setClause} WHERE name = ?`;
    const values = fields.map(f => data[f]);
    values.push(data.name);

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error updating checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.getChecklistByName = async (name) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM GENEVA_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error retrieving checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

console.log("✅ Exported DAO functions:", Object.keys(module.exports));