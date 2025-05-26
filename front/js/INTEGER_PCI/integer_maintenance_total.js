document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    const taskMapping = {
        "SWAP_KIT": "SWAP KIT",
        "GAS_LINE_&_GAS_FILTER": "GAS LINE & GAS FILTER",
        "TOP_FEED_THROUGH": "TOP FEED THROUGH",
        "GAS_FEED_THROUGH": "GAS FEED THROUGH",
        "CERAMIC_PARTS": "CERAMIC PARTS",
        "MATCHER": "MATCHER",
        "PM_BAFFLE": "PM BAFFLE",
        "AM_BAFFLE": "AM BAFFLE",
        "FLANGE_ADAPTOR": "FLANGE ADAPTOR",
        "SLOT_VALVE_ASSY(HOUSING)": "SLOT VALVE ASSY(HOUSING)",
        "SLOT_VALVE": "SLOT VALVE",
        "DOOR_VALVE": "DOOR VALVE",
        "PENDULUM_VALVE": "PENDULUM VALVE",
        "PIN_ASSY_MODIFY": "PIN ASSY MODIFY",
        "MOTOR_&_CONTROLLER": "MOTOR & CONTROLLER",
        "PIN_구동부_ASSY": "PIN 구동부 ASSY",
        "PIN_BELLOWS": "PIN BELLOWS",
        "SENSOR": "SENSOR",
        "STEP_MOTOR_&_CONTROLLER": "STEP MOTOR & CONTROLLER",
        "CASSETTE_&_HOLDER_PAD": "CASSETTE & HOLDER PAD",
        "BALL_SCREW_ASSY": "BALL SCREW ASSY",
        "BUSH": "BUSH",
        "MAIN_SHAFT": "MAIN SHAFT",
        "BELLOWS": "BELLOWS",
        "EFEM_ROBOT_REP": "EFEM ROBOT REP",
        "TM_ROBOT_REP": "TM ROBOT REP",
        "TM_ROBOT_SERVO_PACK": "TM ROBOT SERVO PACK",
        "EFEM_ROBOT_TEACHING": "EFEM ROBOT TEACHING",
        "TM_ROBOT_TEACHING": "TM ROBOT TEACHING",
        "UNDER_COVER": "UNDER COVER",
        "VAC._LINE": "VAC. LINE",
        "BARATRON_GAUGE": "BARATRON GAUGE",
        "PIRANI_GAUGE": "PIRANI GAUGE",
        "CONVACTRON_GAUGE": "CONVACTRON GAUGE",
        "MANUAL_VALVE": "MANUAL VALVE",
        "PNEUMATIC_VALVE": "PNEUMATIC VALVE",
        "ISOLATION_VALVE": "ISOLATION VALVE",
        "VACUUM_BLOCK": "VACUUM BLOCK",
        "CHECK_VALVE": "CHECK VALVE",
        "EPC": "EPC",
        "PURGE_LINE_REGULATOR": "PURGE LINE REGULATOR",
        "COOLING_CHUCK": "COOLING CHUCK",
        "HEATER_CHUCK": "HEATER CHUCK",
        "GENERATOR": "GENERATOR",
        "D-NET_BOARD": "D-NET BOARD",
        "SOURCE_BOX_BOARD": "SOURCE BOX BOARD",
        "INTERFACE_BOARD": "INTERFACE BOARD",
        "SENSOR_BOARD": "SENSOR BOARD",
        "PIO_SENSOR_BOARD": "PIO SENSOR BOARD",
        "AIO_CALIBRATION[PSK_BOARD]": "AIO CALIBRATION[PSK BOARD]",
        "AIO_CALIBRATION[TOS_BOARD]": "AIO CALIBRATION[TOS BOARD]",
        "CODED_SENSOR": "CODED SENSOR",
        "GAS_BOX_DOOR_SENSOR": "GAS BOX DOOR SENSOR",
        "LASER_SENSOR_AMP": "LASER SENSOR AMP",
        "HE_LEAK_CHECK": "HE LEAK CHECK",
        "DIFFUSER": "DIFFUSER",
        "LOT_조사": "LOT 조사",
        "GAS_SPRING": "GAS SPRING"
    };
    

const taskCategories = [
    {
        "category": "Swap Kit",
        "subcategories": [
            {"name": "SWAP_KIT", "displayName": "SWAP KIT", "기준작업수": 2},
            {"name": "GAS_LINE_&_GAS_FILTER", "displayName": "GAS LINE & GAS FILTER", "기준작업수": 1},
            {"name": "TOP_FEED_THROUGH", "displayName": "TOP FEED THROUGH", "기준작업수": 1},
            {"name": "GAS_FEED_THROUGH", "displayName": "GAS FEED THROUGH", "기준작업수": 1},
            {"name": "CERAMIC_PARTS", "displayName": "CERAMIC PARTS", "기준작업수": 1},
            {"name": "MATCHER", "displayName": "MATCHER", "기준작업수": 1},
            {"name": "PM_BAFFLE", "displayName": "PM BAFFLE", "기준작업수": 2},
            {"name": "AM_BAFFLE", "displayName": "AM BAFFLE", "기준작업수": 1},
            {"name": "FLANGE_ADAPTOR", "displayName": "FLANGE ADAPTOR", "기준작업수": 1}
        ]
    },
    {
        "category": "Slot Valve",
        "subcategories": [
            {"name": "SLOT_VALVE_ASSY(HOUSING)", "displayName": "SLOT VALVE ASSY(HOUSING)", "기준작업수": 1},
            {"name": "SLOT_VALVE", "displayName": "SLOT VALVE", "기준작업수": 1},
            {"name": "DOOR_VALVE", "displayName": "DOOR VALVE", "기준작업수": 1}
        ]
    },
    {
        "category": "Pendulum Valve",
        "subcategories": [
            {"name": "PENDULUM_VALVE", "displayName": "PENDULUM VALVE", "기준작업수": 2}
        ]
    },
    {
        "category": "Pin Motor & CTR",
        "subcategories": [
            {"name": "PIN_ASSY_MODIFY", "displayName": "PIN ASSY MODIFY", "기준작업수": 2},
            {"name": "MOTOR_&_CONTROLLER", "displayName": "MOTOR & CONTROLLER", "기준작업수": 2},
            {"name": "PIN_구동부_ASSY", "displayName": "PIN 구동부 ASSY", "기준작업수": 2},
            {"name": "PIN_BELLOWS", "displayName": "PIN BELLOWS", "기준작업수": 2},
            {"name": "SENSOR", "displayName": "SENSOR", "기준작업수": 2}
        ]
    },
    {
        "category": "Step Motor & CTR",
        "subcategories": [
            {"name": "STEP_MOTOR_&_CONTROLLER", "displayName": "STEP MOTOR & CONTROLLER", "기준작업수": 3},
            {"name": "CASSETTE_&_HOLDER_PAD", "displayName": "CASSETTE & HOLDER PAD", "기준작업수": 1},
            {"name": "BALL_SCREW_ASSY", "displayName": "BALL SCREW ASSY", "기준작업수": 3},
            {"name": "BUSH", "displayName": "BUSH", "기준작업수": 3},
            {"name": "MAIN_SHAFT", "displayName": "MAIN SHAFT", "기준작업수": 3},
            {"name": "BELLOWS", "displayName": "BELLOWS", "기준작업수": 3}
        ]
    },
    {
        "category": "Robot",
        "subcategories": [
            {"name": "EFEM_ROBOT_REP", "displayName": "EFEM ROBOT REP", "기준작업수": 5},
            {"name": "TM_ROBOT_REP", "displayName": "TM ROBOT REP", "기준작업수": 5},
            {"name": "EFEM_ROBOT_TEACHING", "displayName": "EFEM ROBOT TEACHING", "기준작업수": 5},
            {"name": "TM_ROBOT_TEACHING", "displayName": "TM ROBOT TEACHING", "기준작업수": 5},
            {"name": "TM_ROBOT_SERVO_PACK", "displayName": "TM ROBOT SERVO PACK", "기준작업수": 2}
        ]
    },
    {
        "category": "Vac. Line",
        "subcategories": [
            {"name": "UNDER_COVER", "displayName": "UNDER COVER", "기준작업수": 2},
            {"name": "VAC._LINE", "displayName": "VAC. LINE", "기준작업수": 2},
            {"name": "BARATRON_GAUGE", "displayName": "BARATRON GAUGE", "기준작업수": 2},
            {"name": "PIRANI_GAUGE", "displayName": "PIRANI GAUGE", "기준작업수": 2},
            {"name": "CONVACTRON_GAUGE", "displayName": "CONVACTRON GAUGE", "기준작업수": 2},
            {"name": "MANUAL_VALVE", "displayName": "MANUAL VALVE", "기준작업수": 2},
            {"name": "PNEUMATIC_VALVE", "displayName": "PNEUMATIC VALVE", "기준작업수": 2},
            {"name": "ISOLATION_VALVE", "displayName": "ISOLATION VALVE", "기준작업수": 2},
            {"name": "VACUUM_BLOCK", "displayName": "VACUUM BLOCK", "기준작업수": 2},
            {"name": "CHECK_VALVE", "displayName": "CHECK VALVE", "기준작업수": 2},
            {"name": "EPC", "displayName": "EPC", "기준작업수": 2},
            {"name": "PURGE_LINE_REGULATOR", "displayName": "PURGE LINE REGULATOR", "기준작업수": 1}
        ]
    },
    {
        "category": "Chuck",
        "subcategories": [
            {"name": "COOLING_CHUCK", "displayName": "COOLING CHUCK", "기준작업수": 2},
            {"name": "HEATER_CHUCK", "displayName": "HEATER CHUCK", "기준작업수": 2}
        ]
    },
    {
        "category": "Rack",
        "subcategories": [
            {"name": "GENERATOR", "displayName": "GENERATOR", "기준작업수": 2}
        ]
    },
    {
        "category": "Board",
        "subcategories": [
            {"name": "D-NET_BOARD", "displayName": "D-NET BOARD", "기준작업수": 2},
            {"name": "SOURCE_BOX_BOARD", "displayName": "SOURCE BOX BOARD", "기준작업수": 2},
            {"name": "INTERFACE_BOARD", "displayName": "INTERFACE BOARD", "기준작업수": 2},
            {"name": "SENSOR_BOARD", "displayName": "SENSOR BOARD", "기준작업수": 2},
            {"name": "PIO_SENSOR_BOARD", "displayName": "PIO SENSOR BOARD", "기준작업수": 2},
            {"name": "AIO_CALIBRATION[PSK_BOARD]", "displayName": "AIO CALIBRATION[PSK BOARD]", "기준작업수": 2},
            {"name": "AIO_CALIBRATION[TOS_BOARD]", "displayName": "AIO CALIBRATION[TOS BOARD]", "기준작업수": 2}
        ]
    },
    {
        "category": "Sensor",
        "subcategories": [
            {"name": "CODED_SENSOR", "displayName": "CODED SENSOR", "기준작업수": 2},
            {"name": "GAS_BOX_DOOR_SENSOR", "displayName": "GAS BOX DOOR SENSOR", "기준작업수": 2},
            {"name": "LASER_SENSOR_AMP", "displayName": "LASER SENSOR AMP", "기준작업수": 2}
        ]
    },
    {
        "category": "ETC",
        "subcategories": [
            {"name": "HE_LEAK_CHECK", "displayName": "HE LEAK CHECK", "기준작업수": 2},
            {"name": "DIFFUSER", "displayName": "DIFFUSER", "기준작업수": 2},
            {"name": "LOT_조사", "displayName": "LOT 조사", "기준작업수": 2},
            {"name": "GAS_SPRING", "displayName": "GAS SPRING", "기준작업수": 1}
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

async function loadIntegerMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/integer-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Integer Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, integerData, taskCategories, filteredWorkers = null) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container'); // 전체 평균을 출력할 공간
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = ''; // 이전의 전체 평균을 지움

    let allWorkers = new Set(Object.keys(worklogPercentages));
    integerData.forEach(integer => allWorkers.add(integer.name));
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
                const mappedTaskNameInteger = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const integerItem = integerData.find(integer => integer.name === worker);
                const integerPercent = integerItem ? integerItem[mappedTaskNameInteger] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (integerPercent * 0.2);
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
                const mappedTaskNameInteger = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const integerItem = integerData.find(integer => integer.name === worker);
                const integerPercent = integerItem ? integerItem[mappedTaskNameInteger] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (integerPercent * 0.2);

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

function applySearchFilter(searchName, worklogData, integerData, taskCategories) {
    console.log("Applying search filter for:", searchName); // 필터 적용 콘솔 로그

    // 검색어가 포함된 작업자만 필터링
    const filteredWorkers = worklogData
        .filter(log => log.task_man.includes(searchName))  // 작업자 필터링
        .map(log => log.task_man);  // 필터된 작업자의 이름 리스트 생성

    const filteredIntegerWorkers = integerData
        .filter(integer => integer.name.includes(searchName))  // Integer 데이터에서 작업자 필터링
        .map(integer => integer.name);  // 필터된 작업자의 이름 리스트 생성

    const filteredWorkerNames = [...new Set([...filteredWorkers, ...filteredIntegerWorkers])];  // 중복 제거

    console.log("Filtered workers:", filteredWorkerNames);

    // 필터링된 작업자들만 테이블에 표시
    renderCombinedTable(worklogData, integerData, taskCategories, filteredWorkerNames);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, integerData, taskCategories);  // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, integerData, taskCategories); // 전체 데이터 다시 표시
});

// 데이터를 불러오고 전역 변수에 저장
let worklogData = await loadWorklogData();
let integerData = await loadIntegerMaintenanceData();

// 데이터를 렌더링
renderCombinedTable(worklogData, integerData, taskCategories);
});