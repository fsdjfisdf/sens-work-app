const { pool } = require("../../config/database");

// 모든 설비 목록 가져오기
exports.getAllEquipment = async () => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT id, EQNAME, `GROUP`, SITE FROM SETUP_EQUIPMENT ORDER BY create_at DESC";
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
        const query = `
            SELECT 
                id, EQNAME, INSTALLATION_PREPARATION_PERCENT, FAB_IN_PERCENT, DOCKING_PERCENT, 
                CABLE_HOOK_UP_PERCENT, POWER_TURN_ON_PERCENT, UTILITY_TURN_ON_PERCENT, 
                GAS_TURN_ON_PERCENT, TEACHING_PERCENT, PART_INSTALLATION_PERCENT, 
                LEAK_CHECK_PERCENT, TTTM_PERCENT, CUSTOMER_CERTIFICATION_PERCENT, COMPLETE 
            FROM SETUP_EQUIPMENT
            WHERE id = ?
        `;
        const [rows] = await connection.query(query, [id]);
        return rows[0]; // ID가 고유하므로 한 개의 결과만 반환
    } catch (err) {
        throw new Error(`Error fetching equipment status: ${err.message}`);
    } finally {
        connection.release();
    }
};
