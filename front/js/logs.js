const ws = new WebSocket('ws://3.37.73.151:3001');

ws.onmessage = (event) => {
    const log = JSON.parse(event.data);
    const logContainer = document.getElementById('logContainer');
    const logEntry = document.createElement('div');
    logEntry.textContent = `${log.timestamp} [${log.level}]: ${log.message}`;
    logContainer.appendChild(logEntry);

    // 스크롤 자동으로 하단으로 이동
    logContainer.scrollTop = logContainer.scrollHeight;
};

ws.onopen = () => {
    console.log('WebSocket 연결 성공');
};

ws.onclose = () => {
    console.log('WebSocket 연결 종료');
};
