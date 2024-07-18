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

  const fields = [];
  const values = [];

  if (task_name !== undefined) { fields.push("task_name = ?"); values.push(task_name); }
  if (task_result !== undefined) { fields.push("task_result = ?"); values.push(task_result); }
  if (task_cause !== undefined) { fields.push("task_cause = ?"); values.push(task_cause); }
  if (task_man !== undefined) { fields.push("task_man = ?"); values.push(task_man); }
  if (task_description !== undefined) { fields.push("task_description = ?"); values.push(task_description); }
  if (task_date !== undefined) { fields.push("task_date = ?"); values.push(task_date); }
  if (start_time !== undefined) { fields.push("start_time = ?"); values.push(start_time); }
  if (end_time !== undefined) { fields.push("end_time = ?"); values.push(end_time); }
  if (none_time !== undefined) { fields.push("none_time = ?"); values.push(none_time); }
  if (move_time !== undefined) { fields.push("move_time = ?"); values.push(move_time); }
  if (group !== undefined) { fields.push("`group` = ?"); values.push(group); }
  if (site !== undefined) { fields.push("site = ?"); values.push(site); }
  if (SOP !== undefined) { fields.push("SOP = ?"); values.push(SOP); }
  if (tsguide !== undefined) { fields.push("tsguide = ?"); values.push(tsguide); }
  if (line !== undefined) { fields.push("`line` = ?"); values.push(line); }
  if (warranty !== undefined) { fields.push("warranty = ?"); values.push(warranty); }
  if (equipment_type !== undefined) { fields.push("equipment_type = ?"); values.push(equipment_type); }
  if (equipment_name !== undefined) { fields.push("equipment_name = ?"); values.push(equipment_name); }
  if (workType !== undefined) { fields.push("work_type = ?"); values.push(workType); }
  if (setupItem !== undefined) { fields.push("setup_item = ?"); values.push(setupItem); }
  if (maintItem !== undefined) { fields.push("maint_item = ?"); values.push(maintItem); }
  if (transferItem !== undefined) { fields.push("transfer_item = ?"); values.push(transferItem); }
  if (task_maint !== undefined) { fields.push("task_maint = ?"); values.push(task_maint); }
  if (status !== undefined) { fields.push("status = ?"); values.push(status); }

  values.push(id);

  if (fields.length === 0) {
      throw new Error("No fields to update");
  }

  const query = `
      UPDATE work_log SET ${fields.join(', ')}
      WHERE id = ?
  `;

  console.log('작업 로그 수정 쿼리:', query);
  console.log('수정할 값:', values);

  try {
      await pool.query(query, values);
      console.log('쿼리 실행 성공');
  } catch (err) {
      console.error('Error updating work log:', err.message);
      throw err;  // 에러를 다시 던져 컨트롤러에서 잡을 수 있게 합니다.
  }
};


