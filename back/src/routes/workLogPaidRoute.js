// routes/workLogPaidRoute.js
// 유상(EMS) 상세 라우트
// - 기본:   /api/work-log-paid/*   (프런트 worklog-paid-modal.js가 쓰는 경로)
// - 레거시: /approval/work-log-paid/* (호환용)
//
// app.js 예:
//   const { apiRouter, approvalRouter } = require('./routes/workLogPaidRoute');
//   app.use('/api/work-log-paid', apiRouter);
//   app.use('/approval/work-log-paid', approvalRouter);

const express = require('express');
const {
  uploadPendingPaidRows,
  listPendingPaidRows,
  listLivePaidRows,
} = require('../controllers/workLogPaidController');

// (선택) 인증 미들웨어가 있다면 여기서 불러와 사용하세요.
// const { verifyToken } = require('../middleware/auth');
// const auth = verifyToken; // 없으면 아래 noAuth를 그대로 쓰세요.
const noAuth = (req, _res, next) => next();

// -------------------- 기본(prefix: /api/work-log-paid) --------------------
const apiRouter = express.Router();

// 유상 상세 업로드(대기건)
apiRouter.post('/pending/:id', noAuth, uploadPendingPaidRows);
// 대기건 유상 상세 조회
apiRouter.get('/pending/:id', noAuth, listPendingPaidRows);
// 본테이블 유상 상세 조회
apiRouter.get('/live/:workLogId', noAuth, listLivePaidRows);

// -------------------- 호환(prefix: /approval/work-log-paid) --------------------
const approvalRouter = express.Router();

approvalRouter.post('/pending/:id', noAuth, uploadPendingPaidRows);
approvalRouter.get('/pending/:id', noAuth, listPendingPaidRows);
approvalRouter.get('/live/:workLogId', noAuth, listLivePaidRows);

module.exports = {
  apiRouter,
  approvalRouter,
};
