const { pool } = require('../config/database');

exports.getWorkLogs = async () => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const [rows] = await connection.query(`SELECT * FROM work_log ORDER BY task_date DESC, id DESC`);
    connection.release();
    return rows;
  } catch (err) {
    connection.release();
    throw new Error(`Error retrieving work logs: ${err.message}`);
  }
};

exports.addWorkLog = async (task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, work_type, setup_item, maint_item, transfer_item, task_maint, status) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    const query = `
      INSERT INTO work_log (
        task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, \`group\`, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, work_type, setup_item, maint_item, transfer_item, task_maint, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
      group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, work_type, setup_item, maint_item, transfer_item, task_maint, status
    ];
    await connection.query(query, values);
  } catch (err) {
    throw new Error(`Error adding work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.deleteWorkLog = async (id) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
    await connection.query('DELETE FROM work_log WHERE id = ?', [id]);
  } catch (err) {
    throw new Error(`Error deleting work log: ${err.message}`);
  } finally {
    connection.release();
  }
};

exports.updateWorkLog = async (id, task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
  group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, workType, setupItem, maintItem, transferItem, task_maint, status) => {

  const values = [
      task_name || null, task_result || null, task_cause || null, task_man || null, task_description || null, task_date || null, start_time || null, end_time || null, none_time || null, move_time || null,
      group || null, site || null, SOP || null, tsguide || null, line || null, warranty || null, equipment_type || null, equipment_name || null, workType || null, setupItem || null, maintItem || null, transferItem || null, task_maint || null, status || null, id
  ];

  console.log('작업 로그 수정 쿼리:');
  console.log('수정할 값:', values);

  try {
      const query = `
          UPDATE work_log SET
              task_name = ?, task_result = ?, task_cause = ?, task_man = ?, task_description = ?, task_date = ?, start_time = ?, end_time = ?, none_time = ?, move_time = ?,
              \`group\` = ?, site = ?, SOP = ?, tsguide = ?, \`line\` = ?, warranty = ?, equipment_type = ?, equipment_name = ?, work_type = ?, setup_item = ?, maint_item = ?, transfer_item = ?, task_maint = ?, status = ?
          WHERE id = ?
      `;
      await pool.query(query, values);
  } catch (err) {
      console.error('Error updating work log:', err.message);
      throw err;
  }
};



