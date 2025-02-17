const { pool } = require("../../config/database");

// 특정 작업 이력 조회 (id로 조회)
const getWorkLogById = async (id) => {
    try {
        const [rows] = await pool.promise().query("SELECT * FROM work_log WHERE id = ?", [id]);
        return rows[0] || null; // 단일 작업 이력 반환 (없으면 null)
    } catch (error) {
        console.error("작업 이력 조회 오류:", error);
        throw error;
    }
};

// 작업 이력 수정
const updateWorkLog = async (id, updateData) => {
    try {
        const query = `
            UPDATE work_log 
            SET task_name = ?, task_date = ?, task_man = ?, \`group\` = ?, site = ?, 
                line = ?, equipment_type = ?, warranty = ?, equipment_name = ?, 
                status = ?, task_description = ?, task_cause = ?, task_result = ?, 
                SOP = ?, tsguide = ?, work_type = ?, work_type2 = ?, setup_item = ?, 
                maint_item = ?, transfer_item = ?, start_time = ?, 
                end_time = ?, none_time = ?, move_time = ?, task_maint = ?
            WHERE id = ?
        `;

            const values = [
                updateData.task_name ?? null, updateData.task_date ?? null, updateData.task_man ?? null,
                updateData.group ?? null, updateData.site ?? null, updateData.line ?? null,
                updateData.equipment_type ?? null, updateData.warranty ?? null, updateData.equipment_name ?? null,
                updateData.status ?? null, updateData.task_description ?? null, updateData.task_cause ?? null,
                updateData.task_result ?? null, updateData.SOP ?? null, updateData.tsguide ?? null,
                updateData.work_type ?? null, updateData.work_type2 ?? null, updateData.setup_item ?? null,
                updateData.maint_item ?? null, updateData.transfer_item ?? null,
                updateData.start_time ?? null, updateData.end_time ?? null,
                updateData.none_time ?? null, updateData.move_time ?? null, updateData.task_maint ?? null, id
            ];

        const [result] = await pool.execute(query, values);
        return result;
    } catch (error) {
        console.error("작업 이력 수정 오류:", error);
        throw error;
    }
};

// 작업 이력 삭제
const deleteWorkLog = async (id) => {
    try {
        const query = `DELETE FROM work_log WHERE id = ?`;
        const [result] = await pool.execute(query, [id]);
        return result;
    } catch (error) {
        console.error("작업 이력 삭제 오류:", error);
        throw error;
    }
};


module.exports = {
    getWorkLogById,
    updateWorkLog,
    deleteWorkLog,
};
