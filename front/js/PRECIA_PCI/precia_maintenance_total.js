document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    const taskMapping = {
        "PM_CENTERING": "PM CENTERING",
        "PM_CLN": "PM CLN",
        "EFEM_ROBOT_TEACHING": "EFEM ROBOT TEACHING",
        "TM_ROBOT_TEACHING": "TM ROBOT TEACHING",
        "PM_SLOT_VALVE_REP": "PM SLOT VALVE REP",
        "PM_PEEK_PLATE_REP": "PM PEEK PLATE REP",
        "PM_RF_MATCHER_REP": "PM RF MATCHER REP",
        "PM_GAP_SENSOR_ADJUST": "PM GAP SENSOR ADJUST",
        "PM_PROCESS_KIT_REP": "PM PROCESS KIT REP",
        "PM_PIN_HOLDER_REP": "PM PIN HOLDER REP"
    };
    

    const taskCategories = [
        {
            "category": "PM",
            "subcategories": [
                { "name": "PM_CENTERING", "displayName": "PM CENTERING", "기준작업수": 2 },//
                { "name": "PM_CLN", "displayName": "PM CLN", "기준작업수": 1 },//
                { "name": "PM_SLOT_VALVE_REP", "displayName": "PM SLOT VALVE REP", "기준작업수": 1 },//
                { "name": "PM_PEEK_PLATE_REP", "displayName": "PM PEEK PLATE REP", "기준작업수": 3 },//
                { "name": "PM_RF_MATCHER_REP", "displayName": "PM RF MATCHER REP", "기준작업수": 1 },//
                { "name": "PM_PIN_HOLDER_REP", "displayName": "PM PIN HOLDER REP", "기준작업수": 3 },
                { "name": "PM_GAP_SENSOR_ADJUST", "displayName": "PM GAP SENSOR ADJUST", "기준작업수": 3 },
                { "name": "PM_PROCESS_KIT_REP", "displayName": "PM PROCESS KIT REP", "기준작업수": 3 }
            ]
        },
        {
            "category": "ROBOT",
            "subcategories": [
                { "name": "EFEM_ROBOT_TEACHING", "displayName": "EFEM ROBOT TEACHING", "기준작업수": 5 },//
                { "name": "TM_ROBOT_TEACHING", "displayName": "TM ROBOT TEACHING", "기준작업수": 5 }
            ]
        }
    ];
    

async function loadWorklogData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/logs', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Worklog 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

async function loadPreciaMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/precia-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Precia Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, preciaData, taskCategories, filteredWorkers = null) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container'); // 전체 평균을 출력할 공간
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = ''; // 이전의 전체 평균을 지움

    let allWorkers = new Set(Object.keys(worklogPercentages));
    preciaData.forEach(precia => allWorkers.add(precia.name));
    allWorkers = Array.from(allWorkers);

    if (filteredWorkers) {
        allWorkers = allWorkers.filter(worker => filteredWorkers.includes(worker));
    }

    const averageScores = allWorkers.map(worker => {
        let totalPercent = 0;
        let taskCount = 0;

        taskCategories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                const mappedTaskNameWorklog = taskMapping[subcategory.name] || subcategory.name;
                const mappedTaskNamePrecia = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const preciaItem = preciaData.find(precia => precia.name === worker);
                const preciaPercent = preciaItem ? preciaItem[mappedTaskNamePrecia] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (preciaPercent * 0.2);
                totalPercent += finalPercent;
                taskCount++;
            });
        });

        const averagePercent = totalPercent / taskCount;
        return { worker, averagePercent };
    });

    // 작업자를 평균 퍼센트에 따라 내림차순 정렬
    averageScores.sort((a, b) => b.averagePercent - a.averagePercent);
    const sortedWorkers = averageScores.map(score => score.worker);

    // 전체 평균 계산
    let totalAveragePercent = 0;
    averageScores.forEach(score => {
        totalAveragePercent += score.averagePercent;
    });
    totalAveragePercent /= averageScores.length;  // 전체 평균 계산

    // 전체 평균을 HTML에 표시
    totalAverageContainer.innerHTML = `Total Average : ${totalAveragePercent.toFixed(2)}%`;

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '';
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    sortedWorkers.forEach(worker => {
        const th = document.createElement('th');
        th.textContent = worker;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // AVERAGE 행 추가
    const averageRow = document.createElement('tr');
    averageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
    averageRow.style.fontWeight = 'bold';
    averageRow.appendChild(document.createElement('td')).textContent = ''; // 중분류 열 비워둠
    averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
    sortedWorkers.forEach(worker => {
        const averagePercent = averageScores.find(score => score.worker === worker).averagePercent;
        const td = document.createElement('td');
        td.textContent = `${averagePercent.toFixed(2)}%`;
        averageRow.appendChild(td);
    });
    tableHead.appendChild(averageRow);

    // 작업 항목 및 작업자별 퍼센트 계산
    taskCategories.forEach(category => {
        let firstCategoryRow = true;
        category.subcategories.forEach((subcategory, index) => {
            const row = document.createElement('tr');

            // 중분류(카테고리) 열 추가
            if (firstCategoryRow) {
                const categoryCell = document.createElement('td');
                categoryCell.rowSpan = category.subcategories.length;
                categoryCell.textContent = category.category;
                categoryCell.style.fontWeight = 'bold';
                row.appendChild(categoryCell);
                firstCategoryRow = false;
            }

            const taskCell = document.createElement('td');
            taskCell.textContent = subcategory.displayName;
            row.appendChild(taskCell);

            sortedWorkers.forEach(worker => {
                const mappedTaskNameWorklog = taskMapping[subcategory.name] || subcategory.name;
                const mappedTaskNamePrecia = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const preciaItem = preciaData.find(precia => precia.name === worker);
                const preciaPercent = preciaItem ? preciaItem[mappedTaskNamePrecia] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (preciaPercent * 0.2);

                const percentCell = document.createElement('td');
                percentCell.textContent = `${finalPercent.toFixed(2)}%`;

                // 퍼센트에 따른 색상 적용
                if (finalPercent === 100) {
                    percentCell.style.color = 'blue';
                } else if (finalPercent === 0) {
                    percentCell.style.color = 'red';
                } else {
                    percentCell.style.color = 'black';
                }

                row.appendChild(percentCell);
            });

            tableBody.appendChild(row);
        });
    });
}

function applySearchFilter(searchName, worklogData, preciaData, taskCategories) {
    console.log("Applying search filter for:", searchName); // 필터 적용 콘솔 로그

    // 검색어가 포함된 작업자만 필터링
    const filteredWorkers = worklogData
        .filter(log => log.task_man.includes(searchName))  // 작업자 필터링
        .map(log => log.task_man);  // 필터된 작업자의 이름 리스트 생성

    const filteredPreciaWorkers = preciaData
        .filter(precia => precia.name.includes(searchName))  // Precia 데이터에서 작업자 필터링
        .map(precia => precia.name);  // 필터된 작업자의 이름 리스트 생성

    const filteredWorkerNames = [...new Set([...filteredWorkers, ...filteredPreciaWorkers])];  // 중복 제거

    console.log("Filtered workers:", filteredWorkerNames);

    // 필터링된 작업자들만 테이블에 표시
    renderCombinedTable(worklogData, preciaData, taskCategories, filteredWorkerNames);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, preciaData, taskCategories);  // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, preciaData, taskCategories); // 전체 데이터 다시 표시
});

// 데이터를 불러오고 전역 변수에 저장
let worklogData = await loadWorklogData();
let preciaData = await loadPreciaMaintenanceData();

// 데이터를 렌더링
renderCombinedTable(worklogData, preciaData, taskCategories);
});