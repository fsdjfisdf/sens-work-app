document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    const taskMapping = {
        "LP_ESCORT": "LP ESCORT",
        "ROBOT_ESCORT": "ROBOT ESCORT",
        "EFEM_ROBOT_TEACHING": "EFEM ROBOT TEACHING",
        "EFEM_ROBOT_REP": "EFEM ROBOT REP",
        "EFEM_ROBOT_CONTROLLER_REP": "EFEM ROBOT CONTROLLER REP",
        "TM_ROBOT_TEACHING": "TM ROBOT TEACHING",
        "TM_ROBOT_REP": "TM ROBOT REP",
        "TM_ROBOT_CONTROLLER_REP": "TM ROBOT CONTROLLER REP",
        "PASSIVE_PAD_REP": "PASSIVE PAD REP",
        "PIN_CYLINDER": "PIN CYLINDER",
        "PUSHER_CYLINDER": "PUSHER CYLINDER",
        "IB_FLOW": "IB FLOW",
        "DRT": "DRT",
        "FFU_CONTROLLER": "FFU CONTROLLER",
        "FAN": "FAN",
        "MOTOR_DRIVER": "MOTOR DRIVER",
        "R1": "R1",
        "R3": "R3",
        "R5": "R5",
        "R3_TO_R5": "R3 TO R5",
        "MICROWAVE": "MICROWAVE",
        "APPLICATOR": "APPLICATOR",
        "GENERATOR": "GENERATOR",
        "CHUCK": "CHUCK",
        "PROCESS_KIT": "PROCESS KIT",
        "HELIUM_DETECTOR": "HELIUM DETECTOR",
        "HOOK_LIFT_PIN": "HOOK LIFT PIN",
        "BELLOWS": "BELLOWS",
        "PIN_SENSOR": "PIN SENSOR",
        "LM_GUIDE": "LM GUIDE",
        "PIN_MOTOR_CONTROLLER": "PIN MOTOR CONTROLLER",
        "SINGLE_EPD": "SINGLE EPD",
        "DUAL_EPD": "DUAL EPD",
        "GAS_BOX_BOARD": "GAS BOX BOARD",
        "TEMP_CONTROLLER_BOARD": "TEMP CONTROLLER BOARD",
        "POWER_DISTRIBUTION_BOARD": "POWER DISTRIBUTION BOARD",
        "DC_POWER_SUPPLY": "DC POWER SUPPLY",
        "BM_SENSOR": "BM SENSOR",
        "PIO_SENSOR": "PIO SENSOR",
        "SAFETY_MODULE": "SAFETY MODULE",
        "D_NET": "D-NET",
        "MFC": "MFC",
        "VALVE": "VALVE",
        "SOLENOID": "SOLENOID",
        "FAST_VAC_VALVE": "FAST VAC VALVE",
        "SLOW_VAC_VALVE": "SLOW VAC VALVE",
        "SLIT_DOOR": "SLIT DOOR",
        "APC_VALVE": "APC VALVE",
        "SHUTOFF_VALVE": "SHUTOFF VALVE",
        "BARATRON_ASSY": "BARATRON ASS'Y",
        "PIRANI_ASSY": "PIRANI ASS'Y",
        "VIEW_PORT_QUARTZ": "VIEW PORT QUARTZ",
        "FLOW_SWITCH": "FLOW SWITCH",
        "CERAMIC_PLATE": "CERAMIC PLATE",
        "MONITOR": "MONITOR",
        "KEYBOARD": "KEYBOARD",
        "MOUSE": "MOUSE",
        "CTC": "CTC",
        "PMC": "PMC",
        "EDA": "EDA",
        "EFEM_CONTROLLER": "EFEM CONTROLLER",
        "SW_PATCH": "S/W PATCH"
    };

const taskCategories = [
    {
        category: "Escort",
        subcategories: [
            { name: "LP_ESCORT", displayName: "LP ESCORT", 기준작업수: 3 },
            { name: "ROBOT_ESCORT", displayName: "ROBOT ESCORT", 기준작업수: 3 }
        ]
    },
    {
        category: "EFEM Robot",
        subcategories: [
            { name: "EFEM_ROBOT_TEACHING", displayName: "EFEM ROBOT TEACHING", 기준작업수: 5 },
            { name: "EFEM_ROBOT_REP", displayName: "EFEM ROBOT REP", 기준작업수: 5 },
            { name: "EFEM_ROBOT_CONTROLLER_REP", displayName: "EFEM ROBOT CONTROLLER REP", 기준작업수: 5 }
        ]
    },
    {
        category: "TM Robot",
        subcategories: [
            { name: "TM_ROBOT_TEACHING", displayName: "TM ROBOT TEACHING", 기준작업수: 5 },
            { name: "TM_ROBOT_REP", displayName: "TM ROBOT REP", 기준작업수: 5 },
            { name: "TM_ROBOT_CONTROLLER_REP", displayName: "TM ROBOT CONTROLLER REP", 기준작업수: 5 },
            { name: "PASSIVE_PAD_REP", displayName: "PASSIVE PAD REP", 기준작업수: 3 }
        ]
    },
    {
        category: "BM Module",
        subcategories: [
            { name: "PIN_CYLINDER", displayName: "PIN CYLINDER", 기준작업수: 3 },
            { name: "PUSHER_CYLINDER", displayName: "PUSHER CYLINDER", 기준작업수: 1 },
            { name: "IB_FLOW", displayName: "IB FLOW", 기준작업수: 1 },
            { name: "DRT", displayName: "DRT", 기준작업수: 1 }
        ]
    },
    {
        category: "FFU (EFEM, TM)",
        subcategories: [
            { name: "FFU_CONTROLLER", displayName: "FFU CONTROLLER", 기준작업수: 3 },
            { name: "FAN", displayName: "FAN", 기준작업수: 3 },
            { name: "MOTOR_DRIVER", displayName: "MOTOR DRIVER", 기준작업수: 1 }
        ]
    },
    {
        category: "FCIP",
        subcategories: [
            { name: "R1", displayName: "R1", 기준작업수: 5 },
            { name: "R3", displayName: "R3", 기준작업수: 5 },
            { name: "R5", displayName: "R5", 기준작업수: 5 },
            { name: "R3_TO_R5", displayName: "R3 TO R5", 기준작업수: 5 }
        ]
    },
    {
        category: "MICROWAVE",
        subcategories: [
            { name: "MICROWAVE", displayName: "MICROWAVE", 기준작업수: 3 },
            { name: "APPLICATOR", displayName: "APPLICATOR", 기준작업수: 2 },
            { name: "GENERATOR", displayName: "GENERATOR", 기준작업수: 2 }
        ]
    },
    {
        category: "Chuck",
        subcategories: [
            { name: "CHUCK", displayName: "CHUCK", 기준작업수: 5 }
        ]
    },
    {
        category: "Process Kit",
        subcategories: [
            { name: "PROCESS_KIT", displayName: "PROCESS KIT", 기준작업수: 5 }
        ]
    },
    {
        category: "Leak",
        subcategories: [
            { name: "HELIUM_DETECTOR", displayName: "HELIUM DETECTOR", 기준작업수: 3 }
        ]
    },
    {
        category: "Pin",
        subcategories: [
            { name: "HOOK_LIFT_PIN", displayName: "HOOK LIFT PIN", 기준작업수: 3 },
            { name: "BELLOWS", displayName: "BELLOWS", 기준작업수: 1 },
            { name: "PIN_SENSOR", displayName: "PIN SENSOR", 기준작업수: 1 },
            { name: "LM_GUIDE", displayName: "LM GUIDE", 기준작업수: 1 },
            { name: "PIN_MOTOR_CONTROLLER", displayName: "PIN MOTOR CONTROLLER", 기준작업수: 3 }
        ]
    },
    {
        category: "EPD",
        subcategories: [
            { name: "SINGLE_EPD", displayName: "SINGLE EPD", 기준작업수: 3 },
            { name: "DUAL_EPD", displayName: "DUAL EPD", 기준작업수: 1 }
        ]
    },
    {
        category: "Board",
        subcategories: [
            { name: "GAS_BOX_BOARD", displayName: "GAS BOX BOARD", 기준작업수: 2 },
            { name: "TEMP_CONTROLLER_BOARD", displayName: "TEMP CONTROLLER BOARD", 기준작업수: 2 },
            { name: "POWER_DISTRIBUTION_BOARD", displayName: "POWER DISTRIBUTION BOARD", 기준작업수: 2 },
            { name: "DC_POWER_SUPPLY", displayName: "DC POWER SUPPLY", 기준작업수: 2 },
            { name: "BM_SENSOR", displayName: "BM SENSOR", 기준작업수: 1 },
            { name: "PIO_SENSOR", displayName: "PIO SENSOR", 기준작업수: 1 },
            { name: "SAFETY_MODULE", displayName: "SAFETY MODULE", 기준작업수: 1 },
            { name: "D_NET", displayName: "D-NET", 기준작업수: 2 }
        ]
    },
    {
        category: "IGS Block",
        subcategories: [
            { name: "MFC", displayName: "MFC", 기준작업수: 2 },
            { name: "VALVE", displayName: "VALVE", 기준작업수: 2 }
        ]
    },
    {
        category: "Valve",
        subcategories: [
            { name: "SOLENOID", displayName: "SOLENOID", 기준작업수: 2 },
            { name: "FAST_VAC_VALVE", displayName: "FAST VAC VALVE", 기준작업수: 2 },
            { name: "SLOW_VAC_VALVE", displayName: "SLOW VAC VALVE", 기준작업수: 2 },
            { name: "SLIT_DOOR", displayName: "SLIT DOOR", 기준작업수: 3 },
            { name: "APC_VALVE", displayName: "APC VALVE", 기준작업수: 3 },
            { name: "SHUTOFF_VALVE", displayName: "SHUTOFF VALVE", 기준작업수: 3 }
        ]
    },
    {
        category: "ETC",
        subcategories: [
            { name: "BARATRON_ASSY", displayName: "BARATRON ASS'Y", 기준작업수: 1 },
            { name: "PIRANI_ASSY", displayName: "PIRANI ASS'Y", 기준작업수: 1 },
            { name: "VIEW_PORT_QUARTZ", displayName: "VIEW PORT QUARTZ", 기준작업수: 1 },
            { name: "FLOW_SWITCH", displayName: "FLOW SWITCH", 기준작업수: 1 },
            { name: "CERAMIC_PLATE", displayName: "CERAMIC PLATE", 기준작업수: 3 },
            { name: "MONITOR", displayName: "MONITOR", 기준작업수: 1 },
            { name: "KEYBOARD", displayName: "KEYBOARD", 기준작업수: 1 },
            { name: "MOUSE", displayName: "MOUSE", 기준작업수: 1 }
        ]
    },
    {
        category: "Y24 신규",
        subcategories: [
            { name: "CTC", displayName: "CTC", 기준작업수: 2 },
            { name: "PMC", displayName: "PMC", 기준작업수: 2 },
            { name: "EDA", displayName: "EDA", 기준작업수: 2 },
            { name: "EFEM_CONTROLLER", displayName: "EFEM CONTROLLER", 기준작업수: 2 },
            { name: "SW_PATCH", displayName: "S/W PATCH", 기준작업수: 2 }
        ]
    }
];

async function loadWorklogData() {
    try {
        const response = await axios.get('http://3.37.165.84:3001/logs', {
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

async function loadSupraMaintenanceData() {
    try {
        const response = await axios.get('http://3.37.165.84:3001/supra-maintenance/all', {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Supra Maintenance 데이터를 불러오는 중 오류 발생:', error);
        return [];
    }
}

function renderCombinedTable(worklogData, supraData, taskCategories) {
    const worklogPercentages = JSON.parse(localStorage.getItem('worklogPercentages')) || {};

    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    // AVERAGE 값을 기준으로 작업자를 정렬하기 위한 배열 생성
    let allWorkers = new Set(Object.keys(worklogPercentages));
    supraData.forEach(supra => allWorkers.add(supra.name));
    allWorkers = Array.from(allWorkers);

    const averageScores = allWorkers.map(worker => {
        let totalPercent = 0;
        let taskCount = 0;

        taskCategories.forEach(category => {
            category.subcategories.forEach(subcategory => {
                // worklogPercentages에서 taskMapping을 적용해 매칭
                const mappedTaskNameWorklog = taskMapping[subcategory.name] || subcategory.name;
                const mappedTaskNameSupra = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                // worklogPercentages 값 가져오기
                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;

                // supraData에서 매칭된 항목 값 가져오기
                const supraItem = supraData.find(supra => supra.name === worker);
                const supraPercent = supraItem ? supraItem[mappedTaskNameSupra] || 0 : 0;

                // 최종 퍼센트 계산
                const finalPercent = (worklogPercent * 0.8) + (supraPercent * 0.2);
                totalPercent += finalPercent;
                taskCount++;
            });
        });

        const averagePercent = totalPercent / taskCount;
        return { worker, averagePercent };
    });

    // AVERAGE 값을 기준으로 정렬
    averageScores.sort((a, b) => b.averagePercent - a.averagePercent);
    allWorkers = averageScores.map(score => score.worker);

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '';
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    allWorkers.forEach(worker => {
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
    allWorkers.forEach(worker => {
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

            allWorkers.forEach(worker => {
                const mappedTaskNameWorklog = taskMapping[subcategory.name] || subcategory.name;
                const mappedTaskNameSupra = Object.keys(taskMapping).find(key => taskMapping[key] === subcategory.name) || subcategory.name;

                const worklogPercent = worklogPercentages[worker]?.[mappedTaskNameWorklog] || 0;
                const supraItem = supraData.find(supra => supra.name === worker);
                const supraPercent = supraItem ? supraItem[mappedTaskNameSupra] || 0 : 0;

                const finalPercent = (worklogPercent * 0.8) + (supraPercent * 0.2);

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

function applySearchFilter(searchName, worklogData, supraData, taskCategories) {
    // 검색어가 포함된 작업자만 필터링
    const filteredWorklogData = Object.keys(worklogData).filter(worker => worker.includes(searchName));
    const filteredSupraData = supraData.filter(worker => worker.name.includes(searchName));
    
    // 필터링된 데이터를 사용해 테이블을 재생성
    renderCombinedTable(filteredWorklogData, filteredSupraData, taskCategories);
}

document.getElementById('search-button').addEventListener('click', () => {
    const searchName = document.getElementById('search-name').value.trim();
    if (searchName) {
        applySearchFilter(searchName, worklogData, supraData, taskCategories); // 검색 실행
    }
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.getElementById('search-name').value = ''; // 검색어 초기화
    renderCombinedTable(worklogData, supraData, taskCategories); // 전체 데이터 다시 표시
});



const worklogData = await loadWorklogData();
const supraData = await loadSupraMaintenanceData();

renderCombinedTable(worklogData, supraData, taskCategories);


});