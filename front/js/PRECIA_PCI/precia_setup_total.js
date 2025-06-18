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
        



    // PRECIA SETUP 데이터를 불러오는 함수
    async function loadSetupData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/precia-setup/all', {
                headers: {
                    'x-access-token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('PRECIA SETUP 데이터를 불러오는 중 오류 발생:', error);
            return [];
        }
    }

    // 체크리스트 데이터를 불러오는 함수
    async function loadChecklistData() {
        try {
            const response = await axios.get('http://3.37.73.151:3001/precia-setup/data', {
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

// PRECIA SETUP 테이블 렌더링 함수
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
        const workerLogs = worklogData.filter(log => log.task_man.includes(workerName) && log.equipment_type.toLowerCase().includes('ecolite'));
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
'INST_OHT_CHECK': '고객사에서 그린 기준선과 OHT라인이 일치하는지 확인하고 있는가?',
'INST_SPACING_CHECK': '설비 간 유격 거리가 충분한지 확인하고 있는가?',
'INST_DRAW_SETUP': 'Drawing Template을 기준선에 맞춰 배치하고 있는가?',
'INST_DRAW_MARKING': 'Drawing Template를 펼쳐 타공, H빔 및 Adjust를 마킹하고 있는가?',
'INST_UTILITY_SPEC': '타공별 Utility Spec을 숙지하고 있는가?',
'FAB_IMPORT_ORDER': '설비 반입 순서를 숙지하고 있는가?',
'FAB_WARN_ISSUE': '반입 업체에게 주의 사항을 설명할 수 있는가?',
'FAB_INSPECT': '설비 반입 시 확인해야 할 부분을 숙지하고 있는가?',
'FAB_FORBIDDEN': '설비 반입 금지 물품에 대해 알고 있는가?',
'FAB_GRATING': 'Grating 개구부 마감 처리 확인을 하고 있는가?',
'FAB_PACKING_LIST': 'Packing List를 확인하여 반입 Part를 확인할 수 있는가?',
'DOCK_TOOL_SIZE': '장비별 Tool size를 숙지하고 있는가?',
'DOCK_LASER_JIG': 'Laser Jig를 이용하여 OHT Line과 설비를 정렬하고 있는가?',
'DOCK_CASTER': 'Lift를 활용하여 EFEM의 Caster를 제거하고 있는가?',
'DOCK_HEIGHT': '각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking하고 있는가?',
'DOCK_MODULE': 'Module 간 Docking을 할 수 있는가?',
'DOCK_REALIGN': 'Docking 작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬하고 있는가?',
'DOCK_LEVEL_POS': '각 Module의 Leveler 정위치를 숙지하고 있는가?',
'DOCK_LEVEL_SPEC': '각 Module의 Leveling Spec을 알고 Adjust를 이용하여 Leveling을 하고 있는가?',
'DOCK_ACCESSORY': 'Accessory를 정위치에 장착하고 있는가?',
'DOCK_HOOK_UP': '내부 Hook Up을 알고 있는가?',
'CABLE_TRAY_CHECK': '설비에서 Rack까지 Tray 확인 및 작업 가능 여부를 판단할 수 있는가?',
'CABLE_SORTING': 'Cable을 각 Module별로 분류할 수 있는가?',
'CABLE_GRATING': 'Grating Open 시 주의 사항을 숙지하고 있는가?',
'CABLE_LADDER_RULES': '사다리 작업 시 환경 안전 수칙을 숙지하고 있는가?',
'CABLE_INSTALL': '설비에서 Rack까지 포설을 알고 있는가?',
'CABLE_CONNECTION': 'Cable을 설비에 정확히 연결하고 있는가?',
'CABLE_TRAY_ARRANGE': 'Cable을 Tray에 규격에 맞게 정리하고 있는가?',
'CABLE_CUTTING': '설비와 Rack 간의 거리를 고려해 Cable을 재단할 수 있는가?',
'CABLE_RACK_CONNECT': 'Cable을 Rack에 정확히 연결하고 있는가?',
'CABLE_PUMP_TRAY': 'Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?',
'CABLE_PUMP_ARRANGE': 'Pump 단에서 Cable 포설 및 정리를 하고 있는가?',
'CABLE_MODULE_PUMP': 'Cable을 구분하여 Module별로 Pump에 정확히 연결하고 있는가?',
'POWER_GPS_UPS_SPS': 'GPS, UPS, SPS의 역할과 원리를 숙지하고 있는가?',
'POWER_TURN_SEQ': 'Power turn on 순서를 숙지하고 있는가?',
'POWER_CB_UNDERSTAND': 'Rack의 ELCB, MCB 종류와 기능을 숙지하고 있는가?',
'POWER_SAFETY_MODULE': 'Safety Module의 위치와 기능을 숙지하고 있는가?',
'POWER_EMO_CHECK': 'EMO 동작을 확인할 수 있는가?',
'POWER_MODULE_MCB': 'Module별 MCB 위치를 알고 Turn on을 할 수 있는가?',
'POWER_SYCON_UNDERST': 'Sycon number별 의미하는 Part를 숙지하고 있는가?',
'POWER_SYCON_TROUBLE': 'Sycon 실행 시 통신되지 않는 Part에 대해 Trouble Shooting을 할 수 있는가?',
'POWER_NAVIGATOR': 'LS-Navigator 실행 및 설정에 대해 알고 있는가?',
'POWER_SERVO_CHECK': 'Chuck Motor Servo On Check 및 실행을 할 수 있는가?',
'POWER_ALARM_TROUBLE': 'Power turn on 후 발생하는 Alarm에 대해 Trouble Shooting을 할 수 있는가?',
'POWER_CHECKLIST': '구동 Checklist를 작성할 수 있는가?',
'POWER_VISION_CONNECT': 'Vision CTR 접속 및 Vision Program 실행에 대해 알고 있는가?',
'POWER_IP_CHANGE': 'IP 주소 변경 방법에 대해 알고 있는가?',
'UTIL_CDA_TURN': 'CDA Turn On을 할 수 있는가?',
'UTIL_PRE_CHECK': 'Utility Turn on 전 확인 사항을 알고 있는가?',
'UTIL_SETUP_MOD': 'SetUp.ini 파일을 수정하는 방법에 대해 알고 있는가?',
'UTIL_TURN_SEQ': 'Utility Turn on의 순서를 숙지하고 있는가?',
'UTIL_VACUUM_TURN': 'Vacuum Turn on 및 Spec에 맞게 조정할 수 있는가?',
'UTIL_SOLENOID': 'Solenoid Valve 위치를 전부 숙지하고 있는가?',
'UTIL_RELIEF_VALVE': 'Relief Valve 위치를 전부 숙지하고 있는가?',
'UTIL_MANUAL_VALVE': 'Manual Valve 위치를 전부 숙지하고 있는가?',
'UTIL_PUMP_TURN': 'PUMP Turn On을 알고 있는가?',
'UTIL_SIGNAL_CHECK': 'Dillution Signal Check 방법을 알고 있는가?',
'UTIL_CHILLER_TURN': 'Chiller Turn On을 알고 있는가?',
'UTIL_CHILLER_CHECK': 'Chiller Turn On 이후 확인 사항을 알고 있는가?',
'UTIL_MANOMETER_ADJUST': 'Manometer의 Low, High Limit 값을 Spec에 맞게 조정할 수 있는가?',
'GAS_TURN_SEQ': 'Gas Turn on 전 확인 사항을 알고 있는가?',
'GAS_O2_LEAK': 'O2 Line Leak Check 하는 방법을 알고 있는가?',
'GAS_N2_LEAK': 'N2 Line Leak Check 하는 방법을 알고 있는가?',
'GAS_AR_TURN': 'Ar Turn on 하는 방법을 알고 있는가?',
'GAS_CF4_TURN': 'CF4 Turn on 하는 방법을 알고 있는가?',
'GAS_SF6_TURN': 'SF6 Turn on 이후 확인 사항을 알고 있는가?',
'GAS_TURN_WARN': 'Gas Turn on 시 주의 사항을 알고 있는가?',
'GAS_DILLUTION_TEST': 'PM Dillution Test 하는 방법을 알고 있는가?',
'GAS_FLOW_CHECK': 'Gas Turn on 후 가스 유입 여부를 확인할 수 있는가?',
'TEACH_ROBOT_CONTROL': 'EFEM Robot Pendant를 조작할 수 있는가?',
'TEACH_ROBOT_XYZ': 'EFEM X, Y, Z, S1, S2 값을 알고 있는가? (SANKYO)',
'TEACH_ROBOT_PARAM': 'EFEM Robot Parameter를 수정할 수 있는가? (SANKYO)',
'TEACH_DATA_SAVE': 'EFEM Teaching Data를 저장할 수 있는가? (SANKYO)',
'TEACH_AWC_CAL': 'EFEM AWC Cal을 진행할 수 있는가? (SANKYO)',
'TEACH_TM_CONTROL': 'TM Robot Pendant를 조작할 수 있는가? (PERSIMMON)',
'TEACH_TM_LEVELING': 'TM Robot Leveling을 할 수 있는가? (PERSIMMON)',
'TEACH_TM_VALUES': 'TM Robot A, B arm Ra, Rb, Z, T 값을 알고 있는가? (PERSIMMON)',
'TEACH_TM_PM': 'TM Robot PM Teaching을 할 수 있는가? (PERSIMMON)',
'TEACH_TM_AWC': 'TM Robot PM Teaching 후 AWC Cal을 할 수 있는가? (PERSIMMON)',
'TEACH_TM_LL': 'TM Robot LL Teaching을 할 수 있는가? (PERSIMMON)',
'TEACH_TM_LL_AWC': 'TM Robot LL Teaching 후 AWC Cal을 할 수 있는가? (PERSIMMON)',
'TEACH_TM_DATA_SAVE': 'TM Robot Teaching Data를 저장할 수 있는가? (PERSIMMON)',
'TEACH_TM_MACRO': 'TM Robot PM Macro Test로 AWC를 검증할 수 있는가?',
'TEACH_TM_AXIS': 'TM Robot Axis를 정렬할 수 있는가?',
'TEACH_SEMI_TRANSFER': 'Semi Auto Transfer를 알고 있는가?',
'TEACH_AGING': 'Aging Test를 알고 있는가?',
'TEACH_PIN': 'Pin Teaching을 할 수 있는가?',
'TEACH_CHUCK': 'Chuck Teaching을 할 수 있는가?',
'TEACH_GAP': 'Gap Teaching을 할 수 있는가?',
'TEACH_SENSOR': 'Gap Sensor를 Adjust할 수 있는가?',
'TEACH_CAL': '2 Point Calibration을 할 수 있는가?',
'TEACH_CENTERING': 'Wafer Centering을 할 수 있는가?',
'PART_PROCESS_KIT': '상부 및 하부 Process Kit 장착 방법을 알고 있는가?',
'PART_PIN_HEIGHT': 'Pin 장착 및 Pin 높이 조절에 대해 알고 있는가?',
'PART_PIO_SENSOR': 'PIO Sensor 장착 방법을 알고 있는가?',
'PART_EARTHQUAKE': '지진 방지 BKT의 정위치 및 설비 쪽 체결을 할 수 있는가?',
'PART_EFEM_PICK': 'EFEM Robot Pick 장착 방법을 알고 있는가?',
'PART_EFEM_PICK_LEVEL': 'EFEM Robot Pick Leveling 방법을 알고 있는가?',
'PART_EFEM_PICK_ADJUST': 'EFEM Robot Pick 간격을 Adjust할 수 있는가?',
'PART_TM_PICK': 'TM Robot Pick 장착 방법을 알고 있는가?',
'PART_TM_PICK_LEVEL': 'TM Robot Pick Leveling 방법을 알고 있는가?',
'PART_TM_PICK_ADJUST': 'TM Robot Pick 간격을 Adjust할 수 있는가? (상하, 좌우)',
'LEAK_CHAMBER': 'Chamber Manual Leak Check 방법을 알고 있는가?',
'LEAK_LINE': 'Line Manual Leak Check 방법을 알고 있는가?',
'LEAK_HISTORY': 'Manual Leak Check History를 확인할 수 있는가?',
'TTTM_MANOMETER_DNET': 'Manometer D-NET Calibration을 할 수 있는가?',
'TTTM_PIRANI_DNET': 'TM, LL Pirani Gauge D-NET Calibration을 할 수 있는가?',
'TTTM_VALVE_TIME': 'Door Valve, Slot Valve Open, Close 시간을 조절할 수 있는가?',
'TTTM_APC_AUTOTUNE': 'APC Autolearn을 할 수 있는가?',
'TTTM_PIN_HEIGHT': 'Pin Height를 Adjust할 수 있는가?',
'TTTM_GAS_PRESSURE': 'Gas Supply Pressure를 확인할 수 있는가?',
'TTTM_MFC_CAL': 'MFC Zero Calibration을 할 수 있는가?',
'TTTM_LP_FLOW': 'LP 유량을 조절할 수 있는가?',
'TTTM_REPORT': 'Product Report를 작성할 수 있는가?',
'TTTM_SHEET': 'TTTM Sheet를 작성할 수 있는가?',
'CUST_LP_CERT': 'LP 인증을 할 수 있는가?',
'CUST_RUN_CERT': '중간 가동 인증 준비 사항을 알고 있는가?',
'CUST_LABEL': 'Label을 붙여야 할 곳이 어디인지 알고 있는가?',
'CUST_I_MARK': 'I-Marking 방법에 대해 알고 있는가?',
'CUST_I_MARK_LOC': 'I-Marking을 해야 하는 곳이 어디인지 알고 있는가?',
'CUST_ENV_QUAL': '환경 Qual Test를 할 수 있는가?',
'CUST_OHT_CERT': 'OHT 자동 반송 인증 Test를 할 수 있는가?',
'CUST_RUN_CERTIFY': '중간 가동 인증을 할 수 있는가?',
'PROC_PARTICLE': 'Particle Test를 할 수 있는가?',
'PROC_EA_TEST': 'E/A Test를 할 수 있는가?'

        };
        
        
        checklistTableHead.innerHTML = '';
        checklistTableBody.innerHTML = '';
    
        const categories = {
'INSTALLATION_PREPARATION': [
    'INST_OHT_CHECK', 
    'INST_SPACING_CHECK', 
    'INST_DRAW_SETUP', 
    'INST_DRAW_MARKING', 
    'INST_UTILITY_SPEC'
],
'FAB_IN': [
    'FAB_IMPORT_ORDER', 
    'FAB_WARN_ISSUE', 
    'FAB_INSPECT', 
    'FAB_FORBIDDEN', 
    'FAB_GRATING', 
    'FAB_PACKING_LIST'
],
'DOCKING': [
    'DOCK_TOOL_SIZE', 
    'DOCK_LASER_JIG', 
    'DOCK_CASTER', 
    'DOCK_HEIGHT', 
    'DOCK_MODULE', 
    'DOCK_REALIGN', 
    'DOCK_LEVEL_POS', 
    'DOCK_LEVEL_SPEC', 
    'DOCK_ACCESSORY', 
    'DOCK_HOOK_UP'
],
'CABLE_HOOK_UP': [
    'CABLE_TRAY_CHECK', 
    'CABLE_SORTING', 
    'CABLE_GRATING', 
    'CABLE_LADDER_RULES', 
    'CABLE_INSTALL', 
    'CABLE_CONNECTION', 
    'CABLE_TRAY_ARRANGE', 
    'CABLE_CUTTING', 
    'CABLE_RACK_CONNECT', 
    'CABLE_PUMP_TRAY', 
    'CABLE_PUMP_ARRANGE', 
    'CABLE_MODULE_PUMP'
],
'POWER_TURN_ON': [
    'POWER_GPS_UPS_SPS', 
    'POWER_TURN_SEQ', 
    'POWER_CB_UNDERSTAND', 
    'POWER_SAFETY_MODULE', 
    'POWER_EMO_CHECK', 
    'POWER_MODULE_MCB', 
    'POWER_SYCON_UNDERST', 
    'POWER_SYCON_TROUBLE', 
    'POWER_NAVIGATOR', 
    'POWER_SERVO_CHECK', 
    'POWER_ALARM_TROUBLE', 
    'POWER_CHECKLIST', 
    'POWER_VISION_CONNECT', 
    'POWER_IP_CHANGE'
],
'UTILITY_TURN_ON': [
    'UTIL_CDA_TURN', 
    'UTIL_PRE_CHECK', 
    'UTIL_SETUP_MOD', 
    'UTIL_TURN_SEQ', 
    'UTIL_VACUUM_TURN', 
    'UTIL_SOLENOID', 
    'UTIL_RELIEF_VALVE', 
    'UTIL_MANUAL_VALVE', 
    'UTIL_PUMP_TURN', 
    'UTIL_SIGNAL_CHECK', 
    'UTIL_CHILLER_TURN', 
    'UTIL_CHILLER_CHECK', 
    'UTIL_MANOMETER_ADJUST'
],
'GAS_TURN_ON': [
    'GAS_TURN_SEQ', 
    'GAS_O2_LEAK', 
    'GAS_N2_LEAK', 
    'GAS_AR_TURN', 
    'GAS_CF4_TURN', 
    'GAS_SF6_TURN', 
    'GAS_TURN_WARN', 
    'GAS_DILLUTION_TEST', 
    'GAS_FLOW_CHECK'
],
'TEACHING': [
    'TEACH_ROBOT_CONTROL', 
    'TEACH_ROBOT_XYZ', 
    'TEACH_ROBOT_PARAM', 
    'TEACH_DATA_SAVE', 
    'TEACH_AWC_CAL', 
    'TEACH_TM_CONTROL', 
    'TEACH_TM_LEVELING', 
    'TEACH_TM_VALUES', 
    'TEACH_TM_PM', 
    'TEACH_TM_AWC', 
    'TEACH_TM_LL', 
    'TEACH_TM_LL_AWC', 
    'TEACH_TM_DATA_SAVE', 
    'TEACH_TM_MACRO', 
    'TEACH_TM_AXIS', 
    'TEACH_SEMI_TRANSFER', 
    'TEACH_AGING', 
    'TEACH_PIN', 
    'TEACH_CHUCK', 
    'TEACH_GAP', 
    'TEACH_SENSOR', 
    'TEACH_CAL', 
    'TEACH_CENTERING'
],
'PART_INSTALLATION': [
    'PART_PROCESS_KIT', 
    'PART_PIN_HEIGHT', 
    'PART_PIO_SENSOR', 
    'PART_EARTHQUAKE', 
    'PART_EFEM_PICK', 
    'PART_EFEM_PICK_LEVEL', 
    'PART_EFEM_PICK_ADJUST', 
    'PART_TM_PICK', 
    'PART_TM_PICK_LEVEL', 
    'PART_TM_PICK_ADJUST'
],
'LEAK_CHECK': [
    'LEAK_CHAMBER', 
    'LEAK_LINE', 
    'LEAK_HISTORY'
],
'TTTM': [
    'TTTM_MANOMETER_DNET', 
    'TTTM_PIRANI_DNET', 
    'TTTM_VALVE_TIME', 
    'TTTM_APC_AUTOTUNE', 
    'TTTM_PIN_HEIGHT', 
    'TTTM_GAS_PRESSURE', 
    'TTTM_MFC_CAL', 
    'TTTM_LP_FLOW', 
    'TTTM_REPORT', 
    'TTTM_SHEET'
],
'CUSTOMER_CERTIFICATION': [
    'CUST_LP_CERT', 
    'CUST_RUN_CERT', 
    'CUST_LABEL', 
    'CUST_I_MARK', 
    'CUST_I_MARK_LOC', 
    'CUST_ENV_QUAL', 
    'CUST_OHT_CERT', 
    'CUST_RUN_CERTIFY'
],
'PROCESS_CONFIRM': [
    'PROC_PARTICLE', 
    'PROC_EA_TEST'
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
    'INST_OHT_CHECK', 
    'INST_SPACING_CHECK', 
    'INST_DRAW_SETUP', 
    'INST_DRAW_MARKING', 
    'INST_UTILITY_SPEC'
],
'FAB_IN': [
    'FAB_IMPORT_ORDER', 
    'FAB_WARN_ISSUE', 
    'FAB_INSPECT', 
    'FAB_FORBIDDEN', 
    'FAB_GRATING', 
    'FAB_PACKING_LIST'
],
'DOCKING': [
    'DOCK_TOOL_SIZE', 
    'DOCK_LASER_JIG', 
    'DOCK_CASTER', 
    'DOCK_HEIGHT', 
    'DOCK_MODULE', 
    'DOCK_REALIGN', 
    'DOCK_LEVEL_POS', 
    'DOCK_LEVEL_SPEC', 
    'DOCK_ACCESSORY', 
    'DOCK_HOOK_UP'
],
'CABLE_HOOK_UP': [
    'CABLE_TRAY_CHECK', 
    'CABLE_SORTING', 
    'CABLE_GRATING', 
    'CABLE_LADDER_RULES', 
    'CABLE_INSTALL', 
    'CABLE_CONNECTION', 
    'CABLE_TRAY_ARRANGE', 
    'CABLE_CUTTING', 
    'CABLE_RACK_CONNECT', 
    'CABLE_PUMP_TRAY', 
    'CABLE_PUMP_ARRANGE', 
    'CABLE_MODULE_PUMP'
],
'POWER_TURN_ON': [
    'POWER_GPS_UPS_SPS', 
    'POWER_TURN_SEQ', 
    'POWER_CB_UNDERSTAND', 
    'POWER_SAFETY_MODULE', 
    'POWER_EMO_CHECK', 
    'POWER_MODULE_MCB', 
    'POWER_SYCON_UNDERST', 
    'POWER_SYCON_TROUBLE', 
    'POWER_NAVIGATOR', 
    'POWER_SERVO_CHECK', 
    'POWER_ALARM_TROUBLE', 
    'POWER_CHECKLIST', 
    'POWER_VISION_CONNECT', 
    'POWER_IP_CHANGE'
],
'UTILITY_TURN_ON': [
    'UTIL_CDA_TURN', 
    'UTIL_PRE_CHECK', 
    'UTIL_SETUP_MOD', 
    'UTIL_TURN_SEQ', 
    'UTIL_VACUUM_TURN', 
    'UTIL_SOLENOID', 
    'UTIL_RELIEF_VALVE', 
    'UTIL_MANUAL_VALVE', 
    'UTIL_PUMP_TURN', 
    'UTIL_SIGNAL_CHECK', 
    'UTIL_CHILLER_TURN', 
    'UTIL_CHILLER_CHECK', 
    'UTIL_MANOMETER_ADJUST'
],
'GAS_TURN_ON': [
    'GAS_TURN_SEQ', 
    'GAS_O2_LEAK', 
    'GAS_N2_LEAK', 
    'GAS_AR_TURN', 
    'GAS_CF4_TURN', 
    'GAS_SF6_TURN', 
    'GAS_TURN_WARN', 
    'GAS_DILLUTION_TEST', 
    'GAS_FLOW_CHECK'
],
'TEACHING': [
    'TEACH_ROBOT_CONTROL', 
    'TEACH_ROBOT_XYZ', 
    'TEACH_ROBOT_PARAM', 
    'TEACH_DATA_SAVE', 
    'TEACH_AWC_CAL', 
    'TEACH_TM_CONTROL', 
    'TEACH_TM_LEVELING', 
    'TEACH_TM_VALUES', 
    'TEACH_TM_PM', 
    'TEACH_TM_AWC', 
    'TEACH_TM_LL', 
    'TEACH_TM_LL_AWC', 
    'TEACH_TM_DATA_SAVE', 
    'TEACH_TM_MACRO', 
    'TEACH_TM_AXIS', 
    'TEACH_SEMI_TRANSFER', 
    'TEACH_AGING', 
    'TEACH_PIN', 
    'TEACH_CHUCK', 
    'TEACH_GAP', 
    'TEACH_SENSOR', 
    'TEACH_CAL', 
    'TEACH_CENTERING'
],
'PART_INSTALLATION': [
    'PART_PROCESS_KIT', 
    'PART_PIN_HEIGHT', 
    'PART_PIO_SENSOR', 
    'PART_EARTHQUAKE', 
    'PART_EFEM_PICK', 
    'PART_EFEM_PICK_LEVEL', 
    'PART_EFEM_PICK_ADJUST', 
    'PART_TM_PICK', 
    'PART_TM_PICK_LEVEL', 
    'PART_TM_PICK_ADJUST'
],
'LEAK_CHECK': [
    'LEAK_CHAMBER', 
    'LEAK_LINE', 
    'LEAK_HISTORY'
],
'TTTM': [
    'TTTM_MANOMETER_DNET', 
    'TTTM_PIRANI_DNET', 
    'TTTM_VALVE_TIME', 
    'TTTM_APC_AUTOTUNE', 
    'TTTM_PIN_HEIGHT', 
    'TTTM_GAS_PRESSURE', 
    'TTTM_MFC_CAL', 
    'TTTM_LP_FLOW', 
    'TTTM_REPORT', 
    'TTTM_SHEET'
],
'CUSTOMER_CERTIFICATION': [
    'CUST_LP_CERT', 
    'CUST_RUN_CERT', 
    'CUST_LABEL', 
    'CUST_I_MARK', 
    'CUST_I_MARK_LOC', 
    'CUST_ENV_QUAL', 
    'CUST_OHT_CERT', 
    'CUST_RUN_CERTIFY'
],
'PROCESS_CONFIRM': [
    'PROC_PARTICLE', 
    'PROC_EA_TEST'
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
