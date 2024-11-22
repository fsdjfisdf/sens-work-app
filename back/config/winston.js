const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 로그 파일 경로
const logFilePath = `${logDir}/${new Date().toISOString().split('T')[0]}-app.log`;

const dailyRotateFileTransport = new transports.DailyRotateFile({
    level: 'debug',
    filename: `${logDir}/%DATE%-app.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = createLogger({
    level: env === 'development' ? 'debug' : 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json()
    ),
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                format.printf(
                    info => `${info.timestamp} ${info.level}: ${info.message}`
                )
            )
        }),
        dailyRotateFileTransport
    ]
});

// WebSocket 설정 함수
function setupWebSocket(server) {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('WebSocket 클라이언트가 연결되었습니다.');

        // 로그 파일 변경 감지
        fs.watch(logFilePath, { encoding: 'utf8' }, () => {
            const logData = fs.readFileSync(logFilePath, 'utf8');
            ws.send(logData); // 클라이언트로 로그 전송
        });

        ws.on('close', () => {
            console.log('WebSocket 클라이언트 연결이 종료되었습니다.');
        });
    });

    console.log('WebSocket 서버가 설정되었습니다.');
}

module.exports = {
    logger,
    setupWebSocket,
    logFilePath // 로그 파일 경로도 내보냄
};
