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

exports.updateSignalData = async (eqName, info) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = 'UPDATE equipment SET INFO = ? WHERE LOWER(EQNAME) = ?';
        const [result] = await connection.query(query, [info, eqName]); // EQNAME 매칭
        connection.release();
        return result; // affectedRows 포함
    } catch (err) {
        connection.release();
        throw new Error(`Error updating signal data: ${err.message}`);
    }
};
