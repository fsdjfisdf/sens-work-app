const ws = new WebSocket('ws://3.37.73.151:3001');

ws.onmessage = (event) => {
    try {
        const log = JSON.parse(event.data);
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.textContent = `${log.timestamp} [${log.level}]: ${log.message}`;
        logContainer.appendChild(logEntry);

        // 스크롤 자동 이동
        logContainer.scrollTop = logContainer.scrollHeight;
    } catch (error) {
        console.error('로그 메시지 처리 중 오류:', error);
    }
};

ws.onopen = () => {
    console.log('WebSocket 연결 성공');
};

ws.onclose = () => {
    console.log('WebSocket 연결 종료');
};

ws.onerror = (error) => {
    console.error('WebSocket 오류:', error);
};
