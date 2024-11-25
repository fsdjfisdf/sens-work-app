const { pool } = require('../../config/database');

exports.getSignalData = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const [rows] = await connection.query('SELECT * FROM equipment');
        connection.release();
        return rows; // rows에 필요한 모든 필드가 포함되어 있는지 확인
    } catch (err) {
        connection.release();
        throw new Error(`Error retrieving signal data: ${err.message}`);
    }
};

exports.updateSignalData = async (eqname, info) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        await connection.query('UPDATE work_log_db.equipment SET INFO = ? WHERE EQNAME = ?', [info, eqname]);
        connection.release();
    } catch (err) {
        connection.release();
        throw new Error(`Error updating signal data: ${err.message}`);
    }
};

