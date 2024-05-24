const workLogDao = require('../dao/workLogDao');

// 모든 작업 이력 조회
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
  const {
    task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time, none_time, move_time,
    group, site, line, equipment_type, equipment_name, workType, setupItem
  } = req.body;
  
  try {
    await workLogDao.addWorkLog(
      task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time, none_time, move_time,
      group, site, line, equipment_type, equipment_name, workType, setupItem
    );
    res.status(201).json({ message: "Work log added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 로그인한 사용자의 작업 내역 조회
exports.getUserWorkLogs = async (req, res) => {
  const { nickname } = req.verifiedToken;

  try {
    const logs = await workLogDao.getUserWorkLogs(nickname);
    if (logs.length > 0) {
      const workCount = logs.length;
      const totalDuration = logs.reduce((total, log) => {
        const duration = log.task_duration ? log.task_duration.split(':') : [0, 0, 0];
        return total + parseInt(duration[0]) * 3600 + parseInt(duration[1]) * 60 + parseInt(duration[2]);
      }, 0);

      const totalHours = Math.floor(totalDuration / 3600);
      const totalMinutes = Math.floor((totalDuration % 3600) / 60);
      const totalSeconds = totalDuration % 60;

      return res.send({
        isSuccess: true,
        code: 200,
        message: "작업 내역 조회 성공",
        result: {
          workCount,
          totalDuration: `${totalHours}시간 ${totalMinutes}분 ${totalSeconds}초`
        }
      });
    } else {
      return res.send({
        isSuccess: false,
        code: 404,
        message: "작업 내역이 없습니다."
      });
    }
  } catch (err) {
    console.error(`getUserWorkLogs Query error\n: ${JSON.stringify(err)}`);
    return res.status(500).json({
      isSuccess: false,
      code: 500,
      message: "서버 오류가 발생했습니다."
    });
  }
};
