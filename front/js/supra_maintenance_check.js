document.addEventListener('DOMContentLoaded', async () => {
    const tableHead = document.getElementById('supra-maintenance-table-head');
    const tableBody = document.getElementById('supra-maintenance-table-body');

    // 서버로부터 모든 작업자의 데이터를 불러오는 함수
    async function loadAllSupraMaintenanceData() {
        try {
            // 토큰을 가져옴 (로그인이 되어 있을 경우)
            const token = localStorage.getItem("x-access-token");

            // 서버에서 모든 작업자의 데이터를 가져옴
            const response = await axios.get('http://3.37.165.84:3001/supra-maintenance/all', {
                headers: {
                    'x-access-token': token // 필요한 경우 토큰을 전달
                }
            });

            const data = response.data; // 서버로부터 받아온 모든 작업자의 데이터

            console.log("전체 작업자 데이터를 확인:", data); // 서버에서 받은 전체 데이터를 확인

            if (!Array.isArray(data)) {
                console.error('Received data is not an array:', data);
                return;
            }

            generateTable(data); // 데이터를 테이블로 생성
        } catch (error) {
            console.error('데이터를 불러오는 중 오류 발생:', error);
            if (error.response && error.response.status === 403) {
                alert('권한이 없습니다. 다시 로그인하세요.');
                window.location.replace('./signin.html');
            }
        }
    }

    // 표를 생성하는 함수
    function generateTable(data) {
        // 테이블 헤더 생성 (첫 번째 열은 작업 항목, 그 이후 열은 각 작업자)
        const headerRow = document.createElement('tr');
        const taskHeader = document.createElement('th');
        taskHeader.textContent = '작업 항목';
        headerRow.appendChild(taskHeader);

        // 작업자 이름 동적으로 추가 (모든 작업자를 가져옴)
        const workers = [...new Set(data.map(row => row.name))]; // 모든 작업자의 이름을 중복 없이 가져옴
        console.log("작업자 목록:", workers); // 콘솔에 작업자 이름을 출력

        workers.forEach(worker => {
            const th = document.createElement('th');
            th.textContent = worker;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // 작업 항목에 대한 데이터 추가 (모든 작업 항목을 추가)
        const taskKeys = Object.keys(data[0]).filter(key => key !== 'name' && key !== 'id'); // 'name'과 'id'는 제외
        console.log("작업 항목 목록:", taskKeys); // 콘솔에 작업 항목을 출력

        taskKeys.forEach(task => {
            const row = document.createElement('tr');
            const taskCell = document.createElement('td');
            taskCell.textContent = task; // 작업 항목 이름
            row.appendChild(taskCell);

            // 모든 작업자의 작업 데이터 추가 (각 작업자의 데이터를 순서대로 추가)
            workers.forEach(workerName => {
                const workerData = data.find(worker => worker.name === workerName); // 이름으로 작업자를 찾음
                const taskValue = workerData ? workerData[task] : 'N/A'; // 해당 작업자의 작업 데이터가 있으면 표시, 없으면 'N/A'
                
                const cell = document.createElement('td');
                cell.textContent = taskValue;
                if (taskValue === 100) {
                    cell.style.color = 'blue'; // 100일 때 파란색
                } else if (taskValue === 0) {
                    cell.style.color = 'red'; // 0일 때 빨간색
                } else {
                    cell.style.color = 'gray'; // 값이 없을 때 회색
                }
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }

    // 데이터 로드
    loadAllSupraMaintenanceData();
});
