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
        // 업데이트할 필드와 값 정리
        const fields = Object.keys(updates).map(key => {
            // 날짜 필드라면 빈 값 (`""`)을 `NULL`로 변환
            if (key.endsWith("_DATE") && updates[key] === "") {
                return `${key} = NULL`;
            }
            return `${key} = ?`;
        }).join(", ");

        // `NULL` 처리를 위해 배열 필터링 (빈 문자열 값 제거)
        const values = Object.values(updates).filter(value => value !== "");

        // 최종 SQL 실행
        const query = `UPDATE SETUP_EQUIPMENT SET ${fields}, update_at = NOW() WHERE id = ?`;
        values.push(id); // ID 추가

        const [result] = await connection.query(query, values);
        return result;
    } catch (err) {
        throw new Error(`Error updating equipment: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.checkEquipmentExists = async (eqname) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT COUNT(*) AS count FROM SETUP_EQUIPMENT WHERE EQNAME = ?";
        const [rows] = await connection.query(query, [eqname]);
        return rows[0].count > 0;
    } catch (err) {
        throw new Error(`Error checking equipment existence: ${err.message}`);
    } finally {
        connection.release();
    }
};

// ✅ SETUP_EQUIPMENT 테이블에 새 설비 추가
exports.addEquipment = async ({ EQNAME, GROUP, SITE, LINE, TYPE }) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = `
        INSERT INTO SETUP_EQUIPMENT (
            EQNAME, \`GROUP\`, SITE, \`LINE\`, \`TYPE\`, 
            INSTALLATION_PREPARATION_COMPANY, FAB_IN_COMPANY, DOCKING_COMPANY,
            CABLE_HOOK_UP_COMPANY, POWER_TURN_ON_COMPANY, UTILITY_TURN_ON_COMPANY, 
            GAS_TURN_ON_COMPANY, TEACHING_COMPANY, PART_INSTALLATION_COMPANY, 
            LEAK_CHECK_COMPANY, TTTM_COMPANY, CUSTOMER_CERTIFICATION_COMPANY,
            INSTALLATION_PREPARATION_PERCENT, FAB_IN_PERCENT, DOCKING_PERCENT,
            CABLE_HOOK_UP_PERCENT, POWER_TURN_ON_PERCENT, UTILITY_TURN_ON_PERCENT, 
            GAS_TURN_ON_PERCENT, TEACHING_PERCENT, PART_INSTALLATION_PERCENT, 
            LEAK_CHECK_PERCENT, TTTM_PERCENT, CUSTOMER_CERTIFICATION_PERCENT,
            INSTALLATION_PREPARATION_DATE, FAB_IN_DATE, DOCKING_DATE, 
            CABLE_HOOK_UP_DATE, POWER_TURN_ON_DATE, UTILITY_TURN_ON_DATE,
            GAS_TURN_ON_DATE, TEACHING_DATE, PART_INSTALLATION_DATE,
            LEAK_CHECK_DATE, TTTM_DATE, CUSTOMER_CERTIFICATION_DATE,
            COMPLETE, create_at, update_at
        ) VALUES (
            ?, ?, ?, ?, ?, 
            '', '', '', '', '', '', '', '', '', '', '', '', '',
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
            NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
            'ING', NOW(), NOW()
        )`;

        const [result] = await connection.query(query, [EQNAME, GROUP, SITE, LINE, TYPE]);
        return result;
    } catch (err) {
        throw new Error(`설비 추가 오류: ${err.message}`);
    } finally {
        connection.release();
    }
};

exports.getEquipmentByName = async (eqname) => {
    const connection = await pool.getConnection(async conn => conn);
    try {
        const query = "SELECT * FROM SETUP_EQUIPMENT WHERE EQNAME = ?";
        const [rows] = await connection.query(query, [eqname]);
        return rows.length > 0 ? rows[0] : null; // ✅ 설비가 없으면 null 반환
    } catch (err) {
        throw new Error(`Error fetching equipment: ${err.message}`);
    } finally {
        connection.release();
    }
};
