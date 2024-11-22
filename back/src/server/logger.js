const WebSocket = require('ws');
const fs = require('fs');

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('WebSocket 클라이언트가 연결되었습니다.');

        // 로그 파일 변경 감지
        fs.watch('server.log', { encoding: 'utf8' }, () => {
            const logData = fs.readFileSync('server.log', 'utf8');
            ws.send(logData); // 클라이언트로 로그 전송
        });

        ws.on('close', () => {
            console.log('WebSocket 클라이언트 연결이 종료되었습니다.');
        });
    });

    console.log('WebSocket 서버가 설정되었습니다.');
}

module.exports = setupWebSocket;
