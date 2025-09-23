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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride());

  // CORS 설정
const corsOptions = {
  // 필요시 허용 오리진을 구체화 (예: 개발용)
  // origin: ['http://localhost:3000', 'http://localhost:3001', 'http://3.37.73.151:3001'],
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'user-role'],
  // 만약 axios에 withCredentials를 쓰면 아래 두 줄도 필요하고, origin에 '*'를 쓰면 안 됩니다.
  // credentials: true,
  // origin: 'http://localhost:3001',
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // (선택) 명시적 프리플라이트 허용


  // 정적 파일 경로 설정
  app.use(express.static(path.join(__dirname, '../../front')));
  app.use(express.static(path.join(__dirname, '../../front/css')));
  app.use(express.static(path.join(__dirname, '../../front/js')));

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
  require("../src/routes/supraSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/integerSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/preciaSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/ecoliteSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/hdwSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/genevaSetupRoute")(app);  // 추가된 라우트
  require("../src/routes/supraxpSetupRoute")(app);  // 추가된 라우트
  const signalRoute = require('../src/routes/signalRoute');
  app.use('/api/Equipment', signalRoute);

  require("../src/routes/integerMaintenanceRoute")(app);  // 추가된 라우트
  require("../src/routes/ecoliteMaintenanceRoute")(app);  // 추가된 라우트
  require("../src/routes/genevaMaintenanceRoute")(app);  // 추가된 라우트
  require("../src/routes/preciaMaintenanceRoute")(app);  // 추가된 라우트
  require("../src/routes/hdwMaintenanceRoute")(app);  // 추가된 라우트
  console.log("Setting up equipmentRoute...");
  require("../src/routes/equipmentRoute")(app); // 여기 경로 확인
  require('../src/routes/SECMRoute')(app);
  require('../src/routes/TitleRoute')(app);
  require('../src/routes/taskCountRoute')(app);  // 추가
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
// ... (상단 생략)
const reportsRoute = require('../src/routes/reportsRoute');
app.use('/reports', reportsRoute);           // ✅ 이 줄만 추가

require('../src/routes/skillRoute')(app);

// ❌ 아래처럼 “함수 호출” 방식은 쓰지 마세요 (혼용하면 이번 오류 재발)
// require('../src/routes/reportsRoute')(app);


  
  require('../src/routes/supraxpMaintCountRoute')(app);  // 추가
  require('../src/routes/testRoute')(app);
  
  const businessRoute = require('../src/routes/businessRoute'); // 새로 추가된 라우트
  app.use('/api/business', businessRoute); // "/api/business" 경로와 라우트 연결

  const updateRoute = require('../src/routes/updateRoute');

  // 업데이트 라우트 연결
  app.use('/api/updates', updateRoute);

  const setupeqRoute = require("../src/routes/SetupeqRoute"); // ✅ 단일 require
  app.use("/api/setup_equipment", setupeqRoute);
  app.use("/api/setupeq", setupeqRoute);

  // 기존 코드 상단 부분에 추가
const editRoutes = require("../src/routes/editRoute"); // 🔹 작업 이력 편집을 위한 라우트 추가

// 기존 코드의 라우트 설정 부분에 추가
app.use("/api", editRoutes); // 🔹 작업 이력 편집 API 라우트 연결
const analysisRoute = require('../src/routes/analysisRoute'); // 경로는 프로젝트 구조에 맞게
app.use('/analysis', analysisRoute);
// 유상(EMS) 상세 라우트 장착
const { apiRouter, approvalRouter } = require('../routes/workLogPaidRoute'); // ← config 기준 ../routes
app.use('/api/work-log-paid', apiRouter);        // 프런트가 호출: /api/work-log-paid/pending/:id
app.use('/approval/work-log-paid', approvalRouter); // 레거시/호환 경로



// (위쪽 아무 데서든) 한 번만 선언
const workLogController = require('../src/controllers/workLogController');

// 권한 가드: DB ENUM에 맞게
function requireRole(roles = ['admin', 'editor']) {
  return (req, res, next) => {
    const role = req.user?.role; // JWT에서만
    if (!role) return res.status(401).json({ message: '인증 필요' });
    if (!roles.includes(role)) return res.status(403).json({ message: '권한 없음' });
    next();
  };
}

// === 결재 플로우 ===
// === 결재 플로우 ===

// 결재자 목록
app.get('/approval/approvers', jwtMiddleware, workLogController.getApproversForGroupSite);

// 제출
app.post('/approval/work-log/submit', jwtMiddleware, workLogController.submitWorkLogPending);

// ✅ 목록: 전원 접근(인증만). mine=1일 때 서버에서 본인 것만 필터링
app.get('/approval/work-log/pending', jwtMiddleware, workLogController.listPendingWorkLogs);

// ✅ 반려(내 이력): 프런트가 호출하는 정확한 경로 추가
app.get('/approval/work-log/rejected/mine', jwtMiddleware, workLogController.listMyRejected);

// (옵션) 하위호환: /rejected?mine=1 -> /rejected/mine로 라우팅
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

// 승인/반려: ✅ 여기만 결재 권한 필요
function requireRole(roles = ['admin', 'editor']) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: '인증 필요' });
    if (!roles.includes(role)) return res.status(403).json({ message: '권한 없음' });
    next();
  };
}
app.post('/approval/work-log/:id/approve', jwtMiddleware, requireRole(), workLogController.approvePendingWorkLog);
app.post('/approval/work-log/:id/reject',  jwtMiddleware, requireRole(), workLogController.rejectPendingWorkLog);


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





  


// 작업 카운트 증가 API 라우트 추가
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
    console.log('작업 로그 요청 데이터:', req.body);  // 작업 로그 요청 데이터 로깅
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
      ems
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
      console.error('작업 로그 추가 중 오류 발생:', err);  // 구체적인 오류 메시지 출력
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
      task_name || null, task_result || null, task_cause || null, task_man || null, task_description || null, task_date || null, start_time || null, end_time ||null, group 
      || null, site || null, line || null, warranty || null, equipment_type || null, equipment_name || null, status || null, id
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

  return app;
};
