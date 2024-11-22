const socket = new WebSocket('ws://3.37.73.151:3001');

socket.onmessage = (event) => {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML += `<pre>${event.data}</pre>`;
    logContainer.scrollTop = logContainer.scrollHeight; // 스크롤 맨 아래로
};

socket.onopen = () => {
    console.log('Connected to WebSocket server');
};

socket.onclose = () => {
    console.log('Disconnected from WebSocket server');
};

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};
