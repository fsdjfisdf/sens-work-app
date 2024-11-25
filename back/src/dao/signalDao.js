const { pool } = require('../../config/database');

exports.getSignalData = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const [rows] = await connection.query('SELECT * FROM Equipment');
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
        const query = 'UPDATE Equipment SET INFO = ? WHERE LOWER(EQNAME) = LOWER(?)';
        console.log(`Executing query: ${query} with EQNAME: ${eqName}, INFO: ${info}`);
        const [result] = await connection.query(query, [info, eqName]);

        if (result.affectedRows === 0) {
            throw new Error(`No matching EQNAME found for ${eqName}`);
        }

        connection.release();
    } catch (err) {
        connection.release();
        throw new Error(`Error updating signal data: ${err.message}`);
    }
};

