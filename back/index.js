const express = require('./config/express');
const { logger, setupWebSocket } = require('./config/winston');
const http = require('http');

const port = 3001;
const app = express();
const server = http.createServer(app);

// WebSocket 설정
setupWebSocket(server);

// 서버 실행
server.listen(port, () => {
    logger.info(`API Server Start At Port ${port}`);
    console.log(`서버가 ${port} 번 포트에서 실행 중입니다.`);
});
