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
    group, site, line, warranty, equipment_type, equipment_name, workType, setupItem, status
  } = req.body;
  
  try {
    await workLogDao.addWorkLog(
      task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
      group, site, line, warranty, equipment_type, equipment_name, workType, setupItem, status
    );
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};