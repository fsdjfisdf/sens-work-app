const { pool } = require('../../config/database');

exports.getSignalData = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const [rows] = await connection.query('SELECT * FROM equipment');
        connection.release();
        return rows;
    } catch (err) {
        connection.release();
        throw new Error(`Error retrieving signal data: ${err.message}`);
    }
};

exports.updateSignalData = async (id, info) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        await connection.query('UPDATE equipment SET INFO = ? WHERE EQNAME = ?', [info, eqname]);
        connection.release();
    } catch (err) {
        connection.release();
        throw new Error(`Error updating signal data: ${err.message}`);
    }
};
