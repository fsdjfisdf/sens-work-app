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
  const { task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time } = req.body;
  console.log('요청 데이터:', req.body); // 서버 로그에 요청 데이터 출력
  try {
    await workLogDao.addWorkLog(task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time);
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    console.error('작업 로그 추가 중 오류:', err); // 서버 로그에 오류 출력
    res.status(500).json({ error: err.message });
  }
};
