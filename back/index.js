const express = require("./config/express");
const { logger } = require("./config/winston"); // log

const port = 3001;
const app = express();  // 서버 인스턴스를 생성합니다.
app.listen(port, () => {
  logger.info(`API Server Start At Port ${port}`);
  console.log(`서버가 ${port} 번 포트에서 실행 중입니다.`);
});
