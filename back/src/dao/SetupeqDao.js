const { pool } = require("../../config/database");

// 모든 설비 목록 가져오기
exports.getAllEquipment = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT * FROM SETUP_EQUIPMENT ORDER BY create_at DESC"; // 모든 컬럼 가져오기
        const [rows] = await connection.query(query);
        return rows;
    } catch (err) {
        throw new Error(`Error fetching equipment: ${err.message}`);
    } finally {
        connection.release();
    }
};

// 특정 설비의 SET UP 진행 상태 가져오기
exports.getEquipmentById = async (id) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT * FROM SETUP_EQUIPMENT WHERE id = ?"; // 모든 컬럼 가져오기
        const [rows] = await connection.query(query, [id]);
        return rows[0]; // ID가 고유하므로 한 개의 결과만 반환
    } catch (err) {
        throw new Error(`Error fetching equipment status: ${err.message}`);
    } finally {
        connection.release();
    }
};

// 특정 설비 작업 상태 업데이트
exports.updateEquipmentById = async (id, updates) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        // 업데이트할 필드 생성
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(", ");
        const values = Object.values(updates);
        const query = `UPDATE SETUP_EQUIPMENT SET ${fields}, update_at = NOW() WHERE id = ?`;

        const [result] = await connection.query(query, [...values, id]);
        return result;
    } catch (err) {
        throw new Error(`Error updating equipment: ${err.message}`);
    } finally {
        connection.release();
    }
};
