const db = require("../config/db");

// 특정 작업 이력 조회 (id로 조회)
const getWorkLogById = (id) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM work_log WHERE id = ?`;
        db.query(query, [id], (error, results) => {
            if (error) return reject(error);
            resolve(results[0]); // 단일 작업 이력 반환
        });
    });
};

// 작업 이력 수정
const updateWorkLog = (id, updateData) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE work_log 
            SET task_name = ?, task_date = ?, task_man = ?, \`group\` = ?, site = ?, 
                line = ?, equipment_type = ?, warranty = ?, equipment_name = ?, 
                status = ?, task_description = ?, task_cause = ?, task_result = ?, 
                SOP = ?, tsguide = ?, work_type = ?, work_type2 = ?, setup_item = ?, 
                maint_item = ?, transfer_item = ?, task_duration = ?, start_time = ?, 
                end_time = ?, none_time = ?, move_time = ?, task_maint = ?
            WHERE id = ?`;

        const values = [
            updateData.task_name, updateData.task_date, updateData.task_man,
            updateData.group, updateData.site, updateData.line,
            updateData.equipment_type, updateData.warranty, updateData.equipment_name,
            updateData.status, updateData.task_description, updateData.task_cause,
            updateData.task_result, updateData.SOP, updateData.tsguide,
            updateData.work_type, updateData.work_type2, updateData.setup_item,
            updateData.maint_item, updateData.transfer_item, updateData.task_duration,
            updateData.start_time, updateData.end_time, updateData.none_time,
            updateData.move_time, updateData.task_maint, id
        ];

        db.query(query, values, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

module.exports = {
    getWorkLogById,
    updateWorkLog,
};
