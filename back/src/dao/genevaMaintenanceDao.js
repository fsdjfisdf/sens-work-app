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
      'name', 'LP_Escort', 'Robot_Escort',
            'SR8240_Teaching', 'GENMARK_Robot_Teaching', 'SR8240_Robot_REP', 'GENMARK_Robot_REP', 'Robot_Controller_REP',
            'FFU_Controller', 'Fan', 'Motor_Driver',
            'Elbow_Heater', 'Insulation_Heater', 'Chuck_Heater',
            'Harmonic_Driver', 'Amplifier', 'Disc_Bearing', 'Chuck_Leveling', 'Wafer_Support_Pin_Alignment', 'Temp_Profile',
            'O2_Leak_Test', 'Chuck_Up_Down_Status',
            'Ring_Seal', 'Door_Seal', 'Ring_seal_Oring', 'Door_seal_Oring',
            'Gas_Box_Board', 'Temp_Controller_Board', 'Power_Distribution_Board', 'DC_Power_Supply',
            'Facility_Board', 'Station_Board', 'Bubbler_Board', 'D_NET',
            'MFC', 'Valve',
            'O2_Analyzer', 'O2_Controller', 'O2_Pump', 'O2_Cell', 'O2_Sample_Valve',
            'Feed_Delivery_Valve', 'Fill_Vent_Valve', 'Drain_Valve', 'APC_Valve', 'Bypass_Valve', 'Shutoff_Valve', 'Vac_Sol_Valve', 'Vac_CDA_Valve',
            'Bubbler_Level_Sensor', 'Bubbler_Flexible_Hose',
            'Baratron_Assy', 'View_Port', 'Flow_Switch', 'LL_Door_Cylinder', 'Chuck_Cylinder',
            'Monitor', 'Keyboard', 'Mouse', 'Water_Leak_Detector', 'Formic_Detector', 'Exhaust_Gauge',
            'CTC', 'EDA', 'Temp_Limit_Controller', 'Temp_Controller',
            'SW_Patch'
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
            'LP_Escort', 'Robot_Escort',
            'SR8240_Teaching', 'GENMARK_Robot_Teaching', 'SR8240_Robot_REP', 'GENMARK_Robot_REP', 'Robot_Controller_REP',
            'FFU_Controller', 'Fan', 'Motor_Driver',
            'Elbow_Heater', 'Insulation_Heater', 'Chuck_Heater',
            'Harmonic_Driver', 'Amplifier', 'Disc_Bearing', 'Chuck_Leveling', 'Wafer_Support_Pin_Alignment', 'Temp_Profile',
            'O2_Leak_Test', 'Chuck_Up_Down_Status',
            'Ring_Seal', 'Door_Seal', 'Ring_seal_Oring', 'Door_seal_Oring',
            'Gas_Box_Board', 'Temp_Controller_Board', 'Power_Distribution_Board', 'DC_Power_Supply',
            'Facility_Board', 'Station_Board', 'Bubbler_Board', 'D_NET',
            'MFC', 'Valve',
            'O2_Analyzer', 'O2_Controller', 'O2_Pump', 'O2_Cell', 'O2_Sample_Valve',
            'Feed_Delivery_Valve', 'Fill_Vent_Valve', 'Drain_Valve', 'APC_Valve', 'Bypass_Valve', 'Shutoff_Valve', 'Vac_Sol_Valve', 'Vac_CDA_Valve',
            'Bubbler_Level_Sensor', 'Bubbler_Flexible_Hose',
            'Baratron_Assy', 'View_Port', 'Flow_Switch', 'LL_Door_Cylinder', 'Chuck_Cylinder',
            'Monitor', 'Keyboard', 'Mouse', 'Water_Leak_Detector', 'Formic_Detector', 'Exhaust_Gauge',
            'CTC', 'EDA', 'Temp_Limit_Controller', 'Temp_Controller',
            'SW_Patch'
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

exports.getAllChecklists = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `SELECT * FROM GENEVA_MAINT_SELF`;
    const [rows] = await connection.query(query);
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  } finally {
    connection.release();
  }
};
