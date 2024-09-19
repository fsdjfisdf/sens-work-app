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
            const response = await axios.get('http://3.37.73.151:3001/supra-setup/all', {
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
            const response = await axios.get('http://3.37.73.151:3001/supra-setup/data', {
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

        const columns = [
            { name: 'INSTALLATION PREPARATION', 기준작업수: 5 },
            { name: 'FAB IN', 기준작업수: 3 },
            { name: 'DOCKING', 기준작업수: 3 },
            { name: 'CABLE HOOK UP', 기준작업수: 4 }
        ];

        const workerNames = setupData.map(worker => worker.name);

        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
        headerRow.appendChild(document.createElement('th')).textContent = '기준 작업 수';
        workerNames.forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        columns.forEach(col => {
            const row = document.createElement('tr');
            row.appendChild(document.createElement('td')).textContent = col.name;
            row.appendChild(document.createElement('td')).textContent = col.기준작업수;

            workerNames.forEach(workerName => {
                const workerData = setupData.find(worker => worker.name === workerName);
                const taskCount = workerData ? workerData[col.name.toUpperCase()] || 0 : 0;
                let percentage = (taskCount / col.기준작업수) * 100;
                percentage = Math.min(percentage, 100);

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

        const categories = {
            'INSTALLATION PREPARATION': ['DRAWING_TEMPLATE_SETUP', 'DRAWING_TEMPLATE_MARKING', 'CUSTOMER_OHT_LINE_CHECK', 'UTILITY_SPEC_UNDERSTANDING'],
            'FAB IN': ['EQUIPMENT_IMPORT_CAUTION', 'EQUIPMENT_IMPORT_ORDER', 'EQUIPMENT_SPACING_CHECK', 'PACKING_LIST_CHECK']
        };

        const workerNames = checklistData.map(worker => worker.name);

        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '체크리스트 항목';
        workerNames.forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            headerRow.appendChild(th);
        });
        checklistTableHead.appendChild(headerRow);

        for (const [category, items] of Object.entries(categories)) {
            const categoryRow = document.createElement('tr');
            const categoryCell = document.createElement('td');
            categoryCell.colSpan = workerNames.length + 1;
            categoryCell.textContent = category;
            categoryRow.appendChild(categoryCell);
            checklistTableBody.appendChild(categoryRow);

            items.forEach(item => {
                const row = document.createElement('tr');
                row.appendChild(document.createElement('td')).textContent = item.replace(/_/g, ' ');

                workerNames.forEach(workerName => {
                    const workerData = checklistData.find(worker => worker.name === workerName);
                    const taskValue = workerData ? workerData[item] : 'N/A';

                    const td = document.createElement('td');
                    td.textContent = taskValue !== undefined ? taskValue : 'N/A';
                    row.appendChild(td);
                });

                checklistTableBody.appendChild(row);
            });
        }
    }

    const setupData = await loadSetupData();
    renderSetupTable(setupData);

    const checklistData = await loadChecklistData();
    renderChecklistTable(checklistData);
});
