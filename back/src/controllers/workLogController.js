const work_LogDao = require('../dao/work_LogDao');

exports.getWorkLogs = async (req, res) => {
  try {
    const logs = await work_LogDao.getWorkLogs();
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addWorkLog = async (req, res) => {
  const {
    task_name, worker, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time,
    group, site, line, equipment_type, equipment_name, workType, setupItem, status
  } = req.body;

  const formattedTaskMan = task_man.map(man => `${man.name}(${man.type})`).join(', ');

  try {
    await work_LogDao.addWorkLog(
      task_name, worker, task_result, task_cause, formattedTaskMan, task_description, task_date, start_time, end_time, none_time, move_time,
      group, site, line, equipment_type, equipment_name, workType, setupItem, status
    );
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};