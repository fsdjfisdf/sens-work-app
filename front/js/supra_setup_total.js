document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // SUPRA SETUP 데이터를 불러오는 함수
    async function loadSetupData() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/supra-setup/all', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('SUPRA SETUP 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 체크리스트 데이터를 불러오는 함수
    async function loadChecklistData() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/supra-setup/data', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('체크리스트 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // SUPRA SETUP 테이블 렌더링 함수
    function renderSetupTable(setupData) {
        const tableHead = document.getElementById('setup-table-head');
        const tableBody = document.getElementById('setup-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // 작업 항목 목록 (열 -> 행으로 변경)
        const columns = [
            { name: 'INSTALLATION PREPARATION', 기준작업수: 5 },
            { name: 'FAB IN', 기준작업수: 3 },
            { name: 'DOCKING', 기준작업수: 3 },
            { name: 'CABLE HOOK UP', 기준작업수: 4 },
            // ... 여기에 추가 작업 항목들
        ];

        // 작업자 목록 (열 헤더)
        const workerNames = setupData.map(worker => worker.name);

        // 테이블 헤더 생성 (작업자 이름이 열로 나열)
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
        headerRow.appendChild(document.createElement('th')).textContent = '기준 작업 수'; // 기준 작업 수 열 추가
        workerNames.forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // 테이블 바디 생성 (작업 항목별로 작업자 데이터를 나열)
        columns.forEach(col => {
            const row = document.createElement('tr');
            row.appendChild(document.createElement('td')).textContent = col.name;  // 작업 항목명
            row.appendChild(document.createElement('td')).textContent = col.기준작업수;  // 기준 작업 수 표시

            workerNames.forEach(workerName => {
                const workerData = setupData.find(worker => worker.name === workerName);
                const taskCount = workerData ? workerData[col.name.toUpperCase()] || 0 : 0;
                let percentage = (taskCount / col.기준작업수) * 100;
                percentage = Math.min(percentage, 100); // 100% 넘지 않도록 제한

                const td = document.createElement('td');
                td.textContent = `${taskCount} (${Math.round(percentage)}%)`;
                row.appendChild(td);
            });

            tableBody.appendChild(row);
        });
    }

    // 체크리스트 테이블 렌더링 함수
    function renderChecklistTable(checklistData) {
        const checklistTableHead = document.getElementById('checklist-table-head');
        const checklistTableBody = document.getElementById('checklist-table-body');
        checklistTableHead.innerHTML = '';
        checklistTableBody.innerHTML = '';

        const columns = Object.keys(checklistData[0] || {}).filter(key => key !== 'name');

        // 테이블 헤더 생성
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업자';
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.replace(/_/g, ' '); // 체크리스트 항목 이름 표시
            headerRow.appendChild(th);
        });
        checklistTableHead.appendChild(headerRow);

        // 테이블 바디 생성
        checklistData.forEach(worker => {
            const row = document.createElement('tr');
            row.appendChild(document.createElement('td')).textContent = worker.name;

            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = worker[col] !== undefined ? worker[col] : 'N/A';  // 값 그대로 출력
                row.appendChild(td);
            });

            checklistTableBody.appendChild(row);
        });
    }

    // 첫 번째 테이블 (SUPRA SETUP 데이터) 불러오기
    const setupData = await loadSetupData();
    renderSetupTable(setupData);

    // 두 번째 테이블 (체크리스트 데이터) 불러오기
    const checklistData = await loadChecklistData();
    renderChecklistTable(checklistData);
});
