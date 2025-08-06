let logs = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('x-access-token');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.replace('./signin.html');
        return;
    }

    // 데이터를 로드하고 테이블을 렌더링하는 함수
    async function initializeTables() {
        console.log("Initializing tables...");  // 로그 추가

        try {
            // 데이터를 로드하는 함수
            const setupData = await loadSetupData();
            const worklogData = await loadWorkLogs();
            const checklistData = await loadChecklistData();

            // 로드된 데이터를 로그로 확인
            console.log('Setup Data:', setupData);
            console.log('Work Log Data:', worklogData);
            console.log('Checklist Data:', checklistData);

            // 데이터가 제대로 로드되었는지 확인
            if (setupData.length === 0 || checklistData.length === 0 || worklogData.length === 0) {
                console.error('Data is missing or not loaded correctly.');
                return; // 데이터가 비어 있으면 중단
            }

            // 테이블을 렌더링하는 함수 호출
            renderSetupTable(setupData, worklogData);
            renderChecklistTable(checklistData);
            renderCombinedTable(setupData, checklistData);  // 합산된 표를 렌더링
        } catch (error) {
            console.error('Error during table initialization:', error);
        }
    }

    initializeTables(); // 테이블을 초기화하고 렌더링
        



    // HDW SETUP 데이터를 불러오는 함수
    async function loadSetupData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/hdw-setup/all', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('HDW SETUP 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 체크리스트 데이터를 불러오는 함수
    async function loadChecklistData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/hdw-setup/data', {
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

    // 작업 이력 데이터를 불러오는 함수
    async function loadWorkLogs() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/logs');
            return response.data;
        } catch (error) {
            console.error('작업 로그를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 중분류 클릭 시 소분류를 토글하는 함수

function toggleSubcategories(event) {
    const categoryRow = event.currentTarget;
    let nextRow = categoryRow.nextElementSibling;

    // 소분류 행들이 나올 때까지 탐색하여 애니메이션 적용
    while (nextRow && !nextRow.classList.contains('category-row')) {
        if (nextRow.classList.contains('subcategory-row')) {
            if (nextRow.classList.contains('visible')) {
                // 소분류 숨기기
                nextRow.classList.remove('visible');
                nextRow.style.maxHeight = '0';
            } else {
                // 소분류 표시하기
                nextRow.classList.add('visible');
                nextRow.style.maxHeight = nextRow.scrollHeight + 'px';
            }
        }
        nextRow = nextRow.nextElementSibling;
    }
}


    // 중분류별 소분류 항목의 평균값을 계산하는 함수
    function calculateCategoryAverage(items, checklistData, workerName) {
        if (!Array.isArray(items) || items.length === 0) {
            return 0; // items가 유효하지 않거나 항목이 없을 경우 0 반환
        }
        
        const workerData = checklistData.find(worker => worker.name === workerName);
        let totalTasks = items.length; // 소분류의 전체 항목 수
        let completedTasks = 0;
    
        // 각 소분류 항목에서 완료된 항목을 카운트 (100 또는 'O')
        items.forEach(item => {
            const taskValue = workerData ? workerData[item] : 0;
            if (taskValue === 100 || taskValue === 'O') {
                completedTasks += 1;
            }
        });
    
        // 완료된 항목 수를 기반으로 평균 퍼센티지 계산
        return (completedTasks / totalTasks) * 100;
    }

    // 중분류 평균값을 계산하는 함수
    function calculateTotalAverage(checklistData, workerName, categories) {
        let totalWeightedAverage = 0;
    
        for (const [category, weight] of Object.entries(categoryWeights)) {
            const categoryItems = categories[category];
            if (!categoryItems || !Array.isArray(categoryItems) || categoryItems.length === 0) {
                continue;  // categories에 해당 category가 없거나 항목이 없으면 건너뜀
            }
            const categoryAverage = calculateCategoryAverage(categoryItems, checklistData, workerName);
            totalWeightedAverage += categoryAverage * (weight / 100);
        }
    
        return totalWeightedAverage;
    }
    
// 각 작업자의 가중 평균을 개별적으로 계산하는 함수 (계산 로그 추가)
// 각 작업자의 가중 평균을 개별적으로 계산하는 함수 (계산 로그 추가)
function calculateWeightedAverageForWorker(workerData, columns) {
    let totalWeightedSum = 0;
    let totalWeight = 0;

    columns.forEach(col => {
        const weight = categoryWeights[col.name.replace(/_/g, ' ')] || 0; // 가중치 가져오기 (없으면 0)
        const taskCount = workerData ? workerData[col.name] || 0 : 0;
        
        // 작업 수가 기준 작업 수를 넘으면 1로 제한
        const percentage = Math.min((taskCount / col.기준작업수), 1); // 백분율을 최대 100%로 제한

        // 백분율에 가중치 적용하여 계산
        const weightedValue = percentage * (weight / 100);

        // 가중치를 곱해서 합산
        totalWeightedSum += weightedValue;
        totalWeight += weight; // 가중치 합산
    });

    // 가중 평균 계산
    const weightedAverage = totalWeightedSum * 100;  // 가중치를 적용한 값은 비율이므로 100을 곱함


    return weightedAverage;
}

// HDW SETUP 테이블 렌더링 함수
function renderSetupTable(setupData, worklogData) {
    const tableHead = document.getElementById('setup-table-head');
    const tableBody = document.getElementById('setup-table-body');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    const columns = [
        { name: 'INSTALLATION_PREPARATION', 기준작업수: 5 },
        { name: 'FAB_IN', 기준작업수: 5 },
        { name: 'DOCKING', 기준작업수: 10 },
        { name: 'CABLE_HOOK_UP', 기준작업수: 10 },
        { name: 'POWER_TURN_ON', 기준작업수: 10 },
        { name: 'UTILITY_TURN_ON', 기준작업수: 5 },
        { name: 'GAS_TURN_ON', 기준작업수: 5 },
        { name: 'TEACHING', 기준작업수: 15 },
        { name: 'PART_INSTALLATION', 기준작업수: 5 },
        { name: 'LEAK_CHECK', 기준작업수: 5 },
        { name: 'TTTM', 기준작업수: 15 },
        { name: 'CUSTOMER_CERTIFICATION', 기준작업수: 10 },
        { name: 'PROCESS_CONFIRM', 기준작업수: 3 }
    ];

    let workerNames = setupData.map(worker => worker.name);

    // 작업 이력에서 setup_item을 columns 항목과 매칭하여 카운트를 증가시킴
    workerNames.forEach(workerName => {
        const workerLogs = worklogData.filter(log => log.task_man.includes(workerName) && log.equipment_type.toLowerCase().includes('hdw'));


        const workerData = setupData.find(worker => worker.name === workerName);

        columns.forEach(col => {
            const matchingLogs = workerLogs.filter(log => log.setup_item.replace(/ /g, "_").toUpperCase() === col.name);  
            if (workerData) {
                workerData[col.name] = (workerData[col.name] || 0) + matchingLogs.length;  // 작업 카운트 증가
            }
        });
    });

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    headerRow.appendChild(document.createElement('th')).textContent = '기준 작업 수';
    workerNames.forEach(name => {
        const th = document.createElement('th');
        th.textContent = name;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // 평균값 행 추가 (각 작업자별 가중 평균 계산)
    const averageRow = document.createElement('tr');
    averageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
    averageRow.style.fontWeight = 'bold';
    averageRow.classList.add('total-average-row'); // total-average-row 클래스를 추가하여 디자인 적용
    averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
    averageRow.appendChild(document.createElement('td')).textContent = '';

    workerNames.forEach(workerName => {
        const workerData = setupData.find(worker => worker.name === workerName);
        const weightedAverage = calculateWeightedAverageForWorker(workerData, columns); // 개별 가중 평균 계산
        const td = document.createElement('td');
        td.textContent = `${weightedAverage.toFixed(1)}%`;
        averageRow.appendChild(td);
    });
    tableBody.appendChild(averageRow);

    // 각 작업 항목에 대한 데이터를 세로로 나열
    columns.forEach(col => {
        const row = document.createElement('tr');
        row.classList.add('category-row'); // 각 항목에 category-row 클래스를 추가하여 디자인 적용
        row.appendChild(document.createElement('td')).textContent = col.name;
        row.appendChild(document.createElement('td')).textContent = col.기준작업수;

        workerNames.forEach(workerName => {
            const workerData = setupData.find(worker => worker.name === workerName);
            const taskCount = workerData ? workerData[col.name] || 0 : 0;
            let percentage = (taskCount / col.기준작업수) * 100;
            percentage = Math.min(percentage, 100);
    
            const td = document.createElement('td');
            td.textContent = `${taskCount} (${Math.round(percentage)}%)`;

            // ✅ taskCount가 0 이상일 때만 클릭 가능하게 설정
            if (taskCount > 0) {
                td.classList.add('clickable-cell');
                td.setAttribute('data-worker', workerName);
                td.setAttribute('data-task', col.name);
            }

            // ✅ 색상 처리
            if (percentage === 100) {
                td.style.color = 'blue';
            } else if (percentage === 0) {
                td.style.color = 'red';
            } else {
                td.style.color = 'black';
            }

            row.appendChild(td);
        });
        tableBody.appendChild(row);
    });
}






    const categoryWeights = {
        'INSTALLATION PREPARATION': 5,
        'FAB IN': 5,
        'DOCKING': 10,
        'CABLE HOOK UP': 10,
        'POWER TURN ON': 10,
        'UTILITY TURN ON': 2.5,
        'GAS TURN ON': 2.5,
        'TEACHING': 30,
        'PART INSTALLATION': 2.5,
        'LEAK CHECK': 2.5,
        'TTTM': 10,
        'CUSTOMER CERTIFICATION': 5,
        'PROCESS CONFIRM': 5
    };
    


    

    // 전체 평균을 계산하는 함수
    function calculateTotalAverage(checklistData, workerName, categories) {
        let totalWeightedAverage = 0;
    
        for (const [category, weight] of Object.entries(categoryWeights)) {
            const categoryItems = categories[category];  // 각 중분류에 해당하는 소분류 항목들
            const categoryAverage = calculateCategoryAverage(categoryItems, checklistData, workerName);
            totalWeightedAverage += categoryAverage * (weight / 100);  // 가중 평균
        }
    
        return totalWeightedAverage;  // 전체 평균 반환
    }

    // 체크리스트 테이블 렌더링 함수 (중분류 기준 열로 표시)
    function renderChecklistTable(checklistData) {
        const checklistTableHead = document.getElementById('checklist-table-head');
        const checklistTableBody = document.getElementById('checklist-table-body');
        const itemDescriptions = {
        'EQ_IMPORT_ORDER': '설비반입 순서를 숙지하고 있는가?',
        'PACK_LIST_CHECK': 'Packing List 확인하여 반입 Part 확인이 가능 한가?',
        'OHT_LINE_CHECK_GENERAL': '고객사에서 그린 기준선 일치하는지 확인 알고 있는가?',
        'EQ_SPACING_CHECK': '설비간 유격거리가 충분한지 확인 알고 있는가?',
        'DRAWING_TEMPLATE_SETUP': 'Drawing Template을 기준선에 맞춰 배치 알고 있는가?',
        'DRAWING_TEMPLATE_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust를 Marking 알고 있는가?',
        'POKE_POSITION_UNDERSTANDING': 'Wood Packaging 에서 내릴 때 장비의 Poke 위치를 알고 있는가?',
        'UTILITY_SPEC_UNDERSTANDING': '타공별 Utility Spec을 숙지하고 있는가?',
        'MODULE_UNPACKING_CAUTION': 'Module Unpacking시 주의 사항에 대해 숙지하고 있는가?',
        'MODULE_CLEAN_CAUTION': 'Module Clean시 주의 사항에 대해 숙지하고 있는가?',
        'MODULE_MOVEMENT_CAUTION': 'Module 이동시 주의 사항에 대해 숙지하고 있는가?',
        'TOOL_REQUIREMENT_UNDERSTANDING': '장비별 필요 Tool를 숙지하고 있는가?',
        'TOOL_SIZE_UNDERSTANDING': '장비별 Tool size를 숙지하고 있는가?',
        'MODULE_HEIGHT_DOCKING': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?',
        'CASTER_JIG_SEPARATION': 'Caster 랑 moving jig 분리가 하는 법을 알고 있는가?',
        'MODULE_DOCKING': 'Module Docking 할 수 있는가?',
        'DOCKING_PIPE_REALIGNMENT': 'Docking작업 중 설비와 배관 정렬이 틀어졌을 경우 재정렬 알고 있는가?',
        'CUSTOM_PIPE_REALIGNMENT': 'Docking작업 후 설비와 (고객요청)배관 정렬이 틀어졌을 경우 재정렬 알고 있는가?',
        'LEVEL_CONSIDERATION_POSITION': '장비의 Level 고려해야하는 위치를 숙지하고 있는가?',
        'GRATING_OPEN_CAUTION': 'Grating Open시 주의 사항을 숙지하고 있는가?',
        'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결 알고 있는가?',
        'CABLE_NO_INTERFERENCE': 'Cable 정리를 간섭 없게 할 수 있는가?',
        'CN1_POSITION_UNDERSTANDING': 'CN1 의 위치를 알고 있는가?',
        'SIGNAL_CABLE_PINMAP': 'Signal Cable의 Pin map을 알고 있는가?',
        'SIGNAL_CABLE_FUNCTION_EXPLANATION': 'Signal Cable이 무슨 역할을 하는지 설명 할 수 있는가?',
        'GPS_UPS_UNDERSTANDING': 'GPS, UPS 의 역할과 원리에 대해 숙지하고 있는가?',
        'POWER_TURN_ON_SEQUENCE': 'Power turn on 순서를 숙지하고 있는가?',
        'ALARM_TROUBLESHOOTING': 'Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?',
        'RACK_CB_UNDERSTANDING': 'CB 종류와 기능을 숙지하고 있는가?',
        'EMO_CHECK': 'EMO 동작 Check 알고 있는가?',
        'UTILITY_TURN_ON_SEQUENCE': 'Utility turn on 의 순서를 숙지하고 있는가?',
        'CDA_TURN_ON': 'CDA Turn on 및 Spec에 맞게 조정 알고 있는가?',
        'UPW_TURN_ON': 'UPW Turn on 및 Spec에 맞게 조정 알고 있는가?',
        'INLET_VALVE_OPERATION': 'Inlet v/v를 상황에 맞게 동작 할 수 있는가?',
        'OUTLET_VALVE_OPERATION': 'Outlet v/v를 상황에 맞게 동작 할 수 있는가?',
        'BYPASS_VALVE_OPERATION': 'Bypass v/v를 상황에 맞게 동작 할 수 있는가?',
        'DRAIN_VALVE_OPERATION': 'Drain v/v를 상황에 맞게 동작 할 수 있는가?',
        'GAS_TURN_ON_SEQUENCE': 'Gas turn on 의 순서(경로)를 숙지하고 있는가?',
        'CDA_GAS_CHECK': 'CDA Turn on 및 가스 유입유무를 확인 알고 있는가?',
        'VALVE_INSTALLATION': 'Valve 설치 위치와 방법을 알고 있는가?',
        'LEAK_SENSOR_INSTALLATION': 'Leak Sensor 설치 위치와 방법을 알고 있는가?',
        'SIGNAL_TOWER_INSTALLATION': 'Signal Tower 설치 위치와 방법을 알고 있는가?',
        'HDW_LEAK_CHECK': 'HDW Leak Check에 대해 알고 있는가?',
        'GAS_LINE_LEAK_CHECK': 'Gas Line Leak Check에 대해 알고 있는가?',
        'PIPE_LEAK_CHECK': '배관부 Leak Check 에 대해 알고 있는가?',
        'UPW_LEAK_CHECK_METHOD': 'UPW turn on 후 leak check 방법에 대해 알고 있는가?',
        'LEAK_RESPONSE_ACTION': 'Leak 발생 시 조치 방법에 대해 알고 있는가?',
        'FLOW_OFF_ADJUST': 'Flow Off 유량을 조정 할 수 있는가?',
        'FLOW_ON_ADJUST': 'Flow On 유량을 조정 할 수 있는가?',
        'TEMP_SETTING': 'Setting Temp를 설정 할 수 있는가?',
        'PARAMETER_SETTING': 'Parameter 설정을 할 수 있는가?',
        'TC_ADJUST': 'TC 설정을 조정 할 수 있는가?',
        'OD_ADJUST': 'OD 조정 할 수 있는가?',
        'PIPE_DI_LEAK_CHECK': '배관부 배관 DI Leak Check 가능 한가?',
        'IMARKING_POSITION': '중간인증 전 I-Marking 위치 알고 있는가?',
        'GND_LABELING': 'GND 저항값, CDA 및 UPW 라인에 대해 라벨링 가능한가?',
        'MID_CERT_RESPONSE': '중간인증에 대해 알고 대응 할 수 있는가?',
        'AIR_CAP_REMOVAL': 'Air cap의 위치 및 제거를 할 수 있는가?',
        'HDW_REMOTE_TEST': 'HDW Remote Test 알고 있는가?',
        'HDW_LOCAL_TEST': 'HDW Local mode Test 알고 있는가?'
        };

        
        
        
        checklistTableHead.innerHTML = '';
        checklistTableBody.innerHTML = '';
    
        const categories = {
        'INSTALLATION_PREPARATION': [
            'EQ_IMPORT_ORDER',
            'PACK_LIST_CHECK',
            'OHT_LINE_CHECK_GENERAL',
            'EQ_SPACING_CHECK',
            'DRAWING_TEMPLATE_SETUP',
            'DRAWING_TEMPLATE_MARKING',
            'POKE_POSITION_UNDERSTANDING',
            'UTILITY_SPEC_UNDERSTANDING'
        ],
        'FAB_IN': [
            'MODULE_UNPACKING_CAUTION',
            'MODULE_CLEAN_CAUTION',
            'MODULE_MOVEMENT_CAUTION'
        ],
        'DOCKING': [
            'TOOL_REQUIREMENT_UNDERSTANDING',
            'TOOL_SIZE_UNDERSTANDING',
            'MODULE_HEIGHT_DOCKING',
            'CASTER_JIG_SEPARATION',
            'MODULE_DOCKING',
            'DOCKING_PIPE_REALIGNMENT',
            'CUSTOM_PIPE_REALIGNMENT',
            'LEVEL_CONSIDERATION_POSITION'
        ],
        'CABLE_HOOK_UP': [
            'GRATING_OPEN_CAUTION',
            'CABLE_CONNECTION',
            'CABLE_NO_INTERFERENCE',
            'CN1_POSITION_UNDERSTANDING',
            'SIGNAL_CABLE_PINMAP',
            'SIGNAL_CABLE_FUNCTION_EXPLANATION'
        ],
        'POWER_TURN_ON': [
            'GPS_UPS_UNDERSTANDING',
            'POWER_TURN_ON_SEQUENCE',
            'ALARM_TROUBLESHOOTING',
            'RACK_CB_UNDERSTANDING',
            'EMO_CHECK',
            'UTILITY_TURN_ON_SEQUENCE',
            'CDA_TURN_ON',
            'UPW_TURN_ON',
            'INLET_VALVE_OPERATION',
            'OUTLET_VALVE_OPERATION',
            'BYPASS_VALVE_OPERATION',
            'DRAIN_VALVE_OPERATION'
        ],
        'GAS_TURN_ON': [
            'GAS_TURN_ON_SEQUENCE',
            'CDA_GAS_CHECK'
        ],
        'PART_INSTALLATION': [
            'VALVE_INSTALLATION',
            'LEAK_SENSOR_INSTALLATION',
            'SIGNAL_TOWER_INSTALLATION'
        ],
        'LEAK_CHECK': [
            'HDW_LEAK_CHECK',
            'GAS_LINE_LEAK_CHECK',
            'PIPE_LEAK_CHECK',
            'UPW_LEAK_CHECK_METHOD',
            'LEAK_RESPONSE_ACTION'
        ],
        'TTTM': [
            'FLOW_OFF_ADJUST',
            'FLOW_ON_ADJUST',
            'TEMP_SETTING',
            'PARAMETER_SETTING',
            'TC_ADJUST',
            'OD_ADJUST',
            'PIPE_DI_LEAK_CHECK'
        ],
        'CUSTOMER_CERTIFICATION': [
            'IMARKING_POSITION',
            'GND_LABELING',
            'MID_CERT_RESPONSE',
            'AIR_CAP_REMOVAL'
        ],
        'PROCESS_CONFIRM': [
            'HDW_REMOTE_TEST',
            'HDW_LOCAL_TEST'
        ]
        };

        
        
    
        let workerNames = checklistData.map(worker => worker.name);

        // 테이블 헤더 생성
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
        workerNames.forEach(name => {
            const th = document.createElement('th');
            th.textContent = name;
            headerRow.appendChild(th);
        });
        checklistTableHead.appendChild(headerRow);
    
// 전체 평균 행 추가
const totalAverageRow = document.createElement('tr');
totalAverageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
totalAverageRow.style.fontWeight = 'bold';
totalAverageRow.classList.add('total-average-row');
totalAverageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';

// 중분류별 평균을 계산하여 AVERAGE 행에 출력
workerNames.forEach(workerName => {
    let totalAverage = 0;
    let totalCategories = 0;

    for (const [category, items] of Object.entries(categories)) {
        // 각 중분류에 대한 소분류 평균값 계산
        const categoryAverage = calculateCategoryAverage(items, checklistData, workerName);
        totalAverage += categoryAverage;
        totalCategories++;
    }

    // 중분류의 평균값을 합산하여 전체 평균 계산
    const overallAverage = totalCategories > 0 ? (totalAverage / totalCategories) : 0;

    const td = document.createElement('td');
    td.textContent = `${overallAverage.toFixed(1)}%`;

    // 퍼센트에 따른 색상 적용
    if (overallAverage === 100) {
        td.style.color = 'blue';
    } else if (overallAverage === 0) {
        td.style.color = 'red';
    } else {
        td.style.color = 'black';
    }

    totalAverageRow.appendChild(td);
});

checklistTableBody.appendChild(totalAverageRow);
    
        // 중분류에 대한 평균값을 열로 추가
        for (const [category, items] of Object.entries(categories)) {
            const categoryRow = document.createElement('tr');
            categoryRow.classList.add('category-row');
    
            const categoryCell = document.createElement('td');
            categoryCell.textContent = `${category}`;
            categoryRow.appendChild(categoryCell);
    
            workerNames.forEach(workerName => {
                // 각 중분류에 대한 소분류 평균값 계산
                const categoryAverage = calculateCategoryAverage(items, checklistData, workerName);
                const td = document.createElement('td');
                td.textContent = `${categoryAverage.toFixed(1)}%`;
    
                // 퍼센트에 따른 색상 적용
                if (categoryAverage === 100) {
                    td.style.color = 'blue';
                } else if (categoryAverage === 0) {
                    td.style.color = 'red';
                } else {
                    td.style.color = 'black';
                }
    
                categoryRow.appendChild(td);
            });
    
            checklistTableBody.appendChild(categoryRow);
    
            // 소분류 행 추가 (기본적으로 숨김 처리)
            items.forEach(item => {
                const subcategoryRow = document.createElement('tr');
                subcategoryRow.classList.add('subcategory-row');
                subcategoryRow.style.display = 'none';  // 소분류는 기본적으로 숨김 처리
    
                const itemCell = document.createElement('td');
                itemCell.textContent = item.replace(/_/g, ' ');
    
                // itemDescriptions에서 해당 항목의 설명을 가져와 title 속성에 추가
                if (itemDescriptions[item]) {
                    itemCell.setAttribute('title', itemDescriptions[item]);  // 호버 시 설명 표시
                }
    
                subcategoryRow.appendChild(itemCell);
    
                workerNames.forEach(workerName => {
                    const workerData = checklistData.find(worker => worker.name === workerName);
                    const taskValue = workerData ? workerData[item] : '';  // 값이 없을 경우 빈 값 처리
                    const td = document.createElement('td');
                    td.textContent = taskValue !== undefined ? taskValue : '';
    
                    // 퍼센트 값이 있는 경우 색상 적용
                    if (typeof taskValue === 'number') {
                        if (taskValue === 100) {
                            td.style.color = 'blue';
                        } else if (taskValue === 0) {
                            td.style.color = 'red';
                        } else {
                            td.style.color = 'black';
                        }
                    }
    
                    subcategoryRow.appendChild(td);
                });
    
                checklistTableBody.appendChild(subcategoryRow);
            });
    
            // 중분류 클릭 시 소분류 행을 토글하는 이벤트 추가
            categoryRow.addEventListener('click', () => {
                let nextRow = categoryRow.nextElementSibling;
                while (nextRow && nextRow.classList.contains('subcategory-row')) {
                    nextRow.style.display = nextRow.style.display === 'none' ? 'table-row' : 'none';
                    nextRow = nextRow.nextElementSibling;
                }
            });
        }
    }

    const setupData = await loadSetupData();
    const worklogData = await loadWorkLogs();
        logs = worklogData;
    renderSetupTable(setupData, worklogData);

    const checklistData = await loadChecklistData();
    renderChecklistTable(checklistData);

    // 검색 및 리셋 기능 추가
    document.getElementById('search-button').addEventListener('click', () => {
        const searchName = document.getElementById('search-name').value.trim();
        if (searchName) {
            const filteredSetupData = setupData.filter(worker => worker.name.includes(searchName));
            const filteredChecklistData = checklistData.filter(worker => worker.name.includes(searchName));
            const filteredWorklogData = worklogData.filter(log => log.task_man.includes(searchName));
            renderSetupTable(filteredSetupData, filteredWorklogData);
            renderChecklistTable(filteredChecklistData);
            renderCombinedTable(filteredSetupData, filteredChecklistData); // 합산된 표도 렌더링
        }
    });

    document.getElementById('reset-button').addEventListener('click', () => {
        document.getElementById('search-name').value = '';
        renderSetupTable(setupData, worklogData);
        renderChecklistTable(checklistData);
        renderCombinedTable(setupData, checklistData); // 합산된 표도 렌더링
    });
});



// 중분류별 소분류 항목의 평균값을 계산하는 함수
function calculateCategoryAverage(items, checklistData, workerName) {
    
    if (!Array.isArray(items) || items.length === 0) {
        return 0; // items가 유효하지 않거나 항목이 없을 경우 0 반환
    }

    const workerData = checklistData.find(worker => worker.name === workerName);
    if (!workerData) {
        return 0; // 해당 작업자의 데이터가 없으면 0 반환
    }

    let totalValue = 0;
    let validItems = 0; // 유효한 소분류 항목의 개수

    items.forEach(item => {
        const taskValue = workerData[item] !== undefined ? workerData[item] : 0;
        if (typeof taskValue === 'number') {
            totalValue += taskValue;
            validItems += 1; // 유효한 항목만 카운트
        }
    });

    if (validItems === 0) {
        return 0; // 유효한 소분류 항목이 없으면 0 반환
    }

    return totalValue / validItems; // 평균값 계산
}



function renderCombinedTable(setupData, checklistData) {
    const tableHead = document.getElementById('combined-table-head');
    const tableBody = document.getElementById('combined-table-body');
    const totalAverageContainer = document.getElementById('total-average-container');

    // 테이블 초기화
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    totalAverageContainer.innerHTML = '';  // 평균값 출력 영역 초기화

    // 작업 항목 설정
    const columns = [
        { name: 'INSTALLATION_PREPARATION', 기준작업수: 5 },
        { name: 'FAB_IN', 기준작업수: 5 },
        { name: 'DOCKING', 기준작업수: 10 },
        { name: 'CABLE_HOOK_UP', 기준작업수: 10 },
        { name: 'POWER_TURN_ON', 기준작업수: 10 },
        { name: 'UTILITY_TURN_ON', 기준작업수: 5 },
        { name: 'GAS_TURN_ON', 기준작업수: 5 },
        { name: 'TEACHING', 기준작업수: 15 },
        { name: 'PART_INSTALLATION', 기준작업수: 5 },
        { name: 'LEAK_CHECK', 기준작업수: 5 },
        { name: 'TTTM', 기준작업수: 15 },
        { name: 'CUSTOMER_CERTIFICATION', 기준작업수: 10 },
        { name: 'PROCESS_CONFIRM', 기준작업수: 3 }
    ];

    const categoryWeights = {
        'INSTALLATION_PREPARATION': 5,
        'FAB_IN': 5,
        'DOCKING': 10,
        'CABLE_HOOK_UP': 10,
        'POWER_TURN_ON': 10,
        'UTILITY_TURN_ON': 2.5,
        'GAS_TURN_ON': 2.5,
        'TEACHING': 30,
        'PART_INSTALLATION': 2.5,
        'LEAK_CHECK': 2.5,
        'TTTM': 10,
        'CUSTOMER_CERTIFICATION': 5,
        'PROCESS_CONFIRM': 5
    };

    const categories = {
        'INSTALLATION_PREPARATION': [
            'INST_IMPORT_ORDER', 
            'INST_PACKING_LIST', 
            'INST_OHT_LINE_CHECK', 
            'INST_SPACING_CHECK', 
            'INST_DRAW_SETUP', 
            'INST_DRAW_MARKING', 
            'INST_UTILITY_SPEC'
        ],
        'FAB_IN': [
            'FAB_MODULE_UNPACK', 
            'FAB_MODULE_CLEAN', 
            'FAB_MODULE_MOVE'
        ],
        'DOCKING': [
            'DOCK_TOOL_SIZE', 
            'DOCK_LASER_JIG', 
            'DOCK_JACK_USE', 
            'DOCK_HEIGHT_CHECK', 
            'DOCK_MODULE_CONNECT', 
            'DOCK_REALIGN', 
            'DOCK_LEVEL_POS', 
            'DOCK_LEVEL_SPEC', 
            'DOCK_HOOK_UP'
        ],
        'CABLE_HOOK_UP': [
            'CABLE_SORTING', 
            'CABLE_GRATING', 
            'CABLE_LADDER_RULES', 
            'CABLE_CONNECTION', 
            'CABLE_TRAY_ARRANGE', 
            'CABLE_REAR_MONITOR', 
            'CABLE_EFEM_PM_SIGNAL', 
            'CABLE_BUBBLER_PM_CONNECT', 
            'CABLE_FORMIC_PM_CONNECT'
        ],
        'POWER_TURN_ON': [
            'POWER_GPS_UPS_SPS', 
            'POWER_TURN_SEQ', 
            'POWER_ALARM_TROUBLE', 
            'POWER_CB_UNDERSTAND', 
            'POWER_SAFETY_MODULE', 
            'POWER_EMO_CHECK', 
            'POWER_SYCON_NUMBER', 
            'POWER_SYCON_SETUP', 
            'POWER_SYCON_TROUBLE'
        ],
        'UTILITY_TURN_ON': [
            'UTIL_TURN_SEQ', 
            'UTIL_VACUUM_TURN', 
            'UTIL_CDA_TURN', 
            'UTIL_PCW_TURN', 
            'UTIL_EXHAUST_TURN'
        ],
        'GAS_TURN_ON': [
            'GAS_TURN_SEQ', 
            'GAS_N2_CHECK', 
            'GAS_FORMIC_CHECK'
        ],
        'TEACHING': [
            'TEACH_ROBOT_CONTROL', 
            'TEACH_ROBOT_LEVELING', 
            'TEACH_ARM_LEVELING', 
            'TEACH_LOAD_PORT', 
            'TEACH_ALIGNER', 
            'TEACH_LOADLOCK', 
            'TEACH_DATA_SAVE', 
            'TEACH_MICRO_ADJUST', 
            'TEACH_MARGIN_CHECK', 
            'TEACH_SEMI_TRANSFER'
        ],
        'PART_INSTALLATION': [
            'PART_EXHAUST_PORT', 
            'PART_END_EFFECTOR', 
            'PART_END_EFFECTOR_LEVEL', 
            'PART_APC_SETUP', 
            'PART_PROCESS_KIT', 
            'PART_PIO_SENSOR', 
            'PART_CCTV_SETUP'
        ],
        'LEAK_CHECK': [
            'LEAK_PM', 
            'LEAK_GAS_LINE', 
            'LEAK_LL', 
            'LEAK_BUBBLER', 
            'LEAK_SOLENOID', 
            'LEAK_FORMIC_ON', 
            'LEAK_FORMIC_GAS'
        ],
        'TTTM': [
            'TTTM_CHUCK_LEVEL', 
            'TTTM_CHUCK_SPEED', 
            'TTTM_TEMP_CALIBRATION', 
            'TTTM_TEMP_PROFILE', 
            'TTTM_SEASONING_TEST', 
            'TTTM_APC_AUTO_LEARN', 
            'TTTM_REGULATOR', 
            'TTTM_MFC_ZERO_CAL', 
            'TTTM_HW_SETUP', 
            'TTTM_MFC_HUNTING', 
            'TTTM_GAS_LEAK_CHECK', 
            'TTTM_DNET_CAL', 
            'TTTM_SHEET_WRITE'
        ],
        'CUSTOMER_CERTIFICATION': [
            'CUST_OHT_CERT', 
            'CUST_IMARK_LOC', 
            'CUST_LABELING', 
            'CUST_MID_CERT', 
            'CUST_ENV_QUAL', 
            'CUST_OHT_LAYOUT'
        ],
        'PROCESS_CONFIRM': [
            'PROC_AGING_TEST', 
            'PROC_AR_TEST', 
            'PROC_SCRATCH_TEST', 
            'PROC_PARTICLE_CHECK', 
            'PROC_EES_TOOL'
        ]
    };
    
    

    const workerNames = setupData.map(worker => worker.name);

    if (workerNames.length === 0) {
        console.error('No worker names found.');
        return;
    }

    // 테이블 헤더 생성
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = '작업 항목';
    headerRow.appendChild(document.createElement('th')).textContent = '기준 작업 수';

    workerNames.forEach(name => {
        const th = document.createElement('th');
        th.textContent = name;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // 평균값 행 추가 (맨 위로 올릴 예정)
    const averageRow = document.createElement('tr');
    averageRow.style.backgroundColor = '#e0e0e0'; // AVERAGE 행의 색을 회색으로 설정
    averageRow.style.fontWeight = 'bold';
    averageRow.classList.add('total-average-row');
    averageRow.appendChild(document.createElement('td')).textContent = 'AVERAGE';
    averageRow.appendChild(document.createElement('td')).textContent = ''; // 기준 작업 수는 Avg에 필요 없음

    const workerAverages = [];

    // 작업 항목별 데이터
    columns.forEach(col => {
        const row = document.createElement('tr');
        row.classList.add('category-row');
        row.appendChild(document.createElement('td')).textContent = col.name;  // 작업 항목 이름 추가
        row.appendChild(document.createElement('td')).textContent = col.기준작업수;  // 기준 작업 수 추가

        workerNames.forEach(workerName => {
            const workerData = setupData.find(worker => worker.name === workerName);
            const checklistWorkerData = checklistData.find(worker => worker.name === workerName);
    
            // Setup 비율 계산 (최대 80%)
            const setupCount = workerData ? (workerData[col.name] || 0) : 0;
            const setupPercentage = Math.min((setupCount / col.기준작업수) * 80, 80);
    
            // Checklist 비율 계산 (최대 20%)
            const checklistItems = categories[col.name];  // 중분류 항목에 해당하는 소분류 항목 리스트
            const checklistAverage = checklistWorkerData ? calculateCategoryAverage(checklistItems, checklistData, workerName) : 0;
            const checklistPercentage = (checklistAverage / 100) * 20;
    
            // 두 값을 합산 (최대 100%)
            const combinedPercentage = Math.min(setupPercentage + checklistPercentage, 100);
    
            // 셀에 최종 합산 값을 추가
            const td = document.createElement('td');
            td.textContent = `${combinedPercentage.toFixed(1)}%`;
    
            // 퍼센트에 따른 색상 적용
            if (combinedPercentage === 100) {
                td.style.color = 'blue';
            } else if (combinedPercentage === 0) {
                td.style.color = 'red';
            } else {
                td.style.color = 'black';
            }
    
            row.appendChild(td);
        });
    
        tableBody.appendChild(row);  // 테이블 본문에 행 추가
    });

    // 전체 평균 계산
    workerNames.forEach(workerName => {
        let totalWeightedAverage = 0;
        let totalWeight = 0;

        columns.forEach(col => {
            const workerData = setupData.find(worker => worker.name === workerName);
            const checklistWorkerData = checklistData.find(worker => worker.name === workerName);

            // Setup 비율 계산 (최대 80%)
            const setupCount = workerData ? (workerData[col.name] || 0) : 0;
            const setupPercentage = Math.min((setupCount / col.기준작업수) * 80, 80);

            // Checklist 비율 계산 (최대 20%)
            const checklistItems = categories[col.name];
            const checklistAverage = checklistWorkerData ? calculateCategoryAverage(checklistItems, checklistData, workerName) : 0;
            const checklistPercentage = (checklistAverage / 100) * 20;

            // 두 값의 합산 비율 (최대 100%)
            const combinedPercentage = Math.min(setupPercentage + checklistPercentage, 100);

            // 가중치 적용
            const weight = categoryWeights[col.name] || 0;
            totalWeightedAverage += combinedPercentage * (weight / 100);
            totalWeight += weight;
        });

        const weightedAverage = (totalWeightedAverage / totalWeight) * 100;
        workerAverages.push(weightedAverage);  // 각 작업자의 평균값을 배열에 추가
        const td = document.createElement('td');
        td.textContent = `${weightedAverage.toFixed(1)}%`;
        averageRow.appendChild(td);
    });

        // 평균값 행을 테이블 본문 상단에 추가
        tableBody.insertBefore(averageRow, tableBody.firstChild);

            // 작업자들의 평균을 구해 화면 상단에 표시
    const totalAverage = workerAverages.reduce((acc, curr) => acc + curr, 0) / workerAverages.length;
    totalAverageContainer.innerHTML = `Total Average: ${totalAverage.toFixed(1)}%`;

    

    
        
}

document.addEventListener('DOMContentLoaded', function () {
    const mainButton = document.getElementById('main-button');
    const equipmentButtons = document.getElementById('equipment-buttons');
    
    // "다른 설비로 넘어가기" 버튼을 클릭하면 항목 리스트가 자연스럽게 보이도록 설정
    mainButton.addEventListener('click', () => {
        if (equipmentButtons.classList.contains('open')) {
            equipmentButtons.classList.remove('open'); // 닫히기
        } else {
            equipmentButtons.classList.add('open'); // 열리기
        }
    });

    // 각 설비 버튼을 눌렀을 때 해당 페이지로 이동
    const equipmentBtnElements = document.querySelectorAll('.equipment-btn');
    equipmentBtnElements.forEach(button => {
        button.addEventListener('click', () => {
            const url = button.getAttribute('data-url');
            window.location.href = url;
        });
    });
});

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('clickable-cell')) {
        console.log('셀 클릭됨');

        const worker = e.target.getAttribute('data-worker');
        const task = e.target.getAttribute('data-task');
        const normalizedWorker = worker.replace(/\(main\)|\(support\)/gi, '').trim();

        console.log('👉 클릭된 작업자:', normalizedWorker);
        console.log('👉 클릭된 작업 항목:', task);

        const matchedLogs = logs.filter((log, index) => {
            if (!log.setup_item || !log.task_man) return false;

            const normalizedSetupItem = log.setup_item.replace(/\s+/g, "_").toUpperCase();
            const taskMans = log.task_man
                .split(/[\s,]+/)
                .map(w => w.replace(/\(main\)|\(support\)/gi, '').trim());

            const isTaskMatched = normalizedSetupItem === task;
            const isWorkerMatched = taskMans.includes(normalizedWorker);

            // 디버깅 로그 추가
            console.log(`🧪 [${index}]`);
            console.log(' - 원본 setup_item:', log.setup_item);
            console.log(' - 정규화 setup_item:', normalizedSetupItem);
            console.log(' - 원본 task_man:', log.task_man);
            console.log(' - 정규화 task_mans:', taskMans);
            console.log(' - isTaskMatched:', isTaskMatched);
            console.log(' - isWorkerMatched:', isWorkerMatched);

            return isTaskMatched && isWorkerMatched;
        });

        const logList = document.getElementById('log-list');
        logList.innerHTML = '';

        if (matchedLogs.length === 0) {
            logList.innerHTML = '<li>관련 로그가 없습니다.</li>';
        } else {
            matchedLogs.forEach((log, index) => {
                const item = document.createElement('li');
                const date = new Date(log.task_date).toISOString().split('T')[0];
                const taskName = log.task_name || '-';
                const taskMan = log.task_man || '-';
                const equipmentName = log.equipment_name || '-';
                const taskDuration = log.task_duration || '-';
                const taskDesc = (log.task_description || '설명 없음').replace(/\n/g, '<br>');

                item.innerHTML = `
                    <div class="log-summary">
                        <strong>📅 ${date}</strong> | 🧾 ${taskName} | 👷‍♂️ ${taskMan} | 🛠 ${equipmentName} | ⏱ ${taskDuration}
                        <button class="toggle-desc-btn" data-index="${index}">자세히 보기</button>
                    </div>
                    <div class="log-desc hidden" id="desc-${index}">
                        ${taskDesc}
                    </div>
                `;
                logList.appendChild(item);
            });
        }

        document.getElementById('log-modal').classList.remove('hidden');
    }

    if (e.target.classList.contains('toggle-desc-btn')) {
        const index = e.target.getAttribute('data-index');
        const descBox = document.getElementById(`desc-${index}`);
        if (descBox.classList.contains('hidden')) {
            descBox.classList.remove('hidden');
            e.target.textContent = '접기';
        } else {
            descBox.classList.add('hidden');
            e.target.textContent = '자세히 보기';
        }
    }
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('log-modal').classList.add('hidden');
});
