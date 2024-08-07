const workLogDao = require('../dao/workLogDao');


exports.getWorkLogs = async (req, res) => {
    try {
        const logs = await workLogDao.getWorkLogs();
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addWorkLog = async (req, res) => {
    const {
        task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
        group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, workType, setupItem, maintItem, transferItem, task_maint, status
    } = req.body;

    try {
        await workLogDao.addWorkLog(
            task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
            group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, workType, setupItem, maintItem, transferItem, task_maint, status
        );
        res.status(201).json({ message: "Work log added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteWorkLog = async (req, res) => {
    const { id } = req.params;
    try {
        await workLogDao.deleteWorkLog(id);
        res.status(200).json({ message: "Work log deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.exportWorkLogs = async (req, res) => {
    try {
        const logs = await workLogDao.getWorkLogs();

        // Work logs 데이터를 시트에 추가
        const worksheet = xlsx.utils.json_to_sheet(logs);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Work Logs');

        // 파일을 임시 디렉토리에 저장
        const filePath = path.join(__dirname, '../temp', 'work_logs.xlsx');
        xlsx.writeFile(workbook, filePath);

        // 파일을 클라이언트에 전송
        res.download(filePath, 'work_logs.xlsx', err => {
            if (err) {
                console.error('Error downloading the file:', err);
            }

            // 다운로드 후 파일 삭제
            fs.unlinkSync(filePath);
        });
    } catch (err) {
        console.error('Error exporting work logs:', err);
        res.status(500).send('Error exporting work logs');
    }
};

exports.updateWorkLog = async (req, res) => {
    const { id } = req.params;
    const {
        task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time,
        group, site, line, warranty, equipment_type, equipment_name, status
    } = req.body;

    console.log(`Received update request for ID: ${id}`);
    console.log('Updated log data:', req.body);

    try {
        const existingLog = await workLogDao.getWorkLogById(id);
        if (!existingLog) {
            return res.status(404).json({ error: "Log not found" });
        }

        await workLogDao.updateWorkLog(
            id,
            task_name !== undefined ? task_name : existingLog.task_name,
            task_result !== undefined ? task_result : existingLog.task_result,
            task_cause !== undefined ? task_cause : existingLog.task_cause,
            task_man !== undefined ? task_man : existingLog.task_man,
            task_description !== undefined ? task_description : existingLog.task_description,
            task_date !== undefined ? task_date : existingLog.task_date,
            start_time !== undefined ? start_time : existingLog.start_time,
            end_time !== undefined ? end_time : existingLog.end_time,
            group !== undefined ? group : existingLog.group,
            site !== undefined ? site : existingLog.site,
            line !== undefined ? line : existingLog.line,
            warranty !== undefined ? warranty : existingLog.warranty,
            equipment_type !== undefined ? equipment_type : existingLog.equipment_type,
            equipment_name !== undefined ? equipment_name : existingLog.equipment_name,
            status !== undefined ? status : existingLog.status
        );
        res.status(200).json({ message: "Work log updated" });
    } catch (err) {
        console.error(`Error updating work log with ID: ${id}`, err);
        res.status(500).json({ error: err.message });
    }
};
