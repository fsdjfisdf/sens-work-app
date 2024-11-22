const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const WebSocket = require('ws');
const fs = require('fs');

const logDir = 'log';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// WebSocket 연결 관리
let wsClients = [];

function broadcastLog(logMessage) {
    wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(logMessage));
        }
    });
}

// Winston 설정
const dailyRotateFileTransport = new transports.DailyRotateFile({
    filename: `${logDir}/%DATE%-app.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            const logMessage = { timestamp, level, message };
            broadcastLog(logMessage); // WebSocket 클라이언트로 로그 전송
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        dailyRotateFileTransport
    ]
});

// WebSocket 서버 설정
function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('WebSocket 클라이언트가 연결되었습니다.');
        wsClients.push(ws);

        ws.on('close', () => {
            console.log('WebSocket 클라이언트 연결이 종료되었습니다.');
            wsClients = wsClients.filter((client) => client !== ws);
        });
    });

    console.log('WebSocket 서버가 설정되었습니다.');
}

module.exports = { logger, setupWebSocket };
