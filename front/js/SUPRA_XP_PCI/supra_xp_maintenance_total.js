document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    const taskMapping = {
        "LP_ESCORT": "LP_ESCORT",
        "ROBOT_ESCORT": "ROBOT_ESCORT",
        "SR8241_TEACHING": "SR8241_TEACHING",
        "ROBOT_REP": "ROBOT_REP",
        "ROBOT_CONTROLLER_REP": "ROBOT_CONTROLLER_REP",
        "END_EFFECTOR_REP": "END_EFFECTOR_REP",
        "PERSIMMON_TEACHING": "PERSIMMON_TEACHING",
        "END_EFFECTOR_PAD_REP": "END_EFFECTOR_PAD_REP",
        "L_L_PIN": "L_L_PIN",
        "L_L_SENSOR": "L_L_SENSOR",
        "L_L_DSA": "L_L_DSA",
        "GAS_LINE": "GAS_LINE",
        "L_L_ISOLATION_VV": "L_L_ISOLATION_VV",
        "FFU_CONTROLLER": "FFU_CONTROLLER",
        "FAN": "FAN",
        "MOTOR_DRIVER": "MOTOR_DRIVER",
        "MATCHER": "MATCHER",
        "3000QC": "3000QC",
        "3100QC": "3100QC",
        "CHUCK": "CHUCK",
        "PROCESS_KIT": "PROCESS_KIT",
        "SLOT_VALVE_BLADE": "SLOT_VALVE_BLADE",
        "TEFLON_ALIGN_PIN": "TEFLON_ALIGN_PIN",
        "O_RING": "O_RING",
        "HELIUM_DETECTOR": "HELIUM_DETECTOR",
        "HOOK_LIFT_PIN": "HOOK_LIFT_PIN",
        "BELLOWS": "BELLOWS",
        "PIN_BOARD": "PIN_BOARD",
        "LM_GUIDE": "LM_GUIDE",
        "PIN_MOTOR_CONTROLLER": "PIN_MOTOR_CONTROLLER",
        "LASER_PIN_SENSOR": "LASER_PIN_SENSOR",
        "DUAL": "DUAL",
        "DC_POWER_SUPPLY": "DC_POWER_SUPPLY",
        "PIO_SENSOR": "PIO_SENSOR",
        "D_NET": "D_NET",
        "SIM_BOARD": "SIM_BOARD",
        "MFC": "MFC",
        "VALVE": "VALVE",
        "SOLENOID": "SOLENOID",
        "PENDULUM_VALVE": "PENDULUM_VALVE",
        "SLOT_VALVE_DOOR_VALVE": "SLOT_VALVE_DOOR_VALVE",
        "SHUTOFF_VALVE": "SHUTOFF_VALVE",
        "RF_GENERATOR": "RF_GENERATOR",
        "BARATRON_ASSY": "BARATRON_ASSY",
        "PIRANI_ASSY": "PIRANI_ASSY",
        "VIEW_PORT_QUARTZ": "VIEW_PORT_QUARTZ",
        "FLOW_SWITCH": "FLOW_SWITCH",
        "CERAMIC_PLATE": "CERAMIC_PLATE",
        "MONITOR": "MONITOR",
        "KEYBOARD": "KEYBOARD",
        "SIDE_STORAGE": "SIDE_STORAGE",
        "MULTI_PORT_32": "MULTI_PORT_32",
        "MINI8": "MINI8",
        "TM_EPC_MFC": "TM_EPC_MFC",
        "CTC": "CTC",
        "EFEM_CONTROLLER": "EFEM_CONTROLLER",
        "SW_PATCH": "SW_PATCH"
    };
    
    

    const taskCategories = [
        {
            "category": "Escort",
            "subcategories": [
                {"name": "LP_ESCORT", "displayName": "LP ESCORT", "기준작업수": 3},
                {"name": "ROBOT_ESCORT", "displayName": "ROBOT ESCORT", "기준작업수": 3}
            ]
        },
        {
            "category": "EFEM Robot",
            "subcategories": [
                {"name": "SR8241_TEACHING", "displayName": "SR8241 TEACHING", "기준작업수": 15},
                {"name": "ROBOT_REP", "displayName": "ROBOT REP", "기준작업수": 15},
                {"name": "ROBOT_CONTROLLER_REP", "displayName": "ROBOT CONTROLLER REP", "기준작업수": 15},
                {"name": "END_EFFECTOR_REP", "displayName": "END EFFECTOR REP", "기준작업수": 10}
            ]
        },
        {
            "category": "TM Robot",
            "subcategories": [
                {"name": "PERSIMMON_TEACHING", "displayName": "PERSIMMON TEACHING", "기준작업수": 15},
                {"name": "END_EFFECTOR_PAD_REP", "displayName": "END EFFECTORPAD REP", "기준작업수": 10}
            ]
        },
        {
            "category": "L/L",
            "subcategories": [
                {"name": "L_L_PIN", "displayName": "LL PIN", "기준작업수": 5},
                {"name": "L_L_SENSOR", "displayName": "LL SENSOR", "기준작업수": 5},
                {"name": "L_L_DSA", "displayName": "LL DSA", "기준작업수": 5},
                {"name": "GAS_LINE", "displayName": "GAS LINE", "기준작업수": 5},
                {"name": "L_L_ISOLATION_VV", "displayName": "LL ISOLATION VV", "기준작업수": 5}
            ]
        },
        {
            "category": "EFEM FFU",
            "subcategories": [
                {"name": "FFU_CONTROLLER", "displayName": "FFU CONTROLLER", "기준작업수": 3},
                {"name": "FAN", "displayName": "FAN", "기준작업수": 3},
                {"name": "MOTOR_DRIVER", "displayName": "MOTOR DRIVER", "기준작업수": 1}
            ]
        },
        {
            "category": "Source",
            "subcategories": [
                {"name": "MATCHER", "displayName": "MATCHER", "기준작업수": 5},
                {"name": "3000QC", "displayName": "3000QC", "기준작업수": 5},
                {"name": "3100QC", "displayName": "3100QC", "기준작업수": 5}
            ]
        },
        {
            "category": "Chuck",
            "subcategories": [
                {"name": "CHUCK", "displayName": "CHUCK", "기준작업수": 5}
            ]
        },
        {
            "category": "Preventive Maintenance",
            "subcategories": [
                {"name": "PROCESS_KIT", "displayName": "PROCESS KIT", "기준작업수": 5},
                {"name": "SLOT_VALVE_BLADE", "displayName": "SLOT VALVE BLADE", "기준작업수": 3},
                {"name": "TEFLON_ALIGN_PIN", "displayName": "TEFLON ALIGN PIN", "기준작업수": 3},
                {"name": "O_RING", "displayName": "O-RING", "기준작업수": 3}
            ]
        },
        {
            "category": "Leak",
            "subcategories": [
                {"name": "HELIUM_DETECTOR", "displayName": "HELIUM DETECTOR", "기준작업수": 3}
            ]
        },
        {
            "category": "Pin",
            "subcategories": [
                {"name": "HOOK_LIFT_PIN", "displayName": "HOOK LIFT PIN", "기준작업수": 3},
                {"name": "BELLOWS", "displayName": "BELLOWS", "기준작업수": 1},
                {"name": "PIN_BOARD", "displayName": "PIN BOARD", "기준작업수": 1},
                {"name": "LM_GUIDE", "displayName": "LM GUIDE", "기준작업수": 1},
                {"name": "PIN_MOTOR_CONTROLLER", "displayName": "PIN MOTOR CONTROLLER", "기준작업수": 3},
                {"name": "LASER_PIN_SENSOR", "displayName": "LASER PIN SENSOR", "기준작업수": 1}
            ]
        },
        {
            "category": "EPD",
            "subcategories": [
                {"name": "DUAL", "displayName": "DUAL", "기준작업수": 1}
            ]
        },
        {
            "category": "Board",
            "subcategories": [
                {"name": "DC_POWER_SUPPLY", "displayName": "DC POWER SUPPLY", "기준작업수": 2},
                {"name": "PIO_SENSOR", "displayName": "PIO SENSOR", "기준작업수": 1},
                {"name": "D_NET", "displayName": "D-NET", "기준작업수": 2},
                {"name": "SIM_BOARD", "displayName": "SIM BOARD", "기준작업수": 2}
            ]
        },
        {
            "category": "IGS Block",
            "subcategories": [
                {"name": "MFC", "displayName": "MFC", "기준작업수": 2},
                {"name": "VALVE", "displayName": "VALVE", "기준작업수": 2}
            ]
        },
        {
            "category": "Valve",
            "subcategories": [
                {"name": "SOLENOID", "displayName": "SOLENOID", "기준작업수": 2},
                {"name": "PENDULUM_VALVE", "displayName": "PENDULUM VALVE", "기준작업수": 2},
                {"name": "SLOT_VALVE_DOOR_VALVE", "displayName": "SLOT VALVE DOOR VALVE", "기준작업수": 3},
                {"name": "SHUTOFF_VALVE", "displayName": "SHUTOFF VALVE", "기준작업수": 3}
            ]
        },
        {
            "category": "Rack",
            "subcategories": [
                {"name": "RF_GENERATOR", "displayName": "RF GENERATOR", "기준작업수": 3}
            ]
        },
        {
            "category": "ETC",
            "subcategories": [
                {"name": "BARATRON_ASSY", "displayName": "BARATRON ASSY", "기준작업수": 1},
                {"name": "PIRANI_ASSY", "displayName": "PIRANI ASSY", "기준작업수": 1},
                {"name": "VIEW_PORT_QUARTZ", "displayName": "VIEW PORT QUARTZ", "기준작업수": 1},
                {"name": "FLOW_SWITCH", "displayName": "FLOW SWITCH", "기준작업수": 1},
                {"name": "CERAMIC_PLATE", "displayName": "CERAMIC PLATE", "기준작업수": 3},
                {"name": "MONITOR", "displayName": "MONITOR", "기준작업수": 1},
                {"name": "KEYBOARD", "displayName": "KEYBOARD", "기준작업수": 1},
                {"name": "SIDE_STORAGE", "displayName": "SIDE STORAGE", "기준작업수": 5},
                {"name": "MULTI_PORT_32", "displayName": "32 MULTI PORT", "기준작업수": 3},
                {"name": "MINI8", "displayName": "MINI8", "기준작업수": 3},
                {"name": "TM_EPC_MFC", "displayName": "TM EPC (MFC)", "기준작업수": 3}
            ]
        },
        {
            "category": "CTR",
            "subcategories": [
                {"name": "CTC", "displayName": "CTC", "기준작업수": 2},
                {"name": "EFEM_CONTROLLER", "displayName": "EFEM CONTROLLER", "기준작업수": 2}
            ]
        },
        {
            "category": "S/W",
            "subcategories": [
                {"name": "SW_PATCH", "displayName": "SW PATCH", "기준작업수": 2}
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

async function loadSupraxpMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.73.151:3001/supraxp-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('SUPRA XP Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, supraxpData, taskCategories, filteredWorkers = null) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container'); // 전체 평균을 출력할 공간
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = ''; // 이전의 전체 평균을 지움

    let allWorkers = new Set(Object.keys(worklogPercentages));
    supraxpData.forEach(supraxp => allWorkers.add(supraxp.name));
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
                const mappedTaskNameSupraxp = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const supraxpItem = supraxpData.find(supraxp => supraxp.name === worker);
                const supraxpPercent = supraxpItem ? supraxpItem[mappedTaskNameSupraxp] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (supraxpPercent * 0.2);
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
                const mappedTaskNameSupraxp = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const supraxpItem = supraxpData.find(supraxp => supraxp.name === worker);
                const supraxpPercent = supraxpItem ? supraxpItem[mappedTaskNameSupraxp] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (supraxpPercent * 0.2);

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

function applySearchFilter(searchName, worklogData, supraxpData, taskCategories) {
    console.log("Applying search filter for:", searchName); // 필터 적용 콘솔 로그

    // 검색어가 포함된 작업자만 필터링
    const filteredWorkers = worklogData
        .filter(log => log.task_man.includes(searchName))  // 작업자 필터링
        .map(log => log.task_man);  // 필터된 작업자의 이름 리스트 생성

    const filteredSupraxpWorkers = supraxpData
        .filter(supraxp => supraxp.name.includes(searchName))  // supraxp 데이터에서 작업자 필터링
        .map(supraxp => supraxp.name);  // 필터된 작업자의 이름 리스트 생성

    const filteredWorkerNames = [...new Set([...filteredWorkers, ...filteredSupraxpWorkers])];  // 중복 제거

    console.log("Filtered workers:", filteredWorkerNames);

    // 필터링된 작업자들만 테이블에 표시
    renderCombinedTable(worklogData, supraxpData, taskCategories, filteredWorkerNames);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, supraxpData, taskCategories);  // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, supraxpData, taskCategories); // 전체 데이터 다시 표시
});

// 데이터를 불러오고 전역 변수에 저장
let worklogData = await loadWorklogData();
let supraxpData = await loadSupraxpMaintenanceData();

// 데이터를 렌더링
renderCombinedTable(worklogData, supraxpData, taskCategories);
});