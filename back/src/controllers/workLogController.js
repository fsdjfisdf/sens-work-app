const workLogDao = require('../dao/workLogDao');

// 작업 이력 조회
exports.getWorkLogs = async (req, res) => {
  try {
    const logs = await workLogDao.getWorkLogs();
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 작업 이력 추가
exports.addWorkLog = async (req, res) => {
  const { user_id, action } = req.body;
  try {
    await workLogDao.addWorkLog(user_id, action);
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
