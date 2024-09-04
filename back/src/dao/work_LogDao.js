const { pool } = require('../config/database');

exports.getWorkLogs = async (equipment_name) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        let query = 'SELECT * FROM work_log';
        const values = [];
        if (equipment_name) {
            query += ' WHERE equipment_name = ?';
            values.push(equipment_name);
        }
        query += ' ORDER BY task_date DESC, id DESC';
        const [rows] = await connection.query(query, values);
        connection.release();
        return rows;
    } catch (err) {
        connection.release();
        throw new Error(`Error retrieving work logs: ${err.message}`);
    }
};

// 나머지 메서드는 변경 없이 그대로 유지


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


exports.getWorkLogById = async (id) => {
  const connection = await pool.getConnection(async conn => conn);
  try {
      const [rows] = await connection.query('SELECT * FROM work_log WHERE id = ?', [id]);
      connection.release();
      return rows[0];
  } catch (err) {
      connection.release();
      throw new Error(`Error retrieving work log: ${err.message}`);
  }
};


exports.updateWorkLog = async (id, task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time,
  group, site, line, warranty, equipment_type, equipment_name, status) => {

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
  if (group !== undefined) { fields.push("`group` = ?"); values.push(group); }
  if (site !== undefined) { fields.push("site = ?"); values.push(site); }
  if (line !== undefined) { fields.push("`line` = ?"); values.push(line); }
  if (warranty !== undefined) { fields.push("warranty = ?"); values.push(warranty); }
  if (equipment_type !== undefined) { fields.push("equipment_type = ?"); values.push(equipment_type); }
  if (equipment_name !== undefined) { fields.push("equipment_name = ?"); values.push(equipment_name); }
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



// 작업 이력 카운트 증가 기능
exports.incrementTaskCount = async (engineer_name, task_name) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
            INSERT INTO task_count (engineer_name, \`${task_name}\`)
            VALUES (?, 1)
            ON DUPLICATE KEY UPDATE \`${task_name}\` = \`${task_name}\` + 1
        `;
        await connection.query(query, [engineer_name]);
    } catch (err) {
        throw new Error(`Error updating task count: ${err.message}`);
    } finally {
        connection.release();
    }
};
