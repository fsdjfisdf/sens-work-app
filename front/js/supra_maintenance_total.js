document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    const taskMapping = {
        "LP ESCORT": "LP_ESCORT",
        "Robot Escort": "ROBOT_ESCORT",
        // ... 나머지 매핑 테이블
    };

    // taskCategories 정의
    const taskCategories = [
        {
            category: "Escort",
            subcategories: [
                { name: "LP_ESCORT", displayName: "LP ESCORT" },
                { name: "ROBOT_ESCORT", displayName: "Robot Escort" }
            ]
        },
        {
            category: "EFEM Robot",
            subcategories: [
                { name: "EFEM_ROBOT_TEACHING", displayName: "EFEM ROBOT TEACHING" },
                { name: "EFEM_ROBOT_REP", displayName: "EFEM ROBOT REP" },
                { name: "EFEM_ROBOT_CONTROLLER_REP", displayName: "EFEM ROBOT CONTROLLER REP" }
            ]
        },
        // 나머지 작업 항목을 정의
    ];

    // Worklog 데이터를 가져오는 함수
    async function loadWorklogData() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/logs', {
                headers: {
                    'x-access-token': token
                }
            });
            console.log("Worklog Data:", response.data);
            return response.data;
        } catch (error) {
            console.error('Worklog 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // Supra Maintenance 데이터를 가져오는 함수
    async function loadSupraMaintenanceData() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/supra-maintenance/all', {
                headers: {
                    'x-access-token': token
                }
            });
            console.log("Supra Maintenance Data:", response.data);
            return response.data;
        } catch (error) {
            console.error('Supra Maintenance 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    async function loadAggregatedData() {
        try {
            const response = await axios.get('http://3.37.165.84:3001/supra-maintenance/aggregated', {
                headers: {
                    'x-access-token': token
                }
            });
            console.log('Aggregated Data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error loading aggregated data:', error);
            return [];
        }
    }

    const aggregatedData = await loadAggregatedData();
    // 기존 테이블 렌더링 함수 호출
    renderCombinedTable(worklogData, aggregatedData, taskCategories);


    // 작업자를 쉼표 및 띄어쓰기로 분리하고 '(main)', '(support)' 제거 후 배열로 변환하는 함수
    function splitAndCleanWorkers(taskMan) {
        return taskMan
            .split(/[\s,]+/)
            .map(worker => worker.replace(/\(main\)|\(support\)/g, '').trim())
            .filter(worker => worker !== '');
    }

    // 작업자별 데이터를 합산하는 함수
    function aggregateWorkerData(worklogData) {
        const aggregatedData = {};

        worklogData.forEach(log => {
            const workers = splitAndCleanWorkers(log.task_man);
            workers.forEach(worker => {
                if (!aggregatedData[worker]) {
                    aggregatedData[worker] = {};
                }

                const taskType = log.transfer_item;
                if (taskType && taskType !== 'SELECT') {
                    if (!aggregatedData[worker][taskType]) {
                        aggregatedData[worker][taskType] = 0;
                    }
                    aggregatedData[worker][taskType] += log.count;
                }
            });
        });

        console.log("Aggregated Worklog Data:", aggregatedData);
        return aggregatedData;
    }

    // 테이블을 그리는 함수
    function renderCombinedTable(worklogData, supraData, taskCategories) {
        const tableHead = document.getElementById('combined-table-head');
        const tableBody = document.getElementById('combined-table-body');
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        const aggregatedWorklogData = aggregateWorkerData(worklogData);

        let allWorkers = new Set(Object.keys(aggregatedWorklogData));
        supraData.forEach(supra => allWorkers.add(supra.name));
        allWorkers = Array.from(allWorkers);

        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
        allWorkers.forEach(worker => {
            const th = document.createElement('th');
            th.textContent = worker;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        taskCategories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                const row = document.createElement('tr');
                const taskCell = document.createElement('td');
                taskCell.textContent = subcategory.displayName;
                row.appendChild(taskCell);

                allWorkers.forEach(worker => {
                    const mappedTaskName = taskMapping[subcategory.displayName] || subcategory.displayName;
                    const worklogItemCount = aggregatedWorklogData[worker]?.[mappedTaskName] || 0;
                    const supraItem = supraData.find(supra => supra.name === worker && supra[mappedTaskName] !== undefined);

                    const worklogPercent = worklogItemCount ? Math.min((worklogItemCount / subcategory.기준작업수) * 100, 100) : 0;
                    const supraPercent = supraItem ? supraItem[mappedTaskName] : 0;

                    console.log(`Worker: ${worker}, Task: ${mappedTaskName}, Worklog Percent: ${worklogPercent}, Supra Percent: ${supraPercent}`);

                    const finalPercent = (worklogPercent * 0.8) + (supraPercent * 0.2);
                    console.log(`Final Percent for ${worker} on ${mappedTaskName}: ${finalPercent}%`);

                    const percentCell = document.createElement('td');
                    percentCell.textContent = `${finalPercent.toFixed(2)}%`;
                    row.appendChild(percentCell);
                });

                tableBody.appendChild(row);
            });
        });
    }

    const worklogData = await loadWorklogData();
    const supraData = await loadSupraMaintenanceData();

    renderCombinedTable(worklogData, supraData, taskCategories);
});
