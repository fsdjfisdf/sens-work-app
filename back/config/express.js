const express = require("express");
const compression = require("compression");
const methodOverride = require("method-override");
const cors = require("cors");
const path = require("path");
const { pool } = require("./database");
const { logger } = require("./winston");

module.exports = function () {
  const app = express();

  /* 미들웨어 설정 */
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride());

  // CORS 설정
  const corsOptions = {
    origin: '*', // 모든 도메인에서의 요청을 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
  };
  app.use(cors(corsOptions));

  // 정적 파일 경로 설정
  app.use(express.static(path.join(__dirname, '../../front')));
  app.use(express.static(path.join(__dirname, '../../front/css')));
  app.use(express.static(path.join(__dirname, '../../front/js')));

  app.get("/", (req, res) => {
    res.redirect("/signin.html");
  });

  /* 라우트 설정 */
  require("../src/routes/indexRoute")(app);
  require("../src/routes/supraMaintenanceRoute")(app);
  require("../src/routes/supraSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/worklogRoute")(app); // 작업 로그 라우트 추가

  // 회원가입
  app.post('/sign-up', async (req, res) => {
    const { userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa } = req.body;

    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE userID = ?', [userID]);

      if (rows.length > 0) {
        return res.status(400).json({ message: '이미 존재하는 userID입니다.' });
      }

      const query = 'INSERT INTO users (userID, password, nickname, `group`, site, level, hire_date, main_set_up_capa, main_maint_capa, main_capa, multi_set_up_capa, multi_maint_capa, multi_capa, total_capa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      await pool.query(query, [userID, password, nickname, group, site, level, hireDate, mainSetUpCapa, mainMaintCapa, mainCapa, multiSetUpCapa, multiMaintCapa, multiCapa, totalCapa]);

      res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
    } catch (err) {
      logger.error('회원가입 중 오류 발생:', err.message);
      res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
    }
  });

  // 작업 로그 추가
  app.post('/log', async (req, res) => {
    logger.info('POST /log 요청 수신됨');
    logger.info('요청 바디:', req.body);
    const { task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, workType, setupItem, maintItem, transferItem, task_maint, status } = req.body;

    logger.info('maint_item 값:', maintItem);
    logger.info('setupItem 값:', setupItem);
    logger.info('SOP 값:', SOP);
    logger.info('task_maint 값:', task_maint);
    logger.info('transferItem 값:', transferItem);

    const taskResult = task_result || '';
    const taskCause = task_cause || '';
    const taskMan = task_man || '';
    const taskDescription = task_description || '';
    const taskDate = task_date || '1970-01-01';
    const startTime = start_time || '00:00:00';
    const endTime = end_time || '00:00:00';
    const noneTime = none_time || 0;
    const moveTime = move_time || 0;
    const taskGroup = group || 'SELECT';
    const taskSite = site || 'SELECT';
    const taskSOP = SOP || 'SELECT';
    const tasktsguide = tsguide || 'SELECT';
    const taskLine = line || 'SELECT';
    const taskWarranty = warranty || 'SELECT';
    const taskEquipmentType = equipment_type || 'SELECT';
    const taskEquipmentName = equipment_name || '';
    const taskWorkType = workType || 'SELECT';
    const taskSetupItem = setupItem || 'SELECT';
    const taskMaintItem = maintItem || 'SELECT';
    const taskTransferItem = transferItem || 'SELECT';
    const taskStatus = status || 'active';
    const taskMaint = task_maint || 'SELECT';

    logger.info('수정된 요청 데이터:', {
      task_name,
      taskResult,
      taskCause,
      taskMan,
      taskDescription,
      taskDate,
      startTime,
      endTime,
      noneTime,
      moveTime,
      taskGroup,
      taskSite,
      taskSOP,
      tasktsguide,
      taskLine,
      taskWarranty,
      taskEquipmentType,
      taskEquipmentName,
      taskWorkType,
      taskSetupItem,
      taskMaintItem,
      taskTransferItem,
      taskStatus,
      taskMaint
    });

    try {
      const query = `
        INSERT INTO work_log 
        (task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, \`group\`, site, SOP, tsguide, \`line\`, warranty, equipment_type, equipment_name, work_type, setup_item, maint_item, transfer_item, status, task_maint) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        task_name,
        taskResult,
        taskCause,
        taskMan,
        taskDescription,
        taskDate,
        startTime,
        endTime,
        noneTime,
        moveTime,
        taskGroup,
        taskSite,
        taskSOP,
        tasktsguide,
        taskLine,
        taskWarranty,
        taskEquipmentType,
        taskEquipmentName,
        taskWorkType,
        taskSetupItem,
        taskMaintItem,
        taskTransferItem,
        taskStatus,
        taskMaint
      ];

      logger.info('실행할 쿼리:', query);
      logger.info('쿼리 값:', values);

      await pool.execute(query, values);

      logger.info('작업 로그가 성공적으로 추가되었습니다.');
      res.status(201).send('작업 로그가 성공적으로 추가되었습니다.');
    } catch (err) {
      logger.error('작업 로그 추가 중 오류 발생:', err.message);
      res.status(500).send('작업 로그 추가 중 오류가 발생했습니다.');
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
      logger.error('작업 이력 목록 조회 중 오류 발생:', err.message);
      res.status(500).send('작업 이력 목록 조회 중 오류가 발생했습니다.');
    }
  });

  // 작업 이력 삭제
  app.delete('/logs/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM work_log WHERE id = ?', [id]);
      res.status(200).send('작업 이력이 성공적으로 삭제되었습니다.');
    } catch (err) {
      res.status(500).send('작업 이력 삭제 중 오류가 발생했습니다.');
    }
  });

  return app;
};
