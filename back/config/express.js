const express = require("express");
const compression = require("compression");
const methodOverride = require("method-override");
const cors = require("cors");
const path = require("path");
const { pool } = require("./database");
const { logger } = require("./winston");

const jwtMiddleware = require('./jwtMiddleware');
const { logPageAccess } = require('../src/controllers/indexController');

module.exports = function () {
  const app = express();

  /* 모든 요청에 대해 URL 로그를 남기는 미들웨어 */
  app.use((req, res, next) => {
    console.log(`Received request for URL: ${req.originalUrl}`);
    next();
  });

  /* 미들웨어 설정 */
  app.use(compression());

  // JSON 파서 (에러 핸들러에서 SyntaxError 처리)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride());

  // CORS 설정
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'user-role'],
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // 프리플라이트 허용

  // 정적 파일 경로 설정
  app.use(express.static(path.join(__dirname, '../../front')));
  app.use(express.static(path.join(__dirname, '../../front/css')));
  app.use(express.static(path.join(__dirname, '../../front/js')));

  // 헬스체크
  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // 루트 리다이렉트
  app.get("/", (req, res) => {
    res.redirect("/signin.html");
  });

  // readworklog 페이지 접근 로그 남기기
  app.get('/readworklog', jwtMiddleware, logPageAccess, (req, res) => {
    res.sendFile(path.join(__dirname, '../../front/readworklog.html'));
  });

  /* 라우트 설정 */
  require("../src/routes/indexRoute")(app);
  require("../src/routes/supraMaintenanceRoute")(app);
  require("../src/routes/supraxpMaintenanceRoute")(app);
  require("../src/routes/supraSetupRoute")(app);
  require("../src/routes/integerSetupRoute")(app);
  require("../src/routes/preciaSetupRoute")(app);
  require("../src/routes/ecoliteSetupRoute")(app);
  require("../src/routes/hdwSetupRoute")(app);
  require("../src/routes/genevaSetupRoute")(app);
  require("../src/routes/supraxpSetupRoute")(app);

  const signalRoute = require('../src/routes/signalRoute');
  app.use('/api/Equipment', signalRoute);

  require("../src/routes/integerMaintenanceRoute")(app);
  require("../src/routes/ecoliteMaintenanceRoute")(app);
  require("../src/routes/genevaMaintenanceRoute")(app);
  require("../src/routes/preciaMaintenanceRoute")(app);
  require("../src/routes/hdwMaintenanceRoute")(app);

  console.log("Setting up equipmentRoute...");
  require("../src/routes/equipmentRoute")(app);

  require('../src/routes/SECMRoute')(app);
  require('../src/routes/TitleRoute')(app);
  require('../src/routes/taskCountRoute')(app);

  const integerMaintCountRoute = require('../src/routes/integerMaintCountRoute');
  app.use('/api', integerMaintCountRoute);
  const ecoliteMaintCountRoute = require('../src/routes/ecoliteMaintCountRoute');
  app.use('/api', ecoliteMaintCountRoute);
  const genevaMaintCountRoute = require('../src/routes/genevaMaintCountRoute');
  app.use('/api', genevaMaintCountRoute);
  const preciaMaintCountRoute = require('../src/routes/preciaMaintCountRoute');
  app.use('/api', preciaMaintCountRoute);
  const hdwMaintCountRoute = require('../src/routes/hdwMaintCountRoute');
  app.use('/api', hdwMaintCountRoute);

  // 보고서
  const reportsRoute = require('../src/routes/reportsRoute');
  app.use('/reports', reportsRoute);

  require('../src/routes/skillRoute')(app);

  require('../src/routes/supraxpMaintCountRoute')(app);
  require('../src/routes/testRoute')(app);

  const businessRoute = require('../src/routes/businessRoute');
  app.use('/api/business', businessRoute);

  const updateRoute = require('../src/routes/updateRoute');
  app.use('/api/updates', updateRoute);

  const setupeqRoute = require("../src/routes/SetupeqRoute"); // ✅ 단일 require 유지
  app.use("/api/setup_equipment", setupeqRoute);
  app.use("/api/setupeq", setupeqRoute);

  // 작업 이력 편집 API
  const editRoutes = require("../src/routes/editRoute");
  app.use("/api", editRoutes);

  // 분석
  const analysisRoute = require('../src/routes/analysisRoute');
  app.use('/analysis', analysisRoute);

  // EMS 유상/무상 판별
  const workLogPaidRoute = require('../src/routes/workLogPaidRoute');
  app.use('/api/work-log-paid', workLogPaidRoute);

  // 스페셜리스트 라우트 묶음
  const specialistIntegerRoute = require('../src/routes/specialistIntegerRoute');
  app.use('/api/specialist/integer', specialistIntegerRoute);

  const specialistSupranRoute = require("../src/routes/specialistSupranRoute");
  app.use("/api/specialist/supran", specialistSupranRoute);

  const specialistPreciaRoute = require("../src/routes/specialistPreciaRoute");
  app.use("/api/specialist/precia", specialistPreciaRoute);

  const specialistSupraxpRoute = require("../src/routes/specialistSupraxpRoute");
  app.use("/api/specialist/supraxp", specialistSupraxpRoute);

  const specialistEcoliteRoute = require("../src/routes/specialistEcoliteRoute");
  app.use("/api/specialist/ecolite", specialistEcoliteRoute);

  const specialistGenevaRoute = require("../src/routes/specialistGenevaRoute");
  app.use("/api/specialist/geneva", specialistGenevaRoute);

  const specialistHdwRoute = require("../src/routes/specialistHdwRoute");
  app.use("/api/specialist/hdw", specialistHdwRoute);

  const specialistPreciaSetupRoute = require("../src/routes/specialistPreciaSetupRoute");
  app.use("/api/specialist/precia-setup", specialistPreciaSetupRoute);

  const specialistHdwSetupRoute = require("../src/routes/specialistHdwSetupRoute");
  app.use("/api/specialist/hdw-setup", specialistHdwSetupRoute);

  const specialistEcoliteSetupRoute = require("../src/routes/specialistEcoliteSetupRoute");
  app.use("/api/specialist/ecolite-setup", specialistEcoliteSetupRoute);

  const specialistGenevaSetupRoute = require("../src/routes/specialistGenevaSetupRoute");
  app.use("/api/specialist/geneva-setup", specialistGenevaSetupRoute);

  const specialistIntegerSetupRoute = require("../src/routes/specialistIntegerSetupRoute");
  app.use("/api/specialist/integer-setup", specialistIntegerSetupRoute);

  const specialistSupranSetupRoute = require("../src/routes/specialistSupranSetupRoute");
  app.use("/api/specialist/supran-setup", specialistSupranSetupRoute);

  const specialistSupraxpSetupRoute = require("../src/routes/specialistSupraxpSetupRoute");
  app.use("/api/specialist/supraxp-setup", specialistSupraxpSetupRoute);

  // (위쪽 아무 데서든) 한 번만 선언
  const workLogController = require('../src/controllers/workLogController');



const aiRagRoute = require('../routes/aiRagRoute');
app.use('/api/rag', aiRagRoute);

  // 권한 가드: DB ENUM에 맞게 (중복 선언 방지: 한 번만 정의)
  function requireRole(roles = ['admin', 'editor']) {
    return (req, res, next) => {
      const role = req.user?.role; // JWT에서만
      if (!role) return res.status(401).json({ message: '인증 필요' });
      if (!roles.includes(role)) return res.status(403).json({ message: '권한 없음' });
      next();
    };
  }

  // === 결재 플로우 ===
  // 결재자 목록
  app.get('/approval/approvers', jwtMiddleware, workLogController.getApproversForGroupSite);
  // 제출
  app.post('/approval/work-log/submit', jwtMiddleware, workLogController.submitWorkLogPending);
  // 목록
  app.get('/approval/work-log/pending', jwtMiddleware, workLogController.listPendingWorkLogs);
  // 반려(내 이력)
  app.get('/approval/work-log/rejected/mine', jwtMiddleware, workLogController.listMyRejected);
  // 하위호환 라우팅
  app.get('/approval/work-log/rejected', jwtMiddleware, (req, res) => {
    const mine = String(req.query.mine || '').toLowerCase();
    if (mine === '1' || mine === 'true') {
      return workLogController.listMyRejected(req, res);
    }
    return res.status(400).json({ error: '지원하지 않는 쿼리입니다. /rejected/mine 사용' });
  });
  // 상세/수정/재제출
  app.get('/approval/work-log/:id', jwtMiddleware, workLogController.getPendingWorkLogOne);
  app.patch('/approval/work-log/:id', jwtMiddleware, workLogController.updatePendingWorkLog);
  app.post('/approval/work-log/:id/resubmit', jwtMiddleware, workLogController.resubmitPendingWorkLog);
  // 승인/반려 (권한 필요)
  app.post('/approval/work-log/:id/approve', jwtMiddleware, requireRole(), workLogController.approvePendingWorkLog);
  app.post('/approval/work-log/:id/reject',  jwtMiddleware, requireRole(), workLogController.rejectPendingWorkLog);

  // PCI 라우트
  const pciSupraNRoute = require('../src/routes/pciSupraNRoute');
  app.use('/api/pci/supra-n', pciSupraNRoute);

  const pciSupraXPRoute = require('../src/routes/pciSupraXPRoute');
  app.use('/api/pci/supra-xp', pciSupraXPRoute);

  const pciIntegerRoute = require('../src/routes/pciIntegerRoute');
  app.use('/api/pci/integer', pciIntegerRoute);

  const pciPreciaRoute = require('../src/routes/pciPreciaRoute');
  app.use('/api/pci/precia', pciPreciaRoute);

  const pciGenevaRoute = require('../src/routes/pciGenevaRoute');
  app.use('/api/pci/geneva', pciGenevaRoute);

  const pciEcoliteRoute = require('../src/routes/pciEcoliteRoute');
  app.use('/api/pci/ecolite', pciEcoliteRoute);

  const pciHdwRoute = require('../src/routes/pciHdwRoute');
  app.use('/api/pci/hdw', pciHdwRoute);

  const pciPreciaSetupRoute = require("../src/routes/pciPreciaSetupRoute");
  app.use("/api/pci/precia-setup", pciPreciaSetupRoute);

  const pciSupraNSetupRoute = require("../src/routes/pciSupranSetupRoute");
  app.use("/api/pci/supran-setup", pciSupraNSetupRoute);

  const pciSupraXPSetupRoute = require("../src/routes/pciSupraxpSetupRoute");
  app.use("/api/pci/supraxp-setup", pciSupraXPSetupRoute);

  const pciIntegerSetupRoute = require("../src/routes/pciIntegerSetupRoute");
  app.use("/api/pci/integer-setup", pciIntegerSetupRoute);

  const pciEcoliteSetupRoute = require("../src/routes/pciEcoliteSetupRoute");
  app.use("/api/pci/ecolite-setup", pciEcoliteSetupRoute);

  const pciGenevaSetupRoute = require("../src/routes/pciGenevaSetupRoute");
  app.use("/api/pci/geneva-setup", pciGenevaSetupRoute);

  const pciHdwSetupRoute = require("../src/routes/pciHdwSetupRoute");
  app.use("/api/pci/hdw-setup", pciHdwSetupRoute);

  // 단건 조회
  const workLogReadOne = async (req, res) => {
    const { pool } = require("./database");
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM work_log WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  };
  app.get('/api/work-log/:id', workLogReadOne);

  // 작업 카운트 증가 API
  app.post('/api/update-task-count', workLogController.updateTaskCount);

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
    console.log('작업 로그 요청 데이터:', req.body);

    const { task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, group, site, SOP, tsguide, line, warranty, equipment_type, equipment_name, workType, workType2, setupItem, maintItem, transferItem, task_maint, status } = req.body;

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
    const taskWorkType2 = workType2 || 'SELECT';
    const taskSetupItem = setupItem || 'SELECT';
    const taskMaintItem = maintItem || 'SELECT';
    const taskTransferItem = transferItem || 'SELECT';
    const taskStatus = status || 'active';
    const reqEms = (req.body.ems === 0 || req.body.ems === 1) ? Number(req.body.ems) : null;
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
      taskWorkType2,
      taskSetupItem,
      taskMaintItem,
      taskTransferItem,
      taskStatus,
      taskMaint,
      ems: reqEms
    });

    try {
      const query = `
        INSERT INTO work_log 
        (task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time, none_time, move_time, \`group\`, site, SOP, tsguide, \`line\`, warranty, equipment_type, equipment_name, work_type, work_type2, setup_item, maint_item, transfer_item, status, task_maint, ems) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        taskWorkType2,
        taskSetupItem,
        taskMaintItem,
        taskTransferItem,
        taskStatus,
        taskMaint,
        reqEms
      ];

      logger.info('실행할 쿼리:', query);
      logger.info('쿼리 값:', values);

      await pool.execute(query, values);
      logger.info('작업 로그가 성공적으로 추가되었습니다.');
      res.status(201).send('작업 로그가 성공적으로 추가되었습니다.');
    } catch (err) {
      console.error('작업 로그 추가 중 오류 발생:', err);
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

  // 작업 이력 수정
  app.put('/work-logs/:id', async (req, res) => {
    const { id } = req.params;
    const {
      task_name, task_result, task_cause, task_man, task_description, task_date, start_time, end_time,
      group, site, line, warranty, equipment_type, equipment_name, status
    } = req.body;

    const values = [
      task_name || null, task_result || null, task_cause || null, task_man || null, task_description || null, task_date || null, start_time || null, end_time || null,
      group || null, site || null, line || null, warranty || null, equipment_type || null, equipment_name || null, status || null, id
    ];

    logger.info('작업 로그 수정 쿼리:');
    logger.info('수정할 값:', values);

    try {
      const query = `
        UPDATE work_log SET
          task_name = ?, task_result = ?, task_cause = ?, task_man = ?, task_description = ?, task_date = ?, start_time = ?, end_time = ?,
          \`group\` = ?, site = ?, \`line\` = ?, warranty = ?, equipment_type = ?, equipment_name = ?, status = ?
        WHERE id = ?
      `;
      await pool.query(query, values);
      res.status(200).json({ message: "Work log updated" });
    } catch (err) {
      console.error('Error updating work log:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /* === 마지막에 404/전역 에러 핸들러 추가 (JSON으로 응답 보장) === */

  // 404 -> JSON
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'Not Found' });
  });

  // 전역 에러 핸들러 -> JSON
  // (JSON 파싱 오류, 라우트 내부 throw 등 모두 여기서 처리)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // body-parser JSON 오류
    if (err && err.type === 'entity.parse.failed') {
      console.error('[Express JSON Parse Error]', err.message);
      return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
    }
    console.error('[Express Error]', err);
    if (res.headersSent) return; // 이미 응답 시작되면 스킵
    res.status(err.status || 500).json({ ok: false, error: err?.message || 'Internal Server Error' });
  });

  return app;
};
