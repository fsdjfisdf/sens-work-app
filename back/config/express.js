const express = require("express");
const compression = require("compression");
const methodOverride = require("method-override");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { pool } = require("./database");
const { logger } = require("./winston");

module.exports = function () {
  const app = express();

  /* 미들웨어 설정 */
  app.use(compression()); // HTTP 요청을 압축 및 해제
  app.use(express.json()); // body값을 파싱
  app.use(express.urlencoded({ extended: true })); // form 으로 제출되는 값 파싱
  app.use(methodOverride()); // put, delete 요청 처리
  app.use(cors()); // 웹브라우저 cors 설정을 관리
  app.use(express.static("/home/ubuntu/food-map-dist-example/front")); // express 정적 파일 제공 (html, css, js 등..)
  app.use(express.static(path.join(__dirname, '../../front')));

  /* 직접 구현해야 하는 모듈 */
  require("../src/routes/indexRoute")(app);

  // 회원가입
app.post('/sign-up', async (req, res) => {
  const { userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa } = req.body;

  try {
    // userID 중복 확인
    const [rows] = await pool.query('SELECT * FROM users WHERE userID = ?', [userID]);

    if (rows.length > 0) {
      return res.status(400).json({ message: '이미 존재하는 userID입니다.' });
    }

    // 회원가입 처리
    const query = 'INSERT INTO users (userID, password, nickname, `group`, site, level, hire_date, main_set_up_capa, main_maint_capa, main_capa, multi_set_up_capa, multi_maint_capa, multi_capa, total_capa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await pool.query(query, [userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa]);

    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
  } catch (err) {
    logger.error('회원가입 중 오류 발생:', err);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

  // 작업 로그 추가
  app.post('/log', async (req, res) => {
    logger.info('POST /log 요청 수신됨');
    const { task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time, none_time, move_time, group, site, line, equipment_type, equipment_name, workType, setupItem } = req.body;

    const taskResult = task_result || '';
    const taskCause = task_cause || '';
    const taskDescription = task_description || '';
    const taskDate = task_date || '1970-01-01';
    const startTime = start_time || '00:00:00';
    const endTime = end_time || '00:00:00';
    const noneTime = none_time || 0;
    const moveTime = move_time || 0;
    const taskGroup = group || 'SELECT';
    const taskSite = site || 'SELECT';
    const taskLine = line || 'SELECT';
    const taskEquipmentType = equipment_type || 'SELECT';
    const taskEquipmentName = equipment_name || '';
    const taskWorkType = workType || 'SELECT';
    const taskSetupItem = setupItem || 'SELECT';

    logger.info('수정된 요청 데이터:', { task_name, worker, taskResult, taskCause, taskDescription, taskDate, startTime, endTime, noneTime, moveTime, taskGroup, taskSite, taskLine, taskEquipmentType, taskEquipmentName, taskWorkType, taskSetupItem });

    try {
      const query = `
        INSERT INTO work_log 
        (task_name, worker, task_result, task_cause, task_description, task_date, start_time, end_time, none_time, move_time, \`group\`, site, \`line\`, equipment_type, equipment_name, work_type, setup_item) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [task_name, worker, taskResult, taskCause, taskDescription, taskDate, startTime, endTime, noneTime, moveTime, taskGroup, taskSite, taskLine, taskEquipmentType, taskEquipmentName, taskWorkType, taskSetupItem];
      
      logger.info('실행할 쿼리:', query);
      logger.info('쿼리 값:', values);

      await pool.execute(query, values);

      logger.info('작업 로그가 성공적으로 추가되었습니다.');
      res.status(201).send('작업 로그가 성공적으로 추가되었습니다.');
    } catch (err) {
      logger.error('작업 로그 추가 중 오류:', err);
      res.status(500).send('작업 로그 추가 실패.');
    }
  });

  // 작업 이력 목록 조회
  app.get('/logs', async (req, res) => {
    try {
      logger.info('작업 이력 목록 요청');
      const [rows] = await pool.query('SELECT * FROM work_log');
      logger.info('작업 이력 목록:', rows);
      res.status(200).json(rows);
    } catch (err) {
      logger.error('작업 이력 목록을 가져오는 중 오류 발생:', err);
      res.status(500).send('작업 이력 목록을 가져오는 중 오류가 발생했습니다.');
    }
  });

  return app;
};