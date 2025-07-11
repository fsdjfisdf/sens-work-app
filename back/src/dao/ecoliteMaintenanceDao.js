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
    const query = `SELECT * FROM ECOLITE_MAINT_SELF WHERE name = ?`;
    const [rows] = await connection.query(query, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`Error finding entry by name: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.insertChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO ECOLITE_MAINT_SELF (
        name, LP_Escort, Robot_Escort, SR8240_Teaching, M124V_Teaching, M124C_Teaching, EFEM_Robot_REP, EFEM_Robot_Controller_REP,
        SR8250_Teaching, SR8232_Teaching, TM_Robot_REP, TM_Robot_Controller_REP, Pin_Cylinder, Pusher_Cylinder, DRT,
        FFU_Controller, FFU_Fan, FFU_Motor_Driver, Microwave, Applicator, Applicator_Tube, Microwave_Generator,
        RF_Matcher, RF_Generator, Chuck, Toplid_Process_Kit, Chamber_Process_Kit, Helium_Detector,
        Hook_Lift_Pin, Pin_Bellows, Pin_Sensor, LM_Guide, HOOK_LIFTER_SERVO_MOTOR, Pin_Motor_Controller,
        EPD_Single, Gas_Box_Board, Power_Distribution_Board, DC_Power_Supply, BM_Sensor, PIO_Sensor, Safety_Module,
        IO_BOX, Rack_Board, D_NET, IGS_MFC, IGS_Valve, Solenoid, Fast_Vac_Valve, Slow_Vac_Valve, Slit_Door,
        APC_Valve, Shutoff_Valve, Baratron_ASSY, Pirani_ASSY, View_Port_Quartz, Flow_Switch, Monitor, Keyboard,
        Mouse, Water_Leak_Detector, Manometer, LIGHT_CURTAIN, GAS_SPRING, CTC, PMC, EDA, EFEM_CONTROLLER, SW_Patch
      ) VALUES (${Array(70).fill('?').join(', ')})
    `;

    const values = [
      checklistData.name, checklistData.LP_Escort, checklistData.Robot_Escort, checklistData.SR8240_Teaching,
      checklistData.M124V_Teaching, checklistData.M124C_Teaching, checklistData.EFEM_Robot_REP, checklistData.EFEM_Robot_Controller_REP,
      checklistData.SR8250_Teaching, checklistData.SR8232_Teaching, checklistData.TM_Robot_REP, checklistData.TM_Robot_Controller_REP,
      checklistData.Pin_Cylinder, checklistData.Pusher_Cylinder, checklistData.DRT,
      checklistData.FFU_Controller, checklistData.FFU_Fan, checklistData.FFU_Motor_Driver,
      checklistData.Microwave, checklistData.Applicator, checklistData.Applicator_Tube, checklistData.Microwave_Generator,
      checklistData.RF_Matcher, checklistData.RF_Generator, checklistData.Chuck, checklistData.Toplid_Process_Kit,
      checklistData.Chamber_Process_Kit, checklistData.Helium_Detector, checklistData.Hook_Lift_Pin, checklistData.Pin_Bellows,
      checklistData.Pin_Sensor, checklistData.LM_Guide, checklistData.HOOK_LIFTER_SERVO_MOTOR, checklistData.Pin_Motor_Controller,
      checklistData.EPD_Single, checklistData.Gas_Box_Board, checklistData.Power_Distribution_Board,
      checklistData.DC_Power_Supply, checklistData.BM_Sensor, checklistData.PIO_Sensor, checklistData.Safety_Module,
      checklistData.IO_BOX, checklistData.Rack_Board, checklistData.D_NET, checklistData.IGS_MFC, checklistData.IGS_Valve,
      checklistData.Solenoid, checklistData.Fast_Vac_Valve, checklistData.Slow_Vac_Valve, checklistData.Slit_Door,
      checklistData.APC_Valve, checklistData.Shutoff_Valve, checklistData.Baratron_ASSY, checklistData.Pirani_ASSY,
      checklistData.View_Port_Quartz, checklistData.Flow_Switch, checklistData.Monitor, checklistData.Keyboard,
      checklistData.Mouse, checklistData.Water_Leak_Detector, checklistData.Manometer, checklistData.LIGHT_CURTAIN,
      checklistData.GAS_SPRING, checklistData.CTC, checklistData.PMC, checklistData.EDA, checklistData.EFEM_CONTROLLER,
      checklistData.SW_Patch
    ];

    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error inserting checklist: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.updateChecklist = async (checklistData) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      UPDATE ECOLITE_MAINT_SELF SET
        LP_Escort = ?, Robot_Escort = ?, SR8240_Teaching = ?, M124V_Teaching = ?, M124C_Teaching = ?, EFEM_Robot_REP = ?, EFEM_Robot_Controller_REP = ?,
        SR8250_Teaching = ?, SR8232_Teaching = ?, TM_Robot_REP = ?, TM_Robot_Controller_REP = ?, Pin_Cylinder = ?, Pusher_Cylinder = ?, DRT = ?,
        FFU_Controller = ?, FFU_Fan = ?, FFU_Motor_Driver = ?, Microwave = ?, Applicator = ?, Applicator_Tube = ?, Microwave_Generator = ?,
        RF_Matcher = ?, RF_Generator = ?, Chuck = ?, Toplid_Process_Kit = ?, Chamber_Process_Kit = ?, Helium_Detector = ?,
        Hook_Lift_Pin = ?, Pin_Bellows = ?, Pin_Sensor = ?, LM_Guide = ?, HOOK_LIFTER_SERVO_MOTOR = ?, Pin_Motor_Controller = ?,
        EPD_Single = ?, Gas_Box_Board = ?, Power_Distribution_Board = ?, DC_Power_Supply = ?, BM_Sensor = ?, PIO_Sensor = ?, Safety_Module = ?,
        IO_BOX = ?, Rack_Board = ?, D_NET = ?, IGS_MFC = ?, IGS_Valve = ?, Solenoid = ?, Fast_Vac_Valve = ?, Slow_Vac_Valve = ?, Slit_Door = ?,
        APC_Valve = ?, Shutoff_Valve = ?, Baratron_ASSY = ?, Pirani_ASSY = ?, View_Port_Quartz = ?, Flow_Switch = ?, Monitor = ?, Keyboard = ?,
        Mouse = ?, Water_Leak_Detector = ?, Manometer = ?, LIGHT_CURTAIN = ?, GAS_SPRING = ?, CTC = ?, PMC = ?, EDA = ?, EFEM_CONTROLLER = ?, SW_Patch = ?
      WHERE name = ?
    `;

    const values = [
      checklistData.LP_Escort, checklistData.Robot_Escort, checklistData.SR8240_Teaching, checklistData.M124V_Teaching, checklistData.M124C_Teaching,
      checklistData.EFEM_Robot_REP, checklistData.EFEM_Robot_Controller_REP, checklistData.SR8250_Teaching, checklistData.SR8232_Teaching,
      checklistData.TM_Robot_REP, checklistData.TM_Robot_Controller_REP, checklistData.Pin_Cylinder, checklistData.Pusher_Cylinder, checklistData.DRT,
      checklistData.FFU_Controller, checklistData.FFU_Fan, checklistData.FFU_Motor_Driver, checklistData.Microwave, checklistData.Applicator,
      checklistData.Applicator_Tube, checklistData.Microwave_Generator, checklistData.RF_Matcher, checklistData.RF_Generator, checklistData.Chuck,
      checklistData.Toplid_Process_Kit, checklistData.Chamber_Process_Kit, checklistData.Helium_Detector, checklistData.Hook_Lift_Pin,
      checklistData.Pin_Bellows, checklistData.Pin_Sensor, checklistData.LM_Guide, checklistData.HOOK_LIFTER_SERVO_MOTOR, checklistData.Pin_Motor_Controller,
      checklistData.EPD_Single, checklistData.Gas_Box_Board, checklistData.Power_Distribution_Board, checklistData.DC_Power_Supply,
      checklistData.BM_Sensor, checklistData.PIO_Sensor, checklistData.Safety_Module, checklistData.IO_BOX, checklistData.Rack_Board, checklistData.D_NET,
      checklistData.IGS_MFC, checklistData.IGS_Valve, checklistData.Solenoid, checklistData.Fast_Vac_Valve, checklistData.Slow_Vac_Valve,
      checklistData.Slit_Door, checklistData.APC_Valve, checklistData.Shutoff_Valve, checklistData.Baratron_ASSY, checklistData.Pirani_ASSY,
      checklistData.View_Port_Quartz, checklistData.Flow_Switch, checklistData.Monitor, checklistData.Keyboard, checklistData.Mouse,
      checklistData.Water_Leak_Detector, checklistData.Manometer, checklistData.LIGHT_CURTAIN, checklistData.GAS_SPRING, checklistData.CTC,
      checklistData.PMC, checklistData.EDA, checklistData.EFEM_CONTROLLER, checklistData.SW_Patch, checklistData.name
    ];

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
    const query = `SELECT * FROM ECOLITE_MAINT_SELF WHERE name = ?`;
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
    const query = `SELECT * FROM ECOLITE_MAINT_SELF`;
    const [rows] = await connection.query(query);
    return rows;
  } catch (err) {
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  } finally {
    connection.release();
  }
};
