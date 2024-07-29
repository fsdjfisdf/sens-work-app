const { pool } = require('../database');

exports.getEquipment = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const [rows] = await connection.query('SELECT * FROM Equipment');
        connection.release();
        return rows;
    } catch (err) {
        connection.release();
        throw new Error(`Error retrieving equipment data: ${err.message}`);
    }
};
