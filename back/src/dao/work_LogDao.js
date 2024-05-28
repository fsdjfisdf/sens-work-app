const { pool } = require('../config/database');

exports.getWorkLogs = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await connection.query(`SELECT * FROM work_log`);
    connection.release();
    return rows;
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving work logs: ${err.message}`);
  }
};

exports.addWorkLog = async (task_name, worker, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, group, site, line, equipment_type, equipment_name, work_type, setup_item, status) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO work_log (
        task_name, worker, task_result, task_cause, task_man, task_man, task_description, task_date, start_time, end_time, none_time, move_time, \`group\`, site, line, equipment_type, equipment_name, work_type, setup_item, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [task_name, worker, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, group, site, line, equipment_type, equipment_name, work_type, setup_item, status];
    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error adding work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

