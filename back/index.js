const expressApp = require('./config/express');
const { logger } = require('./config/winston'); // log

const port = 3001; // 포트 번호 확인
expressApp.listen(port, () => {
  logger.info(`API Server Start At Port ${port}`);
});
