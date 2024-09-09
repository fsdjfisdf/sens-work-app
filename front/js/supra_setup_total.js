document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // 모든 작업자의 SUPRA SETUP 데이터를 가져오는 함수
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

    // 행렬 바꾼 테이블 렌더링 함수
    function renderSetupTable(setupData) {
        const tableHead = document.getElementById('setup-table-head');
        const tableBody = document.getElementById('setup-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // 작업 항목 목록 (열 -> 행으로 변경)
        const columns = [
            'INSTALLATION PREPARATION', 'FAB IN', 'DOCKING', 'CABLE HOOK UP',
            'PUMP CABLE HOOK UP', 'CABLE HOOK UP : SILICON', 'POWER TURN ON', 
            'UTILITY TURN ON', 'GAS TURN ON', 'LEVELING', 'TEACHING', 'PART INSTALLATION', 
            'LEAK CHECK', 'TTTM', 'CUSTOMER CERTIFICATION 중간 인증 준비',
            'CUSTOMER CERTIFICATION(PIO 장착)', 'CUSTOMER CERTIFICATION 사전 중간 인증', 
            'CUSTOMER CERTIFICATION 중간 인증', 'PROCESS CONFIRM', 'MAINTENANCE'
        ];

        // 작업자 목록 (열 헤더)
        const workerNames = setupData.map(worker => worker.name);

        // 테이블 헤더 생성 (작업자 이름이 열로 나열)
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
        workerNames.forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // 테이블 바디 생성 (작업 항목별로 작업자 데이터를 나열)
        columns.forEach(col => {
            const row = document.createElement('tr');
            row.appendChild(document.createElement('td')).textContent = col;  // 작업 항목명

            workerNames.forEach(workerName => {
                const workerData = setupData.find(worker => worker.name === workerName);
                const td = document.createElement('td');
                td.textContent = workerData ? workerData[col.toUpperCase()] || 0 : 0;
                row.appendChild(td);
            });

            tableBody.appendChild(row);
        });
    }

    // SUPRA SETUP 데이터 불러오기
    const setupData = await loadSetupData();
    renderSetupTable(setupData);
});
