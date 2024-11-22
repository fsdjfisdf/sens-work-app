const express = require("./config/express");
const { logger } = require("./config/winston"); // log
const http = require("http"); // HTTP 서버 생성
const setupWebSocket = require("./src/server/logger"); // WebSocket 설정

const port = 3001;
const app = express();
const server = http.createServer(app); // HTTP 서버 생성

// WebSocket 설정
setupWebSocket(server);

// 서버 실행
server.listen(port, () => {
  logger.info(`API Server Start At Port ${port}`);
  console.log(`서버가 ${port} 번 포트에서 실행 중입니다.`);
});
