const { pool } = require('../../config/database');

// 특정 장비의 정보 가져오기
exports.getEquipmentByName = async (eqName) => {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        const query = 'SELECT * FROM Equipment WHERE EQNAME = ?';
        const [rows] = await connection.query(query, [eqName]);
        connection.release();
        return rows[0]; // 첫 번째 결과 반환
    } catch (err) {
        connection.release();
        console.error(`Error fetching equipment info for ${eqName}:`, err);
        throw err;
    }
};

// 특정 장비의 INFO 수정
exports.updateEquipmentInfo = async (eqName, INFO) => {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        const query = 'UPDATE Equipment SET INFO = ? WHERE EQNAME = ?';
        const [result] = await connection.query(query, [INFO, eqName]);
        connection.release();
        return result.affectedRows > 0; // 업데이트 성공 여부 반환
    } catch (err) {
        connection.release();
        console.error(`Error updating INFO for ${eqName}:`, err);
        throw err;
    }
};
