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
    const query = `SELECT * FROM PRECIA_MAINT_SELF WHERE name = ?`;
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
        INSERT INTO PRECIA_MAINT_SELF (
          name, PM_CENTERING, PM_CLN, EFEM_ROBOT_TEACHING, TM_ROBOT_TEACHING,
          PM_SLOT_VALVE_REP, PM_PEEK_PLATE_REP, PM_RF_MATCHER_REP, \`2PT_CAL\`,
          GAP_BALL_TEACHING, PM_PIN_HOLDER_REP, PIN_TEACHING, CHUCK_TEACHING,
          PM_GDP_REP, PM_ISO_RING_REP, PM_EXHAUST_RING_REP, PM_OUTER_REP
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const values = [
        checklistData.name,
        checklistData.PM_CENTERING,
        checklistData.PM_CLN,
        checklistData.EFEM_ROBOT_TEACHING,
        checklistData.TM_ROBOT_TEACHING,
        checklistData.PM_SLOT_VALVE_REP,
        checklistData.PM_PEEK_PLATE_REP,
        checklistData.PM_RF_MATCHER_REP,
        checklistData['2PT_CAL'],
        checklistData.GAP_BALL_TEACHING,
        checklistData.PM_PIN_HOLDER_REP,
        checklistData.PIN_TEACHING,
        checklistData.CHUCK_TEACHING,
        checklistData.PM_GDP_REP,
        checklistData.PM_ISO_RING_REP,
        checklistData.PM_EXHAUST_RING_REP,
        checklistData.PM_OUTER_REP
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
        UPDATE PRECIA_MAINT_SELF SET
          PM_CENTERING = ?,
          PM_CLN = ?,
          EFEM_ROBOT_TEACHING = ?,
          TM_ROBOT_TEACHING = ?,
          PM_SLOT_VALVE_REP = ?,
          PM_PEEK_PLATE_REP = ?,
          PM_RF_MATCHER_REP = ?,
          \`2PT_CAL\` = ?,
          GAP_BALL_TEACHING = ?,
          PM_PIN_HOLDER_REP = ?,
          PIN_TEACHING = ?,
          CHUCK_TEACHING = ?,
          PM_GDP_REP = ?,
          PM_ISO_RING_REP = ?,
          PM_EXHAUST_RING_REP = ?,
          PM_OUTER_REP = ?
        WHERE name = ?
      `;
  
      const values = [
        checklistData.PM_CENTERING,
        checklistData.PM_CLN,
        checklistData.EFEM_ROBOT_TEACHING,
        checklistData.TM_ROBOT_TEACHING,
        checklistData.PM_SLOT_VALVE_REP,
        checklistData.PM_PEEK_PLATE_REP,
        checklistData.PM_RF_MATCHER_REP,
        checklistData['2PT_CAL'],
        checklistData.GAP_BALL_TEACHING,
        checklistData.PM_PIN_HOLDER_REP,
        checklistData.PIN_TEACHING,
        checklistData.CHUCK_TEACHING,
        checklistData.PM_GDP_REP,
        checklistData.PM_ISO_RING_REP,
        checklistData.PM_EXHAUST_RING_REP,
        checklistData.PM_OUTER_REP,
        checklistData.name
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
    const query = `SELECT * FROM PRECIA_MAINT_SELF WHERE name = ?`;
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
    const query = `SELECT * FROM PRECIA_MAINT_SELF`;
    const [rows] = await connection.query(query);
    return rows; // 모든 사용자의 체크리스트 데이터를 반환
  } catch (err) {
    throw new Error(`Error retrieving all checklists: ${err.message}`);
  } finally {
    connection.release();
  }
};
